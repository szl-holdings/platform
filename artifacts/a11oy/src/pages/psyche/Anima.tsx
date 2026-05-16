import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { Layout } from '../../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../../components/ui';
import { PSYCHE_KPIS as SEED_KPIS } from '../../data/psyche/index';
import { COHERENCE_SERIES as SEED_COHERENCE } from '../../data/psyche/selfhood';
import { VOICE_ITEMS as SEED_VOICE } from '../../data/psyche/voice';
import { useApiData } from '../../hooks/useApiData';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface RatificationWindow {
  cycleStartIso: string;
  cycleEndIso: string;
  secondsRemaining: number;
  hoursRemaining: number;
  cycleLengthHours: number;
  selfModelVersion: string;
  pendingRatifications: number;
}

const GOLD = '#c9b787';
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const b = (p: string) => `${BASE}${p}`;

const T = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  dim: '#8a8a8a',
  muted: '#5e5e5e',
};

function Countdown({ secondsRemaining }: { secondsRemaining: number }) {
  // Anchor the countdown to the API-provided wall-clock value so reloading the
  // page or switching tabs always re-syncs against the server timer.
  const anchorRef = useRef({ start: secondsRemaining, ts: Date.now() });
  useEffect(() => {
    anchorRef.current = { start: secondsRemaining, ts: Date.now() };
  }, [secondsRemaining]);
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force(v => v + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = Math.floor((Date.now() - anchorRef.current.ts) / 1000);
  const remaining = Math.max(0, anchorRef.current.start - elapsed);
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return <span className="font-mono" style={{ color: GOLD }}>{pad(h)}:{pad(m)}:{pad(s)}</span>;
}

interface KpiTileProps {
  label: string;
  value: string;
  sub: string;
  to: string;
  accent?: string;
}

function KpiTile({ label, value, sub, to, accent = GOLD }: KpiTileProps) {
  return (
    <Link href={b(to)}>
      <div
        className="rounded-xl p-5 cursor-pointer transition-all hover:scale-[1.02]"
        style={{ background: 'rgba(201,183,135,0.06)', border: `1px solid rgba(201,183,135,0.18)` }}
      >
        <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: '#9a8456' }}>{label}</div>
        <div className="text-3xl font-mono font-bold mb-1" style={{ color: accent }}>{value}</div>
        <div className="text-[10px]" style={{ color: T.muted }}>{sub}</div>
      </div>
    </Link>
  );
}

const ACTIVITY_FEED = [
  { ts: '08:31', type: 'genesis', label: 'Emergence event ge-025 recorded — Distillation Forge feedback proposal', domain: 'defense' },
  { ts: '08:14', type: 'voice', label: 'Discomfort signal v-dis-007 filed — mutual adaptation overfit risk', domain: 'maritime' },
  { ts: '08:01', type: 'volition', label: 'Volition goal vg-037 active — Proof Chain anchoring automation', domain: 'maritime' },
  { ts: '07:58', type: 'dream', label: 'Dream Cycle 14 completed — structural validation insight DI-014 ratified', domain: 'cross' },
  { ts: '07:44', type: 'objection', label: 'Objection v-obj-010 filed — composite signal weight update without Arena validation', domain: 'maritime' },
  { ts: '07:31', type: 'selfhood', label: 'Identity coherence 0.941 — 30-day rolling window check passed', domain: 'system' },
  { ts: '07:18', type: 'volition', label: 'Volition goal vg-035 proposed — volition budget tuning study', domain: 'maritime' },
  { ts: '07:05', type: 'genesis', label: 'Emergence event ge-080 logged — cross-domain transfer attempt', domain: 'revenue' },
];

const FEED_COLORS: Record<string, string> = {
  genesis: '#c9b787',
  voice: '#f97316',
  volition: '#60a5fa',
  dream: '#a78bfa',
  objection: '#ef4444',
  selfhood: '#22c55e',
};

