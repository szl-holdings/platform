#!/usr/bin/env bash
# Source this file from repository bootstrap entry points. It makes the exact
# package manager effective for both the caller and child processes. Node 25+
# no longer bundles Corepack, so a pinned npm bootstrap is retained as a
# deterministic fallback for otherwise supported Node releases.

EXPECTED_PNPM_VERSION="10.26.1"

_activate_pnpm_writable_directory() {
  local candidate="$1"
  local probe

  [[ -n "$candidate" ]] || return 1
  mkdir -p "$candidate" 2>/dev/null || return 1
  probe="$candidate/.activate-pnpm-write-test-${BASHPID:-$$}"
  (umask 077 && : >"$probe") 2>/dev/null || return 1
  rm -f "$probe" 2>/dev/null || return 1
}

_activate_pnpm_resolved_version() {
  command -v pnpm >/dev/null 2>&1 || return 0
  pnpm --version 2>/dev/null || true
}

_activate_pnpm_main() {
  local candidate
  local requested_pnpm_home="${PNPM_HOME:-}"
  local resolved_pnpm_version=""
  local PNPM_BOOTSTRAP_ROOT=""
  local corepack_home_writable=0
  local script_directory=""
  local repository_root=""
  local workspace_root=""
  local -a pnpm_home_candidates=()

  # Respect an explicit tool home when it is usable. The checkout's parent is
  # the persisted workspace fallback in managed environments (for example,
  # /workspace/.pnpm-home); /tmp remains the last-resort writable cache.
  if [[ -n "$requested_pnpm_home" ]]; then
    pnpm_home_candidates+=("$requested_pnpm_home")
  fi
  if [[ -n "${HOME:-}" ]]; then
    pnpm_home_candidates+=("$HOME/.local/share/pnpm")
  fi
  if script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" 2>/dev/null && pwd -P)" &&
    repository_root="$(cd -- "$script_directory/.." 2>/dev/null && pwd -P)" &&
    workspace_root="$(cd -- "$repository_root/.." 2>/dev/null && pwd -P)"; then
    if [[ "$workspace_root" != "/" ]]; then
      pnpm_home_candidates+=("$workspace_root/.pnpm-home")
    fi
  fi
  pnpm_home_candidates+=("${TMPDIR:-/tmp}/szl-pnpm-${UID:-user}")

  PNPM_HOME=""
  for candidate in "${pnpm_home_candidates[@]}"; do
    if _activate_pnpm_writable_directory "$candidate"; then
      PNPM_HOME="$candidate"
      break
    fi
  done
  if [[ -z "$PNPM_HOME" ]]; then
    echo "[toolchain] no writable pnpm toolchain directory is available." >&2
    return 1
  fi
  export PNPM_HOME
  export PATH="$PNPM_HOME:$PATH"

  resolved_pnpm_version="$(_activate_pnpm_resolved_version)"
  if [[ "$resolved_pnpm_version" == "$EXPECTED_PNPM_VERSION" ]]; then
    return 0
  fi

  if command -v corepack >/dev/null 2>&1; then
    # Try the runtime's read-only preseeded Corepack cache first. Creating the
    # shim does not mutate that cache and keeps restricted/offline startup fast.
    if corepack enable --install-directory "$PNPM_HOME"; then
      hash -r 2>/dev/null || true
      resolved_pnpm_version="$(_activate_pnpm_resolved_version)"
    fi

    if [[ "$resolved_pnpm_version" != "$EXPECTED_PNPM_VERSION" ]]; then
      # A cache miss needs writable Corepack state and registry access. Both
      # operations are guarded because callers source this file under `set -e`.
      COREPACK_HOME="${COREPACK_HOME:-$PNPM_HOME/.corepack}"
      if _activate_pnpm_writable_directory "$COREPACK_HOME"; then
        corepack_home_writable=1
      else
        COREPACK_HOME="$PNPM_HOME/.corepack"
        if _activate_pnpm_writable_directory "$COREPACK_HOME"; then
          corepack_home_writable=1
        fi
      fi

      if [[ "$corepack_home_writable" -eq 1 ]]; then
        export COREPACK_HOME
        if corepack prepare "pnpm@${EXPECTED_PNPM_VERSION}" --activate &&
          corepack enable --install-directory "$PNPM_HOME"; then
          hash -r 2>/dev/null || true
          resolved_pnpm_version="$(_activate_pnpm_resolved_version)"
        fi
      fi
    fi
  fi

  if [[ "$resolved_pnpm_version" != "$EXPECTED_PNPM_VERSION" ]]; then
    if ! command -v npm >/dev/null 2>&1; then
      echo "[toolchain] npm is required to bootstrap pnpm when Corepack cannot activate it." >&2
      return 1
    fi

    PNPM_BOOTSTRAP_ROOT="$PNPM_HOME/.npm-bootstrap"
    if ! npm_config_cache="$PNPM_HOME/.npm-cache" npm install \
      --prefix "$PNPM_BOOTSTRAP_ROOT" \
      --no-save \
      --package-lock=false \
      --ignore-scripts \
      --no-audit \
      --no-fund \
      "pnpm@${EXPECTED_PNPM_VERSION}"; then
      echo "[toolchain] npm could not bootstrap pnpm ${EXPECTED_PNPM_VERSION}." >&2
      return 1
    fi
    if ! ln -sfn "$PNPM_BOOTSTRAP_ROOT/node_modules/pnpm/bin/pnpm.cjs" "$PNPM_HOME/pnpm"; then
      echo "[toolchain] could not install the pnpm shim in $PNPM_HOME." >&2
      return 1
    fi
    # pnpm may already have resolved to an ambient binary before the shim was
    # created. Clear Bash's command cache so this shell uses the pinned shim.
    hash -r 2>/dev/null || true
    resolved_pnpm_version="$(_activate_pnpm_resolved_version)"
  fi

  if [[ "$resolved_pnpm_version" != "$EXPECTED_PNPM_VERSION" ]]; then
    echo "[toolchain] pnpm ${EXPECTED_PNPM_VERSION} is required; resolved ${resolved_pnpm_version:-none}." >&2
    return 1
  fi
}

_activate_pnpm_status=0
if ! _activate_pnpm_main; then
  _activate_pnpm_status=1
fi

unset -f _activate_pnpm_main _activate_pnpm_resolved_version _activate_pnpm_writable_directory

if [[ "$_activate_pnpm_status" -ne 0 ]]; then
  unset _activate_pnpm_status
  return 1 2>/dev/null || exit 1
fi
unset _activate_pnpm_status
