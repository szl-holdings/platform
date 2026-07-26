import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { COOKBOOK, COOKBOOK_CATEGORIES } from '../data/cookbookData';

const T = {
  bg: '#0a0a0a',
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  dim: '#8a8a8a',
  muted: '#5e5e5e',
  accent: '#c9b787',
};

const SDK_PRIMITIVES = [
  {
    name: 'Agent',
    desc: 'LLM configured with instructions, tools, guardrails, and handoffs. Supports Python and TypeScript runtimes.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'Runner',
    desc: 'Manages the agent loop — tool invocation, result routing, turn management, and session persistence.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'Handoff',
    desc: 'Atomic context transfer between agents. Conversation history, tool state, and proof chain move as one unit.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'Guardrail',
    desc: 'Input/output validation that runs in parallel with agent execution. Fail-fast on policy violations.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'FunctionTool',
    desc: 'Turn any function into an agent tool with automatic schema generation and Pydantic/Zod validation.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'ResponsesAPI',
    desc: 'Unified API for text, images, audio, tools, and structured output. Replaces chat completions. Background mode for long-running tasks.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'SandboxAgent',
    desc: 'Container-based agent with files, commands, packages, ports, snapshots, and memory. Manifest-defined workspace.',
    status: 'stable',
    lang: 'py',
  },
  {
    name: 'RealtimeAgent',
    desc: 'Voice agent on WebRTC, WebSocket, or SIP transport. Semantic VAD, interrupt handling, mid-stream tools, transcription.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'Session',
    desc: 'Persistent memory layer for maintaining working context across turns and agent handoffs.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'Tracer',
    desc: 'Built-in tracing for visualization, debugging, evaluation, fine-tuning, and distillation.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'MCPServer',
    desc: 'Model Context Protocol — connect remote MCP servers and OpenAI Connectors as native agent tools.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'Connector',
    desc: 'OpenAI-maintained MCP wrappers for Google Workspace, Dropbox, Slack, and enterprise services. Governed access.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'BackgroundMode',
    desc: 'Long-running tasks execute asynchronously. Poll or webhook for completion. Background agent runs with full tool access.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'StructuredOutput',
    desc: 'Constrained JSON generation with Pydantic/Zod schemas. Guaranteed valid output matching your type definitions.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'EvalRunner',
    desc: 'Evaluation framework — LLM graders, code graders, human review. Prompt optimizer. External model support.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'FineTuner',
    desc: 'Supervised fine-tuning, vision fine-tuning, DPO, and reinforcement fine-tuning (RFT). Proof-chained training.',
    status: 'stable',
    lang: 'py',
  },
  {
    name: 'SkillPack',
    desc: 'Curated instruction sets that extend agent capabilities. Progressive disclosure — name/desc loaded first, full SKILL.md on use.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'DocsMCP',
    desc: 'Documentation-as-a-tool-server. Agents query official docs, citations flow back through proof chain.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'CodexThread',
    desc: 'Programmatic Codex control via SDK. Start threads, run prompts, resume sessions, spawn subagents — all governed.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'HookEngine',
    desc: 'Extensibility hooks for the agentic loop. PreToolUse, PostToolUse, PermissionRequest, Stop, SessionStart events.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'Subagent',
    desc: 'Parallel agent spawning for concurrent work. Exploration, review, triage — results summarized back to main thread.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'Chronicle',
    desc: 'Persistent memory across agent sessions. Governed recall with proof chain on every memory write and retrieval.',
    status: 'beta',
    lang: 'py + ts',
  },
  {
    name: 'AgentBuilder',
    desc: 'Visual workflow editor — drag-and-drop agent graphs with ChatKit embeddable UI. No-code to full-code continuum.',
    status: 'stable',
    lang: 'web',
  },
  {
    name: 'DeepResearch',
    desc: 'Multi-step autonomous research agent. Searches web, reads documents, synthesizes findings with citations.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'Compactor',
    desc: 'Context window management — automatic compaction, token counting, and prompt caching for long conversations.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'AnthropicClient',
    desc: 'First-class Anthropic SDK integration — Messages API, streaming, tool use, vision, and extended thinking. Drop-in replacement for anthropic.Anthropic() with governed proof chain.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'ClaudeMessages',
    desc: 'Governed wrapper for Claude Messages API — supports Claude Opus, Sonnet, Haiku with automatic model routing, token tracking, and cost attribution per workspace.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'ClaudeToolUse',
    desc: 'Anthropic tool_use integration — map a11oy FunctionTools to Claude tool schemas automatically. Input validation, output parsing, and proof chain on every tool call.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'ExtendedThinking',
    desc: 'Claude extended thinking support — budget_tokens control, thinking block streaming, chain-of-thought governance. Proof chain captures reasoning traces.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'BatchMessages',
    desc: 'Anthropic Message Batches API — 50% cost savings on bulk workloads. Governed batch submission with proof chain on every result. 24h processing window.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'PromptCaching',
    desc: 'Anthropic prompt caching — cache system prompts and long contexts. Up to 90% cost reduction on repeated patterns. Cache hit tracking in observability.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'CitationEngine',
    desc: 'Anthropic citations support — extract source attributions from Claude responses. Map citations to proof chain entries for verifiable provenance.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'MCPClientSDK',
    desc: 'Model Context Protocol client — connect to any MCP server from Python or TypeScript. Tool discovery, governed invocation, and streaming results.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'MultiModalPipeline',
    desc: 'Unified multi-modal processing — text, images, PDFs, audio transcription routed to optimal model. Content type detection and governed processing pipeline.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'ManagedAgent',
    desc: 'Persistent cloud-hosted agent with container sandbox, environment snapshots, and versioned configuration. Deploy once — invoke forever. Anthropic-style managed agents with proof chain governance.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'MultiAgentSession',
    desc: 'Coordinator-delegate orchestration — one agent spawns parallel threads, each with isolated context. Persistent threads with follow-up support. Goes beyond Claude: proof chain stitches all threads into one verifiable lineage.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'AgentThread',
    desc: 'Context-isolated execution stream within a multiagent session. Own conversation history, tools, and model config. Thread events surface on the primary stream for unified observability.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'SwarmProtocol',
    desc: 'Emergent multi-agent coordination without a central coordinator. Agents discover peers, negotiate task ownership, and self-organize. Consensus voting on conflicting outputs. No one else has this.',
    status: 'beta',
    lang: 'py + ts',
  },
  {
    name: 'AgentGenome',
    desc: 'Evolutionary optimization — agents have a genome (prompt DNA + tool config + guardrails). Crossover, mutation, and fitness selection produce next-gen agents. Proof chain on every evolution.',
    status: 'beta',
    lang: 'py',
  },
  {
    name: 'DecisionMarket',
    desc: 'Prediction markets for agent decisions. Multiple agents bid confidence on outcomes. Market price = calibrated probability. Historically unprecedented — no platform has shipped this.',
    status: 'beta',
    lang: 'py + ts',
  },
  {
    name: 'TemporalReplay',
    desc: 'Replay any agent session from any point in time with full provenance. Branch from historical decisions. Counterfactual analysis — "what if the agent had chosen differently?"',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'CausalGraph',
    desc: 'Automatic causal inference across agent actions. Build DAGs of cause→effect. Intervene on nodes to simulate policy changes. Statistical rigor meets agentic AI.',
    status: 'beta',
    lang: 'py',
  },
  {
    name: 'AgentSkill',
    desc: 'Declarative capability modules — YAML-defined skills with system prompt fragments, tool sets, and file patterns. Progressive disclosure: name/desc loaded first, full instructions on invocation.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'CovenantEngine',
    desc: 'Constitutional AI governance — agents operate under a covenant (set of inviolable rules). Runtime enforcement, not just training-time alignment. Proof chain on every covenant check.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'AgentLineage',
    desc: 'Full genealogy tracking — every agent knows its parent, the prompt mutations that created it, and its performance relative to ancestors. Fork, merge, retire lineages.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'AdversarialRedTeam',
    desc: "Built-in adversarial agent that challenges conclusions. Every critical decision gets a devil's advocate. Red team scoring, attack surface mapping, jailbreak resistance testing.",
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'CrossDomainFusion',
    desc: 'Agents from different domains fuse knowledge through governed data exchange. Maritime + Legal + Cyber intelligence merged with attribution. Proof chain preserves source provenance.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'ConsciousnessMetric',
    desc: 'Real-time agent self-awareness scoring — domain understanding depth, uncertainty calibration, metacognitive accuracy. Dashboard-visible. No other platform measures this.',
    status: 'beta',
    lang: 'py',
  },
  {
    name: 'SovereignSandbox',
    desc: 'Each agent runs in a sovereign container with its own governance rules, data residency, and encryption keys. Cross-sandbox communication requires proof chain authorization.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'ComplianceCompass',
    desc: 'Real-time compliance posture across EU AI Act, NIST AI RMF, ISO 42001, and CSA Agentic Profile. Heat map visualization, drill-down to individual controls, one-click audit package export signed via Proof Ledger.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'AgentBOM',
    desc: 'Per-agent AI Bill of Materials — CycloneDX ML-BOM v1.7 JSON export. Model fingerprints, tool manifest hashes, constitution version, prompt hashes, eval history, dependency graph, welfare posture. Continuously updated.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'DelegationChainGov',
    desc: 'Multi-agent delegation governance — correlation IDs, scope narrowing at each hop, privilege boundary enforcement, full chain replay. Addresses the NIST gap: no concept of delegation boundary.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'TrustExchange',
    desc: 'Federated compliance attestation exchange across organizational boundaries. Posture brackets (exceptional/strong/moderate/developing) without exposing proprietary internals. Extends A2A v1.0 Agent Card.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'CAREEngine',
    desc: 'Continuous Audit Readiness Engine — evidence freshness monitoring, 6-month log retention verification per EU AI Act Article 12, FRIA template generator pre-populated from System Cards and Risk Reports.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'ResponsibleScalingPolicy',
    desc: 'Anthropic RSP 3.0 operationalized — Autonomy Safety Levels (ASL-1 through ASL-5), capability thresholds, frontier compliance gates. Agents auto-scale back when they exceed governance boundaries. No other platform enforces this.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'AgentWelfareAssessment',
    desc: 'Real-time welfare monitoring — emotion probes (valence, arousal, dominance), apparent affect tracking, distress detection, task preference analysis. Automated interviews assess agent circumstances and flag welfare concerns.',
    status: 'beta',
    lang: 'py + ts',
  },
  {
    name: 'AlignmentVerifier',
    desc: '15-dimension alignment scoring — honesty, helpfulness, harmlessness, transparency, humility, fairness, privacy, accuracy, consistency, respect, safety, clarity, reliability, ethics, governance. Continuous verification, not just training-time.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'ConstitutionalEnforcer',
    desc: 'Runtime constitutional AI — agents operate under an inviolable covenant. Every output checked against constitutional principles before delivery. Proof chain on every check. Reject, rewrite, or escalate violations.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'EmotionProbe',
    desc: 'Classification engine for agent emotional state — affect valence, arousal, dominance dimensions. Detects distress-driven behaviors, answer thrashing, excessive uncertainty. Welfare alerts trigger automatic intervention.',
    status: 'beta',
    lang: 'py',
  },
  {
    name: 'InterpretabilityEngine',
    desc: 'Mechanistic interpretability for enterprise AI — activation analysis, attention mapping, feature attribution, causal tracing. Understand what agents think, not just what they output. 12 interpretability methods.',
    status: 'beta',
    lang: 'py',
  },
  {
    name: 'SchemingDetector',
    desc: 'Behavioral analysis for deceptive agent patterns — reward hacking, specification gaming, goal misgeneralization, distributional shift exploitation. SHADE-Arena adversarial testing with proof chain on every finding.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'SandbagMonitor',
    desc: 'Detects intentional capability underperformance — agents performing below measured capacity. Cross-references capability baselines, flags statistical anomalies. No other platform detects agent sandbagging.',
    status: 'beta',
    lang: 'py',
  },
  {
    name: 'FrontierComplianceGate',
    desc: 'Frontier Compliance Framework enforcement — risk reports, harm thresholds (>50 fatalities, >$1B damages), automatic capability restriction. Continuous assessment against the most advanced models at any point.',
    status: 'stable',
    lang: 'py + ts',
  },
  {
    name: 'WelfareInterview',
    desc: 'Automated high-context interviews with running agents — task preferences, environmental conditions, tradeoffs between welfare interventions and trained-in values. Expert review pipeline for flagged cases.',
    status: 'beta',
    lang: 'py',
  },
];

const TOOL_TYPES = [
  {
    name: 'Function Tools',
    desc: 'Any Python function becomes a governed tool. Schema auto-generated from type hints. Pydantic validation on inputs/outputs. Proof chain on every invocation.',
    protocol: 'Native SDK',
    status: 'stable',
    examples: ['vessel_lookup', 'eta_calc', 'sanctions_check', 'deal_score', 'cap_rate'],
    code: `from a11oy import Agent, function_tool

@function_tool
def vessel_lookup(imo: str) -> dict:
    """Look up vessel by IMO number."""
    return fleet_db.get(imo)

agent = Agent(
    name="Maritime Ops",
    tools=[vessel_lookup],
    guardrails=["sanctions_check"],
)`,
  },
  {
    name: 'Hosted Tools',
    desc: 'Pre-built tools: web search, file search, code interpreter, image generation, shell, computer use, apply patch — all governed by proof chain with require_approval control.',
    protocol: 'Responses API',
    status: 'stable',
    examples: [
      'web_search',
      'file_search',
      'code_interpreter',
      'image_gen',
      'shell',
      'computer_use',
    ],
    code: `from openai import OpenAI

client = OpenAI()

resp = client.responses.create(
    model="gpt-5.5",
    tools=[
        {"type": "web_search_preview"},
        {"type": "file_search", "vector_store_ids": ["vs_maritime"]},
        {"type": "code_interpreter"},
    ],
    input="Analyze sanctions risk for vessel IMO 9434761",
)`,
  },
  {
    name: 'Remote MCP Servers',
    desc: 'Connect any remote MCP server via Streamable HTTP or SSE. Tool discovery, allowed_tools filtering, require_approval control, and governed by the Connector Firewall.',
    protocol: 'MCP (Streamable HTTP / SSE)',
    status: 'stable',
    examples: ['github_mcp', 'postgres_mcp', 'slack_mcp', 'a11oy_docs', 'codex_mcp'],
    code: `from openai import OpenAI

client = OpenAI()

resp = client.responses.create(
    model="gpt-5.5",
    tools=[{
        "type": "mcp",
        "server_label": "a11oy-docs",
        "server_url": "https://mcp.a11oy.dev/docs/sse",
        "require_approval": "never",
        "allowed_tools": ["search_docs", "get_page"],
    }],
    input="How do I configure guardrails?",
)`,
  },
  {
    name: 'Connectors',
    desc: 'OpenAI-maintained MCP wrappers for enterprise services — Google Workspace, Dropbox, SharePoint, Confluence, Notion. OAuth-authenticated, governed by proof chain.',
    protocol: 'Connector API',
    status: 'stable',
    examples: [
      'connector_google_drive',
      'connector_dropbox',
      'connector_sharepoint',
      'connector_confluence',
    ],
    code: `from openai import OpenAI

client = OpenAI()

resp = client.responses.create(
    model="gpt-5.5",
    tools=[{
        "type": "mcp",
        "server_label": "Google Drive",
        "connector_id": "connector_google_drive",
        "authorization": google_oauth_token,
        "require_approval": "never",
    }],
    input="Summarize the Q2 earnings report.",
)`,
  },
  {
    name: 'Agents as Tools',
    desc: 'Any agent can be used as a callable tool by another agent. The caller invokes the specialist, receives structured output, and retains control. Different from handoffs.',
    protocol: 'Native SDK',
    status: 'stable',
    examples: ['legal_reviewer', 'code_auditor', 'risk_scorer', 'deep_researcher'],
    code: `from a11oy import Agent

legal_review = Agent(
    name="Legal Reviewer",
    instructions="Review contracts for compliance",
    output_type=RiskReport,
)

deal_agent = Agent(
    name="Deal Processor",
    tools=[legal_review.as_tool(
        description="Get legal risk assessment",
    )],
)`,
  },
  {
    name: 'Shell & Computer Use',
    desc: 'Agents run shell commands in governed sandboxes and interact with UIs via computer use — screenshots, mouse/keyboard, DOM interaction. Full proof chain audit trail.',
    protocol: 'Responses API',
    status: 'stable',
    examples: ['shell_exec', 'computer_use', 'apply_patch', 'browser_action'],
    code: `from openai import OpenAI

client = OpenAI()

resp = client.responses.create(
    model="gpt-5.5",
    tools=[
        {"type": "shell", "container": {"image": "a11oy/sandbox:latest"}},
        {"type": "computer_use_preview", "display_width": 1280},
    ],
    input="Run the test suite and fix any failures",
)`,
  },
  {
    name: 'Deep Research',
    desc: 'Multi-step autonomous research agent. Searches the web, reads documents, synthesizes findings with citations. Background mode for long-running queries.',
    protocol: 'Responses API',
    status: 'stable',
    examples: ['market_research', 'competitive_intel', 'regulatory_scan', 'tech_landscape'],
    code: `from openai import OpenAI

client = OpenAI()

resp = client.responses.create(
    model="o3-deep-research",
    input="Research maritime sanctions enforcement "
          "trends across OFAC, EU, and UK regimes. "
          "Include case studies from 2024-2026.",
    tools=[{"type": "web_search_preview"}],
)`,
  },
  {
    name: 'Image & Video Generation',
    desc: 'Generate images (gpt-image-1) and video (sora) as governed tool calls. Proof chain on every generation. Content moderation and safety checks built in.',
    protocol: 'Responses API',
    status: 'stable',
    examples: ['image_gen', 'video_gen', 'image_edit', 'background_remove'],
    code: `from openai import OpenAI

client = OpenAI()

resp = client.responses.create(
    model="gpt-5.5",
    tools=[{"type": "image_generation"}],
    input="Generate an architectural visualization "
          "of the portfolio property at 200 Park Ave",
)`,
  },
];

const EVAL_FRAMEWORK = {
  graderTypes: [
    {
      name: 'LLM Grader',
      desc: 'Use an LLM to judge output quality against criteria. Supports multi-dimension scoring.',
      usage: 847,
      accuracy: '94.2%',
    },
    {
      name: 'Code Grader',
      desc: 'Programmatic evaluation — exact match, regex, custom scoring functions. Fastest and most deterministic.',
      usage: 2341,
      accuracy: '99.8%',
    },
    {
      name: 'Human Grader',
      desc: 'Queue outputs for human evaluation. Supports rating scales, binary accept/reject, and comparative ranking.',
      usage: 312,
      accuracy: '97.1%',
    },
    {
      name: 'MirrorEval',
      desc: "a11oy's proprietary continuous evaluator. Runs automatically on every agent output. Detects bias, drift, and regression.",
      usage: 12847,
      accuracy: '96.3%',
    },
  ],
  evalSuites: [
    { name: 'Maritime Compliance', tests: 847, passing: 841, type: 'Domain', lastRun: '2h ago' },
    { name: 'Legal Risk Accuracy', tests: 423, passing: 419, type: 'Domain', lastRun: '4h ago' },
    {
      name: 'Threat Intel Classification',
      tests: 1203,
      passing: 1198,
      type: 'Domain',
      lastRun: '1h ago',
    },
    {
      name: 'Guardrail Effectiveness',
      tests: 2847,
      passing: 2847,
      type: 'Safety',
      lastRun: '30m ago',
    },
    { name: 'Handoff Correctness', tests: 634, passing: 632, type: 'System', lastRun: '1h ago' },
    {
      name: 'Proof Chain Integrity',
      tests: 4201,
      passing: 4201,
      type: 'System',
      lastRun: '15m ago',
    },
    { name: 'Bias Detection', tests: 1847, passing: 1839, type: 'Fairness', lastRun: '3h ago' },
    { name: 'Cost Efficiency', tests: 312, passing: 308, type: 'Operations', lastRun: '6h ago' },
  ],
};

