"""Claude calls with JSON-schema structured output.

Every call returns parsed JSON or raises LlmError; callers fall back to offline behavior.
"""

import json
import os

import anthropic

CHAT_MODEL = os.environ.get("PIP_CHAT_MODEL", "claude-opus-5-5")
WORK_MODEL = os.environ.get("PIP_WORK_MODEL", "claude-opus-5-5")
CHAT_EFFORT = os.environ.get("PIP_CHAT_EFFORT", "low")
WORK_EFFORT = os.environ.get("PIP_WORK_EFFORT", "medium")

_client: anthropic.AsyncAnthropic | None = None
_use_fallbacks = os.environ.get("PIP_SERVER_FALLBACKS", "1") == "1"


class LlmError(Exception):
    pass


def forced_offline() -> bool:
    return os.environ.get("PIP_FORCE_OFFLINE") == "1"


def available() -> bool:
    return not forced_offline() and bool(os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN"))


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(timeout=30.0, max_retries=0)
    return _client


def obj(properties: dict, required: list[str] | None = None) -> dict:
    """JSON-schema object with every property required and no extras (structured-output rules)."""
    return {
        "type": "object",
        "properties": properties,
        "required": required if required is not None else list(properties),
        "additionalProperties": False,
    }


async def structured(system: str, messages: list[dict], schema: dict, *, model: str,
                     effort: str, max_tokens: int = 2000, timeout: float = 30.0) -> dict:
    """timeout is per call (chat 12s, quiz 30s, draft 45s); a timeout raises LlmError."""
    global _use_fallbacks
    if not available():
        raise LlmError("no Claude credentials configured")
    params = {
        "model": model,
        "max_tokens": max_tokens,
        # The system prompt is the stable prefix; keep volatile state in messages.
        "system": [{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}],
        "messages": messages,
        "output_config": {"effort": effort, "format": {"type": "json_schema", "schema": schema}},
    }
    client = _get_client().with_options(timeout=timeout, max_retries=0)
    try:
        if _use_fallbacks:
            try:
                response = await client.beta.messages.create(
                    betas=["server-side-fallback-2026-07-01"], fallbacks="default", **params)
            except anthropic.BadRequestError as e:
                # Only a 400 about fallbacks/beta means the proxy lacks them: stop asking.
                if not any(w in str(e).lower() for w in ("fallback", "beta")):
                    raise
                _use_fallbacks = False
                response = await client.messages.create(**params)
        else:
            response = await client.messages.create(**params)
    except anthropic.RateLimitError as e:
        raise LlmError("rate limited") from e
    except anthropic.APITimeoutError as e:
        raise LlmError("timeout") from e
    except anthropic.APIStatusError as e:
        raise LlmError(f"API error {e.status_code}") from e
    except anthropic.APIConnectionError as e:
        raise LlmError("network error") from e

    if response.stop_reason == "refusal":
        raise LlmError("refused")
    if response.stop_reason == "max_tokens":
        raise LlmError("response cut off")
    text = next((b.text for b in response.content if b.type == "text"), None)
    if not text:
        raise LlmError("empty response")
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise LlmError("invalid JSON") from e
