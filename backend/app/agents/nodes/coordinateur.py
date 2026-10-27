from __future__ import annotations

from typing import TYPE_CHECKING

from app.agents.state import AgentState
from app.services.retrieval_pipeline import run_fast_retrieval

if TYPE_CHECKING:
    from app.services.agent_graph_service import AgentGraphService


def run_coordinateur(service: AgentGraphService, state: AgentState) -> dict:
    question = (state.get("question") or "").strip()
    top_k = state.get("top_k") or service.settings.rag_top_k
    result = run_fast_retrieval(service, question, top_k=top_k)

    trace = result.trace
    return {
        "question_reformulee": result.question_reformulee,
        "domaine": result.domaine,
        "domaines_cibles": result.domaines_cibles,
        "documents_cibles": result.documents_cibles,
        "requetes": [result.question_reformulee],
        "passages": result.passages,
        "filtre_domaine_ignore": False,
        "nb_essais": 0,
        "trace": [trace] if trace else [],
    }
