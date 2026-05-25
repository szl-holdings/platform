#!/usr/bin/env tsx
/**
 * scripts/audit/generate-platform-metrics.ts
 *
 * DEPRECATED LOCATION — kept as a thin re-export so existing diligence-audit
 * runners and docs that reference this path keep working.
 *
 * The canonical generator lives at scripts/generate-platform-metrics.ts and
 * now produces all four outputs in one pass:
 *   - packages/platform-metrics-registry/src/registry.ts
 *   - docs/platform-facts.md
 *   - generated/platform-metrics.json
 *   - generated/platform-metrics.md
 *
 * See task #5112 and Section 7 of docs/DEPENDENCY_AND_SCRIPT_DRIFT.md for the
 * consolidation rationale. Do not add logic here — edit the canonical script.
 */

import '../generate-platform-metrics.ts';
