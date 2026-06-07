#!/usr/bin/env tsx
/**
 * SZL Holdings — Scaffold List Taxonomy
 *
 * PURPOSE: Print the 8 canonical SZL Holdings GitHub List definitions and
 * provide step-by-step instructions for creating them in the GitHub web UI.
 *
 * IMPORTANT: GitHub Lists (formerly "Stars Lists") are NOT available via the
 * stable GitHub REST API or GraphQL API. List creation requires the GitHub web
 * UI at github.com/[username]?tab=stars. This script does NOT create lists
 * programmatically — it is a guided setup tool that validates your token and
 * outputs the exact list names and descriptions to use during manual setup.
 *
 * Usage:
 *   npx tsx scripts/github/stars/scaffold-list-taxonomy.ts [username]
 *
 * What this script does:
 *   1. Prints all 8 canonical list definitions (name, slug, description)
 *   2. Validates GITHUB_TOKEN if present (confirms auth is working for other ops)
 *   3. Prints step-by-step instructions for creating lists in GitHub web UI
 *
 * What this script does NOT do:
 *   - Create lists programmatically (not supported by GitHub API)
 *   - Modify any existing repos or stars
 *
 * After creating lists manually, use generate-category-report.ts to classify
 * your existing starred repos into the taxonomy.
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || null;
const _USERNAME = process.argv[2] || 'stephenlutar2-hash';

// The 8 canonical SZL Holdings star lists
const CANONICAL_LISTS = [
  {
    name: 'Design/UI',
    slug: 'design-ui',
    description:
      'Visual systems, component libraries, animation, design tokens, and UI engineering references.',
  },
  {
    name: 'AI/Agents/RAG',
    slug: 'ai-agents-rag',
    description:
      'LLM orchestration, agent frameworks, retrieval-augmented generation, and AI workflow primitives.',
  },
  {
    name: 'Observability',
    slug: 'observability',
    description: 'Logging, distributed tracing, metrics, APM, and business observability patterns.',
  },
  {
    name: 'Security/Trust',
    slug: 'security-trust',
    description:
      'Authentication, RBAC, secrets management, compliance patterns, and zero-trust architecture.',
  },
  {
    name: 'Infra/DevOps',
    slug: 'infra-devops',
    description:
      'CI/CD pipelines, infrastructure-as-code, deployment architectures, and platform engineering.',
  },
  {
    name: 'Docs/README',
    slug: 'docs-readme',
    description:
      'Documentation excellence — README patterns, API docs, ADRs, changelogs, and docs-as-code.',
  },
  {
    name: 'Component Libraries',
    slug: 'component-libraries',
    description:
      'Headless UI components, accessible primitives, React component systems, and design system implementations.',
  },
  {
    name: 'Competitive/Reference',
    slug: 'competitive-reference',
    description:
      'Direct competitors, category leaders, and reference implementations across SZL product domains.',
  },
];

function printManualInstructions() {

  for (const _list of CANONICAL_LISTS) {
  }
}

async function checkListsApi(): Promise<boolean> {
  // GitHub Lists API is not publicly documented as a stable v3/v4 API.
  // We detect capability by attempting to access the starred lists endpoint.
  if (!GITHUB_TOKEN) return false;

  try {
    const res = await fetch(`https://api.github.com/user/starred`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  for (const _list of CANONICAL_LISTS) {
  }

  if (!GITHUB_TOKEN) {
    printManualInstructions();
    process.exit(0);
  }

  // GitHub Lists (beta) — the API for creating lists programmatically
  // is not part of the stable GitHub REST API. The feature is UI-first.
  // We verify token validity for other API operations (export, starring, etc.)
  const tokenValid = await checkListsApi();

  if (!tokenValid) {
    printManualInstructions();
    process.exit(1);
  }

  printManualInstructions();
}

main().catch((_err) => {
  process.exit(1);
});
