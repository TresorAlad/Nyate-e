# ADR 003 : Stack Flask, React (Vite), PostgreSQL sur une VM

## Statut

Accepté (2026-10)

## Contexte

L'équipe doit livrer une **interface web**, une **API**, une **base juridique** et l'**IA** sur **un seul serveur Azure** pour le MVP AI4Youth.

Contraintes :

- Compétences équipe : Python + React.
- Pas de cluster Kubernetes pour le MVP.
- Séparation claire UI / API pour faire évoluer le graphe d'agents côté backend.

## Décision

| Couche | Technologie |
|--------|-------------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind 4, **pnpm** |
| API | **Flask** 3, Gunicorn (1 worker), Python 3.12 |
| Base | **PostgreSQL 16** + pgvector |
| LLM | Ollama (local) |
| Reverse proxy | **Nginx** (HTTPS, static, `/api` → Flask) |
| OS | Ubuntu 24.04 LTS |

Déploiement : `/opt/nyatefe/` sur la VM, systemd `nyatefe-api`.

Next.js et MongoDB (autres stacks équipe) **ne sont pas** retenus pour ce dépôt Nyateƒe afin de limiter la complexité ops.

## Conséquences

**Positives**

- Stack légère, documentée, reproductible par les étudiants.
- React build static = performance et simplicité Nginx.
- Flask adapté à l'orchestration agents progressive.

**Négatives**

- Pas de SSR React (acceptable pour MVP dashboard/chat).
- Scalabilité horizontale non traitée (une VM).

**Neutres**

- CI/CD à ajouter ; déploiement manuel documenté dans `deploy/README.md`.

## Références

- [frontend/README.md](../../frontend/README.md)
- [backend/README.md](../../backend/README.md)
- [deploy/README.md](../../deploy/README.md)
