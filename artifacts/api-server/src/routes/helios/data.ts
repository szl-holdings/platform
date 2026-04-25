import type { Signal, MythosNode, MythosEdge, CapabilityProposal, Scanner, RecalibrationMemo, BenchmarkScore, BenchmarkTimeSeries } from './types';

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

export const SIGNALS: Signal[] = [
  {
    id: 'sig-001', kind: 'capability', scanner: 'arxiv',
    title: 'ManipArena: Spatial Reasoning Evaluation for Embodied AI Agents',
    summary: 'New benchmark suite evaluating manipulation, navigation, and spatial reasoning in 3D environments. Outlines gaps in current LLM-agent architectures for embodied tasks.',
    soWhat: 'Sentra\'s incident-triage agents lack spatial-reasoning pathways; ManipArena-style evals would surface this gap before it becomes a production blind spot.',
    sourceUrl: 'https://arxiv.org/abs/2405.manip',
    sourceName: 'arXiv cs.RO',
    confidence: 0.91,
    impactScore: 0.88,
    entities: ['ManipArena', 'Embodied AI', 'Spatial Reasoning', 'LLM Agents'],
    claims: [
      'Current SOTA agents score below 40% on ManipArena object-manipulation tasks.',
      'Spatial-reasoning deficits correlate with failure rates in sequential decision-making chains.',
      'Benchmark includes 200+ standardized procedurally-generated environments.',
    ],
    affectedAgents: ['Sentra', 'Aegis', 'A11oy'],
    createdAt: daysAgo(0),
  },
  {
    id: 'sig-002', kind: 'vendor', scanner: 'vendor',
    title: 'NVIDIA Vera Rubin: Next-Gen Data Center GPU with 1.5 TB/s Memory Bandwidth',
    summary: 'NVIDIA announced the Vera Rubin GPU architecture featuring NVLink 6 and massive HBM4 stacks. Inference throughput for 405B+ models increases 4× vs Hopper.',
    soWhat: 'Cost-per-inference on large agentic models drops significantly; Aegis and A11oy can afford more reasoning steps per dollar, enabling deeper multi-hop policy evaluation.',
    sourceUrl: 'https://nvidianews.nvidia.com/news/vera-rubin',
    sourceName: 'NVIDIA Newsroom',
    confidence: 0.97,
    impactScore: 0.92,
    entities: ['NVIDIA', 'Vera Rubin', 'HBM4', 'NVLink 6', 'Hopper'],
    claims: [
      '1.5 TB/s memory bandwidth per GPU vs. 3.35 TB/s for H100 SXM5.',
      'Targeted at multi-agent inference workloads with long context windows.',
      'Vera Rubin sampling begins late 2025 for hyperscalers.',
    ],
    affectedAgents: ['Aegis', 'A11oy', 'KORA'],
    createdAt: daysAgo(0),
  },
  {
    id: 'sig-003', kind: 'market', scanner: 'market',
    title: 'Gartner: AI Infrastructure Market to Reach $6.3T by 2029, Agentic AI Leading Growth',
    summary: 'Gartner forecasts agentic AI spend to exceed $500B annually by 2027. Enterprises increasingly demand autonomous decision-making with governance guardrails.',
    soWhat: 'Market validation for Helios\'s entire thesis: governed agentic AI is the dominant infrastructure play. SZL portfolio positioning is ahead of the curve.',
    sourceUrl: 'https://www.gartner.com/en/newsroom/press-releases/2025-ai-infra',
    sourceName: 'Gartner Newsroom',
    confidence: 0.89,
    impactScore: 0.95,
    entities: ['Gartner', 'Agentic AI', 'AI Infrastructure', 'Enterprise AI'],
    claims: [
      '$6.3T total addressable market for AI infrastructure by 2029.',
      'Agentic AI segment growing at 45% CAGR vs. 28% for overall AI.',
      '73% of surveyed enterprises plan multi-agent deployments by 2026.',
    ],
    affectedAgents: ['Sentra', 'Counsel', 'Terra', 'Vessels', 'Aegis', 'KORA', 'A11oy'],
    createdAt: daysAgo(1),
  },
  {
    id: 'sig-004', kind: 'capability', scanner: 'arxiv',
    title: 'Credo AI\'s Weaver: Memory-Bandwidth-Efficient Mixture-of-Experts Routing',
    summary: 'Weaver introduces a dynamic expert-routing scheme that reduces HBM bandwidth by 60% for MoE models, enabling 2× throughput at equal cost.',
    soWhat: 'Weaver-class memory-bandwidth metrics should feed into Aegis cost models — current compute cost estimates overestimate MoE inference cost by up to 2×.',
    sourceUrl: 'https://arxiv.org/abs/2405.weaver',
    sourceName: 'arXiv cs.LG',
    confidence: 0.85,
    impactScore: 0.83,
    entities: ['Credo AI', 'Weaver', 'MoE', 'Memory Bandwidth', 'Expert Routing'],
    claims: [
      'Dynamic routing reduces dead-expert activation waste from 34% to 11%.',
      'Compatible with Mixtral and DBRX-style architectures out of the box.',
      'Open-weights reference implementation released under Apache 2.0.',
    ],
    affectedAgents: ['Aegis', 'KORA'],
    createdAt: daysAgo(1),
  },
  {
    id: 'sig-005', kind: 'regulation', scanner: 'mena',
    title: 'Saudi Arabia National AI Strategy: Sovereign AI Mandate for Healthcare Data',
    summary: 'Saudi Vision 2030 AI committee issues sovereign-AI mandate requiring all healthcare AI models to run on Saudi-hosted infrastructure, citing Seha Virtual Hospital as reference deployment.',
    soWhat: 'Counsel\'s healthcare-matter playbooks need Saudi Seha care-pathway templates; without them, any Gulf healthcare client faces compliance risk on Day 1.',
    sourceUrl: 'https://ai.sa/national-strategy',
    sourceName: 'Saudi AI Authority',
    confidence: 0.94,
    impactScore: 0.91,
    entities: ['Saudi Arabia', 'Vision 2030', 'Seha', 'Sovereign AI', 'Healthcare AI'],
    claims: [
      'Mandate effective Q1 2026 for new healthcare AI deployments.',
      'Seha Virtual Hospital processes 2.2M consultations/year as reference architecture.',
      'Non-compliant deployments subject to AED 5M penalty per incident.',
    ],
    affectedAgents: ['Counsel', 'KORA'],
    createdAt: daysAgo(2),
  },
  {
    id: 'sig-006', kind: 'benchmark', scanner: 'conference',
    title: 'NeurIPS 2025 Paper of the Week: AgentBench v2 with Real-World Long-Horizon Tasks',
    summary: 'AgentBench v2 extends the original benchmark with 500+ long-horizon tasks spanning multi-day web sessions, code repositories, and OS administration. Current SOTA: 62.4%.',
    soWhat: 'Our agents have not been evaluated against AgentBench v2 long-horizon tasks; scheduling a run via eval-forge would surface capability regressions before clients discover them.',
    sourceUrl: 'https://neurips.cc/2025/agentbench-v2',
    sourceName: 'NeurIPS 2025',
    confidence: 0.96,
    impactScore: 0.85,
    entities: ['AgentBench', 'NeurIPS', 'Long-Horizon Tasks', 'SOTA Benchmarks'],
    claims: [
      'AgentBench v2 SOTA at 62.4% for best proprietary models.',
      'Open-source agents plateau at 41% due to context-window limitations.',
      'New sub-tasks in OS admin category prove most challenging (SOTA 38%).',
    ],
    affectedAgents: ['Sentra', 'Counsel', 'A11oy'],
    createdAt: daysAgo(2),
  },
  {
    id: 'sig-007', kind: 'capability', scanner: 'github',
    title: 'GitHub Trending: OpenManus — Open-Source Computer-Use Agent Framework',
    summary: 'OpenManus reaches 18k stars in two weeks; provides a plug-in framework for GUI agents with observation-action-reward loops compatible with standard RL infrastructure.',
    soWhat: 'A11oy\'s workcell execution layer could leverage OpenManus-style GUI agents to handle legacy enterprise UIs without API access — a frequent client blocker.',
    sourceUrl: 'https://github.com/OpenManus/openmanus',
    sourceName: 'GitHub Trending',
    confidence: 0.88,
    impactScore: 0.80,
    entities: ['OpenManus', 'GUI Agents', 'Computer Use', 'RL', 'A11oy'],
    claims: [
      '18k GitHub stars in 14 days, fastest-growing agent framework of 2025.',
      'Benchmarks show 78% task completion on OSWorld vs. 71% for Claude Computer Use.',
      'Apache 2.0 license; commercial use explicitly permitted.',
    ],
    affectedAgents: ['A11oy', 'KORA'],
    createdAt: daysAgo(3),
  },
  {
    id: 'sig-008', kind: 'threat', scanner: 'vendor',
    title: 'Anthropic Claude 3.7 Achieves 72% on SWE-bench Full — Closing Gap with GPT-4o',
    summary: 'Claude 3.7 Sonnet closes the SWE-bench gap to within 3pp of GPT-4o and introduces extended thinking mode enabling 32k token chain-of-thought for hard tasks.',
    soWhat: 'If our portfolio agents rely on GPT-4o for reasoning-heavy tasks, Claude 3.7 now represents a viable cost-saving alternative — merit a model-routing evaluation.',
    sourceUrl: 'https://anthropic.com/claude-3-7',
    sourceName: 'Anthropic',
    confidence: 0.98,
    impactScore: 0.87,
    entities: ['Anthropic', 'Claude 3.7', 'SWE-bench', 'GPT-4o', 'Extended Thinking'],
    claims: [
      'Claude 3.7 scores 72% on SWE-bench Full vs. 75% for GPT-4o.',
      'Extended thinking mode adds 15pp on math olympiad benchmarks.',
      'Priced at $3/$15 per million input/output tokens — 40% cheaper than GPT-4o.',
    ],
    affectedAgents: ['Sentra', 'Counsel', 'Aegis', 'KORA'],
    createdAt: daysAgo(3),
  },
  {
    id: 'sig-009', kind: 'market', scanner: 'market',
    title: 'McKinsey: Maritime AI Adoption Rate Tripling — Autonomous Vessels Regulatory Framework Due 2026',
    summary: 'McKinsey Global Institute report cites 3× acceleration in maritime AI adoption driven by IMO autonomous vessel regulations expected in 2026.',
    soWhat: 'Vessels/SEXTANT faces a major expansion opportunity; the upcoming IMO framework will create compliance mandates that Vessels is uniquely positioned to address.',
    sourceUrl: 'https://mckinsey.com/industries/travel-logistics-and-infrastructure/maritime-ai-2025',
    sourceName: 'McKinsey Global Institute',
    confidence: 0.88,
    impactScore: 0.89,
    entities: ['McKinsey', 'Maritime AI', 'IMO', 'Autonomous Vessels', 'SEXTANT'],
    claims: [
      'Maritime AI market to reach $15B by 2028, growing from $4.8B in 2024.',
      'IMO MSC.1/Circ regulatory framework expected Q3 2026.',
      '62% of surveyed carriers piloting AI-assisted route optimization.',
    ],
    affectedAgents: ['Vessels'],
    createdAt: daysAgo(4),
  },
  {
    id: 'sig-010', kind: 'capability', scanner: 'arxiv',
    title: 'GAIA-2: General AI Assistant Benchmark — Long-Context Real-World Tasks Up to 128k Tokens',
    summary: 'GAIA-2 extends the original GAIA benchmark with 128k context tasks involving multi-document synthesis, database querying, and autonomous web research.',
    soWhat: 'GAIA-2 long-context tasks directly map to Counsel matter-analysis workflows; a GAIA-2 eval run via eval-forge would quantify Counsel\'s long-context ceiling.',
    sourceUrl: 'https://gaia-benchmark.github.io/gaia2',
    sourceName: 'arXiv cs.AI',
    confidence: 0.93,
    impactScore: 0.82,
    entities: ['GAIA-2', 'Long Context', 'Multi-Document', 'Web Research', 'Benchmarks'],
    claims: [
      'GAIA-2 adds 3 difficulty levels mapped to 1k, 32k, and 128k token budgets.',
      'Best agent achieves 67% on Level 1, 41% on Level 2, 18% on Level 3.',
      'Dataset publicly available; evaluations run via standardized API.',
    ],
    affectedAgents: ['Counsel', 'KORA'],
    createdAt: daysAgo(5),
  },
  {
    id: 'sig-011', kind: 'vendor', scanner: 'vendor',
    title: 'Google DeepMind Gemini 2.0 Pro: Native Audio-Video Understanding for Multimodal Agents',
    summary: 'Gemini 2.0 Pro introduces real-time audio-video understanding, enabling agents to process live camera feeds and voice streams natively without preprocessing pipelines.',
    soWhat: 'Aegis surveillance-analysis and Vessels ship-inspection agents could consume camera streams directly; eliminates costly preprocessing and reduces latency by ~800ms.',
    sourceUrl: 'https://deepmind.google/technologies/gemini',
    sourceName: 'Google DeepMind',
    confidence: 0.96,
    impactScore: 0.88,
    entities: ['Google DeepMind', 'Gemini 2.0', 'Multimodal', 'Audio-Video', 'Real-Time'],
    claims: [
      'Gemini 2.0 Pro processes 1M token context including interleaved video frames.',
      'Native audio transcription at 99.2% WER on diverse accents.',
      'Available via Google AI Studio and Vertex AI as of March 2025.',
    ],
    affectedAgents: ['Aegis', 'Vessels', 'Sentra'],
    createdAt: daysAgo(5),
  },
  {
    id: 'sig-012', kind: 'regulation', scanner: 'mena',
    title: 'UAE TDRA AI Governance Framework v2: Mandatory Explainability for Automated Decisions',
    summary: 'UAE Telecommunications and Digital Government Regulatory Authority releases AI governance framework requiring documented explainability chains for all automated government decisions.',
    soWhat: 'Counsel\'s proof-chain architecture already meets these requirements; marketing opportunity to position Counsel as the compliant legal AI for UAE government clients.',
    sourceUrl: 'https://tdra.gov.ae/ai-governance-v2',
    sourceName: 'UAE TDRA',
    confidence: 0.92,
    impactScore: 0.84,
    entities: ['UAE', 'TDRA', 'AI Governance', 'Explainability', 'Automated Decisions'],
    claims: [
      'Framework effective January 2026 for federal government entities.',
      'Requires audit trail retention for 7 years per automated decision.',
      'Third-party certification required for high-risk AI systems.',
    ],
    affectedAgents: ['Counsel', 'KORA', 'A11oy'],
    createdAt: daysAgo(6),
  },
];

