#!/usr/bin/env bash
# Sentra.UDS build — pure-ESM kernel, no TS compilation needed.
set -euo pipefail

ARTIFACT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "${ARTIFACT_DIR}/../.." && pwd)"
VERSION="$(node -p "require('${ARTIFACT_DIR}/package.json').version")"
GIT_SHA="$(git -C "${REPO_ROOT}" rev-parse --short HEAD 2>/dev/null || echo unknown)"
BUILD_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

log() { printf '[sentra-uds] %s\n' "$*"; }
log "version=${VERSION} git=${GIT_SHA} ts=${BUILD_TS}"
mkdir -p "${ARTIFACT_DIR}/build"

node -e '
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const root = process.argv[1];
function walk(d, acc=[]){ for (const e of fs.readdirSync(d, {withFileTypes:true})) {
  const p = path.join(d, e.name);
  if (e.isDirectory()) walk(p, acc); else acc.push(p);
}; return acc; }
const files = [
  ...walk(path.join(root,"lib")),
  path.join(root,"doctrine-demo.mjs"),
  ...walk(path.join(root,"docs")),
].map(p => path.relative(root, p)).sort();
const entries = files.map(rel => {
  const buf = fs.readFileSync(path.join(root, rel));
  return { path: rel, size: buf.length, sha256: crypto.createHash("sha256").update(buf).digest("hex") };
});
const manifest = {
  product: "sentra-uds", version: process.env.VERSION, git_sha: process.env.GIT_SHA, build_ts: process.env.BUILD_TS,
  doctrine: "Sentra-V1", entries,
};
fs.mkdirSync(path.join(root,"build"), {recursive:true});
fs.writeFileSync(path.join(root,"build/MANIFEST.json"), JSON.stringify(manifest, null, 2));
console.log("MANIFEST.json:", entries.length, "files");
' --input-type=module "${ARTIFACT_DIR}"

DIST_DIR="${REPO_ROOT}/dist/sentra-uds"
mkdir -p "${DIST_DIR}"
TARBALL="${DIST_DIR}/sentra-uds-${VERSION}.tar.zst"

if command -v zarf >/dev/null 2>&1; then
  log "running zarf package create"
  ( cd "${ARTIFACT_DIR}" && zarf package create . --confirm --output "${DIST_DIR}" )
  PRODUCED="$(ls -1t "${DIST_DIR}"/zarf-package-sentra-uds-*.tar.zst 2>/dev/null | head -n1 || true)"
  if [[ -n "${PRODUCED}" ]]; then rm -f "${TARBALL}"; mv -f "${PRODUCED}" "${TARBALL}"; fi
else
  log "zarf not available — fallback deterministic tar+zstd"
  STAGE="$(mktemp -d)"
  cp -R "${ARTIFACT_DIR}/lib" "${ARTIFACT_DIR}/docs" "${ARTIFACT_DIR}/doctrine-demo.mjs" "${ARTIFACT_DIR}/build/MANIFEST.json" "${ARTIFACT_DIR}/uds-bundle.yaml" "${ARTIFACT_DIR}/zarf.yaml" "${STAGE}/"
  tar --sort=name --owner=0 --group=0 --numeric-owner --mtime="${BUILD_TS}" -C "${STAGE}" -cf - . | zstd -19 -q -f -o "${TARBALL}"
  rm -rf "${STAGE}"
fi
[[ -s "${TARBALL}" ]] || { echo "tarball missing"; exit 1; }
log "wrote $(du -h "${TARBALL}" | cut -f1) -> ${TARBALL}"

( cd "${DIST_DIR}" && sha256sum "$(basename "${TARBALL}")" > "$(basename "${TARBALL}").sha256" )
log "wrote ${TARBALL}.sha256"

if [[ -n "${COSIGN_KEY:-}" ]] && command -v cosign >/dev/null 2>&1; then
  log "signing with cosign"
  rm -f "${TARBALL}.sig"
  cosign sign-blob --yes --key "${COSIGN_KEY}" --output-signature "${TARBALL}.sig" "${TARBALL}"
  log "wrote ${TARBALL}.sig"
fi
log "done."
