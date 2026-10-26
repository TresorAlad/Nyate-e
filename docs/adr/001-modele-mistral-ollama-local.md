# ADR 001 : Mistral 7B Instruct quantifié via Ollama on-prem

## Statut

Accepté (2026-10)

## Contexte

Nyateƒe cible le **droit togolais** en **français**, avec un budget limité (projet étudiant AI4Youth) et un hébergement sur une **petite VM Azure** (~8 Go RAM, 2 vCPU, sans GPU).

Besoins :

- Bonne qualité en français pour analyse et rédaction.
- Coût maîtrisé (pas de dépendance exclusive à une API payante).
- Données et inférences hébergées sur le serveur du projet.

## Décision

- Utiliser **Ollama** comme runtime local.
- Modèle de génération : **`mistral:7b-instruct-q4_K_M`** (~4,4 Go).
- Pas de GPU : inférence **CPU only**, avec **swap 4 Go** sur la VM.
- Limiter Ollama : `OLLAMA_MAX_LOADED_MODELS=2` (génération + embeddings), `OLLAMA_NUM_PARALLEL=1`.

Option ultérieure documentée séparément : **API Mistral cloud** en fallback (`MISTRAL_FALLBACK_ENABLED`).

## Conséquences

**Positives**

- Français adapté au contexte togolais.
- Pas de facturation tokens pour le trafic MVP normal.
- Aligné avec la présentation projet (Mistral, coût, souveraineté des données).

**Négatives**

- Latence élevée (souvent 30 à 60 s par réponse RAG sur CPU).
- Une seule inférence lourde à la fois (d'où la file d'attente, ADR 004).
- Modèles plus grands (12B+, FP16) exclus sur cette VM.

**Neutres**

- Changement de tag Ollama possible via variables d'environnement sans changer le code.

## Références

- `backend/app/services/ollama_client.py`
- `backend/.env.example` : `OLLAMA_CHAT_MODEL`
