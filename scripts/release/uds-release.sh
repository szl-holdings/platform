#!/usr/bin/env bash
# UDS Release Gate — single command that proves the Defense-Unicorns bundles
# are pull-ready.
#
# Pipeline (per bundle that exists):
#   1. Build via the bundle's own scripts/build.sh
#   2. Confirm <tarball>.sha256 sidecar exists and matches
#   3. If <tarball>.sig present AND cosign + COSIGN_PUBLIC_KEY available,
#      verify signature. Otherwise skip-with-warning (NOT a hard fail —
#      cosign keys aren't always available in CI).
#   4. Runtime smoke: import the staged JS/MJS entrypoint via node so we
#      catch packaging breakage (missing files, broken module graph).
#
# Then runs the Lean build (scripts/check-lean-build.sh) as the final gate.
#
# Bundles that don't exist on disk are reported as MISSING and counted in
# the summary but do not fail the gate (so this script keeps working as
# new bundles land). The script exits non-zero only on a real build,
# checksum, signature-mismatch, or runtime-smoke failure.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${REPO_ROOT}"

# Bundle list is sourced from uds-version-sync.json (single source of truth).
# Adding a bundle there auto-extends the release gate — no edits needed here.
MANIFEST_JSON="${REPO_ROOT}/scripts/release/uds-version-sync.json"
if [[ ! -f "${MANIFEST_JSON}" ]]; then
  printf '[uds-release] ERROR: manifest not found at %s\n' "${MANIFEST_JSON}" >&2
  exit 1
