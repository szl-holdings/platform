#!/usr/bin/env node
// Generate release notes for a UDS bundle tag.
//
// Reads scripts/release/uds-version-sync.json for the bundle list. Each
// bundle's release_repo (e.g. "szl-holdings/a11oy") + the manifest's
// release_tag_prefix (e.g. "uds-v") + the bundle version drive the public
// release URL. The script walks dist/<name>/ for each produced tarball,
// reads the sha256 sidecar inline, and emits markdown release notes
// containing the per-product URL + concrete sha256 + per-bundle key verify
// command for every bundle.
//
// Usage:
//   node scripts/release/uds-release-notes.mjs [<tag>]
//
// <tag> is optional — when omitted, each bundle gets its own per-product
// tag (`${release_tag_prefix}${version}`). When supplied, every bundle's
// URL uses that tag (legacy combined-release behaviour).
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const OVERRIDE_TAG = process.argv[2] ?? null;

const manifest = JSON.parse(
  readFileSync(join(__dirname, "uds-version-sync.json"), "utf8"),
);
// release_repo is fully qualified (e.g. "szl-holdings/a11oy"), so the
// release base is always https://github.com — the manifest's
// release_base_url is kept only as a hint for the org landing page.
const RELEASE_BASE = "https://github.com";
const TAG_PREFIX = manifest.release_tag_prefix ?? "uds-v";

function readVersion(artifactRel) {
  const p = join(REPO_ROOT, artifactRel, "package.json");
  if (!existsSync(p)) return "unknown";
  try {
    return JSON.parse(readFileSync(p, "utf8")).version ?? "unknown";
  } catch {
    return "unknown";
  }
}

function listArtifacts(name) {
  const out = [];
  for (const root of [
    join(REPO_ROOT, "dist", name),
    join(REPO_ROOT, "dist", `${name}-fallback`),
  ]) {
    if (!existsSync(root)) continue;
    for (const f of readdirSync(root)) {
      const full = join(root, f);
      if (!statSync(full).isFile()) continue;
      out.push({ root: root.replace(REPO_ROOT + "/", ""), name: f, full });
    }
  }
  return out;
}

function readSha256(shaFile) {
  if (!existsSync(shaFile)) return null;
  const first = readFileSync(shaFile, "utf8").split("\n")[0] || "";
  const hex = first.trim().split(/\s+/)[0];
  return /^[0-9a-f]{64}$/i.test(hex) ? hex : null;
}

function bundleReleaseUrl(bundle, version, asset) {
  if (!bundle.release_repo) {
    throw new Error(
      `bundle ${bundle.name} is missing release_repo in uds-version-sync.json`,
    );
  }
  const tag = OVERRIDE_TAG ?? `${TAG_PREFIX}${version}`;
  return `${RELEASE_BASE}/${bundle.release_repo}/releases/download/${tag}/${asset}`;
}

function bundlePubKeyName(bundle) {
  // Convention enforced by every artifact's build.sh: dev key ships as
  // <bundle-name>-dev.pub on the matching product release.
  return `${bundle.name}-dev.pub`;
}

