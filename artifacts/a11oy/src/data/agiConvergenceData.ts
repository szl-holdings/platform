export interface AbsorbedCapability {
  source: string;
  repo: string;
  stars: string;
  capability: string;
  a11oyEquivalent: string;
  governed: boolean;
  status: 'absorbed' | 'surpassed' | 'unique';
}

export interface CompetitorProfile {
  name: string;
  tagline: string;
  repos: number;
  keyStrength: string;
  absorbed: string[];
  gap: string;
}

export const COMPETITORS: CompetitorProfile[] = [
  {
    name: 'OpenAI',
    tagline: 'Agentic execution at scale',
    repos: 243,
    keyStrength: 'Full-stack agentic OS: GPT-5.5 + Codex + Agents SDK + Swarm patterns',
    absorbed: [
      'Codex CLI — terminal-based coding agent → a11oy Terminal (governed, proof chain)',
      'Agents SDK — multi-agent orchestration → a11oy Agent Mesh (with governance gates)',
      'Swarm — lightweight multi-agent patterns → a11oy Workcells (replay, sovereign audit)',
      'Evals — model evaluation framework → a11oy Mirror Eval (continuous, governed)',
      'Codex Action — CI/CD GitHub Action → a11oy Action (proof chain on every commit)',
      'Deep Research — multi-source synthesis → a11oy Deep Research (governed pipeline)',
      'Whisper — speech recognition → a11oy Voice (governed transcription)',
      'DALL-E — image generation → a11oy Visual Gen (governed, branded output)',
      'Function Calling — tool use protocol → a11oy Connector Firewall (governed tools)',
      'Structured Outputs — JSON schema enforcement → a11oy Type-Safe Outputs',
    ],
    gap: 'No governance layer. No proof chain. No enterprise audit trail. No covenant enforcement.',
  },
  {
    name: 'Anthropic',
    tagline: 'Safe autonomous coding agents',
    repos: 47,
    keyStrength: 'Claude Code + sustained reasoning + tool control + enterprise reliability',
    absorbed: [
      'Claude Code — agentic coding CLI (118k stars) → a11oy Terminal (governed, Chronicle memory)',
      'Claude Agent SDK — Python agent framework → a11oy SDK (multi-language, governed)',
      'Claude Code Action — GitHub CI integration → a11oy Action (proof chain, covenant)',
      'Skills library — agent capability plugins → a11oy Skills Library (166+ governed plugins)',
      'Constitutional AI — alignment via principles → a11oy Covenant (org-level policy enforcement)',
      'RLHF — reinforcement from human feedback → a11oy Governance Gates (human-in-loop)',
      'Tool Control — granular tool permissions → a11oy Connector Firewall (policy-enforced)',
      'Long-context reasoning — sustained cognition → a11oy Chronicle Memory (5-tier fabric)',
    ],
    gap: 'Single model locked. No multi-model routing. No operational ontology. No cross-domain intelligence.',
  },
  {
    name: 'Google DeepMind',
    tagline: 'Research depth meets multimodal intelligence',
    repos: 387,
    keyStrength: 'Gemini 3.1 Pro + robotics SDK + Deep Research + scientific reasoning',
    absorbed: [
      'Gemini CLI — terminal AI agent (102k stars) → a11oy Terminal (governed, multi-model)',
      'Gemini Robotics SDK — agent framework for hardware → a11oy Agent Mesh (software-defined)',
      'Deep Research Agent — autonomous research → a11oy Deep Research (governed, proof chain)',
      'DeepSearchQA — research benchmarks → a11oy Mirror Eval (continuous benchmarking)',
      'AlphaFold — scientific reasoning patterns → a11oy Cognitive Forecasting (domain-agnostic)',
      'Multimodal context — text/audio/image/video/code → a11oy Model Router (multi-modal, governed)',
      'Responsible AI framework — safety research → a11oy Cyber Safety (enforced, not aspirational)',
    ],
    gap: 'Research-focused, not operational. No enterprise workflow integration. No proof chain. No real-time governance.',
  },
  {
    name: 'Microsoft',
    tagline: 'Enterprise distribution at global scale',
    repos: 500,
    keyStrength: 'Agent Framework (MAF) + Copilot + Azure + GitHub + M365 ecosystem',
    absorbed: [
      'Agent Framework (MAF) — multi-agent orchestration → a11oy Agent Mesh (governed, sovereign)',
      'AutoGen — multi-agent conversations → a11oy Workcells (stateful, replayable, governed)',
      'Semantic Kernel — AI orchestration SDK → a11oy SDK (multi-model, proof chain)',
      'Copilot — enterprise AI assistant → a11oy Command Surface (governed, multi-vertical)',
      'Azure AI Studio — model deployment → a11oy Model Router (multi-cloud, policy-enforced)',
      'GitHub Copilot — code completion → a11oy Terminal (full agentic, not just completion)',
      'A2A + MCP protocols — agent interop → a11oy Connector Firewall (governed interop)',
    ],
    gap: 'Distribution without depth. No cognitive forecasting. No Chronicle memory. No sovereign replay. Surface-level agent wrappers.',
  },
  {
    name: 'Meta',
    tagline: 'Open-source model strategy',
    repos: 12,
    keyStrength: 'Llama Stack + HyperAgents + open weights + local/private deployment',
    absorbed: [
      'Llama Stack — agentic application platform → a11oy supports Llama via Model Router',
      'Llama Agentic System — E2E agent framework → a11oy Agent Mesh (governed superset)',
      'Llama Cookbook — community integrations → a11oy Cookbook (102 governed recipes)',
      'HyperAgents — self-improving agents → a11oy Cognitive Forecasting (governed self-improvement)',
      'Open weights — private deployment → a11oy Sovereign mode (on-premise, air-gapped)',
      'Llama Guard — safety classifier → a11oy Cyber Safety (multi-layer, covenant-enforced)',
    ],
    gap: 'Models without platform. No enterprise workflow. No operational ontology. No proof chain. No governance layer.',
  },
  {
    name: 'Palantir',
    tagline: 'Operational ontology for enterprises',
    repos: 89,
    keyStrength: 'AIP + Foundry + Ontology SDK + Agent Studio + enterprise decision-making',
    absorbed: [
      'Foundry Ontology — enterprise data graph → a11oy Outcome Graph (AI-native, not legacy ETL)',
      'AIP Logic — no-code LLM functions → a11oy Workcells (code-first, governed, replayable)',
      'Agent Studio — enterprise AI agents → a11oy Agent Mesh (multi-model, proof chain)',
      'OSDK — ontology query SDK → a11oy SDK (TypeScript/Python, real-time, governed)',
      'Pipeline Builder — LLM data pipelines → a11oy Fabric (governed data flow)',
      'AIP Assist — context-aware AI sidebar → a11oy Command Surface (full-stack, not sidebar)',
      'MCP integration — external agent connectivity → a11oy Connector Firewall (governed MCP)',
    ],
    gap: 'Closed ecosystem. Government-first, enterprise-second. No open model support. Legacy architecture wrapped in AI. No Chronicle memory.',
  },
];

