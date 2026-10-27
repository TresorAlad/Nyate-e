# Nyateƒe - Backend API

API **Flask** pour la plateforme Nyateƒe : indexation de textes juridiques, recherche vectorielle (pgvector) et génération RAG via **Ollama** (Mistral 7B + embeddings).

## Stack

- Python 3.12+
- Flask 3, Gunicorn
- psycopg 3 + pool de connexions
- PostgreSQL 16 + extension **pgvector**
- httpx (client Ollama et API Mistral optionnelle)

## Arborescence

```text
backend/
├── app/
│   ├── __init__.py          # Factory Flask, enregistrement des blueprints
│   ├── config.py            # Settings depuis variables d'environnement
│   ├── auth.py              # Vérification clé indexation
│   ├── db.py                # Pool PostgreSQL
│   ├── routes/
│   │   ├── health.py        # Santé API / Ollama
│   │   ├── queue.py         # État file Ollama
│   │   ├── documents.py     # POST indexation (protégé)
│   │   ├── search.py        # POST recherche sémantique
│   │   └── chat.py          # POST chat RAG
│   └── services/
│       ├── ollama_client.py # Appels /api/chat et /api/embeddings
│       ├── mistral_client.py# Fallback cloud (optionnel)
│       ├── ollama_queue.py  # File d'attente (1 job actif)
│       ├── rag_service.py   # Pipeline RAG complet
│       └── text_chunker.py  # Découpage de texte
├── migrations/
│   └── 001_init.sql         # Schéma legal_documents / legal_chunks
├── wsgi.py                  # Point d'entrée Gunicorn
├── requirements.txt
└── .env.example
```

## Schéma base de données

### `legal_documents`

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant |
| title | TEXT | Titre du texte |
| doc_type | TEXT | code, loi, decret, constitution, etc. |
| source_ref | TEXT | Référence (ex. Art. 12) |
| version_date | DATE | Date de version |
| created_at / updated_at | TIMESTAMPTZ | Audit |

### `legal_chunks`

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant chunk |
| document_id | UUID | FK vers legal_documents |
| chunk_index | INT | Ordre dans le document |
| content | TEXT | Texte du segment |
| embedding | vector(768) | Vecteur nomic-embed-text |
| metadata | JSONB | Métadonnées (ex. char_count) |

Index HNSW sur `embedding` (similarité cosinus via opérateur `<=>`).

## Variables d'environnement

Copier `.env.example` vers `.env`.

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `SECRET_KEY` | Oui | Secret Flask |
| `DATABASE_URL` | Oui | `postgresql://user:pass@host:5432/nyatefe` |
| `OLLAMA_BASE_URL` | Non | Défaut `http://127.0.0.1:11434` |
| `OLLAMA_CHAT_MODEL` | Non | Défaut `mistral:7b-instruct-q4_K_M` |
| `OLLAMA_EMBED_MODEL` | Non | Défaut `nomic-embed-text` |
| `INGEST_API_KEY` | Oui (prod) | Clé pour `POST /api/documents` |
| `OLLAMA_QUEUE_MAX_WAITING` | Non | Défaut `4` |
| `OLLAMA_QUEUE_WAIT_TIMEOUT_SECONDS` | Non | Défaut `300` |
| `RAG_TOP_K` | Non | Nombre de chunks récupérés (défaut 5) |
| `RAG_MIN_SIMILARITY` | Non | Seuil cosinus (défaut 0.35) |
| `CHUNK_SIZE` / `CHUNK_OVERLAP` | Non | Découpage à l'indexation |
| `MISTRAL_API_KEY` | Non | Fallback cloud |
| `MISTRAL_FALLBACK_ENABLED` | Non | `true` pour activer le fallback |
| `MISTRAL_API_MODEL` | Non | Ex. `mistral-small-latest` |

## API REST

Base URL en production : `https://votre-serveur/api`

Toutes les réponses d'erreur métier utilisent `{ "error": "message" }` sauf indication contraire.

### `GET /api/health`

Santé de l'API.

**Réponse 200**

```json
{ "status": "ok", "service": "nyatefe-api" }
```

### `GET /api/health/ollama`

Teste qu'Ollama répond sur un embedding minimal.

### `GET /api/queue`

État de la file d'attente Ollama.

**Réponse 200**

```json
{ "waiting": 0, "active": 0, "busy": false }
```

### `POST /api/documents`

Indexe un document : insertion SQL, découpage, embedding par chunk, stockage pgvector.

**Auth** : en-tête `X-Nyatefe-Ingest-Key: <INGEST_API_KEY>`

**Corps JSON**

| Champ | Type | Requis |
|-------|------|--------|
| title | string | Oui |
| body | string | Oui |
| doc_type | string | Non |
| source_ref | string | Non |
| version_date | string (YYYY-MM-DD) | Non |

