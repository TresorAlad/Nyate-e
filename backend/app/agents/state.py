from __future__ import annotations

import operator
from typing import Annotated, Any, Literal, TypedDict


class HistoryMessage(TypedDict):
    role: str
    content: str


class Passage(TypedDict, total=False):
    chunk_id: str
    document_id: str
    texte: str
    article: str | None
    source_ref: str | None
    version_date: str | None
    similarite: float
    domaine: str | None
    title: str | None
    doc_type: str | None
    chunk_index: int


class TraceEntry(TypedDict, total=False):
    node: str
    detail: str
    duration_ms: int


Verdict = Literal["ok", "retry", "fail"]
ResponseMode = Literal[
    "legal", "clarification", "fallback", "small_talk", "unavailable", "no_source"
]


class AgentState(TypedDict, total=False):
    question: str
    history: list[HistoryMessage]
    top_k: int

    question_reformulee: str
    est_juridique: bool
    est_claire: bool
    redirection: bool
    message_redirection: str

    domaine: str
    domaine_demandee: str
    est_couvert: bool
    specialiste_id: str
    domaines_cibles: list[str]
    documents_cibles: list[str]
    confiance_routeur: float

    requetes: list[str]
    passages: list[Passage]
    filtre_domaine_ignore: bool

    brouillon: str
    verdict: Verdict
    affirmations_non_sourcees: list[str]
    nb_essais: int

    reponse: str
    sources: list[dict[str, Any]]
    provider: str
    mode: ResponseMode
    trace: Annotated[list[TraceEntry], operator.add]
