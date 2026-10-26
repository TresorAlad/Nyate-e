# Architecture Decision Records (ADR)

Format inspiré de [Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

## Structure d'un ADR

Chaque fichier `NNN-titre-court.md` contient :

1. **Statut** : Proposé | Accepté | Déprécié | Remplacé par ADR-xxx
2. **Contexte** : problème et contraintes
3. **Décision** : ce qui a été choisi
4. **Conséquences** : positif, négatif, neutre

## Index

| ID | Titre | Statut |
|----|-------|--------|
| [001](001-modele-mistral-ollama-local.md) | Mistral 7B Q4 via Ollama on-prem | Accepté |
| [002](002-rag-pgvector-nomic-embed.md) | RAG avec pgvector et nomic-embed-text | Accepté |
| [003](003-stack-flask-react-postgres.md) | Stack Flask, React, Postgres sur une VM | Accepté |
| [004](004-file-ollama-auth-indexation.md) | File Ollama et auth indexation | Accepté |

## Ajouter un ADR

1. Copier le numéro suivant (`005-...`).
2. Rédiger en français.
3. Lier depuis ce README et depuis [docs/README.md](../README.md) si pertinent.
