#!/usr/bin/env bash
set -euo pipefail
PY="${NYATEFE_PY:-/opt/nyatefe/backend/.venv/bin/python}"
ING="${NYATEFE_INGEST:-/opt/nyatefe/backend/scripts/ingest_file.py}"
C="${NYATEFE_CORPUS:-/opt/nyatefe/corpus}"

run() {
  echo "=== ingest $1"
  "$PY" "$ING" "$1" "${@:2}"
}

run "$C/code des personne et des familles.pdf" \
  --title "Code des personnes et des familles (version anterieure)" \
  --doc-type code --domaine famille --version-tag legacy

run "$C/code des personne et des familles Update.pdf" \
  --title "Code des personnes et des familles (mise a jour)" \
  --doc-type code --domaine famille --version-tag update

run "$C/code du travail.pdf" \
  --title "Code du travail" \
  --doc-type code --domaine travail

run "$C/CODE-GENERAL-DES-IMPOTS-ET-LIVRE-DES-PROCEDURES-FISCALES-OTR-2025 (1).pdf" \
  --title "CGI et procedures fiscales OTR 2025" \
  --doc-type code --domaine affaires

run "$C/constitution de 2024 mise à jour.pdf" \
  --title "Constitution du Togo (2024)" \
  --doc-type constitution --domaine constitution

run "$C/Loi lié au donné personnel.pdf" \
  --title "Loi protection donnees personnelles" \
  --doc-type loi --domaine donnees_personnelles

echo "DONE_INGEST"
