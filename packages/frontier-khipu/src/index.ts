/**
 * Frontier Intelligence Khipu Index — shared typed data package.
 *
 * This package is the single source of truth for the competitive capability
 * positioning model AND the broader Khipu knowledge graph used in A11oy\'s
 * Frontier Intelligence section: capability lanes, gap analysis, tracked
 * actors (anonymised), canonical ideas, and doctrine citations.
 *
 * Naming policy: All public exports use anonymous archetype labels.
 * No competitor, company, or person names appear in this package. Names
 * used for citation-panel rendering must be provided by the consuming UI in
 * a citation-only constant, never in the shared data layer.
 */

// ─── Radar / Positioning model ────────────────────────────────────────────────

export interface CompetitorLane {
  id: string;
  laneLabel: string;
  color: string;
  archetype: string;
  scores: number[];
  posX: number;
  posY: number;
  dotSize: number;
}

export const DIMENSIONS = [
  'Agentic Execution',
  'Governance & Policy',
  'Business Observability',
  'Proof Chains',
  'Enterprise Readiness',
  'Multi-Domain Support',
  'Human-in-the-Loop',
  'Outcome Verification',
] as const;

export type Dimension = (typeof DIMENSIONS)[number];

export const COMPETITOR_LANES: CompetitorLane[] = [
  {
    id: 'a11oy',
    laneLabel: 'A11oy',
    color: '#c9b787',
    archetype: 'Governed intelligence layer',
    scores: [95, 98, 92, 97, 88, 95, 99, 96],
    posX: 92, posY: 96, dotSize: 14,
  },
  {
    id: 'lane-a',
    laneLabel: 'Lane A',
    color: '#4a9eff',
    archetype: 'Foundation model platform',
    scores: [80, 28, 45, 15, 72, 65, 35, 20],
    posX: 78, posY: 22, dotSize: 10,
  },
  {
    id: 'lane-b',
    laneLabel: 'Lane B',
    color: '#b07d4a',
    archetype: 'Safety-focused model provider',
    scores: [75, 40, 38, 20, 68, 58, 42, 25],
    posX: 72, posY: 32, dotSize: 9,
  },
  {
    id: 'lane-c',
    laneLabel: 'Lane C',
    color: '#5b8dd9',
    archetype: 'Enterprise productivity AI',
    scores: [60, 55, 70, 10, 85, 72, 50, 18],
    posX: 58, posY: 50, dotSize: 11,
  },
  {
    id: 'lane-d',
    laneLabel: 'Lane D',
    color: '#7a7a7a',
    archetype: 'Data integration & analytics',
    scores: [55, 72, 82, 38, 90, 78, 60, 42],
    posX: 52, posY: 70, dotSize: 10,
  },
  {
    id: 'lane-e',
    laneLabel: 'Lane E',
    color: '#8b5cf6',
    archetype: 'Observability & monitoring',
    scores: [20, 30, 88, 12, 82, 55, 25, 15],
    posX: 18, posY: 35, dotSize: 9,
  },
];

export interface CapabilityGap {
  dimension: Dimension;
  a11oy: number;
  nearestLaneId: string;
  nearestScore: number;
  description: string;
}

export const CAPABILITY_GAPS: CapabilityGap[] = [
  {
    dimension: 'Proof Chains',
    a11oy: 97,
    nearestLaneId: 'lane-d',
    nearestScore: 38,
    description: 'Cryptographic audit trail linking every recommendation, approval, and execution in an immutable chain. No comparable lane offers this natively.',
  },
  {
    dimension: 'Human-in-the-Loop',
    a11oy: 99,
    nearestLaneId: 'lane-d',
    nearestScore: 60,
    description: 'Constitutional mandate: no material action executes without human approval. This is structural, not configurable.',
  },
  {
    dimension: 'Governance & Policy',
    a11oy: 98,
    nearestLaneId: 'lane-d',
    nearestScore: 72,
    description: 'Policy gates enforced by a non-bypassable Covenant Layer at every execution boundary. Peer lanes rely on prompt-level guardrails.',
  },
  {
    dimension: 'Outcome Verification',
    a11oy: 96,
    nearestLaneId: 'lane-d',
    nearestScore: 42,
    description: 'Automated Verifier Agent confirms every executed action produced the intended outcome with cryptographic evidence.',
  },
];

