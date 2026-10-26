# ADR 002 : RAG avec PostgreSQL pgvector et nomic-embed-text

## Statut

Accepté (2026-10)

## Contexte

Les LLM généralistes répondent sans garantie de **sources togolaises vérifiables**. Nyateƒe doit :

- Indexer des textes officiels **tapés** (codes, lois, décrets).
- Retrouver les passages pertinents pour une question.
- Générer une réponse **conditionnée** par ces passages.

Contraintes : une seule VM, stack déjà choisie avec **PostgreSQL** pour les métadonnées juridiques.

## Décision

- **RAG** : embedding de la question, recherche top-k, prompt avec extraits, génération Mistral.
- Stockage vecteurs : extension **pgvector** sur PostgreSQL 16.
- Dimension **768** alignée sur **`nomic-embed-text`** (Ollama).
- Index **HNSW** cosinus sur `legal_chunks.embedding`.
- Découpage à l'indexation : `CHUNK_SIZE=800`, `CHUNK_OVERLAP=120`.
- Seuil minimal de similarité : `RAG_MIN_SIMILARITY` (défaut 0.35).

Indexation : `POST /api/documents` (embed par chunk à l'insertion).

## Conséquences

**Positives**

- Une seule base pour métier + vecteurs (sauvegardes, ops simples).
- Traçabilité chunk → document → référence officielle.
- Recherche sans LLM possible via `POST /api/search`.

**Négatives**

- `nomic-embed-text` est surtout optimisé anglais ; rappel FR/juridique perfectible (modèle embedding multilingue envisagé plus tard).
- Indexation longue sur CPU (un embed par chunk).

**Neutres**

- Migration vers autre dimension embedding = nouvelle migration SQL + ré-indexation.

## Références

- `backend/migrations/001_init.sql`
- `backend/app/services/rag_service.py`
- ADR 001 (même runtime Ollama pour embed et chat)
