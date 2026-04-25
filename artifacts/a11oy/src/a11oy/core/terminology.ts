export const TERMINOLOGY = {
  CommandSurface: {
    term: 'Command Surface',
    definition: 'The unified human-facing interface through which operators observe, decide, and direct the enterprise. Not a dashboard — a live command interface for governed action.',
  },
  NOWBoard: {
    term: 'NOW Board',
    definition: 'The real-time executive view of what is happening, what matters, and what needs a decision. Replaces status meetings with structured, evidence-backed signals.',
  },
  SignalMesh: {
    term: 'Signal Mesh',
    definition: 'The ingestion and routing layer that senses business events across all verticals, normalizes them, and distributes them to the layers that need to act on them.',
  },
  StateEngine: {
    term: 'State Engine',
    definition: 'Maintains the authoritative current state of the enterprise — operational, financial, relational — updated in real time from the Signal Mesh.',
  },
  CausalCore: {
    term: 'Causal Core',
    definition: 'The reasoning layer that explains why states changed, correlates cause-effect chains, and generates evidence-backed explanations for human review.',
  },
  ActionRail: {
    term: 'Action Rail',
    definition: 'The governed execution lane that recommends, queues, reviews, and executes actions — with human approval gates enforced by the Covenant Layer.',
  },
  CovenantLayer: {
    term: 'Covenant Layer',
    definition: 'The policy and governance enforcement layer. Evaluates every recommended action against covenant policies before anything is permitted to execute.',
  },
  ProofLedger: {
    term: 'Proof Ledger',
    definition: 'The immutable audit layer that records cryptographic proof of every signal ingested, decision made, action executed, and approval granted.',
  },
  Workcell: {
    term: 'Workcell',
    definition: 'An encapsulated unit of agentic work — a governed micro-process with its own context, tools, approval gates, and proof obligations.',
  },
  ProofCarryingExecution: {
    term: 'Proof-Carrying Execution',
    definition: 'The A11oy guarantee: every action carries a cryptographic proof packet that traces its origin signal, causal chain, policy evaluation, approval record, and execution outcome.',
  },
  BusinessTwin: {
    term: 'Business Twin',
    definition: 'The living, structured model of the enterprise that A11oy maintains — continuously updated from real signals, queryable, auditable, and used as the shared context for all reasoning.',
  },
  MirrorEval: {
    term: 'MirrorEval',
    definition: 'The quality and alignment evaluation framework that assesses every AI recommendation against stated objectives, policy constraints, and empirical outcomes.',
  },
} as const;

export type TerminologyKey = keyof typeof TERMINOLOGY;
