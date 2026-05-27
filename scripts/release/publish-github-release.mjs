#!/usr/bin/env node
// Reusable publisher for UDS bundles.
//
// For each bundle listed in scripts/release/uds-version-sync.json (or the
// subset passed on argv), this script:
//   1. Resolves release_repo + tag (`${release_tag_prefix}${version}` from
//      the matching artifacts/<name>/package.json).
//   2. Idempotently deletes any pre-existing release + tag ref for the tag.
//   3. Creates the GitHub release with auto-generated notes (the bundle
//      headline + doctrine line + sha256 from the local sidecar).
//   4. Uploads every asset in dist/<name>/ (tarball + .sig + .sha256 + .pub
//      + any staged docs) with correct Content-Type per extension.
//
// Build + sign first via scripts/release/uds-release.sh — this script does
// NOT rebuild; it only publishes what's already on disk.
//
// Usage:
//   node scripts/release/publish-github-release.mjs                  # all bundles
//   node scripts/release/publish-github-release.mjs a11oy-uds sentra-uds
//   DRY_RUN=1 node scripts/release/publish-github-release.mjs        # plan only
//
// Auth: uses the Replit GitHub connector (no PAT needed).

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const MANIFEST = JSON.parse(
  readFileSync(join(__dirname, "uds-version-sync.json"), "utf8"),
);
const TAG_PREFIX = MANIFEST.release_tag_prefix ?? "uds-v";
const DRY_RUN = process.env.DRY_RUN === "1";

const CONTENT_TYPE = {
  ".zst": "application/zstd",
  ".sig": "application/octet-stream",
  ".sha256": "text/plain",
  ".pub": "application/x-pem-file",
  ".md": "text/markdown",
  ".yaml": "application/x-yaml",
  ".yml": "application/x-yaml",
  ".json": "application/json",
};

async function getGithubToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? `repl ${process.env.REPL_IDENTITY}`
    : process.env.WEB_REPL_RENEWAL
      ? `depl ${process.env.WEB_REPL_RENEWAL}`
      : null;
  if (!hostname || !xReplitToken) {
    throw new Error("Missing REPLIT_CONNECTORS_HOSTNAME or identity token");
  }
  const url = `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=github`;
  const r = await fetch(url, {
    headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken },
  });
  if (!r.ok) throw new Error(`Connector lookup failed: ${r.status}`);
  const j = await r.json();
  const settings = j.items?.[0]?.settings || {};
  const token =
    settings.access_token || settings.oauth?.credentials?.access_token;
  if (!token) throw new Error("No GitHub access token in connector settings");
  return token;
}

async function gh(token, path, init = {}) {
  const url = path.startsWith("http") ? path : `https://api.github.com${path}`;
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "szl-holdings-uds-publisher",
      "X-GitHub-Api-Version": "2022-11-28",
      ...init.headers,
      ...(init.body && !init.headers?.["Content-Type"]
        ? { "Content-Type": "application/json" }
        : {}),
    },
  });
}

function readVersion(artifactRel) {
  const p = join(REPO_ROOT, artifactRel, "package.json");
  return JSON.parse(readFileSync(p, "utf8")).version;
}

function locateDistDir(name) {
  for (const d of [
    join(REPO_ROOT, "dist", name),
    join(REPO_ROOT, "dist", `${name}-fallback`),
  ]) {
    if (existsSync(d)) return d;
  }
  return null;
}

function listAssets(distDir, name, version) {
  // Tarball + its sidecars + the staged pubkey + any docs alongside.
  const out = [];
  for (const f of readdirSync(distDir)) {
    const full = join(distDir, f);
    if (!statSync(full).isFile()) continue;
    // Skip transient zarf intermediates if anything slipped through.
    if (f.startsWith("zarf-package-")) continue;
    out.push(full);
  }
  return out;
}

function buildReleaseBody(bundle, version, tarballName, sha256Line) {
  const url = `https://github.com/${bundle.release_repo}/releases/download/${TAG_PREFIX}${version}/${tarballName}`;
  return `# ${bundle.name} ${TAG_PREFIX}${version}

${bundle.headline}

**Doctrine:** ${bundle.doctrine}

## Verify

\`\`\`bash
curl -fSLO ${url}
curl -fSLO ${url}.sha256
curl -fSLO ${url}.sig
curl -fSLO https://github.com/${bundle.release_repo}/releases/download/${TAG_PREFIX}${version}/${bundle.name}-dev.pub
sha256sum -c ${tarballName}.sha256
cosign verify-blob --key ${bundle.name}-dev.pub --signature ${tarballName}.sig ${tarballName}
\`\`\`

\`\`\`
${sha256Line}
\`\`\`

Built from the SZL Holdings platform monorepo. See \`artifacts/${bundle.artifact.replace(/^artifacts\//, "")}/README.md\` and \`artifacts/${bundle.artifact.replace(/^artifacts\//, "")}/RELEASE.md\` for build provenance.
`;
}

