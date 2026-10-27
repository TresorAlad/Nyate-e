import unittest
from unittest.mock import MagicMock

from app.agents.specialist_registry import (
    invalidate_specialist_registry_cache,
    is_specialist_configured,
)


class SpecialistRegistryTests(unittest.TestCase):
    def test_penal_configured(self) -> None:
        self.assertTrue(is_specialist_configured("penal"))

    def test_foncier_inactive(self) -> None:
        self.assertFalse(is_specialist_configured("foncier"))

    def test_chunk_counts_cache(self) -> None:
        invalidate_specialist_registry_cache()
        conn = MagicMock()
        conn.execute.return_value.fetchall.return_value = [
            {"domaine": "penal", "n": 10},
        ]
        from app.agents import specialist_registry as reg

        counts = reg.get_chunk_counts(conn)
        self.assertEqual(counts.get("penal"), 10)
        reg.get_chunk_counts(conn)
        self.assertEqual(conn.execute.call_count, 1)


if __name__ == "__main__":
    unittest.main()
