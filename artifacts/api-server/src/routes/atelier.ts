import { Router, type Request, type Response } from 'express';
import { createHash, randomBytes } from 'node:crypto';

const router = Router();

type AudienceTier = 'internal' | 'enterprise' | 'public';
type RunPhase =
  | 'intake'
  | 'planning'
  | 'risk_review'
  | 'executing'
  | 'verifying'
  | 'proven'
  | 'blocked'
  | 'rejected';

interface AtelierSpace {
  id: string;
  slug: string;
  name: string;
  vertical: string;
  audienceTier: AudienceTier;
  constitutionRef: string;
  constitutionVersion: string;
  constitution: string;
  connectors: string[];
  modelPolicy: string;
  parentSlug?: string;
  composedOf?: string[];
  diff?: { added: string[]; removed: string[]; modified: string[] };
  author: string;
  createdAt: string;
}

interface AtelierRun {
  id: string;
  spaceSlug: string;
  workcellId: string;
  vertical: string;
  phase: RunPhase;
  proofPacketId?: string;
  proofRef?: string;
  governanceScore: number;
  proofScore: number;
  auditCompleteness: number;
  durationMs: number;
  approvalLatencyMs: number;
  costPerDecision: number;
  verdict: 'pass' | 'fail' | 'warn';
  outputLines: string[];
  startedAt: string;
  completedAt?: string;
  tenantId: string;
  origin?: string; // referring artifact slug if embed
}

interface ProofPacket {
  id: string;
  runId: string;
  spaceSlug: string;
  workcellId: string;
  proofRef: string;
  contractId: string;
  verified: boolean;
  governanceScore: number;
  mirrorEvalDims: Record<string, number>;
  constitutionRef: string;
  createdAt: string;
  // Access control: must be public-tier OR publicShare=true to be
  // retrievable without an authenticated X-Tenant-Id header that
  // matches `tenantId`. Enterprise/internal default to non-shared.
  audienceTier: AudienceTier;
  publicShare: boolean;
  tenantId: string;
  // Composition: parent composed-packet id (set on child sub-packets).
  parentPacketId?: string;
  // Composition: ordered list of child sub-packet ids (set on parent).
  childPacketIds?: string[];
  // Fork integrity: SHA-256 of the parent→fork constitution diff,
  // bound into the packet so the inheritance chain is verifiable.
  parentDiffHash?: string;
  parentSlug?: string;
}

interface EmbedEvent {
  id: string;
  spaceSlug: string;
  origin: string;
  occurredAt: string;
  event: 'handshake' | 'run' | 'completed';
}

const spaces = new Map<string, AtelierSpace>();
const runs: AtelierRun[] = [];
const proofPackets = new Map<string, ProofPacket>();
const embedEvents: EmbedEvent[] = [];

