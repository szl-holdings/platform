import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

const T = {
  bg: '#0a0a0a', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

const SESSIONS = [
  { id: 'ses-001', label: 'Refactor vessel ETA pipeline', status: 'active', agent: 'Cascade', files: 14, linesChanged: 847, duration: '12m', model: 'claude-sonnet-4', cost: '$0.42' },
  { id: 'ses-002', label: 'Fix auth token refresh race condition', status: 'complete', agent: 'Guardian', files: 3, linesChanged: 128, duration: '4m', model: 'gpt-4o', cost: '$0.08' },
  { id: 'ses-003', label: 'Add compliance evidence export', status: 'active', agent: 'Counsel Sentinel', files: 7, linesChanged: 392, duration: '8m', model: 'claude-sonnet-4', cost: '$0.31' },
  { id: 'ses-004', label: 'Optimize portfolio rebalancing query', status: 'review', agent: 'Pipeline Oracle', files: 2, linesChanged: 64, duration: '3m', model: 'gpt-4o', cost: '$0.06' },
  { id: 'ses-005', label: 'Implement STIX/TAXII feed parser', status: 'complete', agent: 'Guardian', files: 9, linesChanged: 1203, duration: '22m', model: 'claude-sonnet-4', cost: '$0.89' },
];

const CAPABILITIES = [
  { name: 'Code Generation', desc: 'Multi-file scaffolding with governed templates', usage: 94 },
  { name: 'Refactoring', desc: 'Cross-repo refactors with proof chain', usage: 87 },
  { name: 'Bug Analysis', desc: 'Root cause isolation with trace replay', usage: 82 },
  { name: 'Test Generation', desc: 'Coverage-aware test synthesis', usage: 76 },
  { name: 'Code Review', desc: 'Adversarial review with trust scoring', usage: 91 },
  { name: 'Documentation', desc: 'Auto-generated from code semantics', usage: 68 },
  { name: 'Migration', desc: 'Schema + data migration planning', usage: 73 },
  { name: 'Security Audit', desc: 'SAST/DAST with remediation plans', usage: 89 },
];

const TOOL_REGISTRY = [
  { name: 'file_read', calls: 12847, avgMs: 8, category: 'filesystem' },
  { name: 'file_write', calls: 4392, avgMs: 12, category: 'filesystem' },
  { name: 'grep_search', calls: 8921, avgMs: 45, category: 'search' },
  { name: 'ast_parse', calls: 3201, avgMs: 120, category: 'analysis' },
  { name: 'test_run', calls: 1847, avgMs: 3400, category: 'execution' },
  { name: 'git_diff', calls: 2103, avgMs: 34, category: 'vcs' },
  { name: 'lint_check', calls: 5612, avgMs: 89, category: 'quality' },
  { name: 'type_check', calls: 4287, avgMs: 1200, category: 'quality' },
  { name: 'deploy_preview', calls: 892, avgMs: 8900, category: 'deployment' },
  { name: 'proof_commit', calls: 1203, avgMs: 67, category: 'governance' },
];

const TERMINAL_LINES = [
  { type: 'system', text: 'a11oy code v2.4.0 — governed agentic development environment' },
  { type: 'system', text: 'Session: ses-001 · Agent: Cascade Navigator · Model: claude-sonnet-4' },
  { type: 'system', text: 'Workspace: vessels-maritime/eta-pipeline · 14 files indexed' },
  { type: 'divider', text: '─'.repeat(72) },
  { type: 'user', text: '→ Refactor the ETA calculation to use the new weather API v3 endpoint' },
  { type: 'agent', text: '  Analyzing current ETA pipeline...' },
  { type: 'agent', text: '  Found 3 files referencing weather API v2:' },
  { type: 'file', text: '    src/services/eta-calculator.ts  (L42-89)' },
  { type: 'file', text: '    src/services/weather-client.ts  (L1-67)' },
  { type: 'file', text: '    src/types/weather.ts            (L1-34)' },
  { type: 'agent', text: '  Planning refactor: 3 files, ~120 lines changed' },
  { type: 'agent', text: '  Running type_check... passed ✓' },
  { type: 'agent', text: '  Running test_run (14 tests)... 14/14 passed ✓' },
  { type: 'gate', text: '  ⬡ GOVERNANCE GATE: Changes require VP-Engineering approval' },
  { type: 'gate', text: '    Proof hash: 0x7f3a...e2b1 · Committed to ledger' },
  { type: 'agent', text: '  Refactor complete. Awaiting approval gate.' },
];

const BENCHMARKS = [
  { framework: 'a11oy Code', score: 94.2, governed: true, multiAgent: true, proofChain: true, realtime: true },
  { framework: 'Claude Code', score: 89.1, governed: false, multiAgent: false, proofChain: false, realtime: true },
  { framework: 'Cursor', score: 86.4, governed: false, multiAgent: false, proofChain: false, realtime: true },
  { framework: 'Devin', score: 82.7, governed: false, multiAgent: true, proofChain: false, realtime: false },
  { framework: 'Windsurf', score: 81.3, governed: false, multiAgent: false, proofChain: false, realtime: true },
  { framework: 'Aider', score: 78.9, governed: false, multiAgent: false, proofChain: false, realtime: false },
];

const INFLUENCES = [
  { name: 'OpenAI Agents SDK', author: 'OpenAI', concept: 'Agent orchestration, handoffs, guardrails, tool_use_behavior, RealtimeRunner', integrated: 'Agent runtime, handoff protocol, tool registry, realtime voice sessions' },
  { name: 'Claude Code', author: 'Anthropic', concept: 'Terminal-native agentic coding, file operations, multi-step reasoning', integrated: 'Terminal interface, governed file ops, proof-chain reasoning' },
  { name: 'SWE-bench', author: 'Princeton NLP', concept: 'Real-world software engineering benchmarks', integrated: 'MirrorEval scoring, capability benchmarking' },
  { name: 'AutoGPT / BabyAGI', author: 'Toran Richards / Yohei Nakajima', concept: 'Autonomous task decomposition, recursive planning', integrated: 'Workcell decomposition, recursive task planning' },
  { name: 'LangGraph', author: 'LangChain / Harrison Chase', concept: 'Stateful multi-agent graphs, cyclic workflows', integrated: 'Fabric layer graph topology, stateful workcells' },
  { name: 'CrewAI', author: 'João Moura', concept: 'Role-based agent teams, delegation patterns', integrated: 'Operator roles, vertical-specialist delegation' },
  { name: 'DSPy', author: 'Stanford NLP / Omar Khattab', concept: 'Programmatic prompt optimization, compiled pipelines', integrated: 'Model router optimization, compiled skill chains' },
  { name: 'Semantic Kernel', author: 'Microsoft', concept: 'Plugin architecture, planner patterns', integrated: 'Connector Firewall, skill plugin system' },
];

export function A11oyCode() {
  const [activeTab, setActiveTab] = useState<'terminal' | 'sessions' | 'tools'>('terminal');
  const activeSessions = SESSIONS.filter(s => s.status === 'active').length;
  const totalLines = SESSIONS.reduce((a, s) => a + s.linesChanged, 0);
  const totalCost = SESSIONS.reduce((a, s) => a + parseFloat(s.cost.replace('$', '')), 0);

  return (
    <Layout>
      <PageHeader
        label="AGENTIC DEVELOPMENT ENVIRONMENT"
        title="a11oy Code"
        subtitle="Governed agentic coding — every file operation, refactor, and deployment flows through the proof chain. Multi-agent, multi-model, human-in-the-loop."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <KpiCard label="ACTIVE SESSIONS" value={activeSessions} sub="coding" accent={T.accent} />
        <KpiCard label="LINES CHANGED" value={totalLines.toLocaleString()} sub="today" accent={T.accent} />
        <KpiCard label="TOOLS AVAILABLE" value={TOOL_REGISTRY.length} sub="registered" accent={T.dim} />
        <KpiCard label="AVG LATENCY" value="840ms" sub="tool calls" accent={T.dim} />
        <KpiCard label="COST TODAY" value={`$${totalCost.toFixed(2)}`} sub="all sessions" accent={T.accent} />
        <KpiCard label="PROOF COMMITS" value="1,203" sub="on ledger" accent={T.accent} />
      </div>

      <div className="mb-8">
        <div className="flex gap-1 mb-4">
          {(['terminal', 'sessions', 'tools'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest rounded-md transition-all"
              style={{
                background: activeTab === tab ? 'rgba(201,183,135,0.1)' : 'transparent',
                color: activeTab === tab ? T.accent : T.muted,
                border: `1px solid ${activeTab === tab ? 'rgba(201,183,135,0.2)' : 'transparent'}`,
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'terminal' && (
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}`, background: '#050505' }}>
            <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: T.muted }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: T.muted }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: T.muted }} />
              </div>
              <span className="text-[10px] font-mono ml-2" style={{ color: T.dim }}>a11oy code — ses-001 — Cascade Navigator</span>
              <span className="ml-auto text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(201,183,135,0.1)', color: T.accent, border: '1px solid rgba(201,183,135,0.15)' }}>GOVERNED</span>
            </div>
            <div className="p-4 font-mono text-[11px] leading-relaxed space-y-0.5 max-h-[400px] overflow-y-auto">
              {TERMINAL_LINES.map((line, i) => (
                <div key={i} style={{
                  color: line.type === 'system' ? T.muted
                    : line.type === 'user' ? T.text
                    : line.type === 'file' ? T.accent
                    : line.type === 'gate' ? T.accent
                    : line.type === 'divider' ? T.muted
                    : T.dim,
                  fontWeight: line.type === 'user' ? 600 : 400,
                }}>
                  {line.text}
                </div>
              ))}
              <div className="flex items-center gap-1 mt-2">
                <span style={{ color: T.accent }}>→</span>
                <span className="w-1.5 h-4 animate-pulse" style={{ background: T.accent, opacity: 0.6 }} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-2">
            {SESSIONS.map(s => (
              <div key={s.id} className="rounded-lg p-4 flex items-center gap-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="w-2 h-2 rounded-full" style={{ background: s.status === 'active' ? T.accent : s.status === 'review' ? T.dim : T.muted }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: T.text }}>{s.label}</div>
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: T.dim }}>{s.agent} · {s.model} · {s.files} files · {s.linesChanged} lines</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono" style={{ color: T.accent }}>{s.cost}</div>
                  <div className="text-[9px] font-mono" style={{ color: T.muted }}>{s.duration}</div>
                </div>
                <div className="text-[9px] font-mono px-2 py-0.5 rounded" style={{
                  background: s.status === 'active' ? 'rgba(201,183,135,0.1)' : 'rgba(255,255,255,0.03)',
                  color: s.status === 'active' ? T.accent : T.dim,
                  border: `1px solid ${s.status === 'active' ? 'rgba(201,183,135,0.2)' : T.border}`,
                }}>
                  {s.status.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Tool', 'Category', 'Calls', 'Avg Latency'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider" style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOOL_REGISTRY.map(t => (
                  <tr key={t.name} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                    <td className="px-4 py-2.5 font-mono font-medium" style={{ color: T.text }}>{t.name}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.dim }}>{t.category}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.accent }}>{t.calls.toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.dim }}>{t.avgMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SectionTitle>Capabilities</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        {CAPABILITIES.map(c => (
          <Card key={c.name}>
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs font-medium" style={{ color: T.text }}>{c.name}</div>
              <div className="text-[10px] font-mono" style={{ color: T.accent }}>{c.usage}%</div>
            </div>
            <div className="text-[10px]" style={{ color: T.dim }}>{c.desc}</div>
            <div className="w-full h-1 rounded-full mt-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${c.usage}%`, background: T.accent, opacity: 0.6 }} />
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle>Competitive Positioning</SectionTitle>
      <div className="rounded-lg overflow-hidden mb-10" style={{ border: `1px solid ${T.border}` }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              {['Framework', 'Score', 'Governed', 'Multi-Agent', 'Proof Chain', 'Realtime'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider" style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BENCHMARKS.map((b, i) => (
              <tr key={b.framework} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`, background: i === 0 ? 'rgba(201,183,135,0.03)' : 'transparent' }}>
                <td className="px-4 py-3 font-medium" style={{ color: i === 0 ? T.accent : T.text }}>{b.framework}</td>
                <td className="px-4 py-3 font-mono font-bold" style={{ color: i === 0 ? T.accent : T.dim }}>{b.score}</td>
                {[b.governed, b.multiAgent, b.proofChain, b.realtime].map((v, j) => (
                  <td key={j} className="px-4 py-3 font-mono" style={{ color: v ? T.accent : T.muted }}>{v ? '●' : '○'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionTitle>Architecture Influences</SectionTitle>
      <p className="text-xs mb-4" style={{ color: T.dim }}>
        a11oy Code synthesizes the best patterns from the leading AI agent frameworks — then adds governance, proof chains, and multi-vertical orchestration.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-10">
        {INFLUENCES.map(inf => (
          <Card key={inf.name}>
            <div className="flex justify-between items-start mb-1.5">
              <div className="text-xs font-medium" style={{ color: T.text }}>{inf.name}</div>
              <div className="text-[9px] font-mono" style={{ color: T.muted }}>{inf.author}</div>
            </div>
            <div className="text-[10px] mb-2" style={{ color: T.dim }}>{inf.concept}</div>
            <div className="text-[10px] font-mono" style={{ color: T.accent }}>→ {inf.integrated}</div>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
