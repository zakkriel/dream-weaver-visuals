#!/usr/bin/env bash
# Fails if vendored contracts/ drift from the backend's main.
#
# This is the one gate whose result depends on ANOTHER repository at the moment it runs: a backend
# contract change can turn a green PR here red without anyone touching this repo. That is intended.
# Drift should be loud — twice in the donor repo this gate was the only thing that caught a schema
# moving underneath us, including one where the envelope's own version did not change.
#
# Source of truth: the local sibling clone when readable, else raw.githubusercontent from backend main.
set -euo pipefail

SIBLING="${DREAMCHAT_BACKEND_SCHEMA:-$(cd "$(dirname "$0")/../.." && pwd)/dreamchat-world-backend/core/api/schema}"
RAW="https://raw.githubusercontent.com/zakkriel/dreamchat-world-backend/main/core/api/schema"

# Scoped to the contracts the built surfaces actually consume. Add a file here the same commit a
# surface starts reading it — a pin on a payload nothing renders gates on nothing.
declare -a FILES=(
  world_directory.v2.schema.json
  scene_current.v4.schema.json
  beat_frame.v5.schema.json
  transcript.v2.schema.json
  narration.v3.schema.json
  image_regenerate.v1.schema.json
  carrying.v1.schema.json
  world_genesis_frame.v2.schema.json
  world_kickstart_turn.v1.schema.json
  world_interview_turn.v1.schema.json
  art_styles.v1.schema.json
)

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

status=0
for file in "${FILES[@]}"; do
  if [ -r "$SIBLING/$file" ]; then
    cp "$SIBLING/$file" "$tmp/$file"
  else
    curl -fsSL "$RAW/$file" -o "$tmp/$file"
  fi
  if ! diff -u "contracts/$file" "$tmp/$file"; then
    echo "DRIFT: contracts/$file differs from backend main" >&2
    status=1
  fi
done

if [ "$status" -eq 0 ]; then
  echo "verify:contract OK — vendored schemas match backend main"
fi
exit "$status"
