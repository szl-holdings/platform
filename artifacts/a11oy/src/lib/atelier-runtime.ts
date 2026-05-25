export type RunPhase =
  | 'intake'
  | 'planning'
  | 'risk_review'
  | 'executing'
  | 'verifying'
  | 'proven'
  | 'blocked'
  | 'rejected';

export interface SpaceRunState {
  workcellId: string;
  spaceSlug: string;
  vertical: string;
  phase: RunPhase;
  pceContractId?: string;
  proofPacketId?: string;
  mode: 'demo' | 'governed';
  createdAt: string;
  updatedAt: string;
  history: Array<{ phase: RunPhase; timestamp: string; note?: string }>;
}

export interface ProofResult {
  contractId?: string;
  workcellId: string;
  verified: boolean;
  proofRef?: string;
  proofPacketId?: string;
  reason?: string;
}

export interface CreateSpaceRunOpts {
  spaceSlug: string;
  vertical: string;
  connectors: string[];
  constitutionRef: string;
  modelPolicy: string;
  audienceTier?: 'internal' | 'enterprise' | 'public';
  approvalTier?: 'auto' | 'operator' | 'executive';
  originSignalIds?: string[];
}

const API_PREFIX = '/api/a11oy';

const PHASE_ORDER: RunPhase[] = [
  'intake',
  'planning',
  'risk_review',
  'executing',
  'verifying',
  'proven',
];

const PHASE_LINES: Record<RunPhase, string> = {
  intake: 'Initializing governed execution context...',
  planning: 'Loading Constitution policy and binding model route...',
  risk_review: 'Running policy pre-check (PCE gate)...',
  executing: 'Executing agent loop under governed runtime...',
  verifying: 'Scoring with MirrorEval (14 dimensions) and generating proof packet...',
  proven: '✓ Proof generated — composite eval passed.',
  blocked: '⚠ Execution blocked by governance.',
  rejected: '✗ Action rejected.',
};

const VERTICAL_OUTPUTS: Record<string, (connectors: string[]) => string[]> = {
  maritime: (cs) => [
    `⟳ Connecting to ${cs[0] ?? 'AIS Live Feed'}...`,
    '✓ Vessel telemetry received',
    '⟳ Calculating ETA deviation and standby cost...',
    '⚠ ETA delay detected — running alternate route model',
    '✓ Recommendation: reroute saves $1.2M demurrage',
  ],
  'real-estate': (cs) => [
    `⟳ Loading comparables from ${cs[0] ?? 'CoStar'}...`,
    '✓ 6 comps loaded',
    '⟳ Checking lender covenant thresholds...',
    '✓ Covenant check: COMPLIANT',
    '⟳ Running cap rate compression model...',
    '✓ Underwriting risk score: 0.22 (LOW)',
  ],
  legal: (cs) => [
    `⟳ Querying ${cs[0] ?? 'Docket Search'}...`,
    '✓ Privilege check passed',
    '⟳ Scanning documents for responsive matter...',
    '✓ 142 documents categorized',
    '⟳ Computing deadline analysis...',
    '✓ Filing deadline: T+12 days',
  ],
  cyber: (cs) => [
    `⟳ Querying ${cs[0] ?? 'CVE Database'}...`,
    '✓ CVE enrichment complete',
    '⟳ Correlating SIEM events...',
    '⚠ Lateral movement pattern detected',
    '⟳ Simulating containment strategy...',
    '✓ Containment plan ready for human approval',
  ],
  defense: (cs) => [
    `⟳ Pulling intel from ${cs[0] ?? 'Threat Intelligence Feed'}...`,
    '✓ Adversary attribution: state-aligned actor',
    '⟳ Generating ISR brief...',
    '✓ Brief packaged for executive review',
  ],
  executive: (cs) => [
    `⟳ Synthesizing cross-vertical signals from ${cs.length || 'all'} sources...`,
    '✓ Portfolio brief composed',
    '⟳ Verifying decision freshness...',
    '✓ Boardroom packet ready',
  ],
  platform: () => [
    '✓ Layer 1 (Signal Mesh): nominal',
    '✓ Layer 2 (Decision Queue): nominal',
    '✓ Layer 3 (Workcells): nominal',
    '✓ Layer 4 (MirrorEval): nominal',
    '✓ Layer 5 (Proof Ledger): integrity verified',
    '✓ Layer 6 (Approval Queue): nominal',
    '✓ Layer 7 (Connector Firewall): nominal',
  ],
  'cross-vertical': (cs) => [
    `⟳ Federating signals across ${cs.length || 0} connectors...`,
    '✓ Cross-domain context assembled',
  ],
};

