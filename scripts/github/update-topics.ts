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
  'szl-holdings',
  'lyte',
  'alloy',
  'business-observability',
  'ai-orchestration',
  'secure-operations',
  'enterprise-platform',
  'typescript',
  'react',
  'azure',
  'vessels',
];

const OWNER = process.env.GITHUB_OWNER ?? 'stephenlutar2-hash';
const REPO = process.env.GITHUB_REPO ?? 'szl-holdings-platform';
const TOKEN = process.env.GITHUB_TOKEN;

function printManualSteps(): void {
  for (const _topic of TOPICS) {
  }
}

async function updateTopics(): Promise<void> {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/topics`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ names: TOPICS }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${error}`);
  }

  const data = (await response.json()) as { names: string[] };
  for (const _topic of data.names) {
  }
}

async function main(): Promise<void> {

  if (!TOKEN) {
    printManualSteps();
    return;
  }

  await updateTopics();
}

main().catch((_err) => {
  process.exit(1);
});
