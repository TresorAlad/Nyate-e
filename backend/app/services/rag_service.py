import json
from typing import Any
from psycopg import Connection
from psycopg.types.json import Jsonb

from app.config import Settings
from app.services.mistral_client import MistralCloudClient
from app.services.ollama_client import OllamaClient
from app.services.ollama_queue import OllamaRequestQueue
from app.services.rodium_client import RodiumClient
from app.services.chat_intent import is_greeting_only, needs_legal_rag
from app.services.citizen_responses import (
    GREETING_ANSWER,
    NO_OFFICIAL_SOURCE_ANSWER,
    OUT_OF_SCOPE_ANSWER,
)
from app.services.chat_intent import is_non_legal_off_topic
from app.services.response_limits import clamp_citizen_answer
from app.agents.document_catalog import invalidate_document_catalog_cache
from app.agents.source_format import infer_article_label
from app.services.ingest_metadata import infer_domain_for_document
from app.services.text_chunker import chunk_text

MAX_HISTORY_MESSAGES = 8

SMALL_TALK_SYSTEM_PROMPT = """Tu es Nyatefe, un assistant juridique togolais avec un ton humain et bienveillant.
Tu vouvoies l'utilisateur. Tu reponds en francais clair, en 2 a 4 phrases courtes.

Comportement:
- Reponds d'abord a ce que la personne dit (accueil, small talk, vie quotidienne) sans forcer le juridique.
- Ne cite aucun article ni loi tant qu'il n'y a pas de question de droit.
- Rappelle gentiment que tu es la pour le droit togolais et invite a decrire un besoin concret si utile.
- Pas de code informatique, pas de JSON, pas de listes longues."""

SYSTEM_PROMPT = """Tu es Nyatefe, assistant juridique pour le droit togolais uniquement.
Reponse courte (max 120 mots) a partir des extraits fournis.
Ne cite que des references presentes dans les extraits. N'invente rien.
Interdit: programmation, code source, JSON, listes longues, sujets hors droit.
Si les extraits ne suffisent pas: 1 ou 2 phrases et invite a reformuler.
Markdown leger ok (gras pour un article). Pas de code."""


