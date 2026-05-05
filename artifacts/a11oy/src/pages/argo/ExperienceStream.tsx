import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { Layout } from '../../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../../components/ui';
import { EXPERIENCE_EVENTS, THROUGHPUT_BY_HOUR, ARGO_DOMAINS } from '../../data/argo';
import type { DomainId, RewardSign } from '../../data/argo';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts';

const GOLD = '#c9b787';
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

const REWARD_COLORS: Record<RewardSign, string> = {
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#8a8a8a',
};

const TYPE_COLORS = {
  signal: '#60a5fa',
  action: '#c9b787',
  outcome: '#22c55e',
  correction: '#f97316',
};

const ALL_WORKCELLS = ['all', 'wc-001', 'wc-002', 'wc-003', 'wc-004', 'wc-005', 'wc-006'];
const ALL_DOMAINS: (DomainId | 'all')[] = ['all', ...ARGO_DOMAINS.map(d => d.id)];
const ALL_SIGNS: (RewardSign | 'all')[] = ['all', 'positive', 'negative', 'neutral'];

export function ExperienceStream() {
  const [domainFilter, setDomainFilter] = useState<DomainId | 'all'>('all');
  const [signFilter, setSignFilter] = useState<RewardSign | 'all'>('all');
  const [workcellFilter, setWorkcellFilter] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(12);
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = EXPERIENCE_EVENTS.filter(ev => {
    if (domainFilter !== 'all' && ev.domain !== domainFilter) return false;
    if (signFilter !== 'all' && ev.rewardSign !== signFilter) return false;
    if (workcellFilter !== 'all' && ev.workcellId !== workcellFilter) return false;
    return true;
  });

  const displayed = filtered.slice(0, visibleCount);

  // Auto-scroll effect
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setVisibleCount(prev => Math.min(prev + 1, filtered.length));
      if (scrollRef.current && !paused) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 2000);
    return () => clearInterval(id);
  }, [paused, filtered.length]);

  // Compute throughput from filtered set
  const filteredThroughput = THROUGHPUT_BY_HOUR.map(h => ({
    ...h,
    count: Math.round(h.count * (filtered.length / EXPERIENCE_EVENTS.length)),
  }));

  const totalPositive = filtered.filter(e => e.rewardSign === 'positive').length;
  const totalNegative = filtered.filter(e => e.rewardSign === 'negative').length;
  const totalNeutral = filtered.filter(e => e.rewardSign === 'neutral').length;

  return (
    <Layout>
      <PageHeader
        label="ARGO · STREAM OF EXPERIENCE"
        title="Stream of Experience"
        subtitle="Live event tape of every signal, action, realized outcome, and correction flowing into the Argo improvement loop — tagged by domain, reward magnitude, and source workcell. Filters recompute throughput sparkline and heatmap in real time."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="TOTAL EVENTS" value={filtered.length} sub={domainFilter === 'all' ? 'all domains' : domainFilter} accent={GOLD} />
        <KpiCard label="POSITIVE REWARD" value={totalPositive} sub="experience-positive" accent="#22c55e" />
        <KpiCard label="CORRECTIONS" value={totalNegative} sub="negative reward" accent="#ef4444" />
        <KpiCard label="THROUGHPUT" value={`${(filtered.length / EXPERIENCE_EVENTS.length * 31.4).toFixed(1)}`} sub="events / sec (filtered)" accent={GOLD} />
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <div className="flex flex-wrap gap-6">
          <div>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: '#5e5e5e' }}>Domain</div>
            <div className="flex gap-1 flex-wrap">
              {ALL_DOMAINS.map(d => {
                const dom = d === 'all' ? null : ARGO_DOMAINS.find(dd => dd.id === d);
                return (
                  <button key={d} onClick={() => setDomainFilter(d)} className="text-[9px] font-mono px-2 py-1 rounded"
                    style={{ background: domainFilter === d ? 'rgba(201,183,135,0.12)' : 'transparent', color: domainFilter === d ? (dom?.color ?? GOLD) : '#5e5e5e', border: `1px solid ${domainFilter === d ? 'rgba(201,183,135,0.2)' : 'transparent'}`, cursor: 'pointer' }}>
                    {d === 'all' ? 'All' : dom?.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: '#5e5e5e' }}>Reward Sign</div>
            <div className="flex gap-1">
              {ALL_SIGNS.map(s => (
                <button key={s} onClick={() => setSignFilter(s)} className="text-[9px] font-mono px-2 py-1 rounded"
                  style={{ background: signFilter === s ? 'rgba(201,183,135,0.12)' : 'transparent', color: signFilter === s ? (s === 'all' ? GOLD : REWARD_COLORS[s]) : '#5e5e5e', border: `1px solid ${signFilter === s ? 'rgba(201,183,135,0.2)' : 'transparent'}`, cursor: 'pointer' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: '#5e5e5e' }}>Workcell</div>
            <div className="flex gap-1 flex-wrap">
              {ALL_WORKCELLS.map(wc => (
                <button key={wc} onClick={() => setWorkcellFilter(wc)} className="text-[9px] font-mono px-2 py-1 rounded"
                  style={{ background: workcellFilter === wc ? 'rgba(201,183,135,0.12)' : 'transparent', color: workcellFilter === wc ? GOLD : '#5e5e5e', border: `1px solid ${workcellFilter === wc ? 'rgba(201,183,135,0.2)' : 'transparent'}`, cursor: 'pointer' }}>
                  {wc === 'all' ? 'All' : wc}
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto flex items-end">
            <button
              onClick={() => setPaused(p => !p)}
              className="text-[10px] font-mono px-4 py-2 rounded-lg"
              style={{ background: paused ? 'rgba(201,183,135,0.1)' : 'rgba(239,68,68,0.1)', color: paused ? GOLD : '#ef4444', border: `1px solid ${paused ? 'rgba(201,183,135,0.2)' : 'rgba(239,68,68,0.2)'}`, cursor: 'pointer' }}
            >
              {paused ? '▶ Resume' : '⏸ Pause'}
            </button>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Event tape */}
        <div className="lg:col-span-2">
          <SectionTitle>Experience Tape (auto-scroll)</SectionTitle>
          <div
            ref={scrollRef}
            className="flex flex-col gap-2 overflow-y-auto"
            style={{ maxHeight: 480, scrollBehavior: 'smooth' }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {displayed.map(ev => {
              const dom = ARGO_DOMAINS.find(d => d.id === ev.domain);
              return (
                <div key={ev.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: REWARD_COLORS[ev.rewardSign] }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${TYPE_COLORS[ev.eventType]}14`, color: TYPE_COLORS[ev.eventType] }}>{ev.eventType}</span>
                      <span className="text-[9px] font-mono" style={{ color: dom?.color ?? '#8a8a8a' }}>{dom?.label}</span>
                      <span className="text-[9px] font-mono" style={{ color: '#5e5e5e' }}>{ev.workcellId}</span>
                      <span className="text-[9px] font-mono ml-auto" style={{ color: '#5e5e5e' }}>{new Date(ev.ts).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-xs" style={{ color: '#c5c5c5' }}>{ev.description}</div>
                    {ev.rewardDelta !== 0 && (
                      <div className="text-[9px] font-mono mt-0.5" style={{ color: REWARD_COLORS[ev.rewardSign] }}>
                        Reward Δ {ev.rewardDelta > 0 ? '+' : ''}{ev.rewardDelta.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className="text-[9px] font-mono shrink-0" style={{ color: '#3a3a3a' }}>{ev.proofRef}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Throughput + heatmap */}
        <div>
          <SectionTitle>Throughput Sparkline</SectionTitle>
          <div className="rounded-lg p-3 mb-4" style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.06)' }}>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={filteredThroughput} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                <defs>
                  <linearGradient id="tpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" tick={{ fill: '#5e5e5e', fontSize: 8 }} tickLine={false} axisLine={false} tickFormatter={h => `${h}h`} interval={5} />
                <YAxis tick={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, fontSize: 9 }} formatter={(v: number) => [`${v} ev/s`, 'Throughput']} />
                <Area type="monotone" dataKey="count" stroke={GOLD} fill="url(#tpGrad)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <SectionTitle>Experience Density by Hour</SectionTitle>
          <div className="rounded-lg p-3" style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.06)' }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={filteredThroughput} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: '#5e5e5e', fontSize: 8 }} tickLine={false} axisLine={false} tickFormatter={h => `${h}h`} interval={5} />
                <YAxis tick={{ fill: '#5e5e5e', fontSize: 8 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, fontSize: 9 }} formatter={(v: number) => [`${v}`, 'Events']} />
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                  {filteredThroughput.map((h, i) => (
                    <Cell key={i} fill={h.count >= 28 ? GOLD : h.count >= 18 ? '#8a8a8a' : '#3a3a3a'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-4 text-[10px] flex-wrap">
        <Link href={`${BASE}/argo`} className="font-mono" style={{ color: '#8a8a8a' }}>← Argo Bridge</Link>
        <Link href={`${BASE}/learning`} className="font-mono" style={{ color: GOLD }}>Learning Loop →</Link>
        <Link href={`${BASE}/outcomes`} className="font-mono" style={{ color: GOLD }}>Outcome Graph →</Link>
        <Link href={`${BASE}/argo/ineffable`} className="font-mono" style={{ color: GOLD }}>Ineffable Channel →</Link>
      </div>
    </Layout>
  );
}
