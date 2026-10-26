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
    rag_top_k: int
    rag_min_similarity: float
    chunk_size: int
    chunk_overlap: int
    ingest_api_key: str
    ollama_queue_max_waiting: int
    ollama_queue_wait_timeout_seconds: int


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
        rag_top_k=int(os.environ.get("RAG_TOP_K", "5")),
        rag_min_similarity=float(os.environ.get("RAG_MIN_SIMILARITY", "0.35")),
        chunk_size=int(os.environ.get("CHUNK_SIZE", "800")),
        chunk_overlap=int(os.environ.get("CHUNK_OVERLAP", "120")),
        ingest_api_key=os.environ.get("INGEST_API_KEY", ""),
        ollama_queue_max_waiting=int(os.environ.get("OLLAMA_QUEUE_MAX_WAITING", "4")),
        ollama_queue_wait_timeout_seconds=int(
            os.environ.get("OLLAMA_QUEUE_WAIT_TIMEOUT_SECONDS", "300")
        ),
    )
