from flask import Blueprint, jsonify, request

from app.auth import is_ingest_authorized
from app.config import Settings
from app.db import get_conn
from app.services.ollama_queue import QueueFullError, QueueWaitTimeoutError
from app.services.rag_service import RagService
from psycopg_pool import ConnectionPool

documents_bp = Blueprint("documents", __name__)


def register_document_routes(
    bp: Blueprint, pool: ConnectionPool, rag: RagService, settings: Settings
) -> None:
    @bp.post("/documents")
    def create_document():
        if not is_ingest_authorized(settings, request):
            return jsonify({"error": "Clé d'indexation invalide ou manquante."}), 401

        payload = request.get_json(silent=True) or {}
        title = (payload.get("title") or "").strip()
        body = (payload.get("body") or "").strip()
        if not title or not body:
            return jsonify({"error": "Les champs title et body sont obligatoires."}), 400

        doc_type = payload.get("doc_type")
        source_ref = payload.get("source_ref")
        version_date = payload.get("version_date")

        try:
            with get_conn(pool) as conn:
                result = rag.ingest_document(
                    conn,
                    title=title,
                    body=body,
                    doc_type=doc_type,
                    source_ref=source_ref,
                    version_date=version_date,
                )
        except QueueFullError as exc:
            return jsonify({"error": str(exc)}), 429
        except QueueWaitTimeoutError as exc:
            return jsonify({"error": str(exc)}), 503

        document = result["document"]
        return jsonify(
            {
                "document_id": str(document["id"]),
                "title": document["title"],
                "doc_type": document["doc_type"],
                "source_ref": document["source_ref"],
                "version_date": document["version_date"].isoformat()
                if document["version_date"]
                else None,
                "chunks_inserted": result["chunks_inserted"],
            }
        ), 201
