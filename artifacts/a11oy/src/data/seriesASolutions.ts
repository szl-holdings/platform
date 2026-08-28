export const SERIES_A_EVIDENCE_STATES = [
  'REAL',
  'DEMO',
  'UNAVAILABLE',
  'DEGRADED',
  'BLOCKED',
  'ROADMAP',
] as const;

export type SeriesAEvidenceState = (typeof SERIES_A_EVIDENCE_STATES)[number];

export const SERIES_A_EVIDENCE_STATE_DETAILS: Readonly<Record<SeriesAEvidenceState, string>> = {
  REAL: 'Authenticated or independently observed operational evidence with current provenance. No item on this source-only page currently qualifies.',
  DEMO: 'Deterministic source-backed interface, fixture, or scenario. It is not customer or production runtime evidence.',
  UNAVAILABLE:
    'The required authenticated source or runtime witness is absent, so the page fails closed.',
  DEGRADED:
    'An authenticated source is only partially healthy and its observed limitation is explicit.',
  BLOCKED: 'Policy, authority, or safety boundaries prevent the proposed external action.',
  ROADMAP: 'Planned capability without an implemented and observed operational source.',
};

export type SeriesALoopStep = {
  readonly phase: 'Observe' | 'Gate' | 'Act' | 'Prove';
  readonly state: SeriesAEvidenceState;
  readonly summary: string;
  readonly evidence: string;
};

export type SeriesASolution = {
  readonly id:
    | 'cyber-security'
    | 'finance'
    | 'data-governance'
    | 'enterprise'
    | 'real-estate'
    | 'legal';
  readonly shortLabel: string;
  readonly title: string;
  readonly buyer: string;
  readonly thesis: string;
  readonly value: string;
  readonly actionLabel: string;
  readonly sourceState: 'DEMO';
  readonly scenarioState: 'DEMO';
  readonly liveState: 'UNAVAILABLE';
  readonly loop: readonly [SeriesALoopStep, SeriesALoopStep, SeriesALoopStep, SeriesALoopStep];
};

function loop(observe: string, gate: string, act: string, prove: string): SeriesASolution['loop'] {
  return [
    {
      phase: 'Observe',
      state: 'DEMO',
      summary: observe,
      evidence: 'Deterministic scenario input; no external feed is represented as connected.',
    },
    {
      phase: 'Gate',
      state: 'DEMO',
      summary: gate,
      evidence:
        'Covenant policy is inspectable in the demo; production authorization is not asserted.',
    },
    {
      phase: 'Act',
      state: 'BLOCKED',
      summary: act,
      evidence: 'The demo can stage and route an action, while external mutation remains blocked.',
    },
    {
      phase: 'Prove',
      state: 'DEMO',
      summary: prove,
      evidence:
        'The source-backed demo exposes the evidence shape; no deployed receipt is inferred.',
    },
  ];
}

