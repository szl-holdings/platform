/**
 * Architecture test: loose mount coverage guardrail
 *
 * Ensures that every non-group router.use() call in routes/index.ts
 * (lazyMatch, lazyMount, lazyRegisterMatch, or direct router mount)
 * is explicitly categorized and position-verified:
 *
 *   • Pre-guardianPolicyCheck mounts must appear in ALLOWED_PUBLIC_MOUNTS
 *     with a documented reason explaining why they are safe without the
 *     global Guardian policy gate.
 *
 *   • Post-guardianPolicyCheck mounts must appear in GUARDIAN_GATED_MOUNTS.
 *     They are covered by the global Guardian policy gate that runs before
 *     them in the Express middleware chain.
 *
 * The test enforces bidirectional position checks: public mounts must
 * actually be before the guardian line, gated mounts must actually be
 * after it. A mount that appears in the wrong category relative to its
 * source position fails CI.
 *
 * ADDING A NEW LOOSE MOUNT:
 *   If your mount is BEFORE guardianPolicyCheck() in index.ts:
 *     → Add it to ALLOWED_PUBLIC_MOUNTS with a reason string explaining
 *       the auth strategy (public, webhook, handler-level auth, etc.).
 *
 *   If your mount is AFTER guardianPolicyCheck() in index.ts:
 *     → Add it to GUARDIAN_GATED_MOUNTS.
 *
 *   Do NOT add entries without genuine justification.
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const INDEX_FILE = path.join(__dirname, '../index.ts');

// ---------------------------------------------------------------------------
// ALLOWED_PUBLIC_MOUNTS — pre-guardianPolicyCheck
// ---------------------------------------------------------------------------
// Every mount registered BEFORE guardianPolicyCheck() in index.ts must
// appear here with a documented reason explaining why it is safe to serve
// without the global Guardian policy gate.
// ---------------------------------------------------------------------------

const ALLOWED_PUBLIC_MOUNTS: Record<string, string> = {
  'carlota-time-tracking':
    'Public — Carlota Jo time-tracking & invoices, no per-tenant data',
  'carlota-jo-invoice-email':
    'Public — invoice email handler, no per-tenant data',
  'carlota-metrics':
    'Public — dashboard KPI endpoints, no per-tenant data',
  'page-view-tracking':
    'Public — anonymous page-view tracking',
  'analytics-engine-public':
    'Public — anonymous analytics-engine ingest',
  'newsletter':
    'Public — newsletter subscribe proxy',
  'self-healing':
    'Public — self-healing orchestrator read-only GETs',
  'simulation-whatif':
    'Public — simulation what-if engine POST route',
  'stress-drill':
    'Public — adversarial stress-drill suite, in-memory only',
  'scenario-backtest':
    'Public — causal scenario backtest, historical event replay',
  'scenarios':
    'Public — causal scenario & shock-propagation engine demo',
  'monte-carlo-fabric':
    'Public — Monte Carlo stochastic simulation demo',
  'data-fabric':
    'Public — Premium Data Fabric adapter registry, health, cost read-only',
  'terra-cap-rate':
    'Public — Terra predictive cap-rate ML model',
  'vessels-voyage-calc':
    'Public — Vessels voyage economics calculator',
  'infrastructure-status':
    'Public — infrastructure health page',
  'public-status':
    'Public — platform status page, uptime-history, incidents',
  'counsel':
    'Public — Counsel matters CRUD demo surface',
  'counsel-clauses':
    'Public — Counsel Clause Genome library and drafting agent',
  'counsel-knowledge':
    'Public — Counsel Knowledge Index graph+vector RAG',
  'esignature':
    'Public — Counsel E-Signature DocuSign adapter',
  'court-filings':
    'Public — Counsel Court Filing Automation',
  'v1-mission-runbooks':
    'Public — Mission Runbooks CRUD + run orchestration for command UI',
  'public-api-v1':
    'Public — developer-facing versioned REST surface with OpenAPI spec',
  'fabric':
    'Public — Global Operations Fabric read-only snapshot + SSE stream',
  'narratives':
    'Public — read-only narrative payloads',
  'action-store':
    'Public — shared action store, unauthenticated',
  'continuum-policy-compiler':
    'Public — Continuum Policy Authoring Studio demo surface',
  'competitive-intel':
    'Public — Competitive Intel monitor, Atlas demo surface',
  'risk-evidence':
    'Public — shared risk evidence store',
  'agent-mesh':
    'Public — Agent Mesh telemetry read-only for Sentra/Pulse maps',
  'geo-intel':
    'Public — GETs for Command geo-intel map; writes require auth in handlers',
  'rf-intel':
    'Public — RF Intelligence satellite AIS correlation and anomaly detection',
  'sentra':
    'Public — Sentra cyber cockpit demo, CSRF-protected writes',
  'sentra-agents':
    'Public — Sentra EDR agent enrollment tokens and heartbeat',
  'sentra-siem':
    'Public — Sentra SIEM adapter webhook ingest from external SIEMs',
  'sentra-siem-export':
    'Public — Sentra SIEM Export with bulk rate limit',
  'sentra-hunt':
    'Public — Sentra Threat Hunter hunt and remediation plan approval',
  'sentra-pages':
    'Public — Sentra research surfaces read-only datasets',
  'crisis-arena':
    'Public — Crisis Arena leaderboard; client/architect endpoints require auth',
  'lyte-surfaces':
    'Public — Lyte legacy surfaces read-only GETs for 5 legacy pages',
  'lyte-intel':
    'Public — Lyte intel surfaces read-only',
  'lyte-market':
    'Public — Lyte market indicators delayed/EOD macro feed',
  'n8n':
    'Public — n8n Automation Bridge proxy, 503 when unconfigured',
  'helios':
    'Public — Helios Frontier Intelligence demo surface',
  'meridian':
    'Public — Continuum Meridian read-only intelligence surfaces',
  'meridian-mcp-activation':
    'Public — Meridian MCP Activation registry read-only',
  'marketplace':
    'Public — MCP Public Trust Layer server directory and discovery',
  'v1-guard':
    'Public — Lambda-as-a-Service (LaaS) stateless guard endpoint, Zod-validated, no PII or session',

  'emailWebhooksRouter':
    'Webhook receiver — email provider bounces, complaints, unsubscribe',
  'publicA11oyRouter':
    'Public — A11oy unauthenticated read-only constellation/architecture',
  'internalA11oyRouter':
    'Handler-level auth — A11oy authenticated operational routes',
  'internalA11oyDefenseRouter':
    'Public — A11oy internal defense read-only endpoints for 6 defense pages',
  'a11oySovereignRouter':
    'Public — A11oy Sovereign API (Phase 3) execution lab endpoints',
  'a11oyRuntimeRouter':
    'Public — A11oy Runtime API (Phase 2) operators, MirrorEval, PCE gate',
  'a11oyFabricRouter':
    'Public — A11oy Fabric API read-only enterprise execution fabric',
  'a11oyCognitiveRuntimeRouter':
    'Public (demo surface) — A11oy Cognitive Runtime API; tenant resolved from X-Tenant-Id header; handler-level scoping; no session auth required in demo mode.',
  'replay-attestation':
    'Public — replay attestation, governance stats, and .well-known attestation keys; no per-tenant session required',
  'sentra-threat-feeds':
    'Public — Sentra external threat-feed ingest and aggregation surface',
  'sentra-ml-scoring':
    'Public — Sentra ML anomaly scoring and model-health endpoints',
  'sentra-a11oy':
    'Public — Sentra ↔ A11oy bridge read-only telemetry surface',
  'doctrine-crud':
    'Public — Doctrine governance rule CRUD demo surface',
  'os-layer-api':
    'Public — OS Layer v1 action recommendations; read-only advisory surface',
};

// ---------------------------------------------------------------------------
// GUARDIAN_GATED_MOUNTS — post-guardianPolicyCheck
// ---------------------------------------------------------------------------
// Every mount registered AFTER guardianPolicyCheck() in index.ts must appear
// here. These mounts are covered by the global Guardian policy gate that
// runs before them in the Express middleware chain, so they do not need
// individual auth documentation.
// ---------------------------------------------------------------------------

const GUARDIAN_GATED_MOUNTS = new Set([
  'pulse',
  'pulse-aliased',
  'pulse-org',
  'executive-briefings',
  'evals',
  'briefings',
  'drift',
  'deployments',
  'teams',
  'teams-user-pages',
  'domains',
  'constellation-views',
  'fund-inbound-deals',
  'aegis-pcap',
  'aegis-investor-deck',
  'lp-portal',
  'traces',
  'v1-approvals',
  'v1-runs',
  'reflections',
  'plans',
  'replay',
  'trust-provenance',
  'mcp-gateway',
  'tool-mesh',
  'hf-mcp-proxy',
  'hf-status',
  'hf-intelligence',
  'provenance',
  'nexus-v1',
  'nexus-mcp',
  'nexus',
  'intelligence-economics',
  'ontology',
  'cognitive-runtime',
  'agents',
  'sandbox',
  'atlas-artifacts',
  'atlas-scene-export',
  'outcome-graph',
  'evidence-graph',
  'maps',
  'debug',
  'preferences',
  'policy-modes',
  'demo-governed-scenarios',
  'signal-bus',
  'outbound-gateway',
  'document-lifecycle',
  'fund-management',
  'aegis-export',
  'mobile-biometric',
  'evolution',
  'ecosystem-command',
  'omnia',
  'conduit',
  'carlota-drip',
  'carlota-jo',
  'feature-flags-public',
  'eval-registry',
  'decisionsRuntimeRouter',
  'apiKeysRouter',
  'oauthRouter',
  'meshObservabilityRouter',
  'openaiConversationsRouter',
  'alloy-agentic-rag',
  'sigil',
  'ouroboros-gauss',
  'ouroboros-guardrails',
  'a11oy-chat',
  'runtime-config',
  'lexicon',
  'os-layer-actions',
  'praxis-tools',
  'ai-gateway',
  'hf-jobs',
  'nexus-kernel',
  'ouroboros',
  'alloy-forge',
]);

// ---------------------------------------------------------------------------
// Extraction helpers
// ---------------------------------------------------------------------------

/**
 * Extract every lazy-helper label from index.ts.
 *
 * lazyMatch / lazyMount / lazyRegisterMatch always receive a label as
 * their last string argument. This function finds each call, walks the
 * balanced parentheses, and returns the last kebab-case string at the
 * top-level depth of the call.
 */
