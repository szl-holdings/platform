#!/usr/bin/env node
/**
 * validate-sync.js
 *
 * Lightweight synchronization check: verifies that every MYTHOS_ACTOR id and
 * every MYTHOS_IDEA id in the shared frontier-mythos package is referenced in
 * the doctrine document (RESEARCH_MYTHOS.md).
 *
 * Run: node packages/frontier-mythos/scripts/validate-sync.js
 * Exit 0 = in sync. Exit 1 = drift detected (lists missing entries).
 */

const fs = require('fs');
const path = require('path');

const pkgRoot = path.resolve(__dirname, '..');
const docRoot = path.resolve(__dirname, '../../..');

// Load compiled package data via require (ts-node not needed; we read the source directly)
const srcPath = path.join(pkgRoot, 'src', 'index.ts');
const src = fs.readFileSync(srcPath, 'utf8');

// Extract id values from MYTHOS_ACTORS and MYTHOS_IDEAS using regex
const actorIds = [...src.matchAll(/id:\s*'(actor-[^']+)'/g)].map(m => m[1]);
const ideaIds  = [...src.matchAll(/id:\s*'(idea-[^']+)'/g)].map(m => m[1]);

// Load the doctrine document
const docCandidates = [
  path.join(pkgRoot, 'RESEARCH_MYTHOS.md'),
  path.join(docRoot, 'RESEARCH_MYTHOS.md'),
  path.join(docRoot, 'docs', 'RESEARCH_MYTHOS.md'),
];
const docPath = docCandidates.find(p => fs.existsSync(p));
if (!docPath) {
  console.error('[validate-sync] RESEARCH_MYTHOS.md not found in expected locations.');
  console.error('Checked:', docCandidates);
  process.exit(1);
}
const doc = fs.readFileSync(docPath, 'utf8');

const missing = [];
for (const id of [...actorIds, ...ideaIds]) {
  if (!doc.includes(id)) missing.push(id);
}

if (missing.length === 0) {
  console.log('[validate-sync] OK — all frontier-mythos IDs are referenced in RESEARCH_MYTHOS.md');
  process.exit(0);
} else {
  console.error('[validate-sync] DRIFT DETECTED — the following IDs are in the package but missing from RESEARCH_MYTHOS.md:');
  missing.forEach(id => console.error('  missing:', id));
  console.error('\nAdd a reference for each missing ID in RESEARCH_MYTHOS.md and re-run this script.');
  process.exit(1);
}
