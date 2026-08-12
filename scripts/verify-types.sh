#!/usr/bin/env bash
# Fails if src/api/types/ drifts from the vendored contracts/ schemas.
#
# Hermetic: no network, no backend. It regenerates into a temp dir and diffs byte-for-byte, which is
# what makes "never hand-edit the generated types" enforceable rather than a request.
set -euo pipefail

declare -a PAIRS=(
  "contracts/world_directory.v2.schema.json:src/api/types/world_directory.ts"
  "contracts/scene_current.v3.schema.json:src/api/types/scene_current.ts"
  "contracts/beat_frame.v4.schema.json:src/api/types/beat_frame.ts"
  "contracts/transcript.v1.schema.json:src/api/types/transcript.ts"
  "contracts/narration.v2.schema.json:src/api/types/narration.ts"
  "contracts/carrying.v1.schema.json:src/api/types/carrying.ts"
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
