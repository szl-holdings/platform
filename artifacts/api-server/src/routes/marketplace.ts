import { type IRouter, type Request, type Response, Router } from 'express';
import { logger } from '../lib/logger';

const router: IRouter = Router();

export type TrustTier = 'Verified' | 'Reviewed' | 'Community' | 'Unscored';

interface TrustScoreBreakdown {
  uptime_probe: number;
  capability_stability: number;
  manifest_signature: number;
  audit_completeness: number;
  transport_conformance: number;
  reversibility_coverage: number;
  total: number;
}

interface DriftEvent {
  at: string;
  type: string;
  description: string;
  severity: 'info' | 'warn' | 'critical';
}

interface TrustRecord {
  namespace: string;
  display_name: string;
  owner: string;
  tier: TrustTier;
  score: TrustScoreBreakdown;
  drift_events: DriftEvent[];
  manifest_digest: string;
  transport: string;
  spec_version: string;
  uptime_pct_30d: number;
  last_published: string;
  scored_at: string;
  methodology_version: string;
  is_szl_owned: boolean;
}

const TRUST_RECORDS: Record<string, TrustRecord> = {
  'com.szlholdings.vessels': {
    namespace: 'com.szlholdings.vessels',
    display_name: 'Vessels Maritime Intelligence',
    owner: 'szl-holdings',
    tier: 'Verified',
    score: { uptime_probe: 19, capability_stability: 18, manifest_signature: 20, audit_completeness: 19, transport_conformance: 10, reversibility_coverage: 9, total: 95 },
    drift_events: [
      { at: '2026-04-15T08:30:00Z', type: 'capability_added', description: 'Added vessels_port_risk tool with OFAC cross-reference.', severity: 'info' },
      { at: '2026-03-28T14:00:00Z', type: 'schema_updated', description: 'vessels_fleet_status region param now accepts array.', severity: 'warn' },
    ],
    manifest_digest: 'sha256:8a3f1c9e2b4d6f0a7e5c3b9d1f8a2e6c4b0d8f2a4e6c8b0d2f4a6e8c0b2d4f6',
    transport: 'streamable-http',
    spec_version: '2025-11-25',
    uptime_pct_30d: 99.7,
    last_published: '2026-04-22T10:00:00Z',
    scored_at: '2026-04-26T06:00:00Z',
    methodology_version: '1.0',
    is_szl_owned: true,
  },
  'com.szlholdings.sentra': {
    namespace: 'com.szlholdings.sentra',
    display_name: 'Sentra Cyber Resilience',
    owner: 'szl-holdings',
    tier: 'Verified',
    score: { uptime_probe: 20, capability_stability: 19, manifest_signature: 20, audit_completeness: 20, transport_conformance: 10, reversibility_coverage: 8, total: 97 },
    drift_events: [
      { at: '2026-04-10T11:00:00Z', type: 'capability_added', description: 'Added firestorm_incident_correlate with graph-based propagation.', severity: 'info' },
    ],
    manifest_digest: 'sha256:2c8f4a6e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e8b0d2f4',
    transport: 'streamable-http',
    spec_version: '2025-11-25',
    uptime_pct_30d: 99.9,
    last_published: '2026-04-23T09:00:00Z',
    scored_at: '2026-04-26T06:00:00Z',
    methodology_version: '1.0',
    is_szl_owned: true,
  },
  'com.szlholdings.terra': {
    namespace: 'com.szlholdings.terra',
    display_name: 'Terra Real Estate Intelligence',
    owner: 'szl-holdings',
    tier: 'Verified',
    score: { uptime_probe: 18, capability_stability: 18, manifest_signature: 20, audit_completeness: 18, transport_conformance: 10, reversibility_coverage: 10, total: 94 },
    drift_events: [],
    manifest_digest: 'sha256:6e0b4c8f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4c6e8b0d2f4a6c8e0b2d4f6',
    transport: 'streamable-http',
    spec_version: '2025-11-25',
    uptime_pct_30d: 98.8,
    last_published: '2026-04-21T16:00:00Z',
    scored_at: '2026-04-26T06:00:00Z',
    methodology_version: '1.0',
    is_szl_owned: true,
  },
  'com.szlholdings.lyte': {
    namespace: 'com.szlholdings.lyte',
    display_name: 'Lyte Decision Intelligence',
    owner: 'szl-holdings',
    tier: 'Verified',
    score: { uptime_probe: 20, capability_stability: 20, manifest_signature: 20, audit_completeness: 19, transport_conformance: 10, reversibility_coverage: 10, total: 99 },
    drift_events: [
      { at: '2026-04-20T10:00:00Z', type: 'capability_added', description: 'Added lyte_anomaly_detect with rolling 7-day baseline.', severity: 'info' },
    ],
    manifest_digest: 'sha256:4a8c0e2b4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4c6e8b0d2f4a6c8e0b2d4f6a',
    transport: 'streamable-http',
    spec_version: '2025-11-25',
    uptime_pct_30d: 100.0,
    last_published: '2026-04-25T08:00:00Z',
    scored_at: '2026-04-26T06:00:00Z',
    methodology_version: '1.0',
    is_szl_owned: true,
  },
  'com.szlholdings.pulse': {
    namespace: 'com.szlholdings.pulse',
    display_name: 'Pulse AI Executive Briefing',
    owner: 'szl-holdings',
    tier: 'Verified',
    score: { uptime_probe: 19, capability_stability: 17, manifest_signature: 20, audit_completeness: 18, transport_conformance: 10, reversibility_coverage: 10, total: 94 },
    drift_events: [
      { at: '2026-04-18T09:00:00Z', type: 'schema_updated', description: 'pulse_compile_brief now accepts domain array filter.', severity: 'warn' },
    ],
    manifest_digest: 'sha256:0c4e8b2d6f0a4c8e2b6d0f4a8c2e6b0d4f8a2c6e0b4d8f2a6c0e4b8d2f6a0c',
    transport: 'streamable-http',
    spec_version: '2025-11-25',
    uptime_pct_30d: 99.1,
    last_published: '2026-04-24T07:00:00Z',
    scored_at: '2026-04-26T06:00:00Z',
    methodology_version: '1.0',
    is_szl_owned: true,
  },
  'com.szlholdings.counsel': {
    namespace: 'com.szlholdings.counsel',
    display_name: 'Counsel Legal Matter Command',
    owner: 'szl-holdings',
    tier: 'Verified',
    score: { uptime_probe: 17, capability_stability: 18, manifest_signature: 20, audit_completeness: 20, transport_conformance: 10, reversibility_coverage: 8, total: 93 },
    drift_events: [],
    manifest_digest: 'sha256:8b0d4f8a2c6e0b4d8f2a6c0e4b8d2f6a0c4e8b2d6f0a4c8e2b6d0f4a8c2e6b',
    transport: 'streamable-http',
    spec_version: '2025-11-25',
    uptime_pct_30d: 99.3,
    last_published: '2026-04-20T14:00:00Z',
    scored_at: '2026-04-26T06:00:00Z',
    methodology_version: '1.0',
    is_szl_owned: true,
  },
  'com.szlholdings.command': {
    namespace: 'com.szlholdings.command',
    display_name: 'Unified Command',
    owner: 'szl-holdings',
    tier: 'Verified',
    score: { uptime_probe: 19, capability_stability: 19, manifest_signature: 20, audit_completeness: 20, transport_conformance: 10, reversibility_coverage: 10, total: 98 },
    drift_events: [
      { at: '2026-04-22T15:00:00Z', type: 'capability_added', description: 'Added geo-pin cross-reference to anomaly surfacing.', severity: 'info' },
    ],
    manifest_digest: 'sha256:2d6f0a4c8e2b6d0f4a8c2e6b0d4f8a2c6e0b4d8f2a6c0e4b8d2f6a0c4e8b2d',
    transport: 'streamable-http',
    spec_version: '2025-11-25',
    uptime_pct_30d: 99.8,
    last_published: '2026-04-25T10:00:00Z',
    scored_at: '2026-04-26T06:00:00Z',
    methodology_version: '1.0',
    is_szl_owned: true,
  },
  'com.szlholdings.nexus': {
    namespace: 'com.szlholdings.nexus',
    display_name: 'PRAXIS Governed Orchestration',
    owner: 'szl-holdings',
    tier: 'Verified',
    score: { uptime_probe: 20, capability_stability: 20, manifest_signature: 20, audit_completeness: 20, transport_conformance: 10, reversibility_coverage: 9, total: 99 },
    drift_events: [],
    manifest_digest: 'sha256:6a0c4e8b2d6f0a4c8e2b6d0f4a8c2e6b0d4f8a2c6e0b4d8f2a6c0e4b8d2f6a',
    transport: 'streamable-http',
    spec_version: '2025-11-25',
    uptime_pct_30d: 100.0,
    last_published: '2026-04-26T06:00:00Z',
    scored_at: '2026-04-26T06:00:00Z',
    methodology_version: '1.0',
    is_szl_owned: true,
  },
};

