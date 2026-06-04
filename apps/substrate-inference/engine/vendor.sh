#!/usr/bin/env bash
set -euo pipefail

OLLM_VERSION="${OLLM_VERSION:-v0.4.2}"
OLLM_REPO="https://github.com/Mega4alik/ollm.git"
VENDOR_DIR="$(cd "$(dirname "$0")" && pwd)/ollm"

echo "=== Substrate Engine Vendor Script ==="
echo "oLLM version: ${OLLM_VERSION}"
echo "Target dir:   ${VENDOR_DIR}"

if [ -d "$VENDOR_DIR" ] && [ -f "$VENDOR_DIR/setup.py" ] || [ -f "$VENDOR_DIR/pyproject.toml" ]; then
  echo "oLLM source already vendored at ${VENDOR_DIR}"
  echo "To re-vendor, remove the directory first: rm -rf ${VENDOR_DIR}"
  exit 0
fi

echo "Cloning oLLM ${OLLM_VERSION} from ${OLLM_REPO}..."
git clone --depth 1 --branch "${OLLM_VERSION}" "${OLLM_REPO}" "${VENDOR_DIR}"

rm -rf "${VENDOR_DIR}/.git"

echo ""
echo "oLLM ${OLLM_VERSION} vendored successfully."
echo ""
echo "To install from vendored source:"
echo "  pip install -e ${VENDOR_DIR}"
echo ""
echo "License: MIT (see ${VENDOR_DIR}/LICENSE)"
