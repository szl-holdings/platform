#!/usr/bin/env node
/**
 * Replace any checkout-carried license report with an explicit failure before
 * current-run tests and inventory evaluation begin.
 */

import { randomUUID } from 'node:crypto';
import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const OUTPUT_FILE = join(ROOT, 'security', 'license-report.md');

export function writeLicensePreflightFailureReport(outputFile = OUTPUT_FILE, now = new Date()) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new Error('license preflight report timestamp must be a valid Date');
  }
  const outputDirectory = dirname(outputFile);
  mkdirSync(outputDirectory, { recursive: true });
  const temporaryFile = `${outputFile}.${process.pid}.${randomUUID()}.tmp`;
  const report = `# License Compliance Report

**Generated:** ${now.toISOString()}
**Verdict:** FAIL

## Blocking policy or inventory violations

- The license-policy preflight has not completed successfully in this workflow run. A checkout-carried or prior-run report is not current evidence.

_Promotion remains blocked unless the negative contracts, installed-package inventory, and exact reviewed policy evaluation complete and atomically replace this file._
`;
  try {
    writeFileSync(temporaryFile, report, { flag: 'wx' });
    renameSync(temporaryFile, outputFile);
  } finally {
    rmSync(temporaryFile, { force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeLicensePreflightFailureReport();
}
