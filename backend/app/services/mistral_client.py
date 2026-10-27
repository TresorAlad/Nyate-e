import httpx

from app.config import Settings


class MistralCloudClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def is_configured(self) -> bool:
        return bool(self.settings.mistral_api_key.strip())

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
        if not self.is_configured():
            raise ValueError("Clé API Mistral non configurée.")

        payload = {
            "model": self.settings.mistral_api_model,
            "messages": messages,
            "temperature": 0.35,
            "max_tokens": max_tokens or self.settings.chat_max_tokens,
        }
        headers = {
            "Authorization": f"Bearer {self.settings.mistral_api_key}",
            "Content-Type": "application/json",
        }
        with httpx.Client(timeout=self.settings.mistral_fallback_timeout_seconds) as client:
            response = client.post(
                "https://api.mistral.ai/v1/chat/completions",
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()

        choices = data.get("choices") or []
        if not choices:
            raise ValueError("Réponse Mistral API vide.")
        content = (choices[0].get("message") or {}).get("content", "").strip()
        if not content:
            raise ValueError("Réponse Mistral API sans contenu.")
        return content
