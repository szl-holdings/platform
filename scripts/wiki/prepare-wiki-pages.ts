#!/usr/bin/env tsx
/**
 * prepare-wiki-pages.ts
 *
 * Validates wiki seed pages before export.
 * - Checks all required pages exist
 * - Validates frontmatter is absent (GitHub Wiki does not use frontmatter)
 * - Reports broken internal wiki links
 * - Reports pages that reference non-existent screenshots
 *
 * Usage: npx tsx scripts/wiki/prepare-wiki-pages.ts
 * Alt:   ./scripts/wiki/prepare-wiki-pages.ts (if tsx is in PATH)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_DIR = path.resolve(__dirname, '../../docs/wiki/wiki-seed');
const SIDEBAR_PATH = path.resolve(__dirname, '../../docs/wiki/_Sidebar.md');
const FOOTER_PATH = path.resolve(__dirname, '../../docs/wiki/_Footer.md');
const SCREENSHOTS_DIR = path.resolve(__dirname, '../../docs/media/screenshots');

const REQUIRED_PAGES = [
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

const REQUIRED_NAV = ['_Sidebar.md', '_Footer.md'];

interface ValidationResult {
  page: string;
  issues: string[];
}

function checkPagesExist(): string[] {
  const missing: string[] = [];
  for (const page of REQUIRED_PAGES) {
    const pagePath = path.join(SEED_DIR, page);
    if (!fs.existsSync(pagePath)) {
      missing.push(page);
    }
  }
  for (const nav of REQUIRED_NAV) {
    const navPath = path.resolve(__dirname, '../../docs/wiki', nav);
    if (!fs.existsSync(navPath)) {
      missing.push(`docs/wiki/${nav}`);
    }
  }
  return missing;
}

function checkNoFrontmatter(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');
  const trimmed = content.trimStart();
  if (!trimmed.startsWith('---')) return false;
  // A true YAML frontmatter block has key: value pairs on the lines after `---`.
  // A Markdown horizontal rule `---` is followed by empty lines or regular content.
  const lines = trimmed.split('\n');
  if (lines.length < 2) return false;
  for (let i = 1; i < Math.min(lines.length, 5); i++) {
    const line = lines[i].trim();
    if (line === '') continue;
    if (/^[\w-]+\s*:/.test(line)) return true; // YAML key: value detected
    break; // Non-YAML content: this is just a horizontal rule
  }
  return false;
}

function extractWikiLinks(content: string): string[] {
  const wikiLinkPattern = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match;
  while ((match = wikiLinkPattern.exec(content)) !== null) {
    links.push(match[1]);
  }
  return links;
}

function checkWikiLinks(content: string, availablePages: Set<string>): string[] {
  const links = extractWikiLinks(content);
  const broken: string[] = [];
  for (const link of links) {
    const pageName = link.split('|')[0].trim();
    if (pageName === '_Footer' || pageName === '_Sidebar' || pageName === 'Home') {
      continue;
    }
    if (!availablePages.has(`${pageName}.md`)) {
      broken.push(link);
    }
  }
  return broken;
}

function checkScreenshotRefs(content: string): string[] {
  const screenshotPattern = /!\[.*?\]\(.*?docs\/media\/screenshots\/([^)]+)\)/g;
  const missing: string[] = [];
  let match;
  while ((match = screenshotPattern.exec(content)) !== null) {
    const screenshotFile = match[1];
    const screenshotPath = path.join(SCREENSHOTS_DIR, screenshotFile);
    if (!fs.existsSync(screenshotPath)) {
      missing.push(screenshotFile);
    }
  }
  return missing;
}

function validatePage(pagePath: string, availablePages: Set<string>): ValidationResult {
  const pageName = path.basename(pagePath);
  const issues: string[] = [];

  if (checkNoFrontmatter(pagePath)) {
    issues.push('Contains YAML frontmatter — remove before publishing to wiki');
  }

  const content = fs.readFileSync(pagePath, 'utf-8');

  const brokenLinks = checkWikiLinks(content, availablePages);
  for (const link of brokenLinks) {
    issues.push(`Broken wiki link: [[${link}]]`);
  }

  const missingScreenshots = checkScreenshotRefs(content);
  for (const screenshot of missingScreenshots) {
    issues.push(`Missing screenshot: ${screenshot}`);
  }

  return { page: pageName, issues };
}

function main() {

  const missingPages = checkPagesExist();
  if (missingPages.length > 0) {
    for (const _page of missingPages) {
    }
  } else {
  }

  const availablePages = new Set(fs.readdirSync(SEED_DIR).filter((f) => f.endsWith('.md')));

  const results: ValidationResult[] = [];

  for (const page of REQUIRED_PAGES) {
    const pagePath = path.join(SEED_DIR, page);
    if (fs.existsSync(pagePath)) {
      results.push(validatePage(pagePath, availablePages));
    }
  }

  for (const navFile of [SIDEBAR_PATH, FOOTER_PATH]) {
    if (fs.existsSync(navFile)) {
      results.push(validatePage(navFile, availablePages));
    }
  }

  let hasIssues = false;
  for (const result of results) {
    if (result.issues.length > 0) {
      hasIssues = true;
      for (const _issue of result.issues) {
      }
    }
  }

  if (!hasIssues && missingPages.length === 0) {
  } else {
    process.exit(1);
  }
}

main();
