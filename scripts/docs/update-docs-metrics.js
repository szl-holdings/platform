#!/usr/bin/env node

/**
 * update-docs-metrics.js
 *
 * Standalone entry-point that rewrites all drifted metric values in the
 * canonical documentation files to match live codebase counts.
 *
 * This is a thin wrapper around:
 *   node scripts/docs/check-docs-sync.js --fix
 *
 * Use this script:
 *   - As a pre-commit hook to keep docs current automatically
 *   - In CI/CD to auto-correct numbers after any merge
 *   - Directly on the command line after adding new routes, schema files, or tables
 *
 * Usage:
 *   node scripts/docs/update-docs-metrics.js
 *
 * What it fixes:
 *   - Route file count in API-SPEC.md
 *   - Schema file count in DATA-MODEL.md
 *   - pgTable / database table count in DATA-MODEL.md, ARCHITECTURE.md,
 *     and docs/metrics-reference.md
 *
 * What it does NOT fix automatically:
 *   - Product-surface lists in PRODUCT-SURFACES.md (planned surfaces must be
 *     reviewed manually before editing)
 *
 * After running, execute the check without --fix to confirm zero warnings:
 *   node scripts/docs/check-docs-sync.js
 */

import { execFileSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const checkScript = join(__dirname, 'check-docs-sync.js');

execFileSync(process.execPath, [checkScript, '--fix'], { stdio: 'inherit' });