function extractLazyLabels(content: string): string[] {
  const labels: string[] = [];
  const callSite = /lazy(?:Match|Mount|RegisterMatch)\s*\(/g;
  let hit: RegExpExecArray | null;

  while ((hit = callSite.exec(content)) !== null) {
    const start = hit.index + hit[0].length;
    let depth = 1;
    let lastLabel = '';

    for (let i = start; i < content.length && depth > 0; i++) {
      const ch = content[i];

      if (ch === '"') {
        const close = content.indexOf('"', i + 1);
        if (close < 0) break;
        const str = content.substring(i + 1, close);
        if (depth === 1 && /^[a-z][a-z0-9-]*$/.test(str)) {
          lastLabel = str;
        }
        i = close;
        continue;
      }

      if (ch === '(') depth++;
      if (ch === ')') depth--;
    }

    if (lastLabel) labels.push(lastLabel);
  }

  return labels;
}

/**
 * Extract every directly-mounted router from index.ts.
 *
 * Matches ALL default imports from relative `./` paths (e.g.
 * `import fooRouter from "./foo"`) that are subsequently passed to
 * `router.use(…)`. Does not rely on naming convention — any default
 * import from a route module that appears in a router.use() call is
 * captured.
 */
function extractDirectRouterMounts(content: string): string[] {
  const names: string[] = [];
  for (const m of content.matchAll(
    /import\s+(\w+)\s+from\s+["']\.\/[^"']+["']/g,
  )) {
    const name = m[1];
    const usePattern = new RegExp(
      `router\\.use\\([^;]*\\b${name}\\b`,
    );
    if (usePattern.test(content)) {
      names.push(name);
    }
  }
  return names;
}

/**
 * Find the source line index (0-based) where a mount is registered.
 *
 * For lazy labels, searches for `"label"` in the source.
 * For direct mounts, searches for the variable name in a router.use() call.
 */
function findMountLineIndex(
  lines: string[],
  key: string,
  directMountSet: Set<string>,
): number {
  if (directMountSet.has(key)) {
    return lines.findIndex(
      (l) => /router\.use\(/.test(l) && l.includes(key),
    );
  }
  return lines.findIndex((l) => l.includes(`"${key}"`));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Loose mount coverage guardrail', () => {
  const content = fs.readFileSync(INDEX_FILE, 'utf-8');
  const lines = content.split('\n');
  const lazyLabels = extractLazyLabels(content);
  const directMounts = extractDirectRouterMounts(content);
  const directMountSet = new Set(directMounts);
  const allMounts = [...lazyLabels, ...directMounts];

  const guardianLineIdx = lines.findIndex((l) =>
    /router\.use\(\s*guardianPolicyCheck\s*\(/.test(l),
  );

  /**
   * T1: guardianPolicyCheck() must exist in index.ts.
   * Without it, the entire gated-mount category is meaningless.
   */
  it('guardianPolicyCheck() is present in index.ts', () => {
    expect(
      guardianLineIdx,
      'Could not find router.use(guardianPolicyCheck()) in index.ts. ' +
        'The global Guardian policy gate is required for the gated-mount category.',
    ).toBeGreaterThan(-1);
  });

  /**
   * T2: Every mount in index.ts must be categorized in exactly one of
   * ALLOWED_PUBLIC_MOUNTS or GUARDIAN_GATED_MOUNTS.
   */
  it('every loose mount is categorized (public or guardian-gated)', () => {
    const uncategorized = allMounts.filter(
      (key) =>
        !Object.prototype.hasOwnProperty.call(ALLOWED_PUBLIC_MOUNTS, key) &&
        !GUARDIAN_GATED_MOUNTS.has(key),
    );
    expect(
      uncategorized,
      `Found ${uncategorized.length} loose mount(s) in index.ts that are not categorized:\n` +
        `  ${uncategorized.join(', ')}\n\n` +
        `Every mount must appear in exactly one of:\n` +
        `  • ALLOWED_PUBLIC_MOUNTS — if it is BEFORE guardianPolicyCheck() and\n` +
        `    intentionally unauthenticated (with a documented reason), or\n` +
        `  • GUARDIAN_GATED_MOUNTS — if it is AFTER guardianPolicyCheck() and\n` +
        `    covered by the global Guardian policy gate.\n\n` +
        `Do NOT add entries without genuine justification.`,
    ).toEqual([]);
  });

  /**
   * T3: No mount should appear in both categories.
   */
  it('no mount appears in both ALLOWED_PUBLIC_MOUNTS and GUARDIAN_GATED_MOUNTS', () => {
    const overlap = Object.keys(ALLOWED_PUBLIC_MOUNTS).filter((key) =>
      GUARDIAN_GATED_MOUNTS.has(key),
    );
    expect(
      overlap,
      `These mounts appear in both ALLOWED_PUBLIC_MOUNTS and GUARDIAN_GATED_MOUNTS:\n` +
        `  ${overlap.join(', ')}\n\n` +
        `Each mount must be in exactly one category. Remove the duplicate.`,
    ).toEqual([]);
  });

  /**
   * T4: Mounts in ALLOWED_PUBLIC_MOUNTS must actually appear BEFORE
   * guardianPolicyCheck() in the source. If a mount is after the
   * guardian gate, it should be in GUARDIAN_GATED_MOUNTS instead.
   */
  it('ALLOWED_PUBLIC_MOUNTS entries are before guardianPolicyCheck()', () => {
    const misplaced: string[] = [];
    for (const key of Object.keys(ALLOWED_PUBLIC_MOUNTS)) {
      const lineIdx = findMountLineIndex(lines, key, directMountSet);
      if (lineIdx !== -1 && lineIdx > guardianLineIdx) {
        misplaced.push(key);
      }
    }
    expect(
      misplaced,
      `These mounts are in ALLOWED_PUBLIC_MOUNTS but appear AFTER\n` +
        `guardianPolicyCheck() (line ${guardianLineIdx + 1}):\n` +
        `  ${misplaced.join(', ')}\n\n` +
        `Mounts after guardianPolicyCheck() are already auth-gated.\n` +
        `Move them to GUARDIAN_GATED_MOUNTS instead.`,
    ).toEqual([]);
  });

  /**
   * T5: Mounts in GUARDIAN_GATED_MOUNTS must actually appear AFTER
   * guardianPolicyCheck() in the source. If a mount is before the
   * guardian gate, it needs a documented public reason instead.
   */
  it('GUARDIAN_GATED_MOUNTS entries are after guardianPolicyCheck()', () => {
    const misplaced: string[] = [];
    for (const key of GUARDIAN_GATED_MOUNTS) {
      const lineIdx = findMountLineIndex(lines, key, directMountSet);
      if (lineIdx !== -1 && lineIdx < guardianLineIdx) {
        misplaced.push(key);
      }
    }
    expect(
      misplaced,
      `These mounts are in GUARDIAN_GATED_MOUNTS but appear BEFORE\n` +
        `guardianPolicyCheck() (line ${guardianLineIdx + 1}):\n` +
        `  ${misplaced.join(', ')}\n\n` +
        `Pre-guardian mounts are NOT covered by the global policy gate.\n` +
        `Either move them after guardianPolicyCheck() in index.ts, or\n` +
        `move them to ALLOWED_PUBLIC_MOUNTS with a documented reason\n` +
        `explaining why they are safe without the gate.`,
    ).toEqual([]);
  });

  /**
   * T6: ALLOWED_PUBLIC_MOUNTS has no stale entries.
   */
  it('ALLOWED_PUBLIC_MOUNTS has no stale entries', () => {
    const stale = Object.keys(ALLOWED_PUBLIC_MOUNTS).filter(
      (key) => !allMounts.includes(key),
    );
    expect(
      stale,
      `ALLOWED_PUBLIC_MOUNTS contains entries not found in index.ts:\n` +
        `  ${stale.join(', ')}\n\n` +
        `Remove stale entries when mounts are renamed or deleted.`,
    ).toEqual([]);
  });

  /**
   * T7: GUARDIAN_GATED_MOUNTS has no stale entries.
   */
  it('GUARDIAN_GATED_MOUNTS has no stale entries', () => {
    const stale = [...GUARDIAN_GATED_MOUNTS].filter(
      (key) => !allMounts.includes(key),
    );
    expect(
      stale,
      `GUARDIAN_GATED_MOUNTS contains entries not found in index.ts:\n` +
        `  ${stale.join(', ')}\n\n` +
        `Remove stale entries when mounts are renamed or deleted.`,
    ).toEqual([]);
  });

  /**
   * T8: Sanity check — the extraction finds a known core set of lazy labels.
   */
  it('extraction finds the known core set of lazy labels', () => {
    const KNOWN_LABELS = [
      'pulse',
      'narratives',
      'action-store',
      'fabric',
      'sentra',
      'helios',
      'meridian',
      'nexus',
      'omnia',
      'conduit',
      'ontology',
      'signal-bus',
    ];
    for (const label of KNOWN_LABELS) {
      expect(
        lazyLabels,
        `Expected extractLazyLabels() to find "${label}" in index.ts but it was ` +
          `missing. If the lazy-helper call pattern changed, update the ` +
          `extraction logic in this test file.`,
      ).toContain(label);
    }
  });

  /**
   * T9: Sanity check — the extraction finds a known core set of direct mounts.
   */
  it('extraction finds the known core set of direct router mounts', () => {
    const KNOWN_ROUTERS = [
      'emailWebhooksRouter',
      'apiKeysRouter',
      'oauthRouter',
      'decisionsRuntimeRouter',
      'openaiConversationsRouter',
    ];
    for (const name of KNOWN_ROUTERS) {
      expect(
        directMounts,
        `Expected extractDirectRouterMounts() to find "${name}" in index.ts ` +
          `but it was missing. If the import or router.use() pattern changed, ` +
          `update the extraction logic in this test file.`,
      ).toContain(name);
    }
  });
});
