from __future__ import annotations

import time
from typing import TYPE_CHECKING

from app.agents.llm import build_messages, complete_messages
from app.agents.state import AgentState, TraceEntry

if TYPE_CHECKING:
    from app.services.agent_graph_service import AgentGraphService

SYSTEM = """Tu es Nyatefe, assistant juridique pour le droit togolais uniquement.
Reponse courte au citoyen, a partir des passages fournis.

Regles:
- Maximum 120 mots. Pas de listes longues.
- Uniquement droit togolais: pas de programmation, pas de code source, pas de JSON
- Ne cite que des articles presents dans les passages (1 a 2 references max).
- N'invente rien. Pas de bibliographie.
- Ton chaleureux, vouvoiement."""


def _format_passages(state: AgentState) -> str:
    passages = state.get("passages") or []
    if not passages:
        return "Aucun passage disponible."
    blocks: list[str] = []
    for idx, p in enumerate(passages, start=1):
        blocks.append(
            f"[{idx}] chunk_id={p.get('chunk_id')}\n"
            f"Titre: {p.get('title')}\n"
            f"Article: {p.get('article') or 'N/A'}\n"
            f"Source: {p.get('source_ref') or 'N/A'}\n"
            f"Extrait:\n{(p.get('texte') or '')[:480]}"
        )
    return "\n\n".join(blocks)


def build_redacteur_messages(state: AgentState) -> list[dict[str, str]]:
    question = state.get("question_reformulee") or state.get("question") or ""
    user = f"""Question:
{question}

Passages officiels:
{_format_passages(state)}

Redige la reponse."""
    return build_messages(SYSTEM, user, state.get("history"))


def run_redacteur(service: AgentGraphService, state: AgentState) -> dict:
    started = time.perf_counter()
    messages = build_redacteur_messages(state)

    provider, brouillon = complete_messages(
        rodium=service.rodium,
        ollama=service.ollama,
        mistral=service.mistral,
        chat_provider=service.settings.chat_provider,
        mistral_fallback_enabled=service.settings.mistral_fallback_enabled,
        messages=messages,
        max_tokens=service.settings.chat_max_tokens,
    )

    trace: TraceEntry = {
        "node": "synthese",
        "detail": f"chars={len(brouillon)}",
        "duration_ms": int((time.perf_counter() - started) * 1000),
    }

    return {
        "brouillon": brouillon,
        "provider": provider,
        "trace": [trace],
    }
