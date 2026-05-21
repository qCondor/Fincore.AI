"""
Supervisor Agent for Fincore.AI Expo rebuild.

This agent manages the build process, ensuring the builder agent stays on track
with visual fidelity to the prototype. It:
1. Assigns one screen at a time
2. Captures screenshots of prototype and simulator
3. Compares them and provides feedback
4. Only approves moving to next screen when current one matches
"""

import asyncio
import subprocess
import sys
import os
import time
from pathlib import Path
from claude_agent_sdk import query, ClaudeAgentOptions, AssistantMessage, ResultMessage

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SCREENSHOTS_DIR = Path(REPO_ROOT) / "build-screenshots"

SCREENS = [
    ("splash", "The animated splash screen with Fincore logo"),
    ("login", "Login carousel with 4 slides, social auth buttons, terms checkbox"),
    ("info", "Personal info form - name, email, dob fields"),
    ("survey", "15 question personality survey with progress bar"),
    ("processing", "Processing animation after survey"),
    ("results", "Big Five personality results breakdown"),
    ("scan", "Camera scan tab with capture button"),
    ("scan-result", "Scan result with product analysis"),
    ("faith", "AI chat tab with conversation starters"),
    ("profile", "Profile tab with personality traits"),
]

SUPERVISOR_PROMPT = """You are a supervisor agent managing the Fincore.AI Expo app rebuild.

Your job is to ensure the build agent creates an app that is VISUALLY IDENTICAL to the Next.js prototype.

## Your tools
- You can take screenshots of the prototype (localhost:3000)
- You can take screenshots of the iOS simulator
- You can run the builder agent with specific instructions
- You can compare screenshots and provide feedback

## Rules
1. Work ONE SCREEN at a time
2. Never approve a screen until it visually matches the prototype
3. Be specific about what doesn't match: colors, spacing, fonts, animations, gradients
4. The builder should not move to the next screen until you approve

## Current screen queue
{screen_queue}

## Commands available to you
- screenshot_prototype(screen_name): Capture the prototype at that screen
- screenshot_simulator(): Capture current iOS simulator state
- run_builder(instructions): Run the builder agent with specific task
- compare_and_feedback(prototype_path, simulator_path): Analyze visual differences
- approve_screen(screen_name): Mark screen as complete, move to next

Start by checking if the simulator is ready and the prototype is running.
"""

BUILDER_PROMPT = """You are a builder agent creating the Fincore.AI Expo app.

Your job is to build React Native screens that are PIXEL-PERFECT matches to the Next.js prototype.

## Source of truth
- /Users/mycomputer/Fincore.AI/prototype/src/app/page.tsx

## Rules
1. Match EXACT colors - use the same hex values
2. Match EXACT spacing - convert rem/px appropriately
3. Match EXACT gradients - same colors, same stops, same angles
4. Match EXACT border-radius values
5. Match EXACT typography - weights, sizes, line heights
6. Match animations - use react-native-reanimated for 60fps
7. Match shadows - use proper shadow props or shadow libraries
8. Match blur effects - use expo-blur

## Current task from supervisor
{task}

## Feedback from supervisor
{feedback}

Build only what is requested. Do not proceed to other screens.
"""


