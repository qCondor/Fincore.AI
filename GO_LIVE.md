# Before We Go Live

Blocking items between the current state and real users on TestFlight / the App Store.
Tick items off as they land.

Ordered by what blocks what. The AWS items have multi-day review times, so start them first.

---

## 0. Before the next tester build — deploy the backend

**The production server is running older code than this repository.** Verified by probing it:
`POST /auth/2fa/challenge` returns 404 while `/waitlist` returns 422, so that box predates the
auth and profile work.

This matters more than anything else in this document, because a TestFlight build points at
`http://35.178.139.5:8000` (set in `eas.json`, `production` profile) — not at anyone's laptop.
Ship a build against the current server and a tester will hit this:

1. They sign in, and enter name, date of birth, email and phone on the About You screen.
2. They answer the 60 survey questions.
3. The old `/score` endpoint **replaces the whole profile** instead of merging, so their phone,
   date of birth and email are wiped.
4. They open Personal Details and find their details gone.

The fix is already in the repo. It is simply not on the server.

Also missing from production until it is redeployed: profile merge on `POST /profile`, the `typ`
claim that separates session tokens from 2FA challenge tokens, and the SMS/2FA endpoints. The
app tolerates their absence (2FA is flag-gated off, and a response without `requires_2fa` is
treated as a normal sign-in), so the data loss above is the visible symptom.

- [ ] Deploy the current `my-agent/` to the production host
- [ ] Re-run the probe and confirm `POST /auth/2fa/challenge` no longer returns 404
- [ ] Confirm `POST /auth/dev` still returns **404** in production (it must stay disabled —
      it mints a session with no credentials)
- [ ] Only then cut the TestFlight build

### How deployment works (resolved 2026-09-21)

Run `./deploy.sh` from the repo root. It uploads `my-agent/`, installs dependencies, restarts
the service, health-checks it, and rolls back automatically if it does not come up.

The production host is **not** a git checkout:

| | |
|---|---|
| SSH | `ssh -i ~/Code/config-repo/fincore-key.pem ec2-user@35.178.139.5` |
| Instance | `i-0b4614d659474a56e`, t3.small, eu-west-2b |
| Code | `/opt/fincore/my-agent` — files copied in place |
| Secrets | `/opt/fincore/.env` — loaded by systemd as `EnvironmentFile`, **not** in the repo |
| Service | `fincore.service` — systemd, runs uvicorn as root on port 8000 |
| Python | system `/usr/bin/python3.11`, packages installed globally (no venv) |

**Three things that took production down on 2026-09-21**, all now handled by the script:

1. The local `.env` must never be uploaded. `server.py` loads a `.env` next to itself, so the dev
   one would set `ENVIRONMENT=development` in production and expose `/auth/dev` — a session for
   anyone, no credentials. The script excludes it and asserts `/auth/dev` returns 404 afterwards.
2. Dependencies must be installed on the server, not assumed from `requirements.txt`. The box had
   drifted months behind, so an import moving to module scope became a boot failure.
3. `systemctl is-active` saying `active` does not mean the API answers. The script curls the
   health endpoint and rolls back if it never returns 200.

Remaining improvements, not blocking:

- [ ] Run the service as a non-root user in a venv rather than root with global packages
- [ ] Prune old `/opt/fincore/my-agent.bak-*` directories occasionally
- [ ] Consider CI so deploys do not depend on one laptop holding the SSH key

---

## 1. Blockers — do not ship without these

### 1.1 API traffic is unencrypted HTTP

`API_BASE_URL` defaults to `http://35.178.139.5:8000`, and `app.json` carries an explicit
App Transport Security exception to permit it:

```json
"NSExceptionDomains": { "35.178.139.5": { "NSExceptionAllowsInsecureHTTPLoads": true } }
```

Everything the app sends crosses the network in clear text: session bearer tokens, name,
date of birth, phone, email, and SMS one-time codes. Anyone on the same network can read
or replay them. Apple also scrutinises ATS exceptions at review, and a raw IP with no TLS
is a common rejection reason.

- [ ] Put the backend behind a domain with a TLS certificate (ALB + ACM, CloudFront, or a
      reverse proxy — the backend is already behind a fixed IP in `eu-west-2`)
- [ ] Point `EXPO_PUBLIC_API_URL` at the `https://` origin for TestFlight builds
- [ ] Delete the `35.178.139.5` exception from `app.json`, keeping only `NSAllowsLocalNetworking`
      for simulator work