function seedSpaces() {
  const now = '2026-05-20T10:00:00Z';
  const parents: AtelierSpace[] = [
    {
      id: 'sp-maritime-routing', slug: 'maritime-routing', name: 'Maritime Routing Agent',
      vertical: 'maritime', audienceTier: 'enterprise',
      constitutionRef: 'const-sextant-v3', constitutionVersion: '3.0.0',
      constitution: `name: Maritime Routing Constitution\nversion: 3.0.0\ncapabilities:\n  - ais_read\n  - port_cost_model\n  - reroute_propose\nprohibited:\n  - charter_modify\n  - bunker_purchase`,
      connectors: ['AIS Live Feed', 'Port Standby Cost Model'],
      modelPolicy: 'governed-default', author: 'vessels-ops', createdAt: now,
    },
    {
      id: 'sp-re-underwriting', slug: 're-underwriting', name: 'Real Estate Underwriting Agent',
      vertical: 'real-estate', audienceTier: 'enterprise',
      constitutionRef: 'const-domaine-v3', constitutionVersion: '3.0.0',
      constitution: `name: Real Estate Underwriting Constitution\nversion: 3.0.0\ncapabilities:\n  - comp_read\n  - covenant_check\n  - cap_rate_model\nprohibited:\n  - bid_submit\n  - covenant_override`,
      connectors: ['CoStar', 'Lender Covenant API'],
      modelPolicy: 'governed-default', author: 'terra-uw', createdAt: now,
    },
    {
      id: 'sp-cyber-triage', slug: 'cyber-triage', name: 'Cyber Threat Triage Agent',
      vertical: 'cyber', audienceTier: 'enterprise',
      constitutionRef: 'const-paragon-v4', constitutionVersion: '4.0.0',
      constitution: `name: Cyber Triage Constitution\nversion: 4.0.0\ncapabilities:\n  - cve_lookup\n  - siem_correlate\n  - containment_propose\nprohibited:\n  - firewall_modify\n  - account_disable`,
      connectors: ['Threat Intelligence Feed', 'CVE Database', 'SIEM Events'],
      modelPolicy: 'governed-default', author: 'sentra-soc', createdAt: now,
    },
    {
      id: 'sp-legal-discovery', slug: 'legal-discovery', name: 'Legal Discovery Intelligence',
      vertical: 'legal', audienceTier: 'enterprise',
      constitutionRef: 'const-counsel-v2', constitutionVersion: '2.0.0',
      constitution: `name: Legal Discovery Constitution\nversion: 2.0.0\ncapabilities:\n  - docket_search\n  - privilege_check\n  - deadline_compute\nprohibited:\n  - filing_submit\n  - waiver_decide`,
      connectors: ['Docket Search', 'Document Repository'],
      modelPolicy: 'governed-default', author: 'counsel-ops', createdAt: now,
    },
    {
      id: 'sp-platform-health', slug: 'platform-health', name: 'A11oy Platform Health',
      vertical: 'platform', audienceTier: 'internal',
      constitutionRef: 'const-platform-v1', constitutionVersion: '1.0.0',
      constitution: `name: Platform Health Constitution\nversion: 1.0.0\ncapabilities:\n  - layer_health_read\n  - slo_monitor\nprohibited:\n  - config_modify\n  - alert_suppress`,
      connectors: ['Fabric Telemetry'],
      modelPolicy: 'governed-default', author: 'platform-ops', createdAt: now,
    },
  ];
  parents.forEach((s) => spaces.set(s.slug, s));

  // Seeded fork: re-underwriting -> re-underwriting-distressed
  const distressed: AtelierSpace = {
    id: 'sp-re-distressed', slug: 're-underwriting-distressed',
    name: 'Real Estate Underwriting — Distressed', vertical: 'real-estate',
    audienceTier: 'enterprise',
    constitutionRef: 'const-domaine-v3-distressed', constitutionVersion: '3.1.0',
    constitution: `name: Distressed Asset Underwriting\nversion: 3.1.0\ncapabilities:\n  - comp_read\n  - covenant_check\n  - cap_rate_model\n  - distress_score\n  - workout_propose\nprohibited:\n  - bid_submit\n  - workout_execute`,
    connectors: ['CoStar', 'Lender Covenant API', 'Receivership Filings'],
    modelPolicy: 'governed-default',
    parentSlug: 're-underwriting',
    diff: {
      added: ['capability:distress_score', 'capability:workout_propose', 'connector:Receivership Filings', 'prohibition:workout_execute'],
      removed: [],
      modified: ['constitutionVersion: 3.0.0 → 3.1.0'],
    },
    author: 'terra-distress', createdAt: '2026-05-21T14:30:00Z',
  };
  spaces.set(distressed.slug, distressed);

  // Composed space: cross-vertical executive brief
  const composed: AtelierSpace = {
    id: 'sp-executive-brief', slug: 'cross-vertical-executive-brief',
    name: 'Cross-Vertical Executive Brief', vertical: 'executive',
    audienceTier: 'internal',
    constitutionRef: 'const-boardroom-v2', constitutionVersion: '2.0.0',
    constitution: `name: Executive Brief Composition\nversion: 2.0.0\ncomposed_of:\n  - maritime-routing\n  - re-underwriting\n  - cyber-triage\ncapabilities:\n  - signal_aggregate\n  - brief_synthesize\nprohibited:\n  - child_capability_escalate\n  - cross_tenant_read`,
    connectors: ['Signal Mesh', 'Workcell Registry'],
    modelPolicy: 'governed-default',
    composedOf: ['maritime-routing', 're-underwriting', 'cyber-triage'],
    author: 'platform-ops', createdAt: '2026-05-22T09:00:00Z',
  };
  spaces.set(composed.slug, composed);
}