async def take_screenshot_simulator(name: str) -> str:
    """Take a screenshot of the iOS simulator."""
    SCREENSHOTS_DIR.mkdir(exist_ok=True)
    output_path = SCREENSHOTS_DIR / f"simulator_{name}_{int(time.time())}.png"

    result = subprocess.run(
        ["xcrun", "simctl", "io", "booted", "screenshot", str(output_path)],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        return f"Error: {result.stderr}"

    return str(output_path)


async def take_screenshot_web(url: str, name: str) -> str:
    """Take a screenshot of a web page using screencapture."""
    SCREENSHOTS_DIR.mkdir(exist_ok=True)
    output_path = SCREENSHOTS_DIR / f"prototype_{name}_{int(time.time())}.png"

    script = f'''
    tell application "Google Chrome"
        if not (exists window 1) then
            make new window
        end if
        set URL of active tab of window 1 to "{url}"
        delay 2
    end tell
    do shell script "screencapture -l $(osascript -e 'tell app \\"Google Chrome\\" to id of window 1') {output_path}"
    '''

    result = subprocess.run(["osascript", "-e", script], capture_output=True, text=True)

    if result.returncode != 0:
        return f"Error: {result.stderr}"

    return str(output_path)


async def check_simulator_ready() -> bool:
    """Check if iOS simulator is booted."""
    result = subprocess.run(
        ["xcrun", "simctl", "list", "devices", "booted"],
        capture_output=True,
        text=True
    )
    return "Booted" in result.stdout


async def check_prototype_running() -> bool:
    """Check if prototype is running on port 3000."""
    result = subprocess.run(
        ["lsof", "-i", ":3000"],
        capture_output=True,
        text=True
    )
    return "LISTEN" in result.stdout


async def run_builder_agent(task: str, feedback: str = "") -> str:
    """Run the builder agent with a specific task."""
    prompt = BUILDER_PROMPT.format(task=task, feedback=feedback)
    output = []

    async for message in query(
        prompt=task,
        options=ClaudeAgentOptions(
            system_prompt=prompt,
            allowed_tools=["Read", "Edit", "Write", "Glob", "Grep", "Bash"],
            permission_mode="acceptEdits",
            cwd=REPO_ROOT,
        ),
    ):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if hasattr(block, "text") and block.text:
                    output.append(block.text)
                    print(f"  [builder] {block.text[:100]}...")
        elif isinstance(message, ResultMessage):
            output.append(f"Builder finished: {message.subtype}")

    return "\n".join(output)


async def run_supervisor() -> None:
    """Main supervisor loop."""
    print("=" * 60)
    print("FINCORE.AI EXPO REBUILD SUPERVISOR")
    print("=" * 60)

    # Check prerequisites
    print("\nChecking prerequisites...")

    proto_running = await check_prototype_running()
    print(f"  Prototype (localhost:3000): {'✓ Running' if proto_running else '✗ Not running'}")

    sim_ready = await check_simulator_ready()
    print(f"  iOS Simulator: {'✓ Booted' if sim_ready else '✗ Not booted'}")

    if not proto_running:
        print("\n⚠ Start the prototype first: cd prototype && npm run dev")

    if not sim_ready:
        print("\n⚠ Boot the iOS simulator first. Checking for available simulators...")
        result = subprocess.run(
            ["xcrun", "simctl", "list", "devices", "available"],
            capture_output=True,
            text=True
        )
        print(result.stdout[:500])

    if not proto_running or not sim_ready:
        print("\nFix the above issues and run again.")
        return

    print("\n✓ All prerequisites met. Starting rebuild...\n")

    # Build screen queue display
    screen_queue = "\n".join([f"  {i+1}. {name}: {desc}" for i, (name, desc) in enumerate(SCREENS)])

    completed_screens = []
    current_screen_idx = 0

    while current_screen_idx < len(SCREENS):
        screen_name, screen_desc = SCREENS[current_screen_idx]

        print(f"\n{'=' * 60}")
        print(f"SCREEN {current_screen_idx + 1}/{len(SCREENS)}: {screen_name}")
        print(f"Description: {screen_desc}")
        print("=" * 60)

        # Run supervisor agent to manage this screen
        supervisor_task = f"""
You are supervising the build of the '{screen_name}' screen.

Description: {screen_desc}

Completed screens: {completed_screens if completed_screens else 'None yet'}

Steps:
1. First, take a screenshot of the prototype showing this screen
2. Instruct the builder to create/fix this screen in Expo
3. Take a screenshot of the simulator
4. Compare the screenshots - be VERY specific about differences
5. If there are differences, give specific feedback and have builder fix
6. Repeat until the screens match
7. Only then approve and move to next screen

Be strict. The goal is pixel-perfect visual fidelity.
"""

        async for message in query(
            prompt=supervisor_task,
            options=ClaudeAgentOptions(
                system_prompt=SUPERVISOR_PROMPT.format(screen_queue=screen_queue),
                allowed_tools=["Read", "Bash", "Glob", "Grep"],
                permission_mode="default",
                cwd=REPO_ROOT,
            ),
        ):
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if hasattr(block, "text") and block.text:
                        print(block.text)
            elif isinstance(message, ResultMessage):
                if "approve" in str(message).lower() or message.subtype == "success":
                    completed_screens.append(screen_name)
                    current_screen_idx += 1
                    print(f"\n✓ Screen '{screen_name}' approved!")

    print("\n" + "=" * 60)
    print("BUILD COMPLETE!")
    print("=" * 60)
    print(f"All {len(SCREENS)} screens have been built and approved.")


def main() -> None:
    print("\nFincore.AI Expo Rebuild Supervisor")
    print("This will manage the builder agent to create a pixel-perfect Expo app.\n")

    if "--builder" in sys.argv:
        # Direct builder mode for testing
        task = " ".join([a for a in sys.argv[1:] if a != "--builder"])
        asyncio.run(run_builder_agent(task))
    else:
        asyncio.run(run_supervisor())


if __name__ == "__main__":
    main()
