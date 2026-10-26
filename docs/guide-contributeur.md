# Guide contributeur

Merci de contribuer à **Nyateƒe**. Ce guide décrit comment installer l'environnement, respecter les conventions et proposer des changements.

## Principes du projet

1. **Sources d'abord** : pas de réponse présentée comme certaine sans lien avec un texte indexé.
2. **Français accessible** : UI, API (`error`), docs et commits en français soigné (accents).
3. **Self-hosted réaliste** : tenir compte des contraintes VM (~8 Go RAM, CPU, file Ollama).
4. **Scope minimal** : petits changements ciblés, conventions existantes.

## Rôles typiques

| Rôle | Zone |
|------|------|
| Full stack | `frontend/`, `backend/`, intégration API |
| Juridique | Validation des textes, métadonnées, process de veille |
| Infra | `deploy/`, VM Azure, Ollama, Postgres, Nginx |

## Environnement de développement

### Outils

- Python 3.12+, Node.js 20+, **pnpm** 10+
- PostgreSQL 16 + pgvector
- Ollama avec `mistral:7b-instruct-q4_K_M` et `nomic-embed-text`
- Git
- **Stitch** (optionnel, maquettes UI) : voir [Stitch MCP](#stitch-mcp-cursor)

### Clone et configuration

```bash
git clone <url-du-depot>
cd Nyatefe

# Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Renseigner DATABASE_URL, INGEST_API_KEY, etc.

# Frontend
cd ../frontend
pnpm install
```

### Lancer en local

Terminal 1 (API) :

```bash
cd backend && source .venv/bin/activate
gunicorn -w 1 -b 127.0.0.1:8000 --timeout 180 wsgi:app
```

Terminal 2 (UI) :

```bash
cd frontend && pnpm dev
```

Appliquer les migrations sur une base locale :

```bash
psql -d nyatefe -f backend/migrations/001_init.sql
```

## Conventions de code

### Backend (Python / Flask)

- Fonctions pures préférées aux classes sauf clients/services.
- `snake_case` pour fichiers (sauf packages), variables et fonctions.
- Routes dans `app/routes/`, logique métier dans `app/services/`.
- Messages utilisateur et erreurs API en **français**.
- Pas de secrets dans le dépôt : `.env` ignoré, exemple dans `.env.example`.

### Frontend (React / TypeScript)

- Composants UI : **PascalCase** (`ChatPanel.tsx`).
- Utilitaires : `camelCase` (`api.ts`, `ingest-key.ts`).
- Dossiers en **kebab-case** si ajout de routes/pages futures.
- Tailwind pour le style ; pas de lib UI lourde supplémentaire sans accord équipe.
- Textes visibles en français avec accents.

### SQL

- Migrations numérotées dans `backend/migrations/`.
- Ne pas réinitialiser une base de production ; migrations incrémentales uniquement.

## Workflow Git

1. Créer une branche depuis `main` : `feat/...`, `fix/...`, `docs/...`.
2. Commits clairs en français : `feat(api): file d'attente chat`, `fix(frontend): clé indexation`.
3. Tester manuellement chat + indexation si vous touchez au RAG ou à l'API.
4. Ouvrir une pull request avec :
   - résumé du changement ;
   - plan de test (checklist) ;
   - capture ou curl si pertinent.

Ne pas committer : `.env`, `*.pem`, clés API, dumps Postgres complets.

## Tests

Le MVP s'appuie sur des **tests manuels** documentés dans [backend/README.md](../backend/README.md).

Avant une PR backend :

```bash
curl -s http://127.0.0.1:8000/api/health
# + scénario documents / chat si RAG modifié
```

Avant une PR frontend :

```bash
cd frontend && pnpm run build
```

Des tests automatisés (pytest, Vitest) pourront être ajoutés ; les inclure dans une PR est bienvenu si le scope reste maîtrisé.

## Documentation

- Mettre à jour le README du dossier touché (`backend/`, `frontend/`, `deploy/`).
- Décision structurante : ajouter ou modifier un [ADR](adr/README.md).
- Évolution du graphe d'agents : mettre à jour [architecture-agents.md](architecture-agents.md).

## Déploiement (équipe infra)

Référence : [deploy/README.md](../deploy/README.md). Les merges sur `main` ne déploient pas automatiquement tant qu'un pipeline CI/CD n'est pas configuré : déploiement manuel sur la VM après validation.

## Questions fréquentes

**Puis-je appeler directement Ollama depuis le frontend ?**  
Non. Tout passe par Flask (sécurité, file, RAG).

**Puis-je utiliser un autre modèle que Mistral 7B ?**  
Oui en dev via `.env`, mais documenter un ADR si changement durable.

**Où est le graphe d'agents ?**  
Voir [architecture-agents.md](architecture-agents.md) : le MVP implémente surtout Recherche + Réponse ; les autres agents arrivent par étapes.

## Stitch MCP (Cursor)

Pour que l'agent génère ou modifie des écrans via Google Stitch :

1. Créer une clé sur [stitch.withgoogle.com](https://stitch.withgoogle.com) (Settings → API Key).
2. Copier [`.cursor/mcp.json.example`](../.cursor/mcp.json.example) vers **`~/.cursor/mcp.json`** (global) ou **`.cursor/mcp.json`** (projet, non commité).
3. Renseigner `X-Goog-Api-Key` dans `headers` (mode URL recommandé par Google) :

```json
{
  "mcpServers": {
    "stitch": {
      "url": "https://stitch.googleapis.com/mcp",
      "headers": {
        "X-Goog-Api-Key": "VOTRE_CLE"
      }
    }
  }
}
```

Alternative : `npx stitch-mcp-stdio` avec `STITCH_API_KEY` dans `env` (voir [npm stitch-mcp-stdio](https://www.npmjs.com/package/stitch-mcp-stdio)).

Redémarrer Cursor, puis demander dans le chat : « Utilise Stitch pour l'écran chat Nyateƒe ».

**Ne jamais** coller la clé dans le chat, un commit ou un README.

## Contact

Coordination via l'équipe Nyateƒe / AI4Youth (Lomé). Ajuster ce paragraphe avec canal Slack, email ou GitHub Issues du dépôt.
