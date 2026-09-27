# Fincore — Handover Guide

Plain-English guide to getting a new version of the app onto people's iPhones.
No prior knowledge of this project assumed.

Written for the **HP OmniBook laptop running Windows 11**. Everything below was tested on that
laptop on 27 September 2026 and produced build 10 on TestFlight.

---

## The plan in one paragraph

You change the code on this laptop. You then run **one command**, which sends the code to
Expo's computers in the cloud. They build the iPhone app for you (because an iPhone app can
only be built on a Mac, and this laptop is not a Mac), and hand it straight to Apple. About
twenty minutes later it appears in **TestFlight**, Apple's app for testing, and anyone you have
invited can install it on their iPhone.

You never need a Mac, Xcode, or an iPhone simulator for this.

---

## What this app actually is

Fincore has two halves:

1. **The phone app** (`expo-app/`) — what you see and tap. Written in React Native.
2. **The server** (`my-agent/`) — the brain. Scores the personality quiz, talks to the AI coach,
   stores profiles. Written in Python.

The TestFlight app talks to the **live server** on the internet at `35.178.139.5`. It does
**not** talk to this laptop. So you do not need to run the server here to use or test the app.

There is also `landing/`, a single static marketing web page, unrelated to the app.

**What the app does:** a new user signs in with Google, Apple or Microsoft, gives their name and
a few details, answers 60 personality questions, and gets a Big Five ("OCEAN") personality
profile. From then on an AI coach called Faith gives money advice shaped by that profile, and a
camera feature scans products and tells you what they "really" cost you emotionally.

---

## One-time setup (already done on this laptop)

This is here in case you move to a new laptop. On the HP, all of it is already done.

1. **Node.js** — https://nodejs.org. This laptop has v24.
2. **Git** — https://git-scm.com. Needed to fetch the code.
3. **The EAS tool** — Expo's command for building in the cloud. Open PowerShell and run:
   ```powershell
   npm install -g eas-cli
   ```
4. **Log in to Expo** with the project's Expo account (`qutyco`):
   ```powershell
   eas login
   ```
   Check it worked with `eas whoami` — it should print `qutyco`.

That is all. The Apple certificates and the key that lets Expo upload to Apple are **stored on
Expo's side**, not on this laptop. You do not need an Apple password to build.

---

## Putting a new version on TestFlight

Open **PowerShell** (or the terminal inside VS Code) and do these steps in order.

### Step 1 — Go to the app folder and get the latest code

```powershell
cd C:\Users\Harris\OneDrive\Documents\Fincore.AI
git pull
cd expo-app
npm install
```

`git pull` fetches anything other people have changed. **Always do this first** — on
27 September this laptop was 11 changes behind, including the one that switches sign-in back on.
A build made from old code would have left testers unable to sign in at all.

### Step 2 — Check nothing is broken

```powershell
npx tsc --noEmit
```

If it prints nothing, you are fine. If it prints errors, fix them before going on — a broken
build still uses up one of your monthly builds.

### Step 3 — Build and send to Apple

```powershell
eas build --platform ios --profile production --auto-submit
```

This one command does everything:

- Uploads the code to Expo (a few seconds).
- Expo builds the iPhone app on their Macs (about 10 minutes).
- Sends the finished app to Apple.

You will see a link starting `https://expo.dev/...builds/...` near the top. Open it to watch
progress in your browser. You can close the terminal once you see that link — the build carries
on in the cloud.

You do **not** need to change the version or build number. It goes up by one on its own.

### Step 4 — Wait for Apple

When the terminal says **"Submitted your app to Apple App Store Connect!"**, Apple takes another
5–10 minutes to process it. You will get an email from Apple when it is ready.

### Step 5 — Install it

On an iPhone that has been invited as a tester:

1. Open the **TestFlight** app (free, from the App Store).
2. Fincore will show an update. Tap **Update** (or **Install** the first time).

To invite someone new: go to https://appstoreconnect.apple.com, open **Fincore → TestFlight**,
and add their Apple ID email as a tester. They get an email invitation to accept.

