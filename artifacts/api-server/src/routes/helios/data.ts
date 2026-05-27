// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import type { Signal, KhipuNode, KhipuEdge, CapabilityProposal, Scanner, RecalibrationMemo, BenchmarkScore, BenchmarkTimeSeries } from './types';

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
    title: 'Spatial Reasoning Evaluation for Embodied AI Agents in 3D Environments',
    summary: 'New benchmark suite evaluating manipulation, navigation, and spatial reasoning in 3D environments. Outlines gaps in current LLM-agent architectures for embodied tasks.',
    soWhat: 'Sentra\'s incident-triage agents lack spatial-reasoning pathways; evaluation against the cited spatial-reasoning benchmark would surface this gap before it becomes a production blind spot.',
    sourceUrl: 'https://arxiv.org/abs/2405.manip',
    sourceName: 'arXiv cs.RO',
    confidence: 0.91,
    impactScore: 0.88,
    entities: ['ManipArena', 'Embodied AI', 'Spatial Reasoning', 'LLM Agents'],
    claims: [
      'Current SOTA agents score below 40% on the cited spatial-reasoning object-manipulation tasks.',
      'Spatial-reasoning deficits correlate with failure rates in sequential decision-making chains.',
      'Benchmark includes 200+ standardized procedurally-generated environments.',
    ],
    affectedAgents: ['Sentra', 'Aegis', 'A11oy'],
    createdAt: daysAgo(0),
  },
  {
    id: 'sig-002', kind: 'vendor', scanner: 'vendor',
    title: 'Next-Gen Data Center GPU: 1.5 TB/s Memory Bandwidth Unlocks Multi-Agent Scale',
    summary: 'A new GPU architecture featuring next-generation interconnect and massive HBM4 stacks was announced. Inference throughput for 405B+ models increases 4× vs previous generation.',
    soWhat: 'Cost-per-inference on large agentic models drops significantly; Aegis and A11oy can afford more reasoning steps per dollar, enabling deeper multi-hop policy evaluation.',
    sourceUrl: 'https://nvidianews.nvidia.com/news/vera-rubin',
    sourceName: 'NVIDIA Newsroom',
    confidence: 0.97,
    impactScore: 0.92,
    entities: ['HBM4', 'GPU Architecture', 'AI Infrastructure', 'Multi-Agent Inference'],
    claims: [
      '1.5 TB/s memory bandwidth per GPU vs. 3.35 TB/s for H100 SXM5.',
      'Targeted at multi-agent inference workloads with long context windows.',
      'Vera Rubin sampling begins late 2025 for hyperscalers.',
    ],
    affectedAgents: ['Aegis', 'A11oy', 'Lyte'],
    createdAt: daysAgo(0),
  },
  {
    id: 'sig-003', kind: 'market', scanner: 'market',
    title: 'AI Infrastructure Market to Reach $6.3T by 2029, Agentic AI Leading Growth',
    summary: 'Leading analyst forecast: agentic AI spend to exceed $500B annually by 2027. Enterprises increasingly demand autonomous decision-making with governance guardrails.',
    soWhat: 'Market validation for Helios\'s entire thesis: governed agentic AI is the dominant infrastructure play. SZL portfolio positioning is ahead of the curve.',
    sourceUrl: 'https://www.gartner.com/en/newsroom/press-releases/2025-ai-infra',
    sourceName: 'Gartner Newsroom',
    confidence: 0.89,
    impactScore: 0.95,
    entities: ['Agentic AI', 'AI Infrastructure', 'Enterprise AI'],
    claims: [
      '$6.3T total addressable market for AI infrastructure by 2029.',
      'Agentic AI segment growing at 45% CAGR vs. 28% for overall AI.',
      '73% of surveyed enterprises plan multi-agent deployments by 2026.',
    ],
    affectedAgents: ['Sentra', 'Counsel', 'Terra', 'Vessels', 'Aegis', 'Lyte', 'A11oy'],
    createdAt: daysAgo(1),
  },
  {
    id: 'sig-004', kind: 'capability', scanner: 'arxiv',
    title: 'Weaver: Memory-Bandwidth-Efficient Mixture-of-Experts Routing',
    summary: 'Weaver introduces a dynamic expert-routing scheme that reduces HBM bandwidth by 60% for MoE models, enabling 2× throughput at equal cost.',
    soWhat: 'Weaver-class memory-bandwidth metrics should feed into Aegis cost models — current compute cost estimates overestimate MoE inference cost by up to 2×.',
    sourceUrl: 'https://arxiv.org/abs/2405.weaver',
    sourceName: 'arXiv cs.LG',
    confidence: 0.85,
    impactScore: 0.83,
    entities: ['Weaver', 'MoE', 'Memory Bandwidth', 'Expert Routing'],
    claims: [
      'Dynamic routing reduces dead-expert activation waste from 34% to 11%.',
      'Compatible with Mixtral and DBRX-style architectures out of the box.',
      'Open-weights reference implementation released under Apache 2.0.',
    ],
    affectedAgents: ['Aegis', 'Lyte'],
    createdAt: daysAgo(1),
  },
  {
    id: 'sig-005', kind: 'regulation', scanner: 'mena',
    title: 'Gulf State AI Sovereignty Strategy: Sovereign AI Infrastructure Mandate for Healthcare',
    summary: 'A Gulf state AI authority issued a sovereign-AI mandate requiring all healthcare AI models to run on nationally-hosted infrastructure, citing a leading state-run virtual hospital as the reference deployment.',
    soWhat: 'Counsel\'s healthcare-matter playbooks need Gulf state care-pathway templates; without them, any Gulf healthcare client faces compliance risk on Day 1.',
    sourceUrl: 'https://ai.sa/national-strategy',
    sourceName: 'Saudi AI Authority',
    confidence: 0.94,
    impactScore: 0.91,
    entities: ['Saudi Arabia', 'Vision 2030', 'Seha', 'Sovereign AI', 'Healthcare AI'],
    claims: [
      'Mandate effective Q1 2026 for new healthcare AI deployments.',
      'The reference state-run virtual hospital processes 2.2M consultations/year as reference architecture.',
      'Non-compliant deployments subject to AED 5M penalty per incident.',
    ],
    affectedAgents: ['Counsel', 'Lyte'],
    createdAt: daysAgo(2),
  },
  {
    id: 'sig-006', kind: 'benchmark', scanner: 'conference',
    title: 'AgentBench v2 with Real-World Long-Horizon Tasks — Frontier Conference Paper of the Week',
    summary: 'AgentBench v2 extends the original benchmark with 500+ long-horizon tasks spanning multi-day web sessions, code repositories, and OS administration. Current SOTA: 62.4%.',
    soWhat: 'Our agents have not been evaluated against AgentBench v2 long-horizon tasks; scheduling a run via eval-forge would surface capability regressions before clients discover them.',
    sourceUrl: 'https://neurips.cc/2025/agentbench-v2',
    sourceName: 'NeurIPS 2025',
    confidence: 0.96,
    impactScore: 0.85,
    entities: ['AgentBench', 'Long-Horizon Tasks', 'SOTA Benchmarks'],
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
    title: 'Open-Source Computer-Use Agent Framework Reaches 18k Stars',
    summary: 'An open-source GUI agent framework reached 18k stars in two weeks; provides a plug-in framework with observation-action-reward loops compatible with standard RL infrastructure.',
    soWhat: 'A11oy\'s workcell execution layer could leverage open-source GUI agents to handle legacy enterprise UIs without API access — a frequent client blocker.',
    sourceUrl: 'https://github.com/OpenManus/openmanus',
    sourceName: 'Open-Source Repository Feed',
    confidence: 0.88,
    impactScore: 0.80,
    entities: ['OpenManus', 'GUI Agents', 'Computer Use', 'RL', 'A11oy'],
    claims: [
      '18k stars in 14 days, fastest-growing agent framework of 2025.',
      'Benchmarks show 78% task completion on OSWorld vs. 71% for a leading proprietary alternative.',
      'Apache 2.0 license; commercial use explicitly permitted.',
    ],
    affectedAgents: ['A11oy', 'Lyte'],
    createdAt: daysAgo(3),
  },
  {
    id: 'sig-008', kind: 'threat', scanner: 'vendor',
    title: 'Extended-Thinking Frontier Model Achieves 72% on SWE-bench — Closing Gap with Leading Models',
    summary: 'A frontier AI safety lab released an extended-thinking model variant that closes the SWE-bench gap to within 3pp of the current leading model, introducing 32k-token chain-of-thought for hard tasks.',
    soWhat: 'If our portfolio agents rely on a single reasoning model for heavy tasks, a comparably-capable model at 40% lower cost now exists — merits a model-routing evaluation.',
    sourceUrl: 'https://anthropic.com/claude-3-7',
    sourceName: 'AI Safety Research Lab — cited source',
    confidence: 0.98,
    impactScore: 0.87,
    entities: ['Extended Thinking', 'SWE-bench', 'Chain-of-Thought Reasoning', 'Model Routing', 'Cost Arbitrage'],
    claims: [
      'Extended-thinking variant scores 72% on SWE-bench Full vs. 75% for current leader.',
      'Extended thinking mode adds 15pp on math olympiad benchmarks.',
      'Priced 40% below the leading model per million tokens at equivalent quality tier.',
    ],
    affectedAgents: ['Sentra', 'Counsel', 'Aegis', 'Lyte'],
    createdAt: daysAgo(3),
  },
  {
    id: 'sig-009', kind: 'market', scanner: 'market',
    title: 'Maritime AI Adoption Rate Tripling — Autonomous Vessels Regulatory Framework Due 2026',
    summary: 'Industry analyst report cites 3× acceleration in maritime AI adoption driven by IMO autonomous vessel regulations expected in 2026.',
    soWhat: 'Vessels faces a major expansion opportunity; the upcoming IMO framework will create compliance mandates that Vessels is uniquely positioned to address.',
    sourceUrl: 'https://mckinsey.com/industries/travel-logistics-and-infrastructure/maritime-ai-2025',
    sourceName: 'McKinsey Global Institute',
    confidence: 0.88,
    impactScore: 0.89,
    entities: ['Maritime AI', 'IMO', 'Autonomous Vessels', 'Vessels'],
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
    affectedAgents: ['Counsel', 'Lyte'],
    createdAt: daysAgo(5),
  },
  {
    id: 'sig-011', kind: 'vendor', scanner: 'vendor',
    title: 'Next-Gen Multimodal Foundation Model: Native Audio-Video Understanding for Agentic Pipelines',
    summary: 'A leading research lab released a multimodal foundation model with real-time audio-video understanding, enabling agents to process live camera feeds and voice streams natively without preprocessing pipelines.',
    soWhat: 'Aegis surveillance-analysis and Vessels ship-inspection agents could consume camera streams directly; eliminates costly preprocessing and reduces latency by ~800ms.',
    sourceUrl: 'https://deepmind.google/technologies/gemini',
    sourceName: 'AI Research Lab — cited source',
    confidence: 0.96,
    impactScore: 0.88,
    entities: ['Multimodal AI', 'Audio-Video Understanding', 'Real-Time Inference', 'Long Context', 'Native Video Processing'],
    claims: [
      'Model processes 1M token context including interleaved video frames.',
      'Native audio transcription at 99.2% WER on diverse accents.',
      'Available via major cloud AI APIs as of March 2025.',
    ],
    affectedAgents: ['Aegis', 'Vessels', 'Sentra'],
    createdAt: daysAgo(5),
  },
  {
    id: 'sig-012', kind: 'regulation', scanner: 'mena',
    title: 'Gulf State AI Governance Framework v2: Mandatory Explainability for Automated Decisions',
    summary: 'A Gulf state digital regulatory authority released an AI governance framework requiring documented explainability chains for all automated government decisions.',
    soWhat: 'Counsel\'s proof-chain architecture already meets these requirements; marketing opportunity to position Counsel as the compliant legal AI for Gulf government clients.',
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
    affectedAgents: ['Counsel', 'Lyte', 'A11oy'],
    createdAt: daysAgo(6),
  },
];

