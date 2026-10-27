from __future__ import annotations

import time
from typing import TYPE_CHECKING

from app.agents.llm import complete_json
from app.agents.state import AgentState, TraceEntry

if TYPE_CHECKING:
    from app.services.agent_graph_service import AgentGraphService

SYSTEM = """Tu es l'agent Verificateur de Nyatefe.
Controle que chaque affirmation juridique du brouillon est supportee par un passage (chunk_id).

Reponds UNIQUEMENT en JSON:
{
  "verdict": "ok" | "retry" | "fail",
  "affirmations_non_sourcees": ["..."]
}

Regles:
- ok: toutes les affirmations juridiques importantes ont un chunk_id correspondant dans les passages.
- retry: des affirmations manquent de source mais une nouvelle recherche pourrait aider.
- fail: brouillon invente ou passages vides."""


def run_verificateur(service: AgentGraphService, state: AgentState) -> dict:
    started = time.perf_counter()
    passages = state.get("passages") or []
    brouillon = state.get("brouillon") or ""

    if not passages:
        trace: TraceEntry = {
            "node": "verificateur",
            "detail": "aucun passage -> fail",
            "duration_ms": int((time.perf_counter() - started) * 1000),
        }
        return {
            "verdict": "fail",
            "affirmations_non_sourcees": ["Aucun passage trouve."],
            "trace": [trace],
        }

    passage_ids = [p.get("chunk_id") for p in passages]
    user = f"""Passages (chunk_id disponibles):
{passage_ids}

Brouillon:
{brouillon}
"""

    data, _provider = complete_json(
        rodium=service.rodium,
        ollama=service.ollama,
        mistral=service.mistral,
        chat_provider=service.settings.chat_provider,
        mistral_fallback_enabled=service.settings.mistral_fallback_enabled,
        system=SYSTEM,
        user=user,
    )

    verdict = str(data.get("verdict") or "retry")
    if verdict not in ("ok", "retry", "fail"):
        verdict = "retry"

    if verdict != "ok" and passages:
        best_sim = max(float(p.get("similarite") or 0) for p in passages)
        if best_sim >= 0.45 and verdict == "fail":
            verdict = "retry"

    non_sourcees = data.get("affirmations_non_sourcees") or []
    if not isinstance(non_sourcees, list):
        non_sourcees = []

    trace = {
        "node": "verificateur",
        "detail": f"verdict={verdict}",
        "duration_ms": int((time.perf_counter() - started) * 1000),
    }

    return {
        "verdict": verdict,
        "affirmations_non_sourcees": [str(x) for x in non_sourcees],
        "trace": [trace],
    }
