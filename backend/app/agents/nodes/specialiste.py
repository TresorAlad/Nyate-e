from __future__ import annotations

import time
from typing import TYPE_CHECKING

from app.agents.passages import row_to_passage
from app.agents.state import AgentState, TraceEntry

if TYPE_CHECKING:
    from app.services.agent_graph_service import AgentGraphService


def run_specialiste(service: AgentGraphService, state: AgentState) -> dict:
    started = time.perf_counter()
    conn = service.current_conn
    if conn is None:
        raise RuntimeError("Connexion base indisponible pour le specialiste.")

    question = state.get("question_reformulee") or state.get("question") or ""
    domaine = state.get("domaine") or ""
    max_sources = service.settings.agent_max_sources
    top_k = min(int(state.get("top_k") or service.settings.rag_top_k), max_sources)
    nb_essais = int(state.get("nb_essais") or 0)

    requetes = [question]
    if nb_essais > 0:
        requetes.append(f"{question} (recherche elargie essai {nb_essais + 1})")

    search_text = "\n".join(requetes)
    embedding = service.rag.ollama.embed(search_text)

    filtered, used_fallback = service.rag.search_similar(
        conn,
        embedding,
        top_k=top_k,
        domaine=domaine,
        allow_global_fallback=False,
    )

    passages = [row_to_passage(row, domaine) for row in filtered[:max_sources]]

    trace: TraceEntry = {
        "node": "specialiste",
        "detail": (
            f"domaine={domaine} passages={len(passages)} "
            f"filtre_ignore={used_fallback} essai={nb_essais}"
        ),
        "duration_ms": int((time.perf_counter() - started) * 1000),
    }

    update: dict = {
        "requetes": requetes,
        "passages": passages,
        "specialiste_id": domaine,
        "filtre_domaine_ignore": used_fallback,
        "trace": [trace],
    }
    if nb_essais > 0:
        update["nb_essais"] = nb_essais
    return update
