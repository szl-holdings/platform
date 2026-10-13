#!/usr/bin/env node
/**
 * Replace any checkout-carried vulnerability report with an explicit failure
 * before preflight tests start. A successful audit run replaces this file.
 */

import { randomUUID } from 'node:crypto';
import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const OUTPUT_FILE = join(ROOT, 'security', 'vuln-report.md');

export function writePreflightFailureReport(outputFile = OUTPUT_FILE, now = new Date()) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new Error('preflight report timestamp must be a valid Date');
  }
  const outputDirectory = dirname(outputFile);
  mkdirSync(outputDirectory, { recursive: true });
  const temporaryFile = `${outputFile}.${process.pid}.${randomUUID()}.tmp`;
  const report = `# Dependency Vulnerability Report

**Generated:** ${now.toISOString()}
**Blocking verdict:** FAIL

The dependency-audit preflight has not completed successfully in this workflow run. A checkout-carried or prior-run report is not evidence for the current run. Promotion remains blocked unless the bounded audit and every registered patch behavior verification complete and atomically replace this file.
`;
  try {
    writeFileSync(temporaryFile, report, { flag: 'wx' });
    renameSync(temporaryFile, outputFile);
  } finally {
    rmSync(temporaryFile, { force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writePreflightFailureReport();
}
