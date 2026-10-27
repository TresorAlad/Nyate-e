from __future__ import annotations

import re
import unicodedata

from app.agents.domain_config import LegalDomain

_DOMAIN_KEYWORDS: dict[str, tuple[str, ...]] = {
    "penal": (
        "penal",
        "pénal",
        "crime",
        "delit",
        "délit",
        "contravention",
        "peine",
        "prison",
        "vol",
        "agression",
        "infraction",
        "tribunal penal",
    ),
    "travail": (
        "travail",
        "employeur",
        "employe",
        "employé",
        "salarie",
        "salarié",
        "licenciement",
        "contrat de travail",
        "conge",
        "congé",
        "code du travail",
        "cnss",
    ),
    "famille": (
        "famille",
        "mariage",
        "divorce",
        "succession",
        "heritier",
        "héritier",
        "filiation",
        "enfant",
        "pension alimentaire",
        "personnes",
    ),
    "foncier": (
        "foncier",
        "terrain",
        "coutumier",
        "coutume",
        "bail",
        "loyer",
        "propriete",
        "propriété",
        "immatriculation",
        "adc",
        "attestation",
    ),
    "commercial": (
        "commercial",
        "ohada",
        "sarl",
        "sarlu",
        "societe",
        "société",
        "cfe",
        "fonds de commerce",
        "acte uniforme",
        "creancier",
        "créancier",
    ),
    "constitution": (
        "constitution",
        "institution",
        "fondamental",
        "referendum",
        "referendum",
    ),
    "affaires": (
        "impot",
        "impôt",
        "fiscal",
        "otr",
        "import",
        "export",
        "douane",
        "tva",
        "cgi",
    ),
    "donnees_personnelles": (
        "donnee personnel",
        "données personnelles",
        "vie privee",
        "vie privée",
        "cnil",
        "rgpd",
        "traitement des donnees",
    ),
    "public": (
        "administratif",
        "decret",
        "décret",
        "expropriation",
        "utilite publique",
        "utilité publique",
        "etat",
        "état",
        "collectivite",
    ),
}


def _normalize(text: str) -> str:
    folded = unicodedata.normalize("NFKD", text.strip().lower())
    return "".join(ch for ch in folded if not unicodedata.combining(ch))


def score_domains(question: str, domains: list[LegalDomain]) -> list[tuple[str, float]]:
    normalized = _normalize(question)
    tokens = set(re.findall(r"[a-z0-9']+", normalized))
    allowed = {d.id for d in domains}
    scores: list[tuple[str, float]] = []

    for domain_id, keywords in _DOMAIN_KEYWORDS.items():
        if domain_id not in allowed:
            continue
        hits = 0
        for keyword in keywords:
            key = _normalize(keyword)
            if " " in key:
                if key in normalized:
                    hits += 2
            elif key in tokens or key in normalized:
                hits += 1
        if hits:
            scores.append((domain_id, float(hits)))

    scores.sort(key=lambda item: item[1], reverse=True)
    return scores


def pick_domain_targets(
    question: str,
    domains: list[LegalDomain],
    *,
    max_domains: int = 3,
) -> list[str]:
    allowed = [d.id for d in domains]
    if not allowed:
        return ["public"]

    ranked = score_domains(question, domains)
    if not ranked:
        return ["public"]

    selected: list[str] = []
    for domain_id, _score in ranked:
        if domain_id not in selected:
            selected.append(domain_id)
        if len(selected) >= max_domains:
            break

    if "public" not in selected and len(selected) < max_domains:
        selected.append("public")

    return selected[:max_domains]
