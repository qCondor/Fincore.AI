"""Provider identity token verification and session issuance.

Sign-in with Apple/Google/Microsoft only ever proves identity to the *client*
(via a provider-signed identity token). This module verifies that token
server-side against the provider's public keys and mints a short-lived,
server-signed session token that every authenticated route then requires via
`get_current_user`. `user_id` is never trusted from a client-supplied path or
body parameter anywhere downstream of this module.
"""
import os
import time

import httpx
from fastapi import Header, HTTPException
from jose import jwt as jose_jwt
from jose.exceptions import JOSEError

# Public client/tenant identifiers -- not secrets, must match expo-app/config.ts
APPLE_BUNDLE_ID = os.getenv("APPLE_BUNDLE_ID", "one.fincore.app")
GOOGLE_CLIENT_ID = os.getenv(
    "GOOGLE_CLIENT_ID",
    "336431541348-hbifi1ohb2hsomhqqe2i289nm6oehdpg.apps.googleusercontent.com",
)
MICROSOFT_CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID", "d371e6ba-5463-4b47-a5fe-c2c87506f610")
MICROSOFT_TENANT_ID = os.getenv("MICROSOFT_TENANT_ID", "08802439-90c8-400a-901b-79fabbd75eb7")

APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys"
APPLE_ISSUER = "https://appleid.apple.com"
APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token"

MICROSOFT_JWKS_URL = f"https://login.microsoftonline.com/{MICROSOFT_TENANT_ID}/discovery/v2.0/keys"
MICROSOFT_ISSUER = f"https://login.microsoftonline.com/{MICROSOFT_TENANT_ID}/v2.0"

# Required: fail fast at import time, same as BUCKET in server.py -- a signing
# secret has no safe default, unlike FINCORE_ADMIN_KEY which gates one endpoint
# and can afford a lazy per-request check.
SESSION_SECRET = os.environ["FINCORE_SESSION_SECRET"]
SESSION_ALGORITHM = "HS256"
SESSION_TTL_SECONDS = 30 * 24 * 60 * 60  # 30 days

_JWKS_CACHE: dict[str, dict] = {}
_JWKS_CACHE_TTL = 3600
_JWKS_CACHE_FETCHED_AT: dict[str, float] = {}


def _fetch_jwks(url: str) -> dict:
    now = time.time()
    if url in _JWKS_CACHE and now - _JWKS_CACHE_FETCHED_AT.get(url, 0) < _JWKS_CACHE_TTL:
        return _JWKS_CACHE[url]
    resp = httpx.get(url, timeout=10)
    resp.raise_for_status()
    jwks = resp.json()
    _JWKS_CACHE[url] = jwks
    _JWKS_CACHE_FETCHED_AT[url] = now
    return jwks


def _verify_jwks_token(token: str, jwks_url: str, audience: str, issuer: str) -> dict:
    try:
        header = jose_jwt.get_unverified_header(token)
    except JOSEError as exc:
        raise HTTPException(status_code=401, detail=f"Malformed identity token: {exc}")

    jwks = _fetch_jwks(jwks_url)
    key = next((k for k in jwks.get("keys", []) if k.get("kid") == header.get("kid")), None)
    if key is None:
        # Keys rotate; retry once against a forced-fresh fetch before failing.
        _JWKS_CACHE_FETCHED_AT[jwks_url] = 0
        jwks = _fetch_jwks(jwks_url)
        key = next((k for k in jwks.get("keys", []) if k.get("kid") == header.get("kid")), None)
    if key is None:
        raise HTTPException(status_code=401, detail="Unknown identity token signing key")

    try:
        return jose_jwt.decode(token, key, algorithms=[key.get("alg", "RS256")], audience=audience, issuer=issuer)
    except JOSEError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid identity token: {exc}")


def verify_apple_identity_token(identity_token: str) -> str:
    """Verify an Apple `identityToken` JWT and return its stable subject id."""
    claims = _verify_jwks_token(identity_token, APPLE_JWKS_URL, audience=APPLE_BUNDLE_ID, issuer=APPLE_ISSUER)
    return claims["sub"]


