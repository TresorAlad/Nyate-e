import unittest

from app.agents.graph import (
    _after_analyste,
    _after_routeur,
    _after_specialiste,
    _after_verificateur,
)
from app.agents.state import AgentState


class GraphEdgeTests(unittest.TestCase):
    def test_analyste_redirection(self) -> None:
        state: AgentState = {"redirection": True}
        self.assertEqual(_after_analyste(state), "clarify")

    def test_routeur_indisponible(self) -> None:
        state: AgentState = {"est_couvert": False}
        self.assertEqual(_after_routeur(state), "specialiste_indisponible")

    def test_routeur_specialiste(self) -> None:
        state: AgentState = {"est_couvert": True}
        self.assertEqual(_after_routeur(state), "specialiste")

    def test_verificateur_retry(self) -> None:
        state: AgentState = {
            "verdict": "retry",
            "nb_essais": 0,
            "passages": [{"chunk_id": "1"}],
        }
        self.assertEqual(_after_verificateur(state), "retry_search")

    def test_verificateur_garde_fou_after_two_essais_with_passages(self) -> None:
        state: AgentState = {"verdict": "retry", "nb_essais": 2, "passages": [{}]}
        self.assertEqual(_after_verificateur(state), "garde_fou")

    def test_verificateur_repli_without_passages(self) -> None:
        state: AgentState = {"verdict": "retry", "nb_essais": 0, "passages": []}
        self.assertEqual(_after_verificateur(state), "repli")

    def test_specialiste_repli_without_passages(self) -> None:
        state: AgentState = {"passages": []}
        self.assertEqual(_after_specialiste(state), "repli")

    def test_specialiste_redacteur_with_passages(self) -> None:
        state: AgentState = {"passages": [{"chunk_id": "1"}]}
        self.assertEqual(_after_specialiste(state), "redacteur")


if __name__ == "__main__":
    unittest.main()
