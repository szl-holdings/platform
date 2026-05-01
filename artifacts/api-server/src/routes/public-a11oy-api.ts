import { Router, type Request, type Response } from 'express';
import { logger } from '../lib/logger';

const router = Router();
const now = () => new Date().toISOString();

function ok<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  res.json({ ok: true, data, meta: { ...meta, timestamp: now(), visibility: 'public' } });
}

const APPLICATIONS = [
  {
    id: 'vessels',
    name: 'Vessels',
    vertical: 'Maritime',
    domain: 'vessels-maritime',
    status: 'live',
    description:
      'Fleet operations, port scheduling, ETA monitoring, demurrage risk and maritime signal mesh.',
    icon: '⚓',
    tier: 'enterprise',
  },
  {
    id: 'counsel',
    name: 'Counsel',
    vertical: 'Legal',
    domain: 'prism-counsel',
    status: 'live',
    description:
      'Legal matter lifecycle — filings, obligations, risk scoring, document intelligence.',
    icon: '⚖',
    tier: 'enterprise',
  },
  {
    id: 'terra',
    name: 'Terra',
    vertical: 'Real Estate',
    domain: 'terra-real-estate',
    status: 'live',
    description:
      'Real estate portfolio intelligence — valuations, climate risk, deal pipeline, analytics.',
    icon: '▣',
    tier: 'enterprise',
  },
  {
    id: 'aegis',
    name: 'Aegis',
    vertical: 'Defense & Security',
    domain: 'aegis-defense',
    status: 'live',
    description:
      'Security and defense — threat detection, incident response, compliance posture, resilience.',
    icon: '⬡',
    tier: 'sovereign',
  },
  {
    id: 'sentra',
    name: 'Sentra',
    vertical: 'Cyber Resilience',
    domain: 'sentra-cyber',
    status: 'live',
    description:
      'Cyber resilience command — posture monitoring, threat surface, CISO intelligence.',
    icon: '⬡',
    tier: 'enterprise',
  },
  {
    id: 'lyte',
    name: 'Lyte',
    vertical: 'Revenue Intelligence',
    domain: 'lyte-revenue',
    status: 'live',
    description: 'Decision debt ledger — revenue signals, pipeline health, forecast modeling.',
    icon: '◆',
    tier: 'enterprise',
  },
  {
    id: 'pulse',
    name: 'Pulse',
    vertical: 'Founder Operations',
    domain: 'pulse',
    status: 'live',
    description:
      'Founder operating channel — daily briefings, signal synthesis, decision orchestration.',
    icon: '◉',
    tier: 'platform',
  },
  {
    id: 'carlota-jo',
    name: 'Carlota Jo',
    vertical: 'Consulting',
    domain: 'carlota-jo',
    status: 'live',
    description:
      'Consulting matter management — client follow-ups, advisory brief generation, engagement signals.',
    icon: '◎',
    tier: 'professional',
  },
  {
    id: 'nuro-forge',
    name: 'NuroForge',
    vertical: 'AI Infrastructure',
    domain: 'nuro-forge',
    status: 'beta',
    description:
      'Agent forge — custom agent training, fine-tuning orchestration, evaluation harness.',
    icon: '⬟',
    tier: 'platform',
  },
  {
    id: 'meridian',
    name: 'Meridian',
    vertical: 'Infrastructure',
    domain: 'meridian-infra',
    status: 'beta',
    description:
      'Infrastructure intelligence — cloud cost, capacity planning, incident correlation.',
    icon: '⬡',
    tier: 'enterprise',
  },
  {
    id: 'firestorm',
    name: 'Firestorm',
    vertical: 'Operations',
    domain: 'firestorm-ops',
    status: 'roadmap',
    description:
      'Crisis operations — incident command, rapid response orchestration, impact simulation.',
    icon: '⬢',
    tier: 'sovereign',
  },
  {
    id: 'constellation',
    name: 'Constellation',
    vertical: 'Graph Intelligence',
    domain: 'constellation-graph',
    status: 'roadmap',
    description:
      'Cross-domain intelligence graph — entity relationships, causal chains, emergent patterns.',
    icon: '✦',
    tier: 'platform',
  },
];