---

## When things go wrong

| What you see | What it means | What to do |
|---|---|---|
| `Apple 401 detected` … `Log in to your Apple Developer account` / `Failed to fetch Apple provisioning profiles` | Harmless. The tool tried an optional check with Apple and skipped it | Nothing — the build carries on. It did this on the successful build 10 too |
| `eas: command not found` / `'eas' is not recognized` | The EAS tool is not installed | `npm install -g eas-cli` |
| `Not logged in` | Expo login has expired | `eas login`, using the `qutyco` account |
| `Build failed` | Something in the code is wrong | Open the `expo.dev` link from Step 3 and read the red part of the log |
| Build finished but nothing in TestFlight | Apple is still processing | Wait for Apple's email, usually under 15 minutes |
| App installs but sign-in fails, or screens stay empty | The live server is down | See "The server" below |
| `cd: no such file or directory` / `Cannot find path` | You are in the wrong folder | Start again from Step 1 |

---

## The server

The TestFlight app uses the live server at `http://35.178.139.5:8000`. To check it is up, open
that address in a web browser. It should say `{"status":"ok"}`.

**Updating the server is not done from this laptop.** It uses `deploy.sh`, which needs a private
key file (`fincore-key.pem`) that is not on this machine. If you change anything in `my-agent/`,
the person who holds that key has to deploy it. See `GO_LIVE.md` section 0.

If you only change things in `expo-app/`, you do not need to touch the server at all.

---

## Things that will surprise you

- **You cannot preview changes instantly on this laptop.** Seeing a change on a phone means
  doing a TestFlight build (about 20 minutes end to end). Live previewing needs a Mac with Xcode —
  `CLAUDE.md` has those steps if you ever get one.
- **Expo Go will not work.** If someone suggests the Expo Go app: this project uses features
  (camera, Face ID, Sign in with Apple and others) that Expo Go does not include. TestFlight is
  the way.
- **Builds are limited.** Each build uses one of the Expo plan's monthly builds, so do not build
  for every tiny change — batch them up.
- **"Skip Sign-In (dev only)" does not appear in TestFlight.** That button only exists when
  running on a Mac for development. TestFlight users sign in with Google, Apple or Microsoft.
- **Text messages only reach one phone.** Two-factor authentication is built and working, but
  the AWS account is still in "sandbox" mode, which only delivers texts to one pre-approved
  number. The feature is therefore **hidden** in the app on purpose. Do not switch it on until
  the AWS side is sorted — see `GO_LIVE.md`.
- **Signing out does not mean redoing the quiz.** The 60 answers are saved to the server, so
  signing back in skips straight to the app.
- **The app is not ready for the public yet.** TestFlight testers are fine; the App Store is
  not. `GO_LIVE.md` lists what is outstanding. The most serious item is that traffic to the
  server is currently unencrypted.

---

## Where things live

| Path | What it is |
|---|---|
| `expo-app/` | The phone app — run the build commands from here |
| `expo-app/app/` | The screens — `login`, `info`, `survey`, `results`, `(tabs)/` |
| `expo-app/config.ts` | Server address and feature switches |
| `expo-app/eas.json` | Build settings — the `production` profile is the TestFlight one |
| `my-agent/` | The Python server |
| `my-agent/.env` | Secrets. **Never commit this file** |
| `deploy.sh` | Updates the live server (needs the key file — not on this laptop) |
| `landing/` | Static marketing page |
| `GO_LIVE.md` | What must happen before real users |
| `CLAUDE.md` | Technical detail for developers and AI assistants |

Useful links:

- Expo builds: https://expo.dev/accounts/qutyco/projects/fincore/builds
- App Store Connect (TestFlight): https://appstoreconnect.apple.com/apps/6772169954/testflight/ios

---

## Who to ask

There is no wiki or ticket system for this project. `GO_LIVE.md` and `CLAUDE.md` are the
complete written record, alongside the git history (`git log`). If something here does not
match what you see, trust the code and correct this file.
