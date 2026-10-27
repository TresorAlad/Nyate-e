import json
import unittest

from app.services.chat_stream_service import _sse


class SseFormatTests(unittest.TestCase):
    def test_sse_event_shape(self) -> None:
        line = _sse("token", {"text": "Bonjour"})
        self.assertTrue(line.startswith("data: "))
        payload = json.loads(line.removeprefix("data: ").strip())
        self.assertEqual(payload["event"], "token")
        self.assertEqual(payload["text"], "Bonjour")


if __name__ == "__main__":
    unittest.main()