def exchange_apple_authorization_code(authorization_code: str) -> str:
    """Fallback path: exchange an Apple `authorizationCode` for a fresh identity token.

    NOTE: on native Sign in with Apple, `identityToken` is present on *every*
    authorization (first and repeat) -- only `fullName`/`email` are
    first-authorization-only. This path should therefore rarely, if ever, be
    hit in practice. It's wired up because the client sends authorizationCode
    defensively, but it requires Apple Developer credentials (a Sign in with
    Apple key: Team ID, Key ID, private key) that are not present in this
    repo -- see .env.example. Without them, this fails with a clear 501
    rather than pretending to work.
    """
    team_id = os.getenv("APPLE_TEAM_ID")
    key_id = os.getenv("APPLE_KEY_ID")
    private_key = os.getenv("APPLE_PRIVATE_KEY")
    if not (team_id and key_id and private_key):
        raise HTTPException(
            status_code=501,
            detail=(
                "Apple authorizationCode exchange is not configured on this server "
                "(missing APPLE_TEAM_ID/APPLE_KEY_ID/APPLE_PRIVATE_KEY). identityToken "
                "should be present on every native Sign in with Apple call, so this path "
                "should rarely be needed -- configure these if it is."
            ),
        )

    now = int(time.time())
    client_secret = jose_jwt.encode(
        {
            "iss": team_id,
            "iat": now,
            "exp": now + 300,
            "aud": APPLE_ISSUER,
            "sub": APPLE_BUNDLE_ID,
        },
        private_key,
        algorithm="ES256",
        headers={"kid": key_id},
    )

    resp = httpx.post(
        APPLE_TOKEN_URL,
        data={
            "client_id": APPLE_BUNDLE_ID,
            "client_secret": client_secret,
            "code": authorization_code,
            "grant_type": "authorization_code",
        },
        timeout=10,
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Apple authorization code exchange failed")

    id_token = resp.json().get("id_token")
    if not id_token:
        raise HTTPException(status_code=401, detail="Apple did not return an identity token")
    return verify_apple_identity_token(id_token)


def verify_apple(identity_token: str | None, authorization_code: str | None) -> str:
    if identity_token:
        return verify_apple_identity_token(identity_token)
    if authorization_code:
        return exchange_apple_authorization_code(authorization_code)
    raise HTTPException(status_code=400, detail="Missing identity_token or authorization_code")


def verify_google_id_token(id_token: str) -> str:
    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token as google_id_token
    from google.auth.exceptions import GoogleAuthError

    try:
        claims = google_id_token.verify_oauth2_token(id_token, google_requests.Request(), audience=GOOGLE_CLIENT_ID)
    except (GoogleAuthError, ValueError) as exc:
        raise HTTPException(status_code=401, detail=f"Invalid identity token: {exc}")

    if claims.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
        raise HTTPException(status_code=401, detail="Invalid identity token issuer")
    return claims["sub"]


def verify_microsoft_id_token(id_token: str) -> str:
    claims = _verify_jwks_token(id_token, MICROSOFT_JWKS_URL, audience=MICROSOFT_CLIENT_ID, issuer=MICROSOFT_ISSUER)
    return claims["sub"]


def create_session_token(user_id: str, provider: str) -> str:
    now = int(time.time())
    payload = {"sub": user_id, "provider": provider, "iat": now, "exp": now + SESSION_TTL_SECONDS}
    return jose_jwt.encode(payload, SESSION_SECRET, algorithm=SESSION_ALGORITHM)


def verify_session_token(token: str) -> str:
    try:
        claims = jose_jwt.decode(token, SESSION_SECRET, algorithms=[SESSION_ALGORITHM])
    except JOSEError:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return claims["sub"]


def get_current_user(authorization: str | None = Header(None)) -> str:
    """FastAPI dependency: verifies the session Bearer token and returns user_id.

    Every route that used to trust a client-supplied user_id path/body
    parameter now takes this instead -- there is no longer any way for a
    request to name a user_id other than the one its own verified session
    token carries.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization[len("Bearer "):]
    return verify_session_token(token)
