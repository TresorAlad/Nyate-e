import unittest

from app.services.chat_intent import is_greeting_only, needs_legal_rag


class ChatIntentTests(unittest.TestCase):
    def test_greeting_skips_rag(self) -> None:
        self.assertFalse(needs_legal_rag("salut", []))
        self.assertTrue(is_greeting_only("salut"))
        self.assertTrue(is_greeting_only("Bonjour !"))

    def test_legal_question_uses_rag(self) -> None:
        self.assertTrue(
            needs_legal_rag("Quelle peine pour vol simple au Togo ?", [])
        )


if __name__ == "__main__":
    unittest.main()