export const MYTHOS_NODES: MythosNode[] = [
  { id: 'mn-001', kind: 'concept',   label: 'Agentic AI',           description: 'AI systems that plan, reason, and take multi-step actions autonomously with minimal human intervention.',              tags: ['autonomous', 'planning', 'LLM'], relevanceScore: 0.98, linkedSignalCount: 8 },
  { id: 'mn-002', kind: 'concept',   label: 'Embodied AI',          description: 'AI systems that interact with physical or simulated 3D environments through sensorimotor loops.',                 tags: ['robotics', 'perception', 'manipulation'], relevanceScore: 0.91, linkedSignalCount: 3 },
  { id: 'mn-003', kind: 'benchmark', label: 'ManipArena',           description: 'Spatial reasoning benchmark for embodied AI agents across manipulation, navigation, and 3D reasoning tasks.',     tags: ['robotics', 'benchmark', 'evaluation'], relevanceScore: 0.89, linkedSignalCount: 2 },
  { id: 'mn-004', kind: 'benchmark', label: 'SWE-bench',            description: 'Real-world software engineering benchmark on GitHub issues; measures code-writing and debugging capability.',    tags: ['coding', 'benchmark', 'evaluation'], relevanceScore: 0.93, linkedSignalCount: 4 },
  { id: 'mn-005', kind: 'benchmark', label: 'AgentBench',           description: 'Multi-task agent benchmark across web browsing, code, OS, and database tasks.',                                  tags: ['agent', 'benchmark', 'multi-task'], relevanceScore: 0.90, linkedSignalCount: 3 },
  { id: 'mn-006', kind: 'benchmark', label: 'GAIA',                 description: 'General AI assistant benchmark requiring real-world reasoning across web, tools, and documents.',               tags: ['reasoning', 'benchmark', 'evaluation'], relevanceScore: 0.87, linkedSignalCount: 3 },
  { id: 'mn-007', kind: 'vendor',    label: 'NVIDIA',               description: 'Leading GPU manufacturer driving AI infrastructure with Hopper, Ada, and Vera Rubin architectures.',             tags: ['hardware', 'GPU', 'infrastructure'], relevanceScore: 0.96, linkedSignalCount: 2 },
  { id: 'mn-008', kind: 'vendor',    label: 'Anthropic',            description: 'AI safety company; makers of the Claude model family including Claude 3 Opus, Sonnet, and Haiku.',              tags: ['foundation model', 'safety', 'Claude'], relevanceScore: 0.95, linkedSignalCount: 3 },
  { id: 'mn-009', kind: 'vendor',    label: 'Google DeepMind',      description: 'Combined Google AI research lab behind Gemini, AlphaFold, and AlphaCode.',                                      tags: ['foundation model', 'multimodal', 'Gemini'], relevanceScore: 0.94, linkedSignalCount: 2 },
  { id: 'mn-010', kind: 'technique', label: 'Mixture of Experts',   description: 'Neural architecture where sparse expert sub-networks route each token, enabling massive capacity at lower cost.',tags: ['MoE', 'sparse', 'routing', 'scaling'], relevanceScore: 0.88, linkedSignalCount: 2 },
  { id: 'mn-011', kind: 'concept',   label: 'Sovereign AI',         description: 'National or regional AI strategies requiring AI systems to run on domestic infrastructure and data.',            tags: ['policy', 'MENA', 'regulation', 'governance'], relevanceScore: 0.90, linkedSignalCount: 3 },
  { id: 'mn-012', kind: 'repo',      label: 'OpenManus',            description: 'Open-source GUI agent framework with observation-action-reward loops for computer-use tasks.',                  tags: ['GUI', 'agent', 'open-source', 'RL'], relevanceScore: 0.82, linkedSignalCount: 1 },
  { id: 'mn-013', kind: 'technique', label: 'Retrieval-Augmented Generation', description: 'Augmenting LLM generation with retrieved documents from external knowledge bases.',                   tags: ['RAG', 'retrieval', 'vector search'], relevanceScore: 0.86, linkedSignalCount: 4 },
  { id: 'mn-014', kind: 'person',    label: 'Demis Hassabis',       description: 'CEO of Google DeepMind; Nobel Prize laureate (Chemistry 2024) for AlphaFold.',                                  tags: ['DeepMind', 'leadership', 'Nobel'], relevanceScore: 0.78, linkedSignalCount: 1 },
  { id: 'mn-015', kind: 'paper',     label: 'Attention Is All You Need', description: 'Seminal 2017 paper introducing the Transformer architecture; foundation of modern LLMs.',               tags: ['transformer', 'attention', 'NLP', 'seminal'], relevanceScore: 0.92, linkedSignalCount: 5 },
];

