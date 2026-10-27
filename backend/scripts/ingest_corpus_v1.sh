#!/usr/bin/env bash
# Indexe le corpus v1 Nyatefe (a lancer depuis backend/ avec venv actif).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PY="${ROOT}/backend/.venv/bin/python"
INGEST="${ROOT}/backend/scripts/ingest_file.py"

run() {
  "$PY" "$INGEST" "$@"
}

run "${ROOT}/code des personne et des familles.pdf" \
  --title "Code des personnes et des familles (version anterieure)" \
  --doc-type code --domaine famille --version-tag legacy

run "${ROOT}/code des personne et des familles Update.pdf" \
  --title "Code des personnes et des familles (mise a jour)" \
  --doc-type code --domaine famille --version-tag update

run "${ROOT}/code du travail.pdf" \
  --title "Code du travail" \
  --doc-type code --domaine travail

run "${ROOT}/CODE-GENERAL-DES-IMPOTS-ET-LIVRE-DES-PROCEDURES-FISCALES-OTR-2025 (1).pdf" \
  --title "Code general des impots et procedures fiscales OTR 2025" \
  --doc-type code --domaine affaires

run "${ROOT}/constitution de 2024 mise à jour.pdf" \
  --title "Constitution du Togo (2024, mise a jour)" \
  --doc-type constitution --domaine constitution

run "${ROOT}/Loi lié au donné personnel.pdf" \
  --title "Loi relative a la protection des donnees personnelles" \
  --doc-type loi --domaine donnees_personnelles

echo "Corpus v1 termine."
