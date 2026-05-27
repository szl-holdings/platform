#!/usr/bin/env node
// Generate release notes for an szl-v* tag.
//
// Reads scripts/release/uds-version-sync.json for the bundle list, walks
// dist/<name>/ for each produced tarball, reads the sha256 sidecar contents
// inline, and emits markdown release notes containing the public release
// URL + concrete sha256 + verify command for every bundle.
//
// Usage:
//   node scripts/release/uds-release-notes.mjs <tag>
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const TAG = process.argv[2] ?? "szl-vUNKNOWN";

const manifest = JSON.parse(
  readFileSync(join(__dirname, "uds-version-sync.json"), "utf8"),
);
const RELEASE_BASE = (manifest.release_base_url ?? "").replace(/\/+$/, "");

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
  // `sha256sum` output: "<hex>  <filename>"
  const first = readFileSync(shaFile, "utf8").split("\n")[0] || "";
  const hex = first.trim().split(/\s+/)[0];
  return /^[0-9a-f]{64}$/i.test(hex) ? hex : null;
}

const lines = [];
lines.push(`# SZL UDS Bundle Release — ${TAG}`);
lines.push("");
lines.push(
  "Signed Zarf payloads for the SZL Holdings platform, ready for " +
    "Defense-Unicorns clusters. Every bundle is independently buildable, " +
    "sha256-pinned (always), and cosign-signed when a release-line key is " +
    "configured.",
);
lines.push("");
lines.push("## Verify in three commands");
lines.push("");
lines.push("```bash");
lines.push("TAG=" + TAG);
lines.push("BUNDLE=<a11oy-uds|sentra-uds|amaru-uds|rosie-uds>");
lines.push("VERSION=<see-table-below>");
lines.push("curl -fSL -O " + RELEASE_BASE + "/$TAG/$BUNDLE-$VERSION.tar.zst");
lines.push("curl -fSL -O " + RELEASE_BASE + "/$TAG/$BUNDLE-$VERSION.tar.zst.sha256");
lines.push("sha256sum -c $BUNDLE-$VERSION.tar.zst.sha256");
lines.push("```");
lines.push("");
lines.push("## Bundles");
lines.push("");

for (const b of manifest.bundles) {
  const version = readVersion(b.artifact);
  const files = listArtifacts(b.name);
  const tar = files.find((f) => f.name.endsWith(".tar.zst"));
  const shaFile = tar ? files.find((f) => f.name === `${tar.name}.sha256`) : null;
  const sigFile = tar ? files.find((f) => f.name === `${tar.name}.sig`) : null;
  const sha = shaFile ? readSha256(shaFile.full) : null;

  lines.push(`### \`${b.name}\` @ v${version}`);
  lines.push("");
  lines.push(`- **Doctrine**: ${b.doctrine}`);
  lines.push(`- **Headline**: ${b.headline}`);
  if (tar) {
    lines.push(
      `- **Public URL**: ${RELEASE_BASE}/${TAG}/${tar.name}`,
    );
    lines.push(`- **sha256**: \`${sha ?? "MISSING"}\``);
    if (sigFile) {
      lines.push(
        `- **Signature**: ${RELEASE_BASE}/${TAG}/${sigFile.name} (cosign)`,
      );
    } else {
      lines.push("- **Signature**: _(sha256-only release — see Security)_");
    }
    lines.push("");
    lines.push("```bash");
    lines.push(`# always available`);
    lines.push(`sha256sum -c ${tar.name}.sha256`);
    if (sigFile) {
      lines.push(`# cosign — verify against szl-cosign.pub published with this release`);
      lines.push(
        `cosign verify-blob --key szl-cosign.pub --signature ${sigFile.name} ${tar.name}`,
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
  "See [`docs/proposals/defense-unicorns/uds-pull-guide.md`](" +
    "https://github.com/szl-holdings/szl-holdings-platform/blob/" +
    TAG +
    "/docs/proposals/defense-unicorns/uds-pull-guide.md) for the full operator " +
    "download → verify → deploy flow per bundle.",
);
lines.push("");
lines.push("## Reproducing what we shipped");
lines.push("");
lines.push(
  "Run `pnpm run test:uds-release` against this tag's tree. The build is " +
    "deterministic (sorted, owner=0, fixed mtime); the produced tarballs " +
    "should byte-compare equal to the assets attached here.",
);

process.stdout.write(lines.join("\n") + "\n");