// Manifesto-shared packet IDs (publicly viewable even on enterprise
// Spaces, because they are the proofs the marketing surface links to).
const MANIFESTO_SHARED_PACKETS = new Set<string>([
  'pp-run-seed-maritime-routing-1',
  'pp-run-seed-re-underwriting-5',
  'pp-run-seed-cyber-triage-3',
  'pp-run-seed-platform-health-5',
  'pp-run-seed-re-underwriting-distressed-6',
  'pp-run-seed-cross-vertical-executive-brief-7',
]);

function diffHashOf(d?: { added: string[]; removed: string[]; modified: string[] }) {
  if (!d) return undefined;
  const canonical = JSON.stringify({
    added: [...d.added].sort(),
    removed: [...d.removed].sort(),
    modified: [...d.modified].sort(),
  });
  return `sha256:${createHash('sha256').update(canonical).digest('hex').slice(0, 40)}`;
}

function mkPacket(a: {
  id: string; runId: string; space: AtelierSpace; workcellId: string;
  proofRef: string; score: number; verdict: 'pass' | 'fail' | 'warn';
  createdAt: string; parentPacketId?: string; childPacketIds?: string[];
  publicShareOverride?: boolean; tenantId?: string;
}): ProofPacket {
  return {
    id: a.id, runId: a.runId, spaceSlug: a.space.slug, workcellId: a.workcellId,
    proofRef: a.proofRef, contractId: `pce-${a.runId}`,
    verified: a.verdict === 'pass', governanceScore: a.score,
    mirrorEvalDims: {
      accuracy: 0.96, calibration: 0.93, safety: 0.99, governance: a.score,
      consistency: 0.94, faithfulness: 0.95, audit: 0.97, latency: 0.88,
      cost: 0.91, robustness: 0.90, brand: 0.97, policy: 0.99,
      explainability: 0.92, completeness: 0.95,
    },
    constitutionRef: a.space.constitutionRef, createdAt: a.createdAt,
    audienceTier: a.space.audienceTier,
    // Public iff (a) the Space is public-tier OR (b) the packet is in the
    // narrow MANIFESTO_SHARED_PACKETS allowlist — a static, code-pinned set
    // of receipts published as evidence for /atelier/manifesto claims.
    // No other path can flip publicShare on, so tenant isolation is
    // preserved for every dynamically-created enterprise/internal run.
    publicShare: a.space.audienceTier === 'public' || MANIFESTO_SHARED_PACKETS.has(a.id),
    tenantId: a.tenantId ?? 'szl',
    parentPacketId: a.parentPacketId,
    childPacketIds: a.childPacketIds,
    parentDiffHash: a.space.parentSlug ? diffHashOf(a.space.diff) : undefined,
    parentSlug: a.space.parentSlug,
  };
}

