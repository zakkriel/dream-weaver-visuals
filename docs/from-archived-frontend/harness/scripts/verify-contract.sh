#!/usr/bin/env bash
# Fails if vendored contracts/ drift from backend main. Source of truth:
# the local sibling clone if readable, else raw.githubusercontent backend main.
set -euo pipefail

SIBLING="/Users/pelao/REPOS/dreamchat/dreamchat-world-backend/core/api/schema"
RAW="https://raw.githubusercontent.com/zakkriel/dreamchat-world-backend/main/core/api/schema"

declare -a FILES=(
  actor_page.v2.schema.json
  location_page.v1.schema.json
  artifact_page.v1.schema.json
  timeline.v1.schema.json
  compendium_index.v1.schema.json
  scene_current.v2.schema.json
  beat_frame.v2.schema.json
  world_directory.v1.schema.json
  carrying.v1.schema.json
)

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

fetch_upstream() {
  local file="$1" dest="$2"
  if [ -r "$SIBLING/$file" ]; then
    cp "$SIBLING/$file" "$dest"
  else
    curl -fsSL "$RAW/$file" -o "$dest"
  fi
}

status=0
for file in "${FILES[@]}"; do
  fetch_upstream "$file" "$tmp/$file"
  if ! diff -u "contracts/$file" "$tmp/$file"; then
    echo "DRIFT: contracts/$file differs from backend main" >&2
    status=1
  fi
done

if [ "$status" -eq 0 ]; then
  echo "verify:contract OK — vendored schemas match backend main"
fi
exit "$status"