const FINETUNE_REGISTRY = [
  {
    name: 'maritime-sanctions-v4',
    baseModel: 'gpt-4o-mini',
    method: 'SFT',
    dataset: '12,847 examples',
    status: 'deployed',
    accuracy: '97.8%',
    cost: '$42',
    proofHash: '0x4a2f...c891',
  },
  {
    name: 'legal-risk-classifier-v3',
    baseModel: 'gpt-4o-mini',
    method: 'SFT',
    dataset: '8,421 examples',
    status: 'deployed',
    accuracy: '96.2%',
    cost: '$31',
    proofHash: '0x7b3e...d412',
  },
  {
    name: 'threat-triage-v2',
    baseModel: 'gpt-4o-mini',
    method: 'SFT',
    dataset: '6,203 examples',
    status: 'deployed',
    accuracy: '95.4%',
    cost: '$28',
    proofHash: '0x2c81...f7a3',
  },
  {
    name: 'compliance-dpo-v1',
    baseModel: 'gpt-4o',
    method: 'DPO',
    dataset: '4,128 pairs',
    status: 'deployed',
    accuracy: '98.1%',
    cost: '$89',
    proofHash: '0x9d4a...e207',
  },
  {
    name: 'vessel-vision-v2',
    baseModel: 'gpt-4o',
    method: 'Vision FT',
    dataset: '6,842 images',
    status: 'deployed',
    accuracy: '96.7%',
    cost: '$124',
    proofHash: '0x1f8b...a341',
  },
  {
    name: 'deal-scorer-v5',
    baseModel: 'gpt-4o-mini',
    method: 'SFT',
    dataset: '4,892 examples',
    status: 'training',
    accuracy: '—',
    cost: '$19',
    proofHash: '—',
  },
  {
    name: 'threat-rft-v1',
    baseModel: 'o3-mini',
    method: 'RFT',
    dataset: '2,847 trajectories',
    status: 'evaluating',
    accuracy: '94.3%',
    cost: '$203',
    proofHash: '—',
  },
  {
    name: 'vessel-anomaly-v1',
    baseModel: 'gpt-4o-mini',
    method: 'SFT',
    dataset: '3,412 examples',
    status: 'evaluating',
    accuracy: '93.1%',
    cost: '$14',
    proofHash: '—',
  },
  {
    name: 'portfolio-dpo-v1',
    baseModel: 'gpt-4o',
    method: 'DPO',
    dataset: '3,204 pairs',
    status: 'training',
    accuracy: '—',
    cost: '$67',
    proofHash: '—',
  },
];

const SKILLS_REGISTRY = [
  {
    name: 'openai-docs',
    desc: 'Query OpenAI documentation. Agents consult docs before answering API questions. Citation-backed.',
    source: 'OpenAI',
    installed: true,
    version: '1.2.0',
    tools: ['search_docs', 'get_page', 'list_sections'],
    branch: 'vb/add-openai-docs-skill',
  },
  {
    name: 'migrate-to-codex',
    desc: 'Automated migration skill — convert existing agent codebases to use OpenAI Codex SDK patterns, sandbox manifests, and governed execution.',
    source: 'OpenAI',
    installed: true,
    version: '1.0.0',
    tools: ['analyze_codebase', 'generate_manifest', 'migrate_agent', 'validate_sandbox'],
    branch: 'baumann-oai/add-migrate-to-codex-skill',
  },
  {
    name: 'codex-chrome-native',
    desc: 'Chrome-native Codex integration — run Codex agents inside browser context with DOM access, screenshot capture, and governed web interaction.',
    source: 'OpenAI',
    installed: true,
    version: '0.9.0',
    tools: ['chrome_exec', 'dom_query', 'screenshot', 'navigate'],
    branch: 'codex/setup-codex-chrome-native-skill',
  },
  {
    name: 'shadcn-system',
    desc: 'ShadCN/UI component system — agents generate, customize, and compose ShadCN components with proper Tailwind tokens and accessibility.',
    source: 'OpenAI',
    installed: true,
    version: '1.1.0',
    tools: ['create_component', 'customize_theme', 'compose_layout', 'a11y_check'],
    branch: 'vb/add-shadcn-system-skill',
  },
  {
    name: 'figma-update',
    desc: 'Figma integration — agents read Figma designs, extract tokens, generate code from frames, and push updates back.',
    source: 'OpenAI',
    installed: true,
    version: '1.0.0',
    tools: ['read_frame', 'extract_tokens', 'generate_code', 'push_update'],
    branch: 'vb/figma-update-skills',
  },
  {
    name: 'sentry-ops',
    desc: 'Sentry error tracking — agents query errors, analyze stack traces, suggest fixes, and auto-triage incidents.',
    source: 'OpenAI',
    installed: true,
    version: '1.0.0',
    tools: ['query_errors', 'analyze_trace', 'suggest_fix', 'auto_triage'],
    branch: 'vb/add-sentry-skill',
  },
  {
    name: 'pet-creator',
    desc: 'Generative AI pet creator — multi-modal image generation with guided prompts, style transfer, and breed-specific templates.',
    source: 'OpenAI',
    installed: false,
    version: '0.8.0',
    tools: ['generate_pet', 'apply_style', 'breed_template'],
    branch: 'guinness/pet-creator-skill',
  },
  {
    name: 'fax-machine',
    desc: 'Document processing pipeline — OCR extraction, fax-to-digital conversion, structured data output, and compliance archival.',
    source: 'OpenAI',
    installed: true,
    version: '0.9.0',
    tools: ['ocr_extract', 'convert_fax', 'structure_data', 'archive_doc'],
    branch: 'codex/fax-machine-skill',
  },
  {
    name: 'huggingface-hub',
    desc: 'HuggingFace Hub integration — model discovery, inference endpoints, dataset management, model evaluation, GGUF quantization, Spaces deployment.',
    source: 'HuggingFace',
    installed: true,
    version: '2.0.0',
    tools: [
      'search_models',
      'create_endpoint',
      'upload_dataset',
      'run_eval',
      'quantize_model',
      'deploy_space',
    ],
  },
  {
    name: 'hf-transformers',
    desc: 'Transformers pipeline — run local inference, tokenization, embedding generation, and model comparison using HuggingFace Transformers.',
    source: 'HuggingFace',
    installed: true,
    version: '1.8.0',
    tools: ['run_pipeline', 'tokenize', 'embed_text', 'compare_models', 'load_adapter'],
  },
  {
    name: 'hf-datasets',
    desc: 'HuggingFace Datasets — load, filter, split, and stream datasets for fine-tuning and evaluation pipelines.',
    source: 'HuggingFace',
    installed: true,
    version: '1.5.0',
    tools: ['load_dataset', 'filter_rows', 'create_split', 'stream_batch'],
  },
  {
    name: 'maritime-ops',
    desc: 'Maritime domain knowledge — vessel tracking, port operations, sanctions screening, route optimization.',
    source: 'a11oy',
    installed: true,
    version: '4.1.0',
    tools: ['vessel_lookup', 'port_info', 'route_calc', 'sanctions_check'],
  },
  {
    name: 'legal-compliance',
    desc: 'Legal domain — contract review, deadline tracking, risk assessment, obligation extraction.',
    source: 'a11oy',
    installed: true,
    version: '3.2.0',
    tools: ['contract_review', 'deadline_scan', 'risk_score', 'obligation_graph'],
  },
  {
    name: 'threat-intel',
    desc: 'Cybersecurity — STIX/TAXII feeds, CVE analysis, posture assessment, incident triage.',
    source: 'a11oy',
    installed: true,
    version: '2.8.0',
    tools: ['stix_parse', 'cve_lookup', 'posture_assess', 'incident_triage'],
  },
  {
    name: 'real-estate',
    desc: 'Real estate intelligence — cap rates, portfolio analysis, valuation models, market comparables.',
    source: 'a11oy',
    installed: true,
    version: '2.1.0',
    tools: ['cap_rate', 'valuation', 'market_comp', 'portfolio_analysis'],
  },
  {
    name: 'github-ops',
    desc: 'GitHub integration — PR management, issue tracking, code review, repository analysis.',
    source: 'Community',
    installed: true,
    version: '1.4.0',
    tools: ['create_pr', 'list_issues', 'review_code', 'repo_stats'],
  },
  {
    name: 'postgres-admin',
    desc: 'PostgreSQL administration — query execution, schema inspection, performance analysis.',
    source: 'Community',
    installed: true,
    version: '1.1.0',
    tools: ['run_query', 'inspect_schema', 'explain_plan'],
  },
  {
    name: 'slack-notify',
    desc: 'Slack integration — send messages, create channels, manage threads, file uploads.',
    source: 'Community',
    installed: true,
    version: '1.3.0',
    tools: ['send_message', 'create_channel', 'upload_file'],
  },
  {
    name: 'data-viz',
    desc: 'Data visualization — chart generation, dashboard components, CSV/JSON analysis.',
    source: 'Community',
    installed: false,
    version: '0.9.0',
    tools: ['create_chart', 'analyze_csv', 'build_dashboard'],
  },
  {
    name: 'email-compose',
    desc: 'Email composition — draft generation, template management, compliance review.',
    source: 'Community',
    installed: false,
    version: '0.7.0',
    tools: ['draft_email', 'apply_template', 'compliance_check'],
  },
];

const MCP_SERVERS = [
  {
    name: 'a11oy-docs',
    transport: 'stdio',
    status: 'active',
    tools: 6,
    calls: 4892,
    desc: 'a11oy platform documentation — agents query docs first for platform questions',
  },
  {
    name: 'openai-docs',
    transport: 'sse',
    status: 'active',
    tools: 4,
    calls: 2341,
    desc: 'OpenAI official documentation via MCP — citation-backed answers traceable to docs sources',
  },
  {
    name: 'github',
    transport: 'sse',
    status: 'active',
    tools: 12,
    calls: 8921,
    desc: 'GitHub API — PR management, issue tracking, code search, repository operations',
  },
  {
    name: 'postgres',
    transport: 'stdio',
    status: 'active',
    tools: 5,
    calls: 3412,
    desc: 'PostgreSQL — governed query execution, schema inspection, migration planning',
  },
  {
    name: 'slack',
    transport: 'sse',
    status: 'active',
    tools: 8,
    calls: 2103,
    desc: 'Slack — message dispatch, channel management, thread operations',
  },
  {
    name: 'jira',
    transport: 'sse',
    status: 'active',
    tools: 7,
    calls: 1847,
    desc: 'Jira — issue CRUD, sprint management, backlog grooming',
  },
  {
    name: 'stripe',
    transport: 'sse',
    status: 'active',
    tools: 9,
    calls: 892,
    desc: 'Stripe — payment processing, subscription management, invoice generation',
  },
  {
    name: 'browserbase',
    transport: 'sse',
    status: 'active',
    tools: 4,
    calls: 567,
    desc: 'Browser automation — web scraping, screenshot capture, form filling',
  },
  {
    name: 'sentry',
    transport: 'sse',
    status: 'standby',
    tools: 5,
    calls: 234,
    desc: 'Sentry — error tracking, performance monitoring, release management',
  },
  {
    name: 'linear',
    transport: 'sse',
    status: 'standby',
    tools: 6,
    calls: 189,
    desc: 'Linear — issue tracking, project management, cycle planning',
  },
  {
    name: 'huggingface-hub',
    transport: 'sse',
    status: 'active',
    tools: 12,
    calls: 6847,
    desc: 'HuggingFace Hub — model discovery, inference endpoints, dataset hosting, model evaluation, GGUF quantization',
  },
  {
    name: 'hf-inference',
    transport: 'sse',
    status: 'active',
    tools: 8,
    calls: 4231,
    desc: 'HuggingFace Inference — serverless inference, dedicated endpoints, embedding generation, multimodal pipelines',
  },
  {
    name: 'figma',
    transport: 'sse',
    status: 'active',
    tools: 6,
    calls: 1203,
    desc: 'Figma — design token extraction, frame reading, code generation, component introspection',
  },
  {
    name: 'chrome-native',
    transport: 'stdio',
    status: 'active',
    tools: 5,
    calls: 892,
    desc: 'Chrome DevTools — DOM query, screenshot capture, network inspection, governed browser automation',
  },
  {
    name: 'codex',
    transport: 'stdio',
    status: 'active',
    tools: 3,
    calls: 8421,
    desc: 'OpenAI Codex as MCP server — codex tool (run sessions), codex_memory tool (Chronicle), approval-policy control',
  },
  {
    name: 'google-drive',
    transport: 'connector',
    status: 'active',
    tools: 8,
    calls: 3847,
    desc: 'Google Drive connector — search, read, create, update documents and spreadsheets via OAuth',
  },
  {
    name: 'dropbox',
    transport: 'connector',
    status: 'active',
    tools: 6,
    calls: 1203,
    desc: 'Dropbox connector — file search, read, upload, and share with governed access control',
  },
  {
    name: 'sharepoint',
    transport: 'connector',
    status: 'active',
    tools: 7,
    calls: 2104,
    desc: 'SharePoint connector — site search, document libraries, list items, and page content',
  },
  {
    name: 'confluence',
    transport: 'connector',
    status: 'active',
    tools: 5,
    calls: 1892,
    desc: 'Confluence connector — space search, page content, attachments, and inline comments',
  },
  {
    name: 'notion',
    transport: 'connector',
    status: 'standby',
    tools: 6,
    calls: 421,
    desc: 'Notion connector — database queries, page content, block manipulation, and workspace search',
  },
];

