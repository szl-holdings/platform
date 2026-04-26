import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

const T = {
  bg: '#0a0a0a', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

interface ExternalAgent {
  id: string;
  name: string;
  vendor: string;
  category: 'coding' | 'orchestration' | 'research' | 'infrastructure';
  status: 'harnessed' | 'available' | 'evaluating';
  protocol: string;
  capabilities: string[];
  harnessMode: string;
  tasksRouted: number;
  avgLatency: string;
  trustScore: number;
  costPer1k: string;
  governanceAdapter: string;
  description: string;
}

const EXTERNAL_AGENTS: ExternalAgent[] = [
  {
    id: 'ext-codex', name: 'OpenAI Codex', vendor: 'OpenAI', category: 'coding', status: 'harnessed',
    protocol: 'Responses API + Agents SDK', capabilities: ['Code generation', 'Multi-file editing', 'Sandbox execution', 'PR creation', 'Test synthesis'],
    harnessMode: 'Full orchestration — a11oy dispatches tasks, Codex executes in sandboxed workspace, results flow through proof chain',
    tasksRouted: 2847, avgLatency: '4.2s', trustScore: 92, costPer1k: '$8.40',
    governanceAdapter: 'CodexGovernanceAdapter — wraps all file ops in proof hashes, enforces code review gates, applies guardrails before merge',
    description: 'OpenAI\'s cloud-based coding agent. a11oy harnesses Codex for high-throughput code generation tasks, sandboxed execution, and automated PR workflows — all governed by the proof chain.',
  },
  {
    id: 'ext-cursor', name: 'Cursor', vendor: 'Anysphere', category: 'coding', status: 'harnessed',
    protocol: 'LSP Bridge + Agent Protocol', capabilities: ['Inline editing', 'Codebase-aware completion', 'Multi-file refactoring', 'Tab prediction', 'Chat-driven development'],
    harnessMode: 'IDE delegation — a11oy routes focused editing tasks to Cursor agent, captures diffs through governance layer',
    tasksRouted: 1923, avgLatency: '1.8s', trustScore: 89, costPer1k: '$4.20',
    governanceAdapter: 'CursorBridgeAdapter — intercepts all edits, validates against policy, injects proof metadata into commit chain',
    description: 'AI-first code editor with deep codebase understanding. a11oy harnesses Cursor for precision inline editing and refactoring, routing results through guardrails before acceptance.',
  },
  {
    id: 'ext-claude-code', name: 'Claude Code', vendor: 'Anthropic', category: 'coding', status: 'harnessed',
    protocol: 'Terminal Agent Protocol', capabilities: ['Terminal-native coding', 'Multi-step reasoning', 'Git workflow', 'Test-driven development', 'Deep code analysis'],
    harnessMode: 'Terminal co-pilot — a11oy delegates complex reasoning tasks, Claude Code operates in governed terminal session',
    tasksRouted: 3241, avgLatency: '6.1s', trustScore: 94, costPer1k: '$12.60',
    governanceAdapter: 'ClaudeCodeAdapter — session isolation, output validation, proof chain integration, cost tracking per session',
    description: 'Anthropic\'s terminal-native coding agent. a11oy harnesses Claude Code for deep multi-step reasoning, complex refactors, and architectural analysis — the strongest reasoning engine in the mesh.',
  },
  {
    id: 'ext-devin', name: 'Devin', vendor: 'Cognition', category: 'coding', status: 'harnessed',
    protocol: 'Workspace API', capabilities: ['Autonomous engineering', 'Full SDLC', 'Browser interaction', 'Deployment', 'Issue-to-PR pipeline'],
    harnessMode: 'Autonomous delegate — a11oy assigns full issues, Devin operates autonomously, results reviewed by MirrorEval',
    tasksRouted: 487, avgLatency: '12.4m', trustScore: 81, costPer1k: '$42.00',
    governanceAdapter: 'DevinSandboxAdapter — full isolation, human-in-the-loop gates on PRs, MirrorEval quality scoring before merge',
    description: 'Cognition\'s autonomous software engineer. a11oy harnesses Devin for full issue-to-PR workflows, complete with browser testing and deployment — highest autonomy, tightest governance.',
  },
  {
    id: 'ext-copilot', name: 'GitHub Copilot', vendor: 'GitHub / Microsoft', category: 'coding', status: 'harnessed',
    protocol: 'Copilot Extensions API', capabilities: ['Inline suggestions', 'Chat', 'PR review', 'Security scanning', 'Workspace agent'],
    harnessMode: 'Suggestion stream — a11oy captures Copilot suggestions, routes through guardrails, logs accepted completions to proof chain',
    tasksRouted: 8492, avgLatency: '340ms', trustScore: 87, costPer1k: '$2.10',
    governanceAdapter: 'CopilotStreamAdapter — filters suggestions against policy, blocks non-compliant patterns, proof-logs accepted completions',
    description: 'GitHub\'s AI pair programmer. a11oy harnesses Copilot for high-frequency inline suggestions — the fastest response time in the mesh, governed at the keystroke level.',
  },
  {
    id: 'ext-windsurf', name: 'Windsurf', vendor: 'Codeium', category: 'coding', status: 'harnessed',
    protocol: 'Flow Protocol', capabilities: ['Cascade flows', 'Deep context', 'Multi-file editing', 'Terminal commands', 'Auto-debugging'],
    harnessMode: 'Flow routing — a11oy triggers Windsurf cascade flows for specific refactoring patterns, captures outputs',
    tasksRouted: 1247, avgLatency: '2.3s', trustScore: 85, costPer1k: '$3.80',
    governanceAdapter: 'WindsurfFlowAdapter — flow output validation, policy compliance check, proof chain attachment',
    description: 'Codeium\'s agentic IDE with cascade flows. a11oy harnesses Windsurf for fluid multi-step editing workflows — deep context awareness with governed output validation.',
  },
  {
    id: 'ext-amazon-q', name: 'Amazon Q Developer', vendor: 'AWS', category: 'coding', status: 'available',
    protocol: 'AWS SDK + Q API', capabilities: ['Code transformation', 'Java upgrades', 'Security remediation', 'AWS integration', 'Feature development'],
    harnessMode: 'AWS-native tasks — a11oy routes AWS infrastructure and Java modernization tasks through Q Developer',
    tasksRouted: 342, avgLatency: '8.7s', trustScore: 83, costPer1k: '$6.30',
    governanceAdapter: 'AmazonQAdapter — IAM-scoped execution, CloudTrail audit logging, proof chain bridge for AWS actions',
    description: 'AWS\'s AI developer assistant. a11oy harnesses Q Developer for cloud infrastructure tasks, Java transformations, and AWS-native security remediation.',
  },
  {
    id: 'ext-jules', name: 'Jules', vendor: 'Google', category: 'coding', status: 'evaluating',
    protocol: 'Gemini API + Workspace Protocol', capabilities: ['Async coding', 'GitHub integration', 'Multi-step plans', 'Code review', 'Bug fixing'],
    harnessMode: 'Async delegation — a11oy assigns tasks, Jules operates asynchronously, results queued for governance review',
    tasksRouted: 89, avgLatency: '18.2m', trustScore: 78, costPer1k: '$9.10',
    governanceAdapter: 'JulesAsyncAdapter — async result queue, quality gate before acceptance, proof chain on completion',
    description: 'Google\'s asynchronous AI coding agent built on Gemini. a11oy evaluates Jules for long-running async tasks — lowest cost for batch workloads.',
  },
  {
    id: 'ext-augment', name: 'Augment Code', vendor: 'Augment', category: 'coding', status: 'available',
    protocol: 'Agent Protocol v1', capabilities: ['Enterprise codebase understanding', 'Cross-repo context', 'Code review', 'Documentation', 'Onboarding'],
    harnessMode: 'Enterprise context — a11oy leverages Augment for cross-repository understanding and enterprise-scale documentation',
    tasksRouted: 214, avgLatency: '3.4s', trustScore: 86, costPer1k: '$5.20',
    governanceAdapter: 'AugmentContextAdapter — context boundary enforcement, IP protection guardrails, proof chain on document generation',
    description: 'Enterprise-grade AI coding assistant with deep codebase understanding. a11oy harnesses Augment for cross-repository analysis and enterprise documentation.',
  },
  {
    id: 'ext-cody', name: 'Sourcegraph Cody', vendor: 'Sourcegraph', category: 'coding', status: 'available',
    protocol: 'Sourcegraph API', capabilities: ['Code search', 'Cross-repo context', 'Code explanation', 'Unit test generation', 'Bug detection'],
    harnessMode: 'Search + context — a11oy uses Cody for enterprise code search and cross-repository context retrieval',
    tasksRouted: 567, avgLatency: '1.2s', trustScore: 88, costPer1k: '$3.10',
    governanceAdapter: 'CodySearchAdapter — search scope enforcement, access control validation, proof chain on retrieved context',
    description: 'Sourcegraph\'s AI coding assistant with unmatched code search. a11oy harnesses Cody for code intelligence across massive monorepos.',
  },
  {
    id: 'ext-v0', name: 'v0', vendor: 'Vercel', category: 'coding', status: 'harnessed',
    protocol: 'Generative UI API', capabilities: ['UI generation', 'React components', 'Tailwind styling', 'Responsive design', 'Iteration'],
    harnessMode: 'UI specialist — a11oy routes all frontend component generation tasks to v0, applies design system governance',
    tasksRouted: 923, avgLatency: '7.8s', trustScore: 84, costPer1k: '$5.60',
    governanceAdapter: 'V0DesignAdapter — design system compliance check, accessibility validation, brand governance enforcement',
    description: 'Vercel\'s generative UI platform. a11oy harnesses v0 for rapid UI component generation — then governs output against the design system and accessibility standards.',
  },
  {
    id: 'ext-replit', name: 'Replit Agent', vendor: 'Replit', category: 'coding', status: 'harnessed',
    protocol: 'Workspace Protocol', capabilities: ['Full-stack development', 'Deployment', 'Database setup', 'Package management', 'Iteration'],
    harnessMode: 'Full-stack delegate — a11oy routes complete application builds to Replit Agent for rapid prototyping',
    tasksRouted: 412, avgLatency: '2.1m', trustScore: 86, costPer1k: '$7.20',
    governanceAdapter: 'ReplitAgentAdapter — workspace isolation, deployment governance, proof chain on infrastructure changes',
    description: 'Replit\'s full-stack development agent. a11oy harnesses Replit Agent for rapid application scaffolding, deployment, and iteration — complete environments in minutes.',
  },
  {
    id: 'ext-langgraph', name: 'LangGraph', vendor: 'LangChain', category: 'orchestration', status: 'harnessed',
    protocol: 'LangGraph Cloud API', capabilities: ['Stateful workflows', 'Cyclic graphs', 'Human-in-the-loop', 'Persistence', 'Streaming'],
    harnessMode: 'Workflow engine — a11oy uses LangGraph for complex stateful multi-agent workflow definitions',
    tasksRouted: 1847, avgLatency: '890ms', trustScore: 91, costPer1k: '$1.40',
    governanceAdapter: 'LangGraphWorkflowAdapter — state validation, checkpoint governance, proof chain on workflow transitions',
    description: 'LangChain\'s stateful multi-agent orchestration framework. a11oy harnesses LangGraph for complex workflow graphs — cyclic, persistent, and governed.',
  },
  {
    id: 'ext-crewai', name: 'CrewAI', vendor: 'CrewAI', category: 'orchestration', status: 'available',
    protocol: 'Crew Protocol', capabilities: ['Role-based agents', 'Task delegation', 'Sequential/parallel execution', 'Memory', 'Tool use'],
    harnessMode: 'Team assembly — a11oy uses CrewAI patterns for vertical-specific agent team composition',
    tasksRouted: 723, avgLatency: '2.1s', trustScore: 84, costPer1k: '$2.80',
    governanceAdapter: 'CrewAITeamAdapter — role validation, delegation governance, proof chain on team decisions',
    description: 'Role-based multi-agent orchestration. a11oy harnesses CrewAI\'s delegation patterns for assembling vertical-specialist teams with governed execution.',
  },
  {
    id: 'ext-perplexity', name: 'Perplexity', vendor: 'Perplexity AI', category: 'research', status: 'harnessed',
    protocol: 'Sonar API', capabilities: ['Real-time search', 'Citation-backed answers', 'Deep research', 'Multi-step reasoning', 'Source verification'],
    harnessMode: 'Research engine — a11oy routes all real-time knowledge queries through Perplexity, governs citation accuracy',
    tasksRouted: 4123, avgLatency: '2.8s', trustScore: 90, costPer1k: '$1.80',
    governanceAdapter: 'PerplexityResearchAdapter — citation verification, source trust scoring, proof chain on research outputs',
    description: 'Real-time AI search with citations. a11oy harnesses Perplexity for live intelligence gathering — every answer citation-verified and proof-chained.',
  },
  {
    id: 'ext-mcp', name: 'MCP Servers', vendor: 'Anthropic (Open Standard)', category: 'infrastructure', status: 'harnessed',
    protocol: 'Model Context Protocol', capabilities: ['Tool serving', 'Resource access', 'Prompt templates', 'Dynamic tool discovery', 'Cross-agent tool sharing'],
    harnessMode: 'Universal tool bus — a11oy\'s Connector Firewall governs all MCP tool servers, unifying tool access across the mesh',
    tasksRouted: 12847, avgLatency: '45ms', trustScore: 96, costPer1k: '$0.02',
    governanceAdapter: 'MCPFirewallAdapter — tool-level access control, rate limiting, cost tracking, proof chain on every tool call',
    description: 'The universal tool protocol. a11oy governs the MCP bus — every tool server, every tool call, every result flows through the Connector Firewall with proof chain verification.',
  },
];

const ROUTING_RULES = [
  { pattern: 'Inline code completion', routed: 'GitHub Copilot', reason: 'Lowest latency (340ms), highest throughput for keystroke-level suggestions', fallback: 'Windsurf' },
  { pattern: 'Multi-file refactoring', routed: 'Claude Code', reason: 'Strongest multi-step reasoning, highest trust score for complex changes', fallback: 'Cursor' },
  { pattern: 'Full issue-to-PR', routed: 'Devin', reason: 'Highest autonomy, handles complete SDLC workflows', fallback: 'Codex' },
  { pattern: 'UI component generation', routed: 'v0', reason: 'Best-in-class generative UI with React/Tailwind', fallback: 'Replit Agent' },
  { pattern: 'Code generation (bulk)', routed: 'OpenAI Codex', reason: 'Fastest sandboxed execution, best cost/throughput ratio for generation', fallback: 'Claude Code' },
  { pattern: 'Precision editing', routed: 'Cursor', reason: 'Best inline editing UX, deep codebase-aware predictions', fallback: 'Windsurf' },
  { pattern: 'Full-stack scaffolding', routed: 'Replit Agent', reason: 'Complete environment setup — database, deployment, packages', fallback: 'Devin' },
  { pattern: 'Real-time research', routed: 'Perplexity', reason: 'Citation-backed, real-time search with source verification', fallback: 'Claude Code' },
  { pattern: 'Cross-repo analysis', routed: 'Augment Code / Cody', reason: 'Enterprise-scale codebase understanding and search', fallback: 'Claude Code' },
  { pattern: 'Workflow orchestration', routed: 'LangGraph', reason: 'Stateful, persistent, cyclic workflow graphs', fallback: 'CrewAI' },
  { pattern: 'AWS infrastructure', routed: 'Amazon Q Developer', reason: 'Native AWS integration, IAM-scoped execution', fallback: 'Codex' },
  { pattern: 'Tool interop', routed: 'MCP Servers', reason: 'Universal protocol, governed by Connector Firewall', fallback: 'Direct API' },
];

const GOVERNANCE_TERMINAL = [
  { type: 'system', text: 'a11oy agent-mesh v2.4.0 — universal agentic harness' },
  { type: 'system', text: '16 external agents registered · 12 harnessed · 3 available · 1 evaluating' },
  { type: 'system', text: 'Governance mode: FULL · Proof chain: ACTIVE · MirrorEval: CONTINUOUS' },
  { type: 'divider', text: '─'.repeat(76) },
  { type: 'user', text: '→ Refactor the auth service to support multi-tenant JWT validation' },
  { type: 'router', text: '  [MESH ROUTER] Analyzing task complexity...' },
  { type: 'router', text: '  Task type: Multi-file refactoring · Complexity: HIGH · Files: ~8' },
  { type: 'router', text: '  Routing to: Claude Code (strongest reasoning for complex refactors)' },
  { type: 'router', text: '  Fallback: Cursor · Cost estimate: $0.14 · ETA: ~6 minutes' },
  { type: 'handoff', text: '  ⬡ HANDOFF: a11oy → Claude Code [session: cc-4821]' },
  { type: 'agent', text: '  [CLAUDE CODE] Analyzing auth service architecture...' },
  { type: 'agent', text: '  [CLAUDE CODE] Found 8 files, 4 interfaces, 2 middleware layers' },
  { type: 'agent', text: '  [CLAUDE CODE] Planning: Add TenantContext, update JWT verification, modify middleware' },
  { type: 'guardrail', text: '  [GUARDRAIL] security_review — scanning proposed changes for vulnerabilities' },
  { type: 'guardrail', text: '  [GUARDRAIL] security_review — PASSED (no new attack surface detected)' },
  { type: 'agent', text: '  [CLAUDE CODE] Requesting Copilot for inline type completion...' },
  { type: 'handoff', text: '  ⬡ SUB-HANDOFF: Claude Code → GitHub Copilot [type completions]' },
  { type: 'agent', text: '  [COPILOT] 12 type completions generated · 340ms' },
  { type: 'agent', text: '  [CLAUDE CODE] Refactor complete. 8 files, 247 lines changed.' },
  { type: 'gate', text: '  ⬡ GOVERNANCE GATE: MirrorEval quality assessment' },
  { type: 'gate', text: '  [MIRROREVAL] Score: 94.2 · No regression · No bias detected' },
  { type: 'gate', text: '  ⬡ PROOF CHAIN: Hash 0x8f2a...c4d1 committed to ledger' },
  { type: 'system', text: '  Refactor complete. Awaiting human approval for merge.' },
];

export function AgentMesh() {
  const [tab, setTab] = useState<'mesh' | 'routing' | 'terminal' | 'governance'>('mesh');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const harnessed = EXTERNAL_AGENTS.filter(a => a.status === 'harnessed').length;
  const totalTasksRouted = EXTERNAL_AGENTS.reduce((a, ag) => a + ag.tasksRouted, 0);
  const avgTrust = Math.round(EXTERNAL_AGENTS.reduce((a, ag) => a + ag.trustScore, 0) / EXTERNAL_AGENTS.length);
  const selected = EXTERNAL_AGENTS.find(a => a.id === selectedAgent);
  const filteredAgents = statusFilter === 'all' ? EXTERNAL_AGENTS : EXTERNAL_AGENTS.filter(a => a.status === statusFilter);

  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setPulse(p => (p + 1) % 4), 2000);
    return () => clearInterval(iv);
  }, []);

  return (
    <Layout>
      <PageHeader
        label="UNIVERSAL AGENTIC HARNESS"
        title="Agent Mesh"
        subtitle="a11oy orchestrates every major agentic AI — Codex, Cursor, Claude Code, Devin, Copilot, Windsurf, Replit, Perplexity, LangGraph, MCP — all governed by one proof chain."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <KpiCard label="EXTERNAL AGENTS" value={EXTERNAL_AGENTS.length} sub="registered" accent={T.accent} />
        <KpiCard label="HARNESSED" value={harnessed} sub="governed" accent={T.accent} />
        <KpiCard label="TASKS ROUTED" value={totalTasksRouted.toLocaleString()} sub="total" accent={T.accent} />
        <KpiCard label="AVG TRUST" value={avgTrust} sub="mesh score" accent={T.dim} />
        <KpiCard label="ROUTING RULES" value={ROUTING_RULES.length} sub="active" accent={T.dim} />
        <KpiCard label="GOVERNANCE" value="FULL" sub="proof chain" accent={T.accent} />
      </div>

      <div className="flex gap-1 mb-6">
        {(['mesh', 'routing', 'terminal', 'governance'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest rounded-md transition-all" style={{ background: tab === t ? 'rgba(201,183,135,0.1)' : 'transparent', color: tab === t ? T.accent : T.muted, border: `1px solid ${tab === t ? 'rgba(201,183,135,0.2)' : 'transparent'}` }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'mesh' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Harnessed Agents</SectionTitle>
            <div className="flex gap-1">
              {['all', 'harnessed', 'available', 'evaluating'].map(f => (
                <button key={f} onClick={() => setStatusFilter(f)} className="px-3 py-1 text-[9px] font-mono uppercase tracking-wider rounded transition-all" style={{ background: statusFilter === f ? 'rgba(201,183,135,0.08)' : 'transparent', color: statusFilter === f ? T.accent : T.muted }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-2">
              {filteredAgents.map(ag => (
                <button key={ag.id} onClick={() => setSelectedAgent(ag.id)} className="w-full text-left rounded-lg p-4 transition-all" style={{ background: selectedAgent === ag.id ? 'rgba(201,183,135,0.05)' : T.surface, border: `1px solid ${selectedAgent === ag.id ? 'rgba(201,183,135,0.2)' : T.border}` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: ag.status === 'harnessed' ? T.accent : ag.status === 'available' ? T.dim : T.muted }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium" style={{ color: T.text }}>{ag.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: ag.status === 'harnessed' ? 'rgba(201,183,135,0.08)' : 'rgba(255,255,255,0.04)', color: ag.status === 'harnessed' ? T.accent : T.dim, border: `1px solid ${ag.status === 'harnessed' ? 'rgba(201,183,135,0.12)' : T.border}` }}>{ag.status}</span>
                        <span className="text-[9px] font-mono" style={{ color: T.muted }}>{ag.vendor}</span>
                      </div>
                      <div className="text-[10px] font-mono mt-0.5" style={{ color: T.dim }}>{ag.category} · Trust: {ag.trustScore} · {ag.tasksRouted.toLocaleString()} tasks</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono" style={{ color: T.accent }}>{ag.avgLatency}</div>
                      <div className="text-[9px] font-mono" style={{ color: T.muted }}>{ag.costPer1k}/1k</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div>
              {selected ? (
                <div className="rounded-lg p-5 sticky top-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm font-medium" style={{ color: T.text }}>{selected.name}</div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: selected.status === 'harnessed' ? 'rgba(201,183,135,0.08)' : 'rgba(255,255,255,0.04)', color: selected.status === 'harnessed' ? T.accent : T.dim }}>{selected.status}</span>
                  </div>
                  <div className="text-[10px] font-mono mb-4" style={{ color: T.dim }}>{selected.vendor} · {selected.category}</div>

                  <div className="text-[10px] leading-relaxed mb-4" style={{ color: T.dim }}>{selected.description}</div>

                  <div className="text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: T.muted }}>Protocol</div>
                  <p className="text-[11px] font-mono mb-3" style={{ color: T.accent }}>{selected.protocol}</p>

                  <div className="text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: T.muted }}>Harness Mode</div>
                  <p className="text-[10px] leading-relaxed mb-3" style={{ color: T.dim }}>{selected.harnessMode}</p>

                  <div className="text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: T.muted }}>Capabilities</div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {selected.capabilities.map(c => (
                      <span key={c} className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(201,183,135,0.06)', color: T.accent, border: '1px solid rgba(201,183,135,0.1)' }}>{c}</span>
                    ))}
                  </div>

                  <div className="text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: T.muted }}>Governance Adapter</div>
                  <p className="text-[10px] leading-relaxed mb-3" style={{ color: T.dim }}>{selected.governanceAdapter}</p>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
                    <div><div className="text-[9px] font-mono" style={{ color: T.muted }}>Trust Score</div><div className="text-lg font-bold font-mono" style={{ color: T.accent }}>{selected.trustScore}</div></div>
                    <div><div className="text-[9px] font-mono" style={{ color: T.muted }}>Tasks Routed</div><div className="text-lg font-bold font-mono" style={{ color: T.text }}>{selected.tasksRouted.toLocaleString()}</div></div>
                    <div><div className="text-[9px] font-mono" style={{ color: T.muted }}>Avg Latency</div><div className="text-lg font-bold font-mono" style={{ color: T.dim }}>{selected.avgLatency}</div></div>
                    <div><div className="text-[9px] font-mono" style={{ color: T.muted }}>Cost / 1k</div><div className="text-lg font-bold font-mono" style={{ color: T.dim }}>{selected.costPer1k}</div></div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg p-8 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                  <div className="text-xs" style={{ color: T.muted }}>Select an agent to inspect</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'routing' && (
        <>
          <SectionTitle>Intelligent Routing</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim }}>
            a11oy's mesh router analyzes every task and routes it to the optimal external agent — balancing latency, cost, trust score, and capability fit. Every routing decision is proof-chained.
          </p>
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Task Pattern', 'Routes To', 'Reason', 'Fallback'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider" style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROUTING_RULES.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: T.text }}>{r.pattern}</td>
                    <td className="px-4 py-3 font-mono" style={{ color: T.accent }}>{r.routed}</td>
                    <td className="px-4 py-3" style={{ color: T.dim, maxWidth: 300 }}>{r.reason}</td>
                    <td className="px-4 py-3 font-mono" style={{ color: T.muted }}>{r.fallback}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'terminal' && (
        <>
          <SectionTitle>Mesh in Action</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim }}>
            Watch a11oy orchestrate multiple external agents to complete a complex task — routing, handoffs, guardrails, sub-delegation, and proof chain — all unified.
          </p>
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}`, background: '#050505' }}>
            <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: T.muted }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: T.muted }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: T.muted }} />
              </div>
              <span className="text-[10px] font-mono ml-2" style={{ color: T.dim }}>a11oy agent-mesh — multi-agent orchestration</span>
              <span className="ml-auto text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(201,183,135,0.1)', color: T.accent, border: '1px solid rgba(201,183,135,0.15)' }}>GOVERNED</span>
            </div>
            <div className="p-4 font-mono text-[11px] leading-relaxed space-y-0.5 max-h-[500px] overflow-y-auto">
              {GOVERNANCE_TERMINAL.map((line, i) => (
                <div key={i} style={{
                  color: line.type === 'system' ? T.muted
                    : line.type === 'user' ? T.text
                    : line.type === 'router' ? '#c9b787'
                    : line.type === 'handoff' ? T.accent
                    : line.type === 'agent' ? T.dim
                    : line.type === 'guardrail' ? T.text
                    : line.type === 'gate' ? T.accent
                    : T.muted,
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
        </>
      )}

      {tab === 'governance' && (
        <>
          <SectionTitle>Governance Architecture</SectionTitle>
          <p className="text-xs mb-6" style={{ color: T.dim }}>
            Every external agent operates within a11oy's governance envelope. No output reaches production without proof chain verification, guardrail validation, and MirrorEval assessment.
          </p>
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <div className="text-[9px] font-mono uppercase tracking-wider mb-3" style={{ color: T.muted }}>Governance Layers</div>
              <div className="space-y-3">
                {[
                  { layer: 'Routing Layer', desc: 'Task analysis → optimal agent selection → cost/latency/trust optimization' },
                  { layer: 'Session Isolation', desc: 'Each external agent runs in a sandboxed session with scoped permissions' },
                  { layer: 'Guardrail Envelope', desc: 'Input guardrails before dispatch, output guardrails before acceptance' },
                  { layer: 'Proof Chain', desc: 'Every action, handoff, and output anchored to a cryptographic proof hash' },
                  { layer: 'MirrorEval Gate', desc: 'Continuous quality assessment — bias detection, drift scoring, regression checks' },
                  { layer: 'Human-in-the-Loop', desc: 'Configurable approval gates based on risk level, cost threshold, or scope' },
                  { layer: 'Cost Control', desc: 'Per-session, per-agent, and per-task cost limits with automatic cutoff' },
                  { layer: 'Audit Trail', desc: 'Complete provenance — which agent, which model, which tools, which human approved' },
                ].map(l => (
                  <div key={l.layer} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: T.accent }} />
                    <div>
                      <div className="text-[11px] font-medium" style={{ color: T.text }}>{l.layer}</div>
                      <div className="text-[10px]" style={{ color: T.dim }}>{l.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <div className="text-[9px] font-mono uppercase tracking-wider mb-3" style={{ color: T.muted }}>Why This Doesn't Exist</div>
              <div className="text-[11px] leading-relaxed space-y-3" style={{ color: T.dim }}>
                <p>Every agentic AI today operates in isolation. Codex doesn't talk to Claude Code. Cursor doesn't hand off to Devin. Copilot doesn't route to Perplexity. There is no governance layer across any of them.</p>
                <p style={{ color: T.text }}>a11oy is the first platform to treat every agentic AI as a governed resource in a unified mesh.</p>
                <p>The mesh router doesn't just pick the best agent — it orchestrates multi-agent collaboration across vendors, applies consistent governance, and anchors every decision to a proof chain that investors, auditors, and regulators can verify.</p>
                <p>This is not a wrapper. This is an orchestration fabric — the same architecture that governs a11oy's internal agents now extends to every major external agentic AI.</p>
              </div>
            </Card>
          </div>

          <Card>
            <div className="text-[9px] font-mono uppercase tracking-wider mb-3" style={{ color: T.muted }}>Adapter Pattern</div>
            <pre className="font-mono text-[11px] leading-relaxed overflow-x-auto" style={{ color: T.dim }}>
{`class GovernanceAdapter:
    """Base adapter that wraps any external agentic AI in a11oy governance."""

    def __init__(self, agent_config, proof_chain, guardrails):
        self.agent = agent_config
        self.proof = proof_chain
        self.guardrails = guardrails

    async def execute(self, task, context):
        # 1. Input guardrails
        for g in self.guardrails.input:
            await g.validate(task, context)

        # 2. Dispatch to external agent
        session = await self.agent.create_session(task, context)
        result = await session.run()

        # 3. Output guardrails
        for g in self.guardrails.output:
            await g.validate(result)

        # 4. MirrorEval quality gate
        eval_score = await mirror_eval.assess(result)
        if eval_score < threshold:
            raise QualityGateFailure(eval_score)

        # 5. Proof chain commitment
        proof_hash = await self.proof.commit(
            agent=self.agent.name,
            task=task,
            result=result,
            eval_score=eval_score,
        )

        return GovernedResult(result, proof_hash, eval_score)`}
            </pre>
          </Card>
        </>
      )}
    </Layout>
  );
}