export const ABSORBED_REPOS: AbsorbedCapability[] = [
  { source: 'OpenAI', repo: 'openai/codex', stars: '28k', capability: 'Terminal coding agent with cloud sandbox', a11oyEquivalent: 'a11oy Terminal — governed, proof chain, 5-tier memory', governed: true, status: 'surpassed' },
  { source: 'OpenAI', repo: 'openai/openai-agents-python', stars: '18k', capability: 'Multi-agent orchestration SDK', a11oyEquivalent: 'a11oy Agent Mesh — governed, sovereign replay, covenant', governed: true, status: 'surpassed' },
  { source: 'OpenAI', repo: 'openai/swarm', stars: '21k', capability: 'Lightweight multi-agent patterns', a11oyEquivalent: 'a11oy Workcells — stateful, replayable, approval gates', governed: true, status: 'surpassed' },
  { source: 'OpenAI', repo: 'openai/evals', stars: '16k', capability: 'Model evaluation framework', a11oyEquivalent: 'a11oy Mirror Eval — continuous, governed, benchmarked', governed: true, status: 'surpassed' },
  { source: 'OpenAI', repo: 'openai/codex-action', stars: '2k', capability: 'GitHub CI/CD action', a11oyEquivalent: 'a11oy Action — proof chain on every commit', governed: true, status: 'surpassed' },
  { source: 'OpenAI', repo: 'openai/whisper', stars: '72k', capability: 'Speech recognition', a11oyEquivalent: 'a11oy Voice — governed transcription, PII filtering', governed: true, status: 'absorbed' },
  { source: 'Anthropic', repo: 'anthropics/claude-code', stars: '118k', capability: 'Agentic coding CLI', a11oyEquivalent: 'a11oy Terminal — multi-model, Chronicle memory, governed', governed: true, status: 'surpassed' },
  { source: 'Anthropic', repo: 'anthropics/claude-code-action', stars: '8k', capability: 'GitHub Actions for Claude', a11oyEquivalent: 'a11oy Action — covenant enforcement, proof chain', governed: true, status: 'surpassed' },
  { source: 'Anthropic', repo: 'anthropics/skills', stars: '3k', capability: 'Agent skills library', a11oyEquivalent: 'a11oy Skills Library — 166+ governed plugins', governed: true, status: 'surpassed' },
  { source: 'Google', repo: 'google-gemini/gemini-cli', stars: '102k', capability: 'Terminal AI agent', a11oyEquivalent: 'a11oy Terminal — governed, multi-model, proof chain', governed: true, status: 'surpassed' },
  { source: 'Google', repo: 'google-deepmind/gemini-robotics-sdk', stars: '5k', capability: 'Robotics agent framework', a11oyEquivalent: 'a11oy Agent Mesh — software-defined agents', governed: true, status: 'absorbed' },
  { source: 'Microsoft', repo: 'microsoft/agent-framework', stars: '12k', capability: 'Multi-agent orchestration (MAF)', a11oyEquivalent: 'a11oy Agent Mesh — governed, sovereign, covenant', governed: true, status: 'surpassed' },
  { source: 'Microsoft', repo: 'microsoft/autogen', stars: '38k', capability: 'Multi-agent conversations', a11oyEquivalent: 'a11oy Workcells — stateful, proof chain, replay', governed: true, status: 'surpassed' },
  { source: 'Meta', repo: 'meta-llama/llama-stack', stars: '14k', capability: 'Agentic application platform', a11oyEquivalent: 'a11oy supports Llama via Model Router — governed', governed: true, status: 'absorbed' },
  { source: 'Meta', repo: 'meta-llama/llama-agentic-system', stars: '8k', capability: 'E2E agent framework', a11oyEquivalent: 'a11oy Agent Mesh — governed superset', governed: true, status: 'surpassed' },
  { source: 'Meta', repo: 'meta-llama/llama', stars: '73k', capability: 'Open model weights', a11oyEquivalent: 'a11oy Model Router — routes to Llama + 5 other providers', governed: true, status: 'absorbed' },
];

