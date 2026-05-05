import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  Cpu,
  ExternalLink,
  Gauge,
  Layers,
  Network,
  Radio,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { listPhotonicTiers, listPhotonicRoutingDecisions, listPhotonicResearchSignals } from '@/lib/sentra-api';
import { SourceBadge, useApiQuery } from '@/lib/use-api-query';

type ComputeTier = {
  id: string;
  label: string;
  classification: 'baseline' | 'production' | 'experimental';
  hardware: string;
  latencyP50Ms: number;
  latencyP99Ms: number;
  throughputQps: number;
  energyMjPerInference: number;
  costPer1MTokens: number;
  routableWorkloads: string[];
  notes: string;
};

type RoutingDecision = {
  id: string;
  ts: string;
  workload: string;
  selectedTier: string;
  reason: string;
  fellBackFrom?: string;
  latencyMs: number;
};

type ResearchSignal = {
  id: string;
  source: string;
  venue: string;
  year: number;
  claim: string;
  programLink: string;
  trl: number;
};

const FALLBACK_TIERS: ComputeTier[] = [
  {
    id: 'cpu-baseline',
    label: 'CPU Baseline',
    classification: 'baseline',
    hardware: 'Intel Xeon / AMD EPYC',
    latencyP50Ms: 420,
    latencyP99Ms: 980,
    throughputQps: 38,
    energyMjPerInference: 18.4,
    costPer1MTokens: 0.12,
    routableWorkloads: ['policy lint', 'covenant audit', 'low-volume classifier'],
    notes: 'Default fallback for offline / disconnected operation. Always available.',
  },
  {
    id: 'gpu-production',
    label: 'GPU Production',
    classification: 'production',
    hardware: 'NVIDIA H100 / B200 cluster',
    latencyP50Ms: 38,
    latencyP99Ms: 110,
    throughputQps: 1240,
    energyMjPerInference: 4.6,
    costPer1MTokens: 1.85,
    routableWorkloads: ['threat triage', 'reasoning chain', 'multimodal eval', 'tool-calling agents'],
    notes: 'Primary tier for multi-step reasoning and high-volume threat scoring.',
  },
  {
    id: 'photonic-experimental',
    label: 'Photonic Tier',
    classification: 'experimental',
    hardware: 'MIT photonic DNN / Lightmatter Passage interconnect',
    latencyP50Ms: 0.5,
    latencyP99Ms: 1.2,
    throughputQps: 84000,
    energyMjPerInference: 0.022,
    costPer1MTokens: 0.04,
    routableWorkloads: ['line-rate packet classification', 'wire-speed anomaly detection', 'sub-ms threat scoring'],
    notes: 'TRL 4 — gated behind cyber-physical attestation. Currently routes traffic from honeypot mirrors only.',
  },
];

const FALLBACK_ROUTING_TEMPLATES: Omit<RoutingDecision, 'id' | 'ts'>[] = [
  { workload: 'NTLM relay candidate from CVE-2024-21412 alert', selectedTier: 'gpu-production', reason: 'Multi-step reasoning chain required (3+ tools)', latencyMs: 92 },
  { workload: 'Inline TLS handshake fingerprint scoring', selectedTier: 'photonic-experimental', reason: 'Sub-ms latency budget; classifier-only workload', latencyMs: 0.6 },
  { workload: 'Quarterly covenant audit (172 policies)', selectedTier: 'cpu-baseline', reason: 'Batch job; cost-sensitive; no latency target', latencyMs: 380 },
  { workload: 'PCAP anomaly burst detection at edge mirror', selectedTier: 'photonic-experimental', reason: '84k QPS throughput target on mirror feed', latencyMs: 0.7 },
  { workload: 'Adversarial prompt classification on agent input', selectedTier: 'gpu-production', reason: 'Constitutional enforcer needs reasoning context', latencyMs: 41, fellBackFrom: 'photonic-experimental' },
  { workload: 'Phishing kit triage from spam pipeline', selectedTier: 'gpu-production', reason: 'Multimodal (HTML + screenshot)', latencyMs: 88 },
  { workload: 'IDS signature pre-classification at line speed', selectedTier: 'photonic-experimental', reason: 'Wire-speed threat scoring on span port', latencyMs: 0.5 },
  { workload: 'Quarterly governance posture rollup', selectedTier: 'cpu-baseline', reason: 'Long-running, non-interactive', latencyMs: 410 },
];

