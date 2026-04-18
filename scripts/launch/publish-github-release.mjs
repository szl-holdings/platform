#!/usr/bin/env node
// Publishes the v1.0-standby GitHub release for Wave 3 launch.
// Uses the Replit GitHub connector for OAuth (no PAT required).

const OWNER = "stephenlutar2-hash";
const REPO = "szl-holdings-platform";
const TAG = "v1.0-standby";
const TARGET = "main";

async function getGithubToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
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
  const settings = (j.items && j.items[0] && j.items[0].settings) || {};
  const token =
    settings.access_token ||
    (settings.oauth && settings.oauth.credentials && settings.oauth.credentials.access_token);
  if (!token) throw new Error("No GitHub access token in connector settings");
  return token;
}

async function gh(token, path, init = {}) {
  const r = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "szl-holdings-launch",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers || {}),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  return r;
}

const RELEASE_BODY = `# SZL Holdings Platform — v1.0-standby

Wave 3 launch standby release. Public, source-available reference snapshot of the SZL Holdings governed AI platform at the moment of the SZL Command newsletter launch.

## Platform status at this tag

- 10 deployed artifacts (Aegis, Vessels, Terra, Pulse, Command, SZL Holdings web + mobile, Carlota Jo, API Server, NEXUS mockup sandbox)
- 700+ database tables across the platform schema
- 11-role RBAC with row-level security policies
- 9 schema-validated AI decision types (governed via Covenant Policy)
- Six load-bearing platform primitives:
  1. Outcome Graph
  2. Proof Chain
  3. Covenant Policy
  4. Decision Simulation
  5. Workflow Engine
  6. Event Fabric

## What ships in v1.0-standby

- Full source for the Aegis, Vessels, Terra, Pulse, Command, and SZL Holdings web + mobile artifacts
- Shared API server with the governed decision pipeline, Distribution OS publishing routes, and analytics endpoints
- Shared UI library (\`lib/shared-ui\`) including the \`NewsletterSubscribe\` module deployed across portfolio sites
- SZL Command analytics dashboard at \`/szl-holdings/command-newsletter\`
- Launch Series content packs (\`content/launch-series/\`):
  - Week 1 Operator essays (Thursday / Sunday / Monday)
  - Week 2 Operator essays (six-primitives, trust-layer, platform moat)
  - Medium Week 2 launch pack (Aegis thesis, CORTEX architecture, cross-domain moat)
  - LinkedIn Week 1 short-format adaptations
  - Substack template + social announcement kit (Substack / X thread / LinkedIn)
- Distribution OS auto-publish pipeline at \`artifacts/api-server/src/routes/distribution-os/publishing.ts\`

## Status

This is a **standby** release. The platform is in active operator preview. Production GA is gated on:
- Two design partner deployments completing 30-day governed-decision instrumentation
- Independent third-party security review (in scope: RBAC, Proof Chain immutability, Covenant Policy gating)
- Final SOC2 readiness review

## Links

- Newsletter: https://szlholdings.substack.com
- Public roadmap: https://szlholdings.com/roadmap
- Launch index: \`content/launch-series/README.md\`

— Stephen Lutar
`;

async function main() {
  const token = await getGithubToken();

  // Verify identity
  const userR = await gh(token, "/user");
  const user = await userR.json();
  console.log(`Authenticated as: ${user.login}`);

  // Check repo
  const repoR = await gh(token, `/repos/${OWNER}/${REPO}`);
  if (!repoR.ok) {
    const t = await repoR.text();
    throw new Error(`Repo lookup failed (${repoR.status}): ${t}`);
  }
  const repo = await repoR.json();
  console.log(`Repo: ${repo.full_name} (default_branch: ${repo.default_branch})`);

  // Check if release already exists by tag
  const existingR = await gh(token, `/repos/${OWNER}/${REPO}/releases/tags/${TAG}`);
  let release;
  if (existingR.status === 200) {
    const existing = await existingR.json();
    console.log(`Release ${TAG} already exists (id=${existing.id}). Updating body.`);
    const updateR = await gh(token, `/repos/${OWNER}/${REPO}/releases/${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: "v1.0-standby — Wave 3 Launch Standby",
        body: RELEASE_BODY,
        draft: false,
        prerelease: true,
      }),
    });
    if (!updateR.ok) {
      const t = await updateR.text();
      throw new Error(`Update failed (${updateR.status}): ${t}`);
    }
    release = await updateR.json();
  } else {
    console.log(`Creating release ${TAG}...`);
    const createR = await gh(token, `/repos/${OWNER}/${REPO}/releases`, {
      method: "POST",
      body: JSON.stringify({
        tag_name: TAG,
        target_commitish: repo.default_branch || TARGET,
        name: "v1.0-standby — Wave 3 Launch Standby",
        body: RELEASE_BODY,
        draft: false,
        prerelease: true,
        generate_release_notes: false,
      }),
    });
    if (!createR.ok) {
      const t = await createR.text();
      throw new Error(`Create failed (${createR.status}): ${t}`);
    }
    release = await createR.json();
  }

  console.log("\n=== RELEASE PUBLISHED ===");
  console.log(`URL:        ${release.html_url}`);
  console.log(`API URL:    ${release.url}`);
  console.log(`Tag:        ${release.tag_name}`);
  console.log(`Prerelease: ${release.prerelease}`);
  console.log(`Created:    ${release.created_at}`);
  console.log(`Published:  ${release.published_at}`);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
