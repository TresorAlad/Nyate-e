from __future__ import annotations

import json
from collections.abc import Iterator
from typing import TYPE_CHECKING, Any

from app.agents.llm import complete_text_stream
from app.agents.nodes.garde_fou import DISCLAIMER
from app.agents.nodes.redacteur import build_redacteur_messages
from app.agents.nodes.verificateur_fast import run_verificateur_fast
from app.agents.passages import passages_to_api_sources
from app.agents.state import AgentState
from app.services.chat_intent import is_greeting_only, needs_legal_rag
from app.services.citizen_responses import GREETING_ANSWER, NO_OFFICIAL_SOURCE_ANSWER
from app.services.retrieval_pipeline import run_fast_retrieval

if TYPE_CHECKING:
    from app.services.agent_graph_service import AgentGraphService


def _sse(event: str, payload: dict[str, Any]) -> str:
    body = {"event": event, **payload}
    return f"data: {json.dumps(body, ensure_ascii=False)}\n\n"


def _append_disclaimer(answer: str) -> str:
    if DISCLAIMER.strip() in answer:
        return answer
    return answer + DISCLAIMER


def stream_chat_events(
    service: AgentGraphService,
    question: str,
    history: list[dict[str, str]] | None = None,
    top_k: int | None = None,
) -> Iterator[str]:
    sanitized_history = history or []

    if not needs_legal_rag(question, sanitized_history):
        answer = (
            GREETING_ANSWER
            if is_greeting_only(question)
            else service.rag.answer_small_talk(question, sanitized_history)["answer"]
        )
        yield _sse("done", {"provider": service.settings.chat_provider, "answer": answer})
        return

    yield _sse("phase", {"step": "retrieval"})

    retrieval = run_fast_retrieval(service, question, top_k=top_k)
    yield _sse(
        "meta",
        {
            "mode": retrieval.retrieval_mode,
            "domains": retrieval.domaines_cibles,
            "documents": retrieval.documents_cibles,
        },
    )

    state: AgentState = {
        "question": question,
        "question_reformulee": retrieval.question_reformulee,
        "history": sanitized_history,
        "passages": retrieval.passages,
        "domaine": retrieval.domaine,
        "domaines_cibles": retrieval.domaines_cibles,
        "documents_cibles": retrieval.documents_cibles,
    }

    if not retrieval.passages:
        yield _sse(
            "done",
            {
                "provider": service.settings.chat_provider,
                "answer": NO_OFFICIAL_SOURCE_ANSWER,
                "sources": [],
                "mode": "no_source",
            },
        )
        return

    sources = passages_to_api_sources(retrieval.passages)
    yield _sse("sources", {"sources": sources})

    verdict = run_verificateur_fast(service, state).get("verdict")
    if verdict != "ok":
        yield _sse(
            "done",
            {
                "provider": service.settings.chat_provider,
                "answer": NO_OFFICIAL_SOURCE_ANSWER,
                "sources": [],
                "mode": "no_source",
            },
        )
        return

    yield _sse("phase", {"step": "generation"})

    messages = build_redacteur_messages(state)
    provider, token_iter = complete_text_stream(
        rodium=service.rodium,
        ollama=service.ollama,
        mistral=service.mistral,
        chat_provider=service.settings.chat_provider,
        mistral_fallback_enabled=service.settings.mistral_fallback_enabled,
        messages=messages,
    )

    parts: list[str] = []
    for token in token_iter:
        parts.append(token)
        yield _sse("token", {"text": token})

    answer = _append_disclaimer("".join(parts).strip())
    yield _sse(
        "done",
        {
            "provider": provider,
            "answer": answer,
            "sources": sources,
            "mode": "legal_stream",
        },
    )