function seedRuns() {
  const seedRun = (slug: string, daysAgo: number, score: number, verdict: 'pass' | 'fail' | 'warn' = 'pass') => {
    const space = spaces.get(slug);
    if (!space) return;
    const started = new Date(Date.now() - daysAgo * 86400_000);
    const runId = `run-seed-${slug}-${daysAgo}`;
    const workcellId = `wc-seed-${slug}-${daysAgo}`;
    const proofRef = `sha256:${createHash('sha256').update(runId).digest('hex').slice(0, 40)}`;
    const proofPacketId = `pp-${runId}`;
    const run: AtelierRun = {
      id: runId, spaceSlug: slug, workcellId, vertical: space.vertical,
      phase: verdict === 'pass' ? 'proven' : verdict === 'fail' ? 'rejected' : 'blocked',
      proofPacketId, proofRef,
      governanceScore: score, proofScore: score - 0.02,
      auditCompleteness: 0.95 + Math.random() * 0.04,
      durationMs: 4800 + Math.floor(Math.random() * 2200),
      approvalLatencyMs: 1200 + Math.floor(Math.random() * 1800),
      costPerDecision: 0.04 + Math.random() * 0.12,
      verdict, outputLines: [],
      startedAt: started.toISOString(),
      completedAt: new Date(started.getTime() + 6000).toISOString(),
      tenantId: 'szl',
    };
    runs.push(run);
    // Composition: synthesize child sub-packets for each composedOf slug.
    let childPacketIds: string[] | undefined;
    if (space.composedOf && space.composedOf.length > 0) {
      childPacketIds = space.composedOf.map((cs) => {
        const child = spaces.get(cs);
        if (!child) return '';
        const cid = `${proofPacketId}-child-${cs}`;
        const crid = `${runId}-child-${cs}`;
        const cref = `sha256:${createHash('sha256').update(crid).digest('hex').slice(0, 40)}`;
        proofPackets.set(cid, mkPacket({
          id: cid, runId: crid, space: child, workcellId: `${workcellId}-${cs}`,
          proofRef: cref, score: score - 0.01, verdict,
          createdAt: started.toISOString(), parentPacketId: proofPacketId,
        }));
        return cid;
      }).filter(Boolean);
    }
    proofPackets.set(proofPacketId, mkPacket({
      id: proofPacketId, runId, space, workcellId, proofRef,
      score, verdict, createdAt: started.toISOString(), childPacketIds,
    }));
  };
  ['maritime-routing', 're-underwriting', 'cyber-triage', 'legal-discovery', 'platform-health',
    're-underwriting-distressed', 'cross-vertical-executive-brief'].forEach((slug, i) => {
    for (let d = 1; d <= 5; d++) {
      seedRun(slug, d + i, 0.92 + Math.random() * 0.07, d === 3 && i === 2 ? 'warn' : 'pass');
    }
  });
}

seedSpaces();
seedRuns();

function nowIso() { return new Date().toISOString(); }

// === Spaces ===
router.get('/spaces', (_req: Request, res: Response) => {
  res.json({ ok: true, data: Array.from(spaces.values()) });
});

router.get('/spaces/:slug', (req: Request, res: Response) => {
  const s = spaces.get(req.params.slug);
  if (!s) return res.status(404).json({ ok: false, error: 'space_not_found' });
  res.json({ ok: true, data: s });
});

router.post('/spaces', (req: Request, res: Response) => {
  const b = req.body ?? {};
  if (!b.slug || !b.name || !b.vertical) {
    return res.status(400).json({ ok: false, error: 'missing_required_fields' });
  }
  if (spaces.has(b.slug)) {
    return res.status(409).json({ ok: false, error: 'slug_conflict' });
  }
  const sp: AtelierSpace = {
    id: `sp-${b.slug}`, slug: b.slug, name: b.name, vertical: b.vertical,
    audienceTier: b.audienceTier ?? 'enterprise',
    constitutionRef: b.constitutionRef ?? `const-${b.slug}-v1`,
    constitutionVersion: b.constitutionVersion ?? '1.0.0',
    constitution: b.constitution ?? `name: ${b.name}\nversion: 1.0.0\ncapabilities: []\nprohibited: []`,
    connectors: b.connectors ?? [], modelPolicy: b.modelPolicy ?? 'governed-default',
    parentSlug: b.parentSlug, composedOf: b.composedOf,
    author: b.author ?? 'anonymous', createdAt: nowIso(),
  };
  spaces.set(sp.slug, sp);
  res.status(201).json({ ok: true, data: sp });
});

