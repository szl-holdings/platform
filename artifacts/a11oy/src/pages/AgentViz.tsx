import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

const T = {
  bg: '#0a0a0a', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

interface TraceNode {
  id: string;
  type: 'agent' | 'tool' | 'handoff' | 'guardrail' | 'human' | 'output';
  label: string;
  detail: string;
  durationMs: number;
  status: 'success' | 'pending' | 'blocked';
  depth: number;
  children: string[];
  model?: string;
  cost?: string;
  proofHash?: string;
}

const TRACE_NODES: TraceNode[] = [
  { id: 'n0', type: 'agent', label: 'Voice Interface', detail: 'Incoming voice session — semantic VAD active', durationMs: 0, status: 'success', depth: 0, children: ['n1'], model: 'gpt-realtime-1.5' },
  { id: 'n1', type: 'guardrail', label: 'pii_redaction', detail: 'Input screened — no PII detected', durationMs: 12, status: 'success', depth: 1, children: ['n2'] },
  { id: 'n2', type: 'handoff', label: 'Voice → Cascade', detail: 'Maritime context detected in utterance', durationMs: 120, status: 'success', depth: 1, children: ['n3'], proofHash: '0x7f3a...e2b1' },
  { id: 'n3', type: 'agent', label: 'Cascade Navigator', detail: 'Processing: "What is the ETA for Horizon Star?"', durationMs: 340, status: 'success', depth: 2, children: ['n4', 'n5'], model: 'claude-sonnet-4', cost: '$0.003' },
  { id: 'n4', type: 'tool', label: 'vessel_lookup', detail: 'IMO 9834521 → Horizon Star, Position: 1.2°N 103.8°E', durationMs: 89, status: 'success', depth: 3, children: [] },
  { id: 'n5', type: 'tool', label: 'eta_calc', detail: 'Route: Current → Port Klang, ETA: 14.2h, Confidence: 0.94', durationMs: 210, status: 'success', depth: 3, children: ['n6'] },
  { id: 'n6', type: 'guardrail', label: 'sanctions_check', detail: 'Horizon Star — OFAC/EU/UN clear', durationMs: 45, status: 'success', depth: 3, children: ['n7'] },
  { id: 'n7', type: 'output', label: 'Response', detail: 'ETA 14h to Port Klang. No sanctions risk. Fuel 2% below baseline.', durationMs: 0, status: 'success', depth: 2, children: ['n8'], proofHash: '0x2c91...f4a8' },
  { id: 'n8', type: 'agent', label: 'Cascade Navigator', detail: 'Follow-up: "Show me the route optimization"', durationMs: 280, status: 'success', depth: 2, children: ['n9', 'n10'], model: 'claude-sonnet-4', cost: '$0.004' },
  { id: 'n9', type: 'tool', label: 'route_opt', detail: '3 alternatives scored. Optimal: via Malacca Strait, saves 2.1h', durationMs: 1200, status: 'success', depth: 3, children: [] },
  { id: 'n10', type: 'tool', label: 'weather_api', detail: 'Conditions: Clear, Wind NE 12kt, Sea state 2', durationMs: 340, status: 'success', depth: 3, children: ['n11'] },
  { id: 'n11', type: 'handoff', label: 'Cascade → Oracle', detail: 'Route change impacts fuel budget — routing to Pipeline Oracle', durationMs: 180, status: 'success', depth: 3, children: ['n12'], proofHash: '0x4e87...1c3d' },
  { id: 'n12', type: 'agent', label: 'Pipeline Oracle', detail: 'Assessing fuel cost impact of route change', durationMs: 420, status: 'success', depth: 4, children: ['n13'], model: 'gpt-4o', cost: '$0.002' },
  { id: 'n13', type: 'guardrail', label: 'cost_threshold', detail: 'Route change cost delta: $12,400 — within threshold', durationMs: 8, status: 'success', depth: 4, children: ['n14'] },
  { id: 'n14', type: 'human', label: 'Approval Gate', detail: 'Route change requires VP-Operations approval — pending', durationMs: 0, status: 'pending', depth: 4, children: ['n15'] },
  { id: 'n15', type: 'output', label: 'Final Output', detail: 'Route optimization ready. Saves 2.1h, costs $12.4K additional fuel. Awaiting VP approval.', durationMs: 0, status: 'blocked', depth: 2, children: [], proofHash: '0x9d12...7b4e' },
];

const LIVE_RUNS = [
  { id: 'run-001', agent: 'Cascade Navigator', task: 'Fleet position monitoring — 12 vessels', status: 'active', duration: '47m', events: 234, model: 'claude-sonnet-4' },
  { id: 'run-002', agent: 'Guardian', task: 'Threat intel feed processing — STIX/TAXII', status: 'active', duration: '2h 14m', events: 1847, model: 'claude-sonnet-4' },
  { id: 'run-003', agent: 'Counsel Sentinel', task: 'Deadline scan — 8 active matters', status: 'active', duration: '12m', events: 47, model: 'gpt-4o' },
  { id: 'run-004', agent: 'MirrorEval', task: 'Continuous evaluation — all agent outputs', status: 'active', duration: '24h', events: 12847, model: 'claude-sonnet-4' },
  { id: 'run-005', agent: 'Voice Interface', task: 'Active voice session — demo user', status: 'active', duration: '3m', events: 12, model: 'gpt-realtime-1.5' },
];

const TYPE_STYLES: Record<string, { bg: string; border: string; color: string; icon: string }> = {
  agent: { bg: 'rgba(201,183,135,0.06)', border: 'rgba(201,183,135,0.15)', color: T.accent, icon: '⬡' },
  tool: { bg: 'rgba(138,138,138,0.06)', border: 'rgba(138,138,138,0.15)', color: T.dim, icon: '◆' },
  handoff: { bg: 'rgba(201,183,135,0.08)', border: 'rgba(201,183,135,0.2)', color: T.accent, icon: '→' },
  guardrail: { bg: 'rgba(245,245,245,0.04)', border: 'rgba(245,245,245,0.1)', color: T.text, icon: '⬢' },
  human: { bg: 'rgba(201,183,135,0.08)', border: 'rgba(201,183,135,0.2)', color: T.accent, icon: '○' },
  output: { bg: 'rgba(94,94,94,0.06)', border: 'rgba(94,94,94,0.15)', color: T.muted, icon: '◇' },
};

function TraceWaterfall({ nodes }: { nodes: TraceNode[] }) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(nodes.map(n => n.id)));
  const maxDuration = Math.max(...nodes.map(n => n.durationMs), 1);

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}`, background: '#050505' }}>
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.02)' }}>
        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: T.dim }}>Execution Trace — Waterfall View</span>
        <span className="text-[9px] font-mono" style={{ color: T.accent }}>{nodes.length} nodes · {nodes.filter(n => n.proofHash).length} proofs</span>
      </div>
      <div className="p-3 space-y-1">
        {nodes.map(node => {
          const style = TYPE_STYLES[node.type];
          const isExpanded = expandedNodes.has(node.id);
          return (
            <button
              key={node.id}
              onClick={() => toggleNode(node.id)}
              className="w-full text-left rounded-md p-2.5 transition-all hover:brightness-110"
              style={{
                background: style.bg,
                border: `1px solid ${style.border}`,
                marginLeft: node.depth * 20,
                width: `calc(100% - ${node.depth * 20}px)`,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px]" style={{ color: style.color }}>{style.icon}</span>
                <span className="text-[11px] font-mono font-medium" style={{ color: style.color }}>{node.label}</span>
                {node.model && <span className="text-[9px] font-mono" style={{ color: T.muted }}>{node.model}</span>}
                {node.cost && <span className="text-[9px] font-mono" style={{ color: T.accent }}>{node.cost}</span>}
                {node.proofHash && <span className="text-[9px] font-mono" style={{ color: T.muted }}>⬡ {node.proofHash}</span>}
                <span className="ml-auto text-[9px] font-mono" style={{ color: node.status === 'pending' ? T.accent : node.status === 'blocked' ? T.text : T.muted }}>
                  {node.status === 'pending' ? 'AWAITING' : node.status === 'blocked' ? 'BLOCKED' : node.durationMs > 0 ? `${node.durationMs}ms` : ''}
                </span>
              </div>
              {isExpanded && (
                <div className="mt-1.5 flex items-center gap-3">
                  <span className="text-[10px]" style={{ color: T.dim }}>{node.detail}</span>
                  {node.durationMs > 0 && (
                    <div className="flex-1 max-w-[120px] h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.max(5, (node.durationMs / maxDuration) * 100)}%`, background: style.color, opacity: 0.5 }} />
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AgentTopology() {
  const agents = [
    { name: 'Voice', x: 50, y: 10, active: true },
    { name: 'Cascade', x: 15, y: 40, active: true },
    { name: 'Guardian', x: 85, y: 40, active: true },
    { name: 'Counsel', x: 15, y: 70, active: true },
    { name: 'Oracle', x: 50, y: 70, active: true },
    { name: 'Terra', x: 85, y: 70, active: true },
    { name: 'MirrorEval', x: 50, y: 95, active: true },
  ];

  const connections = [
    { from: 0, to: 1 }, { from: 0, to: 2 },
    { from: 1, to: 3 }, { from: 1, to: 4 },
    { from: 4, to: 3 }, { from: 5, to: 4 },
    { from: 2, to: 6 }, { from: 1, to: 6 }, { from: 3, to: 6 }, { from: 4, to: 6 }, { from: 5, to: 6 },
  ];

  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setPulse(p => (p + 1) % connections.length), 1200);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="rounded-lg p-6" style={{ background: '#050505', border: `1px solid ${T.border}` }}>
      <div className="text-[9px] font-mono uppercase tracking-wider mb-4" style={{ color: T.muted }}>Live Agent Topology</div>
      <svg viewBox="0 0 100 105" className="w-full" style={{ maxHeight: 300 }}>
        {connections.map((c, i) => (
          <line key={i} x1={agents[c.from].x} y1={agents[c.from].y} x2={agents[c.to].x} y2={agents[c.to].y} stroke={i === pulse ? T.accent : 'rgba(255,255,255,0.06)'} strokeWidth={i === pulse ? 0.4 : 0.2} strokeDasharray={i === pulse ? 'none' : '1 1'} />
        ))}
        {agents.map((a, i) => (
          <g key={i}>
            <circle cx={a.x} cy={a.y} r={3.5} fill="#0a0a0a" stroke={T.accent} strokeWidth={0.3} />
            {a.active && <circle cx={a.x} cy={a.y} r={1} fill={T.accent} opacity={0.8}>
              <animate attributeName="r" values="0.8;1.2;0.8" dur="2s" repeatCount="indefinite" />
            </circle>}
            <text x={a.x} y={a.y + 6.5} textAnchor="middle" fill={T.dim} fontSize={2.8} fontFamily="monospace">{a.name}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function AgentViz() {
  const [view, setView] = useState<'trace' | 'topology' | 'runs'>('trace');
  const totalEvents = LIVE_RUNS.reduce((a, r) => a + r.events, 0);
  const proofCount = TRACE_NODES.filter(n => n.proofHash).length;
  const totalCost = TRACE_NODES.reduce((a, n) => a + parseFloat((n.cost || '$0').replace('$', '')), 0);

  return (
    <Layout>
      <PageHeader
        label="AGENT INTELLIGENCE VISUALIZATION"
        title="Agent Visualization"
        subtitle="Live execution traces, agent topology, waterfall debugging, proof chain verification, and real-time run monitoring — every agent decision visible and auditable."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <KpiCard label="LIVE RUNS" value={LIVE_RUNS.length} sub="active" accent={T.accent} />
        <KpiCard label="TRACE NODES" value={TRACE_NODES.length} sub="in view" accent={T.accent} />
        <KpiCard label="PROOF HASHES" value={proofCount} sub="verified" accent={T.accent} />
        <KpiCard label="TOTAL EVENTS" value={totalEvents.toLocaleString()} sub="today" accent={T.dim} />
        <KpiCard label="TRACE COST" value={`$${totalCost.toFixed(3)}`} sub="this trace" accent={T.dim} />
        <KpiCard label="AVG LATENCY" value="178ms" sub="per node" accent={T.accent} />
      </div>

      <div className="flex gap-1 mb-6">
        {(['trace', 'topology', 'runs'] as const).map(tab => (
          <button key={tab} onClick={() => setView(tab)} className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest rounded-md transition-all" style={{ background: view === tab ? 'rgba(201,183,135,0.1)' : 'transparent', color: view === tab ? T.accent : T.muted, border: `1px solid ${view === tab ? 'rgba(201,183,135,0.2)' : 'transparent'}` }}>
            {tab}
          </button>
        ))}
      </div>

      {view === 'trace' && (
        <>
          <SectionTitle>Execution Trace</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim }}>
            Every agent call, tool invocation, handoff, guardrail check, and human approval gate — visualized as an interactive waterfall. Click any node to expand details.
          </p>
          <TraceWaterfall nodes={TRACE_NODES} />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {Object.entries(TYPE_STYLES).map(([type, style]) => (
              <div key={type} className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                <span style={{ color: style.color }}>{style.icon}</span>
                <span className="text-[10px] font-mono capitalize" style={{ color: style.color }}>{type}</span>
                <span className="ml-auto text-[10px] font-mono" style={{ color: T.muted }}>{TRACE_NODES.filter(n => n.type === type).length}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {view === 'topology' && (
        <>
          <SectionTitle>Agent Topology</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim }}>
            Live graph of all active agents, their connections, handoff paths, and current state. Animated connections show active data flow.
          </p>
          <div className="grid lg:grid-cols-2 gap-6">
            <AgentTopology />
            <div className="space-y-3">
              <Card>
                <div className="text-[9px] font-mono uppercase tracking-wider mb-3" style={{ color: T.muted }}>Topology Metrics</div>
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between"><span style={{ color: T.dim }}>Active agents</span><span style={{ color: T.accent }}>7</span></div>
                  <div className="flex justify-between"><span style={{ color: T.dim }}>Active connections</span><span style={{ color: T.text }}>11</span></div>
                  <div className="flex justify-between"><span style={{ color: T.dim }}>Handoffs (24h)</span><span style={{ color: T.accent }}>133</span></div>
                  <div className="flex justify-between"><span style={{ color: T.dim }}>Avg handoff latency</span><span style={{ color: T.text }}>142ms</span></div>
                  <div className="flex justify-between"><span style={{ color: T.dim }}>Proof chain depth</span><span style={{ color: T.accent }}>4.2 avg</span></div>
                  <div className="flex justify-between"><span style={{ color: T.dim }}>Graph cycles</span><span style={{ color: T.muted }}>0 (acyclic)</span></div>
                </div>
              </Card>
              <Card>
                <div className="text-[9px] font-mono uppercase tracking-wider mb-3" style={{ color: T.muted }}>Innovation: Proof-Chain Topology</div>
                <div className="text-[10px] leading-relaxed" style={{ color: T.dim }}>
                  Unlike standard agent visualization, a11oy's topology graph is cryptographically verifiable. Every connection, handoff, and data flow is anchored to a proof hash — making the entire agent network auditable, tamper-evident, and investor-grade transparent.
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {view === 'runs' && (
        <>
          <SectionTitle>Live Agent Runs</SectionTitle>
          <div className="space-y-2">
            {LIVE_RUNS.map(run => (
              <div key={run.id} className="rounded-lg p-4 flex items-center gap-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="relative">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: T.accent }} />
                  <div className="absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping" style={{ background: T.accent, opacity: 0.3 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: T.text }}>{run.agent}</span>
                    <span className="text-[9px] font-mono" style={{ color: T.muted }}>{run.model}</span>
                  </div>
                  <div className="text-[10px] mt-0.5 truncate" style={{ color: T.dim }}>{run.task}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono" style={{ color: T.accent }}>{run.events.toLocaleString()} events</div>
                  <div className="text-[9px] font-mono" style={{ color: T.muted }}>{run.duration}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Layout>
  );
}