export const MYTHOS_EDGES: MythosEdge[] = [
  { source: 'mn-002', target: 'mn-003', relation: 'benchmarked-on' },
  { source: 'mn-001', target: 'mn-004', relation: 'benchmarked-on' },
  { source: 'mn-001', target: 'mn-005', relation: 'benchmarked-on' },
  { source: 'mn-001', target: 'mn-006', relation: 'benchmarked-on' },
  { source: 'mn-008', target: 'mn-004', relation: 'benchmarked-on' },
  { source: 'mn-009', target: 'mn-004', relation: 'benchmarked-on' },
  { source: 'mn-010', target: 'mn-007', relation: 'implements' },
  { source: 'mn-012', target: 'mn-001', relation: 'implements' },
  { source: 'mn-013', target: 'mn-015', relation: 'cites' },
  { source: 'mn-008', target: 'mn-009', relation: 'competes-with' },
  { source: 'mn-014', target: 'mn-009', relation: 'authored-by' },
  { source: 'mn-001', target: 'mn-011', relation: 'cites' },
  { source: 'mn-013', target: 'mn-001', relation: 'extends' },
];

export const PROPOSALS: CapabilityProposal[] = [
  {
    id: 'prop-001', status: 'new', priority: 'P1',
    title: 'Add ManipArena-style Spatial-Reasoning Eval to Sentra Incident Triage',
    description: 'Integrate a spatial-reasoning evaluation module into Sentra\'s incident-triage pipeline, mirroring ManipArena\'s 3D-environment task structure for physical-security scenarios.',
    rationale: 'ManipArena reveals that current LLM agents fail on spatial multi-step tasks at >60% rate. Sentra\'s physical-security triage workflows have analogous spatial dependencies (camera-grid traversal, facility maps). Exposing this gap via standardized evals prevents silent failures in high-stakes security incidents.',
    targetAgent: 'Sentra', impactArea: 'Incident Triage · Evaluation',
    signalIds: ['sig-001', 'sig-006'], estimatedEffort: '3–5 days',
    createdAt: daysAgo(0), updatedAt: daysAgo(0),
  },
  {
    id: 'prop-002', status: 'new', priority: 'P1',
    title: 'Wire Credo Weaver-Class Memory-Bandwidth Metrics into Aegis Cost Model',
    description: 'Update Aegis\'s compute-cost estimation module to account for Weaver-style MoE memory-bandwidth efficiency, correcting systematic overestimation of inference costs for large models.',
    rationale: 'Current cost model uses naive FLOPs-based estimates that overstate MoE inference cost by 40–100%. Weaver demonstrates 60% bandwidth reduction is achievable. Aegis\'s budget recommendations to clients are potentially off by the same factor, affecting trust.',
    targetAgent: 'Aegis', impactArea: 'Cost Modeling · Infrastructure',
    signalIds: ['sig-004'], estimatedEffort: '2–3 days',
    createdAt: daysAgo(1), updatedAt: daysAgo(1),
  },
  {
    id: 'prop-003', status: 'new', priority: 'P0',
    title: 'Add Saudi Seha Care-Pathway Templates to Counsel Healthcare Playbook',
    description: 'Extend Counsel\'s healthcare legal matter playbooks with Saudi Seha Virtual Hospital care-pathway templates and UAE TDRA AI governance compliance checklists for Gulf region clients.',
    rationale: 'Saudi sovereign AI mandate (Q1 2026 effective date) and UAE TDRA AI governance framework create mandatory compliance requirements for any healthcare AI deployed in the Gulf. Without Seha-aligned templates, Counsel cannot serve this market. Given the AED 5M penalty per incident, the cost of non-compliance vastly exceeds implementation cost.',
    targetAgent: 'Counsel', impactArea: 'Legal Templates · MENA Compliance',
    signalIds: ['sig-005', 'sig-012'], estimatedEffort: '5–8 days',
    createdAt: daysAgo(1), updatedAt: daysAgo(1),
  },
  {
    id: 'prop-004', status: 'accepted', priority: 'P1',
    title: 'Evaluate Claude 3.7 as Cost-Saving Model Alternative for Reasoning Agents',
    description: 'Run A/B model evaluation comparing Claude 3.7 Sonnet vs. GPT-4o across Sentra, Counsel, Aegis, and KORA reasoning workflows to determine switchover viability.',
    rationale: 'Claude 3.7 scores within 3pp of GPT-4o on SWE-bench at 40% lower cost. For high-volume reasoning tasks (Counsel matter analysis, KORA decision synthesis), switching to Claude 3.7 could reduce inference spend by 35–40% with negligible quality impact.',
    targetAgent: 'Counsel', impactArea: 'LLM Cost · Model Routing',
    signalIds: ['sig-008'], estimatedEffort: '2–4 days',
    createdAt: daysAgo(2), updatedAt: daysAgo(0),
  },
  {
    id: 'prop-005', status: 'new', priority: 'P2',
    title: 'Integrate OpenManus GUI-Agent Layer into A11oy Workcell Execution',
    description: 'Add an OpenManus-compatible GUI agent adapter to A11oy\'s workcell execution layer, enabling autonomous interaction with enterprise UIs that lack structured APIs.',
    rationale: 'A recurring client blocker is legacy enterprise UIs without API access. OpenManus demonstrates 78% task completion on OSWorld — higher than Claude Computer Use (71%). A plug-in adapter would unlock a class of automation tasks currently handled by manual workarounds.',
    targetAgent: 'A11oy', impactArea: 'Workcell Execution · GUI Automation',
    signalIds: ['sig-007'], estimatedEffort: '1–2 weeks',
    createdAt: daysAgo(2), updatedAt: daysAgo(2),
  },
  {
    id: 'prop-006', status: 'deferred', priority: 'P2',
    title: 'Add IMO Autonomous Vessel Compliance Module to Vessels/SEXTANT',
    description: 'Pre-build an IMO MSC.1/Circ compliance assessment module for SEXTANT so it\'s production-ready when the 2026 regulatory framework is finalized.',
    rationale: 'McKinsey projects maritime AI market at $15B by 2028. The IMO framework (expected Q3 2026) will create mandatory compliance requirements for autonomous vessel operators. Building ahead of the regulation positions SEXTANT as the compliance-ready choice at launch.',
    targetAgent: 'Vessels', impactArea: 'Regulatory Compliance · Maritime',
    signalIds: ['sig-009'], estimatedEffort: '2–3 weeks',
    createdAt: daysAgo(3), updatedAt: daysAgo(1),
  },
  {
    id: 'prop-007', status: 'new', priority: 'P2',
    title: 'Enable Gemini 2.0 Native Video Streams for Aegis Surveillance Analysis',
    description: 'Add a Gemini 2.0 Pro adapter to Aegis\'s camera-feed analysis pipeline, enabling native video-frame processing without the current FFmpeg preprocessing step.',
    rationale: 'Current Aegis surveillance pipeline adds ~800ms latency for video preprocessing. Gemini 2.0 Pro processes interleaved video frames natively within its 1M token context. Eliminating preprocessing would cut latency by ~75% and reduce per-frame processing cost.',
    targetAgent: 'Aegis', impactArea: 'Surveillance · Computer Vision',
    signalIds: ['sig-011'], estimatedEffort: '3–5 days',
    createdAt: daysAgo(4), updatedAt: daysAgo(4),
  },
  {
    id: 'prop-008', status: 'rejected', priority: 'P3',
    title: 'Migrate A11oy Runtime to Vera Rubin GPU Cluster (Pre-GA)',
    description: 'Evaluate early migration of A11oy inference workloads to NVIDIA Vera Rubin hardware to gain 4× throughput advantage ahead of general availability.',
    rationale: 'Vera Rubin sampling begins late 2025 for hyperscalers but is not in public GA. Migration risk at this stage exceeds benefit; defer to when Vera Rubin reaches cloud provider availability in H1 2026.',
    targetAgent: 'A11oy', impactArea: 'Infrastructure · GPU Migration',
    signalIds: ['sig-002'], estimatedEffort: 'High (infra migration)',
    createdAt: daysAgo(5), updatedAt: daysAgo(2),
  },
];