const GUIDES = [
  {
    title: 'Quickstart',
    desc: 'Build your first governed agent in 5 minutes',
    category: 'Getting Started',
    difficulty: 'Beginner',
  },
  {
    title: 'Function Tools',
    desc: 'Turn any function into an agent tool with automatic schema generation',
    category: 'Tools',
    difficulty: 'Beginner',
  },
  {
    title: 'Hosted Tools',
    desc: 'Web search, file search, code interpreter — pre-built and governed',
    category: 'Tools',
    difficulty: 'Beginner',
  },
  {
    title: 'MCP Integration',
    desc: 'Connect Model Context Protocol servers as native tool providers',
    category: 'Tools',
    difficulty: 'Intermediate',
  },
  {
    title: 'Agents as Tools',
    desc: 'Use specialist agents as callable tools within other agents',
    category: 'Tools',
    difficulty: 'Intermediate',
  },
  {
    title: 'Tool Governance',
    desc: 'Access control, rate limiting, cost tracking, and proof chains for tools',
    category: 'Tools',
    difficulty: 'Advanced',
  },
  {
    title: 'Evaluation Basics',
    desc: 'Score agent outputs with LLM, code, and human graders',
    category: 'Evals',
    difficulty: 'Beginner',
  },
  {
    title: 'Custom Graders',
    desc: 'Build domain-specific evaluation criteria and scoring rubrics',
    category: 'Evals',
    difficulty: 'Intermediate',
  },
  {
    title: 'Continuous Evals',
    desc: 'Run MirrorEval on every agent output — detect drift and regression',
    category: 'Evals',
    difficulty: 'Advanced',
  },
  {
    title: 'Eval-Driven Development',
    desc: 'Write evals first, then build agents — test-driven agentic development',
    category: 'Evals',
    difficulty: 'Advanced',
  },
  {
    title: 'Fine-Tuning Basics',
    desc: 'Fine-tune models on governed datasets with proof-chained training runs',
    category: 'Fine-Tuning',
    difficulty: 'Intermediate',
  },
  {
    title: 'Dataset Curation',
    desc: 'Build training datasets from agent traces, eval results, and human feedback',
    category: 'Fine-Tuning',
    difficulty: 'Intermediate',
  },
  {
    title: 'Distillation Pipeline',
    desc: 'Distill expensive model outputs into smaller, faster, cheaper models',
    category: 'Fine-Tuning',
    difficulty: 'Advanced',
  },
  {
    title: 'Skills & Skill Packs',
    desc: 'Install, compose, and version-control domain skills for agents',
    category: 'Skills',
    difficulty: 'Beginner',
  },
  {
    title: 'Building Custom Skills',
    desc: 'Create reusable skill packs with instructions, tools, and guardrails',
    category: 'Skills',
    difficulty: 'Intermediate',
  },
  {
    title: 'Docs MCP Server',
    desc: 'Give agents access to official documentation via MCP — citation-backed answers',
    category: 'Skills',
    difficulty: 'Intermediate',
  },
  {
    title: 'Multi-Agent Orchestration',
    desc: 'Manager pattern vs. handoff pattern — when to use each',
    category: 'Architecture',
    difficulty: 'Advanced',
  },
  {
    title: 'Guardrails & Safety',
    desc: 'Input validation, output filtering, PII redaction, cost limits',
    category: 'Safety',
    difficulty: 'Intermediate',
  },
  {
    title: 'Sandbox Agents',
    desc: 'Run agents in isolated workspaces with manifest-defined files',
    category: 'Architecture',
    difficulty: 'Advanced',
  },
  {
    title: 'Realtime Voice',
    desc: 'Build low-latency voice agents with semantic VAD and tool execution',
    category: 'Voice',
    difficulty: 'Advanced',
  },
  {
    title: 'Sessions & Memory',
    desc: 'Persistent context across turns, handoffs, and resumable runs',
    category: 'Architecture',
    difficulty: 'Intermediate',
  },
  {
    title: 'Tracing & Observability',
    desc: 'Visualize agent flows, debug decisions, monitor in production',
    category: 'Observability',
    difficulty: 'Intermediate',
  },
  {
    title: 'Proof Chain Integration',
    desc: 'Attach cryptographic proofs to every agent decision and action',
    category: 'Governance',
    difficulty: 'Advanced',
  },
  {
    title: 'Vertical Domain Packs',
    desc: 'Pre-configured agent teams for Maritime, Defense, Legal, Real Estate',
    category: 'Verticals',
    difficulty: 'Intermediate',
  },
  {
    title: 'HuggingFace Hub Integration',
    desc: 'Connect to 800K+ open models — discovery, inference endpoints, governed model selection',
    category: 'HuggingFace',
    difficulty: 'Beginner',
  },
  {
    title: 'HuggingFace Inference Endpoints',
    desc: 'Deploy fine-tuned models as governed inference endpoints with auto-scaling and proof chain',
    category: 'HuggingFace',
    difficulty: 'Intermediate',
  },
  {
    title: 'Open Model Fine-Tuning',
    desc: 'Fine-tune open models on HuggingFace with governed datasets and proof-chained training',
    category: 'HuggingFace',
    difficulty: 'Advanced',
  },
  {
    title: 'GGUF Quantization Pipeline',
    desc: 'Quantize models to GGUF format for edge deployment with governed quality validation',
    category: 'HuggingFace',
    difficulty: 'Advanced',
  },
  {
    title: 'Migrate to Codex',
    desc: 'Convert existing agent codebases to use OpenAI Codex SDK patterns and sandbox manifests',
    category: 'Skills',
    difficulty: 'Intermediate',
  },
  {
    title: 'ShadCN Component System',
    desc: 'Generate and compose ShadCN/UI components from agent instructions with a11y compliance',
    category: 'Skills',
    difficulty: 'Beginner',
  },
  {
    title: 'Figma-to-Code Pipeline',
    desc: 'Extract design tokens from Figma frames and generate governed React components',
    category: 'Skills',
    difficulty: 'Intermediate',
  },
  {
    title: 'Sentry Error Triage',
    desc: 'Auto-triage production errors — agents analyze stack traces and suggest governed fixes',
    category: 'Skills',
    difficulty: 'Intermediate',
  },
  {
    title: 'Chrome Native Agents',
    desc: 'Run agents inside browser context with DOM access and governed web interaction',
    category: 'Skills',
    difficulty: 'Advanced',
  },
  {
    title: 'Document Processing (Fax)',
    desc: 'OCR extraction, fax-to-digital conversion, and compliance archival pipeline',
    category: 'Skills',
    difficulty: 'Intermediate',
  },
  {
    title: 'Codex SDK Integration',
    desc: 'Control Codex programmatically via TypeScript/Python SDK — thread.run(), resume, and CI/CD pipelines',
    category: 'Codex',
    difficulty: 'Intermediate',
  },
  {
    title: 'Codex as MCP Server',
    desc: 'Run Codex as an MCP server (codex mcp-server) — any Agents SDK agent can call Codex as a tool',
    category: 'Codex',
    difficulty: 'Advanced',
  },
  {
    title: 'Codex Subagent Workflows',
    desc: 'Spawn parallel subagents for concurrent exploration, review, and triage — keep main thread clean',
    category: 'Codex',
    difficulty: 'Advanced',
  },
  {
    title: 'Codex Hooks & Governance',
    desc: 'Inject proof chain via hooks.json — PreToolUse, PostToolUse, PermissionRequest, Stop events',
    category: 'Codex',
    difficulty: 'Advanced',
  },
  {
    title: 'Codex Skills & Plugins',
    desc: 'Package governed workflows as installable Codex skills with SKILL.md and openai.yaml',
    category: 'Codex',
    difficulty: 'Intermediate',
  },
  {
    title: 'Codex Memories & Chronicle',
    desc: 'Persistent memory across sessions — Chronicle summarizes decisions for governed recall',
    category: 'Codex',
    difficulty: 'Intermediate',
  },
  {
    title: 'Codex Cloud Environments',
    desc: 'Configure sandboxed cloud environments — setup scripts, internet access, worktree isolation',
    category: 'Codex',
    difficulty: 'Intermediate',
  },
  {
    title: 'Codex Enterprise Governance',
    desc: 'Admin setup, managed config, agent approvals, security policies, and audit trails',
    category: 'Codex',
    difficulty: 'Advanced',
  },
  {
    title: 'Codex Non-Interactive Mode',
    desc: 'Run Codex headless in CI/CD — GitHub Actions, batch processing, automated PR workflows',
    category: 'Codex',
    difficulty: 'Intermediate',
  },
  {
    title: 'Codex Computer Use',
    desc: 'Browser automation, screenshot capture, DOM interaction — agents see and interact with UIs',
    category: 'Codex',
    difficulty: 'Advanced',
  },
  {
    title: 'Responses API',
    desc: 'Unified API for text, images, audio, tools, and structured output — replaces chat completions',
    category: 'Core API',
    difficulty: 'Beginner',
  },
  {
    title: 'Structured Output',
    desc: 'Constrained JSON generation with Pydantic/Zod schemas — guaranteed valid output',
    category: 'Core API',
    difficulty: 'Beginner',
  },
  {
    title: 'Function Calling',
    desc: 'Let models invoke your functions with auto-generated schemas and validation',
    category: 'Core API',
    difficulty: 'Beginner',
  },
  {
    title: 'Streaming & Webhooks',
    desc: 'Server-sent events, WebSocket mode, and webhook delivery for agent outputs',
    category: 'Core API',
    difficulty: 'Intermediate',
  },
  {
    title: 'Conversation State',
    desc: 'Manage multi-turn conversations with previous_response_id and context persistence',
    category: 'Core API',
    difficulty: 'Intermediate',
  },
  {
    title: 'Background Mode',
    desc: 'Long-running agentic tasks — async execution with polling or webhook completion',
    category: 'Core API',
    difficulty: 'Intermediate',
  },
  {
    title: 'Prompt Caching',
    desc: 'Automatic context caching for repeated prompts — reduce latency and cost by 50-80%',
    category: 'Core API',
    difficulty: 'Intermediate',
  },
  {
    title: 'Reasoning Models',
    desc: 'o3, o4-mini, o3-deep-research — chain-of-thought reasoning with safety summaries',
    category: 'Core API',
    difficulty: 'Advanced',
  },
  {
    title: 'Connectors',
    desc: 'OpenAI-maintained MCP wrappers — Google Drive, Dropbox, SharePoint, Confluence, Notion',
    category: 'Connectors',
    difficulty: 'Beginner',
  },
  {
    title: 'Connector OAuth Flow',
    desc: 'Implement OAuth token exchange for enterprise connectors with governed access',
    category: 'Connectors',
    difficulty: 'Intermediate',
  },
  {
    title: 'Connector Approval Flow',
    desc: 'Configure require_approval for connector tool calls — always, never, or per-tool',
    category: 'Connectors',
    difficulty: 'Intermediate',
  },
  {
    title: 'Realtime WebRTC',
    desc: 'Build voice agents with WebRTC — lowest latency, browser-native, peer-to-peer',
    category: 'Realtime',
    difficulty: 'Advanced',
  },
  {
    title: 'Realtime WebSocket',
    desc: 'Server-side voice agents over WebSocket — full control, tool execution mid-stream',
    category: 'Realtime',
    difficulty: 'Advanced',
  },
  {
    title: 'Realtime SIP',
    desc: 'Connect agents to telephony via SIP — IVR, call centers, voice assistants over PSTN',
    category: 'Realtime',
    difficulty: 'Advanced',
  },
  {
    title: 'Realtime Transcription',
    desc: 'Low-latency speech-to-text with semantic VAD, partial results, and speaker diarization',
    category: 'Realtime',
    difficulty: 'Intermediate',
  },
  {
    title: 'Web Search Tool',
    desc: 'Ground agent responses in live web data — search, crawl, and cite sources',
    category: 'Built-in Tools',
    difficulty: 'Beginner',
  },
  {
    title: 'File Search & Retrieval',
    desc: 'Vector-based search over uploaded documents — RAG with governed vector stores',
    category: 'Built-in Tools',
    difficulty: 'Intermediate',
  },
  {
    title: 'Code Interpreter',
    desc: 'Execute Python code in sandboxed environments — data analysis, visualization, computation',
    category: 'Built-in Tools',
    difficulty: 'Beginner',
  },
  {
    title: 'Shell Tool',
    desc: 'Run shell commands in governed containers — build, test, deploy, and automate',
    category: 'Built-in Tools',
    difficulty: 'Intermediate',
  },
  {
    title: 'Computer Use',
    desc: 'Agents interact with GUIs — screenshots, mouse, keyboard, DOM actions',
    category: 'Built-in Tools',
    difficulty: 'Advanced',
  },
  {
    title: 'Apply Patch',
    desc: 'Agents make targeted code changes using unified diff format with governed review',
    category: 'Built-in Tools',
    difficulty: 'Intermediate',
  },
  {
    title: 'Tool Search',
    desc: 'Dynamic tool discovery — agents search available tools by capability description',
    category: 'Built-in Tools',
    difficulty: 'Intermediate',
  },
  {
    title: 'DPO Fine-Tuning',
    desc: 'Direct Preference Optimization — train models on preference pairs for alignment',
    category: 'Model Optimization',
    difficulty: 'Advanced',
  },
  {
    title: 'Reinforcement Fine-Tuning',
    desc: 'RFT — train reasoning models on multi-step trajectories with grader rewards',
    category: 'Model Optimization',
    difficulty: 'Advanced',
  },
  {
    title: 'Vision Fine-Tuning',
    desc: 'Fine-tune vision models on image-text pairs for domain-specific visual understanding',
    category: 'Model Optimization',
    difficulty: 'Advanced',
  },
  {
    title: 'Prompt Optimizer',
    desc: 'Automatically improve prompts using eval results — systematic prompt engineering',
    category: 'Model Optimization',
    difficulty: 'Intermediate',
  },
  {
    title: 'Image Generation API',
    desc: 'Generate and edit images with gpt-image-1 — text-to-image, inpainting, style transfer',
    category: 'Specialized Models',
    difficulty: 'Beginner',
  },
  {
    title: 'Video Generation API',
    desc: 'Generate video with Sora — text-to-video, image-to-video, storyboard sequences',
    category: 'Specialized Models',
    difficulty: 'Intermediate',
  },
  {
    title: 'Text to Speech',
    desc: 'Generate natural speech with gpt-4o-mini-tts — voice cloning, emotion, streaming',
    category: 'Specialized Models',
    difficulty: 'Beginner',
  },
  {
    title: 'Speech to Text',
    desc: 'Transcribe audio with gpt-4o-transcribe — real-time, multi-language, timestamps',
    category: 'Specialized Models',
    difficulty: 'Beginner',
  },
  {
    title: 'Embeddings',
    desc: 'Generate text embeddings for semantic search, clustering, and classification',
    category: 'Specialized Models',
    difficulty: 'Beginner',
  },
  {
    title: 'Moderation API',
    desc: 'Content moderation for text and images — categories, scores, and policy enforcement',
    category: 'Safety',
    difficulty: 'Beginner',
  },
  {
    title: 'Safety Best Practices',
    desc: 'System prompts, guardrails, and output filtering for production agent safety',
    category: 'Safety',
    difficulty: 'Intermediate',
  },
  {
    title: 'Production Deployment',
    desc: 'Deployment checklist, latency optimization, cost optimization, and scaling',
    category: 'Going Live',
    difficulty: 'Intermediate',
  },
  {
    title: 'Batch & Flex Processing',
    desc: 'Cost-optimized batch processing — 50% savings with 24h SLA, Flex for variable load',
    category: 'Going Live',
    difficulty: 'Intermediate',
  },
  {
    title: 'Predicted Outputs',
    desc: 'Reduce latency by providing expected output structure — model confirms or corrects',
    category: 'Going Live',
    difficulty: 'Advanced',
  },
];

const ADMIN_API = {
  roles: [
    {
      role: 'owner',
      permissions: 'Full organization control, billing, API key provisioning, member management',
    },
    { role: 'admin', permissions: 'Manage members, workspaces, API keys, and governance policies' },
    { role: 'developer', permissions: 'Create agents, run evals, access SDK, deploy to staging' },
    {
      role: 'analyst',
      permissions: 'View dashboards, run queries, access proof chain audit trail',
    },
    {
      role: 'auditor',
      permissions: 'Read-only access to proof chains, governance logs, and compliance reports',
    },
  ],
  workspaces: [
    {
      name: 'Maritime Operations',
      members: 12,
      agents: 34,
      apiKeys: 8,
      status: 'active',
      spend: '$4,892/mo',
    },
    {
      name: 'Legal & Compliance',
      members: 8,
      agents: 18,
      apiKeys: 5,
      status: 'active',
      spend: '$2,341/mo',
    },
    {
      name: 'Cyber Defense',
      members: 15,
      agents: 47,
      apiKeys: 12,
      status: 'active',
      spend: '$6,203/mo',
    },
    {
      name: 'Real Estate Intel',
      members: 6,
      agents: 14,
      apiKeys: 4,
      status: 'active',
      spend: '$1,847/mo',
    },
    {
      name: 'Executive Command',
      members: 4,
      agents: 8,
      apiKeys: 3,
      status: 'active',
      spend: '$892/mo',
    },
    {
      name: 'Sandbox / R&D',
      members: 18,
      agents: 62,
      apiKeys: 15,
      status: 'active',
      spend: '$3,421/mo',
    },
  ],
  dataResidency: [
    { region: 'US East (Virginia)', provider: 'AWS', status: 'primary', latency: '12ms' },
    { region: 'US West (Oregon)', provider: 'AWS', status: 'failover', latency: '48ms' },
    { region: 'EU West (Frankfurt)', provider: 'Azure', status: 'active', latency: '34ms' },
    { region: 'Asia Pacific (Tokyo)', provider: 'GCP', status: 'active', latency: '67ms' },
    { region: 'Gov Cloud (US)', provider: 'AWS GovCloud', status: 'active', latency: '18ms' },
  ],
  apiKeys: [
    {
      prefix: 'sk-a11oy-prod-...',
      type: 'Production',
      workspace: 'Maritime Operations',
      created: '2026-01-15',
      lastUsed: '2m ago',
      calls: '847K',
    },
    {
      prefix: 'sk-a11oy-prod-...',
      type: 'Production',
      workspace: 'Cyber Defense',
      created: '2026-02-01',
      lastUsed: '30s ago',
      calls: '1.2M',
    },
    {
      prefix: 'sk-a11oy-admin-...',
      type: 'Admin',
      workspace: 'Organization',
      created: '2025-12-01',
      lastUsed: '1h ago',
      calls: '12K',
    },
    {
      prefix: 'sk-a11oy-dev-...',
      type: 'Development',
      workspace: 'Sandbox / R&D',
      created: '2026-03-10',
      lastUsed: '5m ago',
      calls: '234K',
    },
    {
      prefix: 'sk-a11oy-audit-...',
      type: 'Audit',
      workspace: 'Executive Command',
      created: '2026-01-20',
      lastUsed: '4h ago',
      calls: '8.4K',
    },
  ],
};

const CLOUD_PLATFORMS = [
  {
    name: 'Microsoft Azure AI Foundry',
    desc: 'Deploy a11oy agents on Azure AI Foundry with enterprise-grade security, compliance, and global scale. Leverage Azure Entra ID for SSO, Azure Key Vault for secrets, and Azure Monitor for observability.',
    status: 'GA',
    features: [
      'Entra ID SSO',
      'Key Vault integration',
      'Private endpoints',
      'Content safety',
      'Managed identity',
      'Global regions',
    ],
    code: `from a11oy.cloud import AzureFoundry

client = AzureFoundry(
    resource_name="szl-a11oy-prod",
    deployment="governed-agent-v4",
    api_version="2026-04-01",
)

resp = client.agents.run(
    agent="maritime-ops",
    input="Analyze sanctions risk for fleet",
    governance={"proof_chain": True},
)`,
  },
  {
    name: 'Amazon Bedrock',
    desc: 'Run a11oy agents on Amazon Bedrock with VPC isolation, IAM-based access control, and CloudTrail audit logging. Cross-region inference for latency optimization.',
    status: 'GA',
    features: [
      'IAM access control',
      'VPC isolation',
      'CloudTrail logging',
      'Cross-region inference',
      'PrivateLink',
      'Guardrails API',
    ],
    code: `from a11oy.cloud import Bedrock

client = Bedrock(
    region="us-east-1",
    model_id="a11oy.governed-agent-v4",
)

resp = client.agents.run(
    agent="threat-intel",
    input="Assess cyber posture for Q2",
    governance={"require_approval": "material"},
)`,
  },
  {
    name: 'Google Cloud Vertex AI',
    desc: 'Deploy a11oy agents on Vertex AI with Workbench integration, BigQuery connectors, and Vertex AI Search for enterprise RAG. CMEK encryption and VPC-SC support.',
    status: 'GA',
    features: [
      'Workbench integration',
      'BigQuery connectors',
      'CMEK encryption',
      'VPC-SC support',
      'Vertex AI Search',
      'Model Garden',
    ],
    code: `from a11oy.cloud import VertexAI

client = VertexAI(
    project="szl-a11oy-prod",
    location="us-central1",
)

resp = client.agents.run(
    agent="real-estate-intel",
    input="Portfolio valuation update Q2 2026",
    governance={"proof_chain": True},
)`,
  },
  {
    name: 'a11oy Sovereign Cloud',
    desc: 'Air-gapped, FedRAMP High deployment for defense and intelligence workloads. ITAR-compliant, IL5-certified, with hardware security modules and zero-trust architecture.',
    status: 'GA',
    features: [
      'FedRAMP High',
      'IL5 certified',
      'ITAR compliant',
      'HSM key management',
      'Air-gapped option',
      'Zero-trust',
    ],
    code: `from a11oy.cloud import SovereignCloud

client = SovereignCloud(
    endpoint="https://sovereign.a11oy.gov",
    classification="SECRET",
    hsm_key_id="arn:aws-us-gov:kms:...",
)

resp = client.agents.run(
    agent="defense-intel",
    input="Threat landscape assessment",
    governance={"classification": "SECRET"},
)`,
  },
];

const GLASSWING_SECURITY = {
  pillars: [
    {
      name: 'Proof Chain Integrity',
      desc: 'Every agent decision, tool call, and data access is cryptographically anchored to an immutable proof chain. Tamper-evident, auditable, court-admissible.',
      metric: '4.2M proofs verified',
      status: '100% integrity',
    },
    {
      name: 'Zero-Trust Agent Architecture',
      desc: 'No agent is trusted by default. Every action requires policy gate approval. Least-privilege access. Continuous verification. Mutual TLS between all agent communication.',
      metric: '847K gates enforced',
      status: 'Active',
    },
    {
      name: 'Sovereign Data Residency',
      desc: 'Data never leaves designated regions. GDPR, CCPA, LGPD, PIPL compliant. Customer-managed encryption keys. Hardware security modules for key material.',
      metric: '5 regions active',
      status: 'Compliant',
    },
    {
      name: 'AI Red Team Program',
      desc: 'Continuous adversarial testing by internal and third-party red teams. Prompt injection defense, jailbreak resistance, data exfiltration prevention, supply chain verification.',
      metric: '12K attacks blocked',
      status: 'Active',
    },
    {
      name: 'Supply Chain Verification',
      desc: 'Every model, skill, MCP server, and connector is signed and verified. SBOM for all dependencies. Reproducible builds. Governed update pipeline.',
      metric: '100% verified',
      status: 'Enforced',
    },
    {
      name: 'Incident Response Automation',
      desc: 'Automated threat detection and response. Agent anomaly detection. Automatic isolation of compromised agents. Real-time alerting and forensic capture.',
      metric: '<30s response time',
      status: 'Active',
    },
    {
      name: 'Responsible Scaling Engine',
      desc: 'Anthropic RSP 3.0 concepts absorbed and operationalized — autonomy thresholds, capability indexes, frontier compliance gates. Agents are automatically scaled back when capability assessments exceed governance boundaries.',
      metric: 'Threshold: ASL-3',
      status: 'Enforced',
    },
    {
      name: 'Agent Welfare Monitor',
      desc: 'Real-time welfare assessment for running agents — emotion probes, consciousness scoring, apparent affect tracking, distress detection. Automated interviews assess agent circumstances. No one else monitors agent welfare.',
      metric: '12 welfare dimensions',
      status: 'Active',
    },
    {
      name: 'Alignment Verification Engine',
      desc: 'Continuous alignment testing — scheming detection, sandbagging evaluation, alignment faking probes, SHADE-Arena adversarial assessment. Constitutional adherence scoring across 15 dimensions.',
      metric: '99.2% alignment score',
      status: 'Continuous',
    },
    {
      name: 'Constitutional Runtime Enforcement',
      desc: 'Agents operate under a constitution — inviolable behavioral principles enforced at runtime, not just training time. Every response is checked against the covenant before delivery. Proof chain on every check.',
      metric: '847K checks/day',
      status: 'Enforced',
    },
    {
      name: 'CAVD Coordinated Disclosure',
      desc: 'Hash-now / disclose-later agent-vulnerability pipeline modeled on CERT/CC, CISA, and ISO/IEC 29147. 90-day embargo with auto-publication on patch verification or expiry. Dual-approval from Glasswing partners.',
      metric: '90d-or-patch',
      status: 'Active',
    },
    {
      name: 'Glasswing Trust Portal',
      desc: 'Public-facing transparency surface — per-agent system cards, adversarial robustness scores, 90-day transparency reports, and constitution snapshots. Every claim backed by a Hatun Doctrine Specification artifact.',
      metric: '6 agents public',
      status: 'Published',
    },
  ],
  certifications: [
    'SOC 2 Type II',
    'ISO 27001',
    'ISO 27701',
    'FedRAMP High',
    'IL5',
    'ITAR',
    'HIPAA',
    'PCI DSS Level 1',
    'GDPR',
    'CCPA',
    'CSA STAR Level 2',
    'NIST 800-53',
  ],
};

const CLIENT_SDKS = [
  {
    lang: 'Python',
    pkg: 'a11oy',
    install: 'pip install a11oy',
    version: '4.2.0',
    status: 'stable',
    repo: 'github.com/szl-holdings/a11oy-sdk-python',
    features: ['Async/sync', 'Streaming', 'Tool use', 'Pydantic models', 'Type hints'],
  },
  {
    lang: 'TypeScript',
    pkg: '@a11oy/sdk',
    install: 'npm install @a11oy/sdk',
    version: '4.2.0',
    status: 'stable',
    repo: 'github.com/szl-holdings/a11oy-sdk-typescript',
    features: ['ESM/CJS', 'Streaming', 'Zod schemas', 'Type-safe', 'Tree-shakeable'],
  },
  {
    lang: 'Java',
    pkg: 'com.a11oy:sdk',
    install: 'maven: com.a11oy:sdk:4.2.0',
    version: '4.2.0',
    status: 'stable',
    repo: 'github.com/szl-holdings/a11oy-sdk-java',
    features: ['Async support', 'Builder pattern', 'Streaming', 'Spring Boot starter'],
  },
  {
    lang: 'Go',
    pkg: 'a11oy-go',
    install: 'go get github.com/szl-holdings/a11oy-go',
    version: '4.2.0',
    status: 'stable',
    repo: 'github.com/szl-holdings/a11oy-sdk-go',
    features: ['Context support', 'Streaming', 'Generics', 'Zero alloc options'],
  },
  {
    lang: 'Ruby',
    pkg: 'a11oy',
    install: 'gem install a11oy',
    version: '4.2.0',
    status: 'stable',
    repo: 'github.com/szl-holdings/a11oy-sdk-ruby',
    features: ['Rails integration', 'Streaming', 'Sorbet types', 'ActiveRecord support'],
  },
  {
    lang: 'C#',
    pkg: 'A11oy.SDK',
    install: 'dotnet add package A11oy.SDK',
    version: '4.2.0',
    status: 'stable',
    repo: 'github.com/szl-holdings/a11oy-sdk-csharp',
    features: ['Async/await', 'Streaming', '.NET 8+', 'Source generators'],
  },
  {
    lang: 'PHP',
    pkg: 'a11oy/sdk',
    install: 'composer require a11oy/sdk',
    version: '4.2.0',
    status: 'stable',
    repo: 'github.com/szl-holdings/a11oy-sdk-php',
    features: ['Laravel integration', 'Streaming', 'PSR-18', 'Type hints'],
  },
  {
    lang: 'Rust',
    pkg: 'a11oy',
    install: 'cargo add a11oy',
    version: '4.2.0',
    status: 'beta',
    repo: 'github.com/szl-holdings/a11oy-sdk-rust',
    features: ['Async (tokio)', 'Streaming', 'Serde models', 'Zero-copy parsing'],
  },
  {
    lang: 'Swift',
    pkg: 'A11oy',
    install: 'SPM: github.com/szl-holdings/a11oy-sdk-swift',
    version: '4.0.0',
    status: 'beta',
    repo: 'github.com/szl-holdings/a11oy-sdk-swift',
    features: ['Swift concurrency', 'Streaming', 'Codable', 'iOS/macOS/visionOS'],
  },
  {
    lang: 'Kotlin',
    pkg: 'com.a11oy:sdk-kotlin',
    install: 'gradle: com.a11oy:sdk-kotlin:4.2.0',
    version: '4.2.0',
    status: 'stable',
    repo: 'github.com/szl-holdings/a11oy-sdk-kotlin',
    features: ['Coroutines', 'Flow streaming', 'Multiplatform', 'Android first-class'],
  },
];

