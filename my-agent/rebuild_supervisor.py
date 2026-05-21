#!/usr/bin/env python3
"""
Interactive Supervisor for Fincore.AI Expo Rebuild

Run this script, and it will:
1. Take screenshots of prototype and simulator
2. Show you the comparison
3. Let you provide feedback to the builder
4. Track progress through screens

Usage:
    python rebuild_supervisor.py

Prerequisites:
    - Prototype running: cd prototype && npm run dev
    - Expo running: cd expo-app && npm start
    - iOS Simulator booted and running the app
"""

import subprocess
import sys
import os
import time
from pathlib import Path
from datetime import datetime

REPO_ROOT = Path(__file__).parent.parent
SCREENSHOTS_DIR = REPO_ROOT / "build-screenshots"

SCREENS = [
    {
        "id": "splash",
        "name": "Splash Screen",
        "description": "Animated logo reveal with gradient background",
        "prototype_state": "Refresh the page to see splash (shows for 2.5s)",
        "key_elements": [
            "Blue gradient background (#56CCF2 → #2F80ED → #005FCC)",
            "Fincore logo centered",
            "Fade-in animation",
            "Auto-redirect after 2.5 seconds"
        ]
    },
    {
        "id": "login",
        "name": "Login Carousel",
        "description": "4-slide carousel with social auth",
        "prototype_state": "Wait for splash to finish, or click past it",
        "key_elements": [
            "Swipeable carousel with 4 slides",
            "Dot indicators at bottom",
            "Google/Microsoft/Apple auth buttons",
            "Terms checkbox",
            "Frosted glass card effect"
        ]
    },
    {
        "id": "info",
        "name": "Personal Info",
        "description": "User details form",
        "prototype_state": "Accept terms and click Continue",
        "key_elements": [
            "Name, email, DOB, phone inputs",
            "Icon prefix on each input",
            "White input fields on blue gradient",
            "Continue button"
        ]
    },
    {
        "id": "survey",
        "name": "Personality Survey",
        "description": "15-question Big Five assessment",
        "prototype_state": "Fill in info and continue",
        "key_elements": [
            "Progress bar showing completion",
            "Question text prominently displayed",
            "5 answer options (strongly disagree → strongly agree)",
            "Smooth transition between questions",
            "Back button to previous question"
        ]
    },
    {
        "id": "processing",
        "name": "Processing Screen",
        "description": "AI analyzing personality",
        "prototype_state": "Complete all 15 questions",
        "key_elements": [
            "Loading animation",
            "Processing text",
            "Gradient background"
        ]
    },
    {
        "id": "results",
        "name": "Results Screen",
        "description": "Big Five personality breakdown",
        "prototype_state": "Wait for processing to complete",
        "key_elements": [
            "5 trait bars with scores",
            "Color-coded traits (each has unique color)",
            "Expandable descriptions",
            "Continue to app button"
        ]
    },
    {
        "id": "scan",
        "name": "Scan Tab",
        "description": "Product scanner with camera",
        "prototype_state": "Click Scan in bottom nav",
        "key_elements": [
            "Camera viewfinder",
            "Scan button centered at bottom",
            "Flash toggle",
            "Gallery button"
        ]
    },
    {
        "id": "scan_result",
        "name": "Scan Result",
        "description": "Product analysis display",
        "prototype_state": "Scan a product (or use test image)",
        "key_elements": [
            "Product image at top",
            "Score/verdict card",
            "Price display with edit option",
            "Analysis breakdown tabs",
            "Ask Faith button"
        ]
    },
    {
        "id": "faith",
        "name": "Faith Chat",
        "description": "AI financial coach chat",
        "prototype_state": "Click Faith in bottom nav",
        "key_elements": [
            "Conversation starters when empty",
            "Message input at bottom",
            "Chat bubbles (user right, AI left)",
            "Typing indicator during response",
            "Drawer for chat history"
        ]
    },
    {
        "id": "profile",
        "name": "Profile Tab",
        "description": "User profile and settings",
        "prototype_state": "Click Profile in bottom nav",
        "key_elements": [
            "User avatar/initials",
            "Big Five scores summary",
            "Settings options",
            "Logout button"
        ]
    },
]


