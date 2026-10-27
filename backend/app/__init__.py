from dotenv import load_dotenv
from flask import Flask

from app.config import load_settings
from app.db import create_pool
from app.routes.auth_routes import auth_bp, register_auth_routes
from app.routes.chat import chat_bp, register_chat_routes
from app.routes.documents import documents_bp, register_document_routes
from app.routes.health import health_bp, register_health_routes
from app.routes.queue import queue_bp, register_queue_routes
from app.routes.search import register_search_routes, search_bp
from app.services.mistral_client import MistralCloudClient
from app.services.ollama_client import OllamaClient
from app.services.ollama_queue import OllamaRequestQueue
from app.services.rodium_client import RodiumClient
from app.services.agent_graph_service import AgentGraphService
from app.services.rag_service import RagService


def create_app() -> Flask:
    load_dotenv()
    settings = load_settings()

    app = Flask(__name__)
    app.config["SECRET_KEY"] = settings.secret_key

    pool = create_pool(settings)
    ollama = OllamaClient(settings)
    mistral = MistralCloudClient(settings)
    ollama_queue = OllamaRequestQueue(
        max_waiting=settings.ollama_queue_max_waiting,
        wait_timeout_seconds=settings.ollama_queue_wait_timeout_seconds,
    )
    rodium = RodiumClient(settings)
    rag = RagService(settings, ollama, mistral, rodium, ollama_queue)
    agent_graph = AgentGraphService(
        settings, rag, ollama, mistral, rodium, ollama_queue, pool
    )

    app.extensions["db_pool"] = pool
    app.extensions["ollama_queue"] = ollama_queue

    register_auth_routes(auth_bp, pool, settings)
    register_health_routes(health_bp, ollama)
    register_queue_routes(queue_bp, ollama_queue)
    register_document_routes(documents_bp, pool, rag, settings)
    register_search_routes(search_bp, pool, rag)
    register_chat_routes(chat_bp, pool, rag, settings, agent_graph)

    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(queue_bp, url_prefix="/api")
    app.register_blueprint(documents_bp, url_prefix="/api")
    app.register_blueprint(search_bp, url_prefix="/api")
    app.register_blueprint(chat_bp, url_prefix="/api")

    @app.teardown_appcontext
    def close_pool(_exc=None):
        pass

    return app
