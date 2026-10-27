from __future__ import annotations

from typing import Any

from app.agents.source_format import infer_article_label
from app.agents.state import Passage


def row_to_passage(row: dict[str, Any], domaine: str) -> Passage:
    meta = row.get("metadata") or {}
    if isinstance(meta, str):
        meta = {}
    raw_article = meta.get("article") if isinstance(meta, dict) else None
    article = infer_article_label(row["content"], raw_article)
    chunk_domain = meta.get("domaine") if isinstance(meta, dict) else None
    version = row.get("version_date")
    return {
        "chunk_id": str(row["chunk_id"]),
        "document_id": str(row["document_id"]),
        "texte": row["content"],
        "article": str(article) if article else None,
        "source_ref": row.get("source_ref"),
        "version_date": version.isoformat() if version else None,
        "similarite": float(row["similarity"]),
        "domaine": str(chunk_domain or domaine),
        "title": row.get("title"),
        "doc_type": row.get("doc_type"),
        "chunk_index": int(row["chunk_index"]),
    }


def merge_passages(lists: list[list[Passage]], top_k: int) -> list[Passage]:
    by_id: dict[str, Passage] = {}
    for group in lists:
        for passage in group:
            chunk_id = passage.get("chunk_id")
            if not chunk_id:
                continue
            existing = by_id.get(chunk_id)
            if existing is None or float(passage.get("similarite") or 0) > float(
                existing.get("similarite") or 0
            ):
                by_id[chunk_id] = passage

    merged = sorted(
        by_id.values(),
        key=lambda item: float(item.get("similarite") or 0),
        reverse=True,
    )
    return merged[:top_k]


def passages_to_api_sources(
    passages: list[Passage],
    *,
    max_sources: int | None = None,
) -> list[dict[str, Any]]:
    limited = passages
    if max_sources is not None and max_sources > 0:
        limited = passages[:max_sources]
    sources: list[dict[str, Any]] = []
    for row in limited:
        texte = (row.get("texte") or "").strip()
        article = infer_article_label(texte, row.get("article"))
        sources.append(
            {
                "document_id": row.get("document_id"),
                "chunk_id": row.get("chunk_id"),
                "title": row.get("title"),
                "doc_type": row.get("doc_type"),
                "source_ref": row.get("source_ref"),
                "version_date": row.get("version_date"),
                "chunk_index": row.get("chunk_index"),
                "article": article,
                "content": texte,
                "excerpt": texte,
            }
        )
    return sources