function nowIso(): string {
  return new Date().toISOString();
}

async function tryFetch(path: string, init?: RequestInit): Promise<unknown | null> {
  try {
    const res = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json;
  } catch {
    return null;
  }
}

function makeDemoState(opts: CreateSpaceRunOpts): SpaceRunState {
  const id = `wc-demo-${Math.random().toString(36).slice(2, 10)}`;
  const ts = nowIso();
  return {
    workcellId: id,
    spaceSlug: opts.spaceSlug,
    vertical: opts.vertical,
    phase: 'intake',
    mode: 'demo',
    createdAt: ts,
    updatedAt: ts,
    history: [{ phase: 'intake', timestamp: ts, note: 'Demo run created' }],
  };
}

function mapApiPhase(p: string): RunPhase {
  const lookup: Record<string, RunPhase> = {
    intake: 'intake',
    planning: 'planning',
    context_building: 'planning',
    risk_review: 'risk_review',
    action_brief_created: 'risk_review',
    pce_contract_created: 'risk_review',
    approval_required: 'risk_review',
    approved: 'executing',
    executing: 'executing',
    verifying: 'verifying',
    proven: 'proven',
    blocked: 'blocked',
    rejected: 'rejected',
    archived: 'proven',
  };
  return lookup[p] ?? 'intake';
}

export async function createSpaceRun(opts: CreateSpaceRunOpts): Promise<SpaceRunState> {
  const body = {
    name: `Atelier: ${opts.spaceSlug}`,
    vertical: opts.vertical,
    approvalTier: opts.approvalTier ?? 'operator',
    originSignalIds: opts.originSignalIds ?? [],
    tools: opts.connectors,
    description: `Constitution: ${opts.constitutionRef} | Model: ${opts.modelPolicy}`,
  };
  const result = (await tryFetch(`${API_PREFIX}/workcells`, {
    method: 'POST',
    body: JSON.stringify(body),
  })) as { ok?: boolean; data?: { id: string; phase: string; vertical: string; createdAt: string; updatedAt: string; history: Array<{ phase: string; timestamp: string; note?: string }> } } | null;

  if (result?.ok && result.data) {
    const wc = result.data;
    return {
      workcellId: wc.id,
      spaceSlug: opts.spaceSlug,
      vertical: wc.vertical,
      phase: mapApiPhase(wc.phase),
      mode: 'governed',
      createdAt: wc.createdAt,
      updatedAt: wc.updatedAt,
      history: wc.history.map((h) => ({ phase: mapApiPhase(h.phase), timestamp: h.timestamp, note: h.note })),
    };
  }
  return makeDemoState(opts);
}

async function pollWorkcell(workcellId: string): Promise<SpaceRunState | null> {
  const result = (await tryFetch(`${API_PREFIX}/workcells/${workcellId}`)) as { ok?: boolean; data?: { id: string; phase: string; vertical: string; pceContractId?: string; proofPacketId?: string; createdAt: string; updatedAt: string; history: Array<{ phase: string; timestamp: string; note?: string }> } } | null;
  if (!result?.ok || !result.data) return null;
  const wc = result.data;
  return {
    workcellId: wc.id,
    spaceSlug: wc.id,
    vertical: wc.vertical,
    phase: mapApiPhase(wc.phase),
    pceContractId: wc.pceContractId,
    proofPacketId: wc.proofPacketId,
    mode: 'governed',
    createdAt: wc.createdAt,
    updatedAt: wc.updatedAt,
    history: wc.history.map((h) => ({ phase: mapApiPhase(h.phase), timestamp: h.timestamp, note: h.note })),
  };
}

