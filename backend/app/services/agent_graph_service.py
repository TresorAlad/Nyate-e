from __future__ import annotations

import logging
from typing import Any

from psycopg import Connection
from psycopg_pool import ConnectionPool

from app.agents.domain_config import load_domains
from app.agents.graph import build_agent_graph
from app.agents.state import AgentState
from app.config import Settings
from app.services.mistral_client import MistralCloudClient
from app.services.ollama_client import OllamaClient
from app.services.ollama_queue import OllamaRequestQueue
from app.services.chat_stream_service import stream_chat_events
from app.services.rag_service import RagService, _sanitize_history
from app.services.rodium_client import RodiumClient

logger = logging.getLogger(__name__)


class AgentGraphService:
    def __init__(
        self,
        settings: Settings,
        rag: RagService,
        ollama: OllamaClient,
        mistral: MistralCloudClient,
        rodium: RodiumClient,
        ollama_queue: OllamaRequestQueue,
        pool: ConnectionPool,
    ) -> None:
        self.settings = settings
        self.rag = rag
        self.ollama = ollama
        self.mistral = mistral
        self.rodium = rodium
        self.ollama_queue = ollama_queue
        self.pool = pool
        self.domains = load_domains()
        self.current_conn: Connection[Any] | None = None
        if settings.agent_graph_mode != "full":
            logger.warning(
                "AGENT_GRAPH_MODE=%s ignore; seul le graphe full est supporte.",
                settings.agent_graph_mode,
            )
        self._graph = build_agent_graph(self)

    def run(
        self,
        conn: Connection[Any],
        question: str,
        history: list[dict[str, str]] | None = None,
        top_k: int | None = None,
    ) -> dict[str, Any]:
        return self.ollama_queue.run(
            lambda: self._run_graph(conn, question, history, top_k)
        )

    def _run_graph(
        self,
        conn: Connection[Any],
        question: str,
        history: list[dict[str, str]] | None,
        top_k: int | None,
    ) -> dict[str, Any]:
        self.current_conn = conn
        try:
            initial: AgentState = {
                "question": question,
                "history": _sanitize_history(history or []),
                "top_k": top_k or self.settings.rag_top_k,
                "nb_essais": 0,
                "trace": [],
            }
            final = self._graph.invoke(initial)
            trace = final.get("trace") or []
            for entry in trace:
                logger.info(
                    "agent_graph node=%s detail=%s duration_ms=%s",
                    entry.get("node"),
                    entry.get("detail"),
                    entry.get("duration_ms"),
                )

            mode = final.get("mode") or "legal"

            return {
                "answer": final.get("reponse") or "",
                "provider": final.get("provider") or self.settings.chat_provider,
                "sources": final.get("sources") or [],
                "mode": mode,
                "trace": trace,
            }
        finally:
            self.current_conn = None

    def stream_events(
        self,
        question: str,
        history: list[dict[str, str]] | None = None,
        top_k: int | None = None,
    ):
        yield from stream_chat_events(self, question, history=history, top_k=top_k)
