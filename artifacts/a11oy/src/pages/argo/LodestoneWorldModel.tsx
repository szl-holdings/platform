import { useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../../components/ui';
import { CANDIDATE_DECISIONS, CALIBRATION_POINTS, ARGO_DOMAINS } from '../../data/argo';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ReferenceLine,
} from 'recharts';

const GOLD = '#c9b787';
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

const TRACE_COLORS = { revenue: '#c9b787', risk: '#ef4444', sla: '#60a5fa', compliance: '#22c55e' };

const DOMAIN_FILTER_ALL = 'all';

export function LodestoneWorldModel() {
  const [selectedA, setSelectedA] = useState(CANDIDATE_DECISIONS[0].id);
  const [selectedB, setSelectedB] = useState(CANDIDATE_DECISIONS[1].id);
  const [selectedC, setSelectedC] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState(DOMAIN_FILTER_ALL);

  const decA = CANDIDATE_DECISIONS.find(d => d.id === selectedA) ?? CANDIDATE_DECISIONS[0];
  const decB = CANDIDATE_DECISIONS.find(d => d.id === selectedB) ?? CANDIDATE_DECISIONS[1];
  const decC = selectedC ? CANDIDATE_DECISIONS.find(d => d.id === selectedC) ?? null : null;

  const filteredCalibration = domainFilter === DOMAIN_FILTER_ALL
    ? CALIBRATION_POINTS
    : CALIBRATION_POINTS.filter(p => p.domain === domainFilter);

  const scatterData = filteredCalibration.map(p => ({
    ...p,
    color: ARGO_DOMAINS.find(d => d.id === p.domain)?.color ?? GOLD,
  }));

  return (
    <Layout>
      <PageHeader
        label="ARGO · LODESTONE WORLD MODEL"
        title="Lodestone World Model"
        subtitle="MuZero-style learned latent dynamics. Pick candidate decisions and roll out predicted trajectories over revenue, risk, SLA, and compliance dimensions — each with confidence bands. Calibration scorecard vs. realized outcomes over 90 days."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="WORLD-MODEL ACC." value="89.1%" sub="90-day avg" accent={GOLD} />
        <KpiCard label="CANDIDATE DECISIONS" value={CANDIDATE_DECISIONS.length} sub="available for rollout" accent={GOLD} />
        <KpiCard label="CALIBRATION POINTS" value={CALIBRATION_POINTS.length} sub="last 90 days" accent={GOLD} />
        <KpiCard label="AVG CONFIDENCE" value="86.4%" sub="across all domains" accent={GOLD} />
      </div>

      {/* Candidate decision pickers */}
      <SectionTitle>Candidate Decision Selector</SectionTitle>
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Candidate A', val: selectedA, set: setSelectedA },
          { label: 'Candidate B', val: selectedB, set: setSelectedB },
          { label: 'Candidate C (optional)', val: selectedC ?? '', set: (v: string) => setSelectedC(v || null) },
        ].map(({ label, val, set }) => (
          <div key={label}>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: '#5e5e5e' }}>{label}</div>
            <select
              value={val}
              onChange={e => set(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-xs font-mono"
              style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#f5f5f5', outline: 'none' }}
            >
              {label.includes('optional') && <option value="">— none —</option>}
              {CANDIDATE_DECISIONS.map(d => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Rollout charts side by side */}
      <div className={`grid gap-6 mb-8 ${decC ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        {([decA, decB, ...(decC ? [decC] : [])] as typeof CANDIDATE_DECISIONS[number][]).map((dec, i) => (
          <Card key={dec.id}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-[9px] font-mono uppercase tracking-widest mb-0.5" style={{ color: '#9a8456' }}>Candidate {['A', 'B', 'C'][i]}</div>
                <div className="text-sm font-semibold mb-1" style={{ color: '#f5f5f5' }}>{dec.label}</div>
              </div>
              <div className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(201,183,135,0.08)', color: GOLD }}>
                {ARGO_DOMAINS.find(d => d.id === dec.domain)?.label}
              </div>
            </div>
            <div className="text-[10px] mb-3" style={{ color: '#8a8a8a' }}>{dec.description}</div>
            <div className="text-[9px] font-mono mb-2" style={{ color: '#5e5e5e' }}>Recommended by: <span style={{ color: GOLD }}>{dec.recommendedBy}</span></div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dec.traces} margin={{ top: 4, right: 8, bottom: 8, left: -16 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="t" tick={{ fill: '#5e5e5e', fontSize: 8 }} tickLine={false} axisLine={false} label={{ value: 'days', position: 'insideBottom', offset: -4, fill: '#5e5e5e', fontSize: 8 }} />
                <YAxis domain={[60, 180]} tick={{ fill: '#5e5e5e', fontSize: 8 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, fontSize: 10 }} formatter={(v: number, name: string) => [`${v.toFixed(1)}`, name]} />
                <ReferenceLine y={100} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                {(['revenue', 'risk', 'sla', 'compliance'] as const).map(k => (
                  <Line key={k} type="monotone" dataKey={k} stroke={TRACE_COLORS[k]} strokeWidth={1.5} dot={false} name={k} />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2">
              {Object.entries(TRACE_COLORS).map(([k, c]) => (
                <div key={k} className="flex items-center gap-1 text-[9px]">
                  <div className="w-3 h-0.5 rounded" style={{ background: c }} />
                  <span style={{ color: '#5e5e5e' }}>{k}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[9px] font-mono" style={{ color: '#5e5e5e' }}>
              Confidence @ T={dec.traces[dec.traces.length - 1].t}: <span style={{ color: GOLD }}>{(dec.traces[dec.traces.length - 1].confidence * 100).toFixed(1)}%</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Calibration scorecard */}
      <div className="flex items-center justify-between mb-4">
        <SectionTitle>Calibration Scorecard — Predicted vs. Realized (90 days)</SectionTitle>
        <div className="flex gap-2">
          <button
            onClick={() => setDomainFilter(DOMAIN_FILTER_ALL)}
            className="text-[10px] font-mono px-3 py-1 rounded-lg"
            style={{
              background: domainFilter === DOMAIN_FILTER_ALL ? 'rgba(201,183,135,0.12)' : 'transparent',
              color: domainFilter === DOMAIN_FILTER_ALL ? GOLD : '#5e5e5e',
              border: `1px solid ${domainFilter === DOMAIN_FILTER_ALL ? 'rgba(201,183,135,0.2)' : 'transparent'}`,
              cursor: 'pointer',
            }}
          >All</button>
          {ARGO_DOMAINS.map(dom => (
            <button
              key={dom.id}
              onClick={() => setDomainFilter(dom.id)}
              className="text-[10px] font-mono px-3 py-1 rounded-lg"
              style={{
                background: domainFilter === dom.id ? 'rgba(201,183,135,0.12)' : 'transparent',
                color: domainFilter === dom.id ? dom.color : '#5e5e5e',
                border: `1px solid ${domainFilter === dom.id ? 'rgba(201,183,135,0.2)' : 'transparent'}`,
                cursor: 'pointer',
              }}
            >{dom.label}</button>
          ))}
        </div>
      </div>

      <Card>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="predicted" type="number" domain={[0.65, 1.0]} tick={{ fill: '#5e5e5e', fontSize: 9 }} tickLine={false} axisLine={false} label={{ value: 'Predicted confidence', position: 'insideBottom', offset: -10, fill: '#5e5e5e', fontSize: 9 }} />
            <YAxis dataKey="realized" type="number" domain={[0.65, 1.0]} tick={{ fill: '#5e5e5e', fontSize: 9 }} tickLine={false} axisLine={false} label={{ value: 'Realized', angle: -90, position: 'insideLeft', fill: '#5e5e5e', fontSize: 9 }} />
            <ReferenceLine stroke="rgba(201,183,135,0.2)" strokeDasharray="4 4" segment={[{ x: 0.65, y: 0.65 }, { x: 1.0, y: 1.0 }]} />
            <Tooltip
              contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, fontSize: 10 }}
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0]?.payload as (typeof scatterData)[0];
                return (
                  <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ color: d.color, fontSize: 11, fontWeight: 600 }}>{d.decisionLabel}</div>
                    <div style={{ color: '#8a8a8a', fontSize: 10 }}>{ARGO_DOMAINS.find(dom => dom.id === d.domain)?.label}</div>
                    <div style={{ color: '#f5f5f5', fontSize: 10 }}>Predicted {(d.predicted * 100).toFixed(0)}% → Realized {(d.realized * 100).toFixed(0)}%</div>
                  </div>
                );
              }}
            />
            <Scatter data={scatterData} r={5}>
              {scatterData.map((d, i) => (
                <Cell key={i} fill={d.color} fillOpacity={0.8} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="mt-2 text-[10px] text-center" style={{ color: '#5e5e5e' }}>Diagonal = perfect calibration. Points above = underconfident. Points below = overconfident.</div>
      </Card>

      <div className="mt-6 flex gap-4 text-[10px] flex-wrap">
        <Link href={`${BASE}/proof`} className="font-mono" style={{ color: GOLD }}>Proof Chain →</Link>
        <Link href={`${BASE}/argo`} className="font-mono" style={{ color: '#8a8a8a' }}>← Argo Bridge</Link>
        <Link href={`${BASE}/argo/arena`} className="font-mono" style={{ color: GOLD }}>Self-Play Arena →</Link>
      </div>
    </Layout>
  );
}
