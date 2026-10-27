import unittest

from app.agents.source_format import format_article_heading, infer_article_label


class SourceFormatTests(unittest.TestCase):
    def test_infer_article(self) -> None:
        text = "Article 125 - Le contrat de travail est conclu par ecrit."
        self.assertEqual(infer_article_label(text), "125")

    def test_format_heading(self) -> None:
        self.assertEqual(format_article_heading("42"), "Article 42")


if __name__ == "__main__":
    unittest.main()
