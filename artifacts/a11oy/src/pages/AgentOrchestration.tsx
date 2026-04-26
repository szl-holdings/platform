import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

const T = {
  bg: '#0a0a0a', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

const AGENTS = [
  { id: 'ag-cascade', name: 'Cascade Navigator', role: 'Domain Specialist', vertical: 'Maritime', model: 'claude-sonnet-4', status: 'active', trust: 97, handoffs: 12, tools: ['eta_calc', 'port_cost', 'route_opt', 'weather_api'], instructions: 'Monitor fleet positions, calculate ETAs, flag anomalies. Escalate sanctions risk to Guardian.', guardrails: ['sanctions_check', 'cost_threshold'] },
  { id: 'ag-guardian', name: 'Guardian', role: 'Domain Specialist', vertical: 'Defense', model: 'claude-sonnet-4', status: 'active', trust: 99, handoffs: 8, tools: ['threat_intel', 'posture_assess', 'incident_triage', 'stix_parser'], instructions: 'Continuous threat posture assessment. Autonomous triage for severity < P2. Human-in-the-loop for P1+.', guardrails: ['classification_gate', 'air_gap_verify'] },
  { id: 'ag-counsel', name: 'Counsel Sentinel', role: 'Domain Specialist', vertical: 'Legal', model: 'gpt-4o', status: 'active', trust: 99, handoffs: 5, tools: ['deadline_track', 'doc_review', 'risk_score', 'obligation_graph'], instructions: 'Track matter deadlines, flag risk. Never generate legal advice — surface evidence and recommend human review.', guardrails: ['legal_advice_block', 'privilege_check'] },
  { id: 'ag-oracle', name: 'Pipeline Oracle', role: 'Domain Specialist', vertical: 'Revenue', model: 'gpt-4o', status: 'active', trust: 91, handoffs: 14, tools: ['pipeline_analysis', 'deal_score', 'forecast_model', 'crm_sync'], instructions: 'Score deals, forecast revenue, identify at-risk pipeline. Handoff to Counsel for contract review.', guardrails: ['revenue_disclosure', 'forecast_confidence'] },
  { id: 'ag-terra', name: 'Terra Analyst', role: 'Domain Specialist', vertical: 'Real Estate', model: 'gpt-4o', status: 'active', trust: 88, handoffs: 6, tools: ['cap_rate', 'portfolio_analysis', 'valuation_model', 'market_comp'], instructions: 'Track portfolio metrics, run valuations, detect market signals. Escalate large transactions.', guardrails: ['valuation_bounds', 'transaction_limit'] },
  { id: 'ag-fabric', name: 'Fabric Watchdog', role: 'System', vertical: 'Core', model: 'internal', status: 'active', trust: 100, handoffs: 0, tools: ['mesh_health', 'layer_monitor', 'proof_verify', 'latency_track'], instructions: 'Monitor all 7 fabric layers. Auto-remediate latency spikes. Alert on proof chain violations.', guardrails: ['uptime_sla', 'proof_integrity'] },
  { id: 'ag-mirror', name: 'MirrorEval', role: 'Evaluator', vertical: 'Core', model: 'claude-sonnet-4', status: 'active', trust: 98, handoffs: 3, tools: ['eval_run', 'bias_detect', 'drift_score', 'benchmark'], instructions: 'Continuously evaluate agent outputs for quality, bias, and drift. Flag degradation > 2σ.', guardrails: ['eval_independence', 'score_calibration'] },
  { id: 'ag-voice', name: 'Voice Interface', role: 'Realtime', vertical: 'Core', model: 'gpt-realtime-1.5', status: 'active', trust: 94, handoffs: 7, tools: ['voice_session', 'transcript', 'sentiment_detect', 'handoff_route'], instructions: 'Low-latency voice sessions. Semantic VAD. Route to domain specialist via handoff protocol.', guardrails: ['pii_redaction', 'recording_consent'] },
];

const HANDOFF_FLOWS = [
  { from: 'Voice Interface', to: 'Cascade Navigator', trigger: 'User mentions vessel or maritime', count: 47, avgMs: 120 },
  { from: 'Voice Interface', to: 'Guardian', trigger: 'User mentions threat or security', count: 23, avgMs: 95 },
  { from: 'Cascade Navigator', to: 'Counsel Sentinel', trigger: 'Sanctions flag on vessel', count: 8, avgMs: 340 },
  { from: 'Pipeline Oracle', to: 'Counsel Sentinel', trigger: 'Contract review needed', count: 12, avgMs: 180 },
  { from: 'Guardian', to: 'Fabric Watchdog', trigger: 'Infrastructure threat detected', count: 3, avgMs: 45 },
  { from: 'Terra Analyst', to: 'Pipeline Oracle', trigger: 'Portfolio transaction > $5M', count: 5, avgMs: 210 },
  { from: 'Any Agent', to: 'MirrorEval', trigger: 'Output confidence < 0.7', count: 31, avgMs: 67 },
  { from: 'MirrorEval', to: 'Human Approver', trigger: 'Bias or drift detected', count: 4, avgMs: 0 },
];

const GUARDRAILS = [
  { name: 'sanctions_check', type: 'input', scope: 'Maritime', desc: 'Screen entity names against OFAC/EU sanctions lists before processing', triggers: 847, blocks: 12 },
  { name: 'classification_gate', type: 'input', scope: 'Defense', desc: 'Verify clearance level before exposing threat intelligence', triggers: 2103, blocks: 0 },
  { name: 'legal_advice_block', type: 'output', scope: 'Legal', desc: 'Prevent generation of direct legal advice — surface evidence only', triggers: 1247, blocks: 89 },
  { name: 'pii_redaction', type: 'output', scope: 'All', desc: 'Redact personally identifiable information from agent outputs', triggers: 4892, blocks: 234 },
  { name: 'revenue_disclosure', type: 'output', scope: 'Revenue', desc: 'Prevent forward-looking revenue statements without disclaimer', triggers: 891, blocks: 34 },
  { name: 'proof_integrity', type: 'system', scope: 'Core', desc: 'Verify proof chain hash before committing any agent action', triggers: 12847, blocks: 0 },
  { name: 'cost_threshold', type: 'system', scope: 'All', desc: 'Halt agent if session cost exceeds $5.00 without approval', triggers: 203, blocks: 7 },
  { name: 'eval_independence', type: 'system', scope: 'Core', desc: 'Ensure MirrorEval never evaluates its own outputs', triggers: 3201, blocks: 0 },
];

const REALTIME_CONFIG = {
  model: 'gpt-realtime-1.5',
  audio: { input: { format: 'pcm16', transcription: 'gpt-4o-mini-transcribe', turnDetection: 'semantic_vad', noiseReduction: true }, output: { format: 'pcm16', voice: 'ash' } },
  features: ['Semantic VAD', 'Interrupt handling', 'Multi-agent handoff', 'Tool execution mid-stream', 'Governed transcription', 'Sentiment routing'],
};

export function AgentOrchestration() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [view, setView] = useState<'agents' | 'handoffs' | 'guardrails' | 'realtime'>('agents');
  const totalHandoffs = HANDOFF_FLOWS.reduce((a, h) => a + h.count, 0);
  const totalGuardrailTriggers = GUARDRAILS.reduce((a, g) => a + g.triggers, 0);
  const totalBlocks = GUARDRAILS.reduce((a, g) => a + g.blocks, 0);
  const selected = AGENTS.find(a => a.id === selectedAgent);

  return (
    <Layout>
      <PageHeader
        label="MULTI-AGENT ORCHESTRATION"
        title="Agent Orchestration"
        subtitle="OpenAI Agents SDK patterns — handoffs, guardrails, tool routing, realtime voice, and human-in-the-loop — governed by the a11oy proof chain."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <KpiCard label="ACTIVE AGENTS" value={AGENTS.length} sub="registered" accent={T.accent} />
        <KpiCard label="HANDOFFS TODAY" value={totalHandoffs} sub="routed" accent={T.accent} />
        <KpiCard label="GUARDRAIL CHECKS" value={totalGuardrailTriggers.toLocaleString()} sub="triggered" accent={T.dim} />
        <KpiCard label="BLOCKS" value={totalBlocks} sub="prevented" accent={T.text} />
        <KpiCard label="AVG TRUST" value={Math.round(AGENTS.reduce((a, ag) => a + ag.trust, 0) / AGENTS.length)} sub="score" accent={T.accent} />
        <KpiCard label="MODELS" value="4" sub="active" accent={T.dim} />
      </div>

      <div className="flex gap-1 mb-6">
        {(['agents', 'handoffs', 'guardrails', 'realtime'] as const).map(tab => (
          <button key={tab} onClick={() => setView(tab)} className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest rounded-md transition-all" style={{ background: view === tab ? 'rgba(201,183,135,0.1)' : 'transparent', color: view === tab ? T.accent : T.muted, border: `1px solid ${view === tab ? 'rgba(201,183,135,0.2)' : 'transparent'}` }}>
            {tab}
          </button>
        ))}
      </div>

      {view === 'agents' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-2">
            {AGENTS.map(ag => (
              <button key={ag.id} onClick={() => setSelectedAgent(ag.id)} className="w-full text-left rounded-lg p-4 transition-all" style={{ background: selectedAgent === ag.id ? 'rgba(201,183,135,0.05)' : T.surface, border: `1px solid ${selectedAgent === ag.id ? 'rgba(201,183,135,0.2)' : T.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: T.accent }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium" style={{ color: T.text }}>{ag.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: T.dim }}>{ag.role}</span>
                    </div>
                    <div className="text-[10px] font-mono mt-0.5" style={{ color: T.dim }}>{ag.vertical} · {ag.model} · Trust: {ag.trust}</div>
                  </div>
                  <div className="text-[10px] font-mono" style={{ color: T.accent }}>{ag.tools.length} tools</div>
                </div>
              </button>
            ))}
          </div>

          <div>
            {selected ? (
              <div className="rounded-lg p-5 sticky top-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="text-sm font-medium mb-1" style={{ color: T.text }}>{selected.name}</div>
                <div className="text-[10px] font-mono mb-4" style={{ color: T.dim }}>{selected.role} · {selected.vertical}</div>

                <div className="text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: T.muted }}>Instructions</div>
                <p className="text-[11px] leading-relaxed mb-4" style={{ color: T.dim }}>{selected.instructions}</p>

                <div className="text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: T.muted }}>Model</div>
                <p className="text-[11px] font-mono mb-4" style={{ color: T.accent }}>{selected.model}</p>

                <div className="text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: T.muted }}>Tools ({selected.tools.length})</div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {selected.tools.map(t => (
                    <span key={t} className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(201,183,135,0.08)', color: T.accent, border: '1px solid rgba(201,183,135,0.12)' }}>{t}</span>
                  ))}
                </div>

                <div className="text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: T.muted }}>Guardrails</div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {selected.guardrails.map(g => (
                    <span key={g} className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: T.dim, border: `1px solid ${T.border}` }}>{g}</span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
                  <div><div className="text-[9px] font-mono" style={{ color: T.muted }}>Trust Score</div><div className="text-lg font-bold font-mono" style={{ color: T.accent }}>{selected.trust}</div></div>
                  <div><div className="text-[9px] font-mono" style={{ color: T.muted }}>Handoffs</div><div className="text-lg font-bold font-mono" style={{ color: T.text }}>{selected.handoffs}</div></div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg p-8 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="text-xs" style={{ color: T.muted }}>Select an agent to inspect</div>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'handoffs' && (
        <>
          <SectionTitle>Handoff Protocol</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim }}>
            When an agent determines a conversation should be routed to a specialist, it executes a governed handoff — the full context, tool state, and proof chain transfer atomically.
          </p>
          <div className="space-y-2 mb-8">
            {HANDOFF_FLOWS.map((h, i) => (
              <div key={i} className="rounded-lg p-4 flex items-center gap-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-2 min-w-[200px]">
                  <span className="text-[11px] font-mono font-medium" style={{ color: T.text }}>{h.from}</span>
                  <span className="text-[10px]" style={{ color: T.accent }}>→</span>
                  <span className="text-[11px] font-mono font-medium" style={{ color: T.accent }}>{h.to}</span>
                </div>
                <div className="flex-1 text-[10px]" style={{ color: T.dim }}>{h.trigger}</div>
                <div className="text-right">
                  <div className="text-[11px] font-mono font-bold" style={{ color: T.text }}>{h.count}</div>
                  <div className="text-[9px] font-mono" style={{ color: T.muted }}>{h.avgMs}ms</div>
                </div>
              </div>
            ))}
          </div>

          <Card>
            <div className="text-[9px] font-mono uppercase tracking-wider mb-3" style={{ color: T.muted }}>Handoff Architecture</div>
            <div className="font-mono text-[11px] space-y-1" style={{ color: T.dim }}>
              <div><span style={{ color: T.accent }}>1.</span> Source agent determines handoff trigger condition</div>
              <div><span style={{ color: T.accent }}>2.</span> Conversation history + tool state serialized</div>
              <div><span style={{ color: T.accent }}>3.</span> Proof hash generated for the transfer</div>
              <div><span style={{ color: T.accent }}>4.</span> Target agent receives full context + proof chain</div>
              <div><span style={{ color: T.accent }}>5.</span> Target agent validates proof, begins processing</div>
              <div><span style={{ color: T.accent }}>6.</span> Original agent enters dormant state (resumable)</div>
            </div>
          </Card>
        </>
      )}

      {view === 'guardrails' && (
        <>
          <SectionTitle>Guardrail Registry</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim }}>
            Input guardrails validate before the agent processes. Output guardrails validate before results are returned. System guardrails enforce infrastructure constraints.
          </p>
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Guardrail', 'Type', 'Scope', 'Triggers', 'Blocks', 'Description'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider" style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GUARDRAILS.map(g => (
                  <tr key={g.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-2.5 font-mono font-medium" style={{ color: T.text }}>{g.name}</td>
                    <td className="px-4 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: g.type === 'input' ? 'rgba(201,183,135,0.08)' : g.type === 'output' ? 'rgba(138,138,138,0.1)' : 'rgba(255,255,255,0.04)', color: g.type === 'input' ? T.accent : g.type === 'output' ? T.dim : T.muted }}>{g.type}</span></td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.dim }}>{g.scope}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.accent }}>{g.triggers.toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: g.blocks > 0 ? T.text : T.muted }}>{g.blocks}</td>
                    <td className="px-4 py-2.5" style={{ color: T.dim, maxWidth: 300 }}>{g.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {view === 'realtime' && (
        <>
          <SectionTitle>Realtime Voice Sessions</SectionTitle>
          <p className="text-xs mb-6" style={{ color: T.dim }}>
            Low-latency voice sessions with semantic turn detection, mid-stream tool execution, and governed multi-agent handoffs. Built on the OpenAI Realtime API.
          </p>
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <div className="text-[9px] font-mono uppercase tracking-wider mb-3" style={{ color: T.muted }}>Session Configuration</div>
              <div className="font-mono text-[11px] space-y-2">
                <div className="flex justify-between"><span style={{ color: T.dim }}>Model</span><span style={{ color: T.accent }}>{REALTIME_CONFIG.model}</span></div>
                <div className="flex justify-between"><span style={{ color: T.dim }}>Input Format</span><span style={{ color: T.text }}>{REALTIME_CONFIG.audio.input.format}</span></div>
                <div className="flex justify-between"><span style={{ color: T.dim }}>Transcription</span><span style={{ color: T.text }}>{REALTIME_CONFIG.audio.input.transcription}</span></div>
                <div className="flex justify-between"><span style={{ color: T.dim }}>Turn Detection</span><span style={{ color: T.accent }}>{REALTIME_CONFIG.audio.input.turnDetection}</span></div>
                <div className="flex justify-between"><span style={{ color: T.dim }}>Noise Reduction</span><span style={{ color: T.accent }}>enabled</span></div>
                <div className="flex justify-between"><span style={{ color: T.dim }}>Output Voice</span><span style={{ color: T.text }}>{REALTIME_CONFIG.audio.output.voice}</span></div>
              </div>
            </Card>
            <Card>
              <div className="text-[9px] font-mono uppercase tracking-wider mb-3" style={{ color: T.muted }}>Realtime Capabilities</div>
              <div className="space-y-2">
                {REALTIME_CONFIG.features.map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} />
                    <span className="text-[11px]" style={{ color: T.text }}>{f}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="mt-6 rounded-lg p-5" style={{ background: '#050505', border: `1px solid ${T.border}` }}>
            <div className="text-[9px] font-mono uppercase tracking-wider mb-3" style={{ color: T.muted }}>Live Session Transcript — Demo</div>
            <div className="font-mono text-[11px] space-y-2">
              <div><span style={{ color: T.accent }}>USER</span> <span style={{ color: T.dim }}>"What's the status of the Horizon Star vessel?"</span></div>
              <div><span style={{ color: T.muted }}>VOICE</span> <span style={{ color: T.dim }}>→ Routing to Cascade Navigator (maritime context detected)</span></div>
              <div><span style={{ color: T.accent }}>HANDOFF</span> <span style={{ color: T.dim }}>Voice Interface → Cascade Navigator [120ms]</span></div>
              <div><span style={{ color: T.text }}>CASCADE</span> <span style={{ color: T.dim }}>"The Horizon Star is currently 42 nautical miles southwest of Singapore, ETA to Port Klang is 14 hours. No anomalies detected. Fuel consumption is 2% below baseline."</span></div>
              <div><span style={{ color: T.accent }}>USER</span> <span style={{ color: T.dim }}>"Any sanctions risk?"</span></div>
              <div><span style={{ color: T.muted }}>GUARDRAIL</span> <span style={{ color: T.dim }}>sanctions_check triggered — screening entity</span></div>
              <div><span style={{ color: T.text }}>CASCADE</span> <span style={{ color: T.dim }}>"Horizon Star — clean. No OFAC, EU, or UN matches. Last screened 4 hours ago."</span></div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
