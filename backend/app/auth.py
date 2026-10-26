import secrets

from flask import Request

from app.config import Settings


def is_ingest_authorized(settings: Settings, request: Request) -> bool:
    if not settings.ingest_api_key:
        return False
    provided = request.headers.get('X-Nyatefe-Ingest-Key', '')
    return secrets.compare_digest(provided, settings.ingest_api_key)
