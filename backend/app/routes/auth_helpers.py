from flask import request

from app.config import Settings
from app.services.auth_tokens import decode_access_token


def bearer_user_id(settings: Settings) -> str | None:
    header = request.headers.get('Authorization', '')
    if not header.startswith('Bearer '):
        return None
    token = header[7:].strip()
    if not token:
        return None
    return decode_access_token(settings, token)