- [ ] Verify a release build still reaches the API with no ATS exception present

### 1.2 Root AWS access keys in plaintext

`my-agent/.env` holds `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` for the **account root**
(`arn:aws:iam::571600876240:root`), alongside the Langfuse and RapidAPI keys and
`FINCORE_SESSION_SECRET`. Root credentials cannot be scoped down, cannot be limited by policy,
and cannot be cleanly rotated during an incident. The file is gitignored, but it is one
`git add -f` away from being public, and it is readable by anything running on the machine.

- [ ] Create an IAM user for the backend with least privilege: S3 read/write limited to the
      `fincore-ai-dev` bucket, `bedrock:InvokeModel*`, and
      `sms-voice:SendTextMessage` / `SendDestinationNumberVerificationCode`
- [ ] Swap `.env` to the new keys and confirm the app still works end to end
- [ ] **Delete the root access keys** in IAM (not just stop using them)
- [ ] Enable MFA on the root account
- [ ] Rotate `FINCORE_SESSION_SECRET` — note this signs out every existing user, so do it
      before you have users, not after

### 1.3 Move `.env` to Secrets Manager

Every production secret currently lives in one plaintext file on the box, `my-agent/.env`,
loaded by `load_dotenv()` at import. It is gitignored, but nothing stops `git add -f`, it is
readable by anything running as that user, it is copied around with the deploy, and there is
no audit trail of what read it or when. Rotating anything means hand-editing the file on
every host.

What is in there today:

| Secret | Notes |
|---|---|
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Root keys — see 1.2; these should stop existing entirely |
| `AWS_BEARER_TOKEN_BEDROCK` | Bedrock API key |
| `FINCORE_SESSION_SECRET` | Signs every session token — leak means forged sessions for any user |
| `FINCORE_ADMIN_KEY` | Gates admin endpoints |
| `LANGFUSE_SECRET_KEY` / `LANGFUSE_PUBLIC_KEY` (+ the `_CHAT_` / `_CAMERA_` pairs) | Third-party tracing |
| `RAPIDAPI_KEY` | Billed per call, so a leak costs money directly |

- [ ] Create one Secrets Manager secret per environment (e.g. `fincore/prod`, `fincore/dev`)
      holding these as a JSON blob — one secret with many keys is cheaper than many secrets
- [ ] Load it at startup and populate the same `os.environ` names, so no call site changes:
      fetch once in a module imported before `server.py` reads its config, and fail fast if
      the secret is missing, exactly as `FINCORE_SESSION_SECRET` does today
- [ ] Grant `secretsmanager:GetSecretValue` on that one secret ARN to the backend's IAM role
      only (see 1.2) — not a wildcard
- [ ] Keep `.env` working for local dev so the loop stays fast: prefer Secrets Manager when
      an env var names the secret, fall back to `.env` when it does not
- [ ] Turn on rotation for what supports it, and document the manual steps for what does not
      (Langfuse and RapidAPI keys are rotated in their own consoles)
- [ ] Once migrated, delete `.env` from every production host and confirm the app still boots
- [ ] Treat everything that was ever in that file as compromised and rotate it — it has been
      sitting in plaintext and was read during development

If Secrets Manager's per-secret cost is unwelcome at this stage, SSM Parameter Store with
`SecureString` is free and gives the same IAM-scoped access and audit trail, without rotation.

### 1.4 `FINCORE_SESSION_SECRET` must differ per environment

`auth.py` fails fast if it is unset, which is right, but dev and production must not share a
value — a leaked dev secret would otherwise mint valid production sessions.

- [ ] Separate secret in production, stored outside the repo

### 1.5 `ENVIRONMENT` must not be `development` in production

`/auth/dev` mints a real session for `dev:local-tester` with no credentials at all. It returns
404 unless `ENVIRONMENT=development`, so the gate works — but the gate is the only thing
standing between an open door and a production database.

- [ ] Confirm `ENVIRONMENT` is unset (or not `development`) on the production host
- [ ] Confirm `POST /auth/dev` returns 404 against production before the first build ships

---

## 2. SMS two-factor auth — currently hidden, keep it that way

The feature is implemented and tested end to end, but the AWS account is in the **End User
Messaging SMS sandbox**, which delivers only to pre-verified numbers. A real user enrolling
would get *"Could not send verification code"*. It is therefore hidden behind
`TWO_FACTOR_ENABLED`, which is off unless `EXPO_PUBLIC_TWO_FACTOR_ENABLED=true`.

