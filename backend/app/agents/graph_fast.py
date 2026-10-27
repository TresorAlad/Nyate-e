from __future__ import annotations

from langgraph.graph import END, StateGraph

from app.agents.nodes.coordinateur import run_coordinateur
from app.agents.nodes.garde_fou import run_garde_fou
from app.agents.nodes.redacteur import run_redacteur
from app.agents.nodes.repli import run_repli
from app.agents.nodes.verificateur_fast import run_verificateur_fast
from app.agents.state import AgentState
from typing import Any


def _after_coordinateur(state: AgentState) -> str:
    if not state.get("passages"):
        return "repli"
    return "redacteur"


def _after_verificateur_fast(state: AgentState) -> str:
    if state.get("verdict") == "ok":
        return "garde_fou"
    return "repli"


def build_fast_agent_graph(service: Any):
    """Graphe rapide: 1 embedding + recherche parallele + 1 redaction (+ controle heuristique)."""
    graph = StateGraph(AgentState)

    graph.add_node("coordinateur", lambda s: run_coordinateur(service, s))
    graph.add_node("redacteur", lambda s: run_redacteur(service, s))
    graph.add_node("verificateur_fast", lambda s: run_verificateur_fast(service, s))
    graph.add_node("garde_fou", lambda s: run_garde_fou(service, s))
    graph.add_node("repli", lambda s: run_repli(service, s))

    graph.set_entry_point("coordinateur")
    graph.add_conditional_edges(
        "coordinateur",
        _after_coordinateur,
        {"repli": "repli", "redacteur": "redacteur"},
    )
    graph.add_edge("redacteur", "verificateur_fast")
    graph.add_conditional_edges(
        "verificateur_fast",
        _after_verificateur_fast,
        {"garde_fou": "garde_fou", "repli": "repli"},
    )
    graph.add_edge("garde_fou", END)
    graph.add_edge("repli", END)

    return graph.compile()
