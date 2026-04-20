#!/usr/bin/env tsx
/**
 * SZL Holdings — Print Stars System Summary
 * Prints a terminal summary of all files in the GitHub Stars & Lists system.
 *
 * Usage:
 *   npx tsx scripts/github/stars/print-system-summary.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const FILES = [
  {
    section: 'Documentation (docs/github/)',
    entries: [
      {
        path: 'docs/github/stars-strategy.md',
        description: 'Core strategy, guiding principles, star count targets',
      },
      {
        path: 'docs/github/stars-why-it-matters.md',
        description: 'The case for structured curation over casual bookmarking',
      },
      {
        path: 'docs/github/stars-do-not-do.md',
        description: '10 anti-patterns to avoid',
      },
      {
        path: 'docs/github/list-taxonomy.md',
        description: '8 canonical lists with inclusion/exclusion criteria',
      },
      {
        path: 'docs/github/curation-rubric.md',
        description: '9-dimension scoring rubric (27 pts) + quick eval template',
      },
      {
        path: 'docs/github/reference-library.md',
        description: 'Reference Library system: promotion pathway and templates',
      },
      {
        path: 'docs/github/reference-library-index.md',
        description: 'Master index (scaffolded — ready to populate)',
      },
      {
        path: 'docs/github/review-cadence.md',
        description: 'Weekly/monthly/quarterly review process + checklists',
      },
      {
        path: 'docs/github/founder-workflow.md',
        description: 'Decision tree: star, index, note, ignore, or unstar',
      },
    ],
  },
  {
    section: 'Automation Scripts (scripts/github/stars/)',
    entries: [
      {
        path: 'scripts/github/stars/export-starred-repos.ts',
        description: 'Export all starred repos to JSON + Markdown',
      },
      {
        path: 'scripts/github/stars/generate-category-report.ts',
        description: 'Generate categorized Markdown reports from export JSON',
      },
      {
        path: 'scripts/github/stars/scaffold-list-taxonomy.ts',
        description: 'Print canonical list definitions + guided manual setup',
      },
      {
        path: 'scripts/github/stars/print-system-summary.ts',
        description: 'Print this terminal summary of all system files',
      },
    ],
  },
  {
    section: 'Final Summary (docs/final/)',
    entries: [
      {
        path: 'docs/final/stars-system-summary.md',
        description: 'Full system overview, lists, rules, cadence, next 10 actions',
      },
    ],
  },
];

function checkFile(filePath: string): 'OK' | 'MISSING' {
  return fs.existsSync(path.join(process.cwd(), filePath)) ? 'OK' : 'MISSING';
}

function formatBytes(filePath: string): string {
  try {
    const stat = fs.statSync(path.join(process.cwd(), filePath));
    const kb = (stat.size / 1024).toFixed(1);
    return `${kb}kb`;
  } catch {
    return '—';
  }
}

function main() {
  const now = new Date().toISOString().split('T')[0];

  console.log('================================================================');
  console.log('  SZL Holdings — GitHub Stars & Lists System');
  console.log(`  Summary as of: ${now}`);
  console.log('================================================================\n');

  let totalFiles = 0;
  let missingFiles = 0;

  for (const { section, entries } of FILES) {
    console.log(`${section}`);
    console.log('─'.repeat(section.length));

    for (const entry of entries) {
      const status = checkFile(entry.path);
      const size = status === 'OK' ? formatBytes(entry.path) : '—';
      const statusIcon = status === 'OK' ? '✓' : '✗';
      console.log(`  ${statusIcon} ${path.basename(entry.path)}`);
      console.log(`    ${entry.description}`);
      if (status === 'OK') {
        console.log(`    Path: ${entry.path} (${size})`);
      } else {
        console.log(`    Path: ${entry.path} [MISSING]`);
        missingFiles++;
      }
      console.log('');
      totalFiles++;
    }
  }

  console.log('================================================================');
  console.log(`  Total files: ${totalFiles}`);
  console.log(
    `  Status: ${missingFiles === 0 ? 'All files present' : `${missingFiles} file(s) missing — run task to regenerate`}`,
  );
  console.log('================================================================\n');

  console.log('Quick reference — automation scripts:\n');
  console.log(
    '  # Export starred repos (requires GITHUB_TOKEN or public unauthenticated access)\n' +
      '  npx tsx scripts/github/stars/export-starred-repos.ts\n',
  );
  console.log(
    '  # Generate category reports from export\n' +
      '  npx tsx scripts/github/stars/generate-category-report.ts\n',
  );
  console.log(
    '  # View canonical list definitions + guided setup instructions\n' +
      '  npx tsx scripts/github/stars/scaffold-list-taxonomy.ts\n',
  );
  console.log(
    '  # Print this summary again\n' + '  npx tsx scripts/github/stars/print-system-summary.ts\n',
  );
  console.log('  Outputs are written to: exports/github-stars/\n');
  console.log('================================================================\n');
}

main();
