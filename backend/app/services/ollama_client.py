import json
from collections.abc import Iterator

import httpx

from app.config import Settings


class OllamaClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.base_url = settings.ollama_base_url.rstrip("/")

    def embed(self, text: str) -> list[float]:
        payload = {"model": self.settings.ollama_embed_model, "prompt": text}
        with httpx.Client(timeout=120.0) as client:
            response = client.post(f"{self.base_url}/api/embeddings", json=payload)
            response.raise_for_status()
            data = response.json()
        embedding = data.get("embedding")
        if not embedding:
            raise ValueError("Réponse Ollama sans embedding.")
        return embedding

    def chat(self, system: str, user: str) -> str:
        return self.complete(
            [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ]
        )

    def complete(
        self,
        messages: list[dict[str, str]],
        *,
        max_tokens: int | None = None,
    ) -> str:
        limit = max_tokens or self.settings.chat_max_tokens
        payload = {
            "model": self.settings.ollama_chat_model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": 0.35, "num_predict": limit},
        }
        with httpx.Client(timeout=self.settings.mistral_fallback_timeout_seconds) as client:
            response = client.post(f"{self.base_url}/api/chat", json=payload)
            response.raise_for_status()
            data = response.json()
        message = data.get("message") or {}
        content = message.get("content", "").strip()
        if not content:
            raise ValueError("Réponse Ollama vide.")
        return content

    def complete_stream(
        self,
        messages: list[dict[str, str]],
        *,
        max_tokens: int | None = None,
    ) -> Iterator[str]:
        limit = max_tokens or self.settings.chat_max_tokens
        payload = {
            "model": self.settings.ollama_chat_model,
            "messages": messages,
            "stream": True,
            "options": {"temperature": 0.35, "num_predict": limit},
        }
        with httpx.Client(
            timeout=self.settings.mistral_fallback_timeout_seconds
        ) as client:
            with client.stream(
                "POST",
                f"{self.base_url}/api/chat",
                json=payload,
            ) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if not line:
                        continue
                    data = json.loads(line)
                    message = data.get("message") or {}
                    chunk = message.get("content") or ""
                    if chunk:
                        yield chunk
                    if data.get("done"):
                        break
