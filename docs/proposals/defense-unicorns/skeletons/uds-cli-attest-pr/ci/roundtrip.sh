#!/usr/bin/env bash
# Round-trip: build a bundle with --attest, verify --offline (must
# pass), flip a byte inside attestations.jsonl, verify --offline again
# (must FAIL with BROKEN_CHAIN). Exits non-zero on any unexpected
# outcome so the CI gate trips loudly.
#
# Copyright 2026 SZL Holdings
# SPDX-License-Identifier: Apache-2.0 OR AGPL-3.0-or-later
set -euo pipefail

UDS_CLI="${UDS_CLI:-./build/uds}"
FIXTURE="fixtures/roundtrip"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "[roundtrip] regenerating fresh attest keys"
"$FIXTURE/keygen.sh" "$WORK/keys"

echo "[roundtrip] create --attest"
"$UDS_CLI" bundle create "$FIXTURE" \
  --attest \
  --attest-signer-did "did:plat:szl-attest-roundtrip" \
  --attest-ed25519-seed   "$WORK/keys/ed25519.seed.hex" \
  --attest-ml-dsa-65-priv "$WORK/keys/mldsa65.priv.hex" \
  --attest-trust-root     "$WORK/keys/trust-root.json" \
  -o "$WORK/out" \
  --confirm

BUNDLE="$(find "$WORK/out" -name '*.tar.zst' -print -quit)"
test -n "$BUNDLE" || { echo "[roundtrip] FAIL: no bundle emitted"; exit 1; }

echo "[roundtrip] verify --offline (clean bundle must PASS)"
"$UDS_CLI" bundle verify --offline "$BUNDLE"

echo "[roundtrip] tamper with attestations.jsonl inside the bundle"
TAMPER_DIR="$WORK/tamper"
mkdir -p "$TAMPER_DIR"
tar --use-compress-program=zstd -xf "$BUNDLE" -C "$TAMPER_DIR"

# JSON-aware tamper: parse record #0, flip the FIRST hex char of its
# sha256 to a guaranteed-different char, re-serialise. This is
# deterministic regardless of which hex digit the chain happened to
# produce, so the test cannot silently no-op.
JSONL="$TAMPER_DIR/uds-bundle/attestations.jsonl"
python3 - "$JSONL" <<'PY'
import json, sys, pathlib
p = pathlib.Path(sys.argv[1])
lines = p.read_text().splitlines()
rec = json.loads(lines[0])
sha = rec["sha256"]
flipped = ("1" if sha[0] == "0" else "0") + sha[1:]
assert flipped != sha, "tamper would be a no-op"
rec["sha256"] = flipped
lines[0] = json.dumps(rec, separators=(",", ":"))
p.write_text("\n".join(lines) + "\n")
print(f"[roundtrip] mutated record 0 sha256: {sha[:8]}... -> {flipped[:8]}...")
PY

TAMPERED="$WORK/out/tampered.tar.zst"
tar --use-compress-program=zstd -cf "$TAMPERED" -C "$TAMPER_DIR" .

echo "[roundtrip] verify --offline (tampered bundle must FAIL)"
set +e
"$UDS_CLI" bundle verify --offline "$TAMPERED"
rc=$?
set -e
if [ "$rc" -eq 0 ]; then
  echo "[roundtrip] FAIL: tampered bundle verified clean"
  exit 1
fi
if [ "$rc" -ne 2 ] && [ "$rc" -ne 3 ]; then
  echo "[roundtrip] FAIL: tampered bundle rejected with unexpected exit $rc (want 2 or 3)"
  exit 1
fi

echo "[roundtrip] OK — clean bundle verified, tampered bundle rejected with exit $rc"
