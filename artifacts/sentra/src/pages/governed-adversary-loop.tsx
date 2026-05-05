import { useState } from 'react';

const T = {
  bg: '#060608',
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f0f0f0',
  dim: '#8a8a8a',
  muted: '#5e5e5e',
  accent: '#c9b787',
  red: '#ef4444',
  orange: '#f97316',
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#8b5cf6',
};

interface LoopStage {
  id: string;
  seq: number;
  app: 'sentra' | 'a11oy';
  label: string;
  description: string;
  status: 'complete' | 'active' | 'pending';
  proof_id?: string;
  covenant_clause?: string;
}

const LOOP_STAGES: LoopStage[] = [
  { id: 's1', seq: 1, app: 'sentra', label: 'Attack Proposal', description: 'Red team operator selects a scenario from the library and submits a launch request. Target scope is defined (sandbox only).', status: 'complete', proof_id: 'proof-s1-a4f7c' },
  { id: 's2', seq: 2, app: 'a11oy', label: 'Covenant Gate', description: 'a11oy receives the proposal and evaluates it against Article IX Adversarial Covenants. Checks scope, risk tier, and operator authorization.', status: 'complete', proof_id: 'proof-s2-b8e2d', covenant_clause: 'Article IX, §1 — Simulated scenario within approved scope' },
  { id: 's3', seq: 3, app: 'a11oy', label: 'Approval Queue', description: 'If the scenario passes covenants, it enters the human Approval Queue with a constitutional citation and risk summary for operator review.', status: 'complete', proof_id: 'proof-s3-c1f9a' },
  { id: 's4', seq: 4, app: 'sentra', label: 'Execution (Sandboxed)', description: 'After operator approval, the scenario executes against the digital twin. Every step is covenant-gated. No live exploit traffic.', status: 'active', proof_id: 'proof-s4-d3b5e' },
  { id: 's5', seq: 5, app: 'sentra', label: 'Blue Team Detection', description: 'SOC detection layer monitors for expected sensor triggers. Results feed the purple-team coverage matrix.', status: 'pending' },
  { id: 's6', seq: 6, app: 'a11oy', label: 'Proof Chain Closure', description: 'a11oy closes the proof packet — attack proposal, covenant gate, approval, execution steps, detections fired, and gap analysis — all in one chain.', status: 'pending', proof_id: 'proof-s6-TBD' },
];

const APP_COLORS: Record<string, string> = { sentra: '#c9b787', a11oy: '#8b5cf6' };

export default function GovernedAdversaryLoop() {
  const [activeStage, setActiveStage] = useState<LoopStage>(LOOP_STAGES[3]);

  return (
    <div className="min-h-screen p-6" style={{ background: T.bg, color: T.text }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: T.accent }}>Cross-App Bridge</span>
          </div>
          <h1 className="text-3xl font-light mb-2" style={{ color: T.text, letterSpacing: '-0.02em' }}>Governed Adversary Loop</h1>
          <p className="text-sm" style={{ color: T.dim, maxWidth: 640 }}>
            Every offensive action in Sentra is initiated, reasoned about, governed, and proof-chained by a11oy. This view shows the single proof chain that spans both apps — from attack proposal through covenant gate through execution through detection.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: T.muted }}>Loop Stages — one proof chain across both apps</div>
            <div className="flex flex-col gap-0">
              {LOOP_STAGES.map((stage, i) => (
                <div key={stage.id}>
                  <button onClick={() => setActiveStage(stage)} className="w-full text-left rounded-xl p-4 transition-all" style={{ background: activeStage.id === stage.id ? `${APP_COLORS[stage.app]}06` : T.surface, border: `1px solid ${activeStage.id === stage.id ? `${APP_COLORS[stage.app]}30` : T.border}`, cursor: 'pointer' }}>
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold" style={{ background: `${APP_COLORS[stage.app]}15`, color: APP_COLORS[stage.app] }}>
                          {stage.status === 'complete' ? '✓' : stage.status === 'active' ? '●' : stage.seq}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-semibold" style={{ color: T.text }}>{stage.label}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${APP_COLORS[stage.app]}15`, color: APP_COLORS[stage.app] }}>{stage.app}</span>
                          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: stage.status === 'complete' ? 'rgba(34,197,94,0.08)' : stage.status === 'active' ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.04)', color: stage.status === 'complete' ? T.green : stage.status === 'active' ? T.blue : T.muted }}>{stage.status}</span>
                        </div>
                        <p className="text-[10px]" style={{ color: T.dim }}>{stage.description}</p>
                        {stage.proof_id && stage.status !== 'pending' && (
                          <div className="text-[9px] font-mono mt-1" style={{ color: T.green }}>Proof: {stage.proof_id}</div>
                        )}
                        {stage.covenant_clause && (
                          <div className="text-[9px] mt-1" style={{ color: T.accent }}>{stage.covenant_clause}</div>
                        )}
                      </div>
                    </div>
                  </button>
                  {i < LOOP_STAGES.length - 1 && (
                    <div className="flex justify-start ml-8 my-0">
                      <div className="w-px h-3" style={{ background: `${APP_COLORS[stage.app]}30` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${APP_COLORS[activeStage.app]}25` }}>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: APP_COLORS[activeStage.app] }}>Stage {activeStage.seq} Detail</div>
              <div className="text-sm font-semibold mb-2" style={{ color: T.text }}>{activeStage.label}</div>
              <p className="text-[10px] mb-3" style={{ color: T.dim }}>{activeStage.description}</p>
              {activeStage.covenant_clause && (
                <div className="p-2.5 rounded mb-3" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)' }}>
                  <div className="text-[9px] font-mono mb-1" style={{ color: T.accent }}>Constitutional Citation</div>
                  <div className="text-[10px]" style={{ color: T.dim }}>{activeStage.covenant_clause}</div>
                </div>
              )}
              {activeStage.proof_id && activeStage.status !== 'pending' && (
                <div className="flex items-center gap-2 text-[10px]">
                  <span style={{ color: T.green }}>✓</span>
                  <span className="font-mono" style={{ color: T.green }}>{activeStage.proof_id}</span>
                </div>
              )}
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: '#8b5cf6' }}>One Brain, Two Apps</div>
              <div className="text-[10px] mb-3" style={{ color: T.dim }}>Every loop stage is recorded in a single proof chain visible in both a11oy and Sentra. Click "View Proof" in either app to see the full lineage.</div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px]"><span style={{ color: '#8b5cf6' }}>a11oy</span><span style={{ color: T.muted }}>— Brain: reasoning, covenants, approvals</span></div>
                <div className="flex items-center gap-2 text-[10px]"><span style={{ color: T.accent }}>Sentra</span><span style={{ color: T.muted }}>— Lobe: proposal, execution, detection</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg text-[10px] flex items-center gap-2" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.15)', color: T.muted }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} />
          Governed Adversary Loop — not a single Sentra side-effect bypasses the a11oy brain. Every step is proof-chained and covenant-cited.
        </div>
      </div>
    </div>
  );
}