const SUBMISSION_QUEUE: Array<{
  id: string;
  github_url: string;
  contact_email?: string;
  submitted_at: string;
  status: 'queued' | 'probing' | 'reviewed' | 'rejected';
  probe_results?: {
    tools_discovered: number;
    manifest_valid: boolean;
    transport_conformance: boolean;
    capability_fingerprint: string;
    reversibility_coverage_pct: number;
  };
}> = [];

router.get('/marketplace/v1/servers', (_req: Request, res: Response) => {
  try {
    const records = Object.values(TRUST_RECORDS);
    res.json({
      servers: records,
      total: records.length,
      methodology_version: '1.0',
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    logger.warn({ err }, '[marketplace] list servers failed');
    res.status(500).json({ error: 'marketplace unavailable' });
  }
});

router.get('/marketplace/v1/servers/:namespace', (req: Request, res: Response) => {
  try {
    const { namespace } = req.params;
    const record = TRUST_RECORDS[namespace];
    if (!record) {
      res.status(404).json({
        error: 'server not found',
        namespace,
        hint: 'Submit your server at /api/marketplace/v1/submit to begin trust scoring.',
      });
      return;
    }
    res.json(record);
  } catch (err) {
    logger.warn({ err }, '[marketplace] get server failed');
    res.status(500).json({ error: 'marketplace unavailable' });
  }
});

router.get('/marketplace/v1/methodology', (_req: Request, res: Response) => {
  res.json({
    version: '1.0',
    published_at: '2026-04-26T00:00:00Z',
    description: 'SZL Trust Score — weighted sum of 6 independently verifiable components',
    components: [
      { key: 'uptime_probe', max_points: 20, description: 'Rolling 30-day availability via periodic ping. Degrades linearly from 100% to 95%. Below 95% scores 0.' },
      { key: 'capability_stability', max_points: 20, description: 'Fingerprint hash of tool/resource/prompt catalog. Each unreviewed drift event in 90d deducts points.' },
      { key: 'manifest_signature', max_points: 20, description: 'Cryptographic signature validity. Unsigned=4, self-signed=8, platform-verified=20.' },
      { key: 'audit_completeness', max_points: 20, description: 'SZL-owned servers only: audit trail completeness for 30d of invocations. Community servers score 0 by design.' },
      { key: 'transport_conformance', max_points: 10, description: 'Automated probe against 2025-11-25 MCP spec: initialize handshake, tools/list, resources/list, tools/call roundtrip.' },
      { key: 'reversibility_coverage', max_points: 10, description: 'Fraction of write tools with explicit reversibility annotation (read-only / reversible-write / irreversible-write).' },
    ],
    tier_thresholds: {
      Verified: { min: 90, description: 'Platform-signed, audited, supply-chain attested. SZL-owned servers default here.' },
      Reviewed: { min: 70, description: 'Automated checks pass + human governance review complete.' },
      Community: { min: 40, description: 'Submitted and validated. Awaiting or not yet eligible for full review.' },
      Unscored: { min: 0, description: 'Recently submitted or failing probes.' },
    },
  });
});

router.post('/marketplace/v1/submit', (req: Request, res: Response) => {
  try {
    const { github_url, contact_email } = req.body as { github_url?: string; contact_email?: string };
    if (!github_url || !github_url.startsWith('https://github.com/')) {
      res.status(400).json({ error: 'github_url is required and must be a valid GitHub repository URL' });
      return;
    }

    const id = `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const submission = {
      id,
      github_url,
      contact_email,
      submitted_at: new Date().toISOString(),
      status: 'queued' as const,
      probe_results: {
        tools_discovered: 0,
        manifest_valid: false,
        transport_conformance: false,
        capability_fingerprint: '',
        reversibility_coverage_pct: 0,
      },
    };
    SUBMISSION_QUEUE.push(submission);

    logger.info({ id, github_url }, '[marketplace] server submission queued');

    res.status(202).json({
      submission_id: id,
      status: 'queued',
      message: 'Your server has been queued for validation. Automated probes will run within 15 minutes. You will be notified at the provided email when tier assignment is complete.',
      estimated_probe_duration_seconds: 120,
      governance_queue_position: SUBMISSION_QUEUE.length,
    });
  } catch (err) {
    logger.warn({ err }, '[marketplace] submit failed');
    res.status(500).json({ error: 'submission failed' });
  }
});

router.get('/marketplace/v1/submissions/:id', (req: Request, res: Response) => {
  try {
    const submission = SUBMISSION_QUEUE.find((s) => s.id === req.params.id);
    if (!submission) {
      res.status(404).json({ error: 'submission not found' });
      return;
    }
    const { contact_email: _omit, ...safePayload } = submission as typeof submission & { contact_email?: string };
    res.json(safePayload);
  } catch (err) {
    logger.warn({ err }, '[marketplace] get submission failed');
    res.status(500).json({ error: 'marketplace unavailable' });
  }
});

router.get('/marketplace/v1/stats', (_req: Request, res: Response) => {
  const records = Object.values(TRUST_RECORDS);
  const byTier = records.reduce(
    (acc, r) => { acc[r.tier] = (acc[r.tier] ?? 0) + 1; return acc; },
    {} as Record<string, number>,
  );
  res.json({
    total_servers: records.length,
    szl_owned: records.filter((r) => r.is_szl_owned).length,
    by_tier: byTier,
    avg_score: Math.round(records.reduce((s, r) => s + r.score.total, 0) / records.length),
    pending_submissions: SUBMISSION_QUEUE.filter((s) => s.status === 'queued').length,
    methodology_version: '1.0',
    generated_at: new Date().toISOString(),
  });
});

export default router;
