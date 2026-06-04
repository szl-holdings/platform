#!/usr/bin/env tsx
/**
 * backfill-memory-domain.ts — Task #2579
 *
 * One-shot migration that backfills `metadata.domain` and rewrites `scope_id`
 * to the canonical `domain:<d>` form on existing rows in `memory_records`
 * written before Task #2540 made the canonical `domain` tag mandatory on
 * every write.
 *
 * Why this matters
 * ----------------
 * The simplified executive briefing query in
 * `artifacts/api-server/src/routes/executive-briefings.ts` filters memory by a
 * single equality:
 *
 *   metadata->>'domain' = $1
 *
 * Historical rows still carry the old multi-signal shape (no `metadata.domain`,
 * scope ids like `entity:vessels:imo-123`, provenance source strings such as
 * `vessels-screening-agent`, …). Without this backfill they silently drop out
 * of every domain-scoped brief.
 *
 * Inference order (most-confident first)
 * --------------------------------------
 *   1a. `scope_id ~ '^domain:(.+)$'` — the writer already declared the canonical
 *       domain, just lift the suffix back into `metadata.domain`.
 *   1b. Legacy scope-id prefixes whose first segment is a known domain key
 *       (e.g. `vessels:imo-123`).
 *   1c. Legacy `entity:<domain>:...` shapes — second segment matches a known
 *       domain (e.g. `entity:vessels:imo-123`, `tier:terra:apn-9`).
 *   2.  `provenance_source` substring match against KNOWN_MEMORY_DOMAINS plus a
 *       small alias table (firestorm→aegis, maritime→vessels, …).
 *   3.  Joining `linked_entities` (jsonb string array of `cst_nodes` uuids)
 *       against `cst_nodes.domain` and taking the majority domain.
 *   4.  Anything still untagged → `MEMORY_DOMAIN_UNKNOWN` ("unknown") so the
 *       runtime check in `MemoryEntrySchema` is satisfied if those rows are
 *       ever rewritten.
 *
 * scope_id canonicalization
 * -------------------------
 * Per the task's "Done looks like" contract every backfilled row also has its
 * `scope_id` rewritten to `domain:<d>`. Any prior non-canonical scope token
 * (e.g. `entity:vessels:imo-123`) is preserved separately under
 * `metadata.legacyScopeId` so callers that still need the original entity
 * binding can recover it. New writes never touched that key so there is no
 * collision. New writers continue to follow the
 * `entry.scopeId ?? "domain:<d>"` convention in
 * `packages/memory-fabric/src/postgres-store.ts` (`buildRow`).
 *
 * The script is idempotent — every UPDATE is gated on
 * `metadata->>'domain' IS NULL OR metadata->>'domain' = ''`, so re-running it
 * after partial completion (or after a fresh batch of legacy rows lands) is a
 * no-op for already-tagged rows.
 *
 * Dry-run safety
 * --------------
 * Each step ships an UPDATE *and* an explicitly paired SELECT count(*). In
 * `--dry-run` mode the script only ever runs the SELECT, so multi-table
 * statements (e.g. Step 3's `UPDATE ... FROM ...`) cannot accidentally mutate
 * data. The script throws if any step is missing a matching count query.
 *
 * Spot-check / parity verification
 * --------------------------------
 * After the sweep, the script runs a per-domain parity check that compares:
 *   - rows the *old* four-signal query would have returned for the domain
 *     (metadata.domain match OR legacy scope_id match against `metadata.legacyScopeId`/`scope_id` OR
 *      provenance ILIKE OR linked_entities → cst_nodes.domain), and
 *   - rows the *new* single-equality query returns
 *     (metadata->>'domain' = '<d>').
 * The new set must be a strict superset of the old (it's allowed to include
 * the previously-untagged rows that the backfill resolved). Any row that the
 * old query would have returned but the new query misses is reported and the
 * script exits non-zero.
 *
 * Usage
 * -----
 *   pnpm --filter @workspace/scripts backfill:memory-domain            # apply
 *   pnpm --filter @workspace/scripts backfill:memory-domain -- --dry-run
 *   pnpm --filter @workspace/scripts backfill:memory-domain -- --verify-only
 */

