import { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/layout';
import { DemoBadge, ApprovalGate } from '../components/ui';

const STAGES = [
  {
    id: 'sense', stage: 1, label: 'SENSE', title: 'Signal Ingestion',
    narrative: "A11oy's Signal Mesh ingests business signals across 7 enterprise verticals simultaneously. MV Cascade reports a 38-hour port delay. The mesh normalizes, deduplicates, and routes the signal in 12ms.",
    visual: { primary: 'Signal received', secondary: 'MV Cascade · Port Houston · +38h delay', badge: 'sig-maritime-001', color: '#3b82f6' },
  },
  {
    id: 'structure', stage: 2, label: 'STRUCTURE', title: 'Data Normalization',
    narrative: 'The State Engine structures the raw signal into the canonical Enterprise State schema — vessel identity, cargo manifest, financial exposure, and causal context — creating an authoritative current state.',
    visual: { primary: 'State structured', secondary: '2,400 TEU · $14,200/day exposure · Berth 7', badge: 'state-cascade-v12', color: '#6366f1' },
  },
  {
    id: 'correlate', stage: 3, label: 'CORRELATE', title: 'Causal Analysis',
    narrative: 'The Causal Core correlates the Cascade delay with 4 prior signals: port congestion data, weather model, charter party terms, and Q2 logistics commitments. Confidence: 94%.',
    visual: { primary: '4 causal links found', secondary: 'Congestion → Weather → Charter → Q2 commitments', badge: 'causal-4-links', color: '#8b5cf6' },
  },
  {
    id: 'explain', stage: 4, label: 'EXPLAIN', title: 'Reasoning Chain',
    narrative: 'A11oy generates a structured explanation: the delay is causal, not incidental. The 38h delay will trigger demurrage at T+24h. The originating cause is port scheduling, not vessel failure.',
    visual: { primary: 'Root cause identified', secondary: 'Port scheduling → demurrage threshold T+24h', badge: 'explain-v1', color: '#b08d52' },
  },
  {
    id: 'recommend', stage: 5, label: 'RECOMMEND', title: 'Action Recommendation',
    narrative: 'The Action Rail recommends authorizing a 48-hour port standby. MirrorEval tests this against the counterfactual: rebooking an alternative berth. Standby wins on cost and optionality (91% vs 78% confidence).',
    visual: { primary: 'Action recommended', secondary: 'PORT_STANDBY · $14,200/day · 91% confidence', badge: 'act-001', color: '#f59e0b' },
  },
  {
    id: 'approve', stage: 6, label: 'APPROVE', title: 'Human Approval Gate',
    narrative: 'The Covenant Layer enforces policy pol-maritime-002: no port standby authorization without VP Operations approval. The action is queued — nothing executes until a human approves.',
    visual: { primary: 'Gate enforced', secondary: 'Awaiting VP Operations · pol-maritime-002', badge: 'gate-blocked', color: '#8b5cf6' },
    isGated: true,
  },
  {
    id: 'execute', stage: 7, label: 'EXECUTE', title: 'Governed Execution',
    narrative: 'VP Operations approves. A11oy executes: port standby is authorized, logistics team is notified, charter party clause 14.3 is flagged, and the execution receipt is generated.',
    visual: { primary: 'Execution complete', secondary: 'Standby authorized · Notifications sent · Receipt: exe-2026-001', badge: 'exe-complete', color: '#10b981' },
  },
  {
    id: 'verify', stage: 8, label: 'VERIFY', title: 'Outcome Verification',
    narrative: 'A11oy verifies the execution outcome against the expected state: standby confirmed by port authority, financial commitment recorded, demurrage clock reset. Verification: passed.',
    visual: { primary: 'Outcome verified', secondary: 'Port confirmed · Demurrage clock reset · State updated', badge: 'verify-pass', color: '#10b981' },
  },
  {
    id: 'prove', stage: 9, label: 'PROVE', title: 'Proof-Carrying Execution',
    narrative: 'The Proof Ledger records the complete chain: signal → causal links → policy evaluation → approval → execution → verification → outcome. SHA-256 hash: immutable, board-ready.',
    visual: { primary: 'Proof recorded', secondary: 'sha256:c9f2e5b8a1d3e6f9b2c5a8d3e1f6b9c2', badge: 'pce-c9f2e5b8', color: '#b08d52' },
  },
];

const ADVANCE_MS = 4500;

export function InvestorDemo() {
  const [activeStage, setActiveStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stage = STAGES[activeStage];

  const goTo = (idx: number) => {
    setActiveStage(idx);
  };
  const goNext = () => {
    setActiveStage(i => {
      if (i < STAGES.length - 1) return i + 1;
      return 0;
    });
  };

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isPlaying) return;
    if (stage.isGated) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setActiveStage(i => {
        if (i < STAGES.length - 1) return i + 1;
        return 0;
      });
    }, ADVANCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeStage, isPlaying, stage.isGated]);

  return (
    <Layout>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-gold)' }}>INVESTOR DEMO</span>
          <DemoBadge />
          <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: isPlaying ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: isPlaying ? '#10b981' : '#f59e0b' }}>
            {stage.isGated ? '⏸ PAUSED — awaiting approval gate' : isPlaying ? '▶ Auto-advancing' : '⏸ Paused'}
          </span>
        </div>
        <h1 className="text-2xl font-display font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>
          Narrated Walkthrough — SENSE → PROVE
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-a11oy-text-sub)' }}>
          Follow one real decision through all 9 stages of A11oy's execution pipeline — from signal ingestion to cryptographic proof.
        </p>
      </div>

      <div className="flex gap-1 mb-8 overflow-x-auto pb-2">
        {STAGES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => { setIsPlaying(false); goTo(i); }}
            className="flex flex-col items-center gap-1 px-2 py-1.5 rounded transition-all flex-shrink-0"
            style={{
              backgroundColor: activeStage === i ? `${s.visual.color}18` : 'transparent',
              border: `1px solid ${activeStage === i ? s.visual.color + '40' : 'var(--color-a11oy-border)'}`,
              cursor: 'pointer',
              color: activeStage === i ? s.visual.color : 'var(--color-a11oy-text-ghost)',
              minWidth: '80px',
            }}
          >
            <span className="text-xs font-mono">{s.stage}</span>
            <span className="text-xs font-mono font-bold">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div
          className="rounded-lg border p-6"
          style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded flex items-center justify-center font-mono text-sm font-bold"
              style={{ backgroundColor: `${stage.visual.color}20`, color: stage.visual.color }}
            >
              {stage.stage}
            </div>
            <div>
              <div className="text-xs font-mono" style={{ color: stage.visual.color }}>{stage.label}</div>
              <div className="font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{stage.title}</div>
            </div>
          </div>

          <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--color-a11oy-text-sub)' }}>
            {stage.narrative}
          </p>

          <div className="flex flex-wrap gap-3">
            {activeStage > 0 && (
              <button
                onClick={() => { setIsPlaying(false); setActiveStage(i => Math.max(0, i - 1)); }}
                className="px-3 py-1.5 rounded text-xs font-medium border"
                style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text-sub)', backgroundColor: 'transparent', cursor: 'pointer' }}
              >
                ← Previous
              </button>
            )}
            {!isPlaying && !stage.isGated && (
              <button
                onClick={() => setIsPlaying(true)}
                className="px-3 py-1.5 rounded text-xs font-medium border"
                style={{ borderColor: 'rgba(16,185,129,0.4)', color: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', cursor: 'pointer' }}
              >
                ▶ Resume
              </button>
            )}
            {isPlaying && (
              <button
                onClick={() => setIsPlaying(false)}
                className="px-3 py-1.5 rounded text-xs font-medium border"
                style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text-ghost)', backgroundColor: 'transparent', cursor: 'pointer' }}
              >
                ⏸ Pause
              </button>
            )}
            {activeStage < STAGES.length - 1 && (
              <button
                onClick={() => { setIsPlaying(false); goNext(); }}
                className="px-3 py-1.5 rounded text-xs font-medium"
                style={{ backgroundColor: stage.visual.color, color: 'white', border: 'none', cursor: 'pointer' }}
              >
                {stage.isGated ? 'Approve & Continue →' : 'Next Stage →'}
              </button>
            )}
            {activeStage === STAGES.length - 1 && (
              <button
                onClick={() => { setActiveStage(0); setIsPlaying(true); }}
                className="px-3 py-1.5 rounded text-xs font-medium"
                style={{ backgroundColor: '#b08d52', color: 'white', border: 'none', cursor: 'pointer' }}
              >
                ↺ Restart Demo
              </button>
            )}
          </div>
        </div>

        <div
          className="rounded-lg border p-6 flex flex-col"
          style={{ backgroundColor: `${stage.visual.color}06`, borderColor: `${stage.visual.color}25` }}
        >
          <div className="text-xs font-mono mb-4" style={{ color: stage.visual.color }}>STAGE {stage.stage} OUTPUT</div>
          <div className="flex-1">
            <div className="text-xl font-display font-semibold mb-2" style={{ color: 'var(--color-a11oy-text)' }}>
              {stage.visual.primary}
            </div>
            <div className="text-sm mb-4" style={{ color: 'var(--color-a11oy-text-sub)' }}>
              {stage.visual.secondary}
            </div>
            <div className="font-mono text-xs px-3 py-2 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', color: 'var(--color-a11oy-text-ghost)', border: '1px solid var(--color-a11oy-border)' }}>
              {stage.visual.badge}
            </div>
          </div>
          {stage.isGated && (
            <div className="mt-4">
              <ApprovalGate label="No material action executes without human approval — demo paused at this gate" />
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-1">
        {STAGES.map((s, i) => (
          <div
            key={s.id}
            className="h-1 flex-1 rounded-full transition-all"
            style={{ backgroundColor: i <= activeStage ? s.visual.color : 'var(--color-a11oy-border)' }}
          />
        ))}
      </div>
      <div className="mt-2 text-xs text-center" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
        Stage {activeStage + 1} of {STAGES.length}{isPlaying && !stage.isGated ? ` — advancing in ${ADVANCE_MS / 1000}s` : ''}
      </div>
    </Layout>
  );
}
