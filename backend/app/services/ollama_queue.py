import threading
from dataclasses import dataclass
from typing import Callable, TypeVar

T = TypeVar('T')


class QueueFullError(Exception):
    pass


class QueueWaitTimeoutError(Exception):
    pass


@dataclass(frozen=True)
class QueueStatus:
    waiting: int
    active: int


class OllamaRequestQueue:
    def __init__(self, max_waiting: int, wait_timeout_seconds: int) -> None:
        self._max_waiting = max_waiting
        self._wait_timeout_seconds = wait_timeout_seconds
        self._cond = threading.Condition()
        self._active = 0
        self._waiting = 0

    def status(self) -> QueueStatus:
        with self._cond:
            return QueueStatus(waiting=self._waiting, active=self._active)

    def run(self, job: Callable[[], T]) -> T:
        with self._cond:
            if self._waiting >= self._max_waiting:
                raise QueueFullError(
                    'Trop de requêtes en attente. Réessayez dans quelques instants.'
                )
            self._waiting += 1
            deadline = threading.current_thread()
            try:
                while self._active >= 1:
                    notified = self._cond.wait(timeout=self._wait_timeout_seconds)
                    if self._active >= 1 and not notified:
                        raise QueueWaitTimeoutError(
                            'Délai d\'attente dépassé dans la file Ollama.'
                        )
                self._waiting -= 1
                self._active += 1
            except Exception:
                self._waiting -= 1
                self._cond.notify()
                raise

        try:
            return job()
        finally:
            with self._cond:
                self._active -= 1
                self._cond.notify()
