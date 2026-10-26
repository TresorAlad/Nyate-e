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
        payload = {
            "model": self.settings.ollama_chat_model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "stream": False,
            "options": {"temperature": 0.2},
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
