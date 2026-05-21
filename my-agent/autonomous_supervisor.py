#!/usr/bin/env python3
"""
Autonomous Supervisor for Fincore.AI Expo Rebuild

This supervisor runs completely autonomously for hours, managing builder agents
to create a pixel-perfect Expo app. It uses Claude's vision to compare screenshots.

Usage:
    python autonomous_supervisor.py

The supervisor will:
1. Delete the old expo-app and start fresh
2. Boot simulator, start servers if needed
3. Work through each screen one by one
4. Take screenshots, compare visually, provide feedback
5. Only move to next screen when current one matches
6. Log all progress to build-log.txt
"""

import asyncio
import subprocess
import os
import sys
import time
import base64
import json
from pathlib import Path
from datetime import datetime
from claude_agent_sdk import query, ClaudeAgentOptions, AssistantMessage, ResultMessage

REPO_ROOT = Path(__file__).parent.parent
SCREENSHOTS_DIR = REPO_ROOT / "build-screenshots"
LOG_FILE = REPO_ROOT / "build-log.txt"
EXPO_APP_DIR = REPO_ROOT / "expo-app"

# Screen definitions with detailed requirements
SCREENS = [
    {
        "id": "splash",
        "name": "Splash Screen",
        "file": "src/app/index.tsx",
        "description": "Animated Fincore logo reveal on gradient background",
        "visual_requirements": """
- Background: Linear gradient from #56CCF2 (top) → #2F80ED (middle) → #005FCC (bottom)
- Fincore logo centered vertically and horizontally
- Logo should fade in with scale animation (0.8 → 1.0)
- Duration: 2.5 seconds before auto-navigating
- No visible UI chrome - full bleed gradient
""",
        "prototype_lines": "Search for 'splash' screen rendering in page.tsx",
    },
    {
        "id": "login",
        "name": "Login Carousel",
        "file": "src/app/login.tsx",
        "description": "4-slide onboarding carousel with social auth",
        "visual_requirements": """
- Same blue gradient background as splash
- Frosted glass card (white/20% opacity, blur, rounded corners ~24px)
- 4 swipeable slides with dot indicators
- Each slide has: icon, title, subtitle
- Bottom section: Google/Microsoft/Apple buttons (white bg, rounded full)
- Terms checkbox with "I accept" text
- Continue button (disabled until terms accepted)
""",
        "prototype_lines": "Search for 'login-1', 'login-2', etc in page.tsx",
    },
    {
        "id": "info",
        "name": "Personal Info Form",
        "file": "src/app/signup.tsx",
        "description": "User details collection form",
        "visual_requirements": """
- Same blue gradient background
- Title: "Let's get to know you" in white, bold
- Subtitle in white/80% opacity
- Input fields: white background, rounded 16px, icon prefix
- Fields: Name (User icon), Email (Mail icon), DOB (Calendar icon)
- Continue button: white bg, blue text, full width, rounded 32px
- Skip button: transparent, white text
""",
        "prototype_lines": "Search for 'info' screen and infoForm state",
    },
    {
        "id": "survey",
        "name": "Personality Survey",
        "file": "src/app/onboarding.tsx",
        "description": "15-question Big Five personality assessment",
        "visual_requirements": """
- Blue gradient background
- Progress bar at top (shows completion %, blue fill on white/30% track)
- Question number: "Question X of 15"
- Question text: large, white, bold, centered
- 5 answer buttons in vertical stack:
  - Strongly Disagree, Disagree, Neutral, Agree, Strongly Agree
  - White/90% bg when unselected, solid white when selected
  - Rounded 16px, full width
- Back button (chevron left) when not on Q1
- Smooth slide animation between questions
""",
        "prototype_lines": "Search for questions array and q${number} screen handling",
    },
    {
        "id": "processing",
        "name": "Processing Screen",
        "file": "src/app/processing.tsx",
        "description": "AI analyzing personality animation",
        "visual_requirements": """
- Blue gradient background (same as others)
- Centered loading indicator (spinning or pulsing)
- Text: "Analyzing your personality..." in white
- Subtle animation on the text or indicator
- Auto-proceeds to results after ~2-3 seconds
""",
        "prototype_lines": "Search for 'processing' screen",
    },
    {
        "id": "results",
        "name": "Results Screen",
        "file": "src/app/results.tsx",
        "description": "Big Five personality breakdown display",
        "visual_requirements": """
- Blue gradient background
- Title: "Your Financial Personality" in white bold
- 5 trait cards, each showing:
  - Trait name (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism)
  - Score bar (colored fill on gray track)
  - Percentage number
  - Each trait has unique color from traitColors
- Expandable descriptions (tap to show/hide)
- Continue button at bottom
""",
        "prototype_lines": "Search for 'results' screen and oceanScores rendering",
    },
    {
        "id": "scan",
        "name": "Scan Tab",
        "file": "src/app/(tabs)/scan.tsx",
        "description": "Product scanner with camera viewfinder",
        "visual_requirements": """
- Camera fills most of screen
- Scan frame overlay (rounded rectangle, white/50% border)
- Bottom bar with:
  - Flash toggle button (left)
  - Large scan/capture button (center, white circle)
  - Gallery button (right)
- Tab bar at very bottom with: Scan, Faith, Profile icons
- Scan tab should be highlighted/selected
""",
        "prototype_lines": "Search for 'scan' screen and camera handling",
    },
    {
        "id": "scan_result",
        "name": "Scan Result",
        "file": "src/app/scan-result.tsx",
        "description": "Product analysis after scanning",
        "visual_requirements": """
- Product image at top (large, rounded corners)
- Score card below with:
  - Overall score (large number with /100)
  - Verdict text (Good/Bad/etc)
  - Color coded (green good, red bad)
- Price display with edit pencil icon
- Tabbed analysis: Overview, Nutrition, Psychology
- "Ask Faith" button to discuss with AI
- Back button to return to scanner
""",
        "prototype_lines": "Search for 'scan-result' screen and scanAnalysis",
    },
    {
        "id": "faith",
        "name": "Faith Chat Tab",
        "file": "src/app/(tabs)/faith.tsx",
        "description": "AI financial coach conversation",
        "visual_requirements": """
- White/light background for chat area
- When empty: conversation starters (rounded pill buttons)
- Message bubbles:
  - User messages: blue bg, white text, right aligned
  - AI messages: gray bg, dark text, left aligned
- Input bar at bottom:
  - Text input with placeholder
  - Send button (blue)
  - Attachment button
- Typing indicator when AI responding
- Hamburger menu for chat history drawer
""",
        "prototype_lines": "Search for 'faith' screen and ChatScreen component",
    },
    {
        "id": "profile",
        "name": "Profile Tab",
        "file": "src/app/(tabs)/profile.tsx",
        "description": "User profile and settings",
        "visual_requirements": """
- Header with user avatar (initials in circle) and name
- Big Five summary section showing all 5 trait scores
- Settings list:
  - Notifications
  - Payment methods
  - Help & Support
  - Log out
- Each setting row has icon, label, chevron right
- Clean white/light gray sections
""",
        "prototype_lines": "Search for 'profile' and 'user-profile' screens",
    },
]


