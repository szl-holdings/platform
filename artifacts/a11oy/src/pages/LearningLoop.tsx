import { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

const T = {
  surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

const CALIBRATION_DATA = [
  { predicted: 0.90, actual: 0.92, domain: 'maritime', n: 84 },
  { predicted: 0.80, actual: 0.78, domain: 'cyber', n: 120 },
  { predicted: 0.70, actual: 0.72, domain: 'legal', n: 67 },
  { predicted: 0.95, actual: 0.94, domain: 'maritime', n: 44 },
  { predicted: 0.60, actual: 0.63, domain: 'revenue', n: 98 },
  { predicted: 0.85, actual: 0.83, domain: 'cyber', n: 55 },
  { predicted: 0.75, actual: 0.76, domain: 'legal', n: 72 },
  { predicted: 0.50, actual: 0.52, domain: 'defense', n: 31 },
  { predicted: 0.88, actual: 0.87, domain: 'revenue', n: 61 },
  { predicted: 0.65, actual: 0.68, domain: 'maritime', n: 49 },
  { predicted: 0.92, actual: 0.90, domain: 'legal', n: 38 },
  { predicted: 0.78, actual: 0.80, domain: 'cyber', n: 87 },
];

const ACCEPTANCE_DATA = [
  { week: 'W1', maritime: 74, cyber: 81, legal: 78, revenue: 69, defense: 85 },
  { week: 'W2', maritime: 77, cyber: 83, legal: 80, revenue: 72, defense: 86 },
  { week: 'W3', maritime: 76, cyber: 82, legal: 83, revenue: 75, defense: 88 },
  { week: 'W4', maritime: 80, cyber: 85, legal: 82, revenue: 79, defense: 87 },
  { week: 'W5', maritime: 82, cyber: 87, legal: 85, revenue: 82, defense: 89 },
  { week: 'W6', maritime: 84, cyber: 86, legal: 87, revenue: 84, defense: 91 },
  { week: 'W7', maritime: 83, cyber: 88, legal: 88, revenue: 86, defense: 90 },
  { week: 'W8', maritime: 86, cyber: 89, legal: 89, revenue: 88, defense: 92 },
];

const DOMAIN_DRIFT = [
  { domain: 'Maritime', score: 0.97, drift: 0.8, status: 'stable', color: '#8a8a8a' },
  { domain: 'Cyber', score: 0.94, drift: 1.2, status: 'stable', color: '#f5f5f5' },
  { domain: 'Legal', score: 0.95, drift: 0.6, status: 'stable', color: '#c9b787' },
  { domain: 'Revenue', score: 0.91, drift: 2.1, status: 'watch', color: '#b08d52' },
  { domain: 'Defense', score: 0.96, drift: 0.4, status: 'stable', color: '#f5f5f5' },
  { domain: 'Real Estate', score: 0.88, drift: 3.4, status: 'drift', color: '#c9b787' },
  { domain: 'Advisory', score: 0.90, drift: 1.8, status: 'watch', color: '#8a8a8a' },
];

const LESSONS = [
  { date: '2026-04-24', domain: 'maritime', lesson: 'Port Klang standby recommendation accepted 3 consecutive times — raised prior weight by 0.08', impact: '+3.2% acceptance rate' },
  { date: '2026-04-22', domain: 'cyber', lesson: 'TG-Ember IOC auto-isolation approved — policy threshold lowered from 0.95 to 0.90 for known APTs', impact: '−340ms response time' },
  { date: '2026-04-20', domain: 'legal', lesson: 'Opposing late-filing pattern detected 5 times — added to standard early-escalation trigger set', impact: '+12% early flag rate' },
  { date: '2026-04-18', domain: 'revenue', lesson: '"Coaching intervention" accepted in 8 of 10 recommendations — moved from tier-2 to tier-1 default', impact: '+8% win rate estimate' },
  { date: '2026-04-15', domain: 'defense', lesson: 'GROM signature match confirmed in 2 incidents — SIGINT pattern added to primary threat model', impact: '−2.1h detection lag' },
  { date: '2026-04-12', domain: 'real-estate', lesson: 'Cap rate compression signal leading indicator confirmed — lag reduced from 14d to 7d', impact: '+18bps earlier warning' },
  { date: '2026-04-10', domain: 'maritime', lesson: 'Fuel anomaly alone insufficient — combined fuel+ETA required. Single-signal weight reduced.', impact: '−6% false positives' },
  { date: '2026-04-08', domain: 'legal', lesson: 'Summary judgment motions with 3+ precedents accepted at 94% — minimum citation threshold raised', impact: '+4% approval rate' },
];

const DOMAIN_COLORS: Record<string, string> = {
  maritime: '#8a8a8a', cyber: '#f5f5f5', legal: '#c9b787', revenue: '#b08d52',
  defense: '#f5f5f5', 'real-estate': '#c9b787', advisory: '#8a8a8a',
};

const LINE_COLORS = { maritime: '#8a8a8a', cyber: '#f5f5f5', legal: '#c9b787', revenue: '#b08d52', defense: '#5e5e5e' };

function DriftGauge({ domain, score, drift, status, color }: typeof DOMAIN_DRIFT[0]) {
  const driftPct = Math.min(drift * 20, 100);
  const statusColor = status === 'stable' ? '#c9b787' : status === 'watch' ? '#8a8a8a' : '#f5f5f5';
  return (
    <Card>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium" style={{ color }}>{domain}</span>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${statusColor}18`, color: statusColor }}>{status}</span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${score * 100}%`, background: color }} />
        </div>
        <span className="text-[10px] font-mono" style={{ color }}>{Math.round(score * 100)}%</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[9px]" style={{ color: T.muted }}>drift</span>
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full" style={{ width: `${driftPct}%`, background: statusColor }} />
        </div>
        <span className="text-[9px] font-mono" style={{ color: statusColor }}>{drift}%</span>
      </div>
    </Card>
  );
}

export function LearningLoop() {
  const [activeTab, setActiveTab] = useState<'calibration' | 'drift' | 'acceptance' | 'lessons'>('calibration');

  return (
    <Layout>
      <PageHeader
        label="LEARNING LOOP"
        title="Outcome Learning Loop"
        subtitle="Past outcomes improve future decisions. Calibration curves, drift detection, acceptance rates, and a lessons-learned timeline — all feeding back into the system."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="CALIBRATION" value="94.2%" sub="global pass rate" accent={T.accent} />
        <KpiCard label="ACCEPTANCE RATE" value="87%" sub="week 8" accent={T.accent} />
        <KpiCard label="DOMAINS STABLE" value="5/7" sub="within threshold" accent={T.accent} />
        <KpiCard label="LESSONS LEARNED" value={LESSONS.length} sub="this month" accent={T.dim} />
      </div>

      <div className="flex gap-1 mb-6">
        {(['calibration', 'drift', 'acceptance', 'lessons'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all"
            style={{
              background: activeTab === tab ? 'rgba(201,183,135,0.1)' : 'transparent',
              color: activeTab === tab ? T.accent : T.muted,
              border: `1px solid ${activeTab === tab ? 'rgba(201,183,135,0.2)' : 'transparent'}`,
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'calibration' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <SectionTitle>Calibration Curve — Predicted vs Actual Success</SectionTitle>
            <div className="rounded-lg p-4" style={{ background: '#050505', border: `1px solid ${T.border}` }}>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="predicted" type="number" domain={[0.4, 1]} tick={{ fill: T.muted, fontSize: 10 }} tickLine={false} axisLine={false} label={{ value: 'Predicted Confidence', position: 'insideBottom', offset: -10, fill: T.muted, fontSize: 10 }} />
                  <YAxis dataKey="actual" type="number" domain={[0.4, 1]} tick={{ fill: T.muted, fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#111', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11 }}
                    formatter={(v: number) => [`${Math.round(v * 100)}%`]}
                    labelFormatter={() => ''}
                  />
                  <Scatter data={CALIBRATION_DATA} fill={T.accent} fillOpacity={0.8} r={4} />
                </ScatterChart>
              </ResponsiveContainer>
              <div className="mt-2 text-[10px] text-center" style={{ color: T.muted }}>Perfect calibration = diagonal. Points above = underconfident. Points below = overconfident.</div>
            </div>
          </div>
          <div>
            <SectionTitle>Calibration by Domain</SectionTitle>
            <div className="flex flex-col gap-2">
              {DOMAIN_DRIFT.map(d => {
                const pts = CALIBRATION_DATA.filter(c => c.domain === d.domain.toLowerCase());
                const avgErr = pts.length ? pts.reduce((a, c) => a + Math.abs(c.predicted - c.actual), 0) / pts.length : 0;
                return (
                  <Card key={d.domain}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: d.color }}>{d.domain}</span>
                      <span className="text-[10px] font-mono" style={{ color: T.muted }}>{pts.length} samples</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span style={{ color: T.muted }}>Avg error:</span>
                      <span className="font-mono" style={{ color: avgErr < 0.03 ? T.accent : avgErr < 0.06 ? '#8a8a8a' : '#f5f5f5' }}>
                        {pts.length ? `±${(avgErr * 100).toFixed(1)}%` : 'n/a'}
                      </span>
                      <span style={{ color: T.muted }}>Score: </span>
                      <span className="font-mono" style={{ color: d.color }}>{Math.round(d.score * 100)}%</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'drift' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DOMAIN_DRIFT.map(d => <DriftGauge key={d.domain} {...d} />)}
          <Card style={{ gridColumn: '1 / -1' }}>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: T.muted }}>DRIFT THRESHOLDS</div>
            <div className="flex flex-wrap gap-4 text-[10px]">
              <div><span className="font-mono" style={{ color: T.accent }}>stable</span> — drift &lt; 2%</div>
              <div><span className="font-mono" style={{ color: '#8a8a8a' }}>watch</span> — drift 2–3%</div>
              <div><span className="font-mono" style={{ color: '#f5f5f5' }}>drift</span> — drift &gt; 3% — recalibration queued</div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'acceptance' && (
        <div>
          <SectionTitle>Recommendation Acceptance Rate — 8 Weeks</SectionTitle>
          <div className="rounded-lg p-4" style={{ background: '#050505', border: `1px solid ${T.border}` }}>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={ACCEPTANCE_DATA} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="week" tick={{ fill: T.muted, fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis domain={[60, 100]} tick={{ fill: T.muted, fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#111', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11 }} formatter={(v: number) => [`${v}%`]} />
                {(Object.entries(LINE_COLORS) as [string, string][]).map(([domain, color]) => (
                  <Line key={domain} type="monotone" dataKey={domain} stroke={color} strokeWidth={1.5} dot={false} strokeOpacity={0.8} />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-4 mt-2">
              {Object.entries(LINE_COLORS).map(([domain, color]) => (
                <div key={domain} className="flex items-center gap-1.5 text-[9px]">
                  <div className="w-3 h-0.5 rounded" style={{ background: color }} />
                  <span style={{ color: T.muted }}>{domain}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'lessons' && (
        <div>
          <SectionTitle>Lessons Learned Timeline</SectionTitle>
          <div className="flex flex-col gap-3">
            {LESSONS.map((lesson, i) => {
              const color = DOMAIN_COLORS[lesson.domain] ?? T.accent;
              return (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: color }} />
                    {i < LESSONS.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: T.border }} />}
                  </div>
                  <Card style={{ flex: 1, marginBottom: '0' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${color}18`, color }}>{lesson.domain}</span>
                      <span className="text-[9px] font-mono" style={{ color: T.muted }}>{lesson.date}</span>
                    </div>
                    <p className="text-xs mb-2" style={{ color: T.dim }}>{lesson.lesson}</p>
                    <div className="text-[9px] font-mono" style={{ color: T.accent }}>Impact: {lesson.impact}</div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Layout>
  );
}
