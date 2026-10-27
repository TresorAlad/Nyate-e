"""Réponses courtes affichées aux citoyens (sans jargon technique)."""

NO_OFFICIAL_SOURCE_ANSWER = (
    "Je n'ai pas trouvé, dans les textes officiels disponibles sur Nyateƒe, "
    "d'élément suffisant pour répondre à cette question.\n\n"
    "Reformulez en précisant les faits utiles (situation, lieu au Togo) "
    "ou posez une autre question."
)

OUT_OF_SCOPE_ANSWER = (
    "Je suis l'assistant juridique Nyateƒe pour le droit togolais uniquement.\n\n"
    "Je ne traite pas le code informatique, la programmation ni les sujets "
    "hors droit. Posez une question concrète sur votre situation juridique au Togo."
)


GREETING_ANSWER = (
    "Bonjour ! Ravi de vous lire.\n\n"
    "Je suis Nyateƒe, votre assistant pour le **droit togolais**. "
    "Vous pouvez me raconter votre situation en quelques mots ou poser "
    "une question précise : je m'appuie sur les textes officiels indexés "
    "pour vous orienter."
)


def build_specialist_unavailable_message(
    domain_label: str | None,
    available_labels: list[str],
) -> str:
    if domain_label:
        intro = (
            f"Merci pour votre question. Pour l'instant, Nyateƒe ne dispose pas "
            f"encore d'un spécialiste ni de textes officiels indexés pour le "
            f"domaine « {domain_label} ».\n\n"
        )
    else:
        intro = (
            "Merci pour votre question. Je ne peux pas encore la traiter avec un "
            "texte officiel précis dans Nyateƒe.\n\n"
        )

    if available_labels:
        liste = ", ".join(available_labels[:6])
        suite = (
            f"Domaines déjà couverts sur la plateforme : {liste}.\n\n"
            "Si votre sujet s'y rattache, reformulez en précisant les faits "
            "(lieu au Togo, situation). Sinon, revenez bientôt : de nouveaux "
            "textes sont ajoutés régulièrement."
        )
    else:
        suite = (
            "La bibliothèque juridique est en cours d'enrichissement. "
            "Revenez bientôt ou contactez un professionnel du droit."
        )

    return intro + suite
