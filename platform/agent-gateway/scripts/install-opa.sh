#!/usr/bin/env bash
# Install the Open Policy Agent (OPA) binary used by gateway-opa-live.test.ts.
#
# Idempotent: if a working `opa` is already present at $OPA_BIN, /tmp/opa,
# or on PATH, it is reused. Otherwise the pinned version is downloaded to
# $OPA_BIN (default /tmp/opa) and made executable.
#
# Exports OPA_BIN to $GITHUB_ENV when running under GitHub Actions so that
# downstream test steps pick up the resolved path automatically.
#
# Usage:
#   platform/agent-gateway/scripts/install-opa.sh
#   OPA_VERSION=v0.69.0 OPA_BIN=/tmp/opa platform/agent-gateway/scripts/install-opa.sh

set -euo pipefail

OPA_VERSION="${OPA_VERSION:-v0.69.0}"
OPA_BIN="${OPA_BIN:-/tmp/opa}"

resolve_existing() {
  for candidate in "${OPA_BIN}" /tmp/opa /usr/local/bin/opa /usr/bin/opa; do
    if [ -x "${candidate}" ]; then
      echo "${candidate}"
      return 0
    fi
  done
  if command -v opa >/dev/null 2>&1; then
    command -v opa
    return 0
  fi
  return 1
}

detect_asset() {
  local uname_s uname_m
  uname_s="$(uname -s)"
  uname_m="$(uname -m)"
  case "${uname_s}_${uname_m}" in
    Linux_x86_64)  echo "opa_linux_amd64_static" ;;
    Linux_aarch64) echo "opa_linux_arm64_static" ;;
    Linux_arm64)   echo "opa_linux_arm64_static" ;;
    Darwin_x86_64) echo "opa_darwin_amd64" ;;
    Darwin_arm64)  echo "opa_darwin_arm64" ;;
    *)
      echo "Unsupported platform: ${uname_s}/${uname_m}" >&2
      return 1
      ;;
  esac
}

if existing="$(resolve_existing)"; then
  echo "[install-opa] reusing existing OPA binary at ${existing}"
  if "${existing}" version >/dev/null 2>&1; then
    OPA_BIN="${existing}"
  else
    echo "[install-opa] existing binary at ${existing} failed 'opa version'; reinstalling" >&2
    rm -f "${existing}"
  fi
fi

if [ ! -x "${OPA_BIN}" ]; then
  asset="$(detect_asset)"
  url="https://openpolicyagent.org/downloads/${OPA_VERSION}/${asset}"
  echo "[install-opa] downloading ${url} -> ${OPA_BIN}"
  mkdir -p "$(dirname "${OPA_BIN}")"
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL --retry 3 --retry-delay 2 -o "${OPA_BIN}" "${url}"
  elif command -v wget >/dev/null 2>&1; then
    wget -q -O "${OPA_BIN}" "${url}"
  else
    echo "[install-opa] neither curl nor wget is available" >&2
    exit 1
  fi
  chmod +x "${OPA_BIN}"
fi

echo "[install-opa] verifying ${OPA_BIN}"
"${OPA_BIN}" version

if [ -n "${GITHUB_ENV:-}" ]; then
  # Persists OPA_BIN to subsequent GitHub Actions steps in the same job.
  echo "OPA_BIN=${OPA_BIN}" >>"${GITHUB_ENV}"
  echo "[install-opa] exported OPA_BIN=${OPA_BIN} to GITHUB_ENV"
fi

# Note: this `export` only affects the current shell. It does not persist to
# the npm/pnpm parent process, so the gateway-opa-live test relies on either
# (a) the GITHUB_ENV write above, or (b) probing the well-known /tmp/opa path
# that this script installs to by default.
export OPA_BIN
