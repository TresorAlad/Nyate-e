from __future__ import annotations

import unicodedata


def _normalize(text: str) -> str:
    folded = unicodedata.normalize("NFKD", text.strip().lower())
    return "".join(ch for ch in folded if not unicodedata.combining(ch))


def infer_domain_for_document(title: str, doc_type: str | None) -> str | None:
    blob = _normalize(f"{title} {doc_type or ''}")
    if any(k in blob for k in ("donnee personnel", "données personnel", "vie privee")):
        return "donnees_personnelles"
    if "constitution" in blob:
        return "constitution"
    if any(k in blob for k in ("impot", "impôt", "fiscal", "otr", "cgi")):
        return "affaires"
    if any(k in blob for k in ("travail", "licenciement", "employeur")):
        return "travail"
    if any(k in blob for k in ("foncier", "terrain", "domanial", "bail")):
        return "foncier"
    if any(k in blob for k in ("famille", "succession", "mariage", "personnes")):
        return "famille"
    if any(k in blob for k in ("ohada", "commercial", "sarl", "societe")):
        return "commercial"
    if any(k in blob for k in ("penal", "penal", "infraction", "2015-010")):
        return "penal"
    if any(k in blob for k in ("decret", "public")):
        return "public"
    return None
