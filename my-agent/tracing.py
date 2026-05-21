"""
Langfuse tracing module for Fincore.AI observability.

Provides separate Langfuse clients for Chat and Camera services,
routed to their respective project dashboards.
"""

import os
import logging
from functools import lru_cache
from langfuse import Langfuse

logger = logging.getLogger("fincore.tracing")

# Cache clients to avoid re-initialization on every call
_chat_client: Langfuse | None = None
_camera_client: Langfuse | None = None


def get_chat_client() -> Langfuse | None:
    """Get or initialize the Langfuse client for the Chat project (fincore-chat)."""
    global _chat_client

    if _chat_client is not None:
        return _chat_client

    secret_key = os.getenv("LANGFUSE_CHAT_SK")
    public_key = os.getenv("LANGFUSE_CHAT_PK")
    base_url = os.getenv("LANGFUSE_BASE_URL", "https://cloud.langfuse.com")

    if not secret_key or not public_key:
        logger.warning("LANGFUSE_CHAT_SK/PK not set - Chat tracing disabled")
        return None

    try:
        _chat_client = Langfuse(
            secret_key=secret_key,
            public_key=public_key,
            host=base_url,
        )
        logger.info("Langfuse Chat client initialized")
        return _chat_client
    except Exception as e:
        logger.error(f"Failed to initialize Langfuse Chat client: {e}")
        return None


def get_camera_client() -> Langfuse | None:
    """Get or initialize the Langfuse client for the Camera project (fincore-camera)."""
    global _camera_client

    if _camera_client is not None:
        return _camera_client

    secret_key = os.getenv("LANGFUSE_CAMERA_SK")
    public_key = os.getenv("LANGFUSE_CAMERA_PK")
    base_url = os.getenv("LANGFUSE_BASE_URL", "https://cloud.langfuse.com")

    if not secret_key or not public_key:
        logger.warning("LANGFUSE_CAMERA_SK/PK not set - Camera tracing disabled")
        return None

    try:
        _camera_client = Langfuse(
            secret_key=secret_key,
            public_key=public_key,
            host=base_url,
        )
        logger.info("Langfuse Camera client initialized")
        return _camera_client
    except Exception as e:
        logger.error(f"Failed to initialize Langfuse Camera client: {e}")
        return None


def flush_all():
    """Flush any pending traces to Langfuse (call on shutdown)."""
    if _chat_client:
        try:
            _chat_client.flush()
        except Exception as e:
            logger.error(f"Failed to flush Chat traces: {e}")

    if _camera_client:
        try:
            _camera_client.flush()
        except Exception as e:
            logger.error(f"Failed to flush Camera traces: {e}")