def log(message: str):
    """Log message to console and file."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {message}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


def run_cmd(cmd: str, timeout: int = 120) -> tuple[int, str, str]:
    """Run a shell command and return (returncode, stdout, stderr)."""
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=timeout
        )
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return -1, "", "Command timed out"
    except Exception as e:
        return -1, "", str(e)


def screenshot_simulator(name: str) -> Path | None:
    """Take a screenshot of the iOS simulator."""
    SCREENSHOTS_DIR.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%H%M%S")
    output_path = SCREENSHOTS_DIR / f"sim_{name}_{timestamp}.png"

    code, out, err = run_cmd(f'xcrun simctl io booted screenshot "{output_path}"')

    if code == 0 and output_path.exists():
        log(f"Screenshot saved: {output_path.name}")
        return output_path
    else:
        log(f"Screenshot failed: {err}")
        return None


def image_to_base64(path: Path) -> str:
    """Convert image file to base64 string."""
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


async def check_and_start_services():
    """Ensure all required services are running."""
    log("Checking services...")

    # Check/boot simulator
    code, out, _ = run_cmd("xcrun simctl list devices booted")
    if "Booted" not in out:
        log("Booting iOS simulator...")
        run_cmd("xcrun simctl boot booted 2>/dev/null || true")
        code, out, _ = run_cmd("xcrun simctl list devices available | grep iPhone | head -1")
        if out:
            device_line = out.strip()
            # Extract UUID
            import re
            match = re.search(r'\(([A-F0-9-]+)\)', device_line)
            if match:
                uuid = match.group(1)
                run_cmd(f"xcrun simctl boot {uuid}")
                log(f"Booted simulator: {uuid}")
        run_cmd("open -a Simulator")
        await asyncio.sleep(10)  # Wait for boot

    # Check prototype
    code, out, _ = run_cmd("lsof -i :3000")
    if "LISTEN" not in out:
        log("Starting prototype server...")
        run_cmd(f"cd {REPO_ROOT}/prototype && npm run dev &", timeout=5)
        await asyncio.sleep(5)

    # Check expo
    code, out, _ = run_cmd("lsof -i :8081")
    if "LISTEN" not in out and EXPO_APP_DIR.exists():
        log("Starting Expo server...")
        run_cmd(f"cd {EXPO_APP_DIR} && npm start &", timeout=5)
        await asyncio.sleep(5)

    log("Services ready")


async def scaffold_expo_app():
    """Delete old expo-app and create fresh scaffold."""
    log("Scaffolding fresh Expo app...")

    # Delete old
    if EXPO_APP_DIR.exists():
        log("Removing old expo-app...")
        run_cmd(f"rm -rf {EXPO_APP_DIR}")

    # Create new expo app
    log("Creating new Expo app with expo-router template...")
    code, out, err = run_cmd(
        f"cd {REPO_ROOT} && npx create-expo-app@latest expo-app --template tabs",
        timeout=300
    )

    if code != 0:
        log(f"Expo scaffold failed: {err}")
        # Try simpler approach
        run_cmd(f"cd {REPO_ROOT} && npx create-expo-app@latest expo-app", timeout=300)

    # Install additional dependencies
    log("Installing dependencies...")
    deps = [
        "expo-linear-gradient",
        "expo-blur",
        "expo-haptics",
        "expo-camera",
        "expo-image-picker",
        "expo-secure-store",
        "expo-file-system",
        "react-native-reanimated",
        "lucide-react-native",
        "react-native-svg",
    ]
    run_cmd(f"cd {EXPO_APP_DIR} && npx expo install {' '.join(deps)}", timeout=300)

    log("Expo app scaffolded")


async def run_builder(task: str, feedback: str = "", max_iterations: int = 3) -> str:
    """Run the builder agent with a specific task."""

    system_prompt = f"""You are a builder agent creating the Fincore.AI Expo app.

