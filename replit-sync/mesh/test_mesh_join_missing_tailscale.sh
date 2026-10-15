#!/usr/bin/env bash
# Regression: a missing Tailscale binary must never trigger an installer download.
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
/bin/bash -n "$script_dir/mesh_join.sh"

temp_dir="$(mktemp -d)"
cleanup() {
  rm -f -- "$temp_dir/bin/mkdir" "$temp_dir/bin/curl" \
    "$temp_dir/stdout" "$temp_dir/stderr" "$temp_dir/curl-called"
  if [ -d "$temp_dir/caps" ]; then rmdir -- "$temp_dir/caps"; fi
  rmdir -- "$temp_dir/bin" "$temp_dir"
}
trap cleanup EXIT

mkdir "$temp_dir/bin"
real_mkdir="$(command -v mkdir)"
printf '#!/bin/sh\nexec "%s" "$@"\n' "$real_mkdir" > "$temp_dir/bin/mkdir"
printf '#!/bin/sh\n: > "$CURL_MARKER"\nexit 99\n' > "$temp_dir/bin/curl"
chmod +x "$temp_dir/bin/mkdir" "$temp_dir/bin/curl"

if PATH="$temp_dir/bin" CAP_DIR="$temp_dir/caps" TS_HOSTNAME="mesh-test" \
  TS_AUTHKEY="SYNTHETIC_TEST_ONLY" CURL_MARKER="$temp_dir/curl-called" \
  /bin/bash "$script_dir/mesh_join.sh" > "$temp_dir/stdout" 2> "$temp_dir/stderr"; then
  echo "FAIL: mesh join succeeded without Tailscale" >&2
  exit 1
fi

if [ -e "$temp_dir/curl-called" ]; then
  echo "FAIL: an installer download was attempted" >&2
  exit 1
fi
if [ -e "$temp_dir/caps/mesh-test.json" ]; then
  echo "FAIL: a capability was published without Tailscale" >&2
  exit 1
fi
grep -Fq "Tailscale is not installed" "$temp_dir/stderr"
echo "PASS: missing Tailscale fails before installer, join, or capability publication"
