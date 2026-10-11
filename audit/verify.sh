#!/usr/bin/env bash
# Compatibility entry point for the canonical source-of-truth validator.
#
# The validator owns every metric and documentation assertion. Keeping this
# wrapper free of duplicate checks prevents its schema from drifting again.

set -uo pipefail

if ! SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)"; then
  echo "ERROR: cannot resolve the audit script directory." >&2
  exit 2
fi

REPOSITORY_ROOT="${SCRIPT_DIR}/.."
VALIDATOR="${REPOSITORY_ROOT}/scripts/audit/validate-source-of-truth.js"
SOURCE_OF_TRUTH="${REPOSITORY_ROOT}/audit/source-of-truth.json"

if [[ ! -e "${REPOSITORY_ROOT}/.git" || ! -f "${VALIDATOR}" || ! -f "${SOURCE_OF_TRUTH}" ]]; then
  echo "ERROR: repository root is incomplete; expected Git metadata, ${VALIDATOR}, and ${SOURCE_OF_TRUTH}." >&2
  exit 2
fi

if ! NODE_BIN="$(command -v node)"; then
  echo "ERROR: node is required to run the canonical source-of-truth validator." >&2
  exit 2
fi

if ! command -v git >/dev/null; then
  echo "ERROR: git is required to inspect the canonical tracked tree." >&2
  exit 2
fi

if ! cd -- "${REPOSITORY_ROOT}"; then
  echo "ERROR: cannot enter repository root ${REPOSITORY_ROOT}." >&2
  exit 2
fi

exec "${NODE_BIN}" "${VALIDATOR}"
