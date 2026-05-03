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

// ─── A11OY Capability Fabric harvest (Task #3553) ─────────────────────────
// Cross-classifies starred repos against the 15 unified AI capability domains
// so the Capability Fabric registry can surface "external patterns informing
// each capability" as part of the governed knowledge layer.

const CAPABILITY_FABRIC_TAXONOMY: Record<
  string,
  { slug: string; description: string; keywords: string[] }
> = {
  presentation: {
    slug: 'presentation',
    description: 'Slide decks, pitch decks, presentation generation, narrative arcs.',
    keywords: ['slide', 'deck', 'presentation', 'pptx', 'keynote', 'storyboard', 'reveal'],
  },
  chatbots: {
    slug: 'chatbots',
    description: 'Conversational chat UIs, multi-turn assistants.',
    keywords: ['chatbot', 'chat-ui', 'conversation', 'assistant', 'dialogue', 'rasa'],
  },
  email: {
    slug: 'email',
    description: 'Email composition, triage, summarization.',
    keywords: ['email', 'inbox', 'imap', 'smtp', 'mailbox', 'newsletter'],
  },
  code: {
    slug: 'code',
    description: 'Code generation, refactoring, code review tooling.',
    keywords: ['code-gen', 'codegen', 'copilot', 'refactor', 'codemod', 'lsp', 'tree-sitter'],
  },
  spreadsheet: {
    slug: 'spreadsheet',
    description: 'Spreadsheet engines, formula libraries, CSV reasoning.',
    keywords: ['spreadsheet', 'csv', 'excel', 'pivot', 'formula', 'xlsx', 'sheet'],
  },
  image_generation: {
    slug: 'image-generation',
    description: 'Diffusion, GAN, image generation pipelines.',
    keywords: ['stable-diffusion', 'diffusion', 'gan', 'image-gen', 'comfyui', 'sdxl', 'flux'],
  },
  workflow_automation: {
    slug: 'workflow-automation',
    description: 'Workflow orchestrators, integration glue, n8n-style.',
    keywords: ['workflow', 'orchestrat', 'n8n', 'temporal', 'airflow', 'prefect', 'dagster'],
  },
  graphic_design: {
    slug: 'graphic-design',
    description: 'Layout, design tokens, brand systems.',
    keywords: ['design-system', 'figma', 'token', 'brand', 'layout', 'svg-icon'],
  },
  scheduling: {
    slug: 'scheduling',
    description: 'Calendar, scheduling, time-finding libraries.',
    keywords: ['calendar', 'schedul', 'caldav', 'ical', 'cron', 'time-zone'],
  },
  writing: {
    slug: 'writing',
    description: 'Long-form writing assistants, editors, grammar.',
    keywords: ['writing', 'grammar', 'editor', 'prose', 'markdown', 'mdx'],
  },
  meeting_notes: {
    slug: 'meeting-notes',
    description: 'Transcription, meeting summarization, minutes.',
    keywords: ['transcrib', 'whisper', 'meeting', 'minutes', 'speech-to-text', 'stt'],
  },
  video_generation: {
    slug: 'video-generation',
    description: 'Video synthesis, animation, motion generation.',
    keywords: ['video-gen', 'animation', 'motion', 'remotion', 'manim', 'ffmpeg'],
  },
  knowledge_management: {
    slug: 'knowledge-management',
    description: 'KB engines, wiki tooling, embedding-based memory.',
    keywords: ['wiki', 'knowledge-base', 'kb', 'notion', 'obsidian', 'vector-store', 'rag'],
  },
  data_visualization: {
    slug: 'data-visualization',
    description: 'Charts, dashboards, plotting libraries.',
    keywords: ['chart', 'visualization', 'dashboard', 'recharts', 'd3', 'plot', 'observable'],
  },
  general_intelligence: {
    slug: 'general-intelligence',
    description: 'Foundation-model SDKs, reasoning frameworks, agent runtimes.',
    keywords: ['agent', 'llm', 'reasoning', 'autogen', 'crewai', 'langgraph', 'foundation'],
  },
};

interface CapabilityClassification {
  capabilityDomain: string;
  confidence: number;
  matchedKeywords: string[];
}

function classifyRepoForCapabilityFabric(repo: StarredRepo): CapabilityClassification[] {
  const text = [repo.name, repo.description || '', (repo.topics || []).join(' ')]
    .join(' ')
    .toLowerCase();
  const results: CapabilityClassification[] = [];
  for (const [domain, { keywords }] of Object.entries(CAPABILITY_FABRIC_TAXONOMY)) {
    const matched = keywords.filter((k) => text.includes(k));
    if (matched.length > 0) {
      const confidence = Math.min(1, matched.length / Math.max(1, keywords.length * 0.3));
      results.push({ capabilityDomain: domain, confidence, matchedKeywords: matched });
    }
  }
  results.sort((a, b) => b.confidence - a.confidence);
  return results;
}

function generateCapabilityFabricReport(repos: StarredRepo[]): string {
  const now = new Date().toISOString().split('T')[0];
  const byDomain: Record<string, Array<{ repo: StarredRepo; confidence: number; matched: string[] }>> = {};
  for (const domain of Object.keys(CAPABILITY_FABRIC_TAXONOMY)) byDomain[domain] = [];

  let classifiedCount = 0;
  for (const repo of repos) {
    const matches = classifyRepoForCapabilityFabric(repo);
    if (matches.length === 0) continue;
    classifiedCount += 1;
    for (const m of matches) {
      byDomain[m.capabilityDomain].push({
        repo,
        confidence: m.confidence,
        matched: m.matchedKeywords,
      });
    }
  }

  let md = `# A11OY Capability Fabric — GitHub Knowledge Harvest\n\n`;
  md += `**Generated:** ${now}  \n`;
  md += `**Source repos scanned:** ${repos.length}  \n`;
  md += `**Repos classified into capability fabric:** ${classifiedCount}  \n\n`;
  md += `This report cross-classifies starred repositories against the 15 governed AI capability domains in the A11OY Capability Fabric (Task #3553). Each domain shows external patterns and reference implementations that inform the corresponding Nuro Mesh agent.\n\n`;
  md += `---\n\n`;

  for (const [domain, { description }] of Object.entries(CAPABILITY_FABRIC_TAXONOMY)) {
    const matches = byDomain[domain].sort((a, b) => b.confidence - a.confidence).slice(0, 10);
    md += `## ${domain}\n\n`;
    md += `${description}\n\n`;
    md += `**Reference repos (${byDomain[domain].length} total, top 10 shown):**\n\n`;
    if (matches.length === 0) {
      md += `_No reference repos in current export._\n\n`;
      continue;
    }
    md += `| Repo | Stars | Confidence | Matched signals |\n`;
    md += `|------|-------|------------|------------------|\n`;
    for (const { repo, confidence, matched } of matches) {
      md += `| [${repo.full_name}](${repo.html_url}) | ${repo.stargazers_count.toLocaleString()} | ${(confidence * 100).toFixed(0)}% | ${matched.join(', ')} |\n`;
    }
    md += `\n`;
  }

  return md;
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

  // A11OY Capability Fabric harvest (Task #3553)
  const fabricPath = path.join(OUTPUT_DIR, 'capability-fabric-harvest.md');
  fs.writeFileSync(fabricPath, generateCapabilityFabricReport(repos));
}

main();