// IDs here are intentionally aligned with @szl-holdings/frontier-khipu package IDs
// so that KhipuIndex enrichment (linkedSignalCount) resolves correctly via ID match.
export const KHIPU_NODES: KhipuNode[] = [
  { id: 'idea-agentic-ai',   kind: 'concept',   label: 'Agentic AI',                    description: 'AI systems that plan, reason, and take multi-step actions autonomously with minimal human intervention.',              tags: ['autonomous', 'planning', 'LLM'],             relevanceScore: 0.98, linkedSignalCount: 8 },
  { id: 'idea-embodied-ai',  kind: 'concept',   label: 'Embodied AI',                   description: 'AI systems that interact with physical or simulated 3D environments through sensorimotor loops.',                 tags: ['robotics', 'perception', 'manipulation'],    relevanceScore: 0.91, linkedSignalCount: 3 },
  { id: 'idea-maniparena',   kind: 'benchmark', label: 'ManipArena',                    description: 'Spatial reasoning benchmark for embodied AI agents across manipulation, navigation, and 3D reasoning tasks.',     tags: ['robotics', 'benchmark', 'evaluation'],       relevanceScore: 0.89, linkedSignalCount: 2 },
  { id: 'idea-swe-bench',    kind: 'benchmark', label: 'SWE-bench',                     description: 'Real-world software engineering benchmark on GitHub issues; measures code-writing and debugging capability.',    tags: ['coding', 'benchmark', 'evaluation'],         relevanceScore: 0.93, linkedSignalCount: 4 },
  { id: 'idea-agentbench',   kind: 'benchmark', label: 'AgentBench',                    description: 'Multi-task agent benchmark across web browsing, code, OS, and database tasks.',                                  tags: ['agent', 'benchmark', 'multi-task'],          relevanceScore: 0.90, linkedSignalCount: 3 },
  { id: 'idea-gaia',         kind: 'benchmark', label: 'GAIA',                          description: 'General AI assistant benchmark requiring real-world reasoning across web, tools, and documents.',               tags: ['reasoning', 'benchmark', 'evaluation'],      relevanceScore: 0.87, linkedSignalCount: 3 },
  { id: 'idea-next-gen-gpu', kind: 'technique', label: 'Next-Gen GPU Architecture',     description: 'Advanced data-center GPU design with high-bandwidth memory and native multi-agent inference optimisation.',    tags: ['hardware', 'GPU', 'infrastructure'],         relevanceScore: 0.96, linkedSignalCount: 2 },
  { id: 'idea-moe',          kind: 'technique', label: 'Mixture of Experts',            description: 'Neural architecture where sparse expert sub-networks route each token, enabling massive capacity at lower cost.',tags: ['MoE', 'sparse', 'routing', 'scaling'],       relevanceScore: 0.88, linkedSignalCount: 2 },
  { id: 'idea-sovereign-ai', kind: 'concept',   label: 'Sovereign AI',                  description: 'National or regional AI strategies requiring AI systems to run on domestic infrastructure and data.',            tags: ['policy', 'MENA', 'regulation', 'governance'],relevanceScore: 0.90, linkedSignalCount: 3 },
  { id: 'idea-openmanus',    kind: 'repo',      label: 'OpenManus',                     description: 'Open-source GUI agent framework with observation-action-reward loops for computer-use tasks.',                  tags: ['GUI', 'agent', 'open-source', 'RL'],         relevanceScore: 0.82, linkedSignalCount: 1 },
  { id: 'idea-rag',          kind: 'technique', label: 'Retrieval-Augmented Generation',description: 'Augmenting LLM generation with retrieved documents from external knowledge bases.',                           tags: ['RAG', 'retrieval', 'vector search'],         relevanceScore: 0.86, linkedSignalCount: 4 },
  { id: 'idea-attention',    kind: 'paper',     label: 'Attention Is All You Need',     description: 'Seminal 2017 paper introducing the Transformer architecture; foundation of modern LLMs.',                       tags: ['transformer', 'attention', 'NLP', 'seminal'],relevanceScore: 0.92, linkedSignalCount: 5 },
];

