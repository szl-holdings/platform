#!/usr/bin/env bash
# Regenerate fresh attestation keys and a matching trust-root.json.
# Called by ci/roundtrip.sh on every CI run so committed key material
# never escapes into production.
#
# Copyright 2026 SZL Holdings
# SPDX-License-Identifier: Apache-2.0 OR AGPL-3.0-or-later
set -euo pipefail

OUT="${1:-./keys}"
mkdir -p "$OUT"

# Delegate the actual keygen to a tiny Go helper that lives next to
# the manifest package. Keeps shell-side crypto to zero.
go run ./src/pkg/attest/cmd/genkeys \
  --did "did:plat:szl-attest-roundtrip" \
  --out "$OUT"

echo "[keygen] wrote $OUT/{ed25519.seed.hex,mldsa65.priv.hex,trust-root.json}"