export const SCANNERS: Scanner[] = [
  { id: 'scanner-github', name: 'GitHub Trending + Awesome Lists', description: 'Scans GitHub trending repositories (daily) and curated awesome-lists for AI agents, embodied AI, and MLOps. Extracts starred repos, license, and key contributors.', enabled: true, lastRun: daysAgo(0), nextRun: daysFromNow(1), status: 'healthy', signalsToday: 4, totalSignals: 142 },
  { id: 'scanner-arxiv', name: 'arXiv Feed (cs.AI, cs.LG, cs.CL, cs.RO)', description: 'Monitors arXiv daily submissions across four CS categories. LLM-powered relevance scoring filters to top-10 papers per day by portfolio impact.', enabled: true, lastRun: daysAgo(0), nextRun: daysFromNow(1), status: 'healthy', signalsToday: 3, totalSignals: 287 },
  { id: 'scanner-conference', name: 'Conference Paper RSS (NeurIPS / ICML / CVPR / ICLR / ACL)', description: 'Tracks accepted paper announcements and paper-of-the-week highlights from major AI/ML conferences. Extracts benchmark results and code release status.', enabled: true, lastRun: daysAgo(1), nextRun: daysFromNow(1), status: 'healthy', signalsToday: 1, totalSignals: 64 },
  { id: 'scanner-vendor', name: 'Vendor Announcement Feeds', description: 'Monitors press releases and engineering blogs from NVIDIA, AMD, TSMC, Anthropic, OpenAI, Google DeepMind, and Meta AI. Rate-limited to 24h cadence.', enabled: true, lastRun: daysAgo(0), nextRun: daysFromNow(1), status: 'healthy', signalsToday: 3, totalSignals: 198 },
  { id: 'scanner-market', name: 'Market Intelligence (Gartner / IDC / McKinsey)', description: 'Scans public press releases and blog posts from major analyst firms. Extracts market sizing, growth forecasts, and enterprise adoption metrics.', enabled: true, lastRun: daysAgo(1), nextRun: daysFromNow(1), status: 'degraded', signalsToday: 1, totalSignals: 55, errorMessage: 'Rate limit hit on Gartner newsroom RSS — retrying with exponential backoff.' },
  { id: 'scanner-mena', name: 'MENA / Regional AI Sources', description: 'Tracks regional AI policy announcements from UAE TDRA, Saudi AI Authority, NEOM, and healthcare AI initiatives like Seha Virtual Hospital.', enabled: true, lastRun: daysAgo(2), nextRun: daysFromNow(1), status: 'healthy', signalsToday: 2, totalSignals: 38 },
];

