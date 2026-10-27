import re
import unicodedata

_GREETING_RE = re.compile(
    r"^(?:salut|slaut|bonjour|bonsoir|hello|hi|hey|coucou|cc|yo|"
    r"merci|thanks|thank you|ok|d'accord|dac|bien recu|"
    r"ca va|ça va|comment allez vous|comment tu vas|"
    r"bonne journee|bonne soiree|a plus|a bientot|"
    r"who are you|qui es tu|c'est quoi nyatefe)[\s!.?,]*$",
    re.IGNORECASE,
)

_LEGAL_HINTS = (
    "loi",
    "article",
    "code",
    "peine",
    "contrat",
    "sarl",
    "sarlu",
    "terrain",
    "mariage",
    "succession",
    "travail",
    "licenciement",
    "vol",
    "droit",
    "juridique",
    "togo",
    "togolais",
    "ohada",
    "foncier",
    "bail",
    "loyer",
    "societe",
    "société",
    "divorce",
    "heritier",
    "héritier",
    "procedure",
    "procédure",
    "tribunal",
    "avocat",
    "penal",
    "pénal",
    "decret",
    "décret",
    "constitution",
    "cfe",
    "immatriculation",
    "attestation",
    "expropriation",
)


def _normalize(text: str) -> str:
    folded = unicodedata.normalize("NFKD", text.strip().lower())
    return "".join(ch for ch in folded if not unicodedata.combining(ch))


_NON_LEGAL_OFF_TOPIC = (
    "python",
    "javascript",
    "typescript",
    "react",
    "next.js",
    "html",
    "css",
    "programme",
    "programmer",
    "coding",
    "code source",
    "api rest",
    "sql injection",
    "docker",
    "kubernetes",
    "chatgpt",
    "ia generale",
    "recette de cuisine",
    "football",
    "meteo",
    "maths",
    "equation",
    "devoir de maison",
)


def is_non_legal_off_topic(question: str) -> bool:
    normalized = _normalize(question.strip())
    if not normalized:
        return False
    if any(hint in normalized for hint in _LEGAL_HINTS):
        return False
    return any(topic in normalized for topic in _NON_LEGAL_OFF_TOPIC)


def is_greeting_only(question: str) -> bool:
    raw = question.strip()
    if not raw:
        return False
    return bool(_GREETING_RE.match(_normalize(raw)))


def needs_legal_rag(question: str, history: list[dict[str, str]]) -> bool:
    raw = question.strip()
    if not raw:
        return False

    normalized = _normalize(raw)
    words = re.findall(r"[a-z0-9']+", normalized)

    if any(hint in normalized for hint in _LEGAL_HINTS):
        return True

    if "?" in raw and len(words) >= 3:
        return True

    if len(words) >= 6:
        return True

    if _GREETING_RE.match(normalized):
        return False

    if len(words) <= 2 and "?" not in raw:
        return False

    if history and _is_legal_follow_up(raw, words, history):
        return True

    if len(words) <= 4 and "?" not in raw:
        return False

    return True


def _is_legal_follow_up(
    normalized_question: str,
    words: list[str],
    history: list[dict[str, str]],
) -> bool:
    if _GREETING_RE.match(normalized_question):
        return False
    if normalized_question in ("oui", "non", "ok", "daccord"):
        return False

    last_assistant = ""
    for item in reversed(history):
        if item.get("role") == "assistant":
            last_assistant = _normalize(item.get("content") or "")
            break

    if not last_assistant:
        return False

    legal_in_thread = any(h in last_assistant for h in _LEGAL_HINTS)
    if not legal_in_thread:
        return False

    if "?" in normalized_question or len(words) >= 4:
        return True

    follow_hints = (
        "peine",
        "article",
        "precise",
        "précise",
        "detail",
        "détail",
        "explique",
        "pourquoi",
        "comment",
        "quand",
        "delai",
        "délai",
        "condition",
        "cas",
        "exemple",
    )
    return any(h in normalized_question for h in follow_hints)
