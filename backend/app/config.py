import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    secret_key: str
    database_url: str
    ollama_base_url: str
    ollama_chat_model: str
    ollama_embed_model: str
    mistral_api_key: str
    mistral_api_model: str
    mistral_fallback_enabled: bool
    mistral_fallback_timeout_seconds: int
    chat_provider: str
    rodium_api_key: str
    rodium_api_base_url: str
    rodium_chat_model: str
    rodium_max_tokens: int
    rodium_timeout_seconds: int
    rag_top_k: int
    rag_min_similarity: float
    chunk_size: int
    chunk_overlap: int
    ingest_api_key: str
    ollama_queue_max_waiting: int
    ollama_queue_wait_timeout_seconds: int
    agent_graph_enabled: bool
    agent_graph_mode: str
    agent_parallel_domains: int
    agent_retrieval_mode: str
    agent_document_scan_top_k: int
    agent_max_sources: int
    chat_max_tokens: int
    chat_max_answer_chars: int


def load_settings() -> Settings:
    return Settings(
        secret_key=os.environ.get("SECRET_KEY", "dev-only-change-me"),
        database_url=os.environ["DATABASE_URL"],
        ollama_base_url=os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434"),
        ollama_chat_model=os.environ.get(
            "OLLAMA_CHAT_MODEL", "mistral:7b-instruct-q4_K_M"
        ),
        ollama_embed_model=os.environ.get("OLLAMA_EMBED_MODEL", "nomic-embed-text"),
        mistral_api_key=os.environ.get("MISTRAL_API_KEY", ""),
        mistral_api_model=os.environ.get("MISTRAL_API_MODEL", "mistral-small-latest"),
        mistral_fallback_enabled=os.environ.get("MISTRAL_FALLBACK_ENABLED", "false").lower()
        == "true",
        mistral_fallback_timeout_seconds=int(
            os.environ.get("MISTRAL_FALLBACK_TIMEOUT_SECONDS", "90")
        ),
        chat_provider=os.environ.get("CHAT_PROVIDER", "ollama").lower(),
        rodium_api_key=os.environ.get("RODIUMAI_API_KEY", ""),
        rodium_api_base_url=os.environ.get(
            "RODIUMAI_API_BASE_URL", "https://api.rodiumai.io/v1"
        ),
        rodium_chat_model=os.environ.get(
            "RODIUMAI_CHAT_MODEL", "mistral/ministral-3-8b-instruct"
        ),
        rodium_max_tokens=int(os.environ.get("RODIUMAI_MAX_TOKENS", "512")),
        rodium_timeout_seconds=int(os.environ.get("RODIUMAI_TIMEOUT_SECONDS", "120")),
        rag_top_k=int(os.environ.get("RAG_TOP_K", "3")),
        rag_min_similarity=float(os.environ.get("RAG_MIN_SIMILARITY", "0.35")),
        chunk_size=int(os.environ.get("CHUNK_SIZE", "800")),
        chunk_overlap=int(os.environ.get("CHUNK_OVERLAP", "120")),
        ingest_api_key=os.environ.get("INGEST_API_KEY", ""),
        ollama_queue_max_waiting=int(os.environ.get("OLLAMA_QUEUE_MAX_WAITING", "4")),
        ollama_queue_wait_timeout_seconds=int(
            os.environ.get("OLLAMA_QUEUE_WAIT_TIMEOUT_SECONDS", "300")
        ),
        agent_graph_enabled=os.environ.get("AGENT_GRAPH_ENABLED", "false").lower()
        == "true",
        agent_graph_mode=os.environ.get("AGENT_GRAPH_MODE", "full").lower(),
        agent_parallel_domains=int(os.environ.get("AGENT_PARALLEL_DOMAINS", "3")),
        agent_retrieval_mode=os.environ.get("AGENT_RETRIEVAL_MODE", "hybrid").lower(),
        agent_document_scan_top_k=int(os.environ.get("AGENT_DOCUMENT_SCAN_TOP_K", "15")),
        agent_max_sources=int(os.environ.get("AGENT_MAX_SOURCES", "3")),
        chat_max_tokens=int(os.environ.get("CHAT_MAX_TOKENS", "512")),
        chat_max_answer_chars=int(os.environ.get("CHAT_MAX_ANSWER_CHARS", "1600")),
    )
