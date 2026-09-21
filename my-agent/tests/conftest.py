"""Load .env before any app module is imported.

auth.py reads FINCORE_SESSION_SECRET at import time, and only server.py calls
load_dotenv() -- so importing auth first would blow up on a KeyError.
"""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))

env_path = BACKEND_ROOT / ".env"
if env_path.exists():
    load_dotenv(env_path)