CRITICAL: You must create screens that are VISUALLY IDENTICAL to the Next.js prototype.

## Source of truth
Read the prototype: {REPO_ROOT}/prototype/src/app/page.tsx

## Strict rules
1. Use EXACT hex colors from prototype (not approximations)
2. Use EXACT spacing - convert rem to pixels (1rem = 16px)
3. Use EXACT gradient stops and angles
4. Use EXACT border-radius values
5. Use EXACT font sizes and weights
6. Match animations using react-native-reanimated

## Technical stack
- expo-router for navigation
- expo-linear-gradient for gradients
- expo-blur for blur effects
- expo-haptics for haptic feedback
- lucide-react-native for icons
- react-native-reanimated for animations

## Working directory
{EXPO_APP_DIR}

When you finish building, the screen should be testable in the iOS simulator.
"""

    full_prompt = task
    if feedback:
        full_prompt += f"\n\n## FEEDBACK FROM VISUAL COMPARISON - FIX THESE ISSUES:\n{feedback}"

    log(f"Running builder agent...")
    output_parts = []

    try:
        async for message in query(
            prompt=full_prompt,
            options=ClaudeAgentOptions(
                system_prompt=system_prompt,
                allowed_tools=["Read", "Edit", "Write", "Glob", "Grep", "Bash"],
                permission_mode="acceptEdits",
                cwd=str(REPO_ROOT),
                max_turns=50,
            ),
        ):
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if hasattr(block, "text") and block.text:
                        # Log truncated version
                        preview = block.text[:200].replace('\n', ' ')
                        log(f"  Builder: {preview}...")
                        output_parts.append(block.text)
            elif isinstance(message, ResultMessage):
                log(f"  Builder finished: {message.subtype}")

    except Exception as e:
        log(f"  Builder error: {e}")

    return "\n".join(output_parts)


async def compare_screenshots(screen: dict, sim_screenshot: Path) -> tuple[bool, str]:
    """Use Claude vision to compare simulator screenshot against requirements.

    Uses the Read tool which supports image files natively.
    """

    if not sim_screenshot or not sim_screenshot.exists():
        return False, "No simulator screenshot available"

    log("Comparing screenshot against requirements...")

    comparison_prompt = f"""Use the Read tool to look at this screenshot: {sim_screenshot}

This is supposed to be the {screen['name']} screen from our Expo app.

Compare what you see against these visual requirements:
{screen['visual_requirements']}

Be STRICT. Check:
1. Are the colors exactly right? (gradients, backgrounds, text colors)
2. Is the spacing and layout correct?
3. Are all required elements present and positioned correctly?
4. Are border-radius values correct (rounded corners)?
5. Does it look polished and professional?

IMPORTANT: Start your response with either "APPROVED:" or "NEEDS_WORK:"

