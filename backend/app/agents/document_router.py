from __future__ import annotations

import re
import unicodedata
from typing import Any

from app.agents.document_catalog import DocumentCatalogEntry


def _normalize(text: str) -> str:
    folded = unicodedata.normalize("NFKD", text.strip().lower())
    return "".join(ch for ch in folded if not unicodedata.combining(ch))


def _score_catalog_entry(question: str, entry: DocumentCatalogEntry) -> float:
    normalized = _normalize(question)
    tokens = set(re.findall(r"[a-z0-9']+", normalized))
    title = _normalize(entry.title)
    doc_type = _normalize(entry.doc_type or "")
    source_ref = _normalize(entry.source_ref or "")

    score = 0.0
    for token in tokens:
        if len(token) < 3:
            continue
        if token in title:
            score += 1.5
        if token in doc_type:
            score += 0.8
        if token in source_ref:
            score += 0.5

    for phrase in (
        "code du travail",
        "code foncier",
        "succession",
        "bail",
        "sarl",
        "ohada",
        "licenciement",
    ):
        if phrase in normalized and phrase in title:
            score += 2.0

    return score


def pick_document_targets(
    question: str,
    catalog: list[DocumentCatalogEntry],
    vector_hints: list[dict[str, Any]],
    *,
    max_documents: int,
) -> list[str]:
    scores: dict[str, float] = {}

    for hint in vector_hints:
        document_id = str(hint.get("document_id") or "")
        if not document_id:
            continue
        scores[document_id] = scores.get(document_id, 0.0) + float(
            hint.get("similarity") or 0
        ) * 2.0

    for entry in catalog:
        text_score = _score_catalog_entry(question, entry)
        if text_score > 0:
            scores[entry.id] = scores.get(entry.id, 0.0) + text_score * 0.35

    if not scores and vector_hints:
        return [
            str(item["document_id"])
            for item in vector_hints[:max_documents]
            if item.get("document_id")
        ]

    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    selected = [doc_id for doc_id, _value in ranked[:max_documents]]

    if not selected and catalog:
        return [catalog[0].id]

    return selected
