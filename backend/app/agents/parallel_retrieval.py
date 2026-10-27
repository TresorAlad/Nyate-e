from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import TYPE_CHECKING, Any

from psycopg_pool import ConnectionPool

from app.agents.passages import merge_passages, row_to_passage
from app.agents.state import Passage
from app.db import get_conn

if TYPE_CHECKING:
    from app.services.agent_graph_service import AgentGraphService


def _search_domain(
    service: AgentGraphService,
    pool: ConnectionPool,
    embedding: list[float],
    domain_id: str,
    top_k_per_domain: int,
) -> list[Passage]:
    with get_conn(pool) as conn:
        rows, _fallback = service.rag.search_similar(
            conn,
            embedding,
            top_k=top_k_per_domain,
            domaine=domain_id,
        )
    return [row_to_passage(row, domain_id) for row in rows]


def retrieve_parallel_by_domains(
    service: AgentGraphService,
    pool: ConnectionPool,
    embedding: list[float],
    domain_ids: list[str],
    *,
    top_k_per_domain: int,
    total_top_k: int,
) -> tuple[list[Passage], dict[str, Any]]:
    if not domain_ids:
        return [], {"domains": [], "per_domain": {}}

    unique_domains = list(dict.fromkeys(domain_ids))
    per_domain: dict[str, int] = {}
    groups: list[list[Passage]] = []

    max_workers = min(4, len(unique_domains))
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(
                _search_domain,
                service,
                pool,
                embedding,
                domain_id,
                top_k_per_domain,
            ): domain_id
            for domain_id in unique_domains
        }
        for future in as_completed(futures):
            domain_id = futures[future]
            passages = future.result()
            per_domain[domain_id] = len(passages)
            if passages:
                groups.append(passages)

    merged = merge_passages(groups, total_top_k)
    meta = {
        "domains": unique_domains,
        "per_domain": per_domain,
        "merged": len(merged),
    }
    return merged, meta


def _search_document(
    service: AgentGraphService,
    pool: ConnectionPool,
    embedding: list[float],
    document_id: str,
    top_k_per_document: int,
) -> list[Passage]:
    with get_conn(pool) as conn:
        rows = service.rag.search_similar_for_document(
            conn,
            embedding,
            document_id,
            top_k=top_k_per_document,
        )
    return [row_to_passage(row, "document") for row in rows]


def retrieve_parallel_by_documents(
    service: AgentGraphService,
    pool: ConnectionPool,
    embedding: list[float],
    document_ids: list[str],
    *,
    top_k_per_document: int,
    total_top_k: int,
) -> tuple[list[Passage], dict[str, Any]]:
    if not document_ids:
        return [], {"documents": [], "per_document": {}}

    unique_documents = list(dict.fromkeys(document_ids))
    per_document: dict[str, int] = {}
    groups: list[list[Passage]] = []

    max_workers = min(4, len(unique_documents))
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(
                _search_document,
                service,
                pool,
                embedding,
                document_id,
                top_k_per_document,
            ): document_id
            for document_id in unique_documents
        }
        for future in as_completed(futures):
            document_id = futures[future]
            passages = future.result()
            per_document[document_id] = len(passages)
            if passages:
                groups.append(passages)

    merged = merge_passages(groups, total_top_k)
    meta = {
        "documents": unique_documents,
        "per_document": per_document,
        "merged": len(merged),
    }
    return merged, meta
