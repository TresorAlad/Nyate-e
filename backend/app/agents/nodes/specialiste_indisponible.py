from __future__ import annotations

import time
from typing import TYPE_CHECKING

from app.agents.specialist_registry import label_for, list_available_specialists
from app.agents.state import AgentState, TraceEntry
from app.services.citizen_responses import build_specialist_unavailable_message

if TYPE_CHECKING:
    from app.services.agent_graph_service import AgentGraphService


def run_specialiste_indisponible(
    service: AgentGraphService, state: AgentState
) -> dict:
    started = time.perf_counter()
    conn = service.current_conn
    domaine = state.get("domaine_demandee") or state.get("domaine") or "none"
    label = label_for(domaine) if domaine not in ("none", "public", "") else None

    available: list[str] = []
    if conn is not None:
        available = [s.label for s in list_available_specialists(conn)]

    message = build_specialist_unavailable_message(label, available)

    trace: TraceEntry = {
        "node": "specialiste_indisponible",
        "detail": f"domaine={domaine} disponibles={len(available)}",
        "duration_ms": int((time.perf_counter() - started) * 1000),
    }

    return {
        "reponse": message,
        "sources": [],
        "mode": "unavailable",
        "trace": [trace],
    }