export const KHIPU_EDGES: KhipuEdge[] = [
  { source: 'idea-embodied-ai',  target: 'idea-maniparena',  relation: 'benchmarked-on' },
  { source: 'idea-agentic-ai',   target: 'idea-swe-bench',   relation: 'benchmarked-on' },
  { source: 'idea-agentic-ai',   target: 'idea-agentbench',  relation: 'benchmarked-on' },
  { source: 'idea-agentic-ai',   target: 'idea-gaia',        relation: 'benchmarked-on' },
  { source: 'idea-moe',          target: 'idea-next-gen-gpu',relation: 'implements' },
  { source: 'idea-openmanus',    target: 'idea-agentic-ai',  relation: 'implements' },
  { source: 'idea-rag',          target: 'idea-attention',   relation: 'cites' },
  { source: 'idea-agentic-ai',   target: 'idea-sovereign-ai',relation: 'cites' },
  { source: 'idea-rag',          target: 'idea-agentic-ai',  relation: 'extends' },
];

export const PROPOSALS: CapabilityProposal[] = [
  {
    id: 'prop-001', status: 'new', priority: 'P1',
    title: 'Add Spatial-Reasoning Evaluation Module to Sentra Incident Triage',
    description: 'Integrate a spatial-reasoning evaluation module into Sentra\'s incident-triage pipeline, using 3D-environment task structures from the cited spatial-reasoning benchmark for physical-security scenarios.',
    rationale: 'Recent spatial-reasoning benchmarks reveal that current LLM agents fail on spatial multi-step tasks at >60% rate. Sentra\'s physical-security triage workflows have analogous spatial dependencies (camera-grid traversal, facility maps). Exposing this gap via standardized evals prevents silent failures in high-stakes security incidents.',
    targetAgent: 'Sentra', impactArea: 'Incident Triage · Evaluation',
    signalIds: ['sig-001', 'sig-006'], estimatedEffort: '3–5 days',
    createdAt: daysAgo(0), updatedAt: daysAgo(0),
  },
  {
    id: 'prop-002', status: 'new', priority: 'P1',
    title: 'Wire Memory-Bandwidth-Efficient MoE Metrics into Aegis Cost Model',
    description: 'Update Aegis\'s compute-cost estimation module to account for memory-bandwidth-efficient MoE routing (see sig-004 citation), correcting systematic overestimation of inference costs for large models.',
    rationale: 'Current cost model uses naive FLOPs-based estimates that overstate MoE inference cost by 40–100%. The cited research demonstrates 60% bandwidth reduction is achievable via expert routing optimization. Aegis\'s budget recommendations to clients are potentially off by the same factor, affecting trust.',
    targetAgent: 'Aegis', impactArea: 'Cost Modeling · Infrastructure',
    signalIds: ['sig-004'], estimatedEffort: '2–3 days',
    createdAt: daysAgo(1), updatedAt: daysAgo(1),
  },
  {
    id: 'prop-003', status: 'new', priority: 'P0',
    title: 'Add Gulf State Healthcare Care-Pathway Templates to Counsel Healthcare Playbook',
    description: 'Extend Counsel\'s healthcare legal matter playbooks with Gulf state care-pathway templates and regional AI governance compliance checklists for Gulf region clients.',
    rationale: 'Regional sovereign AI mandates (Q1 2026 effective date) and Gulf state AI governance frameworks create mandatory compliance requirements for any healthcare AI deployed in the Gulf. Without region-aligned templates, Counsel cannot serve this market. Given the AED 5M penalty per incident, the cost of non-compliance vastly exceeds implementation cost.',
    targetAgent: 'Counsel', impactArea: 'Legal Templates · MENA Compliance',
    signalIds: ['sig-005', 'sig-012'], estimatedEffort: '5–8 days',
    createdAt: daysAgo(1), updatedAt: daysAgo(1),
  },
  {
    id: 'prop-004', status: 'accepted', priority: 'P1',
    title: 'Evaluate Cost-Saving Extended-Thinking Model Alternative for Reasoning Agents',
    description: 'Run A/B model evaluation comparing the extended-thinking model variant vs. our primary reasoning model across Sentra, Counsel, Aegis, and Lyte reasoning workflows to determine switchover viability.',
    rationale: 'The evaluated model (see signal citation) scores within 3pp of our current primary reasoning model on SWE-bench at 40% lower cost. For high-volume reasoning tasks (Counsel matter analysis, Lyte decision synthesis), switching could reduce inference spend by 35–40% with negligible quality impact.',
    targetAgent: 'Counsel', impactArea: 'LLM Cost · Model Routing',
    signalIds: ['sig-008'], estimatedEffort: '2–4 days',
    createdAt: daysAgo(2), updatedAt: daysAgo(0),
  },
  {
    id: 'prop-005', status: 'new', priority: 'P2',
    title: 'Integrate Open-Source GUI-Agent Layer into A11oy Workcell Execution',
    description: 'Add an open-source GUI agent adapter (see sig-007 citation) to A11oy\'s workcell execution layer, enabling autonomous interaction with enterprise UIs that lack structured APIs.',
    rationale: 'A recurring client blocker is legacy enterprise UIs without API access. The cited framework demonstrates 78% task completion on OSWorld — higher than competing alternatives (71%). A plug-in adapter would unlock a class of automation tasks currently handled by manual workarounds.',
    targetAgent: 'A11oy', impactArea: 'Workcell Execution · GUI Automation',
    signalIds: ['sig-007'], estimatedEffort: '1–2 weeks',
    createdAt: daysAgo(2), updatedAt: daysAgo(2),
  },
  {
    id: 'prop-006', status: 'deferred', priority: 'P2',
    title: 'Add International Maritime Compliance Module to Vessels',
    description: 'Pre-build an international maritime compliance assessment module for Vessels so it\'s production-ready when the 2026 regulatory framework is finalized.',
    rationale: 'Industry analysis projects maritime AI market at $15B by 2028. The international maritime regulatory framework (expected Q3 2026) will create mandatory compliance requirements for autonomous vessel operators. Building ahead of the regulation positions Vessels as the compliance-ready choice at launch.',
    targetAgent: 'Vessels', impactArea: 'Regulatory Compliance · Maritime',
    signalIds: ['sig-009'], estimatedEffort: '2–3 weeks',
    createdAt: daysAgo(3), updatedAt: daysAgo(1),
  },
  {
    id: 'prop-007', status: 'new', priority: 'P2',
    title: 'Enable Native Video-Stream Processing for Aegis Surveillance Analysis via Multimodal Foundation Model',
    description: 'Add a multimodal foundation-model adapter to Aegis\'s camera-feed analysis pipeline, enabling native video-frame processing without the current FFmpeg preprocessing step.',
    rationale: 'Current Aegis surveillance pipeline adds ~800ms latency for video preprocessing. The cited multimodal model (see signal citation) processes interleaved video frames natively within a 1M token context. Eliminating preprocessing would cut latency by ~75% and reduce per-frame processing cost.',
    targetAgent: 'Aegis', impactArea: 'Surveillance · Computer Vision',
    signalIds: ['sig-011'], estimatedEffort: '3–5 days',
    createdAt: daysAgo(4), updatedAt: daysAgo(4),
  },
  {
    id: 'prop-008', status: 'rejected', priority: 'P3',
    title: 'Migrate A11oy Runtime to Next-Gen GPU Cluster (Pre-GA)',
    description: 'Evaluate early migration of A11oy inference workloads to next-generation GPU hardware to gain 4× throughput advantage ahead of general availability.',
    rationale: 'Next-gen GPU sampling begins late 2025 for hyperscalers but is not in public GA. Migration risk at this stage exceeds benefit; defer to when hardware reaches cloud provider availability in H1 2026.',
    targetAgent: 'A11oy', impactArea: 'Infrastructure · GPU Migration',
    signalIds: ['sig-002'], estimatedEffort: 'High (infra migration)',
    createdAt: daysAgo(5), updatedAt: daysAgo(2),
  },
];

