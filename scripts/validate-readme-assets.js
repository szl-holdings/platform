#!/usr/bin/env node
/**
 * validate-readme-assets.js
 *
 * Parses README.md (and any local markdown files directly linked from it) for
 * image and badge references. Verifies that:
 *   1. Every local image path exists on disk with an exact case match.
 *   2. Every badge that references a GitHub Actions workflow file points to a
 *      workflow file that actually exists under .github/workflows/.
 *
 * Exits 1 with a clear error list if anything fails. Exits 0 on success.
 *
 * Recursion: follows only direct local .md links from the root README (depth 1).
 * Code blocks (fenced ``` or indented) are skipped during parsing.
 *
 * Usage:
 *   node scripts/validate-readme-assets.js [--readme <path>]
 *
 * Options:
 *   --readme <path>   Path to the root README to validate (default: README.md)
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const readmeArgIndex = args.indexOf('--readme');
const README_PATH =
  readmeArgIndex !== -1 && args[readmeArgIndex + 1] ? args[readmeArgIndex + 1] : 'README.md';

const errors = [];

/**
 * Remove fenced code blocks (``` ... ```) and indented code blocks from
 * markdown content so we do not extract image refs from examples.
 */
function stripCodeBlocks(content) {
  // Remove fenced code blocks (``` or ~~~), optionally indented up to 3 spaces,
  // with optional language specifier after the fence marker.
  content = content.replace(/^ {0,3}(`{3,})[^\n]*\n[\s\S]*?^ {0,3}\1/gm, '');
  content = content.replace(/^ {0,3}(~{3,})[^\n]*\n[\s\S]*?^ {0,3}\1/gm, '');
  // Remove indented code blocks (4+ spaces or tab at line start)
  content = content.replace(/^( {4}|\t).+/gm, '');
  // Remove inline code spans (single or double backticks)
  content = content.replace(/``[^`]+``/g, '``');
  content = content.replace(/`[^`\n]+`/g, '``');
  return content;
}

/**
 * Resolve a path relative to the containing file's directory, then verify
 * it exists with exact case on disk.
 */
function checkLocalPath(ref, fromFile) {
  const dir = path.dirname(path.resolve(ROOT, fromFile));
  const resolved = path.resolve(dir, ref);
  const relative = path.relative(ROOT, resolved);

  if (!fs.existsSync(resolved)) {
    errors.push(`MISSING FILE: ${relative} (referenced from ${fromFile})`);
    return;
  }

  const actual = realCasePath(resolved);
  if (actual !== resolved) {
    errors.push(
      `CASE MISMATCH: referenced as "${relative}" but actual path is "${path.relative(ROOT, actual)}" (from ${fromFile})`,
    );
  }
}

/**
 * Return the real on-disk path (with correct case) for a given absolute path.
 */
function realCasePath(absPath) {
  const parts = absPath.split(path.sep).filter(Boolean);
  let current = path.sep;

  for (const part of parts) {
    let entries;
    try {
      entries = fs.readdirSync(current);
    } catch {
      return absPath;
    }
    const match = entries.find((e) => e.toLowerCase() === part.toLowerCase());
    if (!match) return absPath;
    current = path.join(current, match);
  }
  return current;
}

/**
 * Extract all image references from markdown content (code blocks already stripped):
 *   - Markdown images:  ![alt](url)
 *   - HTML img tags:    <img src="url" ...>
 */
function extractImageRefs(content) {
  const refs = [];

  const mdImgRe = /!\[[^\]]*\]\(([^)]+)\)/g;
  let m;
  while ((m = mdImgRe.exec(content)) !== null) {
    refs.push(m[1].split(' ')[0].trim());
  }

  const htmlImgRe = /<img\s[^>]*src=["']([^"']+)["'][^>]*>/gi;
  while ((m = htmlImgRe.exec(content)) !== null) {
    refs.push(m[1].trim());
  }

  return refs;
}

/**
 * Extract local markdown links from content (code blocks already stripped).
 * Returns only direct .md file links (no scheme, no anchor-only).
 */
function extractLocalMdLinks(content) {
  const links = [];
  const mdLinkRe = /\[([^\]]*)\]\(([^)]+)\)/g;
  let m;
  while ((m = mdLinkRe.exec(content)) !== null) {
    const href = m[2].split(' ')[0].trim();
    if (
      !href.startsWith('http') &&
      !href.startsWith('#') &&
      href.endsWith('.md') &&
      !href.includes('://')
    ) {
      links.push(href);
    }
  }
  return links;
}

/**
 * Check badge URLs that reference GitHub Actions workflow files.
 * Pattern: .../workflows/<file>/badge.svg
 */
function checkBadgeWorkflows(content, fromFile) {
  const badgeWorkflowRe =
    /https?:\/\/[^/]*github[^/]*\/[^/]+\/[^/]+\/(?:actions\/)?workflows\/([^/?"'\s)]+?)\/badge\.svg/g;
  let m;
  while ((m = badgeWorkflowRe.exec(content)) !== null) {
    const workflowFile = m[1];
    const workflowPath = path.join(ROOT, '.github', 'workflows', workflowFile);
    if (!fs.existsSync(workflowPath)) {
      errors.push(
        `MISSING WORKFLOW: badge references ".github/workflows/${workflowFile}" which does not exist (from ${fromFile})`,
      );
    }
  }
}

/**
 * Scan image references and badge workflows in a single markdown file.
 * Does not recurse — call separately for linked files if needed.
 */
function scanMarkdownFile(filePath, fromFile) {
  const absPath = path.resolve(ROOT, filePath);

  if (!fs.existsSync(absPath)) {
    if (fromFile) {
      errors.push(`MISSING LINKED FILE: ${filePath} (linked from ${fromFile})`);
    } else {
      errors.push(`MISSING FILE: ${filePath}`);
    }
    return;
  }

  const rawContent = fs.readFileSync(absPath, 'utf8');
  const content = stripCodeBlocks(rawContent);
  const imageRefs = extractImageRefs(content);

  for (const ref of imageRefs) {
    if (ref.startsWith('http://localhost') || ref.startsWith('http://127.')) {
      errors.push(`LOCALHOST URL: "${ref}" in ${filePath} — local URLs will not render on GitHub`);
      continue;
    }
    if (ref.includes('replit.com') && (ref.includes('/blob/') || ref.includes('temp-upload'))) {
      errors.push(
        `EXTERNAL TEMP URL: "${ref}" in ${filePath} — Replit temp/blob URLs are not stable`,
      );
      continue;
    }
    if (!ref.startsWith('http')) {
      checkLocalPath(ref, filePath);
    }
  }

  checkBadgeWorkflows(content, filePath);
}

// --- Main: scan root README, then follow its direct .md links (depth 1) ---

const absReadme = path.resolve(ROOT, README_PATH);
if (!fs.existsSync(absReadme)) {
  console.error(`ERROR: README not found at ${README_PATH}`);
  process.exit(1);
}

// Scan the root README
scanMarkdownFile(README_PATH, null);

// Follow direct local .md links from the root README (depth 1 only)
const rootRaw = fs.readFileSync(absReadme, 'utf8');
const rootContent = stripCodeBlocks(rootRaw);
const linkedMdFiles = extractLocalMdLinks(rootContent);

for (const link of linkedMdFiles) {
  const absLink = path.resolve(path.dirname(absReadme), link);
  const relLink = path.relative(ROOT, absLink);
  if (fs.existsSync(absLink)) {
    scanMarkdownFile(relLink, README_PATH);
  }
  // Missing linked files are already checked inside scanMarkdownFile if we called it,
  // but we skip them silently here — the README text links to many docs, some of
  // which are documentation files with their own internal links. We only flag missing
  // image assets, not missing doc pages (those are caught by separate link checkers).
}

if (errors.length > 0) {
  console.error('\nREADME asset validation FAILED:\n');
  for (const e of errors) {
    console.error(`  x ${e}`);
  }
  console.error(
    `\n${errors.length} error(s) found. Fix the issues above and re-run: pnpm readme:check\n`,
  );
  process.exit(1);
} else {
  console.log(
    `\nREADME asset validation passed (${README_PATH}). No broken images or missing badge workflows found.\n`,
  );
  process.exit(0);
}
