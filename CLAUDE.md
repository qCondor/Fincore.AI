# Fincore.AI

Fincore is a fintech app that combines Big Five personality assessment with AI-powered financial
coaching. Users complete a 60-item BFI-2 survey to generate their financial personality profile,
then receive personalised money advice from an AI coach that adapts to their personality traits.

## Architecture

```
Fincore.AI/
├── expo-app/            # React Native app (Expo SDK 54, React 19, expo-router, TypeScript)
│   ├── app/             # File-based routes
│   │   ├── index.tsx    # Splash + routing gate (login vs onboarding vs tabs)
│   │   ├── login.tsx    # Provider sign-in + 2FA challenge
│   │   ├── info.tsx     # "About You" — name, DOB, email, phone
│   │   ├── survey.tsx   # 60-item BFI-2, 4 per page across 15 facet sections
│   │   ├── processing.tsx, results.tsx
│   │   └── (tabs)/      # index (Feels Like scan), faith (coach), profile
│   ├── components/      # Shared UI; settings/ holds the settings sub-pages
│   ├── contexts/        # User, Theme, Preferences, Security, Notification
│   ├── hooks/           # useChat, useProfile, useScan, useChatHistory, useScanHistory
│   ├── lib/             # api.ts (fetch + auth header), session.ts (token store), sounds, haptics
│   └── config.ts        # API base URL, OAuth client IDs, feature flags
├── my-agent/            # Python backend (FastAPI)
│   ├── server.py        # All HTTP routes
│   ├── auth.py          # Provider token verification, session + 2FA challenge JWTs
│   ├── coach.py         # Claude-powered coach (SSE streaming), S3 profile read/write
│   ├── scorer.py        # BFI-2 scoring — 60 items to five domain percentages
│   ├── image_agent.py   # Product image analysis (Bedrock)
│   ├── price_matcher.py # Supermarket price lookup (RapidAPI)
│   ├── math_utils.py    # Psychology-adjusted pricing ("emotional tax")
│   ├── tracing.py       # Langfuse
│   └── tests/           # pytest suite (see Testing)
├── landing/             # Static marketing page
└── GO_LIVE.md           # Pre-launch checklist — read before any production work
```

There is no web frontend. Earlier revisions had a Next.js `prototype/` directory; it is gone.

## Running the App

**Backend** (port 8000):
```bash
cd my-agent
source venv/bin/activate
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```
Copy `.env.example` to `.env` and fill it in first. `ENVIRONMENT=development` is required for
the `/auth/dev` bypass, otherwise that route returns 404 and dev sign-in fails.

**iOS app**:
```bash
cd expo-app
npx expo run:ios        # first run, or after adding any native module
npx expo start          # thereafter; press i
```
The app uses `expo-dev-client`, so Expo Go will not work — native modules (camera, audio,
biometrics, notifications) need a dev build. Adding a native dependency means re-running
`npx expo run:ios`.

`expo-app/.env.local` (gitignored) overrides config for local work, so `config.ts` can keep
production values:
```
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_TWO_FACTOR_ENABLED=false
```

## API Endpoints

All routes except `/`, `/auth/*` and `/waitlist` require `Authorization: Bearer <session token>`.
`user_id` is always derived from the verified token — never from a request parameter.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/auth/{provider}` | POST | Verify Apple/Google/Microsoft identity token, issue session |
| `/auth/dev` | POST | Dev-only session bypass; 404 unless `ENVIRONMENT=development` |
| `/auth/2fa/challenge` | POST | Exchange 2FA challenge token + SMS code for a session |
| `/score` | POST | Submit 60 answers, returns Big Five scores |
| `/profile` | GET/POST/PATCH | Fetch / upsert / partial-update profile (all merge, never replace) |
| `/profile/photo` | POST | Upload avatar to S3 |
| `/profile/insights` | GET | Generated trait insights |
| `/chat` | POST | Stream coach response (SSE) |
| `/analyze`, `/analyze-text` | POST | Product analysis via Bedrock |
| `/price-check` | POST | Supermarket price lookup |
| `/psychology-cost` | POST | Personality-adjusted "emotional tax" for a price |
| `/upload-scan-image`, `/users/scans` | POST/GET | Scan history |
| `/users/me` | GET/DELETE | Full user object / account deletion |
| `/users/conversations` | GET | Chat history |
| `/users/sessions` | GET | Active sessions; `/revoke` to end one |
| `/2fa/send-code`, `/2fa/verify`, `/2fa/disable` | POST | 2FA enrolment |
| `/users/push-token`, `/users/notification-prefs` | POST/GET | Push registration |
| `/waitlist` | POST | Landing page signups |

## Auth model

Two JWT kinds are signed with the same `FINCORE_SESSION_SECRET` and distinguished **only** by a
`typ` claim:

- `typ: "session"` — full access, 30-day expiry.
- `typ: "2fa_challenge"` — proves provider identity, grants no API access, 5-minute expiry.

`verify_session_token` rejects anything that is not `typ: "session"`. **Do not remove that check**
— without it a half-authenticated challenge token becomes a valid session. Changing token
format invalidates existing tokens; the app handles this by signing out on 401.

Onboarding completion is derived from the server (`/profile` has `big_five`), not just the local
flag, so signing out does not force a returning user to retake the 60-question survey.

## Key Conventions

- **British English** — pounds, not dollars
- **Personality-driven** — coach responses adapt to the user's Big Five profile
- **Streaming** — chat uses SSE with JSON-encoded chunks
- **No regulated advice** — the coach gives guidance, not financial advice
- **Profile writes merge** — never replace a profile wholesale; `/score` and `POST /profile`
  both merge, because a full overwrite wipes contact details, photo and preferences
- **Secrets stay out of the repo** — `.env` is gitignored; see `GO_LIVE.md` §1.3

## Feature flags

`TWO_FACTOR_ENABLED` in `expo-app/config.ts` hides the 2FA toggle. It is **off** because the AWS
account is still in the End User Messaging SMS sandbox, which only delivers to pre-verified
numbers. Do not enable it until production access is granted — see `GO_LIVE.md` §2.

Provider sign-in (Google/Apple/Microsoft) is currently commented out in `login.tsx` for local
testing; only the dev bypass is wired up. Re-enable before TestFlight.

## Development Commands

```bash
# Frontend
cd expo-app && npx expo start        # Metro bundler
cd expo-app && npx expo run:ios      # Build + launch on simulator
cd expo-app && npx tsc --noEmit      # Typecheck (no ESLint config in this repo)

# Backend
cd my-agent && uvicorn server:app --reload   # API server
cd my-agent && python agent.py "task"        # Dev agent

# Testing
cd my-agent && source venv/bin/activate && pytest tests/ -v
```

## Testing

`my-agent/tests/test_auth.py` covers the auth and 2FA paths: token `typ` enforcement, challenge
tokens rejected as sessions, OTP hashing/expiry/single-use, profile merge on survey retake,
enrolment not repointing a working 2FA phone when SMS fails, and login failing closed when SMS
is down. SMS is stubbed, so it sends nothing and costs nothing.

It runs against the **live S3 bucket** using the dev user, and restores that profile afterwards.
There is no frontend test suite; run `npx tsc --noEmit` and exercise the app in the simulator.
