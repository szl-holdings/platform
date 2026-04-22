#!/usr/bin/env tsx
/**
 * SZL Holdings — Generate Category Report
 * Reads an exported starred repos JSON file and generates category-organized
 * Markdown reports using the SZL taxonomy (8 canonical lists).
 *
 * Usage:
 *   npx tsx scripts/github/stars/generate-category-report.ts [input.json]
 *
 * Input: JSON export from export-starred-repos.ts, or manually constructed JSON.
 * Output: One Markdown report per category in exports/github-stars/reports/
 *
 * If no input file is found, prints manual fallback instructions.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const INPUT_FILE =
  process.argv[2] || path.join(process.cwd(), 'exports', 'github-stars', 'starred-repos.json');

const OUTPUT_DIR = path.join(process.cwd(), 'exports', 'github-stars', 'reports');

interface StarredRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  topics: string[];
}

// Taxonomy: each list has keyword hints for auto-classification
const TAXONOMY: Record<string, { slug: string; description: string; keywords: string[] }> = {
  'Design/UI': {
    slug: 'design-ui',
    description: 'Visual systems, component libraries, animation, design tokens',
    keywords: [
      'design',
      'ui',
      'ux',
      'animation',
      'motion',
      'css',
      'token',
      'theme',
      'figma',
      'storybook',
      'tailwind',
      'styled',
      'framer',
      'shadcn',
      'radix',
      'headless',
    ],
  },
  'AI/Agents/RAG': {
    slug: 'ai-agents-rag',
    description: 'LLM orchestration, agent frameworks, retrieval systems',
    keywords: [
      'llm',
      'ai',
      'agent',
      'rag',
      'retrieval',
      'embedding',
      'vector',
      'langchain',
      'openai',
      'anthropic',
      'gpt',
      'claude',
      'llama',
      'transformer',
      'ml',
      'nlp',
    ],
  },
  Observability: {
    slug: 'observability',
    description: 'Logging, tracing, metrics, APM tools',
    keywords: [
      'observability',
      'logging',
      'tracing',
      'metrics',
      'monitoring',
      'telemetry',
      'otel',
      'opentelemetry',
      'prometheus',
      'grafana',
      'jaeger',
      'apm',
      'trace',
      'log',
    ],
  },
  'Security/Trust': {
    slug: 'security-trust',
    description: 'Auth, RBAC, secrets, compliance, audit patterns',
    keywords: [
      'security',
      'auth',
      'authentication',
      'authorization',
      'rbac',
      'oauth',
      'jwt',
      'secrets',
      'vault',
      'opa',
      'casbin',
      'policy',
      'compliance',
      'audit',
      'zero-trust',
    ],
  },
  'Infra/DevOps': {
    slug: 'infra-devops',
    description: 'CI/CD, deployment, infrastructure-as-code',
    keywords: [
      'infrastructure',
      'devops',
      'ci',
      'cd',
      'terraform',
      'pulumi',
      'docker',
      'kubernetes',
      'k8s',
      'deployment',
      'pipeline',
      'ansible',
      'helm',
      'azure',
      'iac',
    ],
  },
  'Docs/README': {
    slug: 'docs-readme',
    description: 'Documentation excellence, README patterns',
    keywords: [
      'docs',
      'documentation',
      'readme',
      'wiki',
      'changelog',
      'adr',
      'docusaurus',
      'starlight',
      'mdx',
      'writing',
      'guide',
    ],
  },
  'Component Libraries': {
    slug: 'component-libraries',
    description: 'Shared UI component systems, headless components',
    keywords: [
      'component',
      'library',
      'headless',
      'primitives',
      'react-native',
      'expo',
      'components',
      'ui-kit',
      'design-system',
    ],
  },
  'Competitive/Reference': {
    slug: 'competitive-reference',
    description: 'Direct competitors, category leaders, reference implementations',
    keywords: [
      'platform',
      'saas',
      'dashboard',
      'analytics',
      'observability-platform',
      'fleet',
      'maritime',
      'real-estate',
      'intelligence',
      'command',
      'soc',
    ],
  },
};

function classifyRepo(repo: StarredRepo): string {
  const text = [repo.name, repo.description || '', (repo.topics || []).join(' ')]
    .join(' ')
    .toLowerCase();

  for (const [category, { keywords }] of Object.entries(TAXONOMY)) {
    if (keywords.some((k) => text.includes(k))) {
      return category;
    }
  }

  return 'Uncategorized';
}

function generateCategoryReport(category: string, repos: StarredRepo[]): string {
  const { description } = TAXONOMY[category] || { description: 'Miscellaneous' };
  const now = new Date().toISOString().split('T')[0];

  let md = `# ${category} — Stars Report\n\n`;
  md += `**Category:** ${category}  \n`;
  md += `**Description:** ${description}  \n`;
  md += `**Repos:** ${repos.length}  \n`;
  md += `**Generated:** ${now}  \n\n`;
  md += `---\n\n`;

  if (repos.length === 0) {
    md += `*No repos classified into this category from the current export.*\n\n`;
    md += `See \`list-taxonomy.md\` for inclusion criteria and research directions.\n`;
    return md;
  }

  // Sort by last push date (most recent first)
  const sorted = [...repos].sort(
    (a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime(),
  );

  for (const repo of sorted) {
    const lastPush = repo.pushed_at ? repo.pushed_at.split('T')[0] : 'unknown';
    const stale = new Date(repo.pushed_at) < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    md += `### [${repo.full_name}](${repo.html_url})${stale ? ' ⚠️ STALE' : ''}\n\n`;
    if (repo.description) {
      md += `${repo.description}\n\n`;
    }
    md += `| Field | Value |\n`;
    md += `|-------|-------|\n`;
    md += `| Language | ${repo.language || '—'} |\n`;
    md += `| Stars | ${repo.stargazers_count.toLocaleString()} |\n`;
    md += `| Last push | ${lastPush}${stale ? ' (**stale — review for removal**)' : ''} |\n`;
    if (repo.topics && repo.topics.length > 0) {
      md += `| Topics | ${repo.topics.join(', ')} |\n`;
    }
    md += '\n';
  }

  if (
    repos.filter((r) => new Date(r.pushed_at) < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
      .length > 0
  ) {
    md += `---\n\n`;
    md += `> ⚠️ Stale repos (last push > 12 months ago) are marked above. Review during monthly pass.\n`;
  }

  return md;
}

function printManualFallback() {
}

function main() {

  if (!fs.existsSync(INPUT_FILE)) {
    printManualFallback();
    process.exit(1);
  }
  const raw = fs.readFileSync(INPUT_FILE, 'utf-8');
  let repos: StarredRepo[];

  try {
    repos = JSON.parse(raw);
  } catch {
    process.exit(1);
  }

  // Classify
  const classified: Record<string, StarredRepo[]> = {};
  for (const category of [...Object.keys(TAXONOMY), 'Uncategorized']) {
    classified[category] = [];
  }

  for (const repo of repos) {
    const category = classifyRepo(repo);
    classified[category].push(repo);
  }

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Generate reports
  const summary: string[] = [];
  for (const [category, categoryRepos] of Object.entries(classified)) {
    const { slug } = TAXONOMY[category] || { slug: 'uncategorized' };
    const report = generateCategoryReport(category, categoryRepos);
    const outPath = path.join(OUTPUT_DIR, `${slug}.md`);
    fs.writeFileSync(outPath, report);
    summary.push(`| ${category} | ${categoryRepos.length} |`);
  }

  // Combined report
  const combinedPath = path.join(OUTPUT_DIR, 'all-categories.md');
  const allMd =
    `# Stars by Category — All Lists\n\n` +
    `**Generated:** ${new Date().toISOString().split('T')[0]}\n\n` +
    `| Category | Count |\n|----------|-------|\n` +
    summary.join('\n') +
    '\n\n---\n\n' +
    Object.entries(classified)
      .map(([cat, r]) => generateCategoryReport(cat, r))
      .join('\n---\n\n');
  fs.writeFileSync(combinedPath, allMd);
}

main();
