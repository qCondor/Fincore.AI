# Fincore — Handover Guide

Plain-English guide to getting the app running and understanding what you have been given.
No prior knowledge of this project assumed.

---

## First, an important correction: Expo Go will not work

If you were told to open this in **Expo Go**, that will not work, and it is worth knowing why
before you waste an afternoon on it.

Expo Go is a pre-built app from the App Store. It can run projects that only use the features
Apple and Expo baked into it. This app uses ten things Expo Go does not contain — the camera,
audio, Face ID, push notifications, Sign in with Apple, secure storage, the photo picker, and
more. When Expo Go hits one of those it simply crashes with something like
`Cannot find native module 'ExpoAudio'`.

There is no setting or workaround. The project needs its **own** app built, containing those
features. That is called a **development build**, and it is what the instructions below produce.
In day-to-day use it behaves exactly like Expo Go — you scan a QR code, it loads, changes appear
live — it is just an app with this project's name on it instead of Expo's.

**If you only want to click around the app and do not intend to change code, skip to
[Option B: TestFlight](#option-b-just-use-the-app-testflight).** It is far less work.

---

## What this app actually is

Fincore has two halves that must both be running:

1. **The phone app** (`expo-app/`) — what you see and tap. Written in React Native.
2. **The server** (`my-agent/`) — the brain. Scores the personality quiz, talks to the AI coach,
   stores profiles. Written in Python. Runs on your laptop during development.

The phone app is useless on its own. If the server is not running, you will sign in and then
see empty screens and spinners, because the app is asking a server that is not there.

There is also `landing/`, a single static marketing web page, unrelated to the app.

**What the app does:** a new user signs in, gives their name and a few details, answers 60
personality questions, and gets a Big Five ("OCEAN") personality profile. From then on an AI
coach called Faith gives money advice shaped by that profile, and a camera feature scans
products and tells you what they "really" cost you emotionally.

---

## Option A: Run it yourself (for making changes)

### What you need installed

- **A Mac.** The iPhone simulator only exists on macOS.
- **Xcode**, from the Mac App Store. Large, slow download — start it first.
- **Node.js** (v20 or newer) — https://nodejs.org
- **Python 3.12**
- The project's AWS keys and other secrets, which are **not** in the code. Ask whoever handed
  this over for the `my-agent/.env` file. Nothing works without it.

### Step 1 — Start the server

Open Terminal and run these one at a time:

```bash
cd ~/Fincore.AI/my-agent
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Put the `.env` file you were given into the `my-agent` folder. If you only have
`.env.example`, copy it to `.env` and fill in the real values — the example has the right
shape but fake values.

Then start it:

```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

Leave this window open. It should say `Application startup complete`. You will also see
`ENVIRONMENT=development: /auth/dev session bypass is ENABLED` — that is expected in
development and is what lets you skip the sign-in screen.

**Leave this running.** Everything below assumes it is up.

### Step 2 — Build and run the app

Open a **second** Terminal window:

```bash
cd ~/Fincore.AI/expo-app
npm install
npx expo run:ios
```

The first run takes 10–20 minutes — it is compiling the whole app. Later runs take seconds.
The iPhone simulator will open on its own when it is done.

If it complains about **code signing**, open Xcode → Settings → Accounts, sign in with any
Apple ID (free, no paid developer account needed), then run the command again.

### Step 3 — Everyday use after that first build

You only need the long build again if someone adds a new device feature. Normally:

```bash
cd ~/Fincore.AI/expo-app
npx expo start
```

Then press `i` to open the simulator. Edit a file, save, and the app updates instantly.
Press `r` in that terminal to force a reload if something looks stuck.

### Step 4 — Getting into the app

On the sign-in screen, tap **"Skip Sign-In (dev only)"**. That is a development shortcut that
logs you in as a test user without a password. It only exists while the server is running in
development mode, and it is disabled in real released builds.

Sign in with Google, Apple and Microsoft are currently **switched off in the code** during
development. Skip Sign-In is the only way in right now.

---

## Option B: Just use the app (TestFlight)

If you only want to *use* the app, not change it, this is the right path. Nothing to install
beyond one free Apple app, and no server to run — a TestFlight build points at the real server.

1. Install **TestFlight** from the App Store on your iPhone.
2. Ask whoever handed this over to add your Apple ID email as a tester.
3. Accept the emailed invitation and install Fincore from TestFlight.

Note that a TestFlight build has to be produced first, using the `preview` or `production`
profile in `expo-app/eas.json`. If nobody has done that yet, this option is not available
until someone does.

---

## When things go wrong

| What you see | What it means | What to do |
|---|---|---|
| `Cannot find native module 'ExpoAudio'` (or similar) | You are on Expo Go, or your build predates a new feature | Run `npx expo run:ios` again to rebuild |
| Screens load but stay empty, spinners forever | The server is not running | Check the first Terminal window is still up |
| `Dev sign-in failed` | The server started without development mode | Confirm `ENVIRONMENT=development` is in `my-agent/.env`, then restart the server |
| `Unauthorized` / kicked back to sign-in | Your saved login expired or is no longer valid | Sign in again — this is intended behaviour |
| `No code signing certificates` | Xcode has no Apple ID | Xcode → Settings → Accounts → add any Apple ID |
| `cd: no such file or directory` | You are in the wrong folder | `expo-app` and `my-agent` are side by side, not nested |
| Simulator camera shows grey stripes | Normal — the simulator has no real camera | Test the camera on a physical iPhone |

---

## Before you give a build to a tester

A TestFlight build does **not** talk to your laptop. It talks to the live server at
`35.178.139.5`. That server is currently running older code than this project, which means a
tester would lose the details they typed in as soon as they finished the quiz.

The server has to be updated first. See `GO_LIVE.md` section 0 — it is the first thing in that
document for a reason.

---

## Things that will surprise you

- **The simulator cannot do everything.** No real camera, no Face ID, no torch/flash, no push
  notifications. Those need a physical iPhone.
- **Text messages only reach one phone.** Two-factor authentication is built and working, but
  the AWS account is still in "sandbox" mode, which only delivers texts to one pre-approved
  number. The feature is therefore **hidden** in the app on purpose. Do not switch it on until
  the AWS side is sorted — see `GO_LIVE.md`.
- **Signing out no longer means redoing the quiz.** The 60 questions are saved to the server,
  so signing back in skips straight to the app.
- **The app is not ready for the public yet.** `GO_LIVE.md` lists what is outstanding. The most
  serious item is that traffic to the server is currently unencrypted.

---

## Where things live

| Path | What it is |
|---|---|
| `expo-app/` | The phone app |
| `expo-app/app/` | The screens — `login`, `info`, `survey`, `results`, `(tabs)/` |
| `expo-app/config.ts` | Server address and feature switches |
| `my-agent/` | The Python server |
| `my-agent/server.py` | Every server endpoint |
| `my-agent/.env` | Secrets. **Never commit this file** |
| `my-agent/tests/` | Automated checks — `pytest tests/ -v` |
| `landing/` | Static marketing page |
| `GO_LIVE.md` | What must happen before real users |
| `CLAUDE.md` | Technical detail for developers and AI assistants |

---

## Checking you have not broken anything

```bash
# Server tests
cd my-agent && source venv/bin/activate && pytest tests/ -v

# App type-checking
cd expo-app && npx tsc --noEmit
```

Both should pass before committing. Neither tests the visual appearance — for that, open the
app and look at it.

---

## Who to ask

There is no wiki or ticket system for this project. `GO_LIVE.md` and `CLAUDE.md` are the
complete written record, alongside the git history (`git log`). If something here does not
match what you see, trust the code and correct this file.
