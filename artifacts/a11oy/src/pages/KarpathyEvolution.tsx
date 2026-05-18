// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { useState, useCallback, type ReactNode, type ChangeEvent } from 'react';

const GOLD = '#c9b787';
const NAVY = '#0a0e1a';
const SURFACE = '#111827';
const BORDER = 'rgba(201,183,135,0.12)';
const TEXT = '#e2e0d8';
const TEXT_DIM = 'rgba(226,224,216,0.5)';
const GREEN = '#34d399';
const AMBER = '#fbbf24';
const RED = '#f87171';
const BLUE = '#60a5fa';

const DEPTH_PROFILES = [
  { depth: 1, label: 'Minimal', agents: 1, gates: false, council: false, redTeam: false, color: '#6b7280' },
  { depth: 2, label: 'Light', agents: 1, gates: true, council: false, redTeam: false, color: '#6b7280' },
  { depth: 3, label: 'Routine', agents: 2, gates: true, council: false, redTeam: false, color: '#9ca3af' },
  { depth: 4, label: 'Standard', agents: 3, gates: true, council: false, redTeam: false, color: BLUE },
  { depth: 5, label: 'Enhanced', agents: 4, gates: true, council: false, redTeam: false, color: BLUE },
  { depth: 6, label: 'Elevated', agents: 5, gates: true, council: true, redTeam: false, color: AMBER },
  { depth: 7, label: 'High Stakes', agents: 6, gates: true, council: true, redTeam: true, color: AMBER },
  { depth: 8, label: 'Critical', agents: 8, gates: true, council: true, redTeam: true, color: RED },
  { depth: 9, label: 'Board-Level', agents: 10, gates: true, council: true, redTeam: true, color: RED },
  { depth: 10, label: 'Sovereign', agents: 12, gates: true, council: true, redTeam: true, color: GOLD },
];

const MOCK_GATE_LOG = [
  { gate: 'ThinkGate', agent: 'beacon', verdict: 'pass' as const, reason: 'Confidence-to-complexity ratio adequate', time: '2m ago' },
  { gate: 'SimplicityGate', agent: 'sentinel', verdict: 'warn' as const, reason: 'Plan exceeds historical avg by 1.8x', time: '5m ago' },
  { gate: 'SurgicalScopeGate', agent: 'navigator', verdict: 'pass' as const, reason: 'All changes within declared scope', time: '8m ago' },
  { gate: 'GoalVerificationGate', agent: 'beacon', verdict: 'pass' as const, reason: '4/4 success criteria met', time: '12m ago' },
  { gate: 'ThinkGate', agent: 'lexis', verdict: 'reject' as const, reason: 'Confidence critically below threshold — forced clarification', time: '18m ago' },
  { gate: 'SimplicityGate', agent: 'arbiter', verdict: 'pass' as const, reason: 'Plan aligns with historical pattern', time: '22m ago' },
];

const MOCK_DISTILLATION = {
  active: 3,
  proposed: 2,
  observations: 847,
  topClasses: [
    { taskClass: 'security', convergence: 0.89, count: 312 },
    { taskClass: 'financial', convergence: 0.76, count: 198 },
    { taskClass: 'maritime', convergence: 0.71, count: 147 },
    { taskClass: 'legal', convergence: 0.58, count: 112 },
    { taskClass: 'operational', convergence: 0.42, count: 78 },
  ],
};

const MOCK_KB_DENSITY = {
  totalEntries: 1247,
  activeEntries: 983,
  avgConfidence: 0.74,
  healthScore: 0.82,
  compressionHistory: [
    { label: 'Mon', ratio: 0.95, entries: 1180 },
    { label: 'Tue', ratio: 0.91, entries: 1120 },
    { label: 'Wed', ratio: 0.88, entries: 1050 },
    { label: 'Thu', ratio: 0.85, entries: 1010 },
    { label: 'Fri', ratio: 0.83, entries: 983 },
  ],
  domains: [
    { domain: 'security', count: 287 },
    { domain: 'financial', count: 214 },
    { domain: 'maritime', count: 178 },
    { domain: 'legal', count: 145 },
    { domain: 'operational', count: 102 },
    { domain: 'intelligence', count: 57 },
  ],
};