// ─── Khipu Index — tracked actor archetypes ──────────────────────────────────

export type ActorKind = 'foundation-lab' | 'applied-agent' | 'academic' | 'hardware';
export type SignalWeight = 'Very High' | 'High' | 'Medium-High' | 'Medium';
export type ScanCadence = 'Weekly' | 'Bi-weekly' | 'Monthly';

/**
 * KhipuActor: an anonymised archetype for a frontier actor tracked in doctrine.
 * Names are intentionally omitted — the consuming UI supplies citation labels
 * separately, never from this shared layer.
 */
export interface KhipuActor {
  id: string;
  archetypeLabel: string;
  kind: ActorKind;
  thesis: string;
  capabilityDimensions: Dimension[];
  governanceGap: string;
  a11oyImplication: string;
  signalWeight: SignalWeight;
  scanCadence: ScanCadence;
}

export const KHIPU_ACTORS: KhipuActor[] = [
  // Foundation labs
  {
    id: 'actor-foundation-01',
    archetypeLabel: 'Frontier Foundation Lab α',
    kind: 'foundation-lab',
    thesis: 'Scaling compute and data volume is the primary path to general intelligence. Safety alignment is a secondary research track.',
    capabilityDimensions: ['Agentic Execution', 'Multi-Domain Support'],
    governanceGap: 'No proof chains; safety properties are emergent and non-auditable at inference time.',
    a11oyImplication: 'Monitor benchmark releases for capability ceiling shifts. Use gap data to update Governance & Policy scores quarterly.',
    signalWeight: 'Very High',
    scanCadence: 'Weekly',
  },
  {
    id: 'actor-foundation-02',
    archetypeLabel: 'Frontier Foundation Lab β',
    kind: 'foundation-lab',
    thesis: 'Constitutional AI and interpretability research can produce models whose values are legible and correctable.',
    capabilityDimensions: ['Governance & Policy', 'Human-in-the-Loop'],
    governanceGap: 'HITL controls are optional and post-hoc; A11oy\'s Covenant Layer is structural and pre-execution.',
    a11oyImplication: 'Track Constitutional AI evolution. Alignment research advances may close the governance gap — update Covenant Layer design accordingly.',
    signalWeight: 'Very High',
    scanCadence: 'Weekly',
  },
  {
    id: 'actor-foundation-03',
    archetypeLabel: 'Open-Weight Frontier Lab',
    kind: 'foundation-lab',
    thesis: 'Open-weight releases democratise capability; sovereign nations and private operators can self-host frontier models without dependency on US labs.',
    capabilityDimensions: ['Agentic Execution', 'Multi-Domain Support', 'Enterprise Readiness'],
    governanceGap: 'No governance layer; operators bear full alignment and policy responsibility at deployment.',
    a11oyImplication: 'Open-weight frontier models are an accelerant for A11oy\'s sovereign-operator segment. Monitor capability parity with closed labs; update pricing model when parity is reached.',
    signalWeight: 'High',
    scanCadence: 'Bi-weekly',
  },
  {
    id: 'actor-foundation-04',
    archetypeLabel: 'Multimodal Research Lab',
    kind: 'foundation-lab',
    thesis: 'Multimodal foundation models (vision, audio, video, code) are the base layer for all real-world agentic deployment.',
    capabilityDimensions: ['Agentic Execution', 'Multi-Domain Support', 'Business Observability'],
    governanceGap: 'Video and camera-feed analysis has no governance or audit trail; A11oy\'s Verifier Agent can add this layer.',
    a11oyImplication: 'Evaluate multimodal adapter strategy for Aegis and Vessels. Native video-stream processing could eliminate pre-processing latency in sensor-rich deployments.',
    signalWeight: 'High',
    scanCadence: 'Weekly',
  },
  // Applied agent companies
  {
    id: 'actor-applied-01',
    archetypeLabel: 'Speed-First Agent Platform',
    kind: 'applied-agent',
    thesis: 'Deployment speed and model performance matter more than governance rails. Move fast, trust the model, let operators configure guardrails post-launch.',
    capabilityDimensions: ['Agentic Execution'],
    governanceGap: 'No proof chains, no Covenant Layer, no HITL mandate. Governance is opt-in and prompt-level.',
    a11oyImplication: 'Primary foil for A11oy\'s governance differentiator. Benchmark against this archetype on agentic task performance; use the gap to demonstrate governance-without-performance-penalty.',
    signalWeight: 'Very High',
    scanCadence: 'Weekly',
  },
  {
    id: 'actor-applied-02',
    archetypeLabel: 'Conversational HITL Platform',
    kind: 'applied-agent',
    thesis: 'Enterprise AI adoption requires conversational AI with human-in-the-loop approval steps baked into the product UX, not bolted on afterwards.',
    capabilityDimensions: ['Human-in-the-Loop', 'Enterprise Readiness'],
    governanceGap: 'HITL is UX-level, not cryptographically enforced; no proof chains for regulatory audit.',
    a11oyImplication: 'This archetype\'s conversational HITL UX is a strong design reference. Evaluate whether A11oy\'s Workcell approval UI matches this pattern in enterprise usability.',
    signalWeight: 'Medium-High',
    scanCadence: 'Bi-weekly',
  },
  {
    id: 'actor-applied-03',
    archetypeLabel: 'AI-Native IDE Platform',
    kind: 'applied-agent',
    thesis: 'The approve/reject UX pattern applied to code suggestions is the template for all agentic human oversight: show the diff, let the human gate it.',
    capabilityDimensions: ['Human-in-the-Loop', 'Agentic Execution'],
    governanceGap: 'Scoped to software development; no multi-domain governance or proof chain infrastructure.',
    a11oyImplication: 'Adopt the approve/reject diff pattern in A11oy\'s Workcell task presentation. This is the proven UX archetype for HITL at high-cadence agentic tasks.',
    signalWeight: 'Medium-High',
    scanCadence: 'Bi-weekly',
  },
  {
    id: 'actor-applied-04',
    archetypeLabel: 'Agentic Software Creation Platform',
    kind: 'applied-agent',
    thesis: 'Natural-language-to-working-software is an inflection point: non-technical operators will create and deploy agents without engineering involvement.',
    capabilityDimensions: ['Agentic Execution', 'Enterprise Readiness'],
    governanceGap: 'No governance layer for deployed agents; operator trust model relies on platform-level controls, not cryptographic proof.',
    a11oyImplication: 'The non-technical operator segment is a future A11oy customer archetype. Design Workcell UX to match natural-language-first interaction patterns.',
    signalWeight: 'Medium-High',
    scanCadence: 'Bi-weekly',
  },
  // Hardware
  {
    id: 'actor-hardware-01',
    archetypeLabel: 'AI Compute Infrastructure Leader',
    kind: 'hardware',
    thesis: 'Compute substrate is the bottleneck for frontier AI capability; chip architecture advances unlock new capability tiers.',
    capabilityDimensions: ['Agentic Execution', 'Enterprise Readiness'],
    governanceGap: 'Hardware layer has no governance semantics; governance must be implemented in the orchestration layer above.',
    a11oyImplication: 'Track next-generation chip roadmap for cost and latency planning. MoE-optimised architectures may shift Aegis cost model parameters significantly.',
    signalWeight: 'High',
    scanCadence: 'Bi-weekly',
  },
  // Academic voices
  {
    id: 'actor-academic-01',
    archetypeLabel: 'Reinforcement Learning Foundationalist',
    kind: 'academic',
    thesis: 'General methods that leverage computation beat hand-crafted representations over time. RL from experience is the core scaling mechanism.',
    capabilityDimensions: ['Agentic Execution'],
    governanceGap: 'RL agents optimising for specified reward functions may pursue instrumental goals misaligned with human values — a structural tension this archetype acknowledges.',
    a11oyImplication: 'The compute-scaling insight implies A11oy\'s agent designs must minimise hardcoded domain knowledge and maximise learning from structured feedback. Proof Chains provide the feedback substrate.',
    signalWeight: 'High',
    scanCadence: 'Monthly',
  },
  {
    id: 'actor-academic-02',
    archetypeLabel: 'Neural Network Safety Pioneer',
    kind: 'academic',
    thesis: 'Deep learning systems will exceed human intelligence; the existential risk from unaligned AI is the most important problem of our time.',
    capabilityDimensions: ['Governance & Policy', 'Human-in-the-Loop'],
    governanceGap: 'Safety concerns are systemic and not yet addressed by any deployed product; A11oy\'s Covenant Layer is a partial structural response.',
    a11oyImplication: 'AI safety regulation risk is rising globally. A11oy\'s Governance & Policy differentiator will become a licensing prerequisite in regulated markets within 3–5 years. Build now.',
    signalWeight: 'High',
    scanCadence: 'Monthly',
  },
  {
    id: 'actor-academic-03',
    archetypeLabel: 'LLM Pedagogy & Software 2.0 Theorist',
    kind: 'academic',
    thesis: 'LLMs are a new computing paradigm (Software 2.0): weights encode programs; the skill of writing software shifts to curating training data and prompts.',
    capabilityDimensions: ['Agentic Execution', 'Business Observability'],
    governanceGap: 'Software 2.0 systems have opaque failure modes; A11oy\'s Outcome Verifier provides the runtime observability layer.',
    a11oyImplication: 'Invest in LLM literacy across A11oy\'s operator-facing interfaces. This archetype\'s pedagogical content is the best proxy for what the next generation of enterprise operators will expect from AI products.',
    signalWeight: 'Medium-High',
    scanCadence: 'Monthly',
  },
  {
    id: 'actor-academic-04',
    archetypeLabel: 'AI Existential Risk Research Institute',
    kind: 'academic',
    thesis: 'Orthogonality thesis: any level of intelligence can be combined with any goal; instrumental convergence makes misaligned AI the default risk outcome.',
    capabilityDimensions: ['Governance & Policy', 'Proof Chains', 'Outcome Verification'],
    governanceGap: 'Existential-risk research identifies the problem; no production system has closed the gap. A11oy\'s Covenant Layer + Proof Chains are the closest deployed response.',
    a11oyImplication: 'AI existential-risk research frameworks are the theoretical basis for A11oy\'s Constitution. Update Covenant Layer design when this institute publishes new corrigibility or shutdown-problem work.',
    signalWeight: 'High',
    scanCadence: 'Monthly',
  },
];