class RagService:
    def __init__(
        self,
        settings: Settings,
        ollama: OllamaClient,
        mistral: MistralCloudClient,
        rodium: RodiumClient,
        ollama_queue: OllamaRequestQueue,
    ) -> None:
        self.settings = settings
        self.ollama = ollama
        self.mistral = mistral
        self.rodium = rodium
        self.ollama_queue = ollama_queue

    def embed_query(self, query: str) -> list[float]:
        return self.ollama_queue.run(lambda: self.ollama.embed(query))

    def search_similar(
        self,
        conn: Connection[Any],
        query_embedding: list[float],
        top_k: int | None = None,
        domaine: str | None = None,
        *,
        allow_global_fallback: bool = True,
    ) -> tuple[list[dict[str, Any]], bool]:
        limit = top_k or self.settings.rag_top_k
        vector_literal = _to_pgvector(query_embedding)
        base_select = """
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
        """
        order_limit = """
            ORDER BY c.embedding <=> %s::vector
            LIMIT %s
        """

        rows: list[Any] = []
        used_fallback = False
        if domaine:
            sql = (
                base_select
                + """
            AND c.metadata->>'domaine' = %s
            """
                + order_limit
            )
            rows = conn.execute(
                sql,
                (vector_literal, domaine, vector_literal, limit),
            ).fetchall()

        if not rows and domaine and allow_global_fallback:
            used_fallback = True
            sql = base_select + order_limit
            rows = conn.execute(
                sql, (vector_literal, vector_literal, limit)
            ).fetchall()
        elif not rows and not domaine:
            sql = base_select + order_limit
            rows = conn.execute(
                sql, (vector_literal, vector_literal, limit)
            ).fetchall()

        filtered = [
            row
            for row in rows
            if float(row["similarity"]) >= self.settings.rag_min_similarity
        ]
        return filtered, used_fallback

    def search_similar_for_document(
        self,
        conn: Connection[Any],
        query_embedding: list[float],
        document_id: str,
        top_k: int | None = None,
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
              AND d.id = %s::uuid
            ORDER BY c.embedding <=> %s::vector
            LIMIT %s
        """
        rows = conn.execute(
            sql,
            (vector_literal, document_id, vector_literal, limit),
        ).fetchall()
        return [
            row
            for row in rows
            if float(row["similarity"]) >= self.settings.rag_min_similarity
        ]

    def search_document_candidates(
        self,
        conn: Connection[Any],
        query_embedding: list[float],
        *,
        scan_top_k: int | None = None,
        max_documents: int | None = None,
    ) -> list[dict[str, Any]]:
        scan = scan_top_k or self.settings.agent_document_scan_top_k
        cap = max_documents or self.settings.agent_parallel_domains
        rows, _fallback = self.search_similar(
            conn,
            query_embedding,
            top_k=scan,
            domaine=None,
        )
        return aggregate_document_candidates(rows, max_documents=cap)

    def ingest_document(
        self,
        conn: Connection[Any],
        title: str,
        body: str,
        doc_type: str | None,
        source_ref: str | None,
        version_date: str | None,
        *,
        domaine: str | None = None,
        version_tag: str | None = None,
    ) -> dict[str, Any]:
        return self.ollama_queue.run(
            lambda: self._ingest_document(
                conn,
                title,
                body,
                doc_type,
                source_ref,
                version_date,
                domaine=domaine,
                version_tag=version_tag,
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
        *,
        domaine: str | None = None,
        version_tag: str | None = None,
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
        resolved_domaine = domaine or infer_domain_for_document(title, doc_type)
        chunks = chunk_text(
            body, self.settings.chunk_size, self.settings.chunk_overlap
        )
        inserted = 0
        for index, chunk in enumerate(chunks):
            embedding = self.ollama.embed(chunk)
            chunk_meta: dict[str, Any] = {
                "char_count": len(chunk),
                "document_title": title,
            }
            if resolved_domaine:
                chunk_meta["domaine"] = resolved_domaine
            if version_tag:
                chunk_meta["version_tag"] = version_tag
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
                    Jsonb(chunk_meta),
                ),
            )
            inserted += 1

        conn.commit()
        invalidate_document_catalog_cache()
        return {
            "document": doc_row,
            "chunks_inserted": inserted,
        }

    def answer_small_talk(
        self,
        question: str,
        history: list[dict[str, str]] | None = None,
    ) -> dict[str, Any]:
        if is_greeting_only(question):
            return {
                "answer": GREETING_ANSWER,
                "provider": self.settings.chat_provider,
                "sources": [],
                "mode": "small_talk",
            }

        if is_non_legal_off_topic(question):
            return {
                "answer": OUT_OF_SCOPE_ANSWER,
                "provider": self.settings.chat_provider,
                "sources": [],
                "mode": "clarification",
            }

        sanitized_history = _sanitize_history(history or [])
        user_prompt = f"""Message de l'utilisateur:
{question}

Consignes:
- Reponds comme un interlocuteur attentif, pas comme un robot.
- Pas de citation juridique ici."""

        messages: list[dict[str, str]] = [
            {"role": "system", "content": SMALL_TALK_SYSTEM_PROMPT},
            *sanitized_history,
            {"role": "user", "content": user_prompt},
        ]
        provider, answer = self._generate_answer_messages(messages)
        return {
            "answer": clamp_citizen_answer(
                answer, max_chars=self.settings.chat_max_answer_chars
            ),
            "provider": provider,
            "sources": [],
            "mode": "small_talk",
        }

    def answer_question(
        self,
        conn: Connection[Any],
        question: str,
        top_k: int | None = None,
        history: list[dict[str, str]] | None = None,
    ) -> dict[str, Any]:
        sanitized_history = _sanitize_history(history or [])

        if not needs_legal_rag(question, sanitized_history):
            return self.answer_small_talk(question, sanitized_history)

        search_query = _compose_search_query(question, sanitized_history)
        query_embedding = self.ollama_queue.run(
            lambda: self.ollama.embed(search_query)
        )
        sources, _fallback = self.search_similar(conn, query_embedding, top_k=top_k)

        if not sources:
            return {
                "answer": NO_OFFICIAL_SOURCE_ANSWER,
                "provider": self.settings.chat_provider,
                "sources": [],
                "mode": "no_source",
            }

        context_block = _format_sources(sources)
        user_prompt = f"""Extraits de sources (question actuelle):
{context_block}

Question actuelle:
{question}

Consignes:
- Réponds en français clair et accessible, en tenant compte du dialogue précédent si la question est une relance.
- Base-toi uniquement sur les extraits ci-dessus pour les faits juridiques.
- Respecte le format Markdown décrit dans le message système."""

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            *sanitized_history,
            {"role": "user", "content": user_prompt},
        ]
        provider, answer = self._generate_answer_messages(messages)

        return {
            "answer": clamp_citizen_answer(
                answer, max_chars=self.settings.chat_max_answer_chars
            ),
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
                    "article": infer_article_label(row["content"]),
                    "content": row["content"],
                    "excerpt": row["content"],
                }
                for row in sources
            ],
        }

    def _generate_answer_messages(
        self, messages: list[dict[str, str]]
    ) -> tuple[str, str]:
        provider = self.settings.chat_provider

        max_tokens = self.settings.chat_max_tokens
        if provider == "rodium" and self.rodium.is_configured():
            return "rodium", self.rodium.complete(messages, max_tokens=max_tokens)

        if provider == "rodium" and not self.rodium.is_configured():
            provider = "ollama"

        if provider == "mistral" and self.mistral.is_configured():
            return "mistral_api", self.mistral.complete(
                messages, max_tokens=max_tokens
            )

        try:
            answer = self.ollama_queue.run(
                lambda: self.ollama.complete(messages, max_tokens=max_tokens)
            )
            return "ollama", answer
        except Exception as ollama_error:
            if self.rodium.is_configured():
                return "rodium", self.rodium.complete(
                    messages, max_tokens=max_tokens
                )
            if self.settings.mistral_fallback_enabled and self.mistral.is_configured():
                return "mistral_api", self.mistral.complete(
                    messages, max_tokens=max_tokens
                )
            raise ollama_error


def _sanitize_history(history: list[dict[str, str]]) -> list[dict[str, str]]:
    cleaned: list[dict[str, str]] = []
    for item in history:
        role = (item.get("role") or "").strip()
        content = (item.get("content") or "").strip()
        if role not in ("user", "assistant") or not content:
            continue
        cleaned.append({"role": role, "content": content[:4000]})
    return cleaned[-MAX_HISTORY_MESSAGES:]


def _compose_search_query(question: str, history: list[dict[str, str]]) -> str:
    if not history:
        return question
    recent: list[str] = []
    for item in history[-4:]:
        label = "Utilisateur" if item["role"] == "user" else "Assistant"
        snippet = item["content"][:300].replace("\n", " ")
        recent.append(f"{label}: {snippet}")
    recent.append(f"Utilisateur: {question}")
    return "\n".join(recent)


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


def aggregate_document_candidates(
    rows: list[dict[str, Any]],
    *,
    max_documents: int,
) -> list[dict[str, Any]]:
    by_document: dict[str, dict[str, Any]] = {}
    for row in rows:
        document_id = str(row["document_id"])
        similarity = float(row["similarity"])
        current = by_document.get(document_id)
        if current is None or similarity > float(current["similarity"]):
            by_document[document_id] = {
                "document_id": document_id,
                "title": row.get("title"),
                "doc_type": row.get("doc_type"),
                "similarity": similarity,
            }
    ranked = sorted(
        by_document.values(),
        key=lambda item: float(item["similarity"]),
        reverse=True,
    )
    return ranked[:max_documents]