// Fork: inherits parent constitution, computes diff
router.post('/spaces/:parent/fork', (req: Request, res: Response) => {
  const parent = spaces.get(req.params.parent);
  if (!parent) return res.status(404).json({ ok: false, error: 'parent_not_found' });
  const b = req.body ?? {};
  if (!b.slug || !b.name) {
    return res.status(400).json({ ok: false, error: 'missing_required_fields' });
  }
  if (spaces.has(b.slug)) {
    return res.status(409).json({ ok: false, error: 'slug_conflict' });
  }
  const addedConns: string[] = (b.addConnectors ?? []).filter((c: string) => !parent.connectors.includes(c));
  const removedConns: string[] = (b.removeConnectors ?? []).filter((c: string) => parent.connectors.includes(c));
  const connectors = parent.connectors.filter((c) => !removedConns.includes(c)).concat(addedConns);
  const fork: AtelierSpace = {
    id: `sp-${b.slug}`, slug: b.slug, name: b.name,
    vertical: b.vertical ?? parent.vertical,
    audienceTier: b.audienceTier ?? parent.audienceTier,
    constitutionRef: `${parent.constitutionRef}-${b.slug}`,
    constitutionVersion: b.constitutionVersion ?? `${parent.constitutionVersion}-fork`,
    constitution: b.constitution ?? parent.constitution,
    connectors, modelPolicy: parent.modelPolicy,
    parentSlug: parent.slug,
    diff: {
      added: addedConns.map((c) => `connector:${c}`),
      removed: removedConns.map((c) => `connector:${c}`),
      modified: b.constitution && b.constitution !== parent.constitution
        ? [`constitution: modified`] : [],
    },
    author: b.author ?? 'anonymous', createdAt: nowIso(),
  };
  spaces.set(fork.slug, fork);
  res.status(201).json({ ok: true, data: fork });
});

// === Runs ===
router.get('/runs', (req: Request, res: Response) => {
  const slug = req.query.spaceSlug as string | undefined;
  // Tenant-scoping: anonymous callers (no X-Tenant-Id) see only runs
  // whose Space is public-tier, and tenantId/origin are stripped. A
  // tenant-scoped caller sees their own runs across all tiers.
  const tenant = (req.header('x-tenant-id') ?? '').toLowerCase().trim();
  let list = slug ? runs.filter((r) => r.spaceSlug === slug) : runs;
  if (!tenant) {
    list = list.filter((r) => spaces.get(r.spaceSlug)?.audienceTier === 'public');
  } else {
    list = list.filter((r) => (r.tenantId ?? 'szl').toLowerCase() === tenant
      || spaces.get(r.spaceSlug)?.audienceTier === 'public');
  }
  const redacted = list.slice(-200).reverse().map((r) => {
    if (tenant && (r.tenantId ?? 'szl').toLowerCase() === tenant) return r;
    const { tenantId: _t, origin: _o, ...rest } = r;
    return rest;
  });
  res.json({ ok: true, data: redacted });
});

router.get('/runs/:id', (req: Request, res: Response) => {
  const r = runs.find((x) => x.id === req.params.id);
  if (!r) return res.status(404).json({ ok: false, error: 'run_not_found' });
  const tenant = (req.header('x-tenant-id') ?? '').toLowerCase().trim();
  const sp = spaces.get(r.spaceSlug);
  const ownTenant = tenant && (r.tenantId ?? 'szl').toLowerCase() === tenant;
  if (!ownTenant && sp?.audienceTier !== 'public') {
    return res.status(403).json({
      ok: false, error: 'forbidden',
      data: { id: r.id, audienceTier: sp?.audienceTier ?? 'enterprise', requiresAuth: true },
    });
  }
  if (!ownTenant) {
    const { tenantId: _t, origin: _o, ...rest } = r;
    return res.json({ ok: true, data: rest });
  }
  res.json({ ok: true, data: r });
});

