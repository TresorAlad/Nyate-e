from flask import Blueprint, jsonify

from app.services.ollama_client import OllamaClient

health_bp = Blueprint("health", __name__)


def register_health_routes(bp: Blueprint, ollama: OllamaClient) -> None:
    @bp.get("/health")
    def health():
        return jsonify({"status": "ok", "service": "nyatefe-api"})

    @bp.get("/health/ollama")
    def health_ollama():
        try:
            _ = ollama.embed("ping")
            return jsonify({"status": "ok", "ollama": "reachable"})
        except Exception as exc:
            return jsonify({"status": "error", "ollama": str(exc)}), 503