const CONSTELLATION = {
  nodes: APPLICATIONS.map((app) => ({
    id: app.id,
    label: app.name,
    vertical: app.vertical,
    domain: app.domain,
    status: app.status,
    tier: app.tier,
  })),
  edges: [
    { source: 'pulse', target: 'vessels', relation: 'signal_feed' },
    { source: 'pulse', target: 'counsel', relation: 'signal_feed' },
    { source: 'pulse', target: 'terra', relation: 'signal_feed' },
    { source: 'pulse', target: 'lyte', relation: 'signal_feed' },
    { source: 'aegis', target: 'sentra', relation: 'threat_share' },
    { source: 'vessels', target: 'firestorm', relation: 'crisis_escalation' },
    { source: 'lyte', target: 'counsel', relation: 'contract_reference' },
    { source: 'terra', target: 'counsel', relation: 'matter_reference' },
    { source: 'nuro-forge', target: 'vessels', relation: 'agent_supply' },
    { source: 'nuro-forge', target: 'aegis', relation: 'agent_supply' },
    { source: 'constellation', target: 'pulse', relation: 'graph_feed' },
    { source: 'constellation', target: 'lyte', relation: 'graph_feed' },
  ],
  stats: {
    totalApplications: APPLICATIONS.length,
    liveApplications: APPLICATIONS.filter((a) => a.status === 'live').length,
    betaApplications: APPLICATIONS.filter((a) => a.status === 'beta').length,
    roadmapApplications: APPLICATIONS.filter((a) => a.status === 'roadmap').length,
    verticals: new Set(APPLICATIONS.map((a) => a.vertical)).size,
  },
};

const ARCHITECTURE = {
  version: '4.0',
  model: 'Seven-Layer Governed Execution Fabric',
  layers: [
    {
      id: 1,
      name: 'Signal Mesh',
      role: 'Ingestion & Normalization',
      description:
        'Ingests, normalizes, deduplicates, and routes business signals from all connected sources. Every signal is classified and attributed before entering the decision loop.',
      inputs: ['Webhooks', 'APIs', 'Streams', 'IoT'],
      outputs: ['Classified Signal'],
    },
    {
      id: 2,
      name: 'Causal Core',
      role: 'Evidence Graph Builder',
      description:
        'Traces signal causality, builds evidence graphs, and surfaces correlated events. Powers the "why" behind every recommendation.',
      inputs: ['Classified Signal'],
      outputs: ['Evidence Graph'],
    },
    {
      id: 3,
      name: 'Context Engine',
      role: 'Context Assembly',
      description:
        'Assembles context packs for workcells — enriches signals with historical data, domain schemas, and operator instructions.',
      inputs: ['Evidence Graph', 'Domain Schema'],
      outputs: ['Context Pack'],
    },
    {
      id: 4,
      name: 'Workcell Engine',
      role: 'Governed Execution Runtime',
      description:
        'Provisions, executes, and monitors governed workcells. Binds agents, tools, policies, and proof trails. Every workcell is checkpoint-recoverable.',
      inputs: ['Context Pack', 'Agent Spec'],
      outputs: ['Action Proposal'],
    },
    {
      id: 5,
      name: 'Covenant Layer',
      role: 'Policy Gate',
      description:
        'Non-bypassable policy gate — every action passes through the Covenant Layer before execution. Enforces who can approve, when, and under what conditions.',
      inputs: ['Action Proposal'],
      outputs: ['Gate Decision'],
    },
    {
      id: 6,
      name: 'MirrorEval',
      role: 'Counterfactual Evaluator',
      description:
        'Evaluates recommendations against counterfactuals, computes confidence delta, and generates 14-dimension reasoning chains. Guards against hallucination.',
      inputs: ['Gate Decision', 'Evidence Graph'],
      outputs: ['Eval Score', 'Confidence'],
    },
    {
      id: 7,
      name: 'Proof Ledger',
      role: 'Immutable Audit Chain',
      description:
        'Appends immutable proof entries for every governed execution. SHA-256 hash chain — no tampering, no silent deletions. Queryable by actor or decision.',
      inputs: ['Execution Result'],
      outputs: ['Proof Packet'],
    },
  ],
  decisionLoop: [
    'Signal',
    'Context',
    'Recommendation',
    'Simulation',
    'Policy',
    'Execution',
    'Proof',
    'Outcome',
    'Learning',
  ],
  principals: [
    { name: 'MCP Gateway', role: 'Tool & egress containment for all agents' },
    {
      name: 'Proof-Carrying Execution (PCE)',
      role: 'Contract binding every workcell to its evidence chain',
    },
    {
      name: 'Outcome Graph',
      role: 'Closes the loop — real-world consequence recorded and fed back',
    },
  ],
};

