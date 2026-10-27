from __future__ import annotations

from langgraph.graph import END, StateGraph

from app.agents.nodes.analyste import run_analyste
from app.agents.nodes.clarify import run_clarify
from app.agents.nodes.garde_fou import run_garde_fou
from app.agents.nodes.redacteur import run_redacteur
from app.agents.nodes.repli import run_repli
from app.agents.nodes.routeur import run_routeur
from app.agents.nodes.specialiste import run_specialiste
from app.agents.nodes.specialiste_indisponible import run_specialiste_indisponible
from app.agents.nodes.verificateur import run_verificateur
from app.agents.state import AgentState
from typing import Any


def _after_analyste(state: AgentState) -> str:
    if state.get("redirection"):
        return "clarify"
    return "routeur"


def _after_routeur(state: AgentState) -> str:
    if not state.get("est_couvert"):
        return "specialiste_indisponible"
    return "specialiste"


def _after_specialiste(state: AgentState) -> str:
    if not state.get("passages"):
        return "repli"
    return "redacteur"


def _after_verificateur(state: AgentState) -> str:
    verdict = state.get("verdict")
    nb = int(state.get("nb_essais") or 0)
    passages = state.get("passages") or []
    if verdict == "ok":
        return "garde_fou"
    if not passages:
        return "repli"
    if verdict == "fail" and nb >= 2:
        return "repli"
    if verdict == "retry" and nb >= 2:
        return "garde_fou"
    if verdict == "fail" and nb >= 1:
        return "repli"
    return "retry_search"


def _increment_essais(_service: Any, state: AgentState) -> dict:
    return {"nb_essais": int(state.get("nb_essais") or 0) + 1}


def build_agent_graph(service: Any):
    graph = StateGraph(AgentState)

    graph.add_node("analyste", lambda s: run_analyste(service, s))
    graph.add_node("routeur", lambda s: run_routeur(service, s))
    graph.add_node("specialiste", lambda s: run_specialiste(service, s))
    graph.add_node(
        "specialiste_indisponible",
        lambda s: run_specialiste_indisponible(service, s),
    )
    graph.add_node("redacteur", lambda s: run_redacteur(service, s))
    graph.add_node("verificateur", lambda s: run_verificateur(service, s))
    graph.add_node("garde_fou", lambda s: run_garde_fou(service, s))
    graph.add_node("clarify", lambda s: run_clarify(service, s))
    graph.add_node("repli", lambda s: run_repli(service, s))
    graph.add_node("increment_essais", lambda s: _increment_essais(service, s))

    graph.set_entry_point("analyste")
    graph.add_conditional_edges(
        "analyste",
        _after_analyste,
        {"clarify": "clarify", "routeur": "routeur"},
    )
    graph.add_conditional_edges(
        "routeur",
        _after_routeur,
        {
            "specialiste_indisponible": "specialiste_indisponible",
            "specialiste": "specialiste",
        },
    )
    graph.add_conditional_edges(
        "specialiste",
        _after_specialiste,
        {"repli": "repli", "redacteur": "redacteur"},
    )
    graph.add_edge("redacteur", "verificateur")
    graph.add_conditional_edges(
        "verificateur",
        _after_verificateur,
        {
            "garde_fou": "garde_fou",
            "repli": "repli",
            "retry_search": "increment_essais",
        },
    )
    graph.add_edge("increment_essais", "specialiste")
    graph.add_edge("garde_fou", END)
    graph.add_edge("specialiste_indisponible", END)
    graph.add_edge("clarify", END)
    graph.add_edge("repli", END)

    return graph.compile()
