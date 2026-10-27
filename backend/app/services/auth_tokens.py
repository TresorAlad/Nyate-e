from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from app.config import Settings

TOKEN_SALT = 'nyatefe-auth-v1'
TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30


def _serializer(settings: Settings) -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(settings.secret_key, salt=TOKEN_SALT)


def create_access_token(settings: Settings, user_id: str) -> str:
    return _serializer(settings).dumps({'sub': user_id})


def decode_access_token(settings: Settings, token: str) -> str | None:
    try:
        payload = _serializer(settings).loads(
            token, max_age=TOKEN_MAX_AGE_SECONDS
        )
    except (BadSignature, SignatureExpired):
        return None
    if not isinstance(payload, dict):
        return None
    sub = payload.get('sub')
    return str(sub) if sub else None
