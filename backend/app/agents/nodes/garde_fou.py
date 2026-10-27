from __future__ import annotations

import time
from typing import TYPE_CHECKING, Any

from app.agents.passages import passages_to_api_sources
from app.agents.state import AgentState, TraceEntry
from app.services.citizen_responses import NO_OFFICIAL_SOURCE_ANSWER
from app.services.response_limits import clamp_citizen_answer

if TYPE_CHECKING:
    from app.services.agent_graph_service import AgentGraphService

DISCLAIMER = (
    "\n\n*Nyateƒe s'appuie sur des textes officiels. "
    "Je peux me tromper : pour une decision importante, consultez un juriste "
    "ou un avocat inscrit au Barreau du Togo.*"
)


def run_garde_fou(service: AgentGraphService, state: AgentState) -> dict:
    started = time.perf_counter()
    passages = state.get("passages") or []
    if not passages:
        reponse = NO_OFFICIAL_SOURCE_ANSWER
    else:
        brouillon = clamp_citizen_answer(
            (state.get("brouillon") or "").strip(),
            max_chars=service.settings.chat_max_answer_chars,
        )
        if DISCLAIMER.strip() not in brouillon:
            reponse = brouillon + DISCLAIMER
        else:
            reponse = brouillon

    trace: TraceEntry = {
        "node": "garde_fou",
        "detail": "avertissement ajoute",
        "duration_ms": int((time.perf_counter() - started) * 1000),
    }

    return {
        "reponse": reponse,
        "sources": passages_to_api_sources(
            state.get("passages") or [],
            max_sources=service.settings.agent_max_sources,
        ),
        "mode": "legal",
        "provider": state.get("provider") or service.settings.chat_provider,
        "trace": [trace],
    }
