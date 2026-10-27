import httpx

from app.config import Settings


class RodiumClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def is_configured(self) -> bool:
        return bool(self.settings.rodium_api_key.strip())

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
            raise ValueError("Clé API Rodium non configurée.")

        limit = max_tokens or self.settings.chat_max_tokens
        cap = min(limit, self.settings.rodium_max_tokens)
        payload = {
            "model": self.settings.rodium_chat_model,
            "messages": messages,
            "temperature": 0.35,
            "max_tokens": cap,
        }
        headers = {
            "Authorization": f"Bearer {self.settings.rodium_api_key}",
            "Content-Type": "application/json",
        }
        base = self.settings.rodium_api_base_url.rstrip("/")
        timeout = self.settings.rodium_timeout_seconds
        with httpx.Client(timeout=timeout) as client:
            response = client.post(
                f"{base}/chat/completions",
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()

        choices = data.get("choices") or []
        if not choices:
            raise ValueError("Réponse Rodium API vide.")
        content = (choices[0].get("message") or {}).get("content", "").strip()
        if not content:
            raise ValueError("Réponse Rodium API sans contenu.")
        return content
