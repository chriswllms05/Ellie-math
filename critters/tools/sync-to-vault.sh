#!/bin/bash
# Copies the Critter Math docs (critters/README.md, DESIGN.md, spec/, research/)
# into the user's ChrisOS vault, at Projects/Critter Math. Runs on the user's Mac;
# anywhere the vault can't be found (cloud sessions, other machines) it does nothing.
# Set CRITTER_VAULT to the vault folder to skip the search.
set -euo pipefail

src="$(cd "$(dirname "$0")/.." && pwd)"   # the critters/ folder

vault="${CRITTER_VAULT:-}"
if [ -z "$vault" ]; then
  shopt -s nullglob
  for c in \
    "$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/ChrisOS" \
    "$HOME/Library/Mobile Documents/com~apple~CloudDocs/ChrisOS" \
    "$HOME/Library/CloudStorage/"*/ChrisOS \
    "$HOME/Documents/ChrisOS" \
    "$HOME/ChrisOS"; do
    if [ -d "$c" ]; then vault="$c"; break; fi
  done
fi
if [ -z "$vault" ] || [ ! -d "$vault" ]; then
  echo "Critter Math: couldn't find the ChrisOS vault here, so nothing was copied. On the Mac, run again with CRITTER_VAULT set to the vault folder."
  exit 0
fi

dest="$vault/Projects/Critter Math"

# Copy a file only when it changed, so the vault's sync doesn't re-upload everything each time.
put() { mkdir -p "$(dirname "$2")"; cmp -s "$1" "$2" || cp "$1" "$2"; }

# Mirror a folder's .md files: copy new and changed ones, remove ones the repo no longer has.
mirror() {
  local from="$1" to="$2" f
  mkdir -p "$to"
  for f in "$from"/*.md; do put "$f" "$to/$(basename "$f")"; done
  for f in "$to"/*.md; do [ -e "$from/$(basename "$f")" ] || rm -f "$f"; done
}

shopt -s nullglob
put "$src/README.md" "$dest/README.md"
put "$src/DESIGN.md" "$dest/DESIGN.md"
mirror "$src/spec" "$dest/spec"
mirror "$src/research" "$dest/research"

about="$dest/About this folder.md"
[ -e "$about" ] || cat > "$about" <<'NOTE'
# About this folder

These notes are copied automatically from the Ellie-math repository (the `critters/` folder) each time a Claude session on this Mac finishes a turn. Edit them in the repository: changes made here are overwritten by the next copy.

Start with [README](README.md).
NOTE

echo "Critter Math: docs copied to $dest"
