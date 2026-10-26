# Nyateƒe - Frontend

Interface web **React 19** + **TypeScript** + **Vite 8** + **Tailwind CSS 4** pour Nyateƒe : assistant juridique (chat RAG) et espace équipe (indexation de textes).

## Stack

- pnpm (gestionnaire de paquets)
- React 19, Vite 8
- Tailwind CSS 4 (`@tailwindcss/vite`)
- Fetch API native (pas de lib HTTP supplémentaire)
- **Design** : écrans Web Desktop [Stitch](https://stitch.withgoogle.com/projects/17818269635994070137) (Newsreader, Sora, Material Symbols)

## Arborescence

```text
frontend/
├── index.html
├── vite.config.ts
├── stitch-reference/README.md   # Mapping routes ↔ écrans Stitch Web Desktop
├── src/
│   ├── main.tsx
│   ├── App.tsx                  # Shell + routes (accueil, dashboard, assistant…)
│   ├── index.css                # Design tokens Stitch (Material 3)
│   ├── stitch/project.ts        # IDs projet / écrans Stitch
│   ├── lib/                     # api.ts, ingest-key.ts
│   ├── components/
│   │   ├── shell/               # Sidebar, header, AppShell
│   │   ├── ChatPanel.tsx
│   │   ├── SourceList.tsx
│   │   └── IngestPanel.tsx
│   └── views/                   # Home, Dashboard, Bibliothèque
├── dist/
└── package.json
```

## Fonctionnalités

### Onglet Assistant juridique

- Saisie d'une question en français courant.
- Appel `POST /api/chat`.
- Affichage de la réponse, du provider (`Mistral local` ou `Mistral API`) et des **sources** (titre, type, référence, similarité, extrait).
- Pendant le chargement : message d'attente + polling `GET /api/queue` toutes les 2,5 s pour indiquer la file Ollama.

### Onglet Indexation (équipe)

- Champ **clé d'indexation** (en-tête `X-Nyatefe-Ingest-Key`), mémorisée en `sessionStorage` pour la session du navigateur.
- Formulaire : titre, type de document, référence, date de version, texte intégral.
- Appel `POST /api/documents`.

### En-tête / pied de page

- Branding Nyateƒe et slogan projet.
- Avertissement : l'outil n'est pas un substitut à un professionnel du droit.

## Client API (`src/lib/api.ts`)

| Fonction | Méthode | Route | Description |
|----------|---------|-------|-------------|
| `sendChat(question)` | POST | `/api/chat` | Chat RAG |
| `searchLegal(query)` | POST | `/api/search` | Recherche seule (disponible, non utilisée dans l'UI MVP) |
| `ingestDocument(payload, key)` | POST | `/api/documents` | Indexation avec clé |
| `fetchQueueStatus()` | GET | `/api/queue` | État file Ollama |

Les URLs sont **relatives** (`/api/...`) : en production Nginx proxy vers Flask ; en dev le proxy Vite fait la même chose.

Types exportés : `ChatResponse`, `SourceItem`, `SearchResult`, `QueueStatus`, `IngestPayload`.

Gestion d'erreur : le corps `{ error: string }` est remonté comme `Error` JavaScript.

## Clé d'indexation (`src/lib/ingest-key.ts`)

- Clé stockée sous `sessionStorage` (`nyatefe_ingest_key`).
- `getIngestApiKey()` / `setIngestApiKey(value)`.
- La clé est fournie par l'administrateur serveur (`INGEST_API_KEY` côté backend).

## Développement local

### Prérequis

- Node.js 20+
- pnpm 10+ (`corepack enable` ou `npx pnpm@10`)

### Installation

```bash
cd frontend
pnpm install
```

### Serveur de dev

```bash
pnpm dev
```

Ouvrir l'URL affichée (souvent `http://localhost:5173`).

Le fichier `vite.config.ts` configure :

```ts
server: {
  proxy: {
    '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
  },
},
```

Le backend Flask et Ollama doivent tourner en local (ou tunnel SSH vers la VM).

### Tunnel SSH vers la VM (exemple)

```bash
ssh -i Nyatefe_key.pem -L 8000:127.0.0.1:8000 azureuser@172.203.217.4
```

Puis `pnpm dev` en local avec le proxy vers le port 8000.

## Build production

```bash
pnpm run build
```

Sortie dans `dist/` (HTML, JS, CSS hashés).

Vérification locale du build :

```bash
pnpm preview
```

## Déploiement

Sur le serveur, Nginx sert `dist/` et proxie `/api` :

```bash
pnpm run build
rsync -av --delete dist/ azureuser@SERVEUR:/opt/nyatefe/frontend/dist/
```

Pas de variables `VITE_*` obligatoires pour le MVP : l'API est toujours sur le même origin via `/api`.

## Design et accessibilité

- Palette : bleu profond (sky), accents ambre, fond clair dégradé.
- Composants responsives (mobile first).
- Labels et messages d'erreur en **français** avec accents.
- Boutons désactivés pendant les requêtes longues.

## Scripts npm

| Script | Commande | Rôle |
|--------|----------|------|
| `dev` | `vite` | Dev HMR |
| `build` | `tsc -b && vite build` | Build production |
| `preview` | `vite preview` | Prévisualiser dist |
| `lint` | `oxlint` | Lint (si configuré) |

## Évolutions UI prévues

- Historique des conversations
- Mode recherche sans génération (onglet dédié)
- Panneau trace agents (Analyse, Domaine, etc.) : voir [architecture-agents.md](../docs/architecture-agents.md)
- Indicateur de progression plus fin (WebSocket ou SSE)
- Internationalisation (Ewé, Kabiyè) en phase ultérieure
- Authentification équipe (login) remplaçant la saisie manuelle de clé

Documentation projet : [docs/README.md](../docs/README.md)

## Dépannage

| Problème | Piste |
|----------|--------|
| `401` à l'indexation | Vérifier la clé (`X-Nyatefe-Ingest-Key`) |
| Timeout chat | Normal sur CPU (~1 min) ; vérifier file `/api/queue` |
| `502` sur `/api` | Backend down : `systemctl status nyatefe-api` sur le serveur |
| CORS en dev | Utiliser le proxy Vite, ne pas appeler l'IP distante en direct depuis le navigateur |
