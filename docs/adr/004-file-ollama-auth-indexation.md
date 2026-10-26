# ADR 004 : File d'attente Ollama et authentification indexation

## Statut

Accepté (2026-10)

## Contexte

Sur ~8 Go RAM, **Mistral 7B**, **nomic-embed-text**, Postgres et Flask coexistent. Les requêtes **chat**, **search** (embed) et **documents** (plusieurs embeds) sollicitent Ollama en parallèle et provoquent :

- saturation RAM / swap ;
- timeouts et erreurs Ollama.

Par ailleurs, `POST /api/documents` permet d'alimenter la base juridique : il doit être réservé à **l'équipe**, pas au public.

## Décision

### File Ollama

- Classe `OllamaRequestQueue` : **1 job actif**, jusqu'à **N en attente** (`OLLAMA_QUEUE_MAX_WAITING`, défaut 4).
- Timeout d'attente : `OLLAMA_QUEUE_WAIT_TIMEOUT_SECONDS` (défaut 300).
- Erreurs API : **429** (file pleine), **503** (timeout attente).
- Endpoint **`GET /api/queue`** pour l'UI (affichage attente chat).

Les opérations lourdes passent par la file : chat RAG complet, recherche (embed), indexation document.

### Auth indexation

- Variable **`INGEST_API_KEY`** côté serveur.
- En-tête requis : **`X-Nyatefe-Ingest-Key`** sur `POST /api/documents`.
- Frontend : saisie clé équipe, stockage **sessionStorage** (MVP).
- Sans clé valide : **401**.

### HTTPS

- Nginx redirige HTTP → HTTPS.
- Certificat auto-signé MVP ; Let's Encrypt quand un nom de domaine est disponible.

## Conséquences

**Positives**

- Stabilité sur petite VM.
- Surface d'abus indexation réduite.
- UX chat informe l'utilisateur sur la file.

**Négatives**

- Latence additionnelle si plusieurs utilisateurs simultanés.
- Clé dans sessionStorage : acceptable MVP, **JWT / login** prévu en évolution (voir guide contributeur).

**Neutres**

- Paramètres file ajustables via `.env` sans redeploy code.

## Références

- `backend/app/services/ollama_queue.py`
- `backend/app/auth.py`
- `frontend/src/lib/ingest-key.ts`
- `deploy/nginx-nyatefe.conf`
