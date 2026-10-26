import json
from typing import Any
from psycopg import Connection
from psycopg.types.json import Jsonb

from app.config import Settings
from app.services.mistral_client import MistralCloudClient
from app.services.ollama_client import OllamaClient
from app.services.ollama_queue import OllamaRequestQueue
from app.services.text_chunker import chunk_text

SYSTEM_PROMPT = """Tu es Nyatefe, assistant juridique pour le droit togolais.
Tu réponds uniquement à partir des extraits de sources fournis.
Si une information manque, dis-le clairement.
Cite les références (titre, type, source) quand c'est possible.
Rappelle que tu orientes et ne remplaces pas un avocat ou un juriste."""


class RagService:
    def __init__(
        self,
        settings: Settings,
        ollama: OllamaClient,
        mistral: MistralCloudClient,
        ollama_queue: OllamaRequestQueue,
    ) -> None:
        self.settings = settings
        self.ollama = ollama
        self.mistral = mistral
        self.ollama_queue = ollama_queue

    def embed_query(self, query: str) -> list[float]:
        return self.ollama_queue.run(lambda: self.ollama.embed(query))

    def search_similar(
        self, conn: Connection[Any], query_embedding: list[float], top_k: int | None = None
    ) -> list[dict[str, Any]]:
        limit = top_k or self.settings.rag_top_k
        vector_literal = _to_pgvector(query_embedding)
        sql = """
            SELECT
                c.id AS chunk_id,
                c.content,
                c.chunk_index,
                c.metadata,
                d.id AS document_id,
                d.title,
                d.doc_type,
                d.source_ref,
                d.version_date,
                1 - (c.embedding <=> %s::vector) AS similarity
            FROM legal_chunks c
            JOIN legal_documents d ON d.id = c.document_id
            WHERE c.embedding IS NOT NULL
            ORDER BY c.embedding <=> %s::vector
            LIMIT %s
        """
        rows = conn.execute(sql, (vector_literal, vector_literal, limit)).fetchall()
        filtered = [
            row
            for row in rows
            if float(row["similarity"]) >= self.settings.rag_min_similarity
        ]
        return filtered

    def ingest_document(
        self,
        conn: Connection[Any],
        title: str,
        body: str,
        doc_type: str | None,
        source_ref: str | None,
        version_date: str | None,
    ) -> dict[str, Any]:
        return self.ollama_queue.run(
            lambda: self._ingest_document(
                conn, title, body, doc_type, source_ref, version_date
            )
        )

    def _ingest_document(
        self,
        conn: Connection[Any],
        title: str,
        body: str,
        doc_type: str | None,
        source_ref: str | None,
        version_date: str | None,
    ) -> dict[str, Any]:
        doc_row = conn.execute(
            """
            INSERT INTO legal_documents (title, doc_type, source_ref, version_date)
            VALUES (%s, %s, %s, %s)
            RETURNING id, title, doc_type, source_ref, version_date, created_at
            """,
            (title, doc_type, source_ref, version_date),
        ).fetchone()

        document_id = doc_row["id"]
        chunks = chunk_text(
            body, self.settings.chunk_size, self.settings.chunk_overlap
        )
        inserted = 0
        for index, chunk in enumerate(chunks):
            embedding = self.ollama.embed(chunk)
            conn.execute(
                """
                INSERT INTO legal_chunks (document_id, chunk_index, content, embedding, metadata)
                VALUES (%s, %s, %s, %s::vector, %s)
                """,
                (
                    document_id,
                    index,
                    chunk,
                    _to_pgvector(embedding),
                    Jsonb({"char_count": len(chunk)}),
                ),
            )
            inserted += 1

        conn.commit()
        return {
            "document": doc_row,
            "chunks_inserted": inserted,
        }

    def answer_question(
        self, conn: Connection[Any], question: str, top_k: int | None = None
    ) -> dict[str, Any]:
        return self.ollama_queue.run(
            lambda: self._answer_question(conn, question, top_k=top_k)
        )

    def _answer_question(
        self, conn: Connection[Any], question: str, top_k: int | None = None
    ) -> dict[str, Any]:
        query_embedding = self.ollama.embed(question)
        sources = self.search_similar(conn, query_embedding, top_k=top_k)

        context_block = _format_sources(sources)
        user_prompt = f"""Question:
{question}

Extraits de sources:
{context_block}

Consignes:
- Réponds en français clair et accessible.
- Base-toi uniquement sur les extraits.
- Termine par une phrase de prudence juridique."""

        provider = "ollama"
        try:
            answer = self.ollama.chat(SYSTEM_PROMPT, user_prompt)
        except Exception as ollama_error:
            if not (
                self.settings.mistral_fallback_enabled and self.mistral.is_configured()
            ):
                raise ollama_error
            answer = self.mistral.chat(SYSTEM_PROMPT, user_prompt)
            provider = "mistral_api"

        return {
            "answer": answer,
            "provider": provider,
            "sources": [
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
                    "excerpt": row["content"][:400],
                }
                for row in sources
            ],
        }


def _format_sources(sources: list[dict[str, Any]]) -> str:
    if not sources:
        return "Aucun extrait pertinent trouvé dans la base."

    blocks: list[str] = []
    for idx, row in enumerate(sources, start=1):
        blocks.append(
            f"[{idx}] Titre: {row['title']}\n"
            f"Type: {row.get('doc_type') or 'N/A'}\n"
            f"Source: {row.get('source_ref') or 'N/A'}\n"
            f"Extrait:\n{row['content']}"
        )
    return "\n\n".join(blocks)


def _to_pgvector(values: list[float]) -> str:
    return json.dumps(values)
