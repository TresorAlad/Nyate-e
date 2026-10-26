# Nyateƒe

Plateforme d'IA juridique multi-agents pour le **droit togolais**. Nyateƒe combine une base de textes officiels (codes, lois, décrets), une recherche par **embeddings** (pgvector) et un modèle **Mistral 7B** servi localement via **Ollama**, avec une interface **React** et une API **Flask**.

> Commencer au Togo, construire pour l'Afrique.

## Objectif du MVP

- Réponses en français fondées sur des **sources indexées** (RAG).
- **Traçabilité** : extraits et métadonnées affichés avec la réponse.
- **Avertissement juridique** : l'outil oriente, il ne remplace pas un avocat.
- Hébergement **self-hosted** sur une VM Azure (Flask, Postgres, Ollama, Nginx).

## Architecture

```text
Utilisateur
    |
    v
Nginx (HTTPS, static React)
    |
    +-- /api/*  -->  Gunicorn + Flask (127.0.0.1:8000)
    |                    |
    |                    +-- PostgreSQL 16 + pgvector
    |                    +-- Ollama (127.0.0.1:11434)
    |                         - mistral:7b-instruct-q4_K_M (génération)
    |                         - nomic-embed-text (embeddings 768 dim)
    |
    +-- /*      -->  frontend/dist (Vite + React)
```

## Structure du dépôt

| Dossier | Rôle |
|---------|------|
| [`docs/`](docs/README.md) | Guide contributeur, architecture agents, ADR |
| [`backend/`](backend/README.md) | API Flask, RAG, file Ollama, migrations SQL |
| [`frontend/`](frontend/README.md) | Interface React (chat, indexation équipe) |
| [`deploy/`](deploy/README.md) | Nginx, systemd, scripts SSL |

Fichiers sensibles (non versionnés) : `backend/.env`, clés SSH, certificats serveur.

## Prérequis serveur (référence)

- Ubuntu 24.04 LTS
- ~8 Go RAM, 2 vCPU (CPU only, pas de GPU)
- Swap 4 Go recommandé avec Ollama + Postgres
- Ports **80** et **443** ouverts (Azure NSG) pour l'accès public

## Démarrage rapide (développement local)

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Éditer .env (DATABASE_URL, INGEST_API_KEY, etc.)
psql -d nyatefe -f migrations/001_init.sql
flask --app wsgi:app run --port 8000
```

Ollama et Postgres doivent être accessibles aux URLs configurées dans `.env`.

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Le proxy Vite redirige `/api` vers `http://127.0.0.1:8000`.

Documentation détaillée :

- [Documentation (`docs/`)](docs/README.md) : index, [guide contributeur](docs/guide-contributeur.md), [architecture agents](docs/architecture-agents.md), [ADR](docs/adr/README.md)
- [Backend](backend/README.md) : endpoints, variables d'environnement, RAG, déploiement API
- [Frontend](frontend/README.md) : composants, appels API, build, déploiement static

## Déploiement production (VM)

Chemins typiques sur le serveur :

| Élément | Chemin / service |
|---------|------------------|
| API | `/opt/nyatefe/backend`, `systemd`: `nyatefe-api` |
| Frontend build | `/opt/nyatefe/frontend/dist` |
| Nginx | `/etc/nginx/sites-available/nyatefe` |
| Clé indexation (équipe) | `/opt/nyatefe/.ingest-api-key` (lecture SSH admin) |

Mise à jour frontend :

```bash
cd frontend && pnpm run build
rsync -av dist/ user@serveur:/opt/nyatefe/frontend/dist/
```

Redémarrage API après changement backend :

```bash
sudo systemctl restart nyatefe-api
```

HTTPS :

- MVP sans domaine : certificat auto-signé (`deploy/setup-ssl-selfsigned.sh`)
- Production : `NYATEFE_DOMAIN=... deploy/setup-letsencrypt.sh`

## Modèles IA

| Modèle Ollama | Usage |
|---------------|--------|
| `mistral:7b-instruct-q4_K_M` | Compréhension et rédaction (chat RAG) |
| `nomic-embed-text` | Vecteurs pour la recherche sémantique |

Option **phase 3** : fallback API Mistral cloud si Ollama échoue (`MISTRAL_FALLBACK_ENABLED`, `MISTRAL_API_KEY`).

## Équipe et contexte

Projet présenté dans le cadre **AI4Youth** (Lomé, Togo). Voir `Nyatefe_Presentation_Projet.pdf` pour la vision produit (agents juridiques, accessibilité, phases jurisprudence et langues locales).

## Licence

À définir par l'équipe Nyateƒe.