import { pool } from '@szl-holdings/db';
import { KNOWN_MEMORY_DOMAINS, MEMORY_DOMAIN_UNKNOWN } from '@workspace/memory-fabric';

const DRY_RUN = process.argv.includes('--dry-run');
const VERIFY_ONLY = process.argv.includes('--verify-only');

/**
 * Canonical domain keys that the executive briefing route matches against.
 * The legacy-scope inference steps treat these as authoritative — only first
 * (or `entity:`-prefixed second) scope segments that resolve to one of these
 * keys are accepted as a domain hint. Everything else falls through to the
 * provenance / linked-entity / unknown steps so we don't accidentally tag
 * rows with a free-form scope token like "session" or "run-001".
 */
const SCOPE_DOMAIN_KEYS: readonly string[] = KNOWN_MEMORY_DOMAINS.filter(
  (d) => d !== MEMORY_DOMAIN_UNKNOWN,
);

/**
 * Provenance-source substring → canonical domain. The matchers are intentionally
 * broad (case-insensitive ILIKE) so that historical strings like
 * `agent:vessels-screening:v3`, `firestorm-treasury-loop`, or
 * `terra-broker-pipeline` all resolve to the right modern domain key. Aliases
 * (firestorm, maritime, realestate, counsel, legal, clm, holdings, edr, soc,
 * fund-ops) match the same set the live executive briefing route already
 * normalises through `DOMAIN_ALIAS`.
 *
 * Order matters: the more-specific patterns run first so a string containing
 * both "szl" and "holdings" lands in `szl-holdings` rather than `platform`.
 */
const PROVENANCE_PATTERNS: Array<{ domain: string; needles: string[] }> = [
  { domain: 'vessels', needles: ['vessel', 'maritime', 'ais', 'voyage', 'imo'] },
  { domain: 'aegis', needles: ['aegis', 'firestorm', 'treasury', 'shell-co', 'shell co'] },
  { domain: 'terra', needles: ['terra', 'real-estate', 'realestate', 'property', 'broker'] },
  { domain: 'lyte', needles: ['lyte'] },
  { domain: 'prism', needles: ['prism', 'counsel', 'legal', 'clm', 'matter'] },
  { domain: 'carlota', needles: ['carlota'] },
  { domain: 'sentra', needles: ['sentra', 'edr', 'soc', 'ransomware', 'ot-network'] },
  { domain: 'szl-holdings', needles: ['szl', 'holdings', 'fund-ops', 'fundops'] },
  { domain: 'platform', needles: ['platform', 'system', 'infra', 'gateway', 'scheduler'] },
];

/**
 * Build the SET clause every backfill step shares: write `metadata.domain`,
 * stash any non-canonical `scope_id` into `metadata.legacyScopeId`, and
 * rewrite `scope_id` to the canonical `domain:<d>`.
 *
 * @param domainExpr   SQL text expression that yields the canonical domain
 *                     name for the row (e.g. `'vessels'`, `split_part(scope_id, ':', 1)`,
 *                     `t.inferred_domain`).
 * @param scopeIdRef   SQL reference to the row's existing `scope_id` column —
 *                     usually `scope_id`, or `mr.scope_id` inside an
 *                     UPDATE ... FROM statement.
 * @param metadataRef  SQL reference to the row's existing `metadata` column.
 */
function backfillSet(
  domainExpr: string,
  scopeIdRef = 'scope_id',
  metadataRef = 'metadata',
): string {
  return `
    metadata = CASE
      WHEN ${scopeIdRef} IS NOT NULL AND ${scopeIdRef} !~ '^domain:'
        THEN jsonb_set(
               jsonb_set(COALESCE(${metadataRef}, '{}'::jsonb), '{domain}', to_jsonb((${domainExpr})::text)),
               '{legacyScopeId}',
               to_jsonb(${scopeIdRef}),
               true
             )
      ELSE jsonb_set(COALESCE(${metadataRef}, '{}'::jsonb), '{domain}', to_jsonb((${domainExpr})::text))
    END,
    scope_id = 'domain:' || (${domainExpr})
  `;
}

