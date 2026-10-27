from flask import Blueprint, jsonify, request

from app.config import Settings
from app.db import get_conn
from app.routes.auth_helpers import bearer_user_id
from app.services.conversation_store import (
    clear_conversations,
    delete_conversation,
    get_conversation,
    list_conversation_summaries,
    upsert_conversation,
)
from psycopg_pool import ConnectionPool

conversations_bp = Blueprint('conversations', __name__)


def register_conversation_routes(
    bp: Blueprint, pool: ConnectionPool, settings: Settings
) -> None:
    def require_user_id():
        user_id = bearer_user_id(settings)
        if not user_id:
            return None, (jsonify({'error': 'Authentification requise.'}), 401)
        return user_id, None

    @bp.get('/conversations')
    def list_conversations():
        user_id, err = require_user_id()
        if err:
            return err
        with get_conn(pool) as conn:
            items = list_conversation_summaries(conn, user_id)
        return jsonify({'conversations': items})

    @bp.get('/conversations/<conversation_id>')
    def read_conversation(conversation_id: str):
        user_id, err = require_user_id()
        if err:
            return err
        with get_conn(pool) as conn:
            item = get_conversation(conn, user_id, conversation_id)
        if not item:
            return jsonify({'error': 'Conversation introuvable.'}), 404
        return jsonify({'conversation': item})

    @bp.put('/conversations/<conversation_id>')
    def save_conversation(conversation_id: str):
        user_id, err = require_user_id()
        if err:
            return err
        payload = request.get_json(silent=True) or {}
        payload['id'] = conversation_id
        try:
            with get_conn(pool) as conn:
                item = upsert_conversation(conn, user_id, payload)
                conn.commit()
        except PermissionError as exc:
            return jsonify({'error': str(exc)}), 403
        except ValueError as exc:
            return jsonify({'error': str(exc)}), 400
        except Exception as exc:
            return jsonify({'error': f'Enregistrement impossible: {exc}'}), 503
        return jsonify({'conversation': item})

    @bp.delete('/conversations/<conversation_id>')
    def remove_conversation(conversation_id: str):
        user_id, err = require_user_id()
        if err:
            return err
        with get_conn(pool) as conn:
            deleted = delete_conversation(conn, user_id, conversation_id)
            conn.commit()
        if not deleted:
            return jsonify({'error': 'Conversation introuvable.'}), 404
        return jsonify({'ok': True})

    @bp.delete('/conversations')
    def remove_all_conversations():
        user_id, err = require_user_id()
        if err:
            return err
        with get_conn(pool) as conn:
            count = clear_conversations(conn, user_id)
            conn.commit()
        return jsonify({'deleted': count})