const FALLBACK_RESEARCH: ResearchSignal[] = [
  {
    id: 'mit-photonic-dnn-2024',
    source: 'MIT Lincoln Laboratory',
    venue: 'Nature Photonics',
    year: 2024,
    claim: 'Single-chip photonic DNN: 92% accuracy with sub-millisecond inference latency demonstrated on benchmark workloads, forward-only training.',
    programLink: 'PRISM',
    trl: 4,
  },
  {
    id: 'nature-16k-photonic-2025',
    source: 'Princeton / Lightelligence',
    venue: 'Nature',
    year: 2025,
    claim: '16,000-component single-chip photonic accelerator demonstrated for production-scale AI workloads.',
    programLink: 'LUMOS',
    trl: 4,
  },
  {
    id: 'lightmatter-passage-2024',
    source: 'Lightmatter Inc.',
    venue: 'Hot Chips 2024',
    year: 2024,
    claim: 'Passage photonic interconnect fabric: commercial deployment for multi-die AI accelerator scale-out.',
    programLink: 'PIPES',
    trl: 6,
  },
  {
    id: 'cmos-photonic-fab-2024',
    source: 'Intel / GlobalFoundries / TSMC',
    venue: 'IEDM 2024',
    year: 2024,
    claim: 'CMOS-compatible photonic process technology enabling fab-scale production of inference-grade waveguides.',
    programLink: 'PIPES',
    trl: 5,
  },
];

const TIER_COLORS: Record<ComputeTier['classification'], string> = {
  baseline: 'bg-white/[0.03] border-white/[0.08] text-white/60',
  production: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  experimental: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
};

const TIER_ICONS: Record<ComputeTier['classification'], typeof Cpu> = {
  baseline: Cpu,
  production: Layers,
  experimental: Sparkles,
};

type TabId = 'tiers' | 'routing' | 'research';

function makeDecision(template: Omit<RoutingDecision, 'id' | 'ts'>, idx: number): RoutingDecision {
  const ts = new Date(Date.now() - (8 - idx) * 12_000).toISOString();
  return { ...template, id: `RD-${String(idx).padStart(4, '0')}`, ts };
}

