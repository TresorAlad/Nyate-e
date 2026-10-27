import unittest

from app.agents.graph_fast import _after_coordinateur, _after_verificateur_fast
from app.agents.state import AgentState


class GraphFastEdgeTests(unittest.TestCase):
    def test_coordinateur_repli_without_passages(self) -> None:
        state: AgentState = {"passages": []}
        self.assertEqual(_after_coordinateur(state), "repli")

    def test_verificateur_fast_ok(self) -> None:
        state: AgentState = {"verdict": "ok"}
        self.assertEqual(_after_verificateur_fast(state), "garde_fou")


if __name__ == "__main__":
    unittest.main()