function weekDate(weeksAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - weeksAgo * 7);
  d.setDate(d.getDate() - d.getDay()); // Monday of that week
  return d.toISOString().slice(0, 10);
}

export const RECALIBRATION_MEMOS: RecalibrationMemo[] = [
  {
    id: 'memo-001', weekOf: weekDate(0), title: 'Week of April 21: Embodied AI Surge & MENA Sovereignty Mandate',
    audit: `Current capability gaps identified this week:

• Sentra lacks spatial-reasoning evaluation pathways — ManipArena reveals 60%+ failure rates on analogous tasks
• Counsel has no Gulf-region healthcare legal templates; Saudi sovereign AI mandate (Q1 2026) creates immediate compliance risk
• Aegis cost model overestimates MoE inference cost by 40–100% based on Weaver findings
• A11oy's workcell layer cannot handle GUI-only enterprise environments (OpenManus demonstrates 78% capability)

12 signals ingested this week. 3 active scanners flagged high-confidence items (>0.9). 1 scanner degraded (Gartner rate limit).`,
    blueprint: `Recommended capability upgrades (priority order):

P0 — Counsel: Add Saudi Seha care-pathway templates + UAE TDRA explainability compliance checklists. This is time-sensitive given January 2026 regulatory deadlines.

P1 — Sentra: Integrate ManipArena-style spatial-reasoning eval harness. Use eval-forge ManipArena adapter for automated regression tracking.

P1 — Aegis: Update compute cost model with Weaver-class MoE bandwidth efficiency parameters. Correct 40%+ overestimation in client budget recommendations.

P1 — All Agents: Evaluate Claude 3.7 as model routing alternative. 40% cost reduction at comparable quality on SWE-bench tasks.

P2 — A11oy: Integrate OpenManus GUI-agent adapter for legacy enterprise UI automation.`,
    roadmap: `Execution sequence:

Week 1: Ship Counsel MENA compliance templates (P0). Begin Claude 3.7 A/B eval framework setup.
Week 2: Complete Claude 3.7 A/B runs across Sentra + Counsel + Aegis. Finalize Aegis cost-model patch.
Week 3: Merge ManipArena eval harness into Sentra eval suite. Run first benchmark cycle.
Week 4: Release A11oy OpenManus GUI-agent adapter as experimental feature flag.

Dependencies: eval-forge ManipArena adapter (stub available, dataset pending). Claude 3.7 API access (available now).

Success metrics: Counsel MENA template coverage ≥95%, Aegis cost-model error <10%, Sentra spatial-reasoning baseline established.`,
    signalCount: 12, proposalCount: 7, createdAt: daysAgo(0),
  },
  {
    id: 'memo-002', weekOf: weekDate(1), title: 'Week of April 14: Foundation Model Race & Maritime AI Acceleration',
    audit: `Key findings from last week's frontier scan:

• Gemini 2.0 Pro multimodal capability significantly ahead of portfolio's current vision pipeline
• McKinsey maritime AI report confirms SEXTANT is ahead of market curve; IMO framework will accelerate demand
• SWE-bench v2 long-horizon tasks reveal context-window ceiling for A11oy's code agents
• NeurIPS AgentBench v2 launch — need to run portfolio against updated benchmark immediately

8 signals ingested. All scanners healthy. 5 new proposals generated.`,
    blueprint: `Recommended capability upgrades:

P1 — Aegis + Vessels: Add Gemini 2.0 Pro native video-stream adapter. Eliminates 800ms preprocessing latency for camera-feed analysis.

P1 — Vessels: Pre-build IMO MSC.1/Circ compliance assessment module for Q3 2026 readiness.

P2 — All Agents: Schedule AgentBench v2 evaluation runs via eval-forge. Establish per-agent baseline before external benchmarking.

P3 — A11oy: Evaluate NVIDIA Vera Rubin migration timeline (defer to H1 2026 GA).`,
    roadmap: `Week 1: Deploy Gemini 2.0 Pro adapter behind feature flag in Aegis (experimental).
Week 2: Run AgentBench v2 baseline for all portfolio agents. Document results.
Week 3: Begin IMO compliance module architecture for Vessels (design phase).
Week 4: Publish internal benchmark report; present to SZL leadership.`,
    signalCount: 8, proposalCount: 5, createdAt: daysAgo(7),
  },
];

