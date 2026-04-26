import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

const T = {
  bg: '#0a0a0a', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

const SDK_PRIMITIVES = [
  { name: 'Agent', desc: 'LLM configured with instructions, tools, guardrails, and handoffs. Supports Python and TypeScript runtimes.', status: 'stable', lang: 'py + ts' },
  { name: 'Runner', desc: 'Manages the agent loop — tool invocation, result routing, turn management, and session persistence.', status: 'stable', lang: 'py + ts' },
  { name: 'Handoff', desc: 'Atomic context transfer between agents. Conversation history, tool state, and proof chain move as one unit.', status: 'stable', lang: 'py + ts' },
  { name: 'Guardrail', desc: 'Input/output validation that runs in parallel with agent execution. Fail-fast on policy violations.', status: 'stable', lang: 'py + ts' },
  { name: 'FunctionTool', desc: 'Turn any function into an agent tool with automatic schema generation and Pydantic/Zod validation.', status: 'stable', lang: 'py + ts' },
  { name: 'SandboxAgent', desc: 'Agent that runs inside an isolated workspace with manifest-defined files and sandbox-native capabilities.', status: 'beta', lang: 'py' },
  { name: 'RealtimeAgent', desc: 'Low-latency voice agent built on WebSocket transport. Semantic VAD, interrupt handling, mid-stream tools.', status: 'beta', lang: 'py' },
  { name: 'Session', desc: 'Persistent memory layer for maintaining working context across turns and agent handoffs.', status: 'stable', lang: 'py + ts' },
  { name: 'Tracer', desc: 'Built-in tracing for visualization, debugging, evaluation, fine-tuning, and distillation.', status: 'stable', lang: 'py + ts' },
  { name: 'MCPServer', desc: 'Model Context Protocol integration — connect any MCP-compatible tool server as native agent tools.', status: 'stable', lang: 'py + ts' },
  { name: 'EvalRunner', desc: 'Evaluation framework for scoring agent outputs. Supports custom graders, dataset-driven evals, and continuous benchmarking.', status: 'stable', lang: 'py + ts' },
  { name: 'FineTuner', desc: 'Fine-tune models on governed datasets. Proof-chained training runs with automatic checkpoint evaluation.', status: 'stable', lang: 'py' },
  { name: 'SkillPack', desc: 'Curated instruction sets that extend agent capabilities. Install, compose, and version-control domain skills.', status: 'stable', lang: 'py + ts' },
  { name: 'DocsMCP', desc: 'Documentation-as-a-tool-server. Agents query official docs, citations flow back through proof chain.', status: 'stable', lang: 'py + ts' },
];

const TOOL_TYPES = [
  {
    name: 'Function Tools',
    desc: 'Any Python or TypeScript function becomes a tool. Schema auto-generated from type hints and docstrings. Pydantic/Zod validation on inputs and outputs.',
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
    desc: 'Pre-built tools hosted by a11oy infrastructure. Web search, file search, code interpreter, image generation — all governed by proof chain.',
    protocol: 'a11oy API',
    status: 'stable',
    examples: ['web_search', 'file_search', 'code_interpreter', 'image_gen', 'pdf_extract'],
    code: `from a11oy.tools import WebSearch, FileSearch, CodeInterpreter

agent = Agent(
    name="Research Analyst",
    tools=[
        WebSearch(max_results=10, governed=True),
        FileSearch(vector_store="maritime-docs"),
        CodeInterpreter(sandbox="isolated"),
    ],
)`,
  },
  {
    name: 'MCP Tool Servers',
    desc: 'Model Context Protocol — the universal standard for tool interop. Connect any MCP server and its tools appear as native agent capabilities. Governed by the Connector Firewall.',
    protocol: 'MCP (stdio / SSE)',
    status: 'stable',
    examples: ['docs_mcp', 'github_mcp', 'postgres_mcp', 'slack_mcp', 'jira_mcp'],
    code: `from a11oy.mcp import MCPServerStdio, MCPServerSSE

docs_server = MCPServerStdio(
    name="a11oy-docs",
    command="npx",
    args=["-y", "@a11oy/docs-mcp"],
)

github_server = MCPServerSSE(
    name="github",
    url="https://mcp.a11oy.dev/github",
    headers={"Authorization": "Bearer {token}"},
)

agent = Agent(
    name="DevOps",
    mcp_servers=[docs_server, github_server],
    mcp_config={
        "allowed_tools": ["search_docs", "create_issue"],
        "blocked_tools": ["delete_repo"],
    },
)`,
  },
  {
    name: 'Agents as Tools',
    desc: 'Any agent can be used as a tool by another agent. The caller invokes the specialist, receives structured output, and continues processing. Different from handoffs — the caller retains control.',
    protocol: 'Native SDK',
    status: 'stable',
    examples: ['legal_reviewer', 'code_auditor', 'risk_scorer', 'translation_agent'],
    code: `from a11oy import Agent

legal_review = Agent(
    name="Legal Reviewer",
    instructions="Review contracts for compliance risks",
    output_type=RiskReport,
)

deal_agent = Agent(
    name="Deal Processor",
    instructions="Process deals end-to-end",
    tools=[legal_review.as_tool(
        description="Get legal risk assessment",
    )],
)`,
  },
];

const EVAL_FRAMEWORK = {
  graderTypes: [
    { name: 'LLM Grader', desc: 'Use an LLM to judge output quality against criteria. Supports multi-dimension scoring.', usage: 847, accuracy: '94.2%' },
    { name: 'Code Grader', desc: 'Programmatic evaluation — exact match, regex, custom scoring functions. Fastest and most deterministic.', usage: 2341, accuracy: '99.8%' },
    { name: 'Human Grader', desc: 'Queue outputs for human evaluation. Supports rating scales, binary accept/reject, and comparative ranking.', usage: 312, accuracy: '97.1%' },
    { name: 'MirrorEval', desc: 'a11oy\'s proprietary continuous evaluator. Runs automatically on every agent output. Detects bias, drift, and regression.', usage: 12847, accuracy: '96.3%' },
  ],
  evalSuites: [
    { name: 'Maritime Compliance', tests: 847, passing: 841, type: 'Domain', lastRun: '2h ago' },
    { name: 'Legal Risk Accuracy', tests: 423, passing: 419, type: 'Domain', lastRun: '4h ago' },
    { name: 'Threat Intel Classification', tests: 1203, passing: 1198, type: 'Domain', lastRun: '1h ago' },
    { name: 'Guardrail Effectiveness', tests: 2847, passing: 2847, type: 'Safety', lastRun: '30m ago' },
    { name: 'Handoff Correctness', tests: 634, passing: 632, type: 'System', lastRun: '1h ago' },
    { name: 'Proof Chain Integrity', tests: 4201, passing: 4201, type: 'System', lastRun: '15m ago' },
    { name: 'Bias Detection', tests: 1847, passing: 1839, type: 'Fairness', lastRun: '3h ago' },
    { name: 'Cost Efficiency', tests: 312, passing: 308, type: 'Operations', lastRun: '6h ago' },
  ],
};

const FINETUNE_REGISTRY = [
  { name: 'maritime-sanctions-v4', baseModel: 'gpt-4o-mini', dataset: '12,847 examples', status: 'deployed', accuracy: '97.8%', cost: '$42', proofHash: '0x4a2f...c891' },
  { name: 'legal-risk-classifier-v3', baseModel: 'gpt-4o-mini', dataset: '8,421 examples', status: 'deployed', accuracy: '96.2%', cost: '$31', proofHash: '0x7b3e...d412' },
  { name: 'threat-triage-v2', baseModel: 'gpt-4o-mini', dataset: '6,203 examples', status: 'deployed', accuracy: '95.4%', cost: '$28', proofHash: '0x2c81...f7a3' },
  { name: 'deal-scorer-v5', baseModel: 'gpt-4o-mini', dataset: '4,892 examples', status: 'training', accuracy: '—', cost: '$19', proofHash: '—' },
  { name: 'vessel-anomaly-v1', baseModel: 'gpt-4o-mini', dataset: '3,412 examples', status: 'evaluating', accuracy: '93.1%', cost: '$14', proofHash: '—' },
];

const SKILLS_REGISTRY = [
  { name: 'openai-docs', desc: 'Query OpenAI documentation. Agents consult docs before answering API questions. Citation-backed.', source: 'OpenAI', installed: true, version: '1.2.0', tools: ['search_docs', 'get_page', 'list_sections'] },
  { name: 'maritime-ops', desc: 'Maritime domain knowledge — vessel tracking, port operations, sanctions screening, route optimization.', source: 'a11oy', installed: true, version: '4.1.0', tools: ['vessel_lookup', 'port_info', 'route_calc', 'sanctions_check'] },
  { name: 'legal-compliance', desc: 'Legal domain — contract review, deadline tracking, risk assessment, obligation extraction.', source: 'a11oy', installed: true, version: '3.2.0', tools: ['contract_review', 'deadline_scan', 'risk_score', 'obligation_graph'] },
  { name: 'threat-intel', desc: 'Cybersecurity — STIX/TAXII feeds, CVE analysis, posture assessment, incident triage.', source: 'a11oy', installed: true, version: '2.8.0', tools: ['stix_parse', 'cve_lookup', 'posture_assess', 'incident_triage'] },
  { name: 'real-estate', desc: 'Real estate intelligence — cap rates, portfolio analysis, valuation models, market comparables.', source: 'a11oy', installed: true, version: '2.1.0', tools: ['cap_rate', 'valuation', 'market_comp', 'portfolio_analysis'] },
  { name: 'github-ops', desc: 'GitHub integration — PR management, issue tracking, code review, repository analysis.', source: 'Community', installed: true, version: '1.4.0', tools: ['create_pr', 'list_issues', 'review_code', 'repo_stats'] },
  { name: 'postgres-admin', desc: 'PostgreSQL administration — query execution, schema inspection, performance analysis.', source: 'Community', installed: true, version: '1.1.0', tools: ['run_query', 'inspect_schema', 'explain_plan'] },
  { name: 'slack-notify', desc: 'Slack integration — send messages, create channels, manage threads, file uploads.', source: 'Community', installed: true, version: '1.3.0', tools: ['send_message', 'create_channel', 'upload_file'] },
  { name: 'data-viz', desc: 'Data visualization — chart generation, dashboard components, CSV/JSON analysis.', source: 'Community', installed: false, version: '0.9.0', tools: ['create_chart', 'analyze_csv', 'build_dashboard'] },
  { name: 'email-compose', desc: 'Email composition — draft generation, template management, compliance review.', source: 'Community', installed: false, version: '0.7.0', tools: ['draft_email', 'apply_template', 'compliance_check'] },
];

const MCP_SERVERS = [
  { name: 'a11oy-docs', transport: 'stdio', status: 'active', tools: 6, calls: 4892, desc: 'a11oy platform documentation — agents query docs first for platform questions' },
  { name: 'openai-docs', transport: 'sse', status: 'active', tools: 4, calls: 2341, desc: 'OpenAI official documentation via MCP — citation-backed answers traceable to docs sources' },
  { name: 'github', transport: 'sse', status: 'active', tools: 12, calls: 8921, desc: 'GitHub API — PR management, issue tracking, code search, repository operations' },
  { name: 'postgres', transport: 'stdio', status: 'active', tools: 5, calls: 3412, desc: 'PostgreSQL — governed query execution, schema inspection, migration planning' },
  { name: 'slack', transport: 'sse', status: 'active', tools: 8, calls: 2103, desc: 'Slack — message dispatch, channel management, thread operations' },
  { name: 'jira', transport: 'sse', status: 'active', tools: 7, calls: 1847, desc: 'Jira — issue CRUD, sprint management, backlog grooming' },
  { name: 'stripe', transport: 'sse', status: 'active', tools: 9, calls: 892, desc: 'Stripe — payment processing, subscription management, invoice generation' },
  { name: 'browserbase', transport: 'sse', status: 'active', tools: 4, calls: 567, desc: 'Browser automation — web scraping, screenshot capture, form filling' },
  { name: 'sentry', transport: 'sse', status: 'standby', tools: 5, calls: 234, desc: 'Sentry — error tracking, performance monitoring, release management' },
  { name: 'linear', transport: 'sse', status: 'standby', tools: 6, calls: 189, desc: 'Linear — issue tracking, project management, cycle planning' },
];

const GUIDES = [
  { title: 'Quickstart', desc: 'Build your first governed agent in 5 minutes', category: 'Getting Started', difficulty: 'Beginner' },
  { title: 'Function Tools', desc: 'Turn any function into an agent tool with automatic schema generation', category: 'Tools', difficulty: 'Beginner' },
  { title: 'Hosted Tools', desc: 'Web search, file search, code interpreter — pre-built and governed', category: 'Tools', difficulty: 'Beginner' },
  { title: 'MCP Integration', desc: 'Connect Model Context Protocol servers as native tool providers', category: 'Tools', difficulty: 'Intermediate' },
  { title: 'Agents as Tools', desc: 'Use specialist agents as callable tools within other agents', category: 'Tools', difficulty: 'Intermediate' },
  { title: 'Tool Governance', desc: 'Access control, rate limiting, cost tracking, and proof chains for tools', category: 'Tools', difficulty: 'Advanced' },
  { title: 'Evaluation Basics', desc: 'Score agent outputs with LLM, code, and human graders', category: 'Evals', difficulty: 'Beginner' },
  { title: 'Custom Graders', desc: 'Build domain-specific evaluation criteria and scoring rubrics', category: 'Evals', difficulty: 'Intermediate' },
  { title: 'Continuous Evals', desc: 'Run MirrorEval on every agent output — detect drift and regression', category: 'Evals', difficulty: 'Advanced' },
  { title: 'Eval-Driven Development', desc: 'Write evals first, then build agents — test-driven agentic development', category: 'Evals', difficulty: 'Advanced' },
  { title: 'Fine-Tuning Basics', desc: 'Fine-tune models on governed datasets with proof-chained training runs', category: 'Fine-Tuning', difficulty: 'Intermediate' },
  { title: 'Dataset Curation', desc: 'Build training datasets from agent traces, eval results, and human feedback', category: 'Fine-Tuning', difficulty: 'Intermediate' },
  { title: 'Distillation Pipeline', desc: 'Distill expensive model outputs into smaller, faster, cheaper models', category: 'Fine-Tuning', difficulty: 'Advanced' },
  { title: 'Skills & Skill Packs', desc: 'Install, compose, and version-control domain skills for agents', category: 'Skills', difficulty: 'Beginner' },
  { title: 'Building Custom Skills', desc: 'Create reusable skill packs with instructions, tools, and guardrails', category: 'Skills', difficulty: 'Intermediate' },
  { title: 'Docs MCP Server', desc: 'Give agents access to official documentation via MCP — citation-backed answers', category: 'Skills', difficulty: 'Intermediate' },
  { title: 'Multi-Agent Orchestration', desc: 'Manager pattern vs. handoff pattern — when to use each', category: 'Architecture', difficulty: 'Advanced' },
  { title: 'Guardrails & Safety', desc: 'Input validation, output filtering, PII redaction, cost limits', category: 'Safety', difficulty: 'Intermediate' },
  { title: 'Sandbox Agents', desc: 'Run agents in isolated workspaces with manifest-defined files', category: 'Architecture', difficulty: 'Advanced' },
  { title: 'Realtime Voice', desc: 'Build low-latency voice agents with semantic VAD and tool execution', category: 'Voice', difficulty: 'Advanced' },
  { title: 'Sessions & Memory', desc: 'Persistent context across turns, handoffs, and resumable runs', category: 'Architecture', difficulty: 'Intermediate' },
  { title: 'Tracing & Observability', desc: 'Visualize agent flows, debug decisions, monitor in production', category: 'Observability', difficulty: 'Intermediate' },
  { title: 'Proof Chain Integration', desc: 'Attach cryptographic proofs to every agent decision and action', category: 'Governance', difficulty: 'Advanced' },
  { title: 'Vertical Domain Packs', desc: 'Pre-configured agent teams for Maritime, Defense, Legal, Real Estate', category: 'Verticals', difficulty: 'Intermediate' },
];

const API_ENDPOINTS = [
  { method: 'POST', path: '/v1/agents', desc: 'Register a new agent', auth: 'Bearer' },
  { method: 'POST', path: '/v1/agents/{id}/run', desc: 'Execute an agent run', auth: 'Bearer' },
  { method: 'POST', path: '/v1/agents/{id}/stream', desc: 'Stream agent execution events', auth: 'Bearer' },
  { method: 'POST', path: '/v1/handoffs', desc: 'Execute a governed handoff', auth: 'Bearer' },
  { method: 'GET', path: '/v1/sessions/{id}', desc: 'Retrieve session state', auth: 'Bearer' },
  { method: 'POST', path: '/v1/guardrails/check', desc: 'Run guardrail validation', auth: 'Bearer' },
  { method: 'GET', path: '/v1/traces/{run_id}', desc: 'Get execution trace', auth: 'Bearer' },
  { method: 'POST', path: '/v1/realtime/session', desc: 'Create realtime voice session', auth: 'Bearer' },
  { method: 'GET', path: '/v1/tools', desc: 'List registered tools', auth: 'Bearer' },
  { method: 'POST', path: '/v1/tools/mcp/connect', desc: 'Connect an MCP server', auth: 'Bearer' },
  { method: 'POST', path: '/v1/evals/run', desc: 'Execute an evaluation suite', auth: 'Bearer' },
  { method: 'GET', path: '/v1/evals/{id}/results', desc: 'Get eval suite results', auth: 'Bearer' },
  { method: 'POST', path: '/v1/finetune', desc: 'Start a fine-tuning job', auth: 'Bearer' },
  { method: 'GET', path: '/v1/finetune/{id}', desc: 'Get fine-tuning status', auth: 'Bearer' },
  { method: 'POST', path: '/v1/skills/install', desc: 'Install a skill pack', auth: 'Bearer' },
  { method: 'GET', path: '/v1/skills', desc: 'List installed skills', auth: 'Bearer' },
  { method: 'POST', path: '/v1/proofs/verify', desc: 'Verify proof chain hash', auth: 'Bearer' },
];

export function DevPlatform() {
  const [tab, setTab] = useState<'primitives' | 'tools' | 'evals' | 'finetune' | 'skills' | 'mcp' | 'guides' | 'api'>('primitives');
  const [catFilter, setCatFilter] = useState<string>('All');
  const [selectedToolType, setSelectedToolType] = useState(0);
  const categories = ['All', ...Array.from(new Set(GUIDES.map(g => g.category)))];
  const filteredGuides = catFilter === 'All' ? GUIDES : GUIDES.filter(g => g.category === catFilter);
  const totalEvalTests = EVAL_FRAMEWORK.evalSuites.reduce((a, s) => a + s.tests, 0);
  const totalPassing = EVAL_FRAMEWORK.evalSuites.reduce((a, s) => a + s.passing, 0);
  const totalMcpTools = MCP_SERVERS.reduce((a, s) => a + s.tools, 0);
  const totalMcpCalls = MCP_SERVERS.reduce((a, s) => a + s.calls, 0);

  return (
    <Layout>
      <PageHeader
        label="DEVELOPER PLATFORM"
        title="a11oy SDK"
        subtitle="Build governed agentic applications. Python-first, TypeScript-native. Tools, evals, fine-tuning, skills, MCP servers, and proof chains — the complete developer platform."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        <KpiCard label="PRIMITIVES" value={SDK_PRIMITIVES.length} sub="available" accent={T.accent} />
        <KpiCard label="TOOL TYPES" value={TOOL_TYPES.length} sub="supported" accent={T.accent} />
        <KpiCard label="EVAL TESTS" value={totalEvalTests.toLocaleString()} sub={`${Math.round((totalPassing / totalEvalTests) * 100)}% pass`} accent={T.accent} />
        <KpiCard label="FINE-TUNES" value={FINETUNE_REGISTRY.length} sub="models" accent={T.dim} />
        <KpiCard label="SKILLS" value={SKILLS_REGISTRY.length} sub="registered" accent={T.accent} />
        <KpiCard label="MCP SERVERS" value={MCP_SERVERS.length} sub={`${totalMcpTools} tools`} accent={T.dim} />
        <KpiCard label="GUIDES" value={GUIDES.length} sub="published" accent={T.accent} />
        <KpiCard label="API" value={API_ENDPOINTS.length} sub="endpoints" accent={T.dim} />
      </div>

      <div className="flex flex-wrap gap-1 mb-6">
        {(['primitives', 'tools', 'evals', 'finetune', 'skills', 'mcp', 'guides', 'api'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest rounded-md transition-all" style={{ background: tab === t ? 'rgba(201,183,135,0.1)' : 'transparent', color: tab === t ? T.accent : T.muted, border: `1px solid ${tab === t ? 'rgba(201,183,135,0.2)' : 'transparent'}` }}>
            {t === 'finetune' ? 'fine-tune' : t}
          </button>
        ))}
      </div>

      {tab === 'primitives' && (
        <>
          <SectionTitle>SDK Primitives</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim }}>
            The a11oy SDK absorbs every pattern from the OpenAI Agents SDK — agents, handoffs, guardrails, tools, sessions, tracing, MCP, realtime — then adds governed orchestration, proof chains, evals, fine-tuning, skills, and multi-vertical domain packs.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SDK_PRIMITIVES.map(p => (
              <Card key={p.name}>
                <div className="flex justify-between items-start mb-1.5">
                  <div className="text-xs font-mono font-medium" style={{ color: T.text }}>{p.name}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: p.status === 'stable' ? 'rgba(201,183,135,0.08)' : 'rgba(138,138,138,0.08)', color: p.status === 'stable' ? T.accent : T.dim, border: `1px solid ${p.status === 'stable' ? 'rgba(201,183,135,0.12)' : 'rgba(138,138,138,0.12)'}` }}>{p.status}</span>
                    <span className="text-[9px] font-mono" style={{ color: T.muted }}>{p.lang}</span>
                  </div>
                </div>
                <div className="text-[10px] leading-relaxed" style={{ color: T.dim }}>{p.desc}</div>
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === 'tools' && (
        <>
          <SectionTitle>Tool System</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim }}>
            Four ways to give agents tools — function tools, hosted tools, MCP servers, and agents-as-tools. All governed by the Connector Firewall with proof chain on every invocation.
          </p>
          <div className="flex gap-1 mb-4">
            {TOOL_TYPES.map((tt, i) => (
              <button key={tt.name} onClick={() => setSelectedToolType(i)} className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-md transition-all" style={{ background: selectedToolType === i ? 'rgba(201,183,135,0.1)' : 'transparent', color: selectedToolType === i ? T.accent : T.muted, border: `1px solid ${selectedToolType === i ? 'rgba(201,183,135,0.15)' : 'transparent'}` }}>
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
                    <div className="text-sm font-medium" style={{ color: T.text }}>{tt.name}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(201,183,135,0.08)', color: T.accent }}>{tt.status}</span>
                      <span className="text-[9px] font-mono" style={{ color: T.muted }}>{tt.protocol}</span>
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed mb-4" style={{ color: T.dim }}>{tt.desc}</p>
                  <div className="text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: T.muted }}>Examples</div>
                  <div className="flex flex-wrap gap-1">
                    {tt.examples.map(e => (
                      <span key={e} className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(201,183,135,0.06)', color: T.accent, border: '1px solid rgba(201,183,135,0.1)' }}>{e}</span>
                    ))}
                  </div>
                </Card>
                <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                  <div className="flex items-center justify-between px-4 py-2" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${T.border}` }}>
                    <span className="text-[10px] font-mono font-medium" style={{ color: T.text }}>{tt.name}</span>
                    <span className="text-[9px] font-mono" style={{ color: T.accent }}>Python</span>
                  </div>
                  <pre className="p-4 font-mono text-[11px] leading-relaxed overflow-x-auto" style={{ background: '#050505', color: T.dim }}>{tt.code}</pre>
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
            Score every agent output. LLM graders, code graders, human graders, and MirrorEval — a11oy's proprietary continuous evaluator. Eval-driven development: write evals first, then build agents.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {EVAL_FRAMEWORK.graderTypes.map(g => (
              <Card key={g.name}>
                <div className="text-xs font-medium mb-1" style={{ color: T.text }}>{g.name}</div>
                <div className="text-[10px] mb-3" style={{ color: T.dim }}>{g.desc}</div>
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
                  {['Suite', 'Type', 'Tests', 'Passing', 'Rate', 'Last Run'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider" style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EVAL_FRAMEWORK.evalSuites.map(s => (
                  <tr key={s.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-2.5 font-medium" style={{ color: T.text }}>{s.name}</td>
                    <td className="px-4 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(201,183,135,0.06)', color: T.accent }}>{s.type}</span></td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.dim }}>{s.tests.toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.accent }}>{s.passing.toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: s.passing === s.tests ? T.accent : T.text }}>{((s.passing / s.tests) * 100).toFixed(1)}%</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.muted }}>{s.lastRun}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'finetune' && (
        <>
          <SectionTitle>Fine-Tuning Pipeline</SectionTitle>
          <p className="text-xs mb-6" style={{ color: T.dim }}>
            Fine-tune models on governed datasets. Every training run is proof-chained — dataset provenance, hyperparameters, evaluation results, and deployment decisions are all cryptographically verifiable. Build training datasets from agent traces, eval results, and human feedback. Distill expensive model outputs into smaller, faster, cheaper models.
          </p>

          <div className="rounded-lg overflow-hidden mb-8" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Model', 'Base', 'Dataset', 'Status', 'Accuracy', 'Cost', 'Proof'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider" style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FINETUNE_REGISTRY.map(f => (
                  <tr key={f.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-2.5 font-mono font-medium" style={{ color: T.text }}>{f.name}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.dim }}>{f.baseModel}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.dim }}>{f.dataset}</td>
                    <td className="px-4 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: f.status === 'deployed' ? 'rgba(201,183,135,0.08)' : f.status === 'training' ? 'rgba(245,245,245,0.05)' : 'rgba(138,138,138,0.06)', color: f.status === 'deployed' ? T.accent : f.status === 'training' ? T.text : T.dim }}>{f.status}</span></td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.accent }}>{f.accuracy}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.dim }}>{f.cost}</td>
                    <td className="px-4 py-2.5 font-mono text-[9px]" style={{ color: T.muted }}>{f.proofHash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Card>
            <div className="text-[9px] font-mono uppercase tracking-wider mb-3" style={{ color: T.muted }}>Distillation Pipeline</div>
            <div className="font-mono text-[11px] space-y-1" style={{ color: T.dim }}>
              <div><span style={{ color: T.accent }}>1.</span> Collect high-quality outputs from expensive models (claude-sonnet-4, gpt-4o)</div>
              <div><span style={{ color: T.accent }}>2.</span> Score outputs with MirrorEval — keep only 95th+ percentile quality</div>
              <div><span style={{ color: T.accent }}>3.</span> Build training dataset with input/output pairs + proof chain metadata</div>
              <div><span style={{ color: T.accent }}>4.</span> Fine-tune smaller model (gpt-4o-mini) on curated dataset</div>
              <div><span style={{ color: T.accent }}>5.</span> Evaluate fine-tuned model against same eval suite as original</div>
              <div><span style={{ color: T.accent }}>6.</span> Deploy if accuracy meets threshold — proof-chain the entire pipeline</div>
              <div><span style={{ color: T.accent }}>7.</span> Route future tasks to fine-tuned model — 10x cost reduction, &lt;2% accuracy loss</div>
            </div>
          </Card>
        </>
      )}

      {tab === 'skills' && (
        <>
          <SectionTitle>Skills Registry</SectionTitle>
          <p className="text-xs mb-6" style={{ color: T.dim }}>
            Skills are curated instruction sets that extend agent capabilities. Each skill bundles instructions, tools, guardrails, and domain knowledge into an installable, versionable package. Agents consult skills before acting — like the OpenAI Docs Skill tells agents to query the Docs MCP server first for API questions.
          </p>
          <div className="space-y-2 mb-8">
            {SKILLS_REGISTRY.map(sk => (
              <div key={sk.name} className="rounded-lg p-4 flex items-center gap-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="w-2 h-2 rounded-full" style={{ background: sk.installed ? T.accent : T.muted }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium" style={{ color: T.text }}>{sk.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: sk.installed ? 'rgba(201,183,135,0.08)' : 'rgba(255,255,255,0.03)', color: sk.installed ? T.accent : T.muted }}>{sk.installed ? 'installed' : 'available'}</span>
                    <span className="text-[9px] font-mono" style={{ color: T.muted }}>v{sk.version} · {sk.source}</span>
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: T.dim }}>{sk.desc}</div>
                </div>
                <div className="flex flex-wrap gap-1 max-w-[200px] justify-end">
                  {sk.tools.slice(0, 3).map(t => (
                    <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: T.dim }}>{t}</span>
                  ))}
                  {sk.tools.length > 3 && <span className="text-[9px] font-mono" style={{ color: T.muted }}>+{sk.tools.length - 3}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <div className="text-[9px] font-mono uppercase tracking-wider mb-3" style={{ color: T.muted }}>How Skills Work</div>
              <div className="font-mono text-[11px] space-y-1" style={{ color: T.dim }}>
                <div><span style={{ color: T.accent }}>1.</span> Skill installed via <span style={{ color: T.text }}>a11oy skill install maritime-ops</span></div>
                <div><span style={{ color: T.accent }}>2.</span> SKILL.md loaded into agent context at session start</div>
                <div><span style={{ color: T.accent }}>3.</span> Skill tools registered in agent tool registry</div>
                <div><span style={{ color: T.accent }}>4.</span> Skill guardrails activated alongside agent guardrails</div>
                <div><span style={{ color: T.accent }}>5.</span> Agent consults skill instructions before acting</div>
                <div><span style={{ color: T.accent }}>6.</span> All skill tool calls governed by proof chain</div>
              </div>
            </Card>
            <Card>
              <div className="text-[9px] font-mono uppercase tracking-wider mb-3" style={{ color: T.muted }}>Docs MCP + Skills Pattern</div>
              <div className="text-[11px] leading-relaxed" style={{ color: T.dim }}>
                <p className="mb-2">The OpenAI Docs Skill tells agents: <span style={{ color: T.accent }}>"Use the Docs MCP server first for OpenAI questions, then fall back to official domains."</span></p>
                <p className="mb-2">a11oy extends this pattern to every domain. The maritime-ops skill tells Cascade Navigator to query the maritime MCP server first. The legal-compliance skill tells Counsel Sentinel to check the legal MCP server.</p>
                <p style={{ color: T.text }}>Skills + MCP = agents that always consult authoritative sources before answering, with citations traceable through the proof chain.</p>
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === 'mcp' && (
        <>
          <SectionTitle>MCP Server Registry</SectionTitle>
          <p className="text-xs mb-6" style={{ color: T.dim }}>
            Model Context Protocol — the universal standard for tool interop. {MCP_SERVERS.length} servers connected, {totalMcpTools} tools available, {totalMcpCalls.toLocaleString()} calls today. Every MCP tool call flows through the Connector Firewall with proof chain verification.
          </p>
          <div className="rounded-lg overflow-hidden mb-8" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Server', 'Transport', 'Status', 'Tools', 'Calls', 'Description'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider" style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MCP_SERVERS.map(s => (
                  <tr key={s.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-2.5 font-mono font-medium" style={{ color: T.text }}>{s.name}</td>
                    <td className="px-4 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: T.dim }}>{s.transport}</span></td>
                    <td className="px-4 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: s.status === 'active' ? 'rgba(201,183,135,0.08)' : 'rgba(138,138,138,0.06)', color: s.status === 'active' ? T.accent : T.dim }}>{s.status}</span></td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.accent }}>{s.tools}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.dim }}>{s.calls.toLocaleString()}</td>
                    <td className="px-4 py-2.5" style={{ color: T.dim, maxWidth: 300 }}>{s.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Card>
            <div className="text-[9px] font-mono uppercase tracking-wider mb-3" style={{ color: T.muted }}>Connector Firewall</div>
            <div className="text-[11px] leading-relaxed" style={{ color: T.dim }}>
              <p className="mb-2">Every MCP tool call passes through the Connector Firewall before execution. The firewall enforces:</p>
              <div className="font-mono space-y-1 mt-2">
                <div><span style={{ color: T.accent }}>access_control</span> — agent must be authorized for the specific tool</div>
                <div><span style={{ color: T.accent }}>rate_limiting</span> — per-agent, per-tool, per-server call limits</div>
                <div><span style={{ color: T.accent }}>cost_tracking</span> — real-time cost attribution per agent per tool</div>
                <div><span style={{ color: T.accent }}>input_sanitization</span> — validate and sanitize tool inputs</div>
                <div><span style={{ color: T.accent }}>output_governance</span> — screen tool outputs through guardrails</div>
                <div><span style={{ color: T.accent }}>proof_chain</span> — every tool call anchored to a cryptographic proof hash</div>
                <div><span style={{ color: T.accent }}>audit_trail</span> — complete log of who called what, when, and why</div>
              </div>
            </div>
          </Card>
        </>
      )}

      {tab === 'guides' && (
        <>
          <SectionTitle>Developer Guides</SectionTitle>
          <div className="flex flex-wrap gap-1 mb-4">
            {categories.map(c => (
              <button key={c} onClick={() => setCatFilter(c)} className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-md transition-all" style={{ background: catFilter === c ? 'rgba(201,183,135,0.1)' : 'transparent', color: catFilter === c ? T.accent : T.muted, border: `1px solid ${catFilter === c ? 'rgba(201,183,135,0.15)' : 'transparent'}` }}>
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredGuides.map(g => (
              <Card key={g.title}>
                <div className="flex justify-between items-start mb-1">
                  <div className="text-xs font-medium" style={{ color: T.text }}>{g.title}</div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: g.difficulty === 'Beginner' ? 'rgba(201,183,135,0.08)' : g.difficulty === 'Advanced' ? 'rgba(245,245,245,0.05)' : 'rgba(138,138,138,0.08)', color: g.difficulty === 'Advanced' ? T.text : g.difficulty === 'Beginner' ? T.accent : T.dim }}>{g.difficulty}</span>
                </div>
                <div className="text-[10px] mb-2" style={{ color: T.dim }}>{g.desc}</div>
                <div className="text-[9px] font-mono" style={{ color: T.muted }}>{g.category}</div>
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
                  {['Method', 'Endpoint', 'Description', 'Auth'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider" style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {API_ENDPOINTS.map((ep, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: ep.method === 'POST' ? 'rgba(201,183,135,0.08)' : 'rgba(138,138,138,0.08)', color: ep.method === 'POST' ? T.accent : T.dim }}>{ep.method}</span></td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.text }}>{ep.path}</td>
                    <td className="px-4 py-2.5" style={{ color: T.dim }}>{ep.desc}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.muted }}>{ep.auth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Layout>
  );
}
