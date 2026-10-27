import unittest

from app.agents.document_catalog import DocumentCatalogEntry
from app.agents.document_router import pick_document_targets


class DocumentRouterTests(unittest.TestCase):
    def setUp(self) -> None:
        self.catalog = [
            DocumentCatalogEntry("1", "Code du travail togolais", "code", "Loi travail"),
            DocumentCatalogEntry(
                "2", "Code foncier, bail et domanial", "code", "2018-005"
            ),
            DocumentCatalogEntry("3", "Acte uniforme OHADA SARL", "acte_uniforme", "OHADA"),
        ]

    def test_pick_bail_from_foncier_title(self) -> None:
        targets = pick_document_targets(
            "Un bailleur peut-il augmenter le loyer sans préavis ?",
            self.catalog,
            [],
            max_documents=2,
        )
        self.assertIn("2", targets)

    def test_vector_hints_priority(self) -> None:
        targets = pick_document_targets(
            "Question generique",
            self.catalog,
            [{"document_id": "3", "similarity": 0.82}],
            max_documents=2,
        )
        self.assertEqual(targets[0], "3")


if __name__ == "__main__":
    unittest.main()
