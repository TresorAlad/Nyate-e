# Nyateƒe - Déploiement

Fichiers et scripts pour la VM de production (Ubuntu 24.04, Azure).

## Fichiers

| Fichier | Rôle |
|---------|------|
| `nyatefe-api.service` | Unit systemd Gunicorn (`127.0.0.1:8000`) |
| `nginx-nyatefe.conf` | HTTPS, static React, proxy `/api` |
| `setup-ssl-selfsigned.sh` | Certificat auto-signé MVP (`/etc/ssl/nyatefe/`) |
| `setup-letsencrypt.sh` | Let's Encrypt via certbot (domaine requis) |

## Services systemd

```bash
sudo cp nyatefe-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable nyatefe-api
sudo systemctl restart nyatefe-api
sudo systemctl status nyatefe-api
```

## Nginx

```bash
sudo cp nginx-nyatefe.conf /etc/nginx/sites-available/nyatefe
sudo ln -sf /etc/nginx/sites-available/nyatefe /etc/nginx/sites-enabled/nyatefe
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## SSL

Auto-signé (sans nom de domaine) :

```bash
bash setup-ssl-selfsigned.sh
```

Let's Encrypt :

```bash
export NYATEFE_DOMAIN=app.example.tg
export NYATEFE_LE_EMAIL=admin@example.tg
bash setup-letsencrypt.sh
```

Le DNS du domaine doit pointer vers l'IP publique de la VM avant certbot.

## Pare-feu Azure

Autoriser entrant : **22** (SSH), **80** (HTTP redirect), **443** (HTTPS).

## Chemins serveur

| Ressource | Chemin |
|-----------|--------|
| Backend | `/opt/nyatefe/backend` |
| `.env` API | `/opt/nyatefe/backend/.env` |
| Frontend | `/opt/nyatefe/frontend/dist` |
| Clé indexation (copie admin) | `/opt/nyatefe/.ingest-api-key` |

## Ollama (rappel)

```bash
ollama pull mistral:7b-instruct-q4_K_M
ollama pull nomic-embed-text
```

Override systemd recommandé : `OLLAMA_MAX_LOADED_MODELS=2`, `OLLAMA_NUM_PARALLEL=1`.
