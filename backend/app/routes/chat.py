from flask import Blueprint, jsonify, request

from app.db import get_conn
from app.services.ollama_queue import QueueFullError, QueueWaitTimeoutError
from app.services.rag_service import RagService
from psycopg_pool import ConnectionPool

chat_bp = Blueprint("chat", __name__)


def register_chat_routes(bp: Blueprint, pool: ConnectionPool, rag: RagService) -> None:
    @bp.post("/chat")
    def chat():
        payload = request.get_json(silent=True) or {}
        question = (payload.get("question") or "").strip()
        if not question:
            return jsonify({"error": "Le champ question est obligatoire."}), 400

        top_k = payload.get("top_k")
        try:
            with get_conn(pool) as conn:
                result = rag.answer_question(conn, question, top_k=top_k)
        except QueueFullError as exc:
            return jsonify({"error": str(exc)}), 429
        except QueueWaitTimeoutError as exc:
            return jsonify({"error": str(exc)}), 503
        except Exception as exc:
            return jsonify({"error": f"Génération impossible: {exc}"}), 503

        return jsonify(result)
