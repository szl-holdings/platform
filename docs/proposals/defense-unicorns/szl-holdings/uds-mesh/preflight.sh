#!/usr/bin/env bash
# szl-mesh — preflight checks for the UDS bundle
#
# Runs the static checks that DO NOT require uds-cli/zarf/kind:
#   1. YAML parses for the bundle, the three zarf.yaml files, and every manifest
#   2. Every file referenced from a zarf.yaml component (manifests + files) exists
#   3. Bundle package names match on-disk package metadata names
#   4. uds-mesh/cosign.pub is present and a syntactically valid P-256 PEM
#      (the public key operators use to verify the published Zarf packages
#      per §05 Fix A — see uds-mesh/README.md "Operator-side signature
#      verification")
#
# Then, if uds-cli/zarf/kind are on PATH, runs the live validation:
#   4. zarf package create for each of a11oy/sentra/amaru (local-build variant)
#   5. uds-cli bundle create -f uds-bundle.local.yaml from uds-mesh/
#   6. uds-cli bundle deploy into a fresh kind cluster named szl-mesh-preflight
#   7. kubectl wait Ready on each namespace's deployment
#   8. tear-down (cluster + artifacts)
#
# Exit 0 = bundle is green. Exit non-zero = first failure.
#
# Usage:
#   ./preflight.sh              # full run (static + live if tools present)
#   ./preflight.sh --static     # static checks only (safe inside Replit)
#   ./preflight.sh --keep       # do not tear down kind cluster / artifacts

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CLUSTER_NAME="${CLUSTER_NAME:-szl-mesh-preflight}"
MODE="full"
KEEP=0
for arg in "$@"; do
  case "$arg" in
    --static) MODE="static" ;;
    --keep)   KEEP=1 ;;
    -h|--help)
      sed -n '2,30p' "$0"; exit 0 ;;
  esac
done

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
blue()  { printf '\033[34m%s\033[0m\n' "$*"; }

blue "[1/3] Static YAML + reference checks"
python3 - "$ROOT" <<'PY'
import os, sys, yaml
root = sys.argv[1]
files = [
  f'{root}/uds-mesh/uds-bundle.yaml',
  f'{root}/a11oy/deploy/zarf.yaml',
  f'{root}/sentra/deploy/zarf.yaml',
  f'{root}/amaru/deploy/zarf.yaml',
]
for p in ('a11oy','sentra','amaru'):
  d = f'{root}/{p}/deploy/manifests'
  files += [f'{d}/{f}' for f in sorted(os.listdir(d))]

fail = 0
for f in files:
  try: list(yaml.safe_load_all(open(f)))
  except Exception as e:
    print(f'FAIL parse {f}: {e}'); fail += 1

for pkg in ('a11oy','sentra','amaru'):
  z = yaml.safe_load(open(f'{root}/{pkg}/deploy/zarf.yaml'))
  for c in z.get('components', []):
    for m in c.get('manifests', []):
      for file in m.get('files', []):
        p = f'{root}/{pkg}/deploy/{file}'
        if not os.path.exists(p):
          print(f'FAIL missing manifest {p}'); fail += 1
    for fe in c.get('files', []):
      p = f'{root}/{pkg}/deploy/{fe["source"]}'
      if not os.path.exists(p):
        print(f'FAIL missing file {p}'); fail += 1

b = yaml.safe_load(open(f'{root}/uds-mesh/uds-bundle.yaml'))
bn = {p['name'] for p in b.get('packages', [])}
dn = {yaml.safe_load(open(f'{root}/{p}/deploy/zarf.yaml'))['metadata']['name']
      for p in ('a11oy','sentra','amaru')}
if bn != dn:
  print(f'FAIL bundle/on-disk name mismatch: {bn} vs {dn}'); fail += 1

sys.exit(1 if fail else 0)
PY

# (4) cosign.pub — verifies the committed public key is a valid P-256
# PEM so operators can actually run `zarf package inspect --key cosign.pub`.
# Falls back to a pure-Python ASN.1 sniff when openssl is unavailable.
COSIGN_PUB="$ROOT/uds-mesh/cosign.pub"
if [[ ! -f "$COSIGN_PUB" ]]; then
  red "FAIL: $COSIGN_PUB is missing — operators cannot verify package signatures."
  exit 1
