from __future__ import annotations

import re

_CODE_FENCE_RE = re.compile(r"```[\s\S]*?```", re.MULTILINE)


def strip_code_blocks(text: str) -> str:
    cleaned = _CODE_FENCE_RE.sub("", text)
    cleaned = re.sub(r"`[^`]+`", "", cleaned)
    return cleaned.strip()


def clamp_citizen_answer(text: str, *, max_chars: int) -> str:
    if max_chars <= 0 or len(text) <= max_chars:
        return strip_code_blocks(text)
    trimmed = strip_code_blocks(text)[: max_chars - 1].rstrip()
    if trimmed and trimmed[-1].isalnum():
        trimmed += "…"
    return trimmed
