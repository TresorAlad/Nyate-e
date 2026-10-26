#!/usr/bin/env bash
set -eu

CERT_DIR=/etc/ssl/nyatefe
sudo mkdir -p "$CERT_DIR"

if [[ ! -f "$CERT_DIR/privkey.pem" ]]; then
  sudo openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
    -keyout "$CERT_DIR/privkey.pem" \
    -out "$CERT_DIR/fullchain.pem" \
    -subj "/CN=nyatefe.local/O=Nyatefe/C=TG"
  sudo chmod 640 "$CERT_DIR/privkey.pem"
  echo "Certificat auto-signé créé dans $CERT_DIR"
else
  echo "Certificat déjà présent dans $CERT_DIR"
fi