function makeHistory(baseScore: number, weekCount: number, trend: number, sotaBase: number) {
  return Array.from({ length: weekCount }, (_, i) => {
    const weeksAgo = weekCount - 1 - i;
    const d = new Date();
    d.setDate(d.getDate() - weeksAgo * 7);
    const jitter = (Math.random() - 0.5) * 0.04;
    const score = Math.max(0.1, Math.min(1, baseScore - (weeksAgo * trend) + jitter));
    const sotaJitter = (Math.random() - 0.5) * 0.02;
    const sota = Math.max(score + 0.05, Math.min(1, sotaBase + sotaJitter));
    return { date: d.toISOString().slice(0, 10), score: Math.round(score * 100) / 100, sotaScore: Math.round(sota * 100) / 100 };
  });
}

export const BENCHMARK_SCORES: BenchmarkScore[] = [
  // SWE-bench Lite
  { agentId: 'sentra',  agentName: 'Sentra',  benchmark: 'swe-bench-lite', score: 0.58, sotaScore: 0.72, delta: 0.03, recordedAt: daysAgo(0) },
  { agentId: 'counsel', agentName: 'Counsel', benchmark: 'swe-bench-lite', score: 0.63, sotaScore: 0.72, delta: 0.05, recordedAt: daysAgo(0) },
  { agentId: 'aegis',   agentName: 'Aegis',   benchmark: 'swe-bench-lite', score: 0.49, sotaScore: 0.72, delta: -0.02, recordedAt: daysAgo(0) },
  { agentId: 'kora',    agentName: 'KORA',    benchmark: 'swe-bench-lite', score: 0.61, sotaScore: 0.72, delta: 0.04, recordedAt: daysAgo(0) },
  // AgentBench
  { agentId: 'sentra',  agentName: 'Sentra',  benchmark: 'agentbench', score: 0.54, sotaScore: 0.62, delta: 0.02, recordedAt: daysAgo(0) },
  { agentId: 'counsel', agentName: 'Counsel', benchmark: 'agentbench', score: 0.59, sotaScore: 0.62, delta: 0.06, recordedAt: daysAgo(0) },
  { agentId: 'a11oy',   agentName: 'A11oy',  benchmark: 'agentbench', score: 0.62, sotaScore: 0.62, delta: 0.03, recordedAt: daysAgo(0) },
  // GAIA
  { agentId: 'counsel', agentName: 'Counsel', benchmark: 'gaia', score: 0.61, sotaScore: 0.67, delta: 0.04, recordedAt: daysAgo(0) },
  { agentId: 'kora',    agentName: 'KORA',   benchmark: 'gaia', score: 0.57, sotaScore: 0.67, delta: 0.01, recordedAt: daysAgo(0) },
  { agentId: 'a11oy',   agentName: 'A11oy',  benchmark: 'gaia', score: 0.55, sotaScore: 0.67, delta: 0.02, recordedAt: daysAgo(0) },
];