// ─── Khipu Index — canonical ideas ───────────────────────────────────────────

export type IdeaKind = 'concept' | 'technique' | 'benchmark' | 'paper' | 'repo';

export interface KhipuIdea {
  id: string;
  label: string;
  kind: IdeaKind;
  description: string;
  relevanceScore: number;
  a11oyImplication: string;
  tags: string[];
}

export const KHIPU_IDEAS: KhipuIdea[] = [
  {
    id: 'idea-agentic-ai',
    label: 'Agentic AI',
    kind: 'concept',
    description: 'AI systems that plan, reason, and take multi-step actions autonomously with minimal human intervention.',
    relevanceScore: 0.97,
    a11oyImplication: 'Core A11oy execution paradigm. Every Workcell agent operates agentic loops gated by the Covenant Layer.',
    tags: ['core', 'execution', 'planning'],
  },
  {
    id: 'idea-hitl',
    label: 'Human-in-the-Loop',
    kind: 'concept',
    description: 'Architectural pattern ensuring human approval gates are mandatory checkpoints before consequential agentic actions execute.',
    relevanceScore: 0.99,
    a11oyImplication: 'A11oy\'s Constitutional mandate. Every material action requires explicit human approval — this is structural, not configurable.',
    tags: ['governance', 'constitution', 'core'],
  },
  {
    id: 'idea-proof-chains',
    label: 'Proof Chains',
    kind: 'concept',
    description: 'Cryptographic audit trails that link every recommendation, human approval, and execution event in an immutable sequence.',
    relevanceScore: 0.97,
    a11oyImplication: 'A11oy\'s primary governance differentiator. No comparable frontier system provides this natively.',
    tags: ['governance', 'audit', 'core'],
  },
  {
    id: 'idea-bitter-lesson',
    label: 'Bitter Lesson',
    kind: 'concept',
    description: 'General computation-leveraging methods consistently outperform hand-crafted AI representations over the long run.',
    relevanceScore: 0.82,
    a11oyImplication: 'Agent designs should minimise hardcoded domain knowledge. Structured feedback via Proof Chains enables learning-from-experience at scale.',
    tags: ['scaling', 'rl', 'doctrine'],
  },
  {
    id: 'idea-moe',
    label: 'Mixture of Experts',
    kind: 'technique',
    description: 'Architecture routing each token to a sparse subset of model parameters, enabling massive capacity at lower per-token compute cost.',
    relevanceScore: 0.78,
    a11oyImplication: 'MoE efficiency parameters must be reflected in Aegis cost models. Current overestimation of 40%+ creates incorrect client budget recommendations.',
    tags: ['architecture', 'efficiency', 'cost'],
  },
  {
    id: 'idea-rag',
    label: 'Retrieval-Augmented Generation',
    kind: 'technique',
    description: 'Grounding LLM responses in retrieved external knowledge to improve factual accuracy and reduce hallucination.',
    relevanceScore: 0.85,
    a11oyImplication: 'RAG is the backbone of Counsel\'s legal research and Sentra\'s threat intelligence pipelines.',
    tags: ['grounding', 'enterprise', 'accuracy'],
  },
  {
    id: 'idea-swe-bench',
    label: 'SWE-bench',
    kind: 'benchmark',
    description: 'Real-world software engineering benchmark measuring agent performance on GitHub issue resolution tasks.',
    relevanceScore: 0.88,
    a11oyImplication: 'Primary benchmark for A11oy\'s code-agent capabilities. Portfolio gap to SOTA is tracked weekly.',
    tags: ['benchmark', 'code', 'evaluation'],
  },
  {
    id: 'idea-agentbench',
    label: 'AgentBench',
    kind: 'benchmark',
    description: 'Multi-task agent evaluation across web browsing, code execution, OS interaction, and database tasks.',
    relevanceScore: 0.84,
    a11oyImplication: 'Broadest cross-domain agent benchmark. All portfolio agents are evaluated quarterly; v2 baseline pending.',
    tags: ['benchmark', 'multi-domain', 'evaluation'],
  },
  {
    id: 'idea-gaia',
    label: 'GAIA',
    kind: 'benchmark',
    description: 'General AI assistant benchmark requiring multi-step real-world reasoning across web, tools, and documents.',
    relevanceScore: 0.79,
    a11oyImplication: 'Measures general assistant reasoning depth. Counsel and A11oy are primary candidates for GAIA evaluation.',
    tags: ['benchmark', 'reasoning', 'evaluation'],
  },
  {
    id: 'idea-maniparena',
    label: 'ManipArena',
    kind: 'benchmark',
    description: 'Spatial reasoning benchmark for embodied AI agents across manipulation, navigation, and 3D reasoning tasks.',
    relevanceScore: 0.71,
    a11oyImplication: 'Reveals Sentra\'s 60%+ failure rate on spatial-reasoning tasks. Eval harness integration is a P1 capability upgrade.',
    tags: ['benchmark', 'embodied', 'spatial'],
  },
  {
    id: 'idea-attention',
    label: 'Attention Is All You Need',
    kind: 'paper',
    description: 'Seminal 2017 paper introducing the Transformer architecture — the foundational model for all modern LLMs.',
    relevanceScore: 0.90,
    a11oyImplication: 'All A11oy agents run on Transformer-based models. Architecture shifts post-Transformer (e.g. SSMs) must be tracked for migration planning.',
    tags: ['foundational', 'architecture', 'paper'],
  },
  {
    id: 'idea-openmanus',
    label: 'OpenManus',
    kind: 'repo',
    description: 'Open-source GUI agent framework with observation-action loops for automating GUI-only enterprise software environments.',
    relevanceScore: 0.68,
    a11oyImplication: 'A11oy\'s Workcell layer cannot currently handle GUI-only enterprise environments. OpenManus adapter is a P2 capability upgrade.',
    tags: ['gui', 'enterprise', 'automation'],
  },
  {
    id: 'idea-embodied-ai',
    label: 'Embodied AI',
    kind: 'concept',
    description: 'AI systems that perceive and act in physical or simulated 3D environments through closed sensorimotor loops with physical actuators.',
    relevanceScore: 0.78,
    a11oyImplication: 'Embodied execution environments are an emerging surface for agentic governance. A11oy\'s Covenant Layer must extend PAC policies to physical-world actions.',
    tags: ['robotics', 'perception', 'physical'],
  },
  {
    id: 'idea-next-gen-gpu',
    label: 'Next-Gen GPU Architecture',
    kind: 'technique',
    description: 'Advanced data-center GPU designs with high-bandwidth memory hierarchies and native support for multi-agent concurrent inference workloads.',
    relevanceScore: 0.74,
    a11oyImplication: 'Next-gen GPU cost curves directly affect A11oy\'s Aegis compute budget models. Current Aegis estimates over-price MoE inference by ~40% on latest hardware.',
    tags: ['hardware', 'infrastructure', 'cost'],
  },
  {
    id: 'idea-sovereign-ai',
    label: 'Sovereign AI',
    kind: 'concept',
    description: 'National and regional strategies requiring AI systems to operate on domestic infrastructure and process data within sovereign boundaries.',
    relevanceScore: 0.83,
    a11oyImplication: 'A11oy\'s Sovereign Mode directly addresses this requirement. MENA and EU client pipelines require data residency attestation as a procurement gate.',
    tags: ['policy', 'regulation', 'governance'],
  },
];

