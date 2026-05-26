#!/usr/bin/env bash
# Validation step `lean` (Task #5406): proves that
# `packages/lean-formulas/` actually builds end-to-end with `lake`.
#
# Self-bootstraps elan + the pinned Lean toolchain so the check passes
# on a clean checkout. The package has no mathlib dependency (see
# `packages/lean-formulas/README.md` § "Why no mathlib?"), so the entire
# build fits in well under a minute on a cold cache.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LEAN_DIR="${REPO_ROOT}/packages/lean-formulas"

if [[ ! -d "${LEAN_DIR}" ]]; then
  echo "check-lean-build: ${LEAN_DIR} not found" >&2
  exit 1
fi

# 1. elan — installs in seconds; idempotent if already present.
export PATH="${HOME}/.elan/bin:${PATH}"
if ! command -v elan >/dev/null 2>&1; then
  echo "check-lean-build: installing elan…"
  curl -sSf https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh \
    -o /tmp/elan-init.sh
  bash /tmp/elan-init.sh -y --default-toolchain none >/dev/null
  rm -f /tmp/elan-init.sh
  export PATH="${HOME}/.elan/bin:${PATH}"
fi

# 2. Lean toolchain pinned by `packages/lean-formulas/lean-toolchain`.
#    `elan` resolves it on first `lake` invocation, but install it
#    explicitly so the first build's timing is honest.
TOOLCHAIN="$(cat "${LEAN_DIR}/lean-toolchain")"
if ! elan toolchain list 2>/dev/null | grep -qF "${TOOLCHAIN/leanprover\//}"; then
  echo "check-lean-build: installing ${TOOLCHAIN}…"
  elan toolchain install "${TOOLCHAIN}" >/dev/null
fi

# 3. Build.
cd "${LEAN_DIR}"
echo "check-lean-build: lake build (${TOOLCHAIN})"
lake build

echo "check-lean-build: ok"