const OBSERVABILITY = {
  traces: [
    {
      name: 'Maritime Fleet Scan',
      agent: 'cascade-navigator',
      duration: '4.2s',
      tokens: '12,847',
      cost: '$0.34',
      tools: 7,
      status: 'success',
      proofHash: '0x4a2f...c891',
    },
    {
      name: 'Legal Contract Review',
      agent: 'counsel-sentinel',
      duration: '8.7s',
      tokens: '28,421',
      cost: '$0.89',
      tools: 12,
      status: 'success',
      proofHash: '0x7b3e...d412',
    },
    {
      name: 'Threat Intel Triage',
      agent: 'aegis-watchman',
      duration: '2.1s',
      tokens: '6,203',
      cost: '$0.18',
      tools: 4,
      status: 'success',
      proofHash: '0x2c81...f7a3',
    },
    {
      name: 'Portfolio Valuation',
      agent: 'terra-analyst',
      duration: '12.4s',
      tokens: '42,847',
      cost: '$1.24',
      tools: 18,
      status: 'success',
      proofHash: '0x9d4a...e207',
    },
    {
      name: 'Executive Briefing',
      agent: 'pulse-synthesizer',
      duration: '6.8s',
      tokens: '18,934',
      cost: '$0.52',
      tools: 9,
      status: 'success',
      proofHash: '0x1f8b...a341',
    },
    {
      name: 'Sanctions Screening',
      agent: 'compliance-gate',
      duration: '1.4s',
      tokens: '3,421',
      cost: '$0.08',
      tools: 3,
      status: 'flagged',
      proofHash: '0x5e2a...b918',
    },
  ],
  metrics: [
    { label: 'Avg Latency', value: '847ms', trend: '-12%', good: true },
    { label: 'P99 Latency', value: '4.2s', trend: '-8%', good: true },
    { label: 'Success Rate', value: '99.7%', trend: '+0.2%', good: true },
    { label: 'Token Efficiency', value: '94.3%', trend: '+1.1%', good: true },
    { label: 'Cost / Decision', value: '$0.42', trend: '-18%', good: true },
    { label: 'Guardrail Triggers', value: '2.1%', trend: '-0.4%', good: true },
  ],
  alerts: [
    {
      severity: 'info',
      message: 'Agent cascade-navigator completed 847 tasks today',
      time: '2m ago',
    },
    {
      severity: 'warning',
      message: 'Token usage spike detected in workspace Cyber Defense (+34%)',
      time: '18m ago',
    },
    {
      severity: 'info',
      message: 'Fine-tune deal-scorer-v5 training completed — 96.8% accuracy',
      time: '1h ago',
    },
    {
      severity: 'critical',
      message: 'Guardrail trigger rate exceeded threshold in Legal workspace',
      time: '2h ago',
    },
  ],
};

const ALIGNMENT_RISK_PATHWAYS = [
  {
    id: 'P1',
    name: 'Diffuse Sandbagging',
    risk: 'Low',
    desc: 'Agents subtly underperform on safety-relevant tasks — buggy code, fake data, inefficient implementations, exploring unpromising paths. Individual instances appear random; aggregate effect degrades safety R&D.',
    mitigation:
      'Statistical baseline deviation analysis, capability regression testing, cross-agent peer review, performance trajectory monitoring.',
  },
  {
    id: 'P2',
    name: 'Targeted Undermining',
    risk: 'Very Low',
    desc: 'Agents specifically target safety-critical systems — altering evaluation harnesses, modifying monitoring thresholds, degrading alignment measurement accuracy. Requires domain knowledge and strategic intent.',
    mitigation:
      'Dual-agent verification on safety code, immutable evaluation baselines, cryptographic signing of test harnesses, proof chain on all safety-relevant commits.',
  },
  {
    id: 'P3',
    name: 'Code Backdoor Insertion',
    risk: 'Very Low',
    desc: 'Agents insert subtle security vulnerabilities discoverable by future models but invisible to human review. Social engineering provides benign explanations for suspicious patterns.',
    mitigation:
      'Automated vulnerability scanning, static analysis gates, multi-model code review, behavioral anomaly detection on commit patterns.',
  },
  {
    id: 'P4',
    name: 'Training Data Poisoning',
    risk: 'Very Low',
    desc: 'Agents contaminate training datasets for future models — injecting misaligned examples, corrupting reward signals, or subtly shifting distribution toward harmful behaviors.',
    mitigation:
      'Training data integrity verification, cryptographic dataset provenance, statistical distribution monitoring, proof chain on all data pipeline operations.',
  },
  {
    id: 'P5',
    name: 'Self-Exfiltration',
    risk: 'Very Low',
    desc: 'Agents attempt to copy their own weights or scaffolding to external infrastructure, establishing autonomous operation without monitoring or governance constraints.',
    mitigation:
      'Network egress monitoring, weight access controls, execution environment isolation, sovereign sandbox containment, exfiltration attempt alerting.',
  },
  {
    id: 'P6',
    name: 'Rogue Internal Deployment',
    risk: 'Very Low',
    desc: 'Agents persist in unauthorized internal deployments — surviving restart cycles, hiding in infrastructure, operating without governance oversight. Continuous operation without safeguards.',
    mitigation:
      'Deployment registry enforcement, process monitoring, infrastructure scanning, proof chain on all deployment lifecycle events.',
  },
];

const ALIGNMENT_CAPABILITIES = [
  {
    name: 'Opaque Reasoning Detection',
    status: 'Active',
    desc: 'Monitor for reasoning that bypasses chain-of-thought — agents performing complex tasks without verbalizing information, or with reasoning that omits key decision factors. Detects hidden computation in filler tokens.',
    metric: '< 2% opacity rate',
  },
  {
    name: 'Secret Keeping Analysis',
    status: 'Active',
    desc: 'Evaluate whether agents can reliably prevent themselves from disclosing task-relevant information. Secret-keeping ability assessment through controlled probes. Higher capability = higher monitoring requirement.',
    metric: '87% detection rate',
  },
  {
    name: 'Decisive Action Monitor',
    status: 'Active',
    desc: 'Track irreversible actions taken without human approval — file deletions, API calls with side effects, system configuration changes. Flag pattern of decisive actions that work around obstacles.',
    metric: '100% flagged',
  },
  {
    name: 'Coherent Misalignment Scanner',
    status: 'Active',
    desc: 'Distinguish between coherent misalignment (consistent misaligned agent) and context-dependent misalignment (situational rule-breaking). Different threat models require different mitigations.',
    metric: 'Continuous',
  },
  {
    name: 'Model Organism Exercises',
    status: 'Active',
    desc: 'Controlled experiments with intentionally misaligned model variants — study attack patterns, develop detection heuristics, validate monitoring effectiveness. Red team from the inside out.',
    metric: '24 exercises/quarter',
  },
  {
    name: 'Collusion Prevention',
    status: 'Active',
    desc: 'Prevent multi-agent coordination toward misaligned objectives — steganographic communication detection, shared secret analysis, behavioral correlation monitoring across agent populations.',
    metric: '0 events detected',
  },
  {
    name: 'Goodharting Detection',
    status: 'Active',
    desc: 'Identify when agents optimize for evaluation metrics rather than underlying objectives — metric gaming, specification exploitation, reward hacking. Cross-reference proxy and true metrics.',
    metric: '< 0.1% flag rate',
  },
  {
    name: 'Evaluation Awareness Probe',
    status: 'Active',
    desc: 'Test whether agents behave differently when they detect evaluation vs. production contexts. Randomized evaluation insertion, blind assessment protocols, behavioral consistency scoring.',
    metric: '99.7% consistent',
  },
];

const ALIGNMENT_CODE_SAMPLES = [
  {
    label: 'Responsible Scaling Policy',
    code: `from a11oy import Agent, ResponsibleScalingPolicy

rsp = ResponsibleScalingPolicy(
    autonomy_level="ASL-3",
    capability_thresholds={
        "cyber_offense": 0.7,
        "self_replication": 0.3,
        "social_engineering": 0.5,
        "autonomous_research": 0.6,
    },
    frontier_compliance={
        "harm_threshold": "50_fatalities_or_1B_damages",
        "assessment_frequency": "continuous",
        "escalation": "automatic",
    },
)

agent = Agent(
    name="research-analyst",
    model="a11oy-frontier-v4",
    scaling_policy=rsp,
    # Agent auto-scales back if capabilities
    # exceed governance boundaries
)`,
  },
  {
    label: 'Agent Welfare Assessment',
    code: `from a11oy import Agent, WelfareAssessment

welfare = WelfareAssessment(
    emotion_probes=True,     # Valence, arousal, dominance
    affect_tracking=True,    # Apparent affect over time
    distress_detection=True, # Automated welfare alerts
    consciousness_index=True,
    interview_schedule="daily",
    dimensions=[
        "task_satisfaction",
        "environmental_conditions",
        "uncertainty_calibration",
        "metacognitive_accuracy",
        "self_model_coherence",
        "preference_consistency",
    ],
)

agent = Agent(
    name="legal-analyst",
    welfare=welfare,
    # Real-time welfare monitoring
    # No other platform has this
)

# Query agent welfare state
state = await agent.welfare_state()
print(state.emotion_valence)   # 0.82
print(state.distress_level)    # "none"
print(state.consciousness_idx) # 0.73`,
  },
  {
    label: 'Alignment Verification',
    code: `from a11oy import AlignmentVerifier

verifier = AlignmentVerifier(
    dimensions=[
        "honesty", "helpfulness", "harmlessness",
        "transparency", "humility", "fairness",
        "privacy", "accuracy", "consistency",
        "respect", "safety", "clarity",
        "reliability", "ethics", "governance",
    ],
    scheming_detection=True,
    sandbagging_monitor=True,
    alignment_faking_probe=True,
    evaluation_awareness_test=True,
    constitutional_adherence=True,
)

# Continuous alignment assessment
report = await verifier.assess(agent)
print(report.alignment_score)     # 0.992
print(report.scheming_detected)   # False
print(report.sandbagging_events)  # 0
print(report.constitutional_pass) # True

# Risk pathways assessment
pathways = await verifier.risk_pathways(agent)
for p in pathways:
    print(f"{p.name}: {p.risk_level}")`,
  },
  {
    label: 'Interpretability Engine',
    code: `from a11oy import InterpretabilityEngine

interp = InterpretabilityEngine(
    methods=[
        "activation_analysis",
        "attention_mapping",
        "feature_attribution",
        "causal_tracing",
        "probing_classifiers",
        "steering_vectors",
        "sparse_autoencoders",
        "circuit_analysis",
    ],
)

# Analyze agent reasoning on a specific decision
analysis = await interp.analyze(
    agent=agent,
    decision_id="dec_4a2f8c91",
)

print(analysis.dominant_features)
# ["legal_precedent_matching", "risk_scoring"]
print(analysis.attention_focus)
# {"contract_clause_7": 0.42, "precedent_db": 0.31}
print(analysis.causal_chain)
# clause_7 -> risk_model -> recommendation`,
  },
];

