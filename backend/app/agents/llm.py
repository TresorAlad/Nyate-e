from __future__ import annotations

import json
import re
from collections.abc import Iterator
from typing import Any

from app.services.mistral_client import MistralCloudClient
from app.services.ollama_client import OllamaClient
from app.services.rodium_client import RodiumClient


def _extract_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", cleaned)
    if fence:
        cleaned = fence.group(1).strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        cleaned = cleaned[start : end + 1]
    parsed = json.loads(cleaned)
    if not isinstance(parsed, dict):
        raise ValueError("La sortie JSON doit etre un objet.")
    return parsed


def complete_messages(
    *,
    rodium: RodiumClient,
    ollama: OllamaClient,
    mistral: MistralCloudClient,
    chat_provider: str,
    mistral_fallback_enabled: bool,
    messages: list[dict[str, str]],
    max_tokens: int | None = None,
) -> tuple[str, str]:
    if chat_provider == "rodium" and rodium.is_configured():
        return "rodium", rodium.complete(messages, max_tokens=max_tokens)
    if chat_provider == "mistral" and mistral.is_configured():
        return "mistral_api", mistral.complete(messages, max_tokens=max_tokens)
    try:
        return "ollama", ollama.complete(messages, max_tokens=max_tokens)
    except Exception:
        if rodium.is_configured():
            return "rodium", rodium.complete(messages, max_tokens=max_tokens)
        if mistral_fallback_enabled and mistral.is_configured():
            return "mistral_api", mistral.complete(messages, max_tokens=max_tokens)
        raise


def complete_text(
    *,
    rodium: RodiumClient,
    ollama: OllamaClient,
    mistral: MistralCloudClient,
    chat_provider: str,
    mistral_fallback_enabled: bool,
    system: str,
    user: str,
    history: list[dict[str, str]] | None = None,
) -> tuple[str, str]:
    return complete_messages(
        rodium=rodium,
        ollama=ollama,
        mistral=mistral,
        chat_provider=chat_provider,
        mistral_fallback_enabled=mistral_fallback_enabled,
        messages=build_messages(system, user, history),
    )


def build_messages(
    system: str,
    user: str,
    history: list[dict[str, str]] | None = None,
) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = [{"role": "system", "content": system}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": user})
    return messages


def complete_text_stream(
    *,
    rodium: RodiumClient,
    ollama: OllamaClient,
    mistral: MistralCloudClient,
    chat_provider: str,
    mistral_fallback_enabled: bool,
    messages: list[dict[str, str]],
) -> tuple[str, Iterator[str]]:
    if chat_provider == "ollama":
        return "ollama", ollama.complete_stream(messages)

    if chat_provider == "rodium" and rodium.is_configured():
        text = rodium.complete(messages)
        return "rodium", iter([text])

    if chat_provider == "mistral" and mistral.is_configured():
        text = mistral.complete(messages)
        return "mistral_api", iter([text])

    try:
        return "ollama", ollama.complete_stream(messages)
    except Exception:
        if rodium.is_configured():
            text = rodium.complete(messages)
            return "rodium", iter([text])
        if mistral_fallback_enabled and mistral.is_configured():
            text = mistral.complete(messages)
            return "mistral_api", iter([text])
        raise


def complete_json(
    *,
    rodium: RodiumClient,
    ollama: OllamaClient,
    mistral: MistralCloudClient,
    chat_provider: str,
    mistral_fallback_enabled: bool,
    system: str,
    user: str,
    history: list[dict[str, str]] | None = None,
) -> tuple[dict[str, Any], str]:
    provider, text = complete_text(
        rodium=rodium,
        ollama=ollama,
        mistral=mistral,
        chat_provider=chat_provider,
        mistral_fallback_enabled=mistral_fallback_enabled,
        system=system,
        user=user,
        history=history,
    )
    try:
        return _extract_json(text), provider
    except (json.JSONDecodeError, ValueError):
        repair_user = (
            "Corrige et renvoie UNIQUEMENT un objet JSON valide, sans markdown:\n"
            f"{text[:2000]}"
        )
        provider2, text2 = complete_text(
            rodium=rodium,
            ollama=ollama,
            mistral=mistral,
            chat_provider=chat_provider,
            mistral_fallback_enabled=mistral_fallback_enabled,
            system=system,
            user=repair_user,
            history=None,
        )
        return _extract_json(text2), provider2
