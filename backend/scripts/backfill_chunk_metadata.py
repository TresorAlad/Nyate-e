#!/usr/bin/env python3
"""Backfill domaine et document_title dans legal_chunks.metadata."""

from __future__ import annotations

import os
import sys

from dotenv import load_dotenv
from psycopg.types.json import Jsonb

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

from app.config import load_settings  # noqa: E402
from app.db import create_pool, get_conn  # noqa: E402
from app.services.ingest_metadata import infer_domain_for_document  # noqa: E402


def main() -> int:
    load_dotenv()
    settings = load_settings()
    pool = create_pool(settings)

    updated = 0
    with get_conn(pool) as conn:
        rows = conn.execute(
            """
            SELECT c.id, c.metadata, d.title, d.doc_type
            FROM legal_chunks c
            JOIN legal_documents d ON d.id = c.document_id
            """
        ).fetchall()
        for row in rows:
            metadata = row.get("metadata") or {}
            if isinstance(metadata, str):
                metadata = {}
            title = str(row["title"])
            doc_type = row.get("doc_type")
            domaine = infer_domain_for_document(title, doc_type)
            next_meta = dict(metadata)
            changed = False
            if next_meta.get("document_title") != title:
                next_meta["document_title"] = title
                changed = True
            if domaine and next_meta.get("domaine") != domaine:
                next_meta["domaine"] = domaine
                changed = True
            if changed:
                conn.execute(
                    "UPDATE legal_chunks SET metadata = %s WHERE id = %s",
                    (Jsonb(next_meta), row["id"]),
                )
                updated += 1
        conn.commit()

    print(f"Chunks mis a jour: {updated}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
