"""Auth, 2FA and profile-merge regression tests.

SMS is stubbed throughout, so these send nothing and cost nothing.

These run against the real S3 bucket using the dev user (`dev:local-tester`) and
restore that profile afterwards, so they need working AWS credentials and
FINCORE_S3_BUCKET. Run with:

    cd my-agent && source venv/bin/activate && pytest tests/ -v
"""
import os
import sys
import time

import pytest
from fastapi.testclient import TestClient
from jose import jwt as jose_jwt

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import auth  # noqa: E402
import server  # noqa: E402

USER = "dev:local-tester"
VERIFIED_PHONE = "+447362569333"


@pytest.fixture
def sms(monkeypatch):
    """Capture outbound SMS instead of sending it. Returns the sent list."""
    sent = []
    monkeypatch.setattr(server, "send_sms", lambda phone, msg: (sent.append((phone, msg)), "stub")[1])
    return sent


@pytest.fixture
def client():
    return TestClient(server.app)


@pytest.fixture(autouse=True)
def restore_profile():
    """Leave the dev profile exactly as we found it, whatever the test does."""
    original = dict(server.get_profile(USER, server.BUCKET) or {})
    yield
    server.save_profile(USER, original, server.BUCKET)


def profile():
    return server.get_profile(USER, server.BUCKET) or {}


def set_2fa(enabled, phone=VERIFIED_PHONE):
    p = profile()
    p["2fa_enabled"] = enabled
    p["2fa_phone"] = phone
    p.pop("2fa_code_hash", None)
    p.pop("2fa_phone_pending", None)
    server.save_profile(USER, p, server.BUCKET)


def session_for(client, sms):
    """A real session token, bypassing 2FA."""
    set_2fa(False)
    return client.post("/auth/dev", json={}).json()["session_token"]


# ---------------------------------------------------------------- sessions

def test_login_without_2fa_issues_session(client, sms):
    set_2fa(False)
    body = client.post("/auth/dev", json={}).json()
    assert body["session_token"]
    assert body["requires_2fa"] is False
    assert client.get("/profile", headers={"Authorization": f"Bearer {body['session_token']}"}).status_code == 200


def test_legacy_token_without_typ_claim_is_rejected(client):
    """Tokens minted before the typ claim must not be accepted."""
    now = int(time.time())
    legacy = jose_jwt.encode(
        {"sub": USER, "provider": "dev", "iat": now, "exp": now + 3600},
        auth.SESSION_SECRET,
        algorithm="HS256",
    )
    assert client.get("/profile", headers={"Authorization": f"Bearer {legacy}"}).status_code == 401


def test_challenge_token_cannot_be_used_as_a_session(client):
    """The typ claim is the only thing separating these; without it this is a full session."""
    forged = auth.create_challenge_token(USER, "dev")
    headers = {"Authorization": f"Bearer {forged}"}
    assert client.get("/profile", headers=headers).status_code == 401
    assert client.patch("/profile", headers=headers, json={"name": "x"}).status_code == 401


# ------------------------------------------------------------ profile merge

def test_survey_retake_preserves_contact_details(client, sms):
    """/score must merge -- a full overwrite wipes phone, dob, email and photo."""
    token = session_for(client, sms)
    headers = {"Authorization": f"Bearer {token}"}
    client.patch("/profile", headers=headers, json={
        "name": "Test User", "email": "t@example.com",
        "phone": "+44 7911 123456", "dob": "14/03/1991",
    })
    client.post("/score", headers=headers, json={"name": "Test User", "answers": [
        {"itemId": 1, "facet": "anxiety", "domain": "neuroticism", "reverse": False, "rating": 3}
    ]})

    p = profile()
    assert p["phone"] == "+44 7911 123456"
    assert p["dob"] == "14/03/1991"
    assert p["email"] == "t@example.com"


# -------------------------------------------------------------------- 2FA

def test_login_with_2fa_challenges_instead_of_issuing_session(client, sms):
    set_2fa(True)
    body = client.post("/auth/dev", json={}).json()

    assert body["session_token"] is None
    assert body["requires_2fa"] is True
    assert body["challenge_token"]
    assert body["phone_hint"].endswith("9333")
    assert "7362" not in body["phone_hint"], "full number must not leak in the hint"
    assert len(sms) == 1


def test_otp_is_hashed_never_stored_in_plaintext(client, sms):
    set_2fa(True)
    client.post("/auth/dev", json={})

    code = sms[0][1].split()[0]
    assert code.isdigit() and len(code) == 6
    assert profile().get("2fa_code") is None
    assert profile()["2fa_code_hash"].startswith("$2b$")


def test_correct_code_returns_a_real_session(client, sms):
    set_2fa(True)
    body = client.post("/auth/dev", json={}).json()
    code = sms[0][1].split()[0]

    res = client.post("/auth/2fa/challenge", json={
        "challenge_token": body["challenge_token"], "code": code,
    })
    token = res.json()["session_token"]

    assert res.status_code == 200
    assert jose_jwt.decode(token, auth.SESSION_SECRET, algorithms=["HS256"])["typ"] == "session"
    assert client.get("/profile", headers={"Authorization": f"Bearer {token}"}).status_code == 200


def test_wrong_code_is_rejected(client, sms):
    set_2fa(True)
    body = client.post("/auth/dev", json={}).json()
    code = sms[0][1].split()[0]
    wrong = "000000" if code != "000000" else "111111"

    res = client.post("/auth/2fa/challenge", json={
        "challenge_token": body["challenge_token"], "code": wrong,
    })
    assert res.status_code == 400


def test_code_is_single_use(client, sms):
    set_2fa(True)
    body = client.post("/auth/dev", json={}).json()
    code = sms[0][1].split()[0]
    payload = {"challenge_token": body["challenge_token"], "code": code}

    assert client.post("/auth/2fa/challenge", json=payload).status_code == 200
    assert client.post("/auth/2fa/challenge", json=payload).status_code == 400


def test_failed_enrolment_does_not_repoint_a_working_2fa_phone(client, sms, monkeypatch):
    """Otherwise an abandoned re-enrolment locks the user out at next sign-in."""
    token = session_for(client, sms)
    set_2fa(True, VERIFIED_PHONE)

    def boom(phone, msg):
        raise RuntimeError("SMS provider down")

    monkeypatch.setattr(server, "send_sms", boom)
    res = client.post("/2fa/send-code", headers={"Authorization": f"Bearer {token}"},
                      json={"phone_number": "+447999999999"})

    assert res.status_code == 502
    assert profile()["2fa_phone"] == VERIFIED_PHONE, "working number must survive a failed attempt"
    assert profile()["2fa_phone_pending"] == "+447999999999"


def test_login_fails_closed_when_sms_is_down(client, sms, monkeypatch):
    """Never downgrade to no second factor just because the provider is unavailable."""
    set_2fa(True)

    def boom(phone, msg):
        raise RuntimeError("SMS provider down")

    monkeypatch.setattr(server, "send_sms", boom)
    res = client.post("/auth/dev", json={})

    assert res.status_code == 502
    assert res.json().get("session_token") is None


def test_enrolment_falls_back_to_the_signup_phone(client, sms):
    """Users should not have to retype a number they gave at signup."""
    token = session_for(client, sms)
    p = profile()
    p["phone"] = VERIFIED_PHONE
    p.pop("2fa_phone", None)
    server.save_profile(USER, p, server.BUCKET)

    res = client.post("/2fa/send-code", headers={"Authorization": f"Bearer {token}"}, json={})

    assert res.status_code == 200
    assert sms[-1][0] == VERIFIED_PHONE
