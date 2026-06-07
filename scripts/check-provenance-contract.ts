#!/usr/bin/env tsx
import { readFileSync } from 'fs';
import { join } from 'path';

const AI_ROUTE_FILES = [
  'artifacts/api-server/src/routes/nuro-mesh.ts',
  'artifacts/api-server/src/routes/cross-domain-query.ts',
];

const PROVENANCE_PATTERNS = [
  /provenance/i,
  /runId/,
  /callAgentWithProvenance/,
];

let violations = 0;
let checked = 0;

for (const file of AI_ROUTE_FILES) {
  const fullPath = join(process.cwd(), file);
  let content: string;
  try {
    content = readFileSync(fullPath, 'utf-8');
  } catch {
    console.error(`SKIP: ${file} (not found)`);
    continue;
  }
  checked += 1;

  const hasProvenance = PROVENANCE_PATTERNS.some((p) => p.test(content));
  if (!hasProvenance) {
    console.error(`VIOLATION: ${file} — AI route does not reference provenance envelope`);
    violations += 1;
  } else {
    console.log(`OK: ${file} — provenance contract present`);
  }
}

if (checked === 0) {
  console.error('No AI route files found to check');
  process.exit(1);
}

if (violations > 0) {
  console.error(`\n${violations} provenance contract violation(s) found`);
  process.exit(1);
}

console.log(`\nAll ${checked} AI route files carry provenance contract`);