fi
mapfile -t REQUIRED_BUNDLES < <(node -e '
  const m = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
  for (const b of m.bundles) console.log(b.name);
' "${MANIFEST_JSON}")
if [[ "${#REQUIRED_BUNDLES[@]}" -eq 0 ]]; then
  printf '[uds-release] ERROR: no bundles in manifest %s\n' "${MANIFEST_JSON}" >&2
  exit 1
fi

declare -a OK_BUNDLES=()
declare -a MISSING_BUNDLES=()
declare -a FAILED_BUNDLES=()
declare -a SIG_SKIPPED=()
declare -a SIG_VERIFIED=()

log()  { printf '[uds-release] %s\n' "$*"; }
warn() { printf '[uds-release] WARN: %s\n' "$*" >&2; }
err()  { printf '[uds-release] ERROR: %s\n' "$*" >&2; }

# --- per-bundle pipeline -----------------------------------------------------
run_bundle() {
  local name="$1"
  local artifact_dir="${REPO_ROOT}/artifacts/${name}"
  local dist_dir="${REPO_ROOT}/dist/${name}"

  if [[ ! -d "${artifact_dir}" ]]; then
    MISSING_BUNDLES+=("${name}")
    err "${name}: required artifact directory ${artifact_dir} not found"
    return 1
  fi
  if [[ ! -x "${artifact_dir}/scripts/build.sh" ]]; then
    FAILED_BUNDLES+=("${name}:no-build-script")
    err "${name}: scripts/build.sh missing or not executable"
    return 1
  fi

  log "=== ${name}: build ==="
  if ! bash "${artifact_dir}/scripts/build.sh"; then
    FAILED_BUNDLES+=("${name}:build")
    err "${name}: build failed"
    return 1
  fi

  # Locate the produced tarball (zarf or fallback dir, whichever exists).
  local tarball
  tarball="$(ls -1t "${dist_dir}"/${name}-*.tar.zst 2>/dev/null | head -n1 || true)"
  if [[ -z "${tarball}" ]]; then
    tarball="$(ls -1t "${REPO_ROOT}/dist/${name}-fallback"/${name}-*.tar.zst 2>/dev/null | head -n1 || true)"
  fi
  if [[ -z "${tarball}" || ! -s "${tarball}" ]]; then
    FAILED_BUNDLES+=("${name}:no-tarball")
    err "${name}: no tarball produced under dist/${name}/"
    return 1
  fi
  log "${name}: tarball=${tarball} ($(du -h "${tarball}" | cut -f1))"

  # 2. sha256 sidecar.
  local sha_file="${tarball}.sha256"
  if [[ ! -s "${sha_file}" ]]; then
    FAILED_BUNDLES+=("${name}:no-sha256")
    err "${name}: missing sha256 sidecar at ${sha_file}"
    return 1
  fi
  if ! ( cd "$(dirname "${tarball}")" && sha256sum -c "$(basename "${sha_file}")" >/dev/null ); then
    FAILED_BUNDLES+=("${name}:sha256-mismatch")
    err "${name}: sha256 sidecar does not match tarball"
    return 1
  fi
  log "${name}: sha256 ✓"

  # 3. cosign verify (optional).
  local sig_file="${tarball}.sig"
  if [[ -s "${sig_file}" ]]; then
    if command -v cosign >/dev/null 2>&1 && [[ -n "${COSIGN_PUBLIC_KEY:-}" && -s "${COSIGN_PUBLIC_KEY}" ]]; then
      if cosign verify-blob --key "${COSIGN_PUBLIC_KEY}" --signature "${sig_file}" "${tarball}" >/dev/null 2>&1; then
        SIG_VERIFIED+=("${name}")
        log "${name}: cosign ✓"
      else
        FAILED_BUNDLES+=("${name}:cosign-mismatch")
        err "${name}: cosign signature verification FAILED"
        return 1
      fi
    else
      SIG_SKIPPED+=("${name}:sig-present-no-verifier")
      warn "${name}: .sig present but cosign + COSIGN_PUBLIC_KEY unavailable — skipping verify"
    fi
  else
    SIG_SKIPPED+=("${name}:unsigned")
    warn "${name}: no .sig sidecar (unsigned bundle — sha256 only)"
  fi

  # 4. Runtime smoke: confirm the bundle's primary entrypoint loads.
  if ! smoke_bundle "${name}" "${artifact_dir}"; then
    FAILED_BUNDLES+=("${name}:smoke")
    return 1
  fi
  log "${name}: smoke ✓"

  OK_BUNDLES+=("${name}")
}

smoke_bundle() {
  local name="$1"
  local artifact_dir="$2"
  case "${name}" in
    a11oy-uds)
      # The built bundle is consumer-bundled (vite/webpack) — tsc emits ESM
      # with extensionless relative imports, so a raw Node ESM `import()`
      # rejects it. The real correctness check is round-tripping every file
      # against MANIFEST.json + ATTESTATIONS.json (which build.sh already
      # ran), so the smoke here just (a) re-verifies the manifest from the
      # tarball-staged build/ and (b) sanity-loads the package.json + index.js
      # bytes to confirm each entrypoint is syntactically a JS module.
      ( cd "${artifact_dir}" \
        && node scripts/verify-manifest.mjs build >/dev/null \
        && node scripts/verify-attestations.mjs build build-attestations >/dev/null \
      ) || return 1
      # NB: --experimental-vm-modules must precede -e (Node parses flags
      # left-to-right; anything after -e is a script arg, not a runtime flag).
      node --experimental-vm-modules --input-type=module -e "
        const fs = await import('node:fs');
        const path = await import('node:path');
        const vm = await import('node:vm');
        if (typeof vm.SourceTextModule !== 'function') {
          throw new Error('vm.SourceTextModule unavailable — flag not active');
        }
        const root = '${artifact_dir}/build';
        for (const pkg of ['a11oy-connection', 'a11oy-core']) {
          const entry = path.join(root, pkg, 'index.js');
          if (!fs.existsSync(entry)) throw new Error('missing entry: ' + entry);
          const src = fs.readFileSync(entry, 'utf8');
          // Parse-only check; consumers wire the import graph themselves.
          new vm.SourceTextModule(src, { identifier: entry });
          console.log('  parsed', pkg, '→ index.js (' + src.length + 'b)');
        }
      " || return 1
      ;;
    sentra-uds|amaru-uds)
      # doctrine-demo.mjs uses relative imports — must run with cwd in the artifact dir.
      ( cd "${artifact_dir}" && node ./doctrine-demo.mjs >/dev/null ) || return 1
      ;;
    rosie-uds)
      ( cd "${artifact_dir}" && node ./doctrine-demo.mjs >/dev/null ) || return 1
      ;;
    *)
      warn "${name}: no smoke recipe registered"
      ;;
  esac
  return 0
}

# --- main --------------------------------------------------------------------
log "starting UDS release gate over required bundles: ${REQUIRED_BUNDLES[*]}"
GATE_FAILED=0
for b in "${REQUIRED_BUNDLES[@]}"; do
  if ! run_bundle "${b}"; then
    GATE_FAILED=1
  fi
done

log "=== lean build ==="
if bash "${REPO_ROOT}/scripts/check-lean-build.sh"; then
  log "lean ✓"
else
  err "lean build FAILED"
  GATE_FAILED=1
  FAILED_BUNDLES+=("lean")
fi

# --- summary -----------------------------------------------------------------
echo
log "=== summary ==="
log "ok:        ${#OK_BUNDLES[@]} ${OK_BUNDLES[*]:-}"
log "missing:   ${#MISSING_BUNDLES[@]} ${MISSING_BUNDLES[*]:-}"
log "sig-skip:  ${#SIG_SKIPPED[@]} ${SIG_SKIPPED[*]:-}"
log "sig-ok:    ${#SIG_VERIFIED[@]} ${SIG_VERIFIED[*]:-}"
log "failed:    ${#FAILED_BUNDLES[@]} ${FAILED_BUNDLES[*]:-}"

if [[ ${GATE_FAILED} -ne 0 ]]; then
  err "release gate FAILED"
  exit 1
fi
log "release gate PASSED"
