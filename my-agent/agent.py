import asyncio
import sys
import os
from claude_agent_sdk import query, ClaudeAgentOptions, AssistantMessage, ResultMessage

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

SYSTEM_CONTEXT = """You are a full-stack developer agent working on Fincore.AI — a fintech app
that combines Big Five personality assessment with AI financial coaching.

Repo layout:
  prototype/   — Next.js 16 + React 19 + TypeScript + Tailwind CSS frontend
  my-agent/    — Python backend: FastAPI (server.py), Claude coaching (coach.py),
                 Big Five scorer (scorer.py), utilities (utils.py)

Key tech: claude-agent-sdk, FastAPI/uvicorn, boto3 (S3 profiles), Next.js App Router.

When running shell commands, always cd to the relevant directory first.
Frontend commands: cd prototype && npm run dev / npm run build / npm run lint
Backend commands: cd my-agent && uvicorn server:app --reload
"""


async def run_agent(task: str) -> None:
    print(f"\nTask: {task}\n{'─' * 60}")

    async for message in query(
        prompt=task,
        options=ClaudeAgentOptions(
            system_prompt=SYSTEM_CONTEXT,
            allowed_tools=["Read", "Edit", "Write", "Glob", "Grep", "Bash"],
            permission_mode="acceptEdits",
            cwd=REPO_ROOT,
        ),
    ):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if hasattr(block, "text") and block.text:
                    print(block.text)
                elif hasattr(block, "name"):
                    print(f"  [tool: {block.name}]")
        elif isinstance(message, ResultMessage):
            print(f"\n{'─' * 60}\nDone ({message.subtype})")


def main() -> None:
    if len(sys.argv) > 1:
        task = " ".join(sys.argv[1:])
    else:
        print("Fincore.AI Dev Agent")
        print("Enter a task (or Ctrl+C to exit):")
        task = input("> ").strip()
        if not task:
            print("No task provided.")
            sys.exit(1)

    asyncio.run(run_agent(task))


if __name__ == "__main__":
    main()
