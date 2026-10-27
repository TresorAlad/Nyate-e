from __future__ import annotations

import re

_ARTICLE_RE = re.compile(
    r"(?i)\b(?:article|art\.?)\s*([0-9]+[a-zA-Z]?(?:\s*[-–]\s*[0-9]+)?)\b"
)


def infer_article_label(text: str, metadata_article: str | None = None) -> str | None:
    if metadata_article and str(metadata_article).strip():
        return str(metadata_article).strip()
    if not text:
        return None
    match = _ARTICLE_RE.search(text[:600])
    if not match:
        return None
    return match.group(1).strip()


def format_article_heading(article: str | None) -> str:
    if not article:
        return "Extrait officiel"
    cleaned = article.strip()
    if cleaned.lower().startswith("article"):
        return cleaned[0].upper() + cleaned[1:]
    return f"Article {cleaned}"
