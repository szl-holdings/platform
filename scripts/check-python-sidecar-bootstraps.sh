#!/usr/bin/env bash
# CI validation: every Python sidecar declared in the inventory below MUST have
# an idempotent bootstrap script that is invoked from the production entry
# point. This is the deploy-survival check from task #5260 — it catches the
# same class of bug that broke sentra-core in task #5191 (sidecar assumed a
# dev-only `.pythonlibs/` or a `start.sh` invocation that never happens in
# production).
#
# A sidecar passes when:
#   1. Its declared bootstrap script exists and is executable.
#   2. The script is referenced from at least one deploy hook (the api-server
#      production `pnpm start` chain, artifacts/api-server/start.sh, or the
#      artifact's own [services.development] command in artifact.toml).
#   3. The script contains the canonical idempotency guard pattern
#      (`needs_bootstrap` flag OR a stamp file gate). Bootstrap scripts that
#      unconditionally rebuild the venv on every restart are rejected because
#      they balloon deploy time and mask under-install regressions.
#
# Inventory format: "name|bootstrap_path|deploy_hook_pattern"
# - name              : human-readable sidecar name
# - bootstrap_path    : path to the bootstrap script, relative to repo root
# - deploy_hook_pattern : an extended-regex matched against the union of
#                        api-server start.sh + api-server package.json +
#                        artifacts/api-server/.replit-artifact/artifact.toml
#
# To register a new Python sidecar: add a line to SIDECARS and create the
# bootstrap script. This script will fail loudly until the deploy hook is
# wired up.
set -euo pipefail

cd "$(dirname "$0")/.."

SIDECARS=(
  "sentra-core|services/sentra-core/scripts/bootstrap.sh|(services/sentra-core/scripts/bootstrap\\.sh|SENTRA_CORE_DIR.*scripts/bootstrap\\.sh)"
  "amaru|services/amaru/scripts/bootstrap_venv.sh|(services/amaru/scripts/bootstrap_venv\\.sh|AMARU_DIR.*scripts/bootstrap_venv\\.sh|scripts/bootstrap_venv\\.sh)"
  "sentra-detector-sidecar|scripts/sentra-sidecar-dev.sh|scripts/sentra-sidecar-dev\\.sh"
  "eval-runner|apps/eval-runner/scripts/bootstrap.sh|(apps/eval-runner/scripts/bootstrap\\.sh|EVAL_RUNNER_DIR.*scripts/bootstrap\\.sh)"
)

# Union of files where deploy hooks are declared.
HOOK_SOURCES=(
  "artifacts/api-server/start.sh"
  "artifacts/api-server/package.json"
  "artifacts/api-server/.replit-artifact/artifact.toml"
)

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
yellow(){ printf '\033[33m%s\033[0m\n' "$*"; }

fail=0
echo "[python-sidecar-audit] checking ${#SIDECARS[@]} sidecars..."

for entry in "${SIDECARS[@]}"; do
  IFS='|' read -r name script pattern <<<"$entry"

  if [[ ! -f "$script" ]]; then
    red "  ✗ $name: bootstrap script missing at $script"
    fail=1
    continue
  fi
  if [[ ! -x "$script" ]]; then
    red "  ✗ $name: bootstrap script not executable: $script (run: chmod +x $script)"
    fail=1
    continue
  fi

  # Idempotency guard: accept either the `needs_bootstrap` flag pattern OR a
  # stamp-file gate (e.g. sentra-sidecar-dev.sh uses $STAMP).
  if ! grep -Eq 'needs_bootstrap|bootstrap-ok|\$STAMP|-f "\$STAMP"' "$script"; then
    red "  ✗ $name: $script lacks an idempotency guard (needs_bootstrap flag or stamp file)"
    fail=1
    continue
  fi

  # Deploy hook reference check.
  hook_found=0
  for src in "${HOOK_SOURCES[@]}"; do
    if [[ -f "$src" ]] && grep -Eq "$pattern" "$src"; then
      hook_found=1
      break
    fi
  done
  if [[ "$hook_found" -eq 0 ]]; then
    red "  ✗ $name: bootstrap script $script is not referenced from any deploy hook"
    red "      checked: ${HOOK_SOURCES[*]}"
    fail=1
    continue
  fi

  green "  ✓ $name"
done

# Discovery sweep: warn (do NOT fail) when a Python service is found under
# services/ or apps/ that is NOT in the SIDECARS inventory. This is intentional
# — services like substrate-py-workers ship as a Docker image and are not part
# of the Replit deploy surface — but a missing entry should be noticed so the
# inventory cannot silently drift away from reality.
echo "[python-sidecar-audit] scanning for unregistered Python services..."
known_names=()
for entry in "${SIDECARS[@]}"; do
  IFS='|' read -r name _ _ <<<"$entry"
  known_names+=("$name")
done

is_known() {
  local needle="$1"
  for n in "${known_names[@]}"; do
    [[ "$n" == "$needle" ]] && return 0
  done
  return 1
}

# A "Python service" here = a directory under services/ or apps/ containing
# pyproject.toml AND a FastAPI/uvicorn entry point. We exclude pure Python
# libraries (no service entry) and Docker-only fleets explicitly via ALLOWLIST.
ALLOWLIST=(
  "services/substrate-py-workers"     # ships as Docker image; deployed via k8s
  "apps/substrate-inference"          # ships as Docker image; GPU pod
  "services/lyte-metrics-store"       # not currently wired into Replit deploy
  "services/meridian_control_plane"   # CLI/library, not a long-running service
  "services/meridian_forecast_lab"    # CLI/library, not a long-running service
  "services/verticals"                # library — vertical pack registry
)

allowlisted() {
  local needle="$1"
  for a in "${ALLOWLIST[@]}"; do
    [[ "$a" == "$needle" ]] && return 0
  done
  return 1
}

while IFS= read -r -d '' pyproj; do
  dir="$(dirname "$pyproj")"
  rel="${dir#./}"
  # Skip anything not under services/ or apps/.
  case "$rel" in
    services/*|apps/*) ;;
    *) continue ;;
  esac
  name="$(basename "$rel")"
  if is_known "$name" || allowlisted "$rel"; then
    continue
  fi
  yellow "  ! $rel: pyproject.toml found but not in SIDECARS inventory and not allowlisted"
  yellow "      add an entry to SIDECARS in $0 OR add to ALLOWLIST with justification"
  fail=1
done < <(find ./services ./apps -maxdepth 2 -name pyproject.toml -print0 2>/dev/null)

if [[ "$fail" -ne 0 ]]; then
  echo
  red "[python-sidecar-audit] FAIL"
  exit 1
fi

green "[python-sidecar-audit] OK"