interface BackfillStep {
  label: string;
  /** UPDATE statement applied in the live (non-dry-run) path. */
  updateSql: string;
  /**
   * Paired SELECT count(*) statement that returns the same row set the
   * UPDATE would touch. MUST be a pure SELECT — `runStep` will not run an
   * UPDATE during a dry-run.
   */
  countSql: string;
  params?: unknown[];
}

async function runStep(step: BackfillStep): Promise<{ label: string; rowsAffected: number }> {
  const params = step.params ?? [];
  if (!/^\s*SELECT/i.test(step.countSql)) {
    throw new Error(
      `[backfill-memory-domain] step "${step.label}" countSql must be a SELECT statement (got: ${step.countSql.slice(0, 40)}…)`,
    );
  }
  if (DRY_RUN) {
    const { rows } = await pool.query<{ n: number }>(step.countSql, params);
    const n = rows[0]?.n ?? 0;
    return { label: step.label, rowsAffected: n };
  }
  const res = await pool.query(step.updateSql, params);
  const n = res.rowCount ?? 0;
  return { label: step.label, rowsAffected: n };
}

/**
 * Predicate fragment shared by every step's WHERE clause. Centralised so the
 * count and update SQL can never drift out of sync.
 */
const UNTAGGED_WHERE = `(metadata IS NULL OR metadata->>'domain' IS NULL OR metadata->>'domain' = '')`;

