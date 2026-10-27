import unittest

from app.agents.llm import _extract_json


class LlmJsonTests(unittest.TestCase):
    def test_extract_from_fence(self) -> None:
        raw = 'Voici:\n```json\n{"verdict": "ok"}\n```'
        data = _extract_json(raw)
        self.assertEqual(data["verdict"], "ok")


if __name__ == "__main__":
    unittest.main()