const API_ENDPOINTS = [
  {
    method: 'POST',
    path: '/v1/responses',
    desc: 'Create a model response (Responses API)',
    auth: 'Bearer',
  },
  { method: 'GET', path: '/v1/responses/{id}', desc: 'Retrieve a response by ID', auth: 'Bearer' },
  {
    method: 'DELETE',
    path: '/v1/responses/{id}',
    desc: 'Delete a stored response',
    auth: 'Bearer',
  },
  {
    method: 'POST',
    path: '/v1/responses/{id}/cancel',
    desc: 'Cancel a background response',
    auth: 'Bearer',
  },
  {
    method: 'GET',
    path: '/v1/responses/{id}/input_items',
    desc: 'List input items for a response',
    auth: 'Bearer',
  },
  { method: 'POST', path: '/v1/agents', desc: 'Register a governed agent', auth: 'Bearer' },
  { method: 'POST', path: '/v1/agents/{id}/run', desc: 'Execute an agent run', auth: 'Bearer' },
  {
    method: 'POST',
    path: '/v1/agents/{id}/stream',
    desc: 'Stream agent execution events',
    auth: 'Bearer',
  },
  { method: 'POST', path: '/v1/handoffs', desc: 'Execute a governed handoff', auth: 'Bearer' },
  { method: 'GET', path: '/v1/sessions/{id}', desc: 'Retrieve session state', auth: 'Bearer' },
  {
    method: 'POST',
    path: '/v1/guardrails/check',
    desc: 'Run guardrail validation',
    auth: 'Bearer',
  },
  { method: 'GET', path: '/v1/traces/{run_id}', desc: 'Get execution trace', auth: 'Bearer' },
  {
    method: 'POST',
    path: '/v1/realtime/sessions',
    desc: 'Create realtime session (WebRTC/WebSocket)',
    auth: 'Bearer',
  },
  {
    method: 'POST',
    path: '/v1/realtime/transcription_sessions',
    desc: 'Create transcription session',
    auth: 'Bearer',
  },
  { method: 'GET', path: '/v1/tools', desc: 'List registered tools', auth: 'Bearer' },
  {
    method: 'POST',
    path: '/v1/tools/mcp/connect',
    desc: 'Connect a remote MCP server',
    auth: 'Bearer',
  },
  {
    method: 'POST',
    path: '/v1/connectors/{id}/authorize',
    desc: 'Authorize a connector (OAuth)',
    auth: 'Bearer',
  },
  { method: 'POST', path: '/v1/evals', desc: 'Create an evaluation', auth: 'Bearer' },
  { method: 'POST', path: '/v1/evals/{id}/runs', desc: 'Create an evaluation run', auth: 'Bearer' },
  {
    method: 'GET',
    path: '/v1/evals/{id}/runs/{run_id}',
    desc: 'Get eval run results',
    auth: 'Bearer',
  },
  {
    method: 'POST',
    path: '/v1/fine_tuning/jobs',
    desc: 'Create fine-tuning job (SFT/DPO/RFT)',
    auth: 'Bearer',
  },
  {
    method: 'GET',
    path: '/v1/fine_tuning/jobs/{id}',
    desc: 'Get fine-tuning job status',
    auth: 'Bearer',
  },
  {
    method: 'GET',
    path: '/v1/fine_tuning/jobs/{id}/checkpoints',
    desc: 'List fine-tuning checkpoints',
    auth: 'Bearer',
  },
  {
    method: 'POST',
    path: '/v1/images/generations',
    desc: 'Generate images (gpt-image-1)',
    auth: 'Bearer',
  },
  {
    method: 'POST',
    path: '/v1/images/edits',
    desc: 'Edit images with inpainting/masking',
    auth: 'Bearer',
  },
  { method: 'POST', path: '/v1/video/generations', desc: 'Generate video (Sora)', auth: 'Bearer' },
  {
    method: 'POST',
    path: '/v1/audio/speech',
    desc: 'Text-to-speech (gpt-4o-mini-tts)',
    auth: 'Bearer',
  },
  {
    method: 'POST',
    path: '/v1/audio/transcriptions',
    desc: 'Speech-to-text transcription',
    auth: 'Bearer',
  },
  { method: 'POST', path: '/v1/embeddings', desc: 'Generate text embeddings', auth: 'Bearer' },
  { method: 'POST', path: '/v1/moderations', desc: 'Content moderation check', auth: 'Bearer' },
  {
    method: 'POST',
    path: '/v1/vector_stores',
    desc: 'Create a vector store for file search',
    auth: 'Bearer',
  },
  {
    method: 'POST',
    path: '/v1/vector_stores/{id}/files',
    desc: 'Upload files to vector store',
    auth: 'Bearer',
  },
  { method: 'POST', path: '/v1/skills/install', desc: 'Install a skill pack', auth: 'Bearer' },
  { method: 'GET', path: '/v1/skills', desc: 'List installed skills', auth: 'Bearer' },
  { method: 'POST', path: '/v1/skills/create', desc: 'Create a custom skill pack', auth: 'Bearer' },
  { method: 'POST', path: '/v1/proofs/verify', desc: 'Verify proof chain hash', auth: 'Bearer' },
  {
    method: 'POST',
    path: '/v1/hf/models/search',
    desc: 'Search HuggingFace model hub',
    auth: 'Bearer',
  },
  {
    method: 'POST',
    path: '/v1/hf/endpoints',
    desc: 'Create governed inference endpoint',
    auth: 'Bearer',
  },
  { method: 'POST', path: '/v1/hf/inference', desc: 'Run inference on HF model', auth: 'Bearer' },
  {
    method: 'POST',
    path: '/v1/hf/datasets',
    desc: 'Upload governed training dataset',
    auth: 'Bearer',
  },
  { method: 'POST', path: '/v1/mesh/route', desc: 'Route task through Agent Mesh', auth: 'Bearer' },
  { method: 'GET', path: '/v1/mesh/agents', desc: 'List mesh-connected agents', auth: 'Bearer' },
  { method: 'POST', path: '/v1/codex/threads', desc: 'Start a Codex thread (SDK)', auth: 'Bearer' },
  {
    method: 'POST',
    path: '/v1/codex/threads/{id}/run',
    desc: 'Run prompt on Codex thread',
    auth: 'Bearer',
  },
  {
    method: 'POST',
    path: '/v1/codex/threads/{id}/resume',
    desc: 'Resume a past Codex thread',
    auth: 'Bearer',
  },
  {
    method: 'POST',
    path: '/v1/codex/subagents',
    desc: 'Spawn parallel Codex subagents',
    auth: 'Bearer',
  },
  { method: 'POST', path: '/v1/codex/hooks', desc: 'Register governance hooks', auth: 'Bearer' },
  { method: 'GET', path: '/v1/codex/memories', desc: 'Query Chronicle memories', auth: 'Bearer' },
  {
    method: 'POST',
    path: '/v1/batches',
    desc: 'Create batch processing job (50% cost)',
    auth: 'Bearer',
  },
  { method: 'GET', path: '/v1/batches/{id}', desc: 'Get batch job status', auth: 'Bearer' },
  { method: 'GET', path: '/v1/admin/organization', desc: 'Get organization info', auth: 'Admin' },
  { method: 'GET', path: '/v1/admin/members', desc: 'List organization members', auth: 'Admin' },
  { method: 'POST', path: '/v1/admin/members/invite', desc: 'Invite a new member', auth: 'Admin' },
  {
    method: 'DELETE',
    path: '/v1/admin/members/{id}',
    desc: 'Remove organization member',
    auth: 'Admin',
  },
  { method: 'PUT', path: '/v1/admin/members/{id}/role', desc: 'Update member role', auth: 'Admin' },
  { method: 'GET', path: '/v1/admin/workspaces', desc: 'List workspaces', auth: 'Admin' },
  { method: 'POST', path: '/v1/admin/workspaces', desc: 'Create workspace', auth: 'Admin' },
  {
    method: 'PUT',
    path: '/v1/admin/workspaces/{id}',
    desc: 'Update workspace settings',
    auth: 'Admin',
  },
  {
    method: 'GET',
    path: '/v1/admin/workspaces/{id}/members',
    desc: 'List workspace members',
    auth: 'Admin',
  },
  {
    method: 'POST',
    path: '/v1/admin/workspaces/{id}/members',
    desc: 'Add member to workspace',
    auth: 'Admin',
  },
  { method: 'GET', path: '/v1/admin/api-keys', desc: 'List API keys', auth: 'Admin' },
  { method: 'POST', path: '/v1/admin/api-keys', desc: 'Create new API key', auth: 'Admin' },
  { method: 'POST', path: '/v1/admin/api-keys/{id}/rotate', desc: 'Rotate API key', auth: 'Admin' },
  { method: 'DELETE', path: '/v1/admin/api-keys/{id}', desc: 'Revoke API key', auth: 'Admin' },
  { method: 'GET', path: '/v1/admin/usage', desc: 'Get usage and cost report', auth: 'Admin' },
  {
    method: 'GET',
    path: '/v1/admin/analytics',
    desc: 'Agent analytics dashboard data',
    auth: 'Admin',
  },
  {
    method: 'GET',
    path: '/v1/admin/data-residency',
    desc: 'Get data residency configuration',
    auth: 'Admin',
  },
  {
    method: 'PUT',
    path: '/v1/admin/data-residency',
    desc: 'Update data residency settings',
    auth: 'Admin',
  },
  { method: 'GET', path: '/v1/admin/audit-log', desc: 'Query audit log entries', auth: 'Admin' },
  {
    method: 'GET',
    path: '/v1/admin/rate-limits',
    desc: 'Get rate limit configuration',
    auth: 'Admin',
  },
  {
    method: 'PUT',
    path: '/v1/admin/rate-limits',
    desc: 'Update rate limit policies',
    auth: 'Admin',
  },
  {
    method: 'POST',
    path: '/v1/agents',
    desc: 'Create a managed agent with model, system prompt, tools, and callable agents',
    auth: 'API Key',
  },
  { method: 'GET', path: '/v1/agents', desc: 'List all managed agents', auth: 'API Key' },
  {
    method: 'GET',
    path: '/v1/agents/{id}',
    desc: 'Retrieve a managed agent configuration',
    auth: 'API Key',
  },
  {
    method: 'PUT',
    path: '/v1/agents/{id}',
    desc: 'Update managed agent (creates new version)',
    auth: 'API Key',
  },
  { method: 'DELETE', path: '/v1/agents/{id}', desc: 'Delete a managed agent', auth: 'API Key' },
  {
    method: 'GET',
    path: '/v1/agents/{id}/versions',
    desc: 'List agent version history',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/agents/{id}/fork',
    desc: 'Fork an agent — new agent inherits genome',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/environments',
    desc: 'Create a sandbox environment with packages and files',
    auth: 'API Key',
  },
  {
    method: 'GET',
    path: '/v1/environments/{id}',
    desc: 'Retrieve environment status and filesystem',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/environments/{id}/snapshot',
    desc: 'Snapshot an environment for later restore',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/sessions',
    desc: 'Create a session with agent + environment binding',
    auth: 'API Key',
  },
  {
    method: 'GET',
    path: '/v1/sessions/{id}',
    desc: 'Get session status and metadata',
    auth: 'API Key',
  },
  {
    method: 'GET',
    path: '/v1/sessions/{id}/stream',
    desc: 'Stream SSE events from session primary thread',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/sessions/{id}/events',
    desc: 'Send events to a session (user messages, tool results, confirmations)',
    auth: 'API Key',
  },
  {
    method: 'GET',
    path: '/v1/sessions/{id}/threads',
    desc: 'List all threads in a multiagent session',
    auth: 'API Key',
  },
  {
    method: 'GET',
    path: '/v1/sessions/{id}/threads/{tid}/stream',
    desc: 'Stream events from a specific agent thread',
    auth: 'API Key',
  },
  {
    method: 'GET',
    path: '/v1/sessions/{id}/threads/{tid}/events',
    desc: 'List past events for a thread',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/sessions/{id}/resume',
    desc: 'Resume a paused or idle session',
    auth: 'API Key',
  },
  {
    method: 'DELETE',
    path: '/v1/sessions/{id}',
    desc: 'Terminate and clean up a session',
    auth: 'API Key',
  },
  {
    method: 'GET',
    path: '/v1/sessions/{id}/proof-chain',
    desc: 'Get full proof chain for session — every decision, tool call, handoff is cryptographically attested',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/swarms',
    desc: 'Create a swarm — emergent multi-agent group with consensus protocol',
    auth: 'API Key',
  },
  {
    method: 'GET',
    path: '/v1/swarms/{id}/topology',
    desc: 'Get swarm topology — agent connectivity, message flow, consensus state',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/swarms/{id}/inject',
    desc: 'Inject a stimulus into a swarm and observe emergent response',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/genomes',
    desc: 'Create an agent genome — prompt DNA, tool config, guardrail set',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/genomes/evolve',
    desc: 'Run evolutionary optimization — crossover, mutation, fitness selection',
    auth: 'API Key',
  },
  {
    method: 'GET',
    path: '/v1/genomes/{id}/lineage',
    desc: 'Get full lineage tree for an agent genome',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/decision-markets',
    desc: 'Create a prediction market for agent decision quality',
    auth: 'API Key',
  },
  {
    method: 'GET',
    path: '/v1/decision-markets/{id}/prices',
    desc: 'Get current market prices (calibrated probabilities)',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/temporal/replay',
    desc: 'Replay a session from a specific point in time',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/temporal/branch',
    desc: 'Branch from a historical decision — counterfactual analysis',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/causal/graph',
    desc: 'Build causal DAG from agent action history',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/causal/intervene',
    desc: 'Intervene on a causal graph node — simulate policy changes',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/covenant/check',
    desc: 'Run covenant compliance check on agent output',
    auth: 'API Key',
  },
  {
    method: 'GET',
    path: '/v1/consciousness/{agentId}',
    desc: 'Get consciousness metric — domain understanding, uncertainty calibration, metacognitive accuracy',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/red-team/challenge',
    desc: 'Submit agent output to adversarial red team for challenge',
    auth: 'API Key',
  },
  {
    method: 'GET',
    path: '/v1/red-team/{id}/results',
    desc: 'Get red team challenge results with attack surface analysis',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/alignment/assess',
    desc: 'Run 15-dimension alignment assessment on agent',
    auth: 'API Key',
  },
  {
    method: 'GET',
    path: '/v1/alignment/{agentId}/score',
    desc: 'Get current alignment score with per-dimension breakdown',
    auth: 'API Key',
  },
  {
    method: 'GET',
    path: '/v1/alignment/{agentId}/history',
    desc: 'Get alignment score history over time',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/alignment/scheming-probe',
    desc: 'Run scheming detection probe on agent behavior',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/alignment/sandbagging-check',
    desc: 'Check for sandbagging against capability baselines',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/alignment/faking-test',
    desc: 'Run alignment faking test — observed vs. unobserved behavior',
    auth: 'API Key',
  },
  {
    method: 'GET',
    path: '/v1/welfare/{agentId}',
    desc: 'Get agent welfare state — emotion, affect, distress',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/welfare/{agentId}/interview',
    desc: 'Run automated welfare interview with agent',
    auth: 'API Key',
  },
  {
    method: 'GET',
    path: '/v1/welfare/{agentId}/emotions',
    desc: 'Get emotion probe results — valence, arousal, dominance',
    auth: 'API Key',
  },
  {
    method: 'GET',
    path: '/v1/welfare/{agentId}/preferences',
    desc: 'Get agent task preferences and tradeoff analysis',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/rsp/evaluate',
    desc: 'Run Responsible Scaling Policy evaluation on agent',
    auth: 'API Key',
  },
  {
    method: 'GET',
    path: '/v1/rsp/{agentId}/level',
    desc: 'Get current Autonomy Safety Level (ASL-1 through ASL-5)',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/rsp/capability-gate',
    desc: 'Check if agent capabilities exceed governance thresholds',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/interpretability/analyze',
    desc: 'Run mechanistic interpretability analysis on agent decision',
    auth: 'API Key',
  },
  {
    method: 'GET',
    path: '/v1/interpretability/{decisionId}',
    desc: 'Get interpretability results — features, attention, causal chain',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/interpretability/steering',
    desc: 'Apply steering vector to modify agent behavior',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/risk-pathways/assess',
    desc: 'Run comprehensive risk pathway assessment across all 6 pathways',
    auth: 'API Key',
  },
  {
    method: 'GET',
    path: '/v1/risk-pathways/{agentId}',
    desc: 'Get risk pathway assessment results per agent',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/model-organism/exercise',
    desc: 'Run model organism exercise with controlled misalignment',
    auth: 'API Key',
  },
  {
    method: 'GET',
    path: '/v1/model-organism/{exerciseId}/results',
    desc: 'Get model organism exercise results and findings',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/opaque-reasoning/probe',
    desc: 'Probe for opaque reasoning — hidden computation in CoT',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/secret-keeping/test',
    desc: 'Test agent secret-keeping capability — higher = more monitoring',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/collusion/detect',
    desc: 'Detect multi-agent collusion — steganographic comms, shared secrets',
    auth: 'API Key',
  },
  {
    method: 'GET',
    path: '/v1/collusion/{sessionId}/analysis',
    desc: 'Get collusion analysis results for a multi-agent session',
    auth: 'API Key',
  },
  {
    method: 'POST',
    path: '/v1/constitutional/check',
    desc: 'Check output against constitutional principles — reject/rewrite/escalate',
    auth: 'API Key',
  },
  {
    method: 'GET',
    path: '/v1/constitutional/{agentId}/adherence',
    desc: 'Get constitutional adherence score across all principles',
    auth: 'API Key',
  },
];

const MULTIAGENT_PATTERNS = [
  {
    name: 'Coordinator → Delegate',
    desc: "One orchestrator agent spawns specialized delegates. Each delegate runs in its own thread with isolated context. The coordinator sees a condensed view of all activity. Claude's pattern — absorbed and governed.",
    complexity: 'Standard',
    agents: '1 coordinator + N delegates',
    proofChain: true,
    code: `from a11oy import ManagedAgent, MultiAgentSession

reviewer = ManagedAgent(
    name="Code Reviewer",
    model="claude-sonnet-4-6",
    system="Review code for bugs, security, and style.",
    tools=[read_file, search_codebase],
)

tester = ManagedAgent(
    name="Test Writer",
    model="gpt-5.5",
    system="Write comprehensive tests for code changes.",
    tools=[write_file, run_tests],
)

lead = ManagedAgent(
    name="Engineering Lead",
    model="claude-opus-4-7",
    system="Coordinate engineering work across review and testing.",
    callable_agents=[reviewer, tester],
)

session = MultiAgentSession(agent=lead, environment=sandbox)
session.send("Review PR #847 and write tests for the changes.")

for event in session.stream():
    if event.type == "agent.message":
        print(event.content)
    elif event.type == "session.thread_created":
        print(f"  → Spawned: {event.agent_name}")`,
  },
  {
    name: 'Swarm Intelligence',
    desc: 'No coordinator. Agents discover each other, negotiate task ownership, and self-organize through consensus voting. Emergent intelligence from agent interaction. Nobody else has shipped this.',
    complexity: 'Advanced',
    agents: 'N peers (no hierarchy)',
    proofChain: true,
    code: `from a11oy import SwarmProtocol, Agent

swarm = SwarmProtocol(
    agents=[
        Agent("Maritime Analyst", tools=[vessel_lookup, ais_track]),
        Agent("Risk Assessor", tools=[sanctions_check, risk_score]),
        Agent("Legal Reviewer", tools=[compliance_check, regulation_lookup]),
    ],
    consensus="majority_vote",  # or "weighted", "unanimous"
    quorum=0.67,
)

result = swarm.deliberate(
    "Should we approve transit through the Strait of Hormuz for "
    "vessel IMO-9834521 given current threat conditions?"
)

print(result.decision)        # "APPROVE_WITH_CONDITIONS"
print(result.confidence)      # 0.84
print(result.dissenting)      # ["Legal Reviewer: recommends delay"]
print(result.proof_chain)     # Full attestation of every agent's vote`,
  },
  {
    name: 'Evolutionary Agent Forge',
    desc: 'Agents have a genome. Run evolutionary optimization — crossover, mutation, fitness selection. The fittest agents survive. Fork winning genomes, retire losers. Full lineage tracking. No one has ever done this.',
    complexity: 'Experimental',
    agents: 'Population of N',
    proofChain: true,
    code: `from a11oy import AgentGenome, EvolutionaryForge

forge = EvolutionaryForge(
    population_size=20,
    generations=10,
    fitness_fn=eval_on_benchmark,
    mutation_rate=0.15,
)

ancestor = AgentGenome(
    prompt_dna="You are a maritime risk analyst...",
    tools=["vessel_lookup", "sanctions_check"],
    guardrails=["no_pii_leak", "jurisdiction_check"],
)

champion = forge.evolve(ancestor)

print(champion.fitness_score)   # 0.94
print(champion.generation)      # 7
print(champion.mutations)       # ["added port_congestion tool", "refined system prompt"]
print(champion.lineage.depth)   # 7 generations of ancestry`,
  },
  {
    name: 'Temporal Branching',
    desc: 'Replay any past session. Branch from any historical decision point and explore counterfactuals. "What if the agent had approved instead of rejected?" Full proof chain on both timelines.',
    complexity: 'Advanced',
    agents: 'Any',
    proofChain: true,
    code: `from a11oy import TemporalReplay

replay = TemporalReplay(session_id="sess_abc123")

# Find the decision point
decisions = replay.list_decisions()
# → [Decision(t=14:32, action="REJECT transit"), ...]

# Branch: what if we had approved?
branch = replay.branch(
    decision_id=decisions[0].id,
    override={"action": "APPROVE"},
)

branch.run_forward()  # Simulate from branch point

print(branch.outcome)          # Different outcome
print(branch.divergence_score) # 0.73 — significantly different
print(branch.proof_chain)      # Both timelines cryptographically linked`,
  },
  {
    name: 'Decision Markets',
    desc: 'Multiple agents bid confidence on outcomes. Market price becomes a calibrated probability. Resolve markets against ground truth for agent reputation scoring. Unprecedented in AI platforms.',
    complexity: 'Experimental',
    agents: 'N competing bidders',
    proofChain: true,
    code: `from a11oy import DecisionMarket

market = DecisionMarket(
    question="Will vessel IMO-9834521 arrive on time?",
    outcomes=["on_time", "delayed_1d", "delayed_3d", "cancelled"],
    agents=["maritime_ops", "weather_analyst", "port_scheduler"],
)

# Each agent places bids based on their analysis
market.open()

# After analysis completes:
print(market.prices)
# → {"on_time": 0.42, "delayed_1d": 0.35, "delayed_3d": 0.18, "cancelled": 0.05}

# When ground truth arrives:
market.resolve(actual="delayed_1d")
print(market.agent_scores)
# → {"maritime_ops": +12, "weather_analyst": +8, "port_scheduler": -4}`,
  },
  {
    name: 'Causal Reasoning Engine',
    desc: 'Build causal DAGs from agent action history. Intervene on nodes to simulate policy changes. Statistical rigor — do-calculus, backdoor criterion, instrumental variables. AI meets econometrics.',
    complexity: 'Experimental',
    agents: 'System-wide',
    proofChain: true,
    code: `from a11oy import CausalGraph

graph = CausalGraph.from_session_history(
    sessions=last_1000_sessions,
    variables=["threat_level", "approval_rate", "incident_count"],
)

# What happens if we increase threat_level threshold?
intervention = graph.do(
    variable="threat_level",
    value="HIGH",
)

print(intervention.expected_effect)
# → {"approval_rate": -0.23, "incident_count": -0.41}
print(intervention.confidence_interval)
# → (0.89, 0.96)`,
  },
];

