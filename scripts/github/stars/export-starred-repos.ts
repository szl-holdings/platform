#!/usr/bin/env tsx
/**
 * SZL Holdings — Export Starred Repos
 * Exports all starred repositories for a GitHub user to JSON and Markdown.
 *
 * Usage:
 *   npx tsx scripts/github/stars/export-starred-repos.ts [username]
 *
 * Prerequisites:
 *   - GITHUB_TOKEN environment variable (or gh auth token)
 *   - npx tsx (or ts-node) installed
 *
 * If GITHUB_TOKEN is not set, this script will print manual fallback instructions.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || null;
const USERNAME = process.argv[2] || 'stephenlutar2-hash';
const OUTPUT_DIR = path.join(process.cwd(), 'exports', 'github-stars');

interface StarredRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
  pushed_at: string;
  topics: string[];
  owner: {
    login: string;
  };
}

function printManualFallback() {
}

async function fetchAllStarredRepos(): Promise<StarredRepo[]> {
  const repos: StarredRepo[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `https://api.github.com/users/${USERNAME}/starred?per_page=${perPage}&page=${page}`;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          'GitHub API returned 401 — invalid or missing token. Set GITHUB_TOKEN and retry.',
        );
      }
      if (response.status === 403) {
        throw new Error('GitHub API returned 403 — rate limit hit or token lacks required scope.');
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as StarredRepo[];
    if (data.length === 0) break;

    repos.push(...data);

    if (data.length < perPage) break;
    page++;

    // Respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return repos;
}

function generateMarkdownExport(repos: StarredRepo[]): string {
  const now = new Date().toISOString().split('T')[0];
  let md = `# GitHub Stars Export — @${USERNAME}\n\n`;
  md += `**Exported:** ${now}  \n`;
  md += `**Total repos:** ${repos.length}  \n\n`;
  md += `---\n\n`;

  // Group by language
  const byLanguage: Record<string, StarredRepo[]> = {};
  for (const repo of repos) {
    const lang = repo.language || 'Other';
    if (!byLanguage[lang]) byLanguage[lang] = [];
    byLanguage[lang].push(repo);
  }

  const sortedLanguages = Object.keys(byLanguage).sort(
    (a, b) => byLanguage[b].length - byLanguage[a].length,
  );

  for (const lang of sortedLanguages) {
    md += `## ${lang} (${byLanguage[lang].length})\n\n`;
    for (const repo of byLanguage[lang]) {
      const lastPush = repo.pushed_at ? repo.pushed_at.split('T')[0] : 'unknown';
      md += `### [${repo.full_name}](${repo.html_url})\n\n`;
      if (repo.description) {
        md += `${repo.description}\n\n`;
      }
      md += `- Stars: ${repo.stargazers_count.toLocaleString()} | Last push: ${lastPush}\n`;
      if (repo.topics.length > 0) {
        md += `- Topics: ${repo.topics.join(', ')}\n`;
      }
      md += '\n';
    }
    md += '---\n\n';
  }

  return md;
}

async function main() {

  if (!GITHUB_TOKEN) {
  }

  let repos: StarredRepo[];

  try {
    repos = await fetchAllStarredRepos();
  } catch (error) {
    const _msg = error instanceof Error ? error.message : String(error);
    printManualFallback();
    process.exit(1);
  }

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Write JSON
  const jsonPath = path.join(OUTPUT_DIR, 'starred-repos.json');
  fs.writeFileSync(jsonPath, JSON.stringify(repos, null, 2));

  // Write Markdown
  const markdown = generateMarkdownExport(repos);
  const mdPath = path.join(OUTPUT_DIR, 'starred-repos.md');
  fs.writeFileSync(mdPath, markdown);

  // Write summary
  const summaryPath = path.join(OUTPUT_DIR, 'export-summary.md');
  const languages = [...new Set(repos.map((r) => r.language || 'Other'))];
  const summary =
    `# Stars Export Summary\n\n` +
    `**Date:** ${new Date().toISOString().split('T')[0]}\n` +
    `**User:** @${USERNAME}\n` +
    `**Total:** ${repos.length}\n\n` +
    `## Languages\n\n` +
    languages.map((l) => `- ${l}`).join('\n') +
    '\n\n' +
    `## Files\n\n` +
    `- \`starred-repos.json\` — Full repo data\n` +
    `- \`starred-repos.md\` — Readable report\n` +
    `- \`export-summary.md\` — This file\n`;
  fs.writeFileSync(summaryPath, summary);
}

main().catch((_err) => {
  process.exit(1);
});