export const SERIES_A_SOLUTIONS: readonly SeriesASolution[] = [
  {
    id: 'cyber-security',
    shortLabel: 'Cyber',
    title: 'Cyber security',
    buyer: 'CISO and security operations',
    thesis:
      'Turn a threat signal into a governed containment recommendation with an explicit approval boundary.',
    value:
      'Designed to shorten the path from detection to an accountable decision without granting an agent silent control.',
    actionLabel: 'Trace the cyber decision contract',
    sourceState: 'DEMO',
    scenarioState: 'DEMO',
    liveState: 'UNAVAILABLE',
    loop: loop(
      'Normalize seeded indicators into a bounded incident context.',
      'Evaluate severity, blast radius, and the required approval tier.',
      'Stage containment and escalation for an operator decision.',
      'Attach the scenario, policy result, approval state, and proposed action.',
    ),
  },
  {
    id: 'finance',
    shortLabel: 'Finance',
    title: 'Finance',
    buyer: 'CFO, treasury, and risk teams',
    thesis: 'Compare financial scenarios before a material action crosses an approval threshold.',
    value:
      'Designed to make assumptions, counterfactuals, and authority visible in one reviewable decision path.',
    actionLabel: 'Trace the finance decision contract',
    sourceState: 'DEMO',
    scenarioState: 'DEMO',
    liveState: 'UNAVAILABLE',
    loop: loop(
      'Load a deterministic exposure and variance scenario.',
      'Apply risk, materiality, and separation-of-duties rules.',
      'Route the preferred scenario as a recommendation, not a transaction.',
      'Preserve assumptions, compared paths, gate outcome, and reviewer state.',
    ),
  },
  {
    id: 'data-governance',
    shortLabel: 'Data',
    title: 'Data governance',
    buyer: 'Chief data and governance officers',
    thesis:
      'Make data access, model use, and policy evaluation legible before downstream execution.',
    value:
      'Designed to give diligence teams a concrete boundary between declared controls and observed evidence.',
    actionLabel: 'Trace the data decision contract',
    sourceState: 'DEMO',
    scenarioState: 'DEMO',
    liveState: 'UNAVAILABLE',
    loop: loop(
      'Classify a seeded data request by sensitivity and intended use.',
      'Evaluate purpose, scope, retention, and approver requirements.',
      'Stage an allow, narrow, or deny disposition for human review.',
      'Record the request, policy version, disposition, and evidence boundary.',
    ),
  },
  {
    id: 'enterprise',
    shortLabel: 'Enterprise',
    title: 'Enterprise operations',
    buyer: 'COO and cross-functional operators',
    thesis:
      'Coordinate a consequential operating decision across signals, teams, and policy gates.',
    value:
      'Designed to replace opaque handoffs with one inspectable recommendation, approval, and proof sequence.',
    actionLabel: 'Trace the enterprise decision contract',
    sourceState: 'DEMO',
    scenarioState: 'DEMO',
    liveState: 'UNAVAILABLE',
    loop: loop(
      'Combine deterministic operating signals into a shared action context.',
      'Resolve ownership, policy exceptions, and the required approval tier.',
      'Stage the recommended cross-functional action in the approval queue.',
      'Bind the context, decision path, reviewers, and resulting disposition.',
    ),
  },
  {
    id: 'real-estate',
    shortLabel: 'Real estate',
    title: 'Real estate',
    buyer: 'Asset managers and investment committees',
    thesis:
      'Evaluate an asset decision against risk, portfolio context, and approval policy before commitment.',
    value:
      'Designed to connect asset-level evidence to an investment decision without presenting seeded data as a live portfolio.',
    actionLabel: 'Trace the asset decision contract',
    sourceState: 'DEMO',
    scenarioState: 'DEMO',
    liveState: 'UNAVAILABLE',
    loop: loop(
      'Assemble a seeded asset, market, and risk snapshot.',
      'Evaluate concentration, downside, authority, and diligence requirements.',
      'Stage hold, diligence, or proceed as an investment-committee recommendation.',
      'Preserve source labels, assumptions, policy result, and committee state.',
    ),
  },
  {
    id: 'legal',
    shortLabel: 'Legal',
    title: 'Legal',
    buyer: 'General Counsel and legal operations',
    thesis:
      'Turn an obligation or matter signal into an explainable, reviewable legal operations decision.',
    value:
      'Designed to keep privilege, authority, and the difference between analysis and legal action explicit.',
    actionLabel: 'Trace the legal decision contract',
    sourceState: 'DEMO',
    scenarioState: 'DEMO',
    liveState: 'UNAVAILABLE',
    loop: loop(
      'Extract a deterministic obligation, deadline, and matter context.',
      'Apply privilege, jurisdiction, materiality, and approver rules.',
      'Stage a review task or escalation; no filing or notice is sent.',
      'Record the source context, policy path, reviewer state, and proposed next step.',
    ),
  },
] as const;

export type SeriesADeveloperStep = {
  readonly id:
    | 'architecture'
    | 'interfaces'
    | 'workcells'
    | 'governance'
    | 'receipts'
    | 'local-run'
    | 'verification';
  readonly title: string;
  readonly state: SeriesAEvidenceState;
  readonly detail: string;
};

export const SERIES_A_DEVELOPER_PATH: readonly SeriesADeveloperStep[] = [
  {
    id: 'architecture',
    title: 'Inspect the source boundary',
    state: 'DEMO',
    detail:
      'The React route, typed solution contracts, and fail-closed provider configuration are inspectable in this revision.',
  },
  {
    id: 'interfaces',
    title: 'Inspect the declared interfaces',
    state: 'DEMO',
    detail:
      'Client-side route and schema contracts are source evidence only; this page does not claim a hosted API endpoint.',
  },
  {
    id: 'workcells',
    title: 'Request authenticated Workcells',
    state: 'UNAVAILABLE',
    detail:
      'No authenticated operational Workcell registry is connected here. Repository fixtures are excluded from live claims.',
  },
  {
    id: 'governance',
    title: 'Evaluate the Covenant gate',
    state: 'DEMO',
    detail:
      'The deterministic gate shape is visible, but deployed policy enforcement has not been independently observed.',
  },
  {
    id: 'receipts',
    title: 'Inspect the receipt shape',
    state: 'DEMO',
    detail:
      'The scenario records the evidence fields a receipt would require; it does not represent a deployed receipt.',
  },
  {
    id: 'local-run',
    title: 'Build the local prototype',
    state: 'DEMO',
    detail:
      'The repository-pinned package task builds the source locally; a successful build is not deployment evidence.',
  },
  {
    id: 'verification',
    title: 'Verify the source contract',
    state: 'DEMO',
    detail:
      'Focused tests, type checks, and the production build must run and be recorded before source promotion.',
  },
] as const;

export const SERIES_A_RECEIPT_FIELDS = [
  { field: 'scenario_id', rule: 'Stable identifier for the deterministic scenario.' },
  { field: 'source_state', rule: 'One canonical six-state evidence value.' },
  { field: 'policy_version', rule: 'Declared policy identifier; never inferred from UI copy.' },
  { field: 'approval_state', rule: 'Human authorization state before any proposed action.' },
  { field: 'proposed_action', rule: 'Recommendation only while external mutation is blocked.' },
  { field: 'evidence_refs', rule: 'References to source-qualified inputs and gate results.' },
  { field: 'generated_at', rule: 'Deterministic demo time or authenticated observed time.' },
] as const;

export const SERIES_A_VERIFICATION_COMMANDS = [
  'pnpm --filter @workspace/a11oy test:series-a',
  'pnpm --filter @workspace/a11oy typecheck',
  'pnpm --filter @workspace/a11oy build',
] as const;
