#!/usr/bin/env python3
"""Fusionne des variables KEY=VALUE dans un fichier .env existant."""
from __future__ import annotations

import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: merge-env.py <snippet.env> <target.env>", file=sys.stderr)
        return 1

    snippet = Path(sys.argv[1])
    target = Path(sys.argv[2])
    updates: dict[str, str] = {}
    for line in snippet.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        updates[key.strip()] = value.strip()

    lines = target.read_text(encoding="utf-8").splitlines() if target.is_file() else []
    seen: set[str] = set()
    out: list[str] = []
    for line in lines:
        if "=" in line and not line.strip().startswith("#"):
            key = line.split("=", 1)[0].strip()
            if key in updates:
                out.append(f"{key}={updates[key]}")
                seen.add(key)
                continue
        out.append(line)

    for key, value in updates.items():
        if key not in seen:
            out.append(f"{key}={value}")

    target.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"Mis à jour {len(updates)} variable(s) dans {target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