fi
if command -v openssl >/dev/null 2>&1; then
  CURVE="$(openssl pkey -pubin -in "$COSIGN_PUB" -text -noout 2>/dev/null \
          | grep -oE 'ASN1 OID: [A-Za-z0-9_-]+' | head -1 | awk '{print $3}')"
  if [[ "$CURVE" != "prime256v1" ]]; then
    red "FAIL: $COSIGN_PUB is not a P-256 (prime256v1) PEM (got: '${CURVE:-unparseable}')."
    red "      cosign / zarf --key expects an ECDSA P-256 public key in PEM form."
    exit 1
  fi
else
  python3 - "$COSIGN_PUB" <<'PY' || exit 1
import base64, sys, re
data = open(sys.argv[1]).read()
m = re.search(r'-----BEGIN PUBLIC KEY-----(.+?)-----END PUBLIC KEY-----', data, re.S)
if not m:
    print(f'FAIL: {sys.argv[1]} is not a PEM PUBLIC KEY block'); sys.exit(1)
der = base64.b64decode(''.join(m.group(1).split()))
# P-256 SPKI is 91 bytes and contains the prime256v1 OID 1.2.840.10045.3.1.7
oid = bytes([0x2A,0x86,0x48,0xCE,0x3D,0x03,0x01,0x07])
if len(der) != 91 or oid not in der:
    print(f'FAIL: {sys.argv[1]} is not an ECDSA P-256 (prime256v1) SPKI'); sys.exit(1)
PY
fi
green "    static checks: OK (incl. cosign.pub P-256 PEM)"

if [[ "$MODE" == "static" ]]; then
  green "Done (static-only mode)."
  exit 0
fi

need() { command -v "$1" >/dev/null 2>&1 || { red "missing tool: $1"; MISSING=1; }; }
MISSING=0
need zarf; need uds; need kind; need kubectl
if (( MISSING )); then
  red "Install zarf, uds-cli, kind, and kubectl, then re-run. See uds-mesh/README.md §0."
  exit 2
fi

blue "[2/3] Build packages + bundle (local-build variant)"
# Use the committed uds-bundle.local.yaml — it already points at sibling
# deploy/ dirs, so we do not need GHCR round-trip for the preflight.
TMP="$(mktemp -d)"
trap '[[ $KEEP -eq 1 ]] || rm -rf "$TMP"' EXIT
cp -r "$ROOT/uds-mesh" "$TMP/uds-mesh"
# Symlink sibling package dirs next to the temp uds-mesh
for p in a11oy sentra amaru; do ln -s "$ROOT/$p" "$TMP/$p"; done

( cd "$TMP/a11oy/deploy"  && zarf package create . --confirm )
( cd "$TMP/sentra/deploy" && zarf package create . --confirm )
( cd "$TMP/amaru/deploy"  && zarf package create . --confirm )
( cd "$TMP/uds-mesh"      && uds bundle create . -f uds-bundle.local.yaml --confirm )
BUNDLE="$(ls "$TMP/uds-mesh"/uds-bundle-szl-mesh-*.tar.zst | head -1)"
[[ -f "$BUNDLE" ]] || { red "bundle not produced"; exit 3; }
green "    built: $BUNDLE"

blue "[3/3] Deploy into kind cluster '$CLUSTER_NAME'"
kind delete cluster --name "$CLUSTER_NAME" >/dev/null 2>&1 || true
kind create cluster --name "$CLUSTER_NAME"
trap '[[ $KEEP -eq 1 ]] || { kind delete cluster --name "$CLUSTER_NAME" >/dev/null 2>&1 || true; rm -rf "$TMP"; }' EXIT

uds bundle deploy "$BUNDLE" --confirm

for ns in a11oy sentra amaru; do
  kubectl -n "$ns" rollout status deploy --timeout=120s
done

green "All three namespaces healthy. Bundle is green."
