#!/usr/bin/env bash
set -eu

if [[ -z "${NYATEFE_DOMAIN:-}" ]]; then
  echo "Définissez NYATEFE_DOMAIN (ex. app.nyatefe.tg) avant d'exécuter ce script."
  exit 1
fi

sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y certbot python3-certbot-nginx

sudo certbot --nginx -d "$NYATEFE_DOMAIN" --non-interactive --agree-tos -m "${NYATEFE_LE_EMAIL:-admin@${NYATEFE_DOMAIN}}" --redirect

echo "HTTPS Let's Encrypt activé pour $NYATEFE_DOMAIN"
