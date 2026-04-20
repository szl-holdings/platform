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
const USERNAME = process.argv[2] || 'stephenlutar2-hash';

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
  console.log('\n================================================================');
  console.log('  MANUAL FALLBACK — Create Lists via GitHub Web UI');
  console.log('================================================================\n');
  console.log('GitHub Lists must be created manually if a token is not available.\n');
  console.log('Steps:\n');
  console.log(`  1. Go to: https://github.com/${USERNAME}?tab=stars\n`);
  console.log("  2. Click 'Create list' in the left sidebar\n");
  console.log('  3. Create each list below:\n');

  for (const list of CANONICAL_LISTS) {
    console.log(`  ---`);
    console.log(`  Name:        ${list.name}`);
    console.log(`  Description: ${list.description}`);
  }

  console.log('\n  4. Once lists exist, assign starred repos to the');
  console.log('     appropriate list using the bookmark icon on each repo.\n');
  console.log('  Reference: docs/github/list-taxonomy.md for inclusion criteria.\n');
  console.log('================================================================\n');
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
  console.log('================================================================');
  console.log('  SZL Holdings — Scaffold List Taxonomy');
  console.log(`  User: @${USERNAME}`);
  console.log('================================================================\n');

  // Be explicit upfront: this is a guided setup tool, not an API creator.
  console.log('NOTE: GitHub Lists are a web UI-only feature.');
  console.log('  This script CANNOT create lists via the GitHub API.');
  console.log('  It prints the canonical list definitions and setup instructions.');
  console.log('  You must create lists manually at: github.com/' + USERNAME + '?tab=stars\n');

  console.log('Canonical lists to configure:\n');
  for (const list of CANONICAL_LISTS) {
    console.log(`  - ${list.name}`);
    console.log(`    ${list.description}\n`);
  }

  if (!GITHUB_TOKEN) {
    console.log('GITHUB_TOKEN not set — skipping token validation.\n');
    printManualInstructions();
    process.exit(0);
  }

  // GitHub Lists (beta) — the API for creating lists programmatically
  // is not part of the stable GitHub REST API. The feature is UI-first.
  // We verify token validity for other API operations (export, starring, etc.)
  const tokenValid = await checkListsApi();

  if (!tokenValid) {
    console.error(
      'GitHub token is set but could not authenticate. Verify GITHUB_TOKEN is valid.\n',
    );
    printManualInstructions();
    process.exit(1);
  }

  console.log('Token verified (valid for export-starred-repos.ts and other API operations).');
  console.log('List creation still requires GitHub web UI — see instructions below.\n');

  printManualInstructions();

  console.log('\nAlternative: Use the export and report scripts to analyze');
  console.log('your existing stars and manually organize into these lists.\n');
  console.log('  npx tsx scripts/github/stars/export-starred-repos.ts');
  console.log('  npx tsx scripts/github/stars/generate-category-report.ts\n');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