function buildSteps(): BackfillStep[] {
  const steps: BackfillStep[] = [];
  const keysArrayLiteral = `ARRAY[${SCOPE_DOMAIN_KEYS.map((k) => `'${k}'`).join(',')}]::text[]`;

  // ---- Step 1a: scope_id LIKE 'domain:<d>' --------------------------------
  // Already canonical; just lift the suffix. No legacyScopeId stash needed.
  steps.push({
    label: "step 1a (scope_id 'domain:<d>')",
    updateSql: `
      UPDATE memory_records
         SET ${backfillSet("substring(scope_id from '^domain:(.+)$')")}
       WHERE ${UNTAGGED_WHERE}
         AND scope_id ~ '^domain:.+$'
    `,
    countSql: `
      SELECT count(*)::int AS n FROM memory_records
       WHERE ${UNTAGGED_WHERE}
         AND scope_id ~ '^domain:.+$'
    `,
  });

  // ---- Step 1b: legacy first-segment domain match -------------------------
  steps.push({
    label: "step 1b (scope_id '<domain>:…' first segment)",
    updateSql: `
      UPDATE memory_records
         SET ${backfillSet("split_part(scope_id, ':', 1)")}
       WHERE ${UNTAGGED_WHERE}
         AND scope_id IS NOT NULL
         AND position(':' in scope_id) > 0
         AND split_part(scope_id, ':', 1) = ANY(${keysArrayLiteral})
    `,
    countSql: `
      SELECT count(*)::int AS n FROM memory_records
       WHERE ${UNTAGGED_WHERE}
         AND scope_id IS NOT NULL
         AND position(':' in scope_id) > 0
         AND split_part(scope_id, ':', 1) = ANY(${keysArrayLiteral})
    `,
  });

  // ---- Step 1c: legacy 'entity:<domain>:…' (and similar) ------------------
  steps.push({
    label: "step 1c (scope_id '<x>:<domain>:…' second segment)",
    updateSql: `
      UPDATE memory_records
         SET ${backfillSet("split_part(scope_id, ':', 2)")}
       WHERE ${UNTAGGED_WHERE}
         AND scope_id IS NOT NULL
         AND array_length(string_to_array(scope_id, ':'), 1) >= 2
         AND split_part(scope_id, ':', 2) = ANY(${keysArrayLiteral})
    `,
    countSql: `
      SELECT count(*)::int AS n FROM memory_records
       WHERE ${UNTAGGED_WHERE}
         AND scope_id IS NOT NULL
         AND array_length(string_to_array(scope_id, ':'), 1) >= 2
         AND split_part(scope_id, ':', 2) = ANY(${keysArrayLiteral})
    `,
  });

  // ---- Step 2: provenance_source substring matches ------------------------
  for (const { domain, needles } of PROVENANCE_PATTERNS) {
    const ilikeClauses = needles.map((_, i) => `provenance_source ILIKE $${i + 1}`).join(' OR ');
    const params = needles.map((n) => `%${n}%`);
    steps.push({
      label: `step 2 (provenance → ${domain})`,
      updateSql: `
        UPDATE memory_records
           SET ${backfillSet(`'${domain}'::text`)}
         WHERE ${UNTAGGED_WHERE}
           AND (${ilikeClauses})
      `,
      countSql: `
        SELECT count(*)::int AS n FROM memory_records
         WHERE ${UNTAGGED_WHERE}
           AND (${ilikeClauses})
      `,
      params,
    });
  }

  // ---- Step 3: linked_entities → cst_nodes.domain (majority vote) ---------
  // Multi-table UPDATE; the dry-run path uses the dedicated SELECT count.
  const linkedEntitiesPredicate = `
        ${UNTAGGED_WHERE}
    AND jsonb_typeof(linked_entities) = 'array'
    AND jsonb_array_length(linked_entities) > 0
    AND EXISTS (
      SELECT 1
        FROM jsonb_array_elements_text(linked_entities) AS le(eid)
        JOIN cst_nodes n
          ON le.eid ~ '^[0-9a-fA-F-]{36}$'
         AND n.id = le.eid::uuid
    )
  `;
  steps.push({
    label: 'step 3 (linked_entities majority)',
    updateSql: `
      UPDATE memory_records mr
         SET ${backfillSet('t.inferred_domain', 'mr.scope_id', 'mr.metadata')}
        FROM (
          SELECT mr2.id AS mr_id,
                 (
                   SELECT n.domain
                     FROM jsonb_array_elements_text(mr2.linked_entities) AS le(eid)
                     JOIN cst_nodes n
                       ON le.eid ~ '^[0-9a-fA-F-]{36}$'
                      AND n.id = le.eid::uuid
                    GROUP BY n.domain
                    ORDER BY count(*) DESC, n.domain ASC
                    LIMIT 1
                 ) AS inferred_domain
            FROM memory_records mr2
           WHERE ${UNTAGGED_WHERE.replace(/metadata/g, 'mr2.metadata')}
             AND jsonb_typeof(mr2.linked_entities) = 'array'
             AND jsonb_array_length(mr2.linked_entities) > 0
        ) t
       WHERE mr.id = t.mr_id
         AND t.inferred_domain IS NOT NULL
    `,
    countSql: `
      SELECT count(*)::int AS n FROM memory_records
       WHERE ${linkedEntitiesPredicate}
    `,
  });

  // ---- Step 4: fallback to MEMORY_DOMAIN_UNKNOWN --------------------------
  steps.push({
    label: `step 4 (fallback → ${MEMORY_DOMAIN_UNKNOWN})`,
    updateSql: `
      UPDATE memory_records
         SET ${backfillSet(`'${MEMORY_DOMAIN_UNKNOWN}'::text`)}
       WHERE ${UNTAGGED_WHERE}
    `,
    countSql: `
      SELECT count(*)::int AS n FROM memory_records
       WHERE ${UNTAGGED_WHERE}
    `,
  });

  return steps;
}

interface ParityRow {
  domain: string;
  oldCount: number;
  newCount: number;
  oldOnly: number;
  newOnly: number;
}

/**
 * For each known domain, compare the row set the *old* four-signal query
 * would have returned against the *new* single-equality query. The new set
 * must be a strict superset (it's allowed to include rows resolved by the
 * backfill that the old query already covered via scope_id/provenance).
 *
 * Returns a list of (domain → counts) rows. The caller decides whether to
 * fail on missing rows.
 *
 * Notes:
 *   - The "old" `scope_id LIKE 'domain:<d>%'` predicate matches both rows
 *     that were ALREADY canonical pre-backfill and rows the backfill just
 *     canonicalised. To make the comparison meaningful for legacy rows whose
 *     original scope was not `domain:<d>`, we OR in
 *     `metadata->>'legacyScopeId'` against the same patterns the old query
 *     would have applied.
 *   - For linked-entity matching the old query joined to `cst_nodes.domain`;
 *     we replicate that here.
 */
