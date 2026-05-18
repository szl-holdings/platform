// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { Layout } from '../../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../../components/ui';
import { BRIDGE_KPIS, CHAMPION_POLICIES, ARGO_DOMAINS } from '../../data/argo';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const GOLD = '#c9b787';
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const b = (p: string) => `${BASE}${p}`;

const ACCURACY_TREND = [
  { d: '04-15', acc: 0.871 }, { d: '04-18', acc: 0.876 }, { d: '04-21', acc: 0.880 },
  { d: '04-24', acc: 0.884 }, { d: '04-27', acc: 0.886 }, { d: '04-30', acc: 0.889 },
  { d: '05-03', acc: 0.891 },
];

const THROUGHPUT_TREND = [
  { d: '04-15', ev: 22.1 }, { d: '04-18', ev: 24.6 }, { d: '04-21', ev: 26.8 },
  { d: '04-24', ev: 28.4 }, { d: '04-27', ev: 29.7 }, { d: '04-30', ev: 30.8 },
  { d: '05-03', ev: 31.4 },
];

interface KpiTileProps {
  label: string;
  value: string;
  sub: string;
  to: string;
}

function KpiTile({ label, value, sub, to }: KpiTileProps) {
  return (
    <Link href={b(to)}>
      <div
        className="rounded-xl p-5 cursor-pointer transition-all hover:scale-[1.02]"
        style={{ background: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.18)' }}
      >
        <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: '#9a8456' }}>{label}</div>
        <div className="text-3xl font-mono font-bold mb-1" style={{ color: GOLD }}>{value}</div>
        <div className="text-[10px]" style={{ color: '#5e5e5e' }}>{sub}</div>
      </div>
    </Link>
  );
}

function Countdown({ hours }: { hours: number }) {
  const totalSeconds = useRef(Math.round(hours * 3600));
  const [remaining, setRemaining] = useState(totalSeconds.current);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <span className="font-mono" style={{ color: GOLD }}>
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}