Current AWS state (`eu-west-2`):

| Item | Value |
|---|---|
| Account tier | `SANDBOX` |
| Monthly text spend | `$1` enforced, `$1` max |
| Sender ID | `FINCORE` (GB, transactional, £0.00/month) |
| Verified destination | `+447362569333` only |

A spend-increase request (case `178971788600508`) was **closed without being granted** —
AWS generally wants production access requested first. There is no API for sandbox exit;
it is console-only.

- [ ] **AWS console → End User Messaging → Account settings → Request production access.**
      Be specific or it gets bounced: transactional OTP only, no marketing; codes sent only
      to a number the user entered themselves; expected monthly volume; sample message
      (`123456 is your Fincore verification code. It expires in 5 minutes.`)
- [ ] Once granted, re-request the `TextMessageMonthlySpend` quota (`L-2325465C`, `sms-voice`,
      `eu-west-2`) — at roughly $0.035 per UK SMS, $1 is about 25–30 messages
- [ ] Set a deliberate enforced limit below the new ceiling as a toll-fraud backstop:
      `aws pinpoint-sms-voice-v2 set-text-message-spend-limit-override --monthly-limit 25 --region eu-west-2`
- [ ] Only then set `EXPO_PUBLIC_TWO_FACTOR_ENABLED=true` in `eas.json`
- [ ] Test enrolment on a real device with a number that has never been verified in the account

**Lockout risk to understand before enabling:** a user with `2fa_enabled` whose phone cannot
receive SMS cannot sign in at all — login deliberately fails closed (502) rather than
downgrading to no second factor. If the monthly spend cap is exhausted mid-month, every 2FA
user is locked out until it resets. Keep the cap comfortably above real volume, and alarm on it.

- [ ] CloudWatch alarm on SMS spend approaching the limit
- [ ] Decide on a recovery path for a user who loses their phone (there is none today)

---

## 3. Incomplete features

- [ ] `/change-password` is marked *"placeholder - integrate with your auth provider"*. It
      bcrypt-checks `password_hash`, but sign-in is OAuth/Apple only and nothing ever sets that
      hash — so the Security screen offers a password change that cannot work. Either wire it
      up or hide it, the same way 2FA is hidden.
- [ ] `/users/data-export` has `# TODO: Trigger async export job`. Under UK GDPR a subject
      access request is a legal obligation, so this needs to actually produce the data.
- [ ] Confirm `https://fincore.one/terms` and `/privacy` are live — the app links to both from
      Help & Support and the sign-in terms checkbox, and App Review follows them.

## 4. App Store submission

- [ ] `ios.buildNumber` is unset in `app.json`; TestFlight needs one and it must increment
- [ ] Privacy nutrition labels declaring what is collected: name, DOB, email, phone, photos,
      and camera images sent to Bedrock
- [ ] Camera and photo-library usage strings that describe the real purpose
- [ ] Account deletion must be reachable in-app (Apple requires it where accounts exist) —
      `DELETE /users/me` exists and is wired to Security & Privacy; verify it end to end
- [ ] Re-check the coach's output against the "guidance, not regulated financial advice" line
      in `CLAUDE.md` — financial apps draw extra review scrutiny

## 5. Backend hardening

- [ ] Review `ALLOWED_ORIGINS` for production; make sure it is not permissive
- [ ] Rate limits exist on auth, 2FA, chat and scan routes — confirm they hold up with a real
      user count, and that `get_remote_address` sees the true client IP through the proxy
      (behind a load balancer it will otherwise rate-limit the balancer, not the caller)
- [ ] S3: block public access on `fincore-ai-dev`, enable default encryption and versioning
- [ ] Decide whether a `-dev` bucket should be holding production user data at all
- [ ] Structured error logging / alerting — failures are currently only visible in the console

## 6. Testing

`CLAUDE.md` states tests are not configured, and that is still true. There is an untracked
26-check auth/2FA regression script that covers token type enforcement, challenge tokens being
rejected as sessions, OTP hashing/expiry/single-use, profile merge on survey retake, and login
failing closed when SMS is down.

- [ ] Move that suite into the repo and run it in CI
- [ ] Test on a physical device — flash/torch, camera, biometrics and push cannot be verified
      in the simulator
- [ ] Test the 30-day session expiry path (a dead token must route to login, not a hollow
      signed-in state)