const RESOURCES = [
  {
    id: 'sdk-ts',
    title: 'TypeScript SDK',
    category: 'SDK',
    description: '@workspace/a11oy-fabric — shared types, seed data, and schema contracts',
    url: '#',
    status: 'available',
  },
  {
    id: 'sdk-py',
    title: 'Python Vertical Pack SDK',
    category: 'SDK',
    description:
      'services/verticals/contracts.py — substrate recommendation contracts for all 12 verticals',
    url: '#',
    status: 'available',
  },
  {
    id: 'api-fabric',
    title: 'Fabric API Reference',
    category: 'API',
    description:
      'Phase 1 Foundation — signals, outcomes, actions, proof, governance, verticals, fabric',
    url: '#',
    status: 'available',
  },
  {
    id: 'api-runtime',
    title: 'Runtime API Reference',
    category: 'API',
    description: 'Phase 2 Runtime — workcells, agents, tools, PCE gate, MirrorEval, memory',
    url: '#',
    status: 'available',
  },
  {
    id: 'api-sovereign',
    title: 'Sovereign API Reference',
    category: 'API',
    description: 'Phase 3 Sovereign — multi-tenant orchestration, model routing, eval lab',
    url: '#',
    status: 'available',
  },
  {
    id: 'api-public',
    title: 'Public API Reference',
    category: 'API',
    description:
      'Unauthenticated read-only surface — constellation, applications catalog, architecture overview',
    url: '#',
    status: 'available',
  },
  {
    id: 'guide-pce',
    title: 'Proof-Carrying Execution Guide',
    category: 'Guide',
    description: 'How PCE contracts bind every workcell to its evidence chain and approval record',
    url: '#',
    status: 'available',
  },
  {
    id: 'guide-covenant',
    title: 'Covenant Policy Authoring',
    category: 'Guide',
    description: 'Writing and deploying policy-as-code gates for governed execution',
    url: '#',
    status: 'available',
  },
  {
    id: 'guide-mcp',
    title: 'MCP Gateway Integration',
    category: 'Guide',
    description: 'Connecting external MCP servers through the A11oy containment firewall',
    url: '#',
    status: 'available',
  },
  {
    id: 'guide-vertical',
    title: 'Vertical Pack Development',
    category: 'Guide',
    description:
      'Building a new vertical pack following the substrate contract (signals/forecast/recommendations/brief)',
    url: '#',
    status: 'available',
  },
  {
    id: 'pub-whitepaper',
    title: 'Governed AI Operating System — Whitepaper',
    category: 'Publication',
    description:
      'Architecture overview, competitive differentiation, and proof-chain design rationale',
    url: '#',
    status: 'draft',
  },
  {
    id: 'pub-pce-spec',
    title: 'PCE Specification v1.0',
    category: 'Publication',
    description: 'Formal specification of the Proof-Carrying Execution contract format',
    url: '#',
    status: 'available',
  },
];

router.get('/public/a11oy/applications', (_req: Request, res: Response) => {
  ok(res, { applications: APPLICATIONS, total: APPLICATIONS.length });
});

router.get('/public/a11oy/constellation', (_req: Request, res: Response) => {
  ok(res, CONSTELLATION);
});

router.get('/public/a11oy/architecture', (_req: Request, res: Response) => {
  ok(res, ARCHITECTURE);
});

router.get('/public/a11oy/resources', (_req: Request, res: Response) => {
  const { category } = _req.query as Record<string, string>;
  const resources = category ? RESOURCES.filter((r) => r.category === category) : RESOURCES;
  const categories = Array.from(new Set(RESOURCES.map((r) => r.category)));
  ok(res, { resources, categories, total: resources.length });
});

logger.debug('[public-a11oy-api] public routes registered');

export default router;