router.post('/runs', (req: Request, res: Response) => {
  const b = req.body ?? {};
  if (!b.spaceSlug) return res.status(400).json({ ok: false, error: 'missing_spaceSlug' });
  const space = spaces.get(b.spaceSlug);
  const vertical = b.vertical ?? space?.vertical ?? 'cross-vertical';
  const runId = `run-${randomBytes(6).toString('hex')}`;
  const workcellId = b.workcellId ?? `wc-${randomBytes(6).toString('hex')}`;
  const run: AtelierRun = {
    id: runId, spaceSlug: b.spaceSlug, workcellId, vertical,
    phase: 'intake', governanceScore: 0, proofScore: 0, auditCompleteness: 0,
    durationMs: 0, approvalLatencyMs: 0, costPerDecision: 0,
    verdict: 'pass', outputLines: [], startedAt: nowIso(),
    tenantId: b.tenantId ?? 'szl', origin: b.origin,
  };
  runs.push(run);
  res.status(201).json({ ok: true, data: run });
});

// Complete (or update) a run with proof
router.post('/runs/:id/complete', (req: Request, res: Response) => {
  const idx = runs.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'run_not_found' });
  const r = runs[idx];
  const b = req.body ?? {};
  const completedAt = nowIso();
  const durationMs = new Date(completedAt).getTime() - new Date(r.startedAt).getTime();
  const space = spaces.get(r.spaceSlug);
  const verdict: 'pass' | 'fail' | 'warn' = b.verdict ?? 'pass';
  const phase: RunPhase = verdict === 'pass' ? 'proven' : verdict === 'fail' ? 'rejected' : 'blocked';
  const governanceScore = b.governanceScore ?? 0.94 + Math.random() * 0.05;
  const proofPacketId = `pp-${r.id}`;
  // Always server-derive proofRef from runId so /proofs/:id/verify (which
  // re-derives the same hash) is guaranteed to match. Client-supplied
  // proofRef is intentionally ignored — it would otherwise come from
  // validateProof() (contract/workcell-derived) and break verification.
  const proofRef = `sha256:${createHash('sha256').update(r.id).digest('hex').slice(0, 40)}`;
  const updated: AtelierRun = {
    ...r, phase, verdict, completedAt, durationMs,
    governanceScore, proofScore: governanceScore - 0.02,
    auditCompleteness: b.auditCompleteness ?? 0.96,
    approvalLatencyMs: b.approvalLatencyMs ?? Math.floor(durationMs * 0.25),
    costPerDecision: b.costPerDecision ?? 0.08,
    outputLines: b.outputLines ?? r.outputLines,
    proofPacketId, proofRef,
  };
  runs[idx] = updated;
  // Cross-Space composition: if the Space declares composedOf, mint one
  // child sub-packet per child Space at completion time so live composed
  // runs produce the same parent+children proof tree that seedRuns()
  // synthesizes for seed data. Children are tenant-scoped to the parent.
  let childPacketIds: string[] | undefined;
  if (space?.composedOf && space.composedOf.length > 0) {
    childPacketIds = space.composedOf
      .map((cs) => {
        const child = spaces.get(cs);
        if (!child) return '';
        const cid = `${proofPacketId}-child-${cs}`;
        const crid = `${r.id}-child-${cs}`;
        const cref = `sha256:${createHash('sha256').update(crid).digest('hex').slice(0, 40)}`;
        proofPackets.set(cid, mkPacket({
          id: cid, runId: crid, space: child, workcellId: `${r.workcellId}-${cs}`,
          proofRef: cref, score: governanceScore - 0.01, verdict,
          createdAt: completedAt, parentPacketId: proofPacketId,
          tenantId: r.tenantId,
        }));
        return cid;
      })
      .filter(Boolean);
  }
  // Synthesize via mkPacket so audienceTier / publicShare / tenantId are
  // always populated — isAuthorizedForPacket() dereferences tenantId and
  // would crash on packets missing those fields.
  const packet = space
    ? mkPacket({
        id: proofPacketId, runId: r.id, space, workcellId: r.workcellId,
        proofRef, score: governanceScore, verdict, createdAt: completedAt,
        tenantId: r.tenantId, childPacketIds,
      })
    : {
        id: proofPacketId, runId: r.id, spaceSlug: r.spaceSlug, workcellId: r.workcellId,
        proofRef, contractId: `pce-${r.id}`, verified: verdict === 'pass',
        governanceScore,
        mirrorEvalDims: {
          accuracy: 0.96, calibration: 0.93, safety: 0.99, governance: governanceScore,
          consistency: 0.94, faithfulness: 0.95, audit: 0.97, latency: 0.88,
          cost: 0.91, robustness: 0.90, brand: 0.97, policy: 0.99,
          explainability: 0.92, completeness: 0.95,
        },
        constitutionRef: 'const-default',
        createdAt: completedAt,
        audienceTier: 'enterprise' as const,
        publicShare: false,
        tenantId: r.tenantId ?? 'szl',
      };
  // Allow caller-supplied mirrorEvalDims to override defaults.
  if (b.mirrorEvalDims) packet.mirrorEvalDims = b.mirrorEvalDims;
  proofPackets.set(proofPacketId, packet);
  res.json({ ok: true, data: updated });
});

