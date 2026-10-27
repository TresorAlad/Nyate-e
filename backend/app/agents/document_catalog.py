from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any

from psycopg import Connection


@dataclass(frozen=True)
class DocumentCatalogEntry:
    id: str
    title: str
    doc_type: str | None
    source_ref: str | None


_CACHE: dict[str, tuple[float, list[DocumentCatalogEntry]]] = {}
_CACHE_TTL_SECONDS = 120.0


def load_document_catalog(conn: Connection[Any]) -> list[DocumentCatalogEntry]:
    cache_key = "default"
    cached = _CACHE.get(cache_key)
    now = time.time()
    if cached and now - cached[0] < _CACHE_TTL_SECONDS:
        return cached[1]

    rows = conn.execute(
        """
        SELECT id, title, doc_type, source_ref
        FROM legal_documents
        ORDER BY title ASC
        """
    ).fetchall()
    catalog = [
        DocumentCatalogEntry(
            id=str(row["id"]),
            title=str(row["title"]),
            doc_type=row.get("doc_type"),
            source_ref=row.get("source_ref"),
        )
        for row in rows
    ]
    _CACHE[cache_key] = (now, catalog)
    return catalog


def invalidate_document_catalog_cache() -> None:
    _CACHE.clear()
