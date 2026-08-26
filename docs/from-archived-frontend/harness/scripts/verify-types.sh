#!/usr/bin/env bash
# Fails if src/types/ drifts from the vendored contracts/ schemas.
set -euo pipefail

declare -a PAIRS=(
  "contracts/actor_page.v2.schema.json:src/types/actor_page.ts"
  "contracts/location_page.v1.schema.json:src/types/location_page.ts"
  "contracts/artifact_page.v1.schema.json:src/types/artifact_page.ts"
  "contracts/timeline.v1.schema.json:src/types/timeline.ts"
  "contracts/compendium_index.v1.schema.json:src/types/compendium_index.ts"
  "contracts/scene_current.v2.schema.json:src/types/scene_current.ts"
  "contracts/beat_frame.v2.schema.json:src/types/beat_frame.ts"
  "contracts/world_directory.v1.schema.json:src/types/world_directory.ts"
  "contracts/carrying.v1.schema.json:src/types/carrying.ts"
)

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

status=0
for pair in "${PAIRS[@]}"; do
  schema="${pair%%:*}"
  out="${pair##*:}"
  ./node_modules/.bin/json2ts -i "$schema" > "$tmp/gen.ts"
  if ! diff -u "$out" "$tmp/gen.ts"; then
    echo "DRIFT: $out does not match codegen from $schema" >&2
    status=1
  fi
done

if [ "$status" -eq 0 ]; then
  echo "verify:types OK — generated types match vendored schemas"
fi
exit "$status"