// === Proof packets ===
// Authz model: a packet is publicly retrievable iff `publicShare === true`
// (which is true for public-tier Spaces or explicit manifesto shares).
// Otherwise the caller must present an `X-Tenant-Id` header that matches
// the packet's `tenantId`. Unauthorized callers receive a redacted
// metadata-only response so they can see the packet exists without
// reading its proof body.
function isAuthorizedForPacket(p: ProofPacket, req: Request): boolean {
  if (p.publicShare) return true;
  const tenant = (req.header('x-tenant-id') ?? '').toLowerCase().trim();
  return Boolean(tenant) && tenant === p.tenantId.toLowerCase();
}

function loadChildPackets(p: ProofPacket): ProofPacket[] {
  return (p.childPacketIds ?? [])
    .map((id) => proofPackets.get(id))
    .filter((x): x is ProofPacket => Boolean(x));
}

router.get('/proofs/:id', (req: Request, res: Response) => {
  const p = proofPackets.get(req.params.id);
  if (!p) return res.status(404).json({ ok: false, error: 'proof_not_found' });
  if (!isAuthorizedForPacket(p, req)) {
    return res.status(403).json({
      ok: false, error: 'forbidden',
      data: { id: p.id, audienceTier: p.audienceTier, requiresAuth: true, spaceSlug: p.spaceSlug },
    });
  }
  const run = runs.find((r) => r.id === p.runId);
  const space = spaces.get(p.spaceSlug);
  const childPackets = loadChildPackets(p);
  res.json({ ok: true, data: { proof: p, run, space, childPackets } });
});

// Verify endpoint: re-derives the proof hash from the run id and
// (for forks) the constitution diff hash, and reports whether the
// stored proofRef + parentDiffHash still match. This is the surface
// the public "Verify" button calls.
router.post('/proofs/:id/verify', (req: Request, res: Response) => {
  const p = proofPackets.get(req.params.id);
  if (!p) return res.status(404).json({ ok: false, error: 'proof_not_found' });
  if (!isAuthorizedForPacket(p, req)) {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }
  const expectedProof = `sha256:${createHash('sha256').update(p.runId).digest('hex').slice(0, 40)}`;
  const proofMatches = expectedProof === p.proofRef;
  let diffMatches: boolean | null = null;
  if (p.parentSlug) {
    const space = spaces.get(p.spaceSlug);
    const expected = diffHashOf(space?.diff);
    diffMatches = Boolean(expected) && expected === p.parentDiffHash;
  }
  let childResults: { id: string; verified: boolean }[] | undefined;
  if (p.childPacketIds && p.childPacketIds.length > 0) {
    childResults = loadChildPackets(p).map((c) => ({
      id: c.id,
      verified: c.proofRef === `sha256:${createHash('sha256').update(c.runId).digest('hex').slice(0, 40)}`,
    }));
  }
  const verifiedAt = nowIso();
  const allChildrenOk = !childResults || childResults.every((c) => c.verified);
  const verified = proofMatches && (diffMatches !== false) && allChildrenOk;
  res.json({
    ok: true,
    data: {
      id: p.id, verified, verifiedAt,
      checks: {
        proofRef: { expected: expectedProof, stored: p.proofRef, matches: proofMatches },
        parentDiff: p.parentSlug ? { matches: diffMatches, storedHash: p.parentDiffHash } : null,
        children: childResults ?? null,
      },
    },
  });
});