async function runParityVerification(): Promise<ParityRow[]> {
  const results: ParityRow[] = [];
  for (const domain of SCOPE_DOMAIN_KEYS) {
    const params = [domain, `domain:${domain}%`, `%${domain}%`];
    const sql = `
      WITH old_set AS (
        SELECT id FROM memory_records
         WHERE metadata->>'domain' = $1
            OR scope_id LIKE $2
            OR (metadata->>'legacyScopeId') LIKE $2
            OR provenance_source ILIKE $3
            OR EXISTS (
              SELECT 1
                FROM jsonb_array_elements_text(linked_entities) AS le(eid)
                JOIN cst_nodes n
                  ON le.eid ~ '^[0-9a-fA-F-]{36}$'
                 AND n.id = le.eid::uuid
               WHERE n.domain = $1
            )
      ),
      new_set AS (
        SELECT id FROM memory_records WHERE metadata->>'domain' = $1
      )
      SELECT
        (SELECT count(*) FROM old_set)::int AS old_count,
        (SELECT count(*) FROM new_set)::int AS new_count,
        (SELECT count(*) FROM old_set WHERE id NOT IN (SELECT id FROM new_set))::int AS old_only,
        (SELECT count(*) FROM new_set WHERE id NOT IN (SELECT id FROM old_set))::int AS new_only
    `;
    const { rows } = await pool.query<{
      old_count: number;
      new_count: number;
      old_only: number;
      new_only: number;
    }>(sql, params);
    const r = rows[0]!;
    results.push({
      domain,
      oldCount: r.old_count,
      newCount: r.new_count,
      oldOnly: r.old_only,
      newOnly: r.new_only,
    });
  }
  return results;
}

async function reportParity(rows: ParityRow[]): Promise<void> {
  let regressions = 0;
  for (const r of rows) {
    const _flag = r.oldOnly > 0 ? '  <-- REGRESSION' : '';
    if (r.oldOnly > 0) regressions++;
  }
  if (regressions > 0) {
    throw new Error(
      `[backfill-memory-domain] parity check failed: ${regressions} domain(s) lost rows under the new query. Investigate the rows reported as old-only.`,
    );
  }
}

async function backfill(): Promise<void> {

  if (!VERIFY_ONLY) {
    // Snapshot the universe we're trying to fix, so the final spot-check has a
    // baseline number to compare against.
    const { rows: untaggedBefore } = await pool.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM memory_records WHERE ${UNTAGGED_WHERE}`,
    );
    const untaggedTotal = untaggedBefore[0]?.n ?? 0;

    if (untaggedTotal > 0) {
      const results: Array<{ label: string; rowsAffected: number }> = [];
      for (const step of buildSteps()) {
        results.push(await runStep(step));
      }
      const _totalUpdated = results.reduce((s, r) => s + r.rowsAffected, 0);
    } else {
    }

    // ---- Spot-check: per-domain distribution after the run ---------------
    const { rows: distribution } = await pool.query<{ domain: string; n: number }>(
      `SELECT COALESCE(metadata->>'domain', '<missing>') AS domain, count(*)::int AS n
         FROM memory_records
        GROUP BY 1
        ORDER BY n DESC`,
    );
    for (const row of distribution) {
      const _known = (KNOWN_MEMORY_DOMAINS as readonly string[]).includes(row.domain)
        ? ''
        : ' (unknown key)';
    }

    // Sanity check the runtime invariant: after a non-dry-run sweep, no row
    // should be missing the domain tag.
    if (!DRY_RUN) {
      const { rows: leftover } = await pool.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM memory_records WHERE ${UNTAGGED_WHERE}`,
      );
      const remaining = leftover[0]?.n ?? 0;
      if (remaining > 0) {
        throw new Error(
          `[backfill-memory-domain] invariant violated: ${remaining} row(s) still lack metadata.domain after backfill`,
        );
      }
    }
  }

  // ---- Parity verification (always runs, including dry-run) --------------
  const parity = await runParityVerification();
  await reportParity(parity);
}

backfill()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (_err) => {
    try {
      await pool.end();
    } catch {
      /* ignore */
    }
    process.exit(1);
  });
