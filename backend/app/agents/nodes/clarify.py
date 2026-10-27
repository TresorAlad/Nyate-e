from __future__ import annotations

import time
from typing import TYPE_CHECKING

from app.agents.state import AgentState, TraceEntry

if TYPE_CHECKING:
    from app.services.agent_graph_service import AgentGraphService

DEFAULT_MSG = (
    "Pour vous orienter en droit togolais, décrivez votre situation "
    "ou posez une question juridique concrète."
)


def run_clarify(_service: AgentGraphService, state: AgentState) -> dict:
    started = time.perf_counter()
    message = (state.get("message_redirection") or "").strip() or DEFAULT_MSG
    trace: TraceEntry = {
        "node": "clarify",
        "detail": "redirection utilisateur",
        "duration_ms": int((time.perf_counter() - started) * 1000),
    }
    return {
        "reponse": message,
        "sources": [],
        "mode": "clarification",
        "trace": [trace],
    }