export const A11OY_UNIQUE = [
  { name: 'Proof Chain Architecture', desc: 'Cryptographic proof on every agent action. No other platform has tamper-proof, verifiable audit trails at the execution layer. Not bolted on — built in.', status: 'unique' },
  { name: 'Chronicle Memory (5-Tier)', desc: 'Chronicle, Working, Episodic, Semantic, Procedural — five memory tiers that give agents persistent, replayable, queryable context across sessions. No one else has this.', status: 'unique' },
  { name: 'Cognitive Forecasting', desc: 'Predict outcomes before execution. Regression risk, delivery timelines, cost impact, security exposure — with confidence intervals. Not just execution — foresight.', status: 'unique' },
  { name: 'Covenant Enforcement', desc: 'Organization-level governance policies that override everything. What the agent can see, modify, approve, and deploy — defined once, enforced everywhere, cryptographically proven.', status: 'unique' },
  { name: 'Governed Autonomy Framework', desc: 'The only platform that treats governance not as a constraint but as the product. Every competitor adds safety after the fact. a11oy builds from governance up.', status: 'unique' },
  { name: 'Sovereign Replay', desc: 'Replay any agent session with full proof — every keystroke, model call, reasoning chain, and decision. Tamper-resistant. Cryptographically verifiable. No competitor offers this.', status: 'unique' },
  { name: 'Multi-Model Governed Routing', desc: 'GPT-5.5, Claude 4, DeepSeek V4, Qwen 3.6, Llama 405B, HuggingFace Hub — best model per task, all governed by the same covenant. No provider lock-in. No competitor routes this broadly.', status: 'unique' },
  { name: 'Outcome Graph', desc: 'Live causal graph connecting every agent action to business outcomes. Not dashboards — live decision intelligence that shows what happened, why, and what to do next.', status: 'unique' },
];

export const CONVERGENCE_STATS = {
  reposAbsorbed: 16,
  totalStars: '513k+',
  competitors: 6,
  uniqueCapabilities: 8,
  governedFeatures: 'all',
  modelProviders: 6,
};