export function ArgoBridge() {
  return (
    <Layout>
      <PageHeader
        label="ARGO — EXPERIENCE-ERA DECISION ENGINE"
        title="Argo Bridge"
        subtitle="Mission-control overview of the self-improving decision loop. Champion policies per domain, world-model accuracy vs. realized outcomes, experience-stream throughput, latent-channel utilization, and next promotion countdown."
        status="LIVE"
      />

      {/* Next promotion countdown */}
      <div className="mb-6 rounded-xl px-5 py-4 flex items-center gap-4" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.14)' }}>
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: GOLD }} />
        <span className="text-xs" style={{ color: '#8a8a8a' }}>Next champion promotion in</span>
        <Countdown hours={BRIDGE_KPIS.nextPromotionInHours} />
        <span className="text-xs" style={{ color: '#5e5e5e' }}>— Lodestone-Defense-v5 → Sovereign tier pending regret gate</span>
        <Link href={b('/argo/forge')} className="ml-auto text-[10px] font-mono" style={{ color: GOLD }}>View Forge →</Link>
      </div>

      {/* KPI tiles — clickable, route to subpages */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        <KpiTile label="Champion Policies" value={String(BRIDGE_KPIS.championCount)} sub="one per domain" to="/argo/arena" />
        <KpiTile label="World-Model Acc." value={`${Math.round(BRIDGE_KPIS.worldModelAccuracy * 1000) / 10}%`} sub="90-day calibration" to="/argo/world-model" />
        <KpiTile label="Experience Throughput" value={`${BRIDGE_KPIS.experienceThroughput}`} sub="events / sec" to="/argo/stream" />
        <KpiTile label="Latent Channel" value={`${Math.round(BRIDGE_KPIS.latentChannelUtilization * 100)}%`} sub="utilization" to="/argo/ineffable" />
        <KpiTile label="Active Variants" value={String(BRIDGE_KPIS.activeVariants)} sub="in self-play" to="/argo/arena" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <SectionTitle>World-Model Accuracy — 90 Days</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={ACCURACY_TREND} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="d" tick={{ fill: '#5e5e5e', fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis domain={[0.85, 0.92]} tick={{ fill: '#5e5e5e', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v * 100).toFixed(1)}%`} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, fontSize: 10 }} formatter={(v: number) => [`${(v * 100).toFixed(2)}%`, 'Accuracy']} />
              <Line type="monotone" dataKey="acc" stroke={GOLD} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-2 text-[10px] text-right" style={{ color: '#5e5e5e' }}>Predicted vs. realized outcome fidelity across all 6 domains</div>
        </Card>

        <Card>
          <SectionTitle>Experience Throughput — Events/sec</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={THROUGHPUT_TREND} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="d" tick={{ fill: '#5e5e5e', fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis domain={[18, 34]} tick={{ fill: '#5e5e5e', fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, fontSize: 10 }} formatter={(v: number) => [`${v} ev/s`, 'Throughput']} />
              <Line type="monotone" dataKey="ev" stroke="#8a8a8a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-2 text-[10px] text-right" style={{ color: '#5e5e5e' }}>Signals, actions, outcomes, and corrections flowing into the experience loop</div>
        </Card>
      </div>

      {/* Champion policies per domain */}
      <SectionTitle>Champion Policies by Domain</SectionTitle>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {CHAMPION_POLICIES.filter(p => p.status === 'champion').map(cp => {
          const dom = ARGO_DOMAINS.find(d => d.id === cp.domain);
          return (
            <Card key={cp.id}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-[9px] font-mono uppercase tracking-widest mb-0.5" style={{ color: dom?.color ?? '#8a8a8a' }}>{dom?.label ?? cp.domain}</div>
                  <div className="text-sm font-semibold" style={{ color: '#f5f5f5' }}>{cp.name}</div>
                </div>
                <div className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(201,183,135,0.1)', color: GOLD }}>{cp.tier}</div>
              </div>
              <div className="flex items-center gap-4 text-xs mb-2">
                <div><span style={{ color: '#5e5e5e' }}>Elo </span><span className="font-mono font-bold" style={{ color: '#f5f5f5' }}>{cp.elo}</span></div>
                <div><span style={{ color: '#5e5e5e' }}>Win rate </span><span className="font-mono" style={{ color: GOLD }}>{(cp.winRate * 100).toFixed(1)}%</span></div>
              </div>
              <div className="text-[10px] mb-3" style={{ color: '#8a8a8a' }}>Lifetime impact: <span style={{ color: '#f5f5f5' }}>{cp.lifetimeImpact}</span></div>
              <div className="text-[9px] font-mono" style={{ color: '#5e5e5e' }}>Promoted {new Date(cp.promotedAt).toLocaleDateString()}</div>
            </Card>
          );
        })}
      </div>

      {/* Cross-links to existing pages */}
      <div className="rounded-lg px-4 py-3 flex flex-wrap gap-4 text-[10px]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ color: '#5e5e5e' }}>Argo draws ground truth from:</span>
        {[
          { label: 'Outcome Graph', to: '/outcomes' },
          { label: 'Covenant Constitution', to: '/constitution' },
          { label: 'Proof Chain', to: '/proof' },
          { label: 'Learning Loop', to: '/learning' },
          { label: 'Model Router', to: '/model-router' },
          { label: 'Mythos Doctrine', to: '/doctrine' },
          { label: 'Reward Hacking', to: '/reward-hacking' },
          { label: 'Mirror Eval', to: '/evals' },
          { label: 'Counterfactuals', to: '/counterfactuals' },
        ].map(l => (
          <Link key={l.to} href={b(l.to)} className="font-mono" style={{ color: GOLD }}>{l.label} →</Link>
        ))}
      </div>

      <div className="mt-8 p-4 rounded-xl flex items-center gap-4" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.18)' }}>
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: '#9a8456' }}>PSYCHE CONNECTION</div>
          <div className="text-sm font-semibold mb-0.5" style={{ color: '#f5f5f5' }}>PSYCHE — Emergent Sentience Observatory</div>
          <div className="text-[11px]" style={{ color: '#8a8a8a' }}>Distillation Forge candidates cross-reference Dream Atlas insights by ID. Experience stream events seed genesis events in the PSYCHE ledger. Argo agent variant names appear as genesis event witnesses.</div>
        </div>
        <Link href={b('/psyche')} className="shrink-0 px-4 py-2 rounded-lg text-[11px] font-mono hover:opacity-90 transition-opacity" style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.28)', color: '#a78bfa', textDecoration: 'none' }}>
          PSYCHE →
        </Link>
      </div>
    </Layout>
  );
}
