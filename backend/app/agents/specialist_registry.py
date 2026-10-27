from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any

from psycopg import Connection

from app.agents.domain_config import LegalDomain, load_domains

_CACHE: dict[str, tuple[float, dict[str, int]]] = {}
_CACHE_TTL_SECONDS = 120.0


@dataclass(frozen=True)
class AvailableSpecialist:
    id: str
    label: str
    description_courte: str


def _domain_by_id() -> dict[str, LegalDomain]:
    return {d.id: d for d in load_domains()}


def _fetch_chunk_counts(conn: Connection[Any]) -> dict[str, int]:
    rows = conn.execute(
        """
        SELECT metadata->>'domaine' AS domaine, COUNT(*)::int AS n
        FROM legal_chunks
        WHERE metadata->>'domaine' IS NOT NULL
          AND metadata->>'domaine' != ''
        GROUP BY metadata->>'domaine'
        """
    ).fetchall()
    return {str(row["domaine"]): int(row["n"]) for row in rows}


def get_chunk_counts(conn: Connection[Any]) -> dict[str, int]:
    cache_key = "default"
    cached = _CACHE.get(cache_key)
    now = time.time()
    if cached and now - cached[0] < _CACHE_TTL_SECONDS:
        return cached[1]

    counts = _fetch_chunk_counts(conn)
    _CACHE[cache_key] = (now, counts)
    return counts


def invalidate_specialist_registry_cache() -> None:
    _CACHE.clear()


def is_specialist_configured(domain_id: str) -> bool:
    domain = _domain_by_id().get(domain_id)
    return domain is not None and domain.active


def is_specialist_available(conn: Connection[Any], domain_id: str) -> bool:
    if not is_specialist_configured(domain_id):
        return False
    counts = get_chunk_counts(conn)
    return counts.get(domain_id, 0) > 0


def label_for(domain_id: str) -> str:
    domain = _domain_by_id().get(domain_id)
    if domain is None:
        return domain_id
    return domain.label


def list_available_specialists(conn: Connection[Any]) -> list[AvailableSpecialist]:
    counts = get_chunk_counts(conn)
    result: list[AvailableSpecialist] = []
    for domain in load_domains():
        if not domain.active:
            continue
        if counts.get(domain.id, 0) <= 0:
            continue
        result.append(
            AvailableSpecialist(
                id=domain.id,
                label=domain.label,
                description_courte=domain.description_courte,
            )
        )
    return result


def specialists_prompt_block(conn: Connection[Any]) -> str:
    lines: list[str] = []
    for item in list_available_specialists(conn):
        lines.append(f"- {item.id}: {item.label} - {item.description_courte}")
    if not lines:
        return "(Aucun specialiste disponible pour le moment.)"
    return "\n".join(lines)
