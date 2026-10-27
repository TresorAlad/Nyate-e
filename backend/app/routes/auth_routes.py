from flask import Blueprint, jsonify, request

from app.config import Settings
from app.db import get_conn
from app.services.auth_tokens import create_access_token, decode_access_token
from app.services.user_auth import get_user_by_id, login_user, register_user, update_user_profile
from psycopg_pool import ConnectionPool

auth_bp = Blueprint('auth', __name__)


def _bearer_user_id(settings: Settings) -> str | None:
    header = request.headers.get('Authorization', '')
    if not header.startswith('Bearer '):
        return None
    token = header[7:].strip()
    if not token:
        return None
    return decode_access_token(settings, token)


def register_auth_routes(
    bp: Blueprint, pool: ConnectionPool, settings: Settings
) -> None:
    @bp.post('/auth/register')
    def register():
        payload = request.get_json(silent=True) or {}
        email = payload.get('email') or ''
        password = payload.get('password') or ''
        password_confirm = (
            payload.get('passwordConfirm') or payload.get('password_confirm') or ''
        )
        first_name = (payload.get('firstName') or payload.get('first_name') or '').strip()
        last_name = (payload.get('lastName') or payload.get('last_name') or '').strip()
        display_name = payload.get('displayName') or payload.get('display_name') or ''
        if first_name and last_name:
            display_name = f'{first_name} {last_name}'
        elif first_name:
            display_name = first_name
        elif last_name:
            display_name = last_name

        if password_confirm and password_confirm != password:
            return jsonify({'error': 'Les mots de passe ne correspondent pas.'}), 400

        try:
            with get_conn(pool) as conn:
                user = register_user(
                    conn,
                    email=str(email),
                    password=str(password),
                    display_name=str(display_name),
                    public_profile='citizen',
                )
        except ValueError as exc:
            return jsonify({'error': str(exc)}), 400

        token = create_access_token(settings, user['id'])
        return jsonify({'token': token, 'user': user}), 201

    @bp.post('/auth/login')
    def login():
        payload = request.get_json(silent=True) or {}
        email = (payload.get('email') or '').strip()
        password = payload.get('password') or ''
        if not email or not password:
            return jsonify({'error': 'E-mail et mot de passe requis.'}), 400

        try:
            with get_conn(pool) as conn:
                user = login_user(conn, email, password)
        except ValueError as exc:
            return jsonify({'error': str(exc)}), 401

        token = create_access_token(settings, user['id'])
        return jsonify({'token': token, 'user': user})

    @bp.get('/auth/me')
    def me():
        user_id = _bearer_user_id(settings)
        if not user_id:
            return jsonify({'error': 'Non authentifié.'}), 401

        with get_conn(pool) as conn:
            user = get_user_by_id(conn, user_id)
        if not user:
            return jsonify({'error': 'Compte introuvable.'}), 401
        return jsonify({'user': user})

    @bp.patch('/auth/me')
    def patch_me():
        user_id = _bearer_user_id(settings)
        if not user_id:
            return jsonify({'error': 'Non authentifié.'}), 401

        payload = request.get_json(silent=True) or {}
        try:
            with get_conn(pool) as conn:
                user = update_user_profile(
                    conn,
                    user_id,
                    display_name=payload.get('displayName'),
                    email=payload.get('email'),
                    public_profile=payload.get('publicProfile'),
                    current_password=payload.get('currentPassword'),
                    new_password=payload.get('newPassword'),
                )
        except ValueError as exc:
            return jsonify({'error': str(exc)}), 400

        return jsonify({'user': user})
