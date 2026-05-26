#!/usr/bin/env bash
# Self-heal the eval-runner venv. Runs at workflow start and at the api-server
# production prelude (artifacts/api-server pnpm start). Idempotent — no-ops when
# the venv is already present and the runtime imports succeed.
#
# Mirrors services/sentra-core/scripts/bootstrap.sh and
# services/amaru/scripts/bootstrap_venv.sh: we verify by file presence inside
# the venv's own site-packages (not via bare `python -c "import ..."`) so a
# PEP 370 user-site or system-wide install cannot mask a silent under-install
# (root cause of task #5191).
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
  if [[ -z "$SITE" \
        || ! -d "$SITE/fastapi" \
        || ! -d "$SITE/uvicorn" \
        || ! -d "$SITE/httpx" \
        || ! -d "$SITE/structlog" ]]; then
    needs_bootstrap=1
  fi
fi

if [[ "$needs_bootstrap" -eq 1 ]]; then
  if ! command -v python3 >/dev/null 2>&1; then
    echo "[eval-runner bootstrap] FATAL: python3 not found on PATH; ensure the deployment provisions python-3.11+ (.replit modules)." >&2
    exit 1
  fi
  py_version="$(python3 -c 'import sys;print("%d.%d"%sys.version_info[:2])' 2>/dev/null || echo "0.0")"
  py_major="${py_version%%.*}"; py_minor="${py_version##*.}"
  if [[ "$py_major" -lt 3 ]] || { [[ "$py_major" -eq 3 ]] && [[ "$py_minor" -lt 11 ]]; }; then
    echo "[eval-runner bootstrap] FATAL: python3 is $py_version; eval-runner requires >=3.11." >&2
    exit 1
  fi
  echo "[eval-runner bootstrap] (re)creating $VENV (python $py_version)"
  rm -rf "$VENV"
  python3 -m venv "$VENV"
  # --break-system-packages: harmless inside our own venv (Nix python is marked
  # PEP 668 externally-managed). --ignore-installed: force pip to write into the
  # venv even when a package already exists in the read-only Nix store.
  # We deliberately install ONLY the runtime essentials needed for boot/health,
  # not the full requirements.txt (which pulls 200+ MB of lm-eval/datasets/torch
  # transitively and would blow the deploy timeout). Heavy suite execution
  # paths self-install on first use; the FastAPI service + /health probe come
  # up immediately on this minimal set.
  env PIP_USER=0 "$VENV/bin/pip" install \
    --no-user --quiet --break-system-packages --ignore-installed \
    "fastapi>=0.111.0" \
    "uvicorn[standard]>=0.30.0" \
    "pydantic>=2.7.0" \
    "httpx>=0.27.0" \
    "structlog>=24.1.0" >/dev/null
  echo "[eval-runner bootstrap] install complete"
else
  echo "[eval-runner bootstrap] .venv present, verifying..."
fi

# Readiness probe — refuse to declare ready unless the FastAPI app object
# imports cleanly. Catches missing deps, syntax errors, and import-time crashes
# before uvicorn ever binds the port.
probe_out="$(PYTHONPATH=. "$PYBIN" -c "import src.main; assert src.main.app is not None; print('ok')" 2>&1)" || {
  echo "[eval-runner bootstrap] FATAL: src.main import probe failed:" >&2
  printf '%s\n' "$probe_out" >&2
  exit 1
}
case "$probe_out" in
  *ok*) ;;
  *)
    echo "[eval-runner bootstrap] FATAL: src.main probe returned unexpected output:" >&2
    printf '%s\n' "$probe_out" >&2
    exit 1
    ;;
esac
echo "[eval-runner bootstrap] ready (probe ok)"
