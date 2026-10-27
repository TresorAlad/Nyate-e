from __future__ import annotations

import json
from typing import Any

from psycopg import Connection

MAX_CONVERSATIONS_PER_USER = 30


def _row_to_summary(row: dict[str, Any]) -> dict[str, Any]:
    return {
        'id': str(row['id']),
        'title': row['title'],
        'updatedAt': int(row['updated_at_ms']),
    }


def list_conversation_summaries(
    conn: Connection[Any], user_id: str
) -> list[dict[str, Any]]:
    rows = conn.execute(
        """
        SELECT id, title, updated_at_ms
        FROM chat_conversations
        WHERE user_id = %s
        ORDER BY updated_at_ms DESC
        LIMIT %s
        """,
        (user_id, MAX_CONVERSATIONS_PER_USER),
    ).fetchall()
    return [_row_to_summary(row) for row in rows]


def get_conversation(
    conn: Connection[Any], user_id: str, conversation_id: str
) -> dict[str, Any] | None:
    header = conn.execute(
        """
        SELECT id, title, updated_at_ms
        FROM chat_conversations
        WHERE id = %s AND user_id = %s
        """,
        (conversation_id, user_id),
    ).fetchone()
    if not header:
        return None

    turn_rows = conn.execute(
        """
        SELECT id, question, status, answer, error
        FROM chat_turns
        WHERE conversation_id = %s
        ORDER BY position ASC
        """,
        (conversation_id,),
    ).fetchall()

    turns: list[dict[str, Any]] = []
    for row in turn_rows:
        answer = row['answer']
        if isinstance(answer, str):
            answer = json.loads(answer)
        turns.append(
            {
                'id': str(row['id']),
                'question': row['question'],
                'status': row['status'],
                'answer': answer,
                'error': row['error'],
            }
        )

    return {
        'id': str(header['id']),
        'title': header['title'],
        'updatedAt': int(header['updated_at_ms']),
        'turns': turns,
    }


def upsert_conversation(
    conn: Connection[Any], user_id: str, payload: dict[str, Any]
) -> dict[str, Any]:
    conversation_id = str(payload.get('id') or '').strip()
    title = str(payload.get('title') or '').strip()
    updated_at_ms = payload.get('updatedAt')
    raw_turns = payload.get('turns')

    if not conversation_id or not title:
        raise ValueError('id et title sont obligatoires.')
    if not isinstance(updated_at_ms, (int, float)):
        raise ValueError('updatedAt invalide.')
    if not isinstance(raw_turns, list):
        raise ValueError('turns doit être une liste.')

    updated_at_ms = int(updated_at_ms)

    existing = conn.execute(
        'SELECT user_id FROM chat_conversations WHERE id = %s',
        (conversation_id,),
    ).fetchone()
    if existing and str(existing['user_id']) != user_id:
        raise PermissionError('Conversation inaccessible.')

    conn.execute(
        """
        INSERT INTO chat_conversations (id, user_id, title, updated_at_ms)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            updated_at_ms = EXCLUDED.updated_at_ms,
            updated_at = NOW()
        WHERE chat_conversations.user_id = EXCLUDED.user_id
        """,
        (conversation_id, user_id, title, updated_at_ms),
    )

    conn.execute(
        'DELETE FROM chat_turns WHERE conversation_id = %s',
        (conversation_id,),
    )

    for index, item in enumerate(raw_turns):
        if not isinstance(item, dict):
            continue
        turn_id = str(item.get('id') or '').strip()
        question = str(item.get('question') or '').strip()
        status = str(item.get('status') or 'ok')
        if status not in ('ok', 'error'):
            status = 'ok'
        if not turn_id or not question:
            continue
        answer = item.get('answer')
        error = item.get('error')
        answer_json = json.dumps(answer) if answer is not None else None
        conn.execute(
            """
            INSERT INTO chat_turns (id, conversation_id, position, question, status, answer, error)
            VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s)
            """,
            (turn_id, conversation_id, index, question, status, answer_json, error),
        )

    _trim_old_conversations(conn, user_id)

    result = get_conversation(conn, user_id, conversation_id)
    if not result:
        raise RuntimeError('Conversation introuvable après enregistrement.')
    return result


def _trim_old_conversations(conn: Connection[Any], user_id: str) -> None:
    conn.execute(
        """
        DELETE FROM chat_conversations
        WHERE user_id = %s
          AND id NOT IN (
            SELECT id FROM chat_conversations
            WHERE user_id = %s
            ORDER BY updated_at_ms DESC
            LIMIT %s
          )
        """,
        (user_id, user_id, MAX_CONVERSATIONS_PER_USER),
    )


def delete_conversation(
    conn: Connection[Any], user_id: str, conversation_id: str
) -> bool:
    cur = conn.execute(
        """
        DELETE FROM chat_conversations
        WHERE id = %s AND user_id = %s
        """,
        (conversation_id, user_id),
    )
    return cur.rowcount > 0


def clear_conversations(conn: Connection[Any], user_id: str) -> int:
    cur = conn.execute(
        'DELETE FROM chat_conversations WHERE user_id = %s',
        (user_id,),
    )
    return cur.rowcount
