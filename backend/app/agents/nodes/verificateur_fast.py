from __future__ import annotations

import time
from typing import TYPE_CHECKING

from app.agents.state import AgentState, TraceEntry

if TYPE_CHECKING:
    from app.services.agent_graph_service import AgentGraphService


def run_verificateur_fast(service: AgentGraphService, state: AgentState) -> dict:
    """Controle leger sans LLM: passages presents et score de similarite suffisant."""
    started = time.perf_counter()
    passages = state.get("passages") or []
    if not passages:
        verdict = "fail"
        detail = "aucun passage"
    else:
        best = max(float(p.get("similarite") or 0) for p in passages)
        threshold = service.settings.rag_min_similarity
        verdict = "ok" if best >= threshold else "fail"
        detail = f"best={best:.2f} seuil={threshold}"

    trace: TraceEntry = {
        "node": "verificateur_fast",
        "detail": detail,
        "duration_ms": int((time.perf_counter() - started) * 1000),
    }
    return {"verdict": verdict, "trace": [trace]}
