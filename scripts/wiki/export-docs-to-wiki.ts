#!/usr/bin/env tsx
/**
 * export-docs-to-wiki.ts
 *
 * Copies wiki seed pages and nav files to the local wiki repository clone.
 * The wiki repo must be cloned alongside the main repo.
 *
 * Usage: npx tsx scripts/wiki/export-docs-to-wiki.ts [--wiki-dir=../szl-holdings-platform.wiki]
 *
 * Before running:
 *   1. Ensure the wiki repo is cloned: git clone <repo>.wiki.git ../szl-holdings-platform.wiki
 *   2. Run prepare-wiki-pages.ts first to validate
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_DIR = path.resolve(__dirname, '../../docs/wiki/wiki-seed');
const SIDEBAR_PATH = path.resolve(__dirname, '../../docs/wiki/_Sidebar.md');
const FOOTER_PATH = path.resolve(__dirname, '../../docs/wiki/_Footer.md');

const WIKI_PAGES = [
  'Home.md',
  'Platform-Overview.md',
  'Architecture.md',
  'Deployment-Model.md',
  'Security-Posture.md',
  'Trust-Center.md',
  'Screenshots-and-Demos.md',
  'Buyer-Use-Cases.md',
  'Investor-Overview.md',
  'FAQ.md',
  'Roadmap.md',
  'Glossary.md',
];

function parseArgs(): { wikiDir: string } {
  const wikiDirArg = process.argv.find((a) => a.startsWith('--wiki-dir='));
  const wikiDir = wikiDirArg
    ? path.resolve(wikiDirArg.split('=')[1])
    : path.resolve(__dirname, '../../../szl-holdings-platform.wiki');
  return { wikiDir };
}

function ensureWikiDirExists(wikiDir: string): void {
  if (!fs.existsSync(wikiDir)) {
    console.error(`Wiki directory not found: ${wikiDir}`);
    console.error('');
    console.error('Clone the wiki repo first:');
    console.error(
      '  git clone https://github.com/stephenlutar2-hash/szl-holdings-platform.wiki.git ../szl-holdings-platform.wiki',
    );
    process.exit(1);
  }
}

function copyFile(src: string, dest: string): void {
  if (!fs.existsSync(src)) {
    console.warn(`  WARNING: Source not found, skipping: ${src}`);
    return;
  }
  fs.copyFileSync(src, dest);
  console.log(`  ✓ ${path.basename(src)}`);
}

function main() {
  const { wikiDir } = parseArgs();

  console.log('=== Wiki Export ===\n');
  console.log(`Target wiki directory: ${wikiDir}\n`);

  ensureWikiDirExists(wikiDir);

  console.log('Copying wiki pages:');
  for (const page of WIKI_PAGES) {
    const src = path.join(SEED_DIR, page);
    const dest = path.join(wikiDir, page);
    copyFile(src, dest);
  }

  console.log('\nCopying navigation files:');
  copyFile(SIDEBAR_PATH, path.join(wikiDir, '_Sidebar.md'));
  copyFile(FOOTER_PATH, path.join(wikiDir, '_Footer.md'));

  console.log('\n✓ Export complete.');
  console.log('\nNext step: bash scripts/wiki/wiki-commit.sh "<commit message>"');
}

main();