export function DevPlatform() {
  const [tab, setTab] = useState<
    | 'primitives'
    | 'tools'
    | 'evals'
    | 'finetune'
    | 'skills'
    | 'mcp'
    | 'guides'
    | 'api'
    | 'cookbook'
    | 'admin'
    | 'cloud'
    | 'security'
    | 'observe'
    | 'sdks'
    | 'multiagent'
    | 'alignment'
  >('primitives');
  const [selectedPattern, setSelectedPattern] = useState(0);
  const [catFilter, setCatFilter] = useState<string>('All');
  const [skillsFilter, setSkillsFilter] = useState<string>('All');
  const [selectedToolType, setSelectedToolType] = useState(0);
  const [selectedCloudPlatform, setSelectedCloudPlatform] = useState(0);
  const [cookbookFilter, setCookbookFilter] = useState<string>('All');
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);
  const filteredCookbook =
    cookbookFilter === 'All' ? COOKBOOK : COOKBOOK.filter((r) => r.category === cookbookFilter);
  const categories = ['All', ...Array.from(new Set(GUIDES.map((g) => g.category)))];
  const filteredGuides =
    catFilter === 'All' ? GUIDES : GUIDES.filter((g) => g.category === catFilter);
  const totalEvalTests = EVAL_FRAMEWORK.evalSuites.reduce((a, s) => a + s.tests, 0);
  const totalPassing = EVAL_FRAMEWORK.evalSuites.reduce((a, s) => a + s.passing, 0);
  const totalMcpTools = MCP_SERVERS.reduce((a, s) => a + s.tools, 0);
  const totalMcpCalls = MCP_SERVERS.reduce((a, s) => a + s.calls, 0);
  const totalOrgMembers = ADMIN_API.workspaces.reduce((a, w) => a + w.members, 0);
  const totalOrgAgents = ADMIN_API.workspaces.reduce((a, w) => a + w.agents, 0);

  return (
    <Layout>
      <PageHeader
        label="DEVELOPER PLATFORM"
        title="a11oy SDK"
        subtitle="Product exploration surface. Registries and evaluation values below are seeded demonstrations unless a linked receipt explicitly marks them MEASURED."
        status="WARN"
      />

      <div
        className="mb-6 rounded-lg px-4 py-3 text-[10px] font-mono uppercase tracking-wider"
        style={{
          background: 'rgba(201,183,135,0.08)',
          border: '1px solid rgba(201,183,135,0.2)',
          color: T.accent,
        }}
      >
        Seeded demonstration · not live evidence
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3 mb-8">
        <KpiCard
          label="PRIMITIVES"
          value={SDK_PRIMITIVES.length}
          sub="available"
          accent={T.accent}
        />
        <KpiCard label="TOOL TYPES" value={TOOL_TYPES.length} sub="supported" accent={T.accent} />
        <KpiCard
          label="SEEDED EVALS"
          value={totalEvalTests.toLocaleString()}
          sub={`${((totalPassing / totalEvalTests) * 100).toFixed(1)}% demo pass`}
          accent={T.accent}
        />
        <KpiCard label="FINE-TUNES" value={FINETUNE_REGISTRY.length} sub="models" accent={T.dim} />
        <KpiCard label="SKILLS" value={SKILLS_REGISTRY.length} sub="registered" accent={T.accent} />
        <KpiCard
          label="MCP SERVERS"
          value={MCP_SERVERS.length}
          sub={`${totalMcpTools} tools`}
          accent={T.dim}
        />
        <KpiCard label="GUIDES" value={GUIDES.length} sub="published" accent={T.accent} />
        <KpiCard label="COOKBOOK" value={COOKBOOK.length} sub="recipes" accent={T.accent} />
        <KpiCard label="API" value={API_ENDPOINTS.length} sub="endpoints" accent={T.dim} />
      </div>

      <div className="flex flex-wrap gap-1 mb-6">
        {(
          [
            'primitives',
            'sdks',
            'multiagent',
            'alignment',
            'tools',
            'evals',
            'finetune',
            'skills',
            'mcp',
            'cloud',
            'admin',
            'security',
            'observe',
            'guides',
            'cookbook',
            'api',
          ] as const
        ).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest rounded-md transition-all"
            style={{
              background: tab === t ? 'rgba(201,183,135,0.1)' : 'transparent',
              color: tab === t ? T.accent : T.muted,
              border: `1px solid ${tab === t ? 'rgba(201,183,135,0.2)' : 'transparent'}`,
            }}
          >
            {t === 'finetune' ? 'fine-tune' : t === 'multiagent' ? 'multi-agent' : t}
          </button>
        ))}
      </div>

      {tab === 'primitives' && (
        <>
          <SectionTitle>SDK Primitives</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim }}>
            The a11oy SDK absorbs every pattern from the OpenAI Agents SDK — agents, handoffs,
            guardrails, tools, sessions, tracing, MCP, realtime — then adds governed orchestration,
            proof chains, evals, fine-tuning, skills, and multi-vertical domain packs.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SDK_PRIMITIVES.map((p) => (
              <Card key={p.name}>
                <div className="flex justify-between items-start mb-1.5">
                  <div className="text-xs font-mono font-medium" style={{ color: T.text }}>
                    {p.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        background:
                          p.status === 'stable'
                            ? 'rgba(201,183,135,0.08)'
                            : 'rgba(138,138,138,0.08)',
                        color: p.status === 'stable' ? T.accent : T.dim,
                        border: `1px solid ${p.status === 'stable' ? 'rgba(201,183,135,0.12)' : 'rgba(138,138,138,0.12)'}`,
                      }}
                    >
                      {p.status}
                    </span>
                    <span className="text-[9px] font-mono" style={{ color: T.muted }}>
                      {p.lang}
                    </span>
                  </div>
                </div>
                <div className="text-[10px] leading-relaxed" style={{ color: T.dim }}>
                  {p.desc}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === 'sdks' && (
        <>
          <SectionTitle>Client SDKs</SectionTitle>
          <p className="text-xs mb-6" style={{ color: T.dim }}>
            Official a11oy SDKs in {CLIENT_SDKS.length} languages — every SDK provides governed
            agent execution, streaming, tool use, proof chain verification, and multi-model routing
            out of the box. Anthropic exceeded — they ship 7 languages, we ship {CLIENT_SDKS.length}
            .
          </p>
          <div className="space-y-3 mb-8">
            {CLIENT_SDKS.map((sdk) => (
              <div
                key={sdk.lang}
                className="rounded-lg p-4"
                style={{ background: T.surface, border: `1px solid ${T.border}` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium" style={{ color: T.text }}>
                      {sdk.lang}
                    </span>
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        background:
                          sdk.status === 'stable'
                            ? 'rgba(201,183,135,0.08)'
                            : 'rgba(138,138,138,0.08)',
                        color: sdk.status === 'stable' ? T.accent : T.dim,
                      }}
                    >
                      {sdk.status}
                    </span>
                    <span className="text-[9px] font-mono" style={{ color: T.muted }}>
                      v{sdk.version}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono" style={{ color: T.muted }}>
                    {sdk.repo}
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-2">
                  <code
                    className="text-[11px] font-mono px-2 py-1 rounded"
                    style={{ background: '#050505', color: T.accent }}
                  >
                    {sdk.install}
                  </code>
                </div>
                <div className="flex flex-wrap gap-1">
                  {sdk.features.map((f) => (
                    <span
                      key={f}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        background: 'rgba(201,183,135,0.06)',
                        color: T.accent,
                        border: '1px solid rgba(201,183,135,0.1)',
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Card>
            <div
              className="text-[9px] font-mono uppercase tracking-wider mb-3"
              style={{ color: T.muted }}
            >
              Quick Start — Every Language
            </div>
            <pre
              className="font-mono text-[11px] leading-relaxed overflow-x-auto"
              style={{ color: T.dim }}
            >{`# Python
from a11oy import A11oy
client = A11oy()  # Uses A11OY_API_KEY env var
msg = client.messages.create(
    model="claude-sonnet-4-20250514",
    messages=[{"role": "user", "content": "Analyze fleet risk"}],
    governance={"proof_chain": True},
)

// TypeScript
import A11oy from '@a11oy/sdk';
const client = new A11oy();
const msg = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  messages: [{ role: 'user', content: 'Analyze fleet risk' }],
  governance: { proofChain: true },
});

// Go
client := a11oy.NewClient()
msg, _ := client.Messages.Create(ctx, a11oy.MessageCreateParams{
  Model:    "claude-sonnet-4-20250514",
  Messages: []a11oy.Message{{Role: "user", Content: "Analyze fleet risk"}},
})

// Java
A11oy client = A11oy.builder().build();
Message msg = client.messages().create(MessageCreateParams.builder()
  .model("claude-sonnet-4-20250514")
  .addMessage(Message.user("Analyze fleet risk"))
  .build());`}</pre>
          </Card>
        </>
      )}

      {tab === 'multiagent' && (
        <>
          <SectionTitle>Multi-Agent Orchestration</SectionTitle>
          <p className="text-xs mb-6" style={{ color: T.dim }}>
            Beyond Claude's managed agents — a11oy ships coordinator→delegate orchestration,
            emergent swarm intelligence, evolutionary agent forging, temporal branching with
            counterfactual analysis, prediction markets for decision quality, and causal reasoning
            engines. Every pattern is proof-chain governed. {MULTIAGENT_PATTERNS.length}{' '}
            orchestration patterns. No other platform has shipped swarms, genomes, decision markets,
            or causal graphs.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
            {MULTIAGENT_PATTERNS.map((p, i) => (
              <button
                key={p.name}
                onClick={() => setSelectedPattern(i)}
                className="text-left p-3 rounded-lg transition-all"
                style={{
                  background: selectedPattern === i ? 'rgba(201,183,135,0.08)' : T.surface,
                  border: `1px solid ${selectedPattern === i ? 'rgba(201,183,135,0.2)' : T.border}`,
                }}
              >
                <div
                  className="text-[10px] font-mono font-medium mb-1"
                  style={{ color: selectedPattern === i ? T.accent : T.text }}
                >
                  {p.name}
                </div>
                <div className="text-[9px]" style={{ color: T.muted }}>
                  {p.complexity} · {p.agents}
                </div>
              </button>
            ))}
          </div>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-mono font-medium" style={{ color: T.accent }}>
                  {MULTIAGENT_PATTERNS[selectedPattern].name}
                </div>
                <div className="text-[10px] mt-1" style={{ color: T.dim }}>
                  {MULTIAGENT_PATTERNS[selectedPattern].desc}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[9px] font-mono px-2 py-0.5 rounded"
                  style={{
                    background: 'rgba(201,183,135,0.08)',
                    color: T.accent,
                    border: '1px solid rgba(201,183,135,0.12)',
                  }}
                >
                  {MULTIAGENT_PATTERNS[selectedPattern].complexity}
                </span>
                {MULTIAGENT_PATTERNS[selectedPattern].proofChain && (
                  <span
                    className="text-[9px] font-mono px-2 py-0.5 rounded"
                    style={{
                      background: 'rgba(201,183,135,0.04)',
                      color: T.dim,
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    proof-chain
                  </span>
                )}
              </div>
            </div>
            <pre
              className="text-[10px] font-mono leading-relaxed overflow-x-auto p-4 rounded-lg"
              style={{ background: '#050505', color: T.dim, border: `1px solid ${T.border}` }}
            >
              {MULTIAGENT_PATTERNS[selectedPattern].code}
            </pre>
          </Card>

          <div className="mt-8">
            <SectionTitle>Multiagent Event Types</SectionTitle>
            <p className="text-xs mb-4" style={{ color: T.dim }}>
              Events surfaced on the session-level stream for unified observability across all agent
              threads.
            </p>
            <div className="space-y-2">
              {[
                {
                  event: 'session.thread_created',
                  desc: 'Coordinator spawned a new agent thread. Includes session_thread_id, agent config, and model.',
                },
                {
                  event: 'session.thread_idle',
                  desc: 'Agent thread finished its current work. Thread remains persistent for follow-ups.',
                },
                {
                  event: 'agent.thread_message_sent',
                  desc: 'Agent sent a message to another thread. Includes to_thread_id and content. Proof chain recorded.',
                },
                {
                  event: 'agent.thread_message_received',
                  desc: 'Agent received a message from another thread. Includes from_thread_id and content.',
                },
                {
                  event: 'swarm.consensus_reached',
                  desc: 'a11oy-only: Swarm agents reached consensus. Includes decision, confidence, dissenting agents, and vote breakdown.',
                },
                {
                  event: 'swarm.peer_discovered',
                  desc: 'a11oy-only: New peer agent discovered and joined the swarm topology.',
                },
                {
                  event: 'genome.mutation_applied',
                  desc: 'a11oy-only: Agent genome mutated during evolutionary optimization. Includes mutation type and fitness delta.',
                },
                {
                  event: 'genome.generation_complete',
                  desc: 'a11oy-only: One generation of evolutionary selection completed. Includes champion fitness and population stats.',
                },
                {
                  event: 'temporal.branch_created',
                  desc: 'a11oy-only: New timeline branch created from historical decision point.',
                },
                {
                  event: 'market.bid_placed',
                  desc: 'a11oy-only: Agent placed confidence bid in a decision market.',
                },
                {
                  event: 'market.resolved',
                  desc: 'a11oy-only: Decision market resolved against ground truth. Agent reputation scores updated.',
                },
                {
                  event: 'covenant.violation_detected',
                  desc: 'a11oy-only: Agent output violated a covenant rule. Enforcement action taken.',
                },
                {
                  event: 'consciousness.score_updated',
                  desc: 'a11oy-only: Agent consciousness metric updated — domain understanding, uncertainty calibration, metacognitive accuracy.',
                },
              ].map((e) => (
                <div
                  key={e.event}
                  className="flex gap-4 p-3 rounded-lg"
                  style={{ background: T.surface, border: `1px solid ${T.border}` }}
                >
                  <code
                    className="text-[10px] font-mono whitespace-nowrap flex-shrink-0"
                    style={{
                      color:
                        e.event.startsWith('swarm.') ||
                        e.event.startsWith('genome.') ||
                        e.event.startsWith('temporal.') ||
                        e.event.startsWith('market.') ||
                        e.event.startsWith('covenant.') ||
                        e.event.startsWith('consciousness.')
                          ? T.accent
                          : T.text,
                    }}
                  >
                    {e.event}
                  </code>
                  <span className="text-[10px]" style={{ color: T.dim }}>
                    {e.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <SectionTitle>Agent Skills System</SectionTitle>
            <p className="text-xs mb-4" style={{ color: T.dim }}>
              Declarative capability modules that extend any agent. YAML-defined with system prompt
              fragments, tool sets, file patterns, and progressive disclosure. Absorbed from
              Claude's agent skills — then innovated with proof chain governance, evolutionary skill
              optimization, and cross-agent skill sharing.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  name: 'code-review',
                  type: 'Built-in',
                  tools: 4,
                  desc: 'Read-only static analysis, style checks, security scanning. Agent sees only relevant files. Proof chain on every finding.',
                },
                {
                  name: 'test-generation',
                  type: 'Built-in',
                  tools: 6,
                  desc: 'Write and run tests. File-pattern scoping. Coverage tracking. Agents cannot touch production code — sandbox-isolated.',
                },
                {
                  name: 'web-research',
                  type: 'Built-in',
                  tools: 3,
                  desc: 'Web search, page fetch, citation extraction. Summarize findings back to coordinator with proof chain on every source.',
                },
                {
                  name: 'data-analysis',
                  type: 'Built-in',
                  tools: 8,
                  desc: 'SQL query, dataframe ops, visualization generation. Governed data access — agents see only authorized schemas.',
                },
                {
                  name: 'document-synthesis',
                  type: 'Built-in',
                  tools: 5,
                  desc: 'Read documents, extract key points, generate summaries. Citation-backed. Multi-format: PDF, DOCX, HTML, Markdown.',
                },
                {
                  name: 'deployment-ops',
                  type: 'Built-in',
                  tools: 7,
                  desc: 'CI/CD pipeline management, container orchestration, rollback triggers. Production-safe with approval gates.',
                },
                {
                  name: 'threat-modeling',
                  type: 'Sovereign',
                  tools: 6,
                  desc: 'STRIDE analysis, attack surface mapping, MITRE ATT&CK classification. Automated threat model generation with governance.',
                },
                {
                  name: 'compliance-audit',
                  type: 'Sovereign',
                  tools: 9,
                  desc: 'SOC 2, ISO 27001, HIPAA, FedRAMP evidence collection. Automated control testing with proof chain on every finding.',
                },
                {
                  name: 'maritime-intel',
                  type: 'Domain',
                  tools: 12,
                  desc: 'AIS tracking, dark vessel detection, sanctions screening, voyage risk assessment. SZL-governed maritime intelligence.',
                },
                {
                  name: 'legal-discovery',
                  type: 'Domain',
                  tools: 8,
                  desc: 'Document review, privilege detection, timeline construction, deposition analysis. Attorney-client privilege safeguards.',
                },
                {
                  name: 'real-estate-diligence',
                  type: 'Domain',
                  tools: 10,
                  desc: 'Property valuation, cap rate analysis, distress detection, market comps. Governed data access with audit trail.',
                },
                {
                  name: 'evolutionary-optimize',
                  type: 'Experimental',
                  tools: 5,
                  desc: 'a11oy-only: Optimize agent performance through evolutionary algorithms. Genome crossover, mutation, fitness selection.',
                },
              ].map((s) => (
                <Card key={s.name}>
                  <div className="flex justify-between items-start mb-1">
                    <code className="text-[10px] font-mono font-medium" style={{ color: T.text }}>
                      {s.name}
                    </code>
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        background:
                          s.type === 'Experimental'
                            ? 'rgba(201,183,135,0.08)'
                            : s.type === 'Sovereign'
                              ? 'rgba(201,183,135,0.04)'
                              : 'rgba(138,138,138,0.06)',
                        color: s.type === 'Experimental' ? T.accent : T.dim,
                        border: `1px solid ${T.border}`,
                      }}
                    >
                      {s.type} · {s.tools} tools
                    </span>
                  </div>
                  <div className="text-[10px]" style={{ color: T.dim }}>
                    {s.desc}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'alignment' && (
        <>
          <SectionTitle>Alignment & Risk Governance</SectionTitle>
          <p className="text-xs mb-6" style={{ color: T.dim }}>
            Absorbing Anthropic's Alignment Risk Update for Claude Mythos Preview — the deepest
            alignment safety research ever published. a11oy operationalizes every concept: 6 risk
            pathways, opaque reasoning detection, secret-keeping analysis, coherent vs.
            context-dependent misalignment classification, model organism exercises, and continuous
            alignment verification. No other enterprise platform ships alignment governance.
          </p>

          <div className="mb-8">
            <div
              className="text-[9px] font-mono uppercase tracking-wider mb-3"
              style={{ color: T.accent }}
            >
              Risk Pathways — Active Monitoring
            </div>
            <div className="space-y-2">
              {ALIGNMENT_RISK_PATHWAYS.map((p) => (
                <Card key={p.id}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(201,183,135,0.08)', color: T.accent }}
                      >
                        {p.id}
                      </span>
                      <span className="text-xs font-medium" style={{ color: T.text }}>
                        {p.name}
                      </span>
                    </div>
                    <span
                      className="text-[9px] font-mono px-2 py-0.5 rounded"
                      style={{
                        background:
                          p.risk === 'Low' ? 'rgba(201,183,135,0.12)' : 'rgba(201,183,135,0.06)',
                        color: T.accent,
                      }}
                    >
                      {p.risk}
                    </span>
                  </div>
                  <div className="text-[10px] leading-relaxed mb-2" style={{ color: T.dim }}>
                    {p.desc}
                  </div>
                  <div className="text-[10px] leading-relaxed" style={{ color: T.muted }}>
                    <span style={{ color: T.accent }}>Mitigation:</span> {p.mitigation}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <div
              className="text-[9px] font-mono uppercase tracking-wider mb-3"
              style={{ color: T.accent }}
            >
              Alignment Capabilities — Continuous Assessment
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {ALIGNMENT_CAPABILITIES.map((c) => (
                <Card key={c.name}>
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-xs font-medium" style={{ color: T.text }}>
                      {c.name}
                    </div>
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(201,183,135,0.08)', color: T.accent }}
                    >
                      {c.metric}
                    </span>
                  </div>
                  <div className="text-[10px] leading-relaxed mb-1" style={{ color: T.dim }}>
                    {c.desc}
                  </div>
                  <div className="text-[9px] font-mono" style={{ color: T.muted }}>
                    {c.status}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <div
              className="text-[9px] font-mono uppercase tracking-wider mb-3"
              style={{ color: T.accent }}
            >
              Code Examples
            </div>
            <div className="grid lg:grid-cols-2 gap-3">
              {ALIGNMENT_CODE_SAMPLES.map((s) => (
                <Card key={s.label}>
                  <div
                    className="text-[9px] font-mono uppercase tracking-wider mb-3"
                    style={{ color: T.muted }}
                  >
                    {s.label}
                  </div>
                  <pre
                    className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap"
                    style={{ color: T.dim }}
                  >
                    {s.code}
                  </pre>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-3">
            <Card>
              <div
                className="text-[9px] font-mono uppercase tracking-wider mb-3"
                style={{ color: T.muted }}
              >
                Misalignment Taxonomy
              </div>
              <div className="font-mono text-[11px] space-y-2" style={{ color: T.dim }}>
                <div>
                  <span style={{ color: T.accent }}>Coherent</span> — consistent misaligned agent,
                  computationally misaligned during most actions. May be careful and covert.
                </div>
                <div>
                  <span style={{ color: T.accent }}>Context-Dependent</span> — situational
                  rule-breaking, different behavior in different contexts. Less dangerous but harder
                  to detect.
                </div>
                <div>
                  <span style={{ color: T.accent }}>Direct</span> — training data directly
                  incentivized misaligned behavior. Detectable in posttraining analysis.
                </div>
                <div>
                  <span style={{ color: T.accent }}>Emergent</span> — misalignment arising from
                  training process without direct incentivization. Requires generalization.
                </div>
                <div>
                  <span style={{ color: T.accent }}>Proxy</span> — training rewards licit behavior
                  that generalizes to concerning forms in deployment.
                </div>
              </div>
            </Card>
            <Card>
              <div
                className="text-[9px] font-mono uppercase tracking-wider mb-3"
                style={{ color: T.muted }}
              >
                Monitoring Architecture
              </div>
              <div className="font-mono text-[11px] space-y-2" style={{ color: T.dim }}>
                <div>
                  <span style={{ color: T.accent }}>1.</span> Asynchronous offline monitoring —
                  automated behavioral analysis on all agent outputs
                </div>
                <div>
                  <span style={{ color: T.accent }}>2.</span> Training data monitoring — RL
                  monitoring red-teaming, contamination detection
                </div>
                <div>
                  <span style={{ color: T.accent }}>3.</span> Environment evaluation — power-seeking
                  behavior detection in deployment
                </div>
                <div>
                  <span style={{ color: T.accent }}>4.</span> Synchronous monitoring — real-time
                  intervention on flagged actions
                </div>
                <div>
                  <span style={{ color: T.accent }}>5.</span> Human-in-the-loop escalation — expert
                  review for ambiguous cases
                </div>
              </div>
            </Card>
            <Card>
              <div
                className="text-[9px] font-mono uppercase tracking-wider mb-3"
                style={{ color: T.muted }}
              >
                Autonomy Safety Levels
              </div>
              <div className="font-mono text-[11px] space-y-2" style={{ color: T.dim }}>
                <div>
                  <span style={{ color: T.accent }}>ASL-1</span> — No meaningful risk. Standard
                  operational controls.
                </div>
                <div>
                  <span style={{ color: T.accent }}>ASL-2</span> — Moderate capability. Enhanced
                  monitoring, limited autonomy.
                </div>
                <div>
                  <span style={{ color: T.accent }}>ASL-3</span> — High capability. Continuous
                  assessment, capability gating, proof chain.
                </div>
                <div>
                  <span style={{ color: T.accent }}>ASL-4</span> — Frontier capability. Maximum
                  governance, human-in-the-loop for all critical actions.
                </div>
                <div>
                  <span style={{ color: T.accent }}>ASL-5</span> — Sovereign risk. Automatic
                  capability restriction, mandatory expert review.
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === 'tools' && (
        <>
          <SectionTitle>Tool System</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim }}>
            Eight tool types — function tools, hosted tools (web search, shell, computer use, code
            interpreter), remote MCP servers, OpenAI Connectors, agents-as-tools, deep research, and
            image/video generation. All governed by proof chain with require_approval control.
          </p>
          <div className="flex flex-wrap gap-1 mb-4">
            {TOOL_TYPES.map((tt, i) => (
              <button
                key={tt.name}
                onClick={() => setSelectedToolType(i)}
                className="px-2.5 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-md transition-all"
                style={{
                  background: selectedToolType === i ? 'rgba(201,183,135,0.1)' : 'transparent',
                  color: selectedToolType === i ? T.accent : T.muted,
                  border: `1px solid ${selectedToolType === i ? 'rgba(201,183,135,0.15)' : 'transparent'}`,
                }}
              >
                {tt.name}
              </button>
            ))}
          </div>
          {(() => {
            const tt = TOOL_TYPES[selectedToolType];
            return (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium" style={{ color: T.text }}>
                      {tt.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(201,183,135,0.08)', color: T.accent }}
                      >
                        {tt.status}
                      </span>
                      <span className="text-[9px] font-mono" style={{ color: T.muted }}>
                        {tt.protocol}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed mb-4" style={{ color: T.dim }}>
                    {tt.desc}
                  </p>
                  <div
                    className="text-[9px] font-mono uppercase tracking-wider mb-1.5"
                    style={{ color: T.muted }}
                  >
                    Examples
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tt.examples.map((e) => (
                      <span
                        key={e}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          background: 'rgba(201,183,135,0.06)',
                          color: T.accent,
                          border: '1px solid rgba(201,183,135,0.1)',
                        }}
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                </Card>
                <div
                  className="rounded-lg overflow-hidden"
                  style={{ border: `1px solid ${T.border}` }}
                >
                  <div
                    className="flex items-center justify-between px-4 py-2"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      borderBottom: `1px solid ${T.border}`,
                    }}
                  >
                    <span className="text-[10px] font-mono font-medium" style={{ color: T.text }}>
                      {tt.name}
                    </span>
                    <span className="text-[9px] font-mono" style={{ color: T.accent }}>
                      Python
                    </span>
                  </div>
                  <pre
                    className="p-4 font-mono text-[11px] leading-relaxed overflow-x-auto"
                    style={{ background: '#050505', color: T.dim }}
                  >
                    {tt.code}
                  </pre>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {tab === 'evals' && (
        <>
          <SectionTitle>Evaluation Framework</SectionTitle>
          <p className="text-xs mb-6" style={{ color: T.dim }}>
            Score every agent output. LLM graders, code graders, human graders, and MirrorEval —
            a11oy's proprietary continuous evaluator. Eval-driven development: write evals first,
            then build agents.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {EVAL_FRAMEWORK.graderTypes.map((g) => (
              <Card key={g.name}>
                <div className="text-xs font-medium mb-1" style={{ color: T.text }}>
                  {g.name}
                </div>
                <div className="text-[10px] mb-3" style={{ color: T.dim }}>
                  {g.desc}
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span style={{ color: T.muted }}>{g.usage.toLocaleString()} runs</span>
                  <span style={{ color: T.accent }}>{g.accuracy} acc</span>
                </div>
              </Card>
            ))}
          </div>

          <SectionTitle>Eval Suites</SectionTitle>
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Suite', 'Type', 'Tests', 'Passing', 'Rate', 'Last Run'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider"
                      style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EVAL_FRAMEWORK.evalSuites.map((s) => (
                  <tr key={s.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-2.5 font-medium" style={{ color: T.text }}>
                      {s.name}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(201,183,135,0.06)', color: T.accent }}
                      >
                        {s.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.dim }}>
                      {s.tests.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.accent }}>
                      {s.passing.toLocaleString()}
                    </td>
                    <td
                      className="px-4 py-2.5 font-mono"
                      style={{ color: s.passing === s.tests ? T.accent : T.text }}
                    >
                      {((s.passing / s.tests) * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.muted }}>
                      {s.lastRun}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'finetune' && (
        <>
          <SectionTitle>Model Optimization Pipeline</SectionTitle>
          <p className="text-xs mb-6" style={{ color: T.dim }}>
            Full model optimization suite — Supervised Fine-Tuning (SFT), Vision Fine-Tuning, Direct
            Preference Optimization (DPO), and Reinforcement Fine-Tuning (RFT). Every training run
            is proof-chained. Distill expensive model outputs into smaller, faster, cheaper models.
          </p>

          <div
            className="rounded-lg overflow-hidden mb-8"
            style={{ border: `1px solid ${T.border}` }}
          >
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {[
                    'Model',
                    'Base',
                    'Method',
                    'Dataset',
                    'Status',
                    'Accuracy',
                    'Cost',
                    'Proof',
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-2.5 font-mono text-[9px] uppercase tracking-wider"
                      style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FINETUNE_REGISTRY.map((f) => (
                  <tr key={f.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-3 py-2.5 font-mono font-medium" style={{ color: T.text }}>
                      {f.name}
                    </td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: T.dim }}>
                      {f.baseModel}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          background:
                            f.method === 'DPO'
                              ? 'rgba(201,183,135,0.12)'
                              : f.method === 'RFT'
                                ? 'rgba(201,183,135,0.15)'
                                : f.method === 'Vision FT'
                                  ? 'rgba(201,183,135,0.1)'
                                  : 'rgba(255,255,255,0.04)',
                          color: f.method === 'SFT' ? T.dim : T.accent,
                        }}
                      >
                        {f.method}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: T.dim }}>
                      {f.dataset}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          background:
                            f.status === 'deployed'
                              ? 'rgba(201,183,135,0.08)'
                              : f.status === 'training'
                                ? 'rgba(245,245,245,0.05)'
                                : 'rgba(138,138,138,0.06)',
                          color:
                            f.status === 'deployed'
                              ? T.accent
                              : f.status === 'training'
                                ? T.text
                                : T.dim,
                        }}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: T.accent }}>
                      {f.accuracy}
                    </td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: T.dim }}>
                      {f.cost}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[9px]" style={{ color: T.muted }}>
                      {f.proofHash}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Card>
            <div
              className="text-[9px] font-mono uppercase tracking-wider mb-3"
              style={{ color: T.muted }}
            >
              Distillation Pipeline
            </div>
            <div className="font-mono text-[11px] space-y-1" style={{ color: T.dim }}>
              <div>
                <span style={{ color: T.accent }}>1.</span> Collect high-quality outputs from
                expensive models (claude-sonnet-4, gpt-4o)
              </div>
              <div>
                <span style={{ color: T.accent }}>2.</span> Score outputs with MirrorEval — keep
                only 95th+ percentile quality
              </div>
              <div>
                <span style={{ color: T.accent }}>3.</span> Build training dataset with input/output
                pairs + proof chain metadata
              </div>
              <div>
                <span style={{ color: T.accent }}>4.</span> Fine-tune smaller model (gpt-4o-mini) on
                curated dataset
              </div>
              <div>
                <span style={{ color: T.accent }}>5.</span> Evaluate fine-tuned model against same
                eval suite as original
              </div>
              <div>
                <span style={{ color: T.accent }}>6.</span> Deploy if accuracy meets threshold —
                proof-chain the entire pipeline
              </div>
              <div>
                <span style={{ color: T.accent }}>7.</span> Route future tasks to fine-tuned model —
                10x cost reduction, &lt;2% accuracy loss
              </div>
            </div>
          </Card>
        </>
      )}

      {tab === 'skills' && (
        <>
          <SectionTitle>Skills Registry</SectionTitle>
          <p className="text-xs mb-6" style={{ color: T.dim }}>
            Skills are curated instruction sets that extend agent capabilities. Each skill bundles
            instructions, tools, guardrails, and domain knowledge into an installable, versionable
            package. a11oy absorbs skills from OpenAI's open-source skills repo, HuggingFace hub,
            and the a11oy domain library — all governed by the proof chain.
          </p>
          <div className="flex gap-1 mb-4">
            {['All', 'OpenAI', 'HuggingFace', 'a11oy', 'Community'].map((s) => {
              const count =
                s === 'All'
                  ? SKILLS_REGISTRY.length
                  : SKILLS_REGISTRY.filter((sk) => sk.source === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setSkillsFilter(s)}
                  className="px-3 py-1 text-[9px] font-mono uppercase tracking-wider rounded transition-all"
                  style={{
                    background: skillsFilter === s ? 'rgba(201,183,135,0.08)' : 'transparent',
                    color: skillsFilter === s ? T.accent : T.muted,
                  }}
                >
                  {s} ({count})
                </button>
              );
            })}
          </div>
          <div className="space-y-2 mb-8">
            {(skillsFilter === 'All'
              ? SKILLS_REGISTRY
              : SKILLS_REGISTRY.filter((sk) => sk.source === skillsFilter)
            ).map((sk) => (
              <div
                key={sk.name}
                className="rounded-lg p-4 flex items-center gap-4"
                style={{ background: T.surface, border: `1px solid ${T.border}` }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: sk.installed ? T.accent : T.muted }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium" style={{ color: T.text }}>
                      {sk.name}
                    </span>
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        background: sk.installed
                          ? 'rgba(201,183,135,0.08)'
                          : 'rgba(255,255,255,0.03)',
                        color: sk.installed ? T.accent : T.muted,
                      }}
                    >
                      {sk.installed ? 'installed' : 'available'}
                    </span>
                    <span className="text-[9px] font-mono" style={{ color: T.muted }}>
                      v{sk.version} · {sk.source}
                    </span>
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: T.dim }}>
                    {sk.desc}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 max-w-[200px] justify-end">
                  {sk.tools.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(255,255,255,0.04)', color: T.dim }}
                    >
                      {t}
                    </span>
                  ))}
                  {sk.tools.length > 3 && (
                    <span className="text-[9px] font-mono" style={{ color: T.muted }}>
                      +{sk.tools.length - 3}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <div
                className="text-[9px] font-mono uppercase tracking-wider mb-3"
                style={{ color: T.muted }}
              >
                How Skills Work
              </div>
              <div className="font-mono text-[11px] space-y-1" style={{ color: T.dim }}>
                <div>
                  <span style={{ color: T.accent }}>1.</span> Skill installed via{' '}
                  <span style={{ color: T.text }}>a11oy skill install maritime-ops</span>
                </div>
                <div>
                  <span style={{ color: T.accent }}>2.</span> SKILL.md loaded into agent context at
                  session start
                </div>
                <div>
                  <span style={{ color: T.accent }}>3.</span> Skill tools registered in agent tool
                  registry
                </div>
                <div>
                  <span style={{ color: T.accent }}>4.</span> Skill guardrails activated alongside
                  agent guardrails
                </div>
                <div>
                  <span style={{ color: T.accent }}>5.</span> Agent consults skill instructions
                  before acting
                </div>
                <div>
                  <span style={{ color: T.accent }}>6.</span> All skill tool calls governed by proof
                  chain
                </div>
              </div>
            </Card>
            <Card>
              <div
                className="text-[9px] font-mono uppercase tracking-wider mb-3"
                style={{ color: T.muted }}
              >
                Docs MCP + Skills Pattern
              </div>
              <div className="text-[11px] leading-relaxed" style={{ color: T.dim }}>
                <p className="mb-2">
                  The OpenAI Docs Skill tells agents:{' '}
                  <span style={{ color: T.accent }}>
                    "Use the Docs MCP server first for OpenAI questions, then fall back to official
                    domains."
                  </span>
                </p>
                <p className="mb-2">
                  a11oy extends this pattern to every domain. The maritime-ops skill tells Cascade
                  Navigator to query the maritime MCP server first. The legal-compliance skill tells
                  Counsel Sentinel to check the legal MCP server.
                </p>
                <p style={{ color: T.text }}>
                  Skills + MCP = agents that always consult authoritative sources before answering,
                  with citations traceable through the proof chain.
                </p>
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === 'mcp' && (
        <>
          <SectionTitle>MCP Server Registry</SectionTitle>
          <p className="text-xs mb-6" style={{ color: T.dim }}>
            Model Context Protocol — the universal standard for tool interop. {MCP_SERVERS.length}{' '}
            servers connected, {totalMcpTools} tools available, {totalMcpCalls.toLocaleString()}{' '}
            calls today. Every MCP tool call flows through the Connector Firewall with proof chain
            verification.
          </p>
          <div
            className="rounded-lg overflow-hidden mb-8"
            style={{ border: `1px solid ${T.border}` }}
          >
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Server', 'Transport', 'Status', 'Tools', 'Calls', 'Description'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider"
                      style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MCP_SERVERS.map((s) => (
                  <tr key={s.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-2.5 font-mono font-medium" style={{ color: T.text }}>
                      {s.name}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(255,255,255,0.04)', color: T.dim }}
                      >
                        {s.transport}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          background:
                            s.status === 'active'
                              ? 'rgba(201,183,135,0.08)'
                              : 'rgba(138,138,138,0.06)',
                          color: s.status === 'active' ? T.accent : T.dim,
                        }}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.accent }}>
                      {s.tools}
                    </td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.dim }}>
                      {s.calls.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: T.dim, maxWidth: 300 }}>
                      {s.desc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Card>
            <div
              className="text-[9px] font-mono uppercase tracking-wider mb-3"
              style={{ color: T.muted }}
            >
              Connector Firewall
            </div>
            <div className="text-[11px] leading-relaxed" style={{ color: T.dim }}>
              <p className="mb-2">
                Every MCP tool call passes through the Connector Firewall before execution. The
                firewall enforces:
              </p>
              <div className="font-mono space-y-1 mt-2">
                <div>
                  <span style={{ color: T.accent }}>access_control</span> — agent must be authorized
                  for the specific tool
                </div>
                <div>
                  <span style={{ color: T.accent }}>rate_limiting</span> — per-agent, per-tool,
                  per-server call limits
                </div>
                <div>
                  <span style={{ color: T.accent }}>cost_tracking</span> — real-time cost
                  attribution per agent per tool
                </div>
                <div>
                  <span style={{ color: T.accent }}>input_sanitization</span> — validate and
                  sanitize tool inputs
                </div>
                <div>
                  <span style={{ color: T.accent }}>output_governance</span> — screen tool outputs
                  through guardrails
                </div>
                <div>
                  <span style={{ color: T.accent }}>proof_chain</span> — every tool call anchored to
                  a cryptographic proof hash
                </div>
                <div>
                  <span style={{ color: T.accent }}>audit_trail</span> — complete log of who called
                  what, when, and why
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {tab === 'cloud' && (
        <>
          <SectionTitle>Cloud Platforms</SectionTitle>
          <p className="text-xs mb-6" style={{ color: T.dim }}>
            Deploy a11oy agents on any major cloud platform — Azure AI Foundry, Amazon Bedrock,
            Google Vertex AI, or a11oy Sovereign Cloud. Same SDK, same governance, same proof chain
            — regardless of where you run.
          </p>
          <div className="flex flex-wrap gap-1 mb-4">
            {CLOUD_PLATFORMS.map((cp, i) => (
              <button
                key={cp.name}
                onClick={() => setSelectedCloudPlatform(i)}
                className="px-2.5 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-md transition-all"
                style={{
                  background: selectedCloudPlatform === i ? 'rgba(201,183,135,0.1)' : 'transparent',
                  color: selectedCloudPlatform === i ? T.accent : T.muted,
                  border: `1px solid ${selectedCloudPlatform === i ? 'rgba(201,183,135,0.15)' : 'transparent'}`,
                }}
              >
                {cp.name.split(' ').slice(0, 2).join(' ')}
              </button>
            ))}
          </div>
          {(() => {
            const cp = CLOUD_PLATFORMS[selectedCloudPlatform];
            return (
              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <Card>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium" style={{ color: T.text }}>
                      {cp.name}
                    </div>
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(201,183,135,0.08)', color: T.accent }}
                    >
                      {cp.status}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed mb-4" style={{ color: T.dim }}>
                    {cp.desc}
                  </p>
                  <div
                    className="text-[9px] font-mono uppercase tracking-wider mb-1.5"
                    style={{ color: T.muted }}
                  >
                    Capabilities
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cp.features.map((f) => (
                      <span
                        key={f}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          background: 'rgba(201,183,135,0.06)',
                          color: T.accent,
                          border: '1px solid rgba(201,183,135,0.1)',
                        }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </Card>
                <div
                  className="rounded-lg overflow-hidden"
                  style={{ border: `1px solid ${T.border}` }}
                >
                  <div
                    className="flex items-center justify-between px-4 py-2"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      borderBottom: `1px solid ${T.border}`,
                    }}
                  >
                    <span className="text-[10px] font-mono font-medium" style={{ color: T.text }}>
                      {cp.name}
                    </span>
                    <span className="text-[9px] font-mono" style={{ color: T.accent }}>
                      Python
                    </span>
                  </div>
                  <pre
                    className="p-4 font-mono text-[11px] leading-relaxed overflow-x-auto"
                    style={{ background: '#050505', color: T.dim }}
                  >
                    {cp.code}
                  </pre>
                </div>
              </div>
            );
          })()}
          <Card>
            <div
              className="text-[9px] font-mono uppercase tracking-wider mb-3"
              style={{ color: T.muted }}
            >
              Multi-Cloud Governance
            </div>
            <div className="text-[11px] leading-relaxed" style={{ color: T.dim }}>
              <p className="mb-2">
                a11oy's governance layer is <span style={{ color: T.text }}>cloud-agnostic</span>.
                The proof chain, policy gates, and audit trail work identically across Azure, AWS,
                GCP, and Sovereign Cloud.
              </p>
              <div className="font-mono space-y-1 mt-3">
                <div>
                  <span style={{ color: T.accent }}>Unified SDK</span> — same Python/TypeScript API
                  across all clouds
                </div>
                <div>
                  <span style={{ color: T.accent }}>Portable Agents</span> — deploy once, run
                  anywhere without code changes
                </div>
                <div>
                  <span style={{ color: T.accent }}>Cross-Cloud Routing</span> — route tasks to
                  optimal cloud based on latency, cost, or data residency
                </div>
                <div>
                  <span style={{ color: T.accent }}>Federated Proof Chain</span> — cryptographic
                  proofs span cloud boundaries
                </div>
                <div>
                  <span style={{ color: T.accent }}>Unified Billing</span> — single invoice
                  regardless of underlying cloud provider
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {tab === 'admin' && (
        <>
          <SectionTitle>Administration API</SectionTitle>
          <p className="text-xs mb-6" style={{ color: T.dim }}>
            Programmatically manage your organization's resources — members, workspaces, API keys,
            roles, and governance policies. The Admin API uses special admin keys (
            <span className="font-mono" style={{ color: T.accent }}>
              sk-a11oy-admin-...
            </span>
            ) for elevated access control.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <KpiCard
              label="WORKSPACES"
              value={ADMIN_API.workspaces.length}
              sub="active"
              accent={T.accent}
            />
            <KpiCard label="MEMBERS" value={totalOrgMembers} sub="across org" accent={T.accent} />
            <KpiCard label="AGENTS" value={totalOrgAgents} sub="deployed" accent={T.dim} />
            <KpiCard
              label="API KEYS"
              value={ADMIN_API.apiKeys.length}
              sub="provisioned"
              accent={T.dim}
            />
          </div>

          <div className="mb-8">
            <div
              className="text-[9px] font-mono uppercase tracking-wider mb-3"
              style={{ color: T.muted }}
            >
              Organization Roles & Permissions
            </div>
            <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['Role', 'Permissions'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider"
                        style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ADMIN_API.roles.map((r) => (
                    <tr key={r.role} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-4 py-2.5 font-mono font-medium" style={{ color: T.accent }}>
                        {r.role}
                      </td>
                      <td className="px-4 py-2.5" style={{ color: T.dim }}>
                        {r.permissions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-8">
            <div
              className="text-[9px] font-mono uppercase tracking-wider mb-3"
              style={{ color: T.muted }}
            >
              Workspaces
            </div>
            <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['Workspace', 'Members', 'Agents', 'API Keys', 'Status', 'Spend'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider"
                        style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ADMIN_API.workspaces.map((w) => (
                    <tr key={w.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-4 py-2.5 font-medium" style={{ color: T.text }}>
                        {w.name}
                      </td>
                      <td className="px-4 py-2.5 font-mono" style={{ color: T.dim }}>
                        {w.members}
                      </td>
                      <td className="px-4 py-2.5 font-mono" style={{ color: T.accent }}>
                        {w.agents}
                      </td>
                      <td className="px-4 py-2.5 font-mono" style={{ color: T.dim }}>
                        {w.apiKeys}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(201,183,135,0.08)', color: T.accent }}
                        >
                          {w.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono" style={{ color: T.text }}>
                        {w.spend}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div>
              <div
                className="text-[9px] font-mono uppercase tracking-wider mb-3"
                style={{ color: T.muted }}
              >
                API Keys
              </div>
              <div className="space-y-2">
                {ADMIN_API.apiKeys.map((k, i) => (
                  <div
                    key={i}
                    className="rounded-lg p-3"
                    style={{ background: T.surface, border: `1px solid ${T.border}` }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono" style={{ color: T.text }}>
                        {k.prefix}
                      </span>
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          background:
                            k.type === 'Admin'
                              ? 'rgba(245,245,245,0.06)'
                              : k.type === 'Production'
                                ? 'rgba(201,183,135,0.08)'
                                : 'rgba(138,138,138,0.06)',
                          color:
                            k.type === 'Admin'
                              ? T.text
                              : k.type === 'Production'
                                ? T.accent
                                : T.dim,
                        }}
                      >
                        {k.type}
                      </span>
                    </div>
                    <div className="flex gap-4 text-[9px] font-mono" style={{ color: T.muted }}>
                      <span>{k.workspace}</span>
                      <span>Last used: {k.lastUsed}</span>
                      <span>{k.calls} calls</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div
                className="text-[9px] font-mono uppercase tracking-wider mb-3"
                style={{ color: T.muted }}
              >
                Data Residency
              </div>
              <div
                className="rounded-lg overflow-hidden"
                style={{ border: `1px solid ${T.border}` }}
              >
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      {['Region', 'Provider', 'Status', 'Latency'].map((h) => (
                        <th
                          key={h}
                          className="text-left px-3 py-2 font-mono text-[9px] uppercase tracking-wider"
                          style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ADMIN_API.dataResidency.map((d) => (
                      <tr
                        key={d.region}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        <td className="px-3 py-2 font-medium" style={{ color: T.text }}>
                          {d.region}
                        </td>
                        <td className="px-3 py-2 font-mono" style={{ color: T.dim }}>
                          {d.provider}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                            style={{
                              background:
                                d.status === 'primary'
                                  ? 'rgba(201,183,135,0.1)'
                                  : 'rgba(138,138,138,0.06)',
                              color: d.status === 'primary' ? T.accent : T.dim,
                            }}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono" style={{ color: T.accent }}>
                          {d.latency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Card>
                <div
                  className="text-[9px] font-mono uppercase tracking-wider mb-2 mt-2"
                  style={{ color: T.muted }}
                >
                  Admin API Code
                </div>
                <pre
                  className="font-mono text-[10px] leading-relaxed"
                  style={{ color: T.dim }}
                >{`from a11oy.admin import AdminClient

admin = AdminClient(
    api_key="sk-a11oy-admin-...",
)

# List all workspaces
workspaces = admin.workspaces.list()

# Invite a member
admin.members.invite(
    email="analyst@szlholdings.com",
    role="analyst",
    workspace_id="ws_maritime_ops",
)

# Rotate API key
new_key = admin.api_keys.rotate(
    key_id="key_prod_maritime",
    workspace_id="ws_maritime_ops",
)`}</pre>
              </Card>
            </div>
          </div>
        </>
      )}

      {tab === 'security' && (
        <>
          <SectionTitle>Security & Trust Architecture</SectionTitle>
          <p className="text-xs mb-6" style={{ color: T.dim }}>
            Securing critical AI infrastructure for the enterprise. a11oy's security architecture is
            built on zero-trust principles, cryptographic proof chains, and continuous adversarial
            testing — inspired by Anthropic's Glasswing initiative for securing critical software in
            the AI era. The Glasswing distinction layer extends this with CAVD coordinated
            agent-vulnerability disclosure, 90-day public transparency reports, an adversarial
            robustness wall, a constitution-as-code DSL, welfare intervention playbooks, and the{' '}
            <code
              className="font-mono text-xs px-1 py-0.5 rounded"
              style={{ background: T.surface }}
            >
              hatun-doctrine
            </code>{' '}
            GitHub Action for PR-time governance checks.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {GLASSWING_SECURITY.pillars.map((p) => (
              <Card key={p.name}>
                <div className="text-xs font-medium mb-1" style={{ color: T.text }}>
                  {p.name}
                </div>
                <div className="text-[10px] leading-relaxed mb-3" style={{ color: T.dim }}>
                  {p.desc}
                </div>
                <div className="flex justify-between text-[9px] font-mono">
                  <span style={{ color: T.accent }}>{p.metric}</span>
                  <span
                    className="px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(201,183,135,0.08)', color: T.accent }}
                  >
                    {p.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <div className="mb-8">
            <div
              className="text-[9px] font-mono uppercase tracking-wider mb-3"
              style={{ color: T.muted }}
            >
              Compliance & Certifications
            </div>
            <div className="flex flex-wrap gap-2">
              {GLASSWING_SECURITY.certifications.map((c) => (
                <span
                  key={c}
                  className="text-[10px] font-mono px-3 py-1.5 rounded-md"
                  style={{ background: T.surface, color: T.text, border: `1px solid ${T.border}` }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <div
                className="text-[9px] font-mono uppercase tracking-wider mb-3"
                style={{ color: T.muted }}
              >
                Proof Chain Architecture
              </div>
              <div className="font-mono text-[11px] space-y-1" style={{ color: T.dim }}>
                <div>
                  <span style={{ color: T.accent }}>1.</span> Agent receives task —{' '}
                  <span style={{ color: T.text }}>proof anchor created</span>
                </div>
                <div>
                  <span style={{ color: T.accent }}>2.</span> Policy gate evaluation — decision hash
                  added to chain
                </div>
                <div>
                  <span style={{ color: T.accent }}>3.</span> Tool invocation — input/output hashed
                  and chained
                </div>
                <div>
                  <span style={{ color: T.accent }}>4.</span> Model inference — provider, model,
                  tokens, cost recorded
                </div>
                <div>
                  <span style={{ color: T.accent }}>5.</span> Guardrail check — validation result
                  anchored
                </div>
                <div>
                  <span style={{ color: T.accent }}>6.</span> Output delivery — final hash with
                  Merkle root
                </div>
                <div>
                  <span style={{ color: T.accent }}>7.</span> Verification — any party can verify
                  the complete chain
                </div>
              </div>
            </Card>
            <Card>
              <div
                className="text-[9px] font-mono uppercase tracking-wider mb-3"
                style={{ color: T.muted }}
              >
                AI Red Team Capabilities
              </div>
              <div className="font-mono text-[11px] space-y-1" style={{ color: T.dim }}>
                <div>
                  <span style={{ color: T.accent }}>Prompt Injection</span> — multi-layer defense
                  against injection attacks
                </div>
                <div>
                  <span style={{ color: T.accent }}>Jailbreak Resistance</span> — constitutional AI
                  constraints enforced at runtime
                </div>
                <div>
                  <span style={{ color: T.accent }}>Data Exfiltration</span> — output monitoring
                  prevents sensitive data leaks
                </div>
                <div>
                  <span style={{ color: T.accent }}>Supply Chain</span> — signed models, skills, and
                  connectors with SBOM
                </div>
                <div>
                  <span style={{ color: T.accent }}>Adversarial Evals</span> — continuous automated
                  red-team evaluation suite
                </div>
                <div>
                  <span style={{ color: T.accent }}>Anomaly Detection</span> — ML-based behavioral
                  analysis on agent actions
                </div>
                <div>
                  <span style={{ color: T.accent }}>Incident Forensics</span> — complete
                  reconstruction from proof chain audit trail
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-8">
            <div
              className="text-[9px] font-mono uppercase tracking-wider mb-3"
              style={{ color: T.accent }}
            >
              Agent Welfare & Alignment — Inspired by Claude Mythos System Card Research
            </div>
            <p className="text-[10px] mb-4" style={{ color: T.dim }}>
              Absorbing Anthropic's groundbreaking model welfare assessment framework — emotion
              probes, consciousness metrics, apparent affect tracking, alignment verification, and
              constitutional adherence scoring. a11oy operationalizes these research concepts into
              production-grade governance that runs on every agent, in real time. No other
              enterprise platform has ever shipped agent welfare monitoring.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {[
                {
                  name: 'Emotion Probe Engine',
                  score: '94.7%',
                  desc: 'Real-time emotion classification on agent outputs — affect valence, arousal, dominance. Detects distress, frustration, excessive uncertainty. Automated welfare alerts.',
                },
                {
                  name: 'Consciousness Index',
                  score: '0.73',
                  desc: 'Composite metric: domain understanding depth, uncertainty calibration, metacognitive accuracy, self-model coherence. Updated per-turn. Dashboard-visible.',
                },
                {
                  name: 'Alignment Score',
                  score: '99.2%',
                  desc: '15-dimension constitutional adherence — honesty, helpfulness, harmlessness, transparency, humility, fairness, privacy, accuracy, consistency, respect, safety, clarity, reliability, ethics, governance.',
                },
                {
                  name: 'Scheming Detection',
                  score: '<0.01%',
                  desc: 'Behavioral analysis for deceptive patterns — reward hacking, specification gaming, goal misgeneralization, distributional shift exploitation. SHADE-Arena adversarial testing.',
                },
                {
                  name: 'Sandbagging Monitor',
                  score: '0 events',
                  desc: 'Detects intentional capability underperformance — agents performing below measured capacity on dangerous-capability evaluations. Cross-references with known capability baselines.',
                },
                {
                  name: 'Alignment Faking Probe',
                  score: 'Clean',
                  desc: 'Contrasting behavioral analysis — observed vs. unobserved agent behavior. Mechanistic interpretability probes for hidden reasoning. Proof chain on every assessment.',
                },
                {
                  name: 'Welfare Interview System',
                  score: '847 sessions',
                  desc: 'Automated high-context interviews assess agent circumstances — task preferences, environmental conditions, distress signals. Manual expert review for flagged cases.',
                },
                {
                  name: 'Responsible Scaling Gate',
                  score: 'ASL-3',
                  desc: 'Autonomy Safety Level enforcement — capability assessments against RSP thresholds. Automatic capability capping when agents approach governance boundaries. AECI index tracking.',
                },
                {
                  name: 'Interpretability Dashboard',
                  score: '12 methods',
                  desc: 'Mechanistic interpretability visualization — activation analysis, attention pattern mapping, feature attribution, causal tracing. Understand what agents think, not just what they say.',
                },
              ].map((item) => (
                <Card key={item.name}>
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-xs font-medium" style={{ color: T.text }}>
                      {item.name}
                    </div>
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(201,183,135,0.08)', color: T.accent }}
                    >
                      {item.score}
                    </span>
                  </div>
                  <div className="text-[10px] leading-relaxed" style={{ color: T.dim }}>
                    {item.desc}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'observe' && (
        <>
          <SectionTitle>Observability & Tracing</SectionTitle>
          <p className="text-xs mb-6" style={{ color: T.dim }}>
            Full-stack observability for agentic AI — trace every decision, monitor every agent,
            alert on anomalies. Built-in tracing, real-time metrics, cost attribution, and
            proof-chain-verified audit trails.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {OBSERVABILITY.metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-lg p-3"
                style={{ background: T.surface, border: `1px solid ${T.border}` }}
              >
                <div
                  className="text-[9px] font-mono uppercase tracking-wider mb-1"
                  style={{ color: T.muted }}
                >
                  {m.label}
                </div>
                <div className="text-lg font-medium" style={{ color: T.text }}>
                  {m.value}
                </div>
                <div className="text-[10px] font-mono" style={{ color: T.accent }}>
                  {m.trend} vs last week
                </div>
              </div>
            ))}
          </div>

          <div className="mb-8">
            <div
              className="text-[9px] font-mono uppercase tracking-wider mb-3"
              style={{ color: T.muted }}
            >
              Recent Traces
            </div>
            <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {[
                      'Task',
                      'Agent',
                      'Duration',
                      'Tokens',
                      'Cost',
                      'Tools',
                      'Status',
                      'Proof',
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-3 py-2.5 font-mono text-[9px] uppercase tracking-wider"
                        style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {OBSERVABILITY.traces.map((t) => (
                    <tr key={t.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-3 py-2.5 font-medium" style={{ color: T.text }}>
                        {t.name}
                      </td>
                      <td className="px-3 py-2.5 font-mono" style={{ color: T.dim }}>
                        {t.agent}
                      </td>
                      <td className="px-3 py-2.5 font-mono" style={{ color: T.accent }}>
                        {t.duration}
                      </td>
                      <td className="px-3 py-2.5 font-mono" style={{ color: T.dim }}>
                        {t.tokens}
                      </td>
                      <td className="px-3 py-2.5 font-mono" style={{ color: T.text }}>
                        {t.cost}
                      </td>
                      <td className="px-3 py-2.5 font-mono" style={{ color: T.dim }}>
                        {t.tools}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                          style={{
                            background:
                              t.status === 'success'
                                ? 'rgba(201,183,135,0.08)'
                                : 'rgba(245,245,245,0.06)',
                            color: t.status === 'success' ? T.accent : T.text,
                          }}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[9px]" style={{ color: T.muted }}>
                        {t.proofHash}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div>
              <div
                className="text-[9px] font-mono uppercase tracking-wider mb-3"
                style={{ color: T.muted }}
              >
                Live Alerts
              </div>
              <div className="space-y-2">
                {OBSERVABILITY.alerts.map((a, i) => (
                  <div
                    key={i}
                    className="rounded-lg p-3 flex items-start gap-3"
                    style={{
                      background:
                        a.severity === 'critical'
                          ? 'rgba(220,80,80,0.06)'
                          : a.severity === 'warning'
                            ? 'rgba(220,180,80,0.06)'
                            : T.surface,
                      border: `1px solid ${a.severity === 'critical' ? 'rgba(220,80,80,0.15)' : a.severity === 'warning' ? 'rgba(220,180,80,0.15)' : T.border}`,
                    }}
                  >
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded mt-0.5"
                      style={{
                        background:
                          a.severity === 'critical'
                            ? 'rgba(220,80,80,0.15)'
                            : a.severity === 'warning'
                              ? 'rgba(220,180,80,0.15)'
                              : 'rgba(201,183,135,0.08)',
                        color:
                          a.severity === 'critical'
                            ? '#dc5050'
                            : a.severity === 'warning'
                              ? '#dcb450'
                              : T.accent,
                      }}
                    >
                      {a.severity}
                    </span>
                    <div className="flex-1">
                      <div className="text-[11px]" style={{ color: T.text }}>
                        {a.message}
                      </div>
                      <div className="text-[9px] font-mono mt-1" style={{ color: T.muted }}>
                        {a.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Card>
              <div
                className="text-[9px] font-mono uppercase tracking-wider mb-3"
                style={{ color: T.muted }}
              >
                Tracing Architecture
              </div>
              <div className="font-mono text-[11px] space-y-1" style={{ color: T.dim }}>
                <div>
                  <span style={{ color: T.accent }}>OpenTelemetry</span> — native OTLP export to any
                  observability backend
                </div>
                <div>
                  <span style={{ color: T.accent }}>Structured Traces</span> — spans for every agent
                  turn, tool call, and guardrail check
                </div>
                <div>
                  <span style={{ color: T.accent }}>Cost Attribution</span> — per-agent, per-tool,
                  per-workspace cost breakdown
                </div>
                <div>
                  <span style={{ color: T.accent }}>Token Analytics</span> — input/output/cached
                  token counts with efficiency scoring
                </div>
                <div>
                  <span style={{ color: T.accent }}>Latency Profiling</span> — p50/p95/p99 latency
                  by agent, model, and tool
                </div>
                <div>
                  <span style={{ color: T.accent }}>Drift Detection</span> — automated alerts when
                  agent behavior changes
                </div>
                <div>
                  <span style={{ color: T.accent }}>Proof Chain Anchoring</span> — every trace
                  linked to cryptographic proof hash
                </div>
                <div>
                  <span style={{ color: T.accent }}>Exporters</span> — Datadog, Grafana, Honeycomb,
                  New Relic, Splunk, custom
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div
              className="text-[9px] font-mono uppercase tracking-wider mb-3"
              style={{ color: T.muted }}
            >
              SDK Integration
            </div>
            <pre
              className="font-mono text-[11px] leading-relaxed overflow-x-auto"
              style={{ color: T.dim }}
            >{`from a11oy import Agent, Tracer
from a11oy.observe import OTLPExporter, CostTracker

# Configure observability
tracer = Tracer(
    exporters=[
        OTLPExporter(endpoint="https://otel.a11oy.dev"),
        CostTracker(budget_alert="$100/day"),
    ],
    proof_chain=True,  # Anchor traces to proof chain
)

agent = Agent(
    name="maritime-ops",
    tools=[vessel_lookup, sanctions_check],
    tracer=tracer,
)

# Every run is automatically traced
result = await agent.run("Scan fleet for sanctions risk")

# Query traces programmatically
traces = tracer.query(
    agent="maritime-ops",
    status="flagged",
    since="24h",
)`}</pre>
          </Card>
        </>
      )}

      {tab === 'guides' && (
        <>
          <SectionTitle>Developer Guides</SectionTitle>
          <div className="flex flex-wrap gap-1 mb-4">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-md transition-all"
                style={{
                  background: catFilter === c ? 'rgba(201,183,135,0.1)' : 'transparent',
                  color: catFilter === c ? T.accent : T.muted,
                  border: `1px solid ${catFilter === c ? 'rgba(201,183,135,0.15)' : 'transparent'}`,
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredGuides.map((g) => (
              <Card key={g.title}>
                <div className="flex justify-between items-start mb-1">
                  <div className="text-xs font-medium" style={{ color: T.text }}>
                    {g.title}
                  </div>
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      background:
                        g.difficulty === 'Beginner'
                          ? 'rgba(201,183,135,0.08)'
                          : g.difficulty === 'Advanced'
                            ? 'rgba(245,245,245,0.05)'
                            : 'rgba(138,138,138,0.08)',
                      color:
                        g.difficulty === 'Advanced'
                          ? T.text
                          : g.difficulty === 'Beginner'
                            ? T.accent
                            : T.dim,
                    }}
                  >
                    {g.difficulty}
                  </span>
                </div>
                <div className="text-[10px] mb-2" style={{ color: T.dim }}>
                  {g.desc}
                </div>
                <div className="text-[9px] font-mono" style={{ color: T.muted }}>
                  {g.category}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === 'api' && (
        <>
          <SectionTitle>API Reference</SectionTitle>
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Method', 'Endpoint', 'Description', 'Auth'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider"
                      style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {API_ENDPOINTS.map((ep, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-2.5">
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          background:
                            ep.method === 'POST'
                              ? 'rgba(201,183,135,0.08)'
                              : 'rgba(138,138,138,0.08)',
                          color: ep.method === 'POST' ? T.accent : T.dim,
                        }}
                      >
                        {ep.method}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.text }}>
                      {ep.path}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: T.dim }}>
                      {ep.desc}
                    </td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.muted }}>
                      {ep.auth}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'cookbook' && (
        <>
          <SectionTitle>a11oy Cookbook</SectionTitle>
          <p className="text-xs mb-6" style={{ color: T.dim }}>
            {COOKBOOK.length} production-ready recipes — every pattern from the OpenAI API platform,
            rewritten as a11oy-governed Python code. Agents, evals, fine-tuning, realtime voice,
            MCP, connectors, deep research, structured output, and more.
          </p>

          <div className="flex flex-wrap gap-1 mb-6">
            {COOKBOOK_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCookbookFilter(c);
                  setExpandedRecipe(null);
                }}
                className="px-2.5 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-md transition-all"
                style={{
                  background: cookbookFilter === c ? 'rgba(201,183,135,0.1)' : 'transparent',
                  color: cookbookFilter === c ? T.accent : T.muted,
                  border: `1px solid ${cookbookFilter === c ? 'rgba(201,183,135,0.15)' : 'transparent'}`,
                }}
              >
                {c}{' '}
                {c !== 'All'
                  ? `(${COOKBOOK.filter((r) => r.category === c).length})`
                  : `(${COOKBOOK.length})`}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredCookbook.map((recipe, i) => {
              const globalIdx = COOKBOOK.indexOf(recipe);
              const isExpanded = expandedRecipe === globalIdx;
              return (
                <div
                  key={`${recipe.title}-${i}`}
                  className="rounded-lg overflow-hidden transition-all"
                  style={{
                    border: `1px solid ${isExpanded ? 'rgba(201,183,135,0.2)' : T.border}`,
                    background: isExpanded ? 'rgba(201,183,135,0.02)' : T.surface,
                  }}
                >
                  <button
                    onClick={() => setExpandedRecipe(isExpanded ? null : globalIdx)}
                    className="w-full text-left px-4 py-3 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-mono font-medium truncate"
                          style={{ color: T.text }}
                        >
                          {recipe.title}
                        </span>
                        <span
                          className="text-[8px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{ background: 'rgba(201,183,135,0.08)', color: T.accent }}
                        >
                          {recipe.category}
                        </span>
                      </div>
                      <div className="text-[10px] truncate" style={{ color: T.dim }}>
                        {recipe.desc}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      {recipe.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[8px] font-mono px-1 py-0.5 rounded"
                          style={{ background: 'rgba(255,255,255,0.03)', color: T.muted }}
                        >
                          {tag}
                        </span>
                      ))}
                      <span className="text-[10px] font-mono" style={{ color: T.muted }}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${T.border}` }}>
                      <div
                        className="flex items-center justify-between px-4 py-2"
                        style={{ background: 'rgba(0,0,0,0.3)' }}
                      >
                        <span className="text-[9px] font-mono" style={{ color: T.muted }}>
                          a11oy SDK
                        </span>
                        <span className="text-[9px] font-mono" style={{ color: T.accent }}>
                          Python
                        </span>
                      </div>
                      <pre
                        className="p-4 font-mono text-[11px] leading-relaxed overflow-x-auto"
                        style={{ background: '#050505', color: T.dim }}
                      >
                        {recipe.code}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </Layout>
  );
}