If it matches the requirements well (90%+ match), respond with:
APPROVED: [brief description of what looks good]

If there are issues, respond with:
NEEDS_WORK: [specific list of what's wrong]
- Be specific about colors (use hex codes)
- Be specific about spacing (use pixels)
- Be specific about what elements are missing or wrong
- Give concrete fixes, not vague suggestions
"""

    result_text = ""

    try:
        async for message in query(
            prompt=comparison_prompt,
            options=ClaudeAgentOptions(
                system_prompt="You are a strict visual QA reviewer for mobile app UI. Use the Read tool to view images. Be precise and specific about visual differences.",
                allowed_tools=["Read"],
                permission_mode="default",
                cwd=str(REPO_ROOT),
                max_turns=3,
            ),
        ):
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if hasattr(block, "text"):
                        result_text += block.text

    except Exception as e:
        log(f"Comparison error: {e}")
        return False, f"Comparison failed: {e}. Check screenshot manually at {sim_screenshot}"

    if "APPROVED" in result_text.upper():
        return True, result_text
    else:
        return False, result_text


async def build_screen(screen: dict, screen_num: int, total: int) -> bool:
    """Build a single screen with iteration until it matches."""

    log(f"\n{'='*60}")
    log(f"BUILDING SCREEN {screen_num}/{total}: {screen['name']}")
    log(f"{'='*60}")

    max_iterations = 5
    feedback = ""

    for iteration in range(1, max_iterations + 1):
        log(f"\nIteration {iteration}/{max_iterations}")

        # Build task
        task = f"""Build the {screen['name']} screen for the Fincore.AI Expo app.

## Screen ID: {screen['id']}
## Target file: {screen['file']}

## Description
{screen['description']}

## Visual Requirements (MUST MATCH EXACTLY)
{screen['visual_requirements']}

## Reference
{screen['prototype_lines']}

Read the prototype at {REPO_ROOT}/prototype/src/app/page.tsx to see the exact implementation,
then create the Expo equivalent that looks identical.

After creating the file, make sure the app can compile by checking for TypeScript errors.
"""

        # Run builder
        await run_builder(task, feedback)

        # Give time for hot reload
        await asyncio.sleep(3)

        # Take screenshot
        screenshot = screenshot_simulator(f"{screen['id']}_v{iteration}")

        if not screenshot:
            log("Could not take screenshot, retrying...")
            await asyncio.sleep(5)
            screenshot = screenshot_simulator(f"{screen['id']}_v{iteration}_retry")

        if screenshot:
            # Compare
            approved, comparison_result = await compare_screenshots(screen, screenshot)

            if approved:
                log(f"✓ Screen APPROVED: {comparison_result[:100]}")
                return True
            else:
                log(f"Screen needs work: {comparison_result[:200]}...")
                feedback = comparison_result
        else:
            feedback = "Could not capture screenshot. Make sure the app is running in simulator and showing this screen."

    log(f"⚠ Screen {screen['name']} not approved after {max_iterations} iterations")
    return False


async def main():
    """Main supervisor loop."""

    # Initialize log
    LOG_FILE.unlink(missing_ok=True)
    log("="*60)
    log("FINCORE.AI AUTONOMOUS REBUILD SUPERVISOR")
    log("="*60)
    log(f"Started at {datetime.now()}")
    log(f"Will build {len(SCREENS)} screens")
    log("")

    try:
        # Setup
        await check_and_start_services()
        await scaffold_expo_app()

        # Start expo
        log("Starting Expo dev server...")
        run_cmd(f"cd {EXPO_APP_DIR} && npm start -- --ios &", timeout=5)
        await asyncio.sleep(30)  # Wait for app to load in simulator

        # Build each screen
        completed = []
        failed = []

        for i, screen in enumerate(SCREENS, 1):
            success = await build_screen(screen, i, len(SCREENS))

            if success:
                completed.append(screen['id'])
                log(f"✓ Completed: {screen['name']}")
            else:
                failed.append(screen['id'])
                log(f"✗ Failed: {screen['name']} (continuing to next)")

        # Summary
        log("\n" + "="*60)
        log("BUILD COMPLETE")
        log("="*60)
        log(f"Completed: {len(completed)}/{len(SCREENS)}")
        log(f"Successful: {', '.join(completed) if completed else 'None'}")
        log(f"Failed: {', '.join(failed) if failed else 'None'}")
        log(f"Finished at {datetime.now()}")

    except KeyboardInterrupt:
        log("\nInterrupted by user")
    except Exception as e:
        log(f"\nFatal error: {e}")
        import traceback
        log(traceback.format_exc())


if __name__ == "__main__":
    asyncio.run(main())