export const BENCHMARK_TIME_SERIES: BenchmarkTimeSeries[] = [
  { agentId: 'sentra',  agentName: 'Sentra',  benchmark: 'swe-bench-lite', history: makeHistory(0.58, 8, 0.008, 0.72) },
  { agentId: 'counsel', agentName: 'Counsel', benchmark: 'swe-bench-lite', history: makeHistory(0.63, 8, 0.010, 0.72) },
  { agentId: 'kora',    agentName: 'KORA',    benchmark: 'swe-bench-lite', history: makeHistory(0.61, 8, 0.009, 0.72) },
  { agentId: 'sentra',  agentName: 'Sentra',  benchmark: 'agentbench', history: makeHistory(0.54, 8, 0.007, 0.62) },
  { agentId: 'counsel', agentName: 'Counsel', benchmark: 'agentbench', history: makeHistory(0.59, 8, 0.011, 0.62) },
  { agentId: 'a11oy',   agentName: 'A11oy',  benchmark: 'agentbench', history: makeHistory(0.62, 8, 0.012, 0.62) },
  { agentId: 'counsel', agentName: 'Counsel', benchmark: 'gaia', history: makeHistory(0.61, 8, 0.009, 0.67) },
  { agentId: 'kora',    agentName: 'KORA',   benchmark: 'gaia', history: makeHistory(0.57, 8, 0.006, 0.67) },
];
