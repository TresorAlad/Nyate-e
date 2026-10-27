import unittest

from app.agents.passages import passages_to_api_sources


class PassagesTests(unittest.TestCase):
    def test_max_sources(self) -> None:
        passages = [
            {"chunk_id": str(i), "texte": "x", "document_id": "d"} for i in range(5)
        ]
        sources = passages_to_api_sources(passages, max_sources=3)
        self.assertEqual(len(sources), 3)


if __name__ == "__main__":
    unittest.main()
