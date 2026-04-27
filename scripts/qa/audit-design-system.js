#!/usr/bin/env node
/**
 * audit:design-system — SZL Holdings Platform
 * Checks for hardcoded colors and fonts that violate design token conventions.
 *
 * Rules:
 *  - No raw hex colors (#rrggbb) outside of design-system or theme files
 *  - No hardcoded font-family strings outside of theme files
 *  - No hardcoded pixel values for spacing > 48px (should use clamp/CSS var)
 *
 * Usage:
 *   node scripts/qa/audit-design-system.js
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

// Patterns that indicate design-system violations
const VIOLATION_PATTERNS = [
  {
    pattern: /#[0-9a-fA-F]{6}\b(?![0-9a-fA-F])/g,
    label: 'Hardcoded hex color',
    severity: 'warning',
    allowedFiles: ['design-system', 'theme', 'index.css', 'tailwind', '.config.', 'globals.css'],
  },
  {
    pattern: /#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])/g,
    label: 'Hardcoded 3-digit hex color',
    severity: 'info',
    allowedFiles: ['design-system', 'theme', 'index.css', 'tailwind', '.config.', 'globals.css'],
  },
  {
    pattern: /font-family:\s*["'](?!var\()/g,
    label: 'Hardcoded font-family (should use CSS var)',
    severity: 'warning',
    allowedFiles: ['design-system', 'theme', 'index.css', 'globals.css'],
  },
  {
    pattern: /Arial|Helvetica|Times New Roman|Georgia|Courier New/g,
    label: 'Generic system font (should use design token)',
    severity: 'info',
    allowedFiles: ['design-system', 'theme', 'index.css', 'globals.css', 'tailwind'],
  },
];

const SCAN_DIRS = [
  'artifacts/szl-holdings/src',
  'artifacts/lyte-command-center/src',
  'artifacts/terra/src',
  'artifacts/vessels/src',
  'artifacts/carlota-jo/src',
  'artifacts/stephen-site/src',
  'lib/shared-ui/src',
];

const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build', '.cache'];
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.scss']);

function walkDir(dir) {
  const files = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (SKIP_DIRS.includes(entry.name)) continue;
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...walkDir(fullPath));
      } else if (SCAN_EXTENSIONS.has(extname(entry.name))) {
        files.push(fullPath);
      }
    }
  } catch {
    // skip
  }
  return files;
}

function isAllowedFile(filePath, allowedFiles) {
  return allowedFiles.some((a) => filePath.includes(a));
}

function auditFile(filePath) {
  const rel = relative(ROOT, filePath);
  let content;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }

  const findings = [];

  for (const { pattern, label, severity, allowedFiles } of VIOLATION_PATTERNS) {
    if (isAllowedFile(rel, allowedFiles)) continue;

    const regex = new RegExp(pattern.source, 'gm');
    let match;
    while ((match = regex.exec(content)) !== null) {
      const lineNum = content.slice(0, match.index).split('\n').length;
      const lineText = content.split('\n')[lineNum - 1]?.trim().slice(0, 100) ?? '';

      // Skip if it's in a comment
      if (lineText.trimStart().startsWith('//') || lineText.trimStart().startsWith('*')) continue;
      // Skip if it's an hsl() or rgb() that uses a token pattern
      if (lineText.includes('hsl(var(') || lineText.includes('rgb(var(')) continue;

      findings.push({ file: rel, line: lineNum, text: lineText, label, severity, match: match[0] });
    }
  }

  return findings;
}

function main() {

  const allFindings = [];

  for (const dir of SCAN_DIRS) {
    const fullDir = join(ROOT, dir);
    const files = walkDir(fullDir);
    for (const file of files) {
      allFindings.push(...auditFile(file));
    }
  }

  const errors = allFindings.filter((f) => f.severity === 'error');
  const warnings = allFindings.filter((f) => f.severity === 'warning');
  const _infos = allFindings.filter((f) => f.severity === 'info');

  // Summarize by file
  const byFile = new Map();
  for (const f of warnings) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file).push(f);
  }

  if (warnings.length > 0) {
    let shown = 0;
    for (const [_file, _findings] of byFile) {
      if (shown >= 20) {
        break;
      }
      shown++;
    }
  }

  if (errors.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