**Réponse 201**

```json
{
  "document_id": "uuid",
  "title": "...",
  "doc_type": "loi",
  "source_ref": "Art. 1",
  "version_date": "2026-01-01",
  "chunks_inserted": 12
}
```

**Codes** : `401` clé invalide, `429` file pleine, `503` timeout file.

### `POST /api/search`

Recherche sémantique sans génération LLM.

**Corps**

```json
{ "query": "capitale du Togo", "top_k": 5 }
```

**Réponse 200**

```json
{
  "query": "...",
  "results": [
    {
      "document_id": "uuid",
      "chunk_id": "uuid",
      "title": "...",
      "doc_type": "constitution",
      "source_ref": "...",
      "version_date": "2026-01-01",
      "chunk_index": 0,
      "similarity": 0.77,
      "content": "extrait complet du chunk"
    }
  ]
}
```

### `POST /api/chat`

Pipeline RAG complet :

1. Embedding de la question (file Ollama)
2. Recherche pgvector top-k
3. Prompt système + extraits + question
4. Génération Mistral local (ou API Mistral si fallback activé et échec Ollama)

**Corps**

```json
{ "question": "Quelle est la capitale du Togo ?", "top_k": 5 }
```

**Réponse 200**

```json
{
  "answer": "Texte de réponse...",
  "provider": "ollama",
  "sources": [
    {
      "document_id": "uuid",
      "chunk_id": "uuid",
      "title": "...",
      "doc_type": "constitution",
      "source_ref": "Art. 1-2",
      "version_date": "2026-01-01",
      "chunk_index": 0,
      "similarity": 0.77,
      "excerpt": "400 premiers caractères..."
    }
  ]
}
```

`provider` vaut `mistral_api` si le fallback cloud a été utilisé.

## File d'attente Ollama

Une seule requête lourde Ollama s'exécute à la fois (chat, search embed, indexation). Les autres attendent jusqu'à `OLLAMA_QUEUE_MAX_WAITING` ou expirent après `OLLAMA_QUEUE_WAIT_TIMEOUT_SECONDS`.

Implémentation : `app/services/ollama_queue.py` (`OllamaRequestQueue`).

## Prompt système (RAG)

Défini dans `rag_service.py` : réponse uniquement à partir des extraits, français accessible, citation des références, rappel de ne pas remplacer un juriste.

## Installation locale

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Créer la base et appliquer la migration :

```bash
sudo -u postgres createdb nyatefe
sudo -u postgres psql -d nyatefe -f migrations/001_init.sql
```

Lancer en dev :

```bash
export FLASK_APP=wsgi:app
flask run --host 127.0.0.1 --port 8000
```

Production (identique au serveur) :

```bash
gunicorn -w 1 -b 127.0.0.1:8000 --timeout 180 wsgi:app
```

Service systemd de référence : `../deploy/nyatefe-api.service`.

## Tests manuels (curl)

```bash
curl -s http://127.0.0.1:8000/api/health

curl -s -X POST http://127.0.0.1:8000/api/documents \
  -H "Content-Type: application/json" \
  -H "X-Nyatefe-Ingest-Key: VOTRE_CLE" \
  -d '{"title":"Test","body":"Article 1. La capitale est Lomé."}'

curl -s -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"Quelle est la capitale ?"}'
```

Stream SSE (graphe agents actif) :

```bash
curl -N -X POST http://127.0.0.1:8000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"question":"Quels sont les droits du locataire ?"}'
```

### Agents rapides et retrieval par document

Variables d'environnement utiles (voir `.env.example`) :

| Variable | Rôle |
|----------|------|
| `AGENT_GRAPH_ENABLED` | Active le graphe / stream (`true` pour `/api/chat/stream`) |
| `AGENT_GRAPH_MODE` | `fast` (recommandé) ou `full` |
| `AGENT_RETRIEVAL_MODE` | `domain`, `document` ou `hybrid` |
| `AGENT_PARALLEL_DOMAINS` | Nombre de cibles parallèles (domaines ou documents) |
| `AGENT_DOCUMENT_SCAN_TOP_K` | Fenêtre pour les candidats document vectoriels |

Backfill `domaine` / `document_title` sur les chunks déjà indexés :

```bash
cd backend && source .venv/bin/activate
python scripts/backfill_chunk_metadata.py
```

Frontend : le stream est activé par défaut ; `VITE_CHAT_STREAM=false` force le JSON classique.

## Évolutions prévues

- Authentification JWT pour l'équipe (remplacer ou compléter la clé d'indexation)
- Graphe d'agents (analyse, domaine, vérification) : voir [architecture-agents.md](../docs/architecture-agents.md)
- Endpoint d'import batch (CSV / JSON)
- Métriques et logs structurés

Documentation projet : [docs/README.md](../docs/README.md)
