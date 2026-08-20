export type SeriesAEvidenceState = 'AVAILABLE' | 'DEMO' | 'BLOCKED' | 'UNAVAILABLE';

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
  readonly demoHref: string;
  readonly demoLabel: string;
  readonly sourceState: 'AVAILABLE';
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
      'Shortens the path from detection to an accountable decision without granting an agent silent control.',
    demoHref: '/cyber-resilience',
    demoLabel: 'Open cyber resilience demo',
    sourceState: 'AVAILABLE',
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
      'Makes assumptions, counterfactuals, and authority visible in one reviewable decision path.',
    demoHref: '/counterfactuals',
    demoLabel: 'Open finance scenario demo',
    sourceState: 'AVAILABLE',
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
      'Gives diligence teams a concrete boundary between declared controls and observed evidence.',
    demoHref: '/governance',
    demoLabel: 'Open governance demo',
    sourceState: 'AVAILABLE',
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
      'Replaces opaque handoffs with one inspectable recommendation, approval, and proof sequence.',
    demoHref: '/approval-queue',
    demoLabel: 'Open approval queue demo',
    sourceState: 'AVAILABLE',
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
      'Connects asset-level evidence to an investment decision without presenting seeded data as a live portfolio.',
    demoHref: '/fabric/verticals',
    demoLabel: 'Open vertical fabric demo',
    sourceState: 'AVAILABLE',
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
      'Keeps privilege, authority, and the difference between analysis and legal action explicit.',
    demoHref: '/right-to-audit',
    demoLabel: 'Open legal audit demo',
    sourceState: 'AVAILABLE',
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
