import unittest

from app.services.rag_service import aggregate_document_candidates


class RagDocumentCandidateTests(unittest.TestCase):
    def test_aggregate_keeps_best_score_per_document(self) -> None:
        rows = [
            {
                "document_id": "aaa",
                "title": "Doc A",
                "doc_type": "code",
                "similarity": 0.41,
            },
            {
                "document_id": "aaa",
                "title": "Doc A",
                "doc_type": "code",
                "similarity": 0.55,
            },
            {
                "document_id": "bbb",
                "title": "Doc B",
                "doc_type": "loi",
                "similarity": 0.48,
            },
        ]
        ranked = aggregate_document_candidates(rows, max_documents=2)
        self.assertEqual(len(ranked), 2)
        self.assertEqual(ranked[0]["document_id"], "aaa")
        self.assertAlmostEqual(float(ranked[0]["similarity"]), 0.55)


if __name__ == "__main__":
    unittest.main()
