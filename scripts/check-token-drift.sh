#!/usr/bin/env bash
set -euo pipefail

web_tokens="$(mktemp)"
manifest_tokens="$(mktemp)"
trap 'rm -f "$web_tokens" "$manifest_tokens"' EXIT

sed -n '/@theme {/,/^}/p' src/styles/tokens.css \
  | grep -Eo -- '--[a-z][a-zA-Z0-9-]+' \
  | sort -u > "$web_tokens"

grep -Eo -- '--[a-z][a-zA-Z0-9-]+' design-tokens.md \
  | sort -u > "$manifest_tokens"

if ! diff -u "$web_tokens" "$manifest_tokens"; then
  echo "Token drift detected between src/styles/tokens.css and design-tokens.md" >&2
  exit 1
fi

echo "Token parity confirmed."
