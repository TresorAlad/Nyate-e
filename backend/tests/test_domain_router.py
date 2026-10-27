import unittest

from app.agents.domain_config import LegalDomain
from app.agents.domain_router import pick_domain_targets, score_domains


class DomainRouterTests(unittest.TestCase):
    def setUp(self) -> None:
        self.domains = [
            LegalDomain("penal", "Penal", ("code",)),
            LegalDomain("travail", "Travail", ("code",)),
            LegalDomain("foncier", "Foncier", ("code",)),
            LegalDomain("public", "Public", ("code",)),
        ]

    def test_foncier_question(self) -> None:
        targets = pick_domain_targets(
            "Quelles sont les conditions de validite d'une vente de terrain coutumier ?",
            self.domains,
        )
        self.assertIn("foncier", targets)

    def test_travail_question(self) -> None:
        ranked = score_domains("Quelles regles pour un licenciement au Togo ?", self.domains)
        self.assertTrue(ranked)
        self.assertEqual(ranked[0][0], "travail")


if __name__ == "__main__":
    unittest.main()
