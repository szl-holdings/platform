#!/usr/bin/env bash
# Self-heal the sentra-core venv. Runs at workflow start and at deploy build
# time; no-ops if the venv is already present and importable. Idempotent.
#
# Mirrors services/amaru/scripts/bootstrap_venv.sh: we verify by file presence
# inside the venv's own site-packages (not via `python -c "import ..."`) so a
# bare import succeeding against PEP 370 user-site / system packages cannot
# mask a silent under-install (see task #5191 root cause).
set -euo pipefail

cd "$(dirname "$0")/.."

VENV=".venv"
PYBIN="$VENV/bin/python"

detect_site() {
  if [[ -x "$PYBIN" ]]; then
    "$PYBIN" -c "import sysconfig; print(sysconfig.get_paths()['purelib'])" 2>/dev/null || true
  fi
}

needs_bootstrap=0
if [[ ! -x "$PYBIN" ]]; then
  needs_bootstrap=1
else
  SITE="$(detect_site)"
  if [[ -z "$SITE" || ! -d "$SITE/httpx" ]]; then
    needs_bootstrap=1
  # Modern pip (PEP 660) editable installs do NOT create sentra_core.egg-link;
  # they create _editable_impl_sentra_core.pth + sentra_core-*.dist-info. Accept
  # either layout; rebuild only if neither marker is present.
  elif [[ ! -e "$SITE/_editable_impl_sentra_core.pth" ]] \
       && [[ -z "$(compgen -G "$SITE/sentra_core-*.dist-info" || true)" ]] \
       && [[ ! -e "$SITE/sentra_core.egg-link" ]]; then
    needs_bootstrap=1
  fi
fi

if [[ "$needs_bootstrap" -eq 1 ]]; then
  if ! command -v python3 >/dev/null 2>&1; then
    echo "[sentra-core bootstrap] FATAL: python3 not found on PATH; ensure the deployment provisions python-3.11+ (.replit modules)." >&2
    exit 1
  fi
  py_version="$(python3 -c 'import sys;print("%d.%d"%sys.version_info[:2])' 2>/dev/null || echo "0.0")"
  py_major="${py_version%%.*}"; py_minor="${py_version##*.}"
  if [[ "$py_major" -lt 3 ]] || { [[ "$py_major" -eq 3 ]] && [[ "$py_minor" -lt 11 ]]; }; then
    echo "[sentra-core bootstrap] FATAL: python3 is $py_version; sentra-core requires >=3.11." >&2
    exit 1
  fi
  echo "[sentra-core bootstrap] (re)creating $VENV (python $py_version)"
  rm -rf "$VENV"
  python3 -m venv "$VENV"
  # --break-system-packages: harmless inside our own venv (Nix python is marked
  # PEP 668 externally-managed). --ignore-installed: force pip to write into the
  # venv even when a package already exists in the read-only Nix store.
  env PIP_USER=0 "$VENV/bin/pip" install \
    --no-user --quiet --break-system-packages --ignore-installed \
    -e . >/dev/null
  echo "[sentra-core bootstrap] install complete"
else
  echo "[sentra-core bootstrap] .venv present, verifying..."
fi

# Readiness probe — refuse to declare ready unless sentra_core + httpx import
# AND the CLI can round-trip a JSON request. This is what task #5191 needed:
# every previous regression slipped past because we only checked file presence.
PROBE_REQ='{"op":"threat_model.build","payload":{"assets":[{"id":"probe","name":"probe","kind":"endpoint"}],"sources":[{"id":"probe","name":"probe","techniques":["T1059"]}]}}'
probe_out="$(printf '%s' "$PROBE_REQ" | PYTHONPATH=src "$PYBIN" -m sentra_core.cli 2>&1)" || {
  echo "[sentra-core bootstrap] FATAL: sentra_core.cli probe failed:" >&2
  printf '%s\n' "$probe_out" >&2
  exit 1
}
case "$probe_out" in
  *'"ok": true'*) ;;
  *)
    echo "[sentra-core bootstrap] FATAL: sentra_core.cli probe returned unexpected output:" >&2
    printf '%s\n' "$probe_out" >&2
    exit 1
    ;;
esac
echo "[sentra-core bootstrap] ready (probe ok)"
