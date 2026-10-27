from __future__ import annotations

import time
from typing import TYPE_CHECKING

from app.agents.state import AgentState, TraceEntry
from app.services.citizen_responses import NO_OFFICIAL_SOURCE_ANSWER

if TYPE_CHECKING:
    from app.services.agent_graph_service import AgentGraphService


def run_repli(_service: AgentGraphService, state: AgentState) -> dict:
    started = time.perf_counter()
    trace: TraceEntry = {
        "node": "repli",
        "detail": f"essais={state.get('nb_essais', 0)}",
        "duration_ms": int((time.perf_counter() - started) * 1000),
    }
    return {
        "reponse": NO_OFFICIAL_SOURCE_ANSWER,
        "sources": [],
        "mode": "no_source",
        "trace": [trace],
    }