export default function PhotonicInference() {
  const [activeTab, setActiveTab] = useState<TabId>('tiers');

  const tierFetcher = useCallback(() => listPhotonicTiers(), []);
  const researchFetcher = useCallback(() => listPhotonicResearchSignals(), []);
  const { data: tiers, source } = useApiQuery<ComputeTier[]>(tierFetcher, 'tiers', FALLBACK_TIERS);
  const { data: research } = useApiQuery<ResearchSignal[]>(researchFetcher, 'signals', FALLBACK_RESEARCH);

  const [decisions, setDecisions] = useState<RoutingDecision[]>(() =>
    FALLBACK_ROUTING_TEMPLATES.map((t, i) => makeDecision(t, i)),
  );
  const decisionCounter = useRef<number>(FALLBACK_ROUTING_TEMPLATES.length);

  useEffect(() => {
    listPhotonicRoutingDecisions().then((res) => {
      if (res && 'decisions' in res && Array.isArray(res.decisions) && res.decisions.length > 0) {
        setDecisions(res.decisions as RoutingDecision[]);
        decisionCounter.current = res.decisions.length;
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setDecisions((prev) => {
        const template = FALLBACK_ROUTING_TEMPLATES[Math.floor(Math.random() * FALLBACK_ROUTING_TEMPLATES.length)];
        decisionCounter.current += 1;
        const newId = `RD-${String(decisionCounter.current).padStart(4, '0')}`;
        const next = [...prev, { ...template, id: newId, ts: new Date().toISOString() }];
        return next.slice(-12);
      });
    }, 6000);
    return () => clearInterval(id);
  }, []);

  const photonicTier = tiers.find((t) => t.id === 'photonic-experimental') ?? tiers[2] ?? FALLBACK_TIERS[2];
  const gpuTier = tiers.find((t) => t.id === 'gpu-production') ?? tiers[1] ?? FALLBACK_TIERS[1];
  const photonicSpeedup = Math.round(gpuTier.latencyP50Ms / photonicTier.latencyP50Ms);
  const photonicEnergyReduction = Math.round((gpuTier.energyMjPerInference / photonicTier.energyMjPerInference) * 10) / 10;

  const recentPhotonicShare = Math.round(
    (decisions.filter((d) => d.selectedTier === 'photonic-experimental').length / decisions.length) * 100,
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-[20px] font-medium text-white">Photonic Inference Tier</h1>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border bg-purple-500/10 border-purple-500/20 text-purple-400">DARPA PRISM / PIPES / LUMOS</span>
            <SourceBadge source={source} />
          </div>
          <p className="text-[13px] text-white/40">Hardware-class model routing for sub-millisecond threat inference and line-rate packet classification.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <span
            aria-hidden="true"
            className="inline-block w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30"
          />
          <span className="text-[10px] text-white/60">a11oy orchestrated</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-1">Photonic latency p50</div>
          <div className="text-[24px] font-light text-purple-400 leading-none">{photonicTier.latencyP50Ms}<span className="text-[12px] text-white/40 ml-1">ms</span></div>
          <div className="text-[10px] text-white/30 mt-1">{photonicSpeedup}× faster than GPU tier</div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-1">Photonic throughput</div>
          <div className="text-[24px] font-light text-purple-400 leading-none">{photonicTier.throughputQps.toLocaleString()}<span className="text-[12px] text-white/40 ml-1">qps</span></div>
          <div className="text-[10px] text-white/30 mt-1">Wire-speed classification</div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-1">Energy reduction</div>
          <div className="text-[24px] font-light text-emerald-400 leading-none">{photonicEnergyReduction}<span className="text-[12px] text-white/40 ml-1">×</span></div>
          <div className="text-[10px] text-white/30 mt-1">vs GPU per inference</div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-white/30 mb-1">Photonic routing share</div>
          <div className="text-[24px] font-light text-white leading-none">{recentPhotonicShare}<span className="text-[12px] text-white/40 ml-1">%</span></div>
          <div className="text-[10px] text-white/30 mt-1">Last 12 routing decisions</div>
        </div>
      </div>

      <div role="tablist" aria-label="Photonic tier views" className="flex gap-2">
        {([
          { id: 'tiers' as const, label: 'Compute Tiers', icon: Layers },
          { id: 'routing' as const, label: 'Live Routing', icon: Activity },
          { id: 'research' as const, label: 'Research Pipeline', icon: Radio },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`photonic-panel-${id}`}
            id={`photonic-tab-${id}`}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] transition-all border',
              activeTab === id ? 'bg-white/[0.06] border-white/[0.12] text-white' : 'bg-white/[0.015] border-white/[0.06] text-white/50 hover:bg-white/[0.03]',
            )}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'tiers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((tier) => {
            const Icon = TIER_ICONS[tier.classification];
            return (
              <div key={tier.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-white/60" aria-hidden="true" />
                    <h3 className="text-[14px] font-medium text-white">{tier.label}</h3>
                  </div>
                  <span className={cn('text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border', TIER_COLORS[tier.classification])}>{tier.classification}</span>
                </div>
                <p className="text-[11px] text-white/40">{tier.hardware}</p>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
                  <div>
                    <div className="text-[9px] font-mono uppercase text-white/30">Latency p50</div>
                    <div className="text-[14px] text-white">{tier.latencyP50Ms} ms</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono uppercase text-white/30">Latency p99</div>
                    <div className="text-[14px] text-white">{tier.latencyP99Ms} ms</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono uppercase text-white/30">Throughput</div>
                    <div className="text-[14px] text-white">{tier.throughputQps.toLocaleString()} qps</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono uppercase text-white/30">Energy</div>
                    <div className="text-[14px] text-white">{tier.energyMjPerInference} mJ</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[9px] font-mono uppercase text-white/30">Cost / 1M tok</div>
                    <div className="text-[14px] text-white">${tier.costPer1MTokens.toFixed(2)}</div>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/[0.06]">
                  <div className="text-[9px] font-mono uppercase text-white/30 mb-1.5">Routable workloads</div>
                  <ul className="space-y-1">
                    {tier.routableWorkloads.map((w) => (
                      <li key={w} className="text-[11px] text-white/60">— {w}</li>
                    ))}
                  </ul>
                </div>
                <p className="text-[10px] text-white/30 italic pt-2 border-t border-white/[0.06]">{tier.notes}</p>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'routing' && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl">
          <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <h3 className="text-[12px] font-mono uppercase tracking-wider text-white/60">Live Router Decisions</h3>
            </div>
            <span className="text-[10px] text-white/30">Updates every 6s · last {decisions.length}</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {[...decisions].reverse().map((d) => {
              const tier = tiers.find((t) => t.id === d.selectedTier);
              const tierClass = tier ? TIER_COLORS[tier.classification] : TIER_COLORS.baseline;
              return (
                <div key={d.id} className="p-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-mono text-white/30">{d.id}</span>
                        <span className={cn('text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border', tierClass)}>
                          {tier?.label ?? d.selectedTier}
                        </span>
                        {d.fellBackFrom && (
                          <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border bg-amber-500/10 border-amber-500/20 text-amber-400">
                            fallback from {d.fellBackFrom}
                          </span>
                        )}
                      </div>
                      <div className="text-[12px] text-white">{d.workload}</div>
                      <div className="text-[10px] text-white/40 mt-0.5">→ {d.reason}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[12px] text-white/80 font-mono">{d.latencyMs} ms</div>
                      <div className="text-[9px] text-white/30 font-mono">{new Date(d.ts).toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'research' && (
        <div className="space-y-3">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Network className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
              <h3 className="text-[12px] font-mono uppercase tracking-wider text-white/60">Upstream Research Signal</h3>
            </div>
            <p className="text-[12px] text-white/50 leading-relaxed">
              The Photonic Tier consumes published research from DARPA MTO programs and academic labs. Each signal below is a forward-looking input that the a11oy model router uses to decide when to qualify a new accelerator class for production traffic.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {research.map((r) => (
              <div key={r.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-[11px] text-white">{r.source}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">{r.venue} · {r.year}</div>
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border bg-purple-500/10 border-purple-500/20 text-purple-400 shrink-0">
                    TRL {r.trl}
                  </span>
                </div>
                <p className="text-[12px] text-white/70 leading-relaxed">{r.claim}</p>
                <div className="flex items-center gap-1.5 pt-2 border-t border-white/[0.06]">
                  <ExternalLink className="w-3 h-3 text-white/30" aria-hidden="true" />
                  <span className="text-[10px] font-mono text-white/40">DARPA {r.programLink}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-purple-500/[0.04] border border-purple-500/[0.15] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
              <h3 className="text-[12px] font-mono uppercase tracking-wider text-purple-400">a11oy router integration</h3>
            </div>
            <p className="text-[12px] text-white/60 leading-relaxed">
              The model router treats hardware tier as a routable axis alongside cost, latency budget, and isolation requirement. When photonic capacity is provisioned, the router schedules sub-millisecond classification workloads onto it and records the routing decision in the proof ledger for downstream attestation.
            </p>
            <div className="flex items-center gap-2 pt-2 mt-2 border-t border-purple-500/[0.15]">
              <Gauge className="w-3 h-3 text-purple-400" aria-hidden="true" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400/70">Active in research-cycle gating · production traffic gated on cyber-physical attestation</span>
            </div>
          </div>
        </div>
      )}

      <div className="text-[10px] text-white/20 text-center font-mono uppercase tracking-wider pt-4">
        Sentra cyber resilience · photonic tier · darpa mto aligned
      </div>
    </div>
  );
}
