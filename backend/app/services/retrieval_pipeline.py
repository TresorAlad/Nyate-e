from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

from app.agents.document_catalog import load_document_catalog
from app.agents.document_router import pick_document_targets
from app.agents.domain_router import pick_domain_targets
from app.agents.parallel_retrieval import (
    retrieve_parallel_by_documents,
    retrieve_parallel_by_domains,
)
from app.agents.passages import merge_passages
from app.agents.state import Passage, TraceEntry
from app.db import get_conn

if TYPE_CHECKING:
    from app.services.agent_graph_service import AgentGraphService


@dataclass
class FastRetrievalResult:
    question_reformulee: str
    domaine: str
    domaines_cibles: list[str]
    documents_cibles: list[str]
    passages: list[Passage]
    retrieval_mode: str
    meta: dict[str, Any] = field(default_factory=dict)
    trace: TraceEntry | None = None


def run_fast_retrieval(
    service: AgentGraphService,
    question: str,
    top_k: int | None = None,
) -> FastRetrievalResult:
    started = time.perf_counter()
    if service.pool is None:
        raise RuntimeError("Pool PostgreSQL indisponible.")

    trimmed = question.strip()
    limit = int(top_k or service.settings.rag_top_k)
    mode = service.settings.agent_retrieval_mode
    parallel_targets = service.settings.agent_parallel_domains

    embedding = service.rag.ollama.embed(trimmed)
    groups: list[list[Passage]] = []
    domain_targets: list[str] = []
    document_targets: list[str] = []
    meta: dict[str, Any] = {"retrieval_mode": mode}

    if mode in ("domain", "hybrid"):
        domain_targets = pick_domain_targets(
            trimmed,
            service.domains,
            max_domains=parallel_targets,
        )
        per_domain_k = max(2, limit // max(1, len(domain_targets)))
        domain_passages, domain_meta = retrieve_parallel_by_domains(
            service,
            service.pool,
            embedding,
            domain_targets,
            top_k_per_domain=per_domain_k,
            total_top_k=limit,
        )
        if domain_passages:
            groups.append(domain_passages)
        meta["domains"] = domain_meta

    if mode in ("document", "hybrid"):
        with get_conn(service.pool) as conn:
            catalog = load_document_catalog(conn)
            vector_hints = service.rag.search_document_candidates(
                conn,
                embedding,
                max_documents=parallel_targets,
            )
        document_targets = pick_document_targets(
            trimmed,
            catalog,
            vector_hints,
            max_documents=parallel_targets,
        )
        per_doc_k = max(2, limit // max(1, len(document_targets)))
        document_passages, document_meta = retrieve_parallel_by_documents(
            service,
            service.pool,
            embedding,
            document_targets,
            top_k_per_document=per_doc_k,
            total_top_k=limit,
        )
        if document_passages:
            groups.append(document_passages)
        meta["documents"] = document_meta

    passages = merge_passages(groups, limit) if groups else []
    primary_domain = domain_targets[0] if domain_targets else "public"

    trace: TraceEntry = {
        "node": "coordinateur",
        "detail": (
            f"mode={mode} domaines={','.join(domain_targets)} "
            f"documents={','.join(document_targets)} passages={len(passages)}"
        ),
        "duration_ms": int((time.perf_counter() - started) * 1000),
    }

    return FastRetrievalResult(
        question_reformulee=trimmed,
        domaine=primary_domain,
        domaines_cibles=domain_targets,
        documents_cibles=document_targets,
        passages=passages,
        retrieval_mode=mode,
        meta=meta,
        trace=trace,
    )