async function deleteExistingRelease(token, repo, tag) {
  // Delete release if present.
  const r = await gh(token, `/repos/${repo}/releases/tags/${tag}`);
  if (r.status === 200) {
    const j = await r.json();
    const del = await gh(token, `/repos/${repo}/releases/${j.id}`, {
      method: "DELETE",
    });
    if (!del.ok && del.status !== 404)
      throw new Error(`delete release ${tag}: ${del.status}`);
  }
  // Delete tag ref if present.
  const refDel = await gh(token, `/repos/${repo}/git/refs/tags/${tag}`, {
    method: "DELETE",
  });
  if (!refDel.ok && refDel.status !== 404 && refDel.status !== 422) {
    // Don't hard-fail — tag may not exist.
  }
}

async function publishBundle(token, bundle) {
  const version = readVersion(bundle.artifact);
  const tag = `${TAG_PREFIX}${version}`;
  const distDir = locateDistDir(bundle.name);
  if (!distDir) {
    console.log(`[skip] ${bundle.name}: no dist/ directory; run uds-release.sh first`);
    return { name: bundle.name, status: "skipped", reason: "no-dist" };
  }
  const assets = listAssets(distDir, bundle.name, version);
  const tarball = assets.find(
    (a) => a.endsWith(".tar.zst") && !a.endsWith(".sig") && !a.endsWith(".sha256"),
  );
  if (!tarball)
    throw new Error(`${bundle.name}: no tarball found in ${distDir}`);
  const shaFile = `${tarball}.sha256`;
  if (!existsSync(shaFile))
    throw new Error(`${bundle.name}: missing ${shaFile}`);
  const shaLine = readFileSync(shaFile, "utf8").trim();
  const body = buildReleaseBody(bundle, version, basename(tarball), shaLine);

  console.log(`\n=== ${bundle.name} → ${bundle.release_repo}@${tag} ===`);
  console.log(`  dist: ${distDir}`);
  console.log(`  assets: ${assets.length}`);
  for (const a of assets) console.log(`    - ${basename(a)}`);

  if (DRY_RUN) {
    return { name: bundle.name, status: "dry-run", tag, assets: assets.length };
  }

  await deleteExistingRelease(token, bundle.release_repo, tag);

  const repoInfo = await (await gh(token, `/repos/${bundle.release_repo}`)).json();
  const createR = await gh(token, `/repos/${bundle.release_repo}/releases`, {
    method: "POST",
    body: JSON.stringify({
      tag_name: tag,
      target_commitish: repoInfo.default_branch || "main",
      name: `${bundle.name} ${tag}`,
      body,
      draft: false,
      prerelease: false,
      generate_release_notes: false,
    }),
  });
  if (!createR.ok) {
    throw new Error(
      `create release ${tag}: ${createR.status} ${await createR.text()}`,
    );
  }
  const release = await createR.json();
  const uploadBase = release.upload_url.replace(/\{.*$/, "");

  for (const a of assets) {
    const ext = extname(a);
    const ct = CONTENT_TYPE[ext] || "application/octet-stream";
    const bytes = readFileSync(a);
    const up = await fetch(`${uploadBase}?name=${encodeURIComponent(basename(a))}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "szl-holdings-uds-publisher",
        "Content-Type": ct,
        "Content-Length": String(bytes.length),
      },
      body: bytes,
    });
    if (!up.ok) {
      throw new Error(
        `upload ${basename(a)} → ${bundle.release_repo}: ${up.status} ${await up.text()}`,
      );
    }
    console.log(`  ✓ uploaded ${basename(a)} (${bytes.length}b, ${ct})`);
  }

  return {
    name: bundle.name,
    status: "ok",
    tag,
    html_url: release.html_url,
    assets: assets.length,
  };
}

async function main() {
  const want = process.argv.slice(2);
  const bundles = want.length
    ? MANIFEST.bundles.filter((b) => want.includes(b.name))
    : MANIFEST.bundles;
  if (!bundles.length) {
    console.error("No matching bundles");
    process.exit(2);
  }
  const token = DRY_RUN ? "dry-run" : await getGithubToken();
  const results = [];
  for (const b of bundles) {
    try {
      results.push(await publishBundle(token, b));
    } catch (e) {
      console.error(`[FAIL] ${b.name}: ${e.message}`);
      results.push({ name: b.name, status: "failed", error: e.message });
    }
  }
  console.log("\n=== summary ===");
  for (const r of results) {
    const extra = r.html_url ? ` ${r.html_url}` : r.error ? ` (${r.error})` : "";
    console.log(`  ${r.status.padEnd(8)} ${r.name}${extra}`);
  }
  if (results.some((r) => r.status === "failed")) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