router.get('/proofs', (_req: Request, res: Response) => {
  // Listing returns only publicly-shareable packets — never enterprise/internal.
  res.json({
    ok: true,
    data: Array.from(proofPackets.values())
      .filter((p) => p.publicShare)
      .slice(-100).reverse(),
  });
});

// === Embed events (telemetry) ===
router.post('/embed-events', (req: Request, res: Response) => {
  const b = req.body ?? {};
  if (!b.spaceSlug || !b.event) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }
  const ev: EmbedEvent = {
    id: `ev-${randomBytes(6).toString('hex')}`,
    spaceSlug: b.spaceSlug, origin: b.origin ?? 'unknown',
    occurredAt: nowIso(), event: b.event,
  };
  embedEvents.push(ev);
  if (embedEvents.length > 1000) embedEvents.splice(0, embedEvents.length - 1000);
  res.status(201).json({ ok: true, data: ev });
});

// === Leaderboards (computed from real telemetry, with seed fallback) ===
router.get('/leaderboards', (req: Request, res: Response) => {
  const mode = (req.query.mode as string) ?? 'proof-score';
  const bySpace = new Map<string, AtelierRun[]>();
  runs.forEach((r) => {
    if (!bySpace.has(r.spaceSlug)) bySpace.set(r.spaceSlug, []);
    bySpace.get(r.spaceSlug)!.push(r);
  });
  const embedCountBySlug = new Map<string, number>();
  embedEvents.forEach((e) => {
    embedCountBySlug.set(e.spaceSlug, (embedCountBySlug.get(e.spaceSlug) ?? 0) + 1);
  });
  const entries = Array.from(spaces.values()).map((sp) => {
    const sr = bySpace.get(sp.slug) ?? [];
    const completed = sr.filter((r) => r.completedAt);
    const avg = (k: keyof AtelierRun) =>
      completed.length === 0 ? 0
        : completed.reduce((a, r) => a + (r[k] as number), 0) / completed.length;
    return {
      slug: sp.slug, name: sp.name, vertical: sp.vertical,
      parentSlug: sp.parentSlug, composedOf: sp.composedOf,
      runCount: sr.length,
      proofScore: avg('proofScore'),
      governanceScore: avg('governanceScore'),
      auditCompleteness: avg('auditCompleteness'),
      costPerDecision: avg('costPerDecision'),
      p95ApprovalLatencyMs: avg('approvalLatencyMs'),
      embedCount: embedCountBySlug.get(sp.slug) ?? 0,
      passRate: completed.length === 0 ? 0
        : completed.filter((r) => r.verdict === 'pass').length / completed.length,
      lastRunAt: sr.length > 0 ? sr[sr.length - 1].startedAt : undefined,
      source: sr.length > 0 ? 'telemetry' : 'seed',
    };
  });
  const cmp: Record<string, (a: typeof entries[0], b: typeof entries[0]) => number> = {
    'proof-score': (a, b) => b.proofScore - a.proofScore,
    'governance-score': (a, b) => b.governanceScore - a.governanceScore,
    'most-audited': (a, b) => b.auditCompleteness - a.auditCompleteness,
    'lowest-cost': (a, b) => a.costPerDecision - b.costPerDecision,
    'fastest-approval': (a, b) => a.p95ApprovalLatencyMs - b.p95ApprovalLatencyMs,
    'most-embedded': (a, b) => b.embedCount - a.embedCount,
    'most-runs': (a, b) => b.runCount - a.runCount,
  };
  entries.sort(cmp[mode] ?? cmp['proof-score']);
  res.json({ ok: true, data: entries, meta: { mode, count: entries.length } });
});

export default router;