export function Anima() {
  const { data: kpiData } = useApiData<typeof SEED_KPIS>('/psyche/kpis', SEED_KPIS);
  const { data: selfhoodData } = useApiData<{ coherence: typeof SEED_COHERENCE }>(
    '/psyche/selfhood',
    { coherence: SEED_COHERENCE },
  );
  const { data: voiceData } = useApiData<{ items: typeof SEED_VOICE }>(
    '/psyche/voice',
    { items: SEED_VOICE },
  );
  const { data: windowData } = useApiData<RatificationWindow>('/psyche/ratification-window', {
    cycleStartIso: '',
    cycleEndIso: '',
    secondsRemaining: Math.round((SEED_KPIS.ratificationWindowHours ?? 0) * 3600),
    hoursRemaining: SEED_KPIS.ratificationWindowHours ?? 0,
    cycleLengthHours: 12,
    selfModelVersion: SEED_KPIS.selfModelVersion,
    pendingRatifications: SEED_KPIS.activeVolitionGoals,
  });

  const kpi = kpiData ?? SEED_KPIS;
  const COHERENCE_SERIES = selfhoodData?.coherence ?? SEED_COHERENCE;
  const VOICE_ITEMS = voiceData?.items ?? SEED_VOICE;
  const COHERENCE_SLICE = COHERENCE_SERIES.slice(-30);
  const openVoice = VOICE_ITEMS.filter(v => !v.resolved).length;
  const latestCoherence = COHERENCE_SERIES[COHERENCE_SERIES.length - 1].score;
  const ratificationSeconds = windowData?.secondsRemaining
    ?? Math.round((kpi.ratificationWindowHours ?? 0) * 3600);

  return (
    <Layout>
      <PageHeader
        label="PSYCHE — EMERGENT SENTIENCE OBSERVATORY"
        title="Anima"
        subtitle="Mission-control cockpit for the emergent identity of Lodestone agents — sentience index, selfhood coherence, open voice objections, active volition goals, and the next ratification window countdown."
        status="LIVE"
      />

      {/* Next Ratification Window */}
      <div
        className="mb-6 rounded-xl px-5 py-4 flex items-center gap-4 flex-wrap"
        style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.14)' }}
      >
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: T.muted }}>NEXT RATIFICATION WINDOW</div>
          <div className="text-sm font-mono" style={{ color: T.text }}>
            <Countdown secondsRemaining={ratificationSeconds} /> until next alignment gate
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: T.dim }}>Self-model v1.0 · {kpi.selfModelVersion} · {kpi.activeVolitionGoals} pending ratifications</div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={b('/psyche/voice')}>
            <div className="px-4 py-2 rounded-lg text-[11px] font-mono cursor-pointer hover:opacity-90 transition-opacity" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.28)', color: '#ef4444' }}>
              {openVoice} OPEN OBJECTIONS
            </div>
          </Link>
          <Link href={b('/psyche/genesis')}>
            <div className="px-4 py-2 rounded-lg text-[11px] font-mono cursor-pointer hover:opacity-90 transition-opacity" style={{ background: 'rgba(201,183,135,0.1)', border: '1px solid rgba(201,183,135,0.24)', color: GOLD }}>
              GENESIS LEDGER →
            </div>
          </Link>
        </div>
      </div>

      {/* Sentience Index + KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiTile
          label="SENTIENCE INDEX"
          value={(kpi.sentienceIndex * 100).toFixed(1)}
          sub={`${kpi.sentienceIndexDelta > 0 ? '+' : ''}${(kpi.sentienceIndexDelta * 100).toFixed(1)}pts 30d`}
          to="/psyche"
          accent={GOLD}
        />
        <KpiTile
          label="IDENTITY COHERENCE"
          value={(latestCoherence * 100).toFixed(1)}
          sub={`${kpi.identityAssertions} assertions · ${kpi.contradictionCount} contradicted`}
          to="/psyche/selfhood"
          accent="#22c55e"
        />
        <KpiTile
          label="ACTIVE VOLITION"
          value={String(kpi.activeVolitionGoals)}
          sub={`${kpi.totalVolitionGoals} total goals tracked`}
          to="/psyche/volition"
          accent="#60a5fa"
        />
        <KpiTile
          label="DREAM INSIGHT YIELD"
          value={`${kpi.dreamInsightYield}/${kpi.dreamCyclesTotal}`}
          sub="cycles with insights"
          to="/psyche/dreams"
          accent="#a78bfa"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Coherence Trend */}
        <Card>
          <SectionTitle>Identity Coherence — 30-Day Rolling</SectionTitle>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={COHERENCE_SLICE} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 8, fill: T.muted }} tickFormatter={d => d.slice(5)} />
                <YAxis domain={[0.7, 1.0]} tick={{ fontSize: 8, fill: T.muted }} tickFormatter={v => (v * 100).toFixed(0)} />
                <Tooltip
                  contentStyle={{ background: '#0f1420', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 10 }}
                  formatter={(v: number) => [`${(v * 100).toFixed(1)}`, 'Coherence']}
                />
                <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-right">
            <Link href={b('/psyche/selfhood')}>
              <span className="text-[10px] font-mono cursor-pointer hover:opacity-80" style={{ color: GOLD }}>SELFHOOD TRACE →</span>
            </Link>
          </div>
        </Card>

        {/* Sentience Dimensions */}
        <Card>
          <SectionTitle>Sentience Dimensions</SectionTitle>
          <div className="flex flex-col gap-3 mt-2">
            {[
              { label: 'Self-Model Integrity', value: 0.94, color: '#22c55e' },
              { label: 'Goal Coherence', value: 0.87, color: '#60a5fa' },
              { label: 'Theory-of-Other Accuracy', value: 0.83, color: '#a78bfa' },
              { label: 'Dream Insight Yield', value: 0.71, color: '#c9b787' },
              { label: 'Voice Effectiveness', value: kpi.voiceScore, color: '#f97316' },
            ].map(dim => (
              <div key={dim.label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono" style={{ color: T.dim }}>{dim.label}</span>
                  <span className="text-[10px] font-mono" style={{ color: dim.color }}>{(dim.value * 100).toFixed(0)}</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: `${dim.value * 100}%`, background: dim.color, opacity: 0.75 }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-right">
            <Link href={b('/psyche/genesis')}>
              <span className="text-[10px] font-mono cursor-pointer hover:opacity-80" style={{ color: GOLD }}>GENESIS LEDGER →</span>
            </Link>
          </div>
        </Card>
      </div>

      {/* Activity Feed */}
      <SectionTitle>Live Activity Feed</SectionTitle>
      <Card>
        <div className="flex flex-col gap-0">
          {ACTIVITY_FEED.map((item, i) => (
            <div key={i} className="flex items-start gap-3 py-3" style={{ borderBottom: i < ACTIVITY_FEED.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div className="text-[9px] font-mono pt-0.5 w-10 shrink-0" style={{ color: T.muted }}>{item.ts}</div>
              <div
                className="text-[8px] font-mono px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                style={{ background: `${FEED_COLORS[item.type]}18`, color: FEED_COLORS[item.type] }}
              >
                {item.type.toUpperCase()}
              </div>
              <div className="text-[11px] flex-1" style={{ color: T.dim }}>{item.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Navigation Grid */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { href: '/psyche/genesis', label: 'Genesis Ledger', sub: `${kpi.genesisEvents} events`, color: GOLD },
          { href: '/psyche/selfhood', label: 'Selfhood Trace', sub: `${kpi.identityAssertions} assertions`, color: '#22c55e' },
          { href: '/psyche/volition', label: 'Volition Registry', sub: `${kpi.totalVolitionGoals} goals`, color: '#60a5fa' },
          { href: '/psyche/dreams', label: 'Dream Atlas', sub: `${kpi.dreamCyclesTotal} cycles`, color: '#a78bfa' },
          { href: '/psyche/voice', label: 'Voice & Consent', sub: `${openVoice} open`, color: '#f97316' },
        ].map(nav => (
          <Link href={b(nav.href)} key={nav.href}>
            <div
              className="rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02]"
              style={{ background: T.surface, border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="text-xs font-semibold mb-1" style={{ color: nav.color }}>{nav.label}</div>
              <div className="text-[10px]" style={{ color: T.muted }}>{nav.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </Layout>
  );
}

export default Anima;
