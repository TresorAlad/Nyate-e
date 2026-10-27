from __future__ import annotations

import time
from typing import TYPE_CHECKING

from app.agents.llm import complete_json
from app.agents.specialist_registry import (
    is_specialist_available,
    list_available_specialists,
    specialists_prompt_block,
)
from app.agents.state import AgentState, TraceEntry

if TYPE_CHECKING:
    from app.services.agent_graph_service import AgentGraphService

SYSTEM_TEMPLATE = """Tu es l'agent Routeur de Nyatefe (droit togolais).
Analyse la question et choisis le specialiste le plus pertinent parmi ceux disponibles.

Specialistes disponibles (un seul choix):
{domains}

Reponds UNIQUEMENT en JSON:
{{
  "domaine": "id parmi la liste ou none",
  "confiance_routeur": 0.0 a 1.0,
  "est_couvert": true ou false
}}

Regles:
- domaine doit etre un id de la liste ou "none" si aucun ne convient.
- est_couvert=true seulement si un specialiste de la liste peut traiter la question.
- Ne choisis jamais un domaine absent de la liste."""


def run_routeur(service: AgentGraphService, state: AgentState) -> dict:
    started = time.perf_counter()
    conn = service.current_conn
    if conn is None:
        raise RuntimeError("Connexion base indisponible pour le routeur.")

    question = state.get("question_reformulee") or state.get("question") or ""
    available = list_available_specialists(conn)
    allowed = {s.id for s in available}

    if not allowed:
        trace: TraceEntry = {
            "node": "routeur",
            "detail": "aucun_specialiste_disponible",
            "duration_ms": int((time.perf_counter() - started) * 1000),
        }
        return {
            "domaine": "none",
            "domaine_demandee": "none",
            "est_couvert": False,
            "confiance_routeur": 0.0,
            "trace": [trace],
        }

    system = SYSTEM_TEMPLATE.format(
        domains=specialists_prompt_block(conn),
    )

    data, provider = complete_json(
        rodium=service.rodium,
        ollama=service.ollama,
        mistral=service.mistral,
        chat_provider=service.settings.chat_provider,
        mistral_fallback_enabled=service.settings.mistral_fallback_enabled,
        system=system,
        user=f"Question:\n{question}",
        history=state.get("history"),
    )

    domaine = str(data.get("domaine") or "none")
    if domaine not in allowed:
        domaine = "none"

    est_couvert = bool(data.get("est_couvert")) and domaine != "none"
    if est_couvert and not is_specialist_available(conn, domaine):
        est_couvert = False

    trace = {
        "node": "routeur",
        "detail": (
            f"domaine={domaine} couvert={est_couvert} "
            f"confiance={data.get('confiance_routeur')}"
        ),
        "duration_ms": int((time.perf_counter() - started) * 1000),
    }

    return {
        "domaine": domaine if est_couvert else "none",
        "domaine_demandee": domaine,
        "est_couvert": est_couvert,
        "confiance_routeur": float(data.get("confiance_routeur") or 0.5),
        "provider": provider,
        "trace": [trace],
    }
