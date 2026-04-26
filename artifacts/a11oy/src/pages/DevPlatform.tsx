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
];

const GUIDES = [
  { title: 'Quickstart', desc: 'Build your first governed agent in 5 minutes', category: 'Getting Started', difficulty: 'Beginner' },
  { title: 'Agent Configuration', desc: 'Instructions, model settings, output types, and lifecycle hooks', category: 'Core', difficulty: 'Intermediate' },
  { title: 'Function Tools', desc: 'Turn any Python/TS function into an agent tool with schema generation', category: 'Core', difficulty: 'Beginner' },
  { title: 'Multi-Agent Orchestration', desc: 'Manager pattern vs. handoff pattern — when to use each', category: 'Architecture', difficulty: 'Advanced' },
  { title: 'Guardrails & Safety', desc: 'Input validation, output filtering, PII redaction, cost limits', category: 'Safety', difficulty: 'Intermediate' },
  { title: 'Sandbox Agents', desc: 'Run agents in isolated workspaces with manifest-defined files', category: 'Core', difficulty: 'Advanced' },
  { title: 'Realtime Voice', desc: 'Build low-latency voice agents with semantic VAD and tool execution', category: 'Voice', difficulty: 'Advanced' },
  { title: 'Sessions & Memory', desc: 'Persistent context across turns, handoffs, and resumable runs', category: 'Core', difficulty: 'Intermediate' },
  { title: 'Tracing & Evaluation', desc: 'Visualize agent flows, debug decisions, evaluate with MirrorEval', category: 'Observability', difficulty: 'Intermediate' },
  { title: 'MCP Integration', desc: 'Connect Model Context Protocol servers as native tool providers', category: 'Integration', difficulty: 'Intermediate' },
  { title: 'Human-in-the-Loop', desc: 'Approval gates, escalation patterns, and governed autonomy', category: 'Safety', difficulty: 'Advanced' },
  { title: 'Context Management', desc: 'Dependency injection, shared state, and RunContextWrapper patterns', category: 'Architecture', difficulty: 'Advanced' },
  { title: 'Streaming', desc: 'Real-time event streaming for agent outputs, tool calls, and handoffs', category: 'Core', difficulty: 'Intermediate' },
  { title: 'Model Router', desc: 'Dynamic model selection based on task complexity, cost, and latency', category: 'Architecture', difficulty: 'Advanced' },
  { title: 'Proof Chain Integration', desc: 'Attach cryptographic proofs to every agent decision and action', category: 'Governance', difficulty: 'Advanced' },
  { title: 'Vertical Domain Packs', desc: 'Pre-configured agent teams for Maritime, Defense, Legal, Real Estate', category: 'Verticals', difficulty: 'Intermediate' },
];

const CODE_EXAMPLES = [
  {
    title: 'Basic Agent',
    code: `from a11oy import Agent, Runner

agent = Agent(
    name="Analyst",
    instructions="You are a portfolio analyst",
    model="claude-sonnet-4",
    guardrails=["pii_redaction", "proof_chain"],
)

result = Runner.run_sync(agent, "Analyze Q2 performance")
print(result.final_output)`,
  },
  {
    title: 'Multi-Agent Handoff',
    code: `from a11oy import Agent, Runner

maritime = Agent(name="Cascade", instructions="Maritime specialist")
legal = Agent(name="Counsel", instructions="Legal specialist")

triage = Agent(
    name="Triage",
    instructions="Route to the right specialist",
    handoffs=[maritime, legal],
)

result = await Runner.run(triage, "Check vessel sanctions status")`,
  },
  {
    title: 'Guardrail',
    code: `from a11oy import Agent, InputGuardrail, GuardrailResponse

class SanctionsCheck(InputGuardrail):
    async def run(self, input, context):
        entities = extract_entities(input)
        flagged = screen_ofac(entities)
        return GuardrailResponse(
            allow=len(flagged) == 0,
            reason=f"Sanctioned: {flagged}" if flagged else None,
        )

agent = Agent(
    name="Maritime Ops",
    input_guardrails=[SanctionsCheck()],
)`,
  },
  {
    title: 'Realtime Voice',
    code: `from a11oy.realtime import RealtimeAgent, RealtimeRunner

agent = RealtimeAgent(
    name="Voice Assistant",
    instructions="Route to domain specialists",
    handoffs=[cascade, guardian, counsel],
)

runner = RealtimeRunner(
    starting_agent=agent,
    config={
        "model_settings": {
            "model_name": "gpt-realtime-1.5",
            "audio": {
                "input": {"turn_detection": {"type": "semantic_vad"}},
                "output": {"voice": "ash"},
            },
        }
    },
)`,
  },
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
  { method: 'POST', path: '/v1/proofs/verify', desc: 'Verify proof chain hash', auth: 'Bearer' },
];

export function DevPlatform() {
  const [tab, setTab] = useState<'primitives' | 'guides' | 'code' | 'api'>('primitives');
  const [catFilter, setCatFilter] = useState<string>('All');
  const categories = ['All', ...Array.from(new Set(GUIDES.map(g => g.category)))];
  const filteredGuides = catFilter === 'All' ? GUIDES : GUIDES.filter(g => g.category === catFilter);

  return (
    <Layout>
      <PageHeader
        label="DEVELOPER PLATFORM"
        title="a11oy SDK"
        subtitle="Build governed agentic applications. Python-first, TypeScript-native. Agents, handoffs, guardrails, realtime voice, sandbox execution, and proof chains — all in one SDK."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <KpiCard label="SDK PRIMITIVES" value={SDK_PRIMITIVES.length} sub="available" accent={T.accent} />
        <KpiCard label="GUIDES" value={GUIDES.length} sub="published" accent={T.accent} />
        <KpiCard label="API ENDPOINTS" value={API_ENDPOINTS.length} sub="v1" accent={T.dim} />
        <KpiCard label="LANGUAGES" value="2" sub="Python + TS" accent={T.accent} />
        <KpiCard label="CODE EXAMPLES" value={CODE_EXAMPLES.length} sub="runnable" accent={T.dim} />
        <KpiCard label="VERSION" value="2.4" sub="stable" accent={T.accent} />
      </div>

      <div className="flex gap-1 mb-6">
        {(['primitives', 'guides', 'code', 'api'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest rounded-md transition-all" style={{ background: tab === t ? 'rgba(201,183,135,0.1)' : 'transparent', color: tab === t ? T.accent : T.muted, border: `1px solid ${tab === t ? 'rgba(201,183,135,0.2)' : 'transparent'}` }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'primitives' && (
        <>
          <SectionTitle>SDK Primitives</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim }}>
            The a11oy SDK builds on the OpenAI Agents SDK architecture — then adds governed orchestration, proof chains, and multi-vertical domain packs.
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

      {tab === 'code' && (
        <>
          <SectionTitle>Code Examples</SectionTitle>
          <div className="space-y-4">
            {CODE_EXAMPLES.map(ex => (
              <div key={ex.title} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                <div className="flex items-center justify-between px-4 py-2" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${T.border}` }}>
                  <span className="text-[10px] font-mono font-medium" style={{ color: T.text }}>{ex.title}</span>
                  <span className="text-[9px] font-mono" style={{ color: T.accent }}>Python</span>
                </div>
                <pre className="p-4 font-mono text-[11px] leading-relaxed overflow-x-auto" style={{ background: '#050505', color: T.dim }}>
                  {ex.code}
                </pre>
              </div>
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
