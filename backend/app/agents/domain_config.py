from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import yaml

DOMAINS_PATH = Path(__file__).resolve().parent / "domains.yaml"


@dataclass(frozen=True)
class LegalDomain:
    id: str
    label: str
    doc_types: tuple[str, ...]
    active: bool = False
    description_courte: str = ""


def load_domains() -> list[LegalDomain]:
    raw = yaml.safe_load(DOMAINS_PATH.read_text(encoding="utf-8")) or {}
    items = raw.get("domains") or []
    domains: list[LegalDomain] = []
    for item in items:
        if not isinstance(item, dict) or not item.get("id"):
            continue
        domains.append(
            LegalDomain(
                id=str(item["id"]),
                label=str(item.get("label") or item["id"]),
                doc_types=tuple(str(t) for t in (item.get("doc_types") or [])),
                active=bool(item.get("active", False)),
                description_courte=str(item.get("description_courte") or ""),
            )
        )
    return domains


def domain_ids(domains: list[LegalDomain]) -> list[str]:
    return [d.id for d in domains]


def domains_prompt_block(domains: list[LegalDomain]) -> str:
    lines = [f"- {d.id}: {d.label}" for d in domains]
    return "\n".join(lines)
