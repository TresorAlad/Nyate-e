#!/usr/bin/env python3
"""Indexe un fichier texte ou PDF dans pgvector (hors requête HTTP)."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from dotenv import load_dotenv

from app.agents.document_catalog import invalidate_document_catalog_cache
from app.agents.specialist_registry import invalidate_specialist_registry_cache
from app.config import load_settings
from app.db import create_pool, get_conn
from app.services.mistral_client import MistralCloudClient
from app.services.ollama_client import OllamaClient
from app.services.ollama_queue import OllamaRequestQueue
from app.services.rodium_client import RodiumClient
from app.services.rag_service import RagService


def read_body(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".txt":
        return path.read_text(encoding="utf-8", errors="replace").strip()
    if suffix == ".pdf":
        try:
            from pypdf import PdfReader
        except ImportError as exc:
            raise SystemExit("Installez pypdf: pip install pypdf") from exc
        reader = PdfReader(str(path))
        return "".join(page.extract_text() or "" for page in reader.pages).strip()
    raise SystemExit("Extensions supportées: .txt, .pdf")


def main() -> int:
    parser = argparse.ArgumentParser(description="Indexer un texte juridique dans Nyateƒe")
    parser.add_argument("path", type=Path, help="Fichier .txt ou .pdf")
    parser.add_argument("--title", required=True)
    parser.add_argument("--doc-type", default="code")
    parser.add_argument("--source-ref", default="")
    parser.add_argument("--version-date", default=None)
    parser.add_argument(
        "--domaine",
        default=None,
        help="Domaine specialiste (penal, famille, travail, affaires, constitution, donnees_personnelles)",
    )
    parser.add_argument(
        "--version-tag",
        default=None,
        help="Ex. legacy ou update pour le code des personnes et des familles",
    )
    args = parser.parse_args()

    path = args.path.expanduser().resolve()
    if not path.is_file():
        print(f"Fichier introuvable: {path}", file=sys.stderr)
        return 1

    body = read_body(path)
    if not body:
        print("Aucun texte extrait.", file=sys.stderr)
        return 1

    load_dotenv(BACKEND_ROOT / ".env")
    settings = load_settings()
    pool = create_pool(settings)
    ollama = OllamaClient(settings)
    mistral = MistralCloudClient(settings)
    ollama_queue = OllamaRequestQueue(
        max_waiting=settings.ollama_queue_max_waiting,
        wait_timeout_seconds=settings.ollama_queue_wait_timeout_seconds,
    )
    rodium = RodiumClient(settings)
    rag = RagService(settings, ollama, mistral, rodium, ollama_queue)

    print(f"Texte: {len(body)} caractères — embeddings en cours (peut prendre longtemps)…")

    with get_conn(pool) as conn:
        result = rag.ingest_document(
            conn,
            title=args.title,
            body=body,
            doc_type=args.doc_type,
            source_ref=args.source_ref or None,
            version_date=args.version_date,
            domaine=args.domaine,
            version_tag=args.version_tag,
        )
        conn.commit()

    invalidate_document_catalog_cache()
    invalidate_specialist_registry_cache()

    doc = result["document"]
    print(f"Terminé: id={doc['id']} chunks={result['chunks_inserted']}")
    pool.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
