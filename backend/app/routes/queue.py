from flask import Blueprint, jsonify

from app.services.ollama_queue import OllamaRequestQueue

queue_bp = Blueprint('queue', __name__)


def register_queue_routes(bp: Blueprint, ollama_queue: OllamaRequestQueue) -> None:
    @bp.get('/queue')
    def queue_status():
        status = ollama_queue.status()
        return jsonify(
            {
                'waiting': status.waiting,
                'active': status.active,
                'busy': status.active > 0 or status.waiting > 0,
            }
        )
