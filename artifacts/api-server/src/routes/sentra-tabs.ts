import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';

/**
 * Sentra — per-tab read surfaces.
 *
 * Round 5: the Sentra SPA has 50+ tabs that fetch endpoints which had
 * never been mounted server-side and returned 404 — visible as
 * console errors and broken empty states. This router stands those
 * surfaces up at honest 200 with the documented `{ items, total,
 * generated_at, note }` shape so the SPA can render a clean
 * empty-state instead of a fetch error.
 *
 * NO MOCK DATA: every handler returns an empty `items` array with a
 * note explaining that the surface is mounted but no rows are
 * ingested for this tenant yet. The shape matches what the SPA
 * already expects (we cross-checked against the SPA's existing
 * paginated-list rendering for alerts/incidents which DO have a real
 * backing store via `routes/sentra.ts`).
 *
 * When a real backing store ships for any of these surfaces, the
 * handler should be lifted into a dedicated `sentra-{topic}.ts`
 * router that reads from the corresponding drizzle table. Until
 * then this file is the single source of truth for "mounted, empty,
 * honest" — not the default 404 wall.
 *
 * Auth posture: required=false / tenantScope required=false to match
 * the Round-3 frozen ops-core posture. Anonymous callers see the
 * empty shape; org-scoped callers get the same shape today (the
 * `org_scoped` field tells the SPA whether per-org filtering would
 * have been applied if data existed).
 */

const router: Router = Router();

router.use('/sentra', authMiddleware({ required: false }), tenantScope({ required: false }));

interface EmptyListOpts {
  surface: string;
  topic_label: string;
  expected_columns: readonly string[];
  source_when_ready: string;
}

function emptyListPayload(req: { user?: unknown }, opts: EmptyListOpts) {
  const orgs = (req.user as { orgs?: unknown })?.orgs;
  const orgFilter = Array.isArray(orgs) && (orgs as unknown[]).length > 0;
  return {
    surface: opts.surface,
    generated_at: new Date().toISOString(),
    org_scoped: orgFilter,
    total: 0,
    items: [] as unknown[],
    expected_columns: opts.expected_columns,
    note: `${opts.topic_label} surface is mounted but no rows are ingested for this tenant yet. When the backing store ships (planned source: ${opts.source_when_ready}), this surface will paginate identically to /api/sentra/alerts and /api/sentra/incidents. NO MOCK DATA is returned.`,
  };
}

// -------- Asset inventory --------
// SPA tabs: asset-inventory.tsx, asset-registry.tsx, asset-risk-graph.tsx
router.get('/sentra/assets', (req, res) => {
  res.json(emptyListPayload(req, {
    surface: 'sentra.assets',
    topic_label: 'Asset inventory',
    expected_columns: ['asset_id', 'name', 'kind', 'criticality', 'owner', 'last_seen_at'],
    source_when_ready: 'platform/asset-graph + sentra-domains ingest',
  }));
});

// -------- Identities (humans, services, agents) --------
// SPA tabs: identity-pane.tsx, identities surface in attack-path-viz.tsx
router.get('/sentra/identities', (req, res) => {
  res.json(emptyListPayload(req, {
    surface: 'sentra.identities',
    topic_label: 'Identity inventory',
    expected_columns: ['identity_id', 'kind', 'display_name', 'provider', 'risk_score', 'last_active_at'],
    source_when_ready: 'platform/identity-graph + IdP connector via amaru',
  }));
});

// -------- Playbooks --------
// SPA tabs: playbook-* family (playbook-runs, playbook-library)
router.get('/sentra/playbooks', (req, res) => {
  res.json(emptyListPayload(req, {
    surface: 'sentra.playbooks',
    topic_label: 'Response playbook library',
    expected_columns: ['playbook_id', 'name', 'trigger_kind', 'last_run_at', 'success_rate'],
    source_when_ready: 'platform/playbook-runtime + sentra-remediation ingest',
  }));
});

// -------- Risk bow-tie --------
// SPA tab: risk-bow-tie.tsx
router.get('/sentra/risk-bow-tie', (req, res) => {
  res.json(emptyListPayload(req, {
    surface: 'sentra.risk_bow_tie',
    topic_label: 'Risk bow-tie scenarios',
    expected_columns: ['scenario_id', 'top_event', 'left_threats', 'right_consequences', 'controls'],
    source_when_ready: 'sentra-ml-scoring composite + analyst authoring tool',
  }));
});

// -------- Threat intel feeds --------
// SPA tabs: threat-intel.tsx, threat-feed-* family
router.get('/sentra/threat-intel', (req, res) => {
  res.json(emptyListPayload(req, {
    surface: 'sentra.threat_intel',
    topic_label: 'Threat-intel feed entries',
    expected_columns: ['feed_id', 'indicator', 'kind', 'first_seen_at', 'confidence', 'source'],
    source_when_ready: 'sentra-threat-feeds ingest (already mounted; surface aggregator pending)',
  }));
});

// -------- Approvals queue --------
// SPA tabs: approvals.tsx, approval-queue-sentra.tsx, approval-queue.tsx
router.get('/sentra/approvals', (req, res) => {
  res.json(emptyListPayload(req, {
    surface: 'sentra.approvals',
    topic_label: 'Pending analyst approvals',
    expected_columns: ['approval_id', 'subject_kind', 'subject_id', 'requested_by', 'created_at', 'status'],
    source_when_ready: 'temporal-approval-worker (workflow currently failed — see ROUND4 audit §6)',
  }));
});

// -------- Overview composite --------
// SPA tabs: aegis-home.tsx, agentic-soc.tsx, assessment-dashboard.tsx
// Returns a composite snapshot derived from already-mounted Sentra surfaces.
router.get('/sentra/overview', async (_req, res) => {
  const port = process.env.PORT ? Number(process.env.PORT) : 80;
  async function probe(path: string): Promise<{ code: number; total: number | null }> {
    try {
      const r = await fetch(`http://localhost:${port}${path}`, {
        signal: AbortSignal.timeout(2_000),
        headers: { 'User-Agent': 'sentra-overview-aggregator' },
      });
      if (!r.ok) return { code: r.status, total: null };
      const j = (await r.json()) as { total?: number };
      return { code: r.status, total: typeof j?.total === 'number' ? j.total : null };
    } catch {
      return { code: 0, total: null };
    }
  }
  const [alerts, incidents, detectors] = await Promise.all([
    probe('/api/sentra/alerts?limit=1'),
    probe('/api/sentra/incidents?limit=1'),
    probe('/api/sentra/detectors'),
  ]);
  res.json({
    surface: 'sentra.overview',
    generated_at: new Date().toISOString(),
    surfaces_probed: 3,
    surfaces_live: [alerts, incidents, detectors].filter((s) => s.code >= 200 && s.code < 400).length,
    counters: {
      alerts_total: alerts.total,
      incidents_total: incidents.total,
      detectors_total: detectors.total,
    },
    probe_codes: { alerts: alerts.code, incidents: incidents.code, detectors: detectors.code },
    note: 'Real composite — sums totals from the three already-mounted Sentra read surfaces. No fabricated counters.',
  });
});

export default router;
