#!/usr/bin/env tsx
/**
 * update-topics.ts
 *
 * Updates GitHub repository topics via the GitHub REST API.
 * Requires a GitHub Personal Access Token with `repo` scope.
 *
 * Usage:
 *   GITHUB_TOKEN=<token> npx tsx scripts/github/update-topics.ts
 *
 * Or with explicit owner/repo:
 *   GITHUB_TOKEN=<token> GITHUB_OWNER=stephenlutar2-hash GITHUB_REPO=szl-holdings-platform \
 *     npx tsx scripts/github/update-topics.ts
 *
 * If GITHUB_TOKEN is not set, prints the manual steps instead.
 */

const TOPICS = [
  "szl-holdings",
  "lyte",
  "alloy",
  "business-observability",
  "ai-orchestration",
  "secure-operations",
  "enterprise-platform",
  "typescript",
  "react",
  "azure",
  "vessels",
];

const OWNER = process.env.GITHUB_OWNER ?? "stephenlutar2-hash";
const REPO = process.env.GITHUB_REPO ?? "szl-holdings-platform";
const TOKEN = process.env.GITHUB_TOKEN;

function printManualSteps(): void {
  console.log("GITHUB_TOKEN not set. Manual steps to apply topics:\n");
  console.log(`1. Go to: https://github.com/${OWNER}/${REPO}`);
  console.log("2. Click the gear icon (⚙) next to 'About'");
  console.log("3. In the Topics field, add each topic:");
  console.log("");
  for (const topic of TOPICS) {
    console.log(`   ${topic}`);
  }
  console.log("");
  console.log("4. Click 'Save changes'");
  console.log("");
  console.log("See ops/github/repo-branding-manual-steps.md for details.");
}

async function updateTopics(): Promise<void> {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/topics`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ names: TOPICS }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${error}`);
  }

  const data = (await response.json()) as { names: string[] };
  console.log("✓ Topics updated successfully:");
  for (const topic of data.names) {
    console.log(`  - ${topic}`);
  }
  console.log(`\nVerify at: https://github.com/${OWNER}/${REPO}`);
}

async function main(): Promise<void> {
  console.log("=== GitHub Topics Update ===\n");
  console.log(`Repository: ${OWNER}/${REPO}`);
  console.log(`Topics: ${TOPICS.join(", ")}\n`);

  if (!TOKEN) {
    printManualSteps();
    return;
  }

  await updateTopics();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