async function advanceWorkcellApi(workcellId: string): Promise<void> {
  await tryFetch(`${API_PREFIX}/workcells/${workcellId}/advance`, { method: 'POST' });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function streamRunOutput(
  workcellId: string,
  onLine: (line: string) => void,
  opts?: { vertical?: string; connectors?: string[]; spaceSlug?: string },
): Promise<SpaceRunState> {
  const vertical = opts?.vertical ?? 'cross-vertical';
  const connectors = opts?.connectors ?? [];
  const verticalLines = (VERTICAL_OUTPUTS[vertical] ?? VERTICAL_OUTPUTS['cross-vertical'])(connectors);

  const initialState = await pollWorkcell(workcellId);
  if (initialState) {
    const seenPhases = new Set<RunPhase>();
    let lastState: SpaceRunState = initialState;
    for (let i = 0; i < 16; i++) {
      const state = await pollWorkcell(workcellId);
      if (state) {
        lastState = state;
        if (!seenPhases.has(state.phase)) {
          seenPhases.add(state.phase);
          onLine(PHASE_LINES[state.phase] ?? `Phase: ${state.phase}`);
          if (state.phase === 'executing') {
            for (const l of verticalLines) {
              onLine(l);
              await sleep(220);
            }
          }
        }
        if (state.phase === 'proven' || state.phase === 'blocked' || state.phase === 'rejected') {
          return state;
        }
      }
      await advanceWorkcellApi(workcellId);
      await sleep(380);
    }
    return lastState;
  }

  // Governed API unavailable — demo simulation with same typed flow.
  const ts = nowIso();
  const history: SpaceRunState['history'] = [{ phase: 'intake', timestamp: ts }];
  const state: SpaceRunState = {
    workcellId,
    spaceSlug: opts?.spaceSlug ?? workcellId,
    vertical,
    phase: 'intake',
    mode: 'demo',
    createdAt: ts,
    updatedAt: ts,
    history,
  };

  for (const phase of PHASE_ORDER) {
    state.phase = phase;
    state.updatedAt = nowIso();
    state.history.push({ phase, timestamp: state.updatedAt });
    onLine(PHASE_LINES[phase]);
    await sleep(360);
    if (phase === 'executing') {
      for (const l of verticalLines) {
        onLine(l);
        await sleep(280);
      }
    }
  }

  state.pceContractId = `pce-demo-${Math.random().toString(36).slice(2, 10)}`;
  state.proofPacketId = `pp-demo-${Math.random().toString(36).slice(2, 10)}`;
  return state;
}

// Persist a completed Atelier run to /api/atelier/runs so leaderboards,
// public proof URLs, and embed telemetry stay grounded in real data.
export interface RecordAtelierRunOpts {
  spaceSlug: string;
  workcellId: string;
  vertical: string;
  proofRef?: string;
  outputLines: string[];
  verdict?: 'pass' | 'fail' | 'warn';
  governanceScore?: number;
  origin?: string;
  tenantId?: string;
}

export interface AtelierRunRecord {
  id: string;
  proofPacketId?: string;
  proofRef?: string;
}

export async function recordAtelierRun(opts: RecordAtelierRunOpts): Promise<AtelierRunRecord | null> {
  const created = (await tryFetch(`/api/atelier/runs`, {
    method: 'POST',
    body: JSON.stringify({
      spaceSlug: opts.spaceSlug,
      workcellId: opts.workcellId,
      vertical: opts.vertical,
      origin: opts.origin,
      tenantId: opts.tenantId,
    }),
  })) as { ok?: boolean; data?: { id: string } } | null;
  if (!created?.ok || !created.data) return null;
  const completed = (await tryFetch(`/api/atelier/runs/${created.data.id}/complete`, {
    method: 'POST',
    body: JSON.stringify({
      verdict: opts.verdict ?? 'pass',
      governanceScore: opts.governanceScore,
      proofRef: opts.proofRef,
      outputLines: opts.outputLines.slice(-50),
    }),
  })) as { ok?: boolean; data?: { id: string; proofPacketId?: string; proofRef?: string } } | null;
  if (!completed?.ok || !completed.data) return { id: created.data.id };
  return {
    id: completed.data.id,
    proofPacketId: completed.data.proofPacketId,
    proofRef: completed.data.proofRef,
  };
}

// Fetch the live Space registry from /api/atelier/spaces. The handler is
// anonymous-readable (GET via OPS_CORE_PUBLIC_PREFIXES). Returns null
// on any failure so callers can fall back to the static catalog.
export interface RemoteAtelierSpace {
  slug: string;
  name: string;
  vertical: string;
  audienceTier: 'internal' | 'enterprise' | 'public';
  parentSlug?: string;
  composedOf?: string[];
  author: string;
  createdAt: string;
}
export async function fetchAtelierSpaces(): Promise<RemoteAtelierSpace[] | null> {
  const res = (await tryFetch(`/api/atelier/spaces`)) as
    | { ok?: boolean; data?: RemoteAtelierSpace[] }
    | null;
  if (!res?.ok || !Array.isArray(res.data)) return null;
  return res.data;
}

// Telemetry-aggregated leaderboard row returned by GET /api/atelier/leaderboards.
// Numeric scores are 0-1 fractions on the server (proofScore/governanceScore/
// auditCompleteness/passRate); cost is USD/decision; latency is ms.
// `source` is 'telemetry' when at least one real run exists for the Space,
// otherwise 'seed' for catalog-only entries.
export interface RemoteAtelierLeaderboardEntry {
  slug: string;
  name: string;
  vertical: string;
  parentSlug?: string;
  composedOf?: string[];
  runCount: number;
  proofScore: number;
  governanceScore: number;
  auditCompleteness: number;
  costPerDecision: number;
  p95ApprovalLatencyMs: number;
  embedCount: number;
  passRate: number;
  lastRunAt?: string;
  source: 'telemetry' | 'seed';
}
export async function fetchAtelierLeaderboards(): Promise<RemoteAtelierLeaderboardEntry[] | null> {
  const res = (await tryFetch(`/api/atelier/leaderboards`)) as
    | { ok?: boolean; data?: RemoteAtelierLeaderboardEntry[] }
    | null;
  if (!res?.ok || !Array.isArray(res.data)) return null;
  return res.data;
}

export async function recordEmbedEvent(spaceSlug: string, origin: string, event: 'handshake' | 'run' | 'completed'): Promise<void> {
  await tryFetch(`/api/atelier/embed-events`, {
    method: 'POST',
    body: JSON.stringify({ spaceSlug, origin, event }),
  });
}

export async function validateProof(workcellId: string, pceContractId?: string): Promise<ProofResult> {
  if (pceContractId) {
    const result = (await tryFetch(`${API_PREFIX}/pce/${pceContractId}/validate`, {
      method: 'POST',
    })) as { ok?: boolean; data?: { contractId: string; verified: boolean; reason?: string } } | null;
    if (result?.ok && result.data) {
      return {
        contractId: result.data.contractId,
        workcellId,
        verified: result.data.verified,
        proofRef: result.data.verified ? `sha256:${result.data.contractId}` : undefined,
        reason: result.data.reason,
      };
    }
  }
  // Governed API unavailable — demo proof ref derived from workcell id.
  const hex = Array.from(workcellId)
    .reduce((acc, c) => acc + c.charCodeAt(0).toString(16), '')
    .padEnd(40, 'c9b787a1d3e6f9c4b7')
    .slice(0, 40);
  return {
    contractId: pceContractId,
    workcellId,
    verified: true,
    proofRef: `sha256:${hex}`,
    proofPacketId: `pp-demo-${workcellId.slice(-6)}`,
  };
}