const lines = [];
const headerTag = OVERRIDE_TAG ?? "(per-product)";
lines.push(`# SZL UDS Bundle Release — ${headerTag}`);
lines.push("");
lines.push(
  "Signed Zarf payloads for the SZL Holdings platform, ready for " +
    "Defense-Unicorns clusters. Each bundle is released independently on " +
    "its own product repo under the `szl-holdings` org, sha256-pinned " +
    "(always), and cosign-signed when the release-line key is configured.",
);
lines.push("");
lines.push("## Verify any bundle in four commands");
lines.push("");
lines.push("```bash");
lines.push("# Pick a product: a11oy | sentra | amaru | rosie | vessels");
lines.push("PRODUCT=<product>; BUNDLE=${PRODUCT}-uds");
lines.push("TAG=<see-table-below>; VERSION=<see-table-below>");
lines.push("BASE=https://github.com/szl-holdings/${PRODUCT}/releases/download/${TAG}");
lines.push("curl -fsSLO ${BASE}/${BUNDLE}-${VERSION}.tar.zst");
lines.push("curl -fsSLO ${BASE}/${BUNDLE}-${VERSION}.tar.zst.sha256");
lines.push("curl -fsSLO ${BASE}/${BUNDLE}-${VERSION}.tar.zst.sig");
lines.push("curl -fsSLO ${BASE}/${BUNDLE}-dev.pub");
lines.push("sha256sum -c ${BUNDLE}-${VERSION}.tar.zst.sha256 && \\");
lines.push("  cosign verify-blob --key ${BUNDLE}-dev.pub \\");
lines.push("    --signature ${BUNDLE}-${VERSION}.tar.zst.sig \\");
lines.push("    ${BUNDLE}-${VERSION}.tar.zst");
lines.push("```");
lines.push("");
lines.push("## Bundles");
lines.push("");

for (const b of manifest.bundles) {
  const version = readVersion(b.artifact);
  const files = listArtifacts(b.name);
  const tar = files.find((f) => f.name.endsWith(".tar.zst"));
  const shaFile = tar
    ? files.find((f) => f.name === `${tar.name}.sha256`)
    : null;
  const sigFile = tar
    ? files.find((f) => f.name === `${tar.name}.sig`)
    : null;
  const sha = shaFile ? readSha256(shaFile.full) : null;
  const tag = OVERRIDE_TAG ?? `${TAG_PREFIX}${version}`;

  lines.push(`### \`${b.name}\` @ v${version}`);
  lines.push("");
  lines.push(`- **Repo**: [\`${b.release_repo}\`](${RELEASE_BASE}/${b.release_repo})`);
  lines.push(`- **Tag**: \`${tag}\``);
  lines.push(`- **Doctrine**: ${b.doctrine}`);
  lines.push(`- **Headline**: ${b.headline}`);
  if (tar) {
    lines.push(`- **Public URL**: ${bundleReleaseUrl(b, version, tar.name)}`);
    lines.push(`- **sha256**: \`${sha ?? "MISSING"}\``);
    if (sigFile) {
      lines.push(
        `- **Signature**: ${bundleReleaseUrl(b, version, sigFile.name)} (cosign)`,
      );
      lines.push(
        `- **Public key**: ${bundleReleaseUrl(b, version, bundlePubKeyName(b))}`,
      );
    } else {
      lines.push("- **Signature**: _(sha256-only release — see Security)_");
    }
    lines.push("");
    lines.push("```bash");
    lines.push(`# always available`);
    lines.push(`sha256sum -c ${tar.name}.sha256`);
    if (sigFile) {
      lines.push(`# cosign — verify against the per-bundle dev key`);
      lines.push(
        `cosign verify-blob --key ${bundlePubKeyName(b)} --signature ${sigFile.name} ${tar.name}`,
      );
    }
    lines.push("```");
  } else {
    lines.push("- **Public URL**: _(no tarball produced — see CI logs)_");
  }
  lines.push("");
}

lines.push("## Pull guide");
lines.push("");
lines.push(
  "See [`docs/proposals/defense-unicorns/uds-pull-guide.md`]" +
    "(https://github.com/szl-holdings/platform/blob/main/docs/proposals/" +
    "defense-unicorns/uds-pull-guide.md) for the full operator " +
    "download → verify → deploy flow per bundle.",
);
lines.push("");
lines.push("## Reproducing what we shipped");
lines.push("");
lines.push(
  "Run `bash artifacts/<product>-uds/scripts/build.sh` against this tag's " +
    "tree with `zarf` and `cosign` on `PATH` and a `COSIGN_KEY=` env var " +
    "set. The build is deterministic (sorted, owner=0, fixed mtime); the " +
    "produced tarball's sha256 should equal the asset's `.sha256` sidecar.",
);

process.stdout.write(lines.join("\n") + "\n");