function VerdictBadge({ verdict }: { verdict: 'pass' | 'warn' | 'reject' }) {
  const colors = {
    pass: { bg: 'rgba(52,211,153,0.12)', text: GREEN },
    warn: { bg: 'rgba(251,191,36,0.12)', text: AMBER },
    reject: { bg: 'rgba(248,113,113,0.12)', text: RED },
  };
  const c = colors[verdict];
  return (
    <span style={{ background: c.bg, color: c.text, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
      {verdict}
    </span>
  );
}

function Card({ title, children, span }: { title: string; children: ReactNode; span?: number }) {
  return (
    <div style={{
      background: SURFACE,
      border: `1px solid ${BORDER}`,
      borderRadius: 12,
      padding: 24,
      gridColumn: span ? `span ${span}` : undefined,
    }}>
      <h3 style={{ color: GOLD, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, margin: 0, paddingBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function BarChart({ items, maxValue }: { items: Array<{ label: string; value: number; color?: string }>; maxValue: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: TEXT_DIM, fontSize: 11, width: 80, textAlign: 'right', flexShrink: 0 }}>{item.label}</span>
          <div style={{ flex: 1, height: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, (item.value / maxValue) * 100)}%`,
              height: '100%',
              background: item.color ?? GOLD,
              borderRadius: 4,
              transition: 'width 0.6s ease',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 6,
            }}>
              <span style={{ color: NAVY, fontSize: 10, fontWeight: 600 }}>{item.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px 8px' }}>
      <div style={{ color: GOLD, fontSize: 28, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ color: TEXT_DIM, fontSize: 11, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ color: TEXT_DIM, fontSize: 10, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function KarpathyEvolution() {
  const [depth, setDepth] = useState(5);
  const profile = DEPTH_PROFILES[depth - 1]!;

  const handleDepthChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setDepth(Number(e.target.value));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: NAVY, color: TEXT, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
        <header style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: TEXT }}>Karpathy Evolution</h1>
            <span style={{ color: GOLD, fontSize: 13, fontWeight: 500 }}>Agent Distillation</span>
          </div>
          <p style={{ margin: 0, color: TEXT_DIM, fontSize: 14, maxWidth: 720 }}>
            Six Karpathy-inspired primitives for agent intelligence: residual streams, autonomy depth control,
            gated reasoning, distillation convergence, ephemeral exploration, and self-compressing knowledge.
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 20 }}>
          <Card title="Autonomy Depth Dial" span={2}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <span style={{ color: profile.color, fontSize: 40, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{depth}</span>
                  <span style={{ color: TEXT_DIM, fontSize: 14, marginLeft: 8 }}>/ 10</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: TEXT, fontSize: 18, fontWeight: 600 }}>{profile.label}</div>
                  <div style={{ color: TEXT_DIM, fontSize: 12 }}>Max {profile.agents} agents</div>
                </div>
              </div>

              <input
                type="range"
                min={1}
                max={10}
                value={depth}
                onChange={handleDepthChange}
                style={{
                  width: '100%',
                  height: 6,
                  appearance: 'none',
                  background: `linear-gradient(to right, #6b7280 0%, ${BLUE} 40%, ${AMBER} 60%, ${RED} 80%, ${GOLD} 100%)`,
                  borderRadius: 3,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ color: TEXT_DIM, fontSize: 10 }}>Minimal</span>
                <span style={{ color: TEXT_DIM, fontSize: 10 }}>Sovereign</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {[
                { label: 'Karpathy Gates', active: profile.gates },
                { label: 'Shadow Council', active: profile.council },
                { label: 'Red Team', active: profile.redTeam },
                { label: 'Residual Stream', active: depth >= 5 },
                { label: 'Ephemeral Reasoning', active: depth >= 4 },
              ].map((cap) => (
                <div key={cap.label} style={{
                  padding: '8px 6px',
                  borderRadius: 8,
                  border: `1px solid ${cap.active ? 'rgba(201,183,135,0.25)' : BORDER}`,
                  background: cap.active ? 'rgba(201,183,135,0.06)' : 'transparent',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 14, marginBottom: 4 }}>{cap.active ? '●' : '○'}</div>
                  <div style={{ fontSize: 10, color: cap.active ? GOLD : TEXT_DIM, fontWeight: cap.active ? 600 : 400 }}>{cap.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 20 }}>
          <Card title="Distillation Engine">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
              <StatBox label="Active Integrated" value={MOCK_DISTILLATION.active} />
              <StatBox label="Proposed" value={MOCK_DISTILLATION.proposed} />
              <StatBox label="Observations" value={MOCK_DISTILLATION.observations} />
            </div>

            <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Convergence by Task Class</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {MOCK_DISTILLATION.topClasses.map((tc) => (
                <div key={tc.taskClass} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: TEXT_DIM, fontSize: 11, width: 70, textAlign: 'right' }}>{tc.taskClass}</span>
                  <div style={{ flex: 1, height: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      width: `${tc.convergence * 100}%`,
                      height: '100%',
                      background: tc.convergence >= 0.7 ? GREEN : tc.convergence >= 0.5 ? AMBER : 'rgba(255,255,255,0.15)',
                      borderRadius: 3,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <span style={{ color: TEXT_DIM, fontSize: 10, width: 32, textAlign: 'right' }}>{(tc.convergence * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Knowledge Density">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 16 }}>
              <StatBox label="Total" value={MOCK_KB_DENSITY.totalEntries.toLocaleString()} />
              <StatBox label="Active" value={MOCK_KB_DENSITY.activeEntries.toLocaleString()} />
              <StatBox label="Avg Conf." value={`${(MOCK_KB_DENSITY.avgConfidence * 100).toFixed(0)}%`} />
              <StatBox label="Health" value={`${(MOCK_KB_DENSITY.healthScore * 100).toFixed(0)}%`} />
            </div>

            <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Consolidation Trend</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80, marginBottom: 12 }}>
              {MOCK_KB_DENSITY.compressionHistory.map((point) => {
                const h = (point.entries / MOCK_KB_DENSITY.totalEntries) * 100;
                return (
                  <div key={point.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{
                      width: '100%',
                      height: `${h}%`,
                      background: `linear-gradient(to top, ${GOLD}, rgba(201,183,135,0.3))`,
                      borderRadius: '3px 3px 0 0',
                      minHeight: 4,
                    }} />
                    <span style={{ fontSize: 9, color: TEXT_DIM }}>{point.label}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Domain Distribution</div>
            <BarChart
              items={MOCK_KB_DENSITY.domains.map(d => ({ label: d.domain, value: d.count, color: GOLD }))}
              maxValue={Math.max(...MOCK_KB_DENSITY.domains.map(d => d.count))}
            />
          </Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
          <Card title="Karpathy Gate Audit Log">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Gate', 'Agent', 'Verdict', 'Reason', 'Time'].map(h => (
                      <th key={h} style={{ textAlign: 'left', color: TEXT_DIM, fontSize: 11, fontWeight: 500, padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_GATE_LOG.map((entry, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '10px 12px', color: TEXT, fontWeight: 500 }}>{entry.gate}</td>
                      <td style={{ padding: '10px 12px', color: TEXT_DIM }}>{entry.agent}</td>
                      <td style={{ padding: '10px 12px' }}><VerdictBadge verdict={entry.verdict} /></td>
                      <td style={{ padding: '10px 12px', color: TEXT_DIM, maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.reason}</td>
                      <td style={{ padding: '10px 12px', color: TEXT_DIM, fontSize: 11 }}>{entry.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <div style={{ margin: '2rem 0 0', padding: '1rem 1.25rem', borderRadius: 12, display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(201,183,135,0.05)', border: '1px solid rgba(201,183,135,0.15)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#9a8456', marginBottom: 4 }}>PSYCHE CONNECTION</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e0d8', marginBottom: 2 }}>Genesis Ledger — Emergence Events</div>
          <div style={{ fontSize: 11, color: 'rgba(226,224,216,0.5)' }}>Autonomy depth changes and self-correction events witnessed during Karpathy evolution cycles are recorded in the PSYCHE Genesis Ledger as documented first-occurrences.</div>
        </div>
        <a href="/a11oy/psyche/genesis" style={{ flexShrink: 0, padding: '0.5rem 1rem', borderRadius: 8, fontSize: 11, fontFamily: 'monospace', cursor: 'pointer', background: 'rgba(201,183,135,0.1)', border: '1px solid rgba(201,183,135,0.25)', color: GOLD, textDecoration: 'none' }}>
          GENESIS LEDGER →
        </a>
      </div>

      <div style={{ margin: '1rem 0 0', padding: '1rem 1.25rem', borderRadius: 12, display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(107,141,227,0.04)', border: '1px solid rgba(107,141,227,0.15)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#4a6abf', marginBottom: 4 }}>FRONTIER INTELLIGENCE</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e0d8', marginBottom: 2 }}>Mythos Index — Evolution Lineage</div>
          <div style={{ fontSize: 11, color: 'rgba(226,224,216,0.5)' }}>Karpathy evolution milestones feed the Mythos Index — the canonical record of capability emergence, model lineage, and frontier-lab benchmarks across all SZL agents.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {[
            { label: 'MYTHOS INDEX', href: '/frontier/mythos' },
            { label: 'SIGNAL FEED', href: '/frontier/feed' },
          ].map(l => {
            const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
            return (
              <a key={l.href} href={`${BASE}${l.href}`} style={{ padding: '0.5rem 1rem', borderRadius: 8, fontSize: 11, fontFamily: 'monospace', background: 'rgba(107,141,227,0.08)', border: '1px solid rgba(107,141,227,0.2)', color: '#6b8de3', textDecoration: 'none' }}>
                {l.label} →
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