export const SCANNERS: Scanner[] = [
  { id: 'scanner-github', name: 'Open-Source Repository Feed', description: 'Scans trending open-source repositories (daily) and curated community lists for AI agents, embodied AI, and MLOps. Extracts star velocity, license, and key contributors.', enabled: true, lastRun: daysAgo(0), nextRun: daysFromNow(1), status: 'healthy', signalsToday: 4, totalSignals: 142 },
  { id: 'scanner-arxiv', name: 'Academic Preprint Feed (cs.AI, cs.LG, cs.CL, cs.RO)', description: 'Monitors daily preprint submissions across four CS categories. LLM-powered relevance scoring filters to top-10 papers per day by portfolio impact.', enabled: true, lastRun: daysAgo(0), nextRun: daysFromNow(1), status: 'healthy', signalsToday: 3, totalSignals: 287 },
  { id: 'scanner-conference', name: 'AI/ML Conference Paper RSS (Frontier Venues)', description: 'Tracks accepted paper announcements and paper-of-the-week highlights from leading AI/ML conferences. Extracts benchmark results and code release status. Source list in ResearchCitationPanel.', enabled: true, lastRun: daysAgo(1), nextRun: daysFromNow(1), status: 'healthy', signalsToday: 1, totalSignals: 64 },
  { id: 'scanner-vendor', name: 'Vendor Announcement Feeds', description: 'Monitors press releases and engineering blogs from hardware vendors, foundation model labs, and applied AI platforms. Rate-limited to 24h cadence. Full source list in ResearchCitationPanel.', enabled: true, lastRun: daysAgo(0), nextRun: daysFromNow(1), status: 'healthy', signalsToday: 3, totalSignals: 198 },
  { id: 'scanner-market', name: 'Market Intelligence (Licensed Analyst Feeds)', description: 'Scans public press releases and reports from licensed market research providers. Extracts market sizing, growth forecasts, and enterprise adoption metrics. Requires a commercial data license from each provider.', enabled: false, lastRun: null, nextRun: null, status: 'idle', signalsToday: 0, totalSignals: 55, requiresLicense: true },
  { id: 'scanner-mena', name: 'MENA / Regional AI Sources', description: 'Tracks regional AI policy announcements from Gulf state regulatory bodies, national AI authorities, and public sector healthcare AI initiatives. Full source list in ResearchCitationPanel.', enabled: true, lastRun: daysAgo(2), nextRun: daysFromNow(1), status: 'healthy', signalsToday: 2, totalSignals: 38 },
  { id: 'scanner-cve', name: 'NIST NVD AI/ML CVE Feed', description: 'Pulls fresh CVEs from the NIST National Vulnerability Database 2.0 API and surfaces those affecting AI/ML stacks (PyTorch, TensorFlow, HuggingFace, LangChain, vector DBs, model servers). Each signal carries CVSS base score + severity.', enabled: true, lastRun: daysAgo(0), nextRun: daysFromNow(1), status: 'healthy', signalsToday: 0, totalSignals: 0 },
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

• Sentra lacks spatial-reasoning evaluation pathways — cited benchmarks reveal 60%+ failure rates on analogous tasks
• Counsel has no Gulf-region healthcare legal templates; regional sovereign AI mandates (Q1 2026) create immediate compliance risk
• Aegis cost model overestimates MoE inference cost by 40–100% based on cited research findings
• A11oy's workcell layer cannot handle GUI-only enterprise environments (cited open-source framework demonstrates 78% capability)

12 signals ingested this week. 3 active scanners flagged high-confidence items (>0.9). 1 scanner degraded (market intelligence feed rate limit).`,
    blueprint: `Recommended capability upgrades (priority order):

P0 — Counsel: Add Gulf state healthcare care-pathway templates + regional AI explainability compliance checklists. This is time-sensitive given January 2026 regulatory deadlines.

P1 — Sentra: Integrate spatial-reasoning eval harness (see sig-001 citation). Use eval-forge spatial-reasoning adapter for automated regression tracking.

P1 — Aegis: Update compute cost model with memory-bandwidth-efficient MoE routing parameters. Correct 40%+ overestimation in client budget recommendations.

P1 — All Agents: Evaluate extended-thinking frontier model as cost-saving routing alternative. 40% cost reduction at comparable quality on SWE-bench tasks (see sig-008 citation).

P2 — A11oy: Integrate open-source GUI-agent adapter for legacy enterprise UI automation.`,
    roadmap: `Execution sequence:

Week 1: Ship Counsel Gulf compliance templates (P0). Begin extended-thinking model A/B eval framework setup.
Week 2: Complete extended-thinking model A/B runs across Sentra + Counsel + Aegis. Finalize Aegis cost-model patch.
Week 3: Merge spatial-reasoning eval harness into Sentra eval suite. Run first benchmark cycle.
Week 4: Release A11oy open-source GUI-agent adapter as experimental feature flag.

Dependencies: eval-forge spatial-reasoning adapter (stub available, dataset pending). Cited model API access (available now).

Success metrics: Counsel MENA template coverage ≥95%, Aegis cost-model error <10%, Sentra spatial-reasoning baseline established.`,
    signalCount: 12, proposalCount: 7, createdAt: daysAgo(0),
  },
  {
    id: 'memo-002', weekOf: weekDate(1), title: 'Week of April 14: Foundation Model Race & Maritime AI Acceleration',
    audit: `Key findings from last week's frontier scan:

• Next-gen multimodal foundation model capability (cited in sig-011) significantly ahead of portfolio's current vision pipeline
• Market analyst maritime AI report confirms Vessels is ahead of market curve; IMO framework will accelerate demand
• SWE-bench v2 long-horizon tasks reveal context-window ceiling for A11oy's code agents
• AgentBench v2 launched at frontier AI conference — need to run portfolio against updated benchmark immediately

8 signals ingested. All scanners healthy. 5 new proposals generated.`,
    blueprint: `Recommended capability upgrades:

P1 — Aegis + Vessels: Add multimodal foundation-model native video-stream adapter (cited in sig-011). Eliminates 800ms preprocessing latency for camera-feed analysis.

P1 — Vessels: Pre-build international maritime compliance assessment module for Q3 2026 readiness.

P2 — All Agents: Schedule AgentBench v2 evaluation runs via eval-forge. Establish per-agent baseline before external benchmarking.

P3 — A11oy: Evaluate next-gen GPU migration timeline (defer to H1 2026 GA).`,
    roadmap: `Week 1: Deploy multimodal foundation-model adapter behind feature flag in Aegis (experimental).
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
  { agentId: 'kora',    agentName: 'Lyte',    benchmark: 'swe-bench-lite', score: 0.61, sotaScore: 0.72, delta: 0.04, recordedAt: daysAgo(0) },
  // AgentBench
  { agentId: 'sentra',  agentName: 'Sentra',  benchmark: 'agentbench', score: 0.54, sotaScore: 0.62, delta: 0.02, recordedAt: daysAgo(0) },
  { agentId: 'counsel', agentName: 'Counsel', benchmark: 'agentbench', score: 0.59, sotaScore: 0.62, delta: 0.06, recordedAt: daysAgo(0) },
  { agentId: 'a11oy',   agentName: 'A11oy',  benchmark: 'agentbench', score: 0.62, sotaScore: 0.62, delta: 0.03, recordedAt: daysAgo(0) },
  // GAIA
  { agentId: 'counsel', agentName: 'Counsel', benchmark: 'gaia', score: 0.61, sotaScore: 0.67, delta: 0.04, recordedAt: daysAgo(0) },
  { agentId: 'kora',    agentName: 'Lyte',   benchmark: 'gaia', score: 0.57, sotaScore: 0.67, delta: 0.01, recordedAt: daysAgo(0) },
  { agentId: 'a11oy',   agentName: 'A11oy',  benchmark: 'gaia', score: 0.55, sotaScore: 0.67, delta: 0.02, recordedAt: daysAgo(0) },
];

