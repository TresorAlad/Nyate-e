from flask import Blueprint, jsonify, request

from app.db import get_conn
from app.services.ollama_queue import QueueFullError, QueueWaitTimeoutError
from app.services.rag_service import RagService
from psycopg_pool import ConnectionPool

search_bp = Blueprint("search", __name__)


def register_search_routes(bp: Blueprint, pool: ConnectionPool, rag: RagService) -> None:
    @bp.post("/search")
    def semantic_search():
        payload = request.get_json(silent=True) or {}
        query = (payload.get("query") or "").strip()
        if not query:
            return jsonify({"error": "Le champ query est obligatoire."}), 400

        top_k = payload.get("top_k")
        try:
            query_embedding = rag.embed_query(query)
            with get_conn(pool) as conn:
                rows = rag.search_similar(conn, query_embedding, top_k=top_k)
        except QueueFullError as exc:
            return jsonify({"error": str(exc)}), 429
        except QueueWaitTimeoutError as exc:
            return jsonify({"error": str(exc)}), 503
        except Exception as exc:
            return jsonify({"error": f"Recherche impossible: {exc}"}), 503

        return jsonify(
            {
                "query": query,
                "results": [
                    {
                        "document_id": str(row["document_id"]),
                        "chunk_id": str(row["chunk_id"]),
                        "title": row["title"],
                        "doc_type": row["doc_type"],
                        "source_ref": row["source_ref"],
                        "version_date": row["version_date"].isoformat()
                        if row["version_date"]
                        else None,
                        "chunk_index": row["chunk_index"],
                        "similarity": float(row["similarity"]),
                        "content": row["content"],
                    }
                    for row in rows
                ],
            }
        )
