# Documentation Nyateƒe

Index de la documentation technique et produit du projet.

## Guides

| Document | Public | Description |
|----------|--------|-------------|
| [Guide contributeur](guide-contributeur.md) | Développeurs | Environnement, conventions, workflow Git, revue |
| [Profils utilisateurs](roles-utilisateurs.md) | Produit + équipe | Citoyen, cabinet, administrateur, indexation |
| [Architecture agents](architecture-agents.md) | Tech + produit | Graphe multi-agents, MVP actuel, roadmap d'implémentation |

## Décisions d'architecture (ADR)

Les [ADR](adr/README.md) (Architecture Decision Records) tracent les choix importants et leur contexte.

| ADR | Sujet |
|-----|--------|
| [001](adr/001-modele-mistral-ollama-local.md) | Mistral 7B quantifié via Ollama on-prem |
| [002](adr/002-rag-pgvector-nomic-embed.md) | RAG, pgvector, nomic-embed-text |
| [003](adr/003-stack-flask-react-postgres.md) | Stack Flask, React, PostgreSQL sur une VM |
| [004](adr/004-file-ollama-auth-indexation.md) | File d'attente Ollama et clé d'indexation |

## Documentation par composant

- [README racine](../README.md)
- [Backend](../backend/README.md)
- [Frontend](../frontend/README.md)
- [Déploiement](../deploy/README.md)

## Contexte produit

Dossier de présentation : `Nyatefe_Presentation_Projet.pdf` (AI4Youth, droit togolais, accessibilité, phases jurisprudence et langues locales).