export const BENCHMARK_TIME_SERIES: BenchmarkTimeSeries[] = [
  { agentId: 'sentra',  agentName: 'Sentra',  benchmark: 'swe-bench-lite', history: makeHistory(0.58, 8, 0.008, 0.72) },
  { agentId: 'counsel', agentName: 'Counsel', benchmark: 'swe-bench-lite', history: makeHistory(0.63, 8, 0.010, 0.72) },
  { agentId: 'kora',    agentName: 'Lyte',    benchmark: 'swe-bench-lite', history: makeHistory(0.61, 8, 0.009, 0.72) },
  { agentId: 'sentra',  agentName: 'Sentra',  benchmark: 'agentbench', history: makeHistory(0.54, 8, 0.007, 0.62) },
  { agentId: 'counsel', agentName: 'Counsel', benchmark: 'agentbench', history: makeHistory(0.59, 8, 0.011, 0.62) },
  { agentId: 'a11oy',   agentName: 'A11oy',  benchmark: 'agentbench', history: makeHistory(0.62, 8, 0.012, 0.62) },
  { agentId: 'counsel', agentName: 'Counsel', benchmark: 'gaia', history: makeHistory(0.61, 8, 0.009, 0.67) },
  { agentId: 'kora',    agentName: 'Lyte',   benchmark: 'gaia', history: makeHistory(0.57, 8, 0.006, 0.67) },
];