def screenshot_simulator(name: str) -> Path:
    """Take a screenshot of the iOS simulator."""
    SCREENSHOTS_DIR.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%H%M%S")
    output_path = SCREENSHOTS_DIR / f"sim_{name}_{timestamp}.png"

    result = subprocess.run(
        ["xcrun", "simctl", "io", "booted", "screenshot", str(output_path)],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print(f"Error taking screenshot: {result.stderr}")
        return None

    print(f"📸 Simulator screenshot saved: {output_path.name}")
    return output_path


def screenshot_prototype(name: str) -> Path:
    """Instruct user to take prototype screenshot."""
    SCREENSHOTS_DIR.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%H%M%S")
    output_path = SCREENSHOTS_DIR / f"proto_{name}_{timestamp}.png"

    print(f"\n📸 Take a screenshot of the prototype and save it as:")
    print(f"   {output_path}")
    print(f"\n   Tip: Cmd+Shift+4, then drag to select the phone frame")
    input("   Press Enter when done...")

    if output_path.exists():
        print(f"   ✓ Screenshot found!")
        return output_path
    else:
        print(f"   ✗ Screenshot not found at expected path")
        alt = input("   Enter actual path (or press Enter to skip): ").strip()
        if alt and Path(alt).exists():
            return Path(alt)
        return None


def open_screenshots(proto_path: Path, sim_path: Path):
    """Open both screenshots for comparison."""
    if proto_path and proto_path.exists():
        subprocess.run(["open", str(proto_path)])
    if sim_path and sim_path.exists():
        subprocess.run(["open", str(sim_path)])


def check_prerequisites() -> bool:
    """Check if all prerequisites are met."""
    print("\n🔍 Checking prerequisites...\n")

    # Check prototype
    result = subprocess.run(["lsof", "-i", ":3000"], capture_output=True, text=True)
    proto_ok = "LISTEN" in result.stdout
    print(f"   Prototype (localhost:3000): {'✓' if proto_ok else '✗'}")

    # Check expo
    result = subprocess.run(["lsof", "-i", ":8081"], capture_output=True, text=True)
    expo_ok = "LISTEN" in result.stdout
    print(f"   Expo Metro (localhost:8081): {'✓' if expo_ok else '✗'}")

    # Check simulator
    result = subprocess.run(
        ["xcrun", "simctl", "list", "devices", "booted"],
        capture_output=True, text=True
    )
    sim_ok = "Booted" in result.stdout
    print(f"   iOS Simulator: {'✓' if sim_ok else '✗'}")

    if not proto_ok:
        print("\n   ⚠ Start prototype: cd prototype && npm run dev")
    if not expo_ok:
        print("\n   ⚠ Start Expo: cd expo-app && npm start")
    if not sim_ok:
        print("\n   ⚠ Boot simulator: open -a Simulator")

    return proto_ok and sim_ok  # expo_ok optional for initial scaffold


def print_screen_info(screen: dict, index: int, total: int):
    """Print information about the current screen."""
    print(f"\n{'='*60}")
    print(f"SCREEN {index + 1}/{total}: {screen['name']}")
    print(f"{'='*60}")
    print(f"\n📝 {screen['description']}")
    print(f"\n🎯 To see in prototype: {screen['prototype_state']}")
    print(f"\n✅ Key elements to match:")
    for elem in screen['key_elements']:
        print(f"   • {elem}")


def generate_builder_prompt(screen: dict, feedback: str = None) -> str:
    """Generate a prompt for the builder agent."""
    prompt = f"""Build the {screen['name']} screen for the Expo app.

## Screen: {screen['id']}
{screen['description']}

## Key elements that MUST match the prototype:
"""
    for elem in screen['key_elements']:
        prompt += f"- {elem}\n"

    if feedback:
        prompt += f"""
## Feedback from visual comparison:
{feedback}

Fix these specific issues before anything else.
"""

    prompt += """
## Instructions:
1. Read the prototype code: /Users/mycomputer/Fincore.AI/prototype/src/app/page.tsx
2. Find the section that renders this screen
3. Create/update the Expo equivalent with EXACT visual match
4. Use the same hex colors, same spacing ratios, same animations

## Technical requirements:
- expo-linear-gradient for gradients
- react-native-reanimated for animations
- expo-blur for blur effects
- Match all border-radius values
- Match all shadow values
"""

    return prompt


def main():
    print("\n" + "="*60)
    print("FINCORE.AI EXPO REBUILD SUPERVISOR")
    print("="*60)
    print("\nThis tool helps ensure pixel-perfect visual fidelity")
    print("between the Next.js prototype and the Expo app.\n")

    if not check_prerequisites():
        print("\n❌ Fix prerequisites and run again.")
        sys.exit(1)

    print("\n✓ Prerequisites OK\n")

    # Track progress
    completed = []
    current = 0

    while current < len(SCREENS):
        screen = SCREENS[current]
        print_screen_info(screen, current, len(SCREENS))

        while True:
            print(f"\n📋 Options:")
            print(f"   [1] Take simulator screenshot")
            print(f"   [2] Take prototype screenshot (manual)")
            print(f"   [3] Compare screenshots (opens both)")
            print(f"   [4] Generate builder prompt")
            print(f"   [5] Mark as APPROVED → next screen")
            print(f"   [6] Skip this screen")
            print(f"   [q] Quit")

            choice = input("\n   Choice: ").strip().lower()

            if choice == '1':
                screenshot_simulator(screen['id'])

            elif choice == '2':
                screenshot_prototype(screen['id'])

            elif choice == '3':
                # Find most recent screenshots for this screen
                sim_shots = sorted(SCREENSHOTS_DIR.glob(f"sim_{screen['id']}_*.png"))
                proto_shots = sorted(SCREENSHOTS_DIR.glob(f"proto_{screen['id']}_*.png"))
                sim_path = sim_shots[-1] if sim_shots else None
                proto_path = proto_shots[-1] if proto_shots else None
                if sim_path or proto_path:
                    open_screenshots(proto_path, sim_path)
                else:
                    print("   No screenshots found for this screen yet.")

            elif choice == '4':
                feedback = input("\n   Enter feedback (or press Enter for none): ").strip()
                prompt = generate_builder_prompt(screen, feedback if feedback else None)
                print(f"\n{'─'*60}")
                print("COPY THIS PROMPT TO CLAUDE CODE:")
                print(f"{'─'*60}\n")
                print(prompt)
                print(f"\n{'─'*60}")

            elif choice == '5':
                completed.append(screen['id'])
                print(f"\n   ✓ {screen['name']} approved!")
                current += 1
                break

            elif choice == '6':
                print(f"\n   ⏭ Skipping {screen['name']}")
                current += 1
                break

            elif choice == 'q':
                print(f"\n\nProgress: {len(completed)}/{len(SCREENS)} screens completed")
                print(f"Completed: {', '.join(completed) if completed else 'None'}")
                sys.exit(0)

    print("\n" + "="*60)
    print("🎉 ALL SCREENS COMPLETE!")
    print("="*60)
    print(f"\nCompleted: {', '.join(completed)}")


if __name__ == "__main__":
    main()
