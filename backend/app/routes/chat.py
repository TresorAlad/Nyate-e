import json

from flask import Blueprint, Response, jsonify, request, stream_with_context

from app.config import Settings
from app.db import get_conn
from app.services.agent_graph_service import AgentGraphService
from app.services.chat_intent import is_non_legal_off_topic, needs_legal_rag
from app.services.citizen_responses import OUT_OF_SCOPE_ANSWER
from app.services.ollama_queue import QueueFullError, QueueWaitTimeoutError
from app.services.rag_service import RagService, _sanitize_history
from psycopg_pool import ConnectionPool

chat_bp = Blueprint("chat", __name__)


def _parse_chat_payload(payload: dict) -> tuple[str, list[dict[str, str]], int | None]:
    question = (payload.get("question") or "").strip()
    top_k = payload.get("top_k")
    raw_history = payload.get("history")
    history: list[dict[str, str]] = []
    if isinstance(raw_history, list):
        for item in raw_history:
            if isinstance(item, dict):
                history.append(
                    {
                        "role": str(item.get("role", "")),
                        "content": str(item.get("content", "")),
                    }
                )
    return question, history, top_k


def register_chat_routes(
    bp: Blueprint,
    pool: ConnectionPool,
    rag: RagService,
    settings: Settings,
    agent_graph: AgentGraphService | None = None,
) -> None:
    @bp.post("/chat")
    def chat():
        payload = request.get_json(silent=True) or {}
        question, history, top_k = _parse_chat_payload(payload)
        if not question:
            return jsonify({"error": "Le champ question est obligatoire."}), 400

        sanitized = _sanitize_history(history)

        if is_non_legal_off_topic(question):
            return jsonify(
                {
                    "answer": OUT_OF_SCOPE_ANSWER,
                    "provider": settings.chat_provider,
                    "sources": [],
                    "mode": "clarification",
                }
            )

        try:
            with get_conn(pool) as conn:
                if not needs_legal_rag(question, sanitized):
                    result = rag.answer_small_talk(question, sanitized)
                elif settings.agent_graph_enabled and agent_graph is not None:
                    result = agent_graph.run(
                        conn, question, history=sanitized, top_k=top_k
                    )
                else:
                    result = rag.answer_question(
                        conn, question, top_k=top_k, history=sanitized
                    )
        except QueueFullError as exc:
            return jsonify({"error": str(exc)}), 429
        except QueueWaitTimeoutError as exc:
            return jsonify({"error": str(exc)}), 503
        except Exception as exc:
            return jsonify({"error": f"Génération impossible: {exc}"}), 503

        return jsonify(result)

    @bp.post("/chat/stream")
    def chat_stream():
        payload = request.get_json(silent=True) or {}
        question, history, top_k = _parse_chat_payload(payload)
        if not question:
            return jsonify({"error": "Le champ question est obligatoire."}), 400

        sanitized = _sanitize_history(history)

        if not settings.agent_graph_enabled or agent_graph is None:
            return jsonify(
                {"error": "Le streaming requiert AGENT_GRAPH_ENABLED=true."}
            ), 503

        def event_generator():
            try:
                yield from agent_graph.stream_events(
                    question,
                    history=sanitized,
                    top_k=top_k,
                )
            except QueueFullError as exc:
                yield f"data: {json.dumps({'event': 'error', 'message': str(exc)}, ensure_ascii=False)}\n\n"
            except QueueWaitTimeoutError as exc:
                yield f"data: {json.dumps({'event': 'error', 'message': str(exc)}, ensure_ascii=False)}\n\n"
            except Exception as exc:
                yield f"data: {json.dumps({'event': 'error', 'message': f'Génération impossible: {exc}'}, ensure_ascii=False)}\n\n"

        headers = {
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
        return Response(
            stream_with_context(event_generator()),
            mimetype="text/event-stream",
            headers=headers,
        )
