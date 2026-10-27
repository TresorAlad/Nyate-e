from typing import Any

from psycopg import Connection
from werkzeug.security import check_password_hash, generate_password_hash

from app.config import Settings

PUBLIC_PROFILES = frozenset({'citizen', 'student', 'enterprise', 'jurist'})
ROLES = frozenset({'citizen', 'cabinet', 'admin'})


def role_from_public_profile(profile: str) -> str:
    return 'cabinet' if profile == 'jurist' else 'citizen'


def normalize_email(email: str) -> str:
    return email.strip().lower()


def row_to_user(row: dict[str, Any]) -> dict[str, Any]:
    return {
        'id': str(row['id']),
        'email': row['email'],
        'displayName': row['display_name'],
        'role': row['role'],
        'publicProfile': row['public_profile'],
    }


def get_user_by_id(conn: Connection[Any], user_id: str) -> dict[str, Any] | None:
    row = conn.execute(
        """
        SELECT id, email, display_name, role, public_profile
        FROM app_users
        WHERE id = %s
        """,
        (user_id,),
    ).fetchone()
    return row_to_user(row) if row else None


def register_user(
    conn: Connection[Any],
    *,
    email: str,
    password: str,
    display_name: str,
    public_profile: str,
) -> dict[str, Any]:
    normalized = normalize_email(email)
    if len(normalized) < 5 or '@' not in normalized:
        raise ValueError('Adresse e-mail invalide.')
    if len(password) < 8:
        raise ValueError('Le mot de passe doit contenir au moins 8 caractères.')
    name = display_name.strip()
    if not name:
        raise ValueError('Indiquez votre prénom et votre nom.')
    if public_profile not in PUBLIC_PROFILES:
        raise ValueError('Profil public invalide.')

    role = 'citizen'
    public_profile = 'citizen'

    exists = conn.execute(
        'SELECT 1 FROM app_users WHERE lower(email) = %s',
        (normalized,),
    ).fetchone()
    if exists:
        raise ValueError('Un compte existe déjà avec cette adresse e-mail.')

    row = conn.execute(
        """
        INSERT INTO app_users (email, password_hash, display_name, role, public_profile)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id, email, display_name, role, public_profile
        """,
        (
            normalized,
            generate_password_hash(password),
            name,
            role,
            public_profile,
        ),
    ).fetchone()
    conn.commit()
    return row_to_user(row)


def login_user(
    conn: Connection[Any], email: str, password: str
) -> dict[str, Any]:
    normalized = normalize_email(email)
    row = conn.execute(
        """
        SELECT id, email, display_name, role, public_profile, password_hash
        FROM app_users
        WHERE lower(email) = %s
        """,
        (normalized,),
    ).fetchone()
    if not row or not check_password_hash(row['password_hash'], password):
        raise ValueError('Identifiants incorrects.')
    return row_to_user(row)


def update_user_profile(
    conn: Connection[Any],
    user_id: str,
    *,
    display_name: str | None = None,
    email: str | None = None,
    public_profile: str | None = None,
    current_password: str | None = None,
    new_password: str | None = None,
) -> dict[str, Any]:
    row = conn.execute(
        """
        SELECT id, email, display_name, role, public_profile, password_hash
        FROM app_users
        WHERE id = %s
        """,
        (user_id,),
    ).fetchone()
    if not row:
        raise ValueError('Compte introuvable.')

    next_email = row['email']
    next_name = row['display_name']
    next_profile = row['public_profile']
    next_role = row['role']
    next_hash = row['password_hash']

    email_changed = email is not None and normalize_email(email) != row['email']
    password_change = bool(new_password)

    if email_changed or password_change:
        if not current_password:
            raise ValueError('Saisissez votre mot de passe actuel pour confirmer.')
        if not check_password_hash(row['password_hash'], current_password):
            raise ValueError('Le mot de passe actuel est incorrect.')

    if display_name is not None:
        name = display_name.strip()
        if not name:
            raise ValueError('Indiquez votre nom ou celui de votre structure.')
        next_name = name

    if email is not None:
        normalized = normalize_email(email)
        if len(normalized) < 5 or '@' not in normalized:
            raise ValueError('Adresse e-mail invalide.')
        taken = conn.execute(
            """
            SELECT 1 FROM app_users
            WHERE lower(email) = %s AND id <> %s
            """,
            (normalized, user_id),
        ).fetchone()
        if taken:
            raise ValueError('Un compte existe déjà avec cette adresse e-mail.')
        next_email = normalized

    if public_profile is not None:
        if public_profile not in PUBLIC_PROFILES:
            raise ValueError('Profil public invalide.')
        next_profile = public_profile
        if row['role'] != 'admin':
            next_role = role_from_public_profile(public_profile)

    if new_password:
        if len(new_password) < 8:
            raise ValueError(
                'Le nouveau mot de passe doit contenir au moins 8 caractères.'
            )
        next_hash = generate_password_hash(new_password)

    updated = conn.execute(
        """
        UPDATE app_users
        SET email = %s,
            display_name = %s,
            role = %s,
            public_profile = %s,
            password_hash = %s
        WHERE id = %s
        RETURNING id, email, display_name, role, public_profile
        """,
        (next_email, next_name, next_role, next_profile, next_hash, user_id),
    ).fetchone()
    conn.commit()
    return row_to_user(updated)
