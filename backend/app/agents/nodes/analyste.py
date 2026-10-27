from __future__ import annotations

import time
from typing import TYPE_CHECKING

from app.agents.llm import complete_json
from app.agents.state import AgentState, TraceEntry

if TYPE_CHECKING:
    from app.services.agent_graph_service import AgentGraphService

SYSTEM = """Tu es l'agent Analyste de Nyatefe (droit togolais).
Reformule la question et decide si elle est juridique et assez claire pour rechercher des textes officiels.

Reponds UNIQUEMENT en JSON:
{
  "question_reformulee": "string",
  "est_juridique": true/false,
  "est_claire": true/false,
  "redirection": true/false,
  "message_redirection": "string ou vide si pas de redirection"
}

Regles:
- redirection=true si hors sujet: pas de droit togolais, programmation, code, tech, ou sujet general.
- redirection=true si trop floue (pas de faits ni d'intention juridique).
- message_redirection: 1 a 2 phrases, rappeler que Nyatefe est assistant juridique togolais uniquement.
- Salutations seules: est_juridique=false, redirection=true, message accueillant."""


def run_analyste(service: AgentGraphService, state: AgentState) -> dict:
    started = time.perf_counter()
    question = state.get("question") or ""
    history = state.get("history") or []

    user = f"Question utilisateur:\n{question}"
    data, provider = complete_json(
        rodium=service.rodium,
        ollama=service.ollama,
        mistral=service.mistral,
        chat_provider=service.settings.chat_provider,
        mistral_fallback_enabled=service.settings.mistral_fallback_enabled,
        system=SYSTEM,
        user=user,
        history=history,
    )

    trace: TraceEntry = {
        "node": "analyste",
        "detail": f"redirection={data.get('redirection')} provider={provider}",
        "duration_ms": int((time.perf_counter() - started) * 1000),
    }

    return {
        "question_reformulee": str(data.get("question_reformulee") or question),
        "est_juridique": bool(data.get("est_juridique")),
        "est_claire": bool(data.get("est_claire")),
        "redirection": bool(data.get("redirection")),
        "message_redirection": str(data.get("message_redirection") or ""),
        "provider": provider,
        "trace": [trace],
    }