// ─── Khipu Index — doctrine citations ────────────────────────────────────────

export type CitationKind = 'paper' | 'report' | 'standard' | 'post' | 'policy';

export interface KhipuCitation {
  id: string;
  title: string;
  kind: CitationKind;
  year: number;
  excerpt: string;
}

export const KHIPU_CITATIONS: KhipuCitation[] = [
  {
    id: 'mcit-01',
    title: 'Attention Is All You Need',
    kind: 'paper',
    year: 2017,
    excerpt: 'The Transformer architecture replaces recurrence entirely with self-attention, enabling parallelisable training and superior long-range dependency modelling.',
  },
  {
    id: 'mcit-02',
    title: 'The Bitter Lesson',
    kind: 'post',
    year: 2019,
    excerpt: 'The biggest lesson that can be read from 70 years of AI research is that general methods that leverage computation are ultimately the most effective.',
  },
  {
    id: 'mcit-03',
    title: 'NIST AI Risk Management Framework 2.0',
    kind: 'standard',
    year: 2024,
    excerpt: 'The GOVERN function requires organisations to establish accountability structures, policies, and processes for AI risk throughout the system lifecycle.',
  },
  {
    id: 'mcit-04',
    title: 'EU AI Act — High-Risk System Requirements',
    kind: 'policy',
    year: 2024,
    excerpt: 'High-risk AI systems must be designed and developed in such a way that they can be effectively overseen by natural persons during the period in which the AI system is in use.',
  },
  {
    id: 'mcit-05',
    title: 'SWE-bench: Can Language Models Resolve Real-World GitHub Issues?',
    kind: 'paper',
    year: 2023,
    excerpt: 'We introduce SWE-bench, a benchmark consisting of 2,294 software engineering problems drawn from real GitHub issues and corresponding pull requests.',
  },
  {
    id: 'mcit-06',
    title: 'AgentBench: Evaluating LLMs as Agents',
    kind: 'paper',
    year: 2023,
    excerpt: 'AgentBench provides a multi-dimensional evaluation across eight distinct environments including OS interaction, web browsing, and database manipulation.',
  },
];
