# Architecture agents juridiques

Ce document décrit le **graphe d'agents** visé par Nyateƒe, l'état du **MVP** et la feuille de route d'implémentation côté backend Flask.

## Vision produit

Nyateƒe ne s'appuie pas sur la seule mémoire paramétrique d'un LLM. Le parcours cible :

```text
Question utilisateur
        |
        v
   [1 Analyse]  ---- reformulation, intention, niveau de risque
        |
        v
   [2 Domaine]  ---- civil, pénal, travail, commercial, etc.
        |
        v
   [3 Recherche] ---- pgvector + filtres (type, date, doc_type)
        |
        v
   [4 Vérification] -- cohérence extrait / question, couverture
        |
        v
   [5 Réponse]  ---- génération sourcée + avertissement juridique
        |
        v
   Réponse + sources (+ orientation avocat si besoin)
```

Chaque étape peut être un **agent** (prompt + contraintes + sortie structurée JSON) orchestré par un **coordinateur** dans le backend.

## État actuel (MVP)

| Agent cible | Implémenté ? | Code / comportement actuel |
|-------------|--------------|----------------------------|
| 1 Analyse | Partiel | Question brute envoyée au RAG ; pas de nœud dédié |
| 2 Domaine | Non | Pas de classification `doc_type` / domaine avant recherche |
| 3 Recherche | Oui | `RagService.search_similar`, embeddings `nomic-embed-text`, pgvector |
| 4 Vérification | Partiel | Seuil `RAG_MIN_SIMILARITY` ; pas de second passage LLM |
| 5 Réponse | Oui | `RagService._answer_question`, prompt système + extraits |

Point d'entrée API : `POST /api/chat` dans `backend/app/routes/chat.py` appelle aujourd'hui un **pipeline RAG monolithique** dans `rag_service.py`.

```text
MVP (implémenté)

  question --> embed --> pgvector --> prompt + Mistral --> answer + sources
```

## Architecture cible (backend)

Proposition de modules (à créer progressivement) :

```text
backend/app/agents/
├── orchestrator.py      # Enchaîne les étapes, contexte partagé
├── schemas.py           # TypedDict / dataclasses par étape
├── analyse_agent.py
├── domaine_agent.py
├── recherche_agent.py   # wrapper RAG + filtres domaine
├── verification_agent.py
└── reponse_agent.py
```

### Contexte partagé (exemple)

```python
# Conceptuel - non implémenté intégralement au MVP
{
  "question_originale": str,
  "question_normalisee": str,
  "domaine_juridique": str | None,
  "chunks": list[ChunkHit],
  "verification": {"ok": bool, "motifs": list[str]},
  "reponse_finale": str | None,
  "trace": list[dict]  # pour debug / UI future
}
```

### Contrats de sortie recommandés

Forcer du **JSON** en sortie des agents 1, 2 et 4 (parse + retry une fois) :

- **Analyse** : `{ "intention", "entites", "clarification_necessaire" }`
- **Domaine** : `{ "domaine", "confiance", "sous_domaine" }`
- **Vérification** : `{ "peut_repondre", "sources_utilisees", "avertissements" }`

L'agent **Réponse** produit le texte utilisateur + liste d'identifiants de chunks cités.

## Modèles et infra

| Rôle | Modèle MVP | Évolution |
|------|------------|-----------|
| Génération (tous agents LLM) | `mistral:7b-instruct-q4_K_M` | Même modèle, prompts différents |
| Embeddings | `nomic-embed-text` | Modèle multilingue FR si besoin |
| Fallback | API Mistral (option) | Pics de charge ou timeout |

Tous les appels Ollama passent par `OllamaRequestQueue` (un job lourd à la fois).

## Filtres recherche (agent 3 enrichi)

Quand l'agent **Domaine** sera actif :

```sql
-- Conceptuel
WHERE d.doc_type = ANY(%s) OR metadata->>'domaine' = %s
ORDER BY embedding <=> query_vector
LIMIT k
```

Indexation : enrichir `legal_documents.metadata` avec `{ "domaine": "travail" }` validé par l'équipe juridique.

## UX frontend (évolution)

| Fonctionnalité | MVP | Cible |
|----------------|-----|-------|
| Chat simple | Oui | Oui |
| Affichage sources | Oui | Oui + lien vers texte complet |
| Trace agents | Non | Panneau "Étapes" (Analyse, Domaine, etc.) |
| Clarification | Non | Question de suivi si agent Analyse le demande |

## Phases d'implémentation

### Phase A (court terme)

1. Extraire `recherche` + `reponse` dans `agents/recherche_agent.py` et `agents/reponse_agent.py`.
2. `orchestrator.run(question)` appelé depuis `chat.py` sans changer le contrat API.
3. Journaliser `trace` côté serveur (logs structurés).

### Phase B

1. Agent **Domaine** : classification + filtre pgvector.
2. Agent **Analyse** : reformulation ; refuser les questions hors périmètre togolais avec message clair.

### Phase C

1. Agent **Vérification** : second appel LLM "les extraits suffisent-ils ?".
2. Si non : réponse honnête + orientation professionnelle, sans hallucination.

### Phase D (produit)

1. Jurisprudence (nouvelles tables + pipeline d'indexation).
2. Langues Ewé / Kabiyè (TTS/STT + modèles locaux si disponibles).

## Diagramme séquence (cible)

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant API as Flask API
    participant O as Orchestrateur
    participant A as Agent Analyse
    participant D as Agent Domaine
    participant R as Agent Recherche
    participant V as Agent Vérification
    participant G as Agent Réponse
    participant DB as Postgres
    participant L as Ollama

    U->>API: POST /api/chat
    API->>O: run(question)
    O->>A: analyser
    A->>L: chat
    L-->>A: JSON analyse
    O->>D: classifier
    D->>L: chat
    L-->>D: domaine
    O->>R: retrieve
    R->>L: embed
    R->>DB: pgvector
    DB-->>R: chunks
    O->>V: verifier
    V->>L: chat
    L-->>V: ok / ko
    O->>G: generer
    G->>L: chat
    L-->>G: reponse
    O-->>API: resultat + sources + trace
    API-->>U: JSON
```

## Références code MVP

| Fichier | Rôle |
|---------|------|
| `backend/app/services/rag_service.py` | Pipeline RAG actuel |
| `backend/app/services/ollama_client.py` | Client Ollama |
| `backend/app/services/ollama_queue.py` | Concurrence |
| `backend/migrations/001_init.sql` | Schéma documents / chunks |

## Critères de succès agents

- **Traçabilité** : chaque affirmation importante liée à un `chunk_id`.
- **Refus** : si pas de source au-dessus du seuil, message explicite.
- **Latence** : acceptable sur VM MVP (~1 min chat) ; file visible via `/api/queue`.
- **Conformité** : mention légale présente sur toute réponse grand public.
