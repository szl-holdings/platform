import {
  AlertTriangle,
  Anchor,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Eye,
  Globe,
  Link2,
  Loader2,
  Map,
  Radio,
  Shield,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface ForecastInterval {
  horizon: string;
  point: number;
  lower80: number;
  upper80: number;
  lower95: number;
  upper95: number;
  confidence: number;
  unit: string;
}

interface ForecastProvenance {
  modelId: string;
  modelName: string;
  modelVersion: string;
  adapterId: string;
  algorithmFamily: string;
  calibrationMethod: string;
  trainingDataset: string;
  generatedAt: string;
  inferenceLatencyMs: number;
  cacheHit: boolean;
}

interface ForecastHead {
  headName: string;
  label: string;
  description: string;
  intervals: ForecastInterval[];
  featureAttribution: Record<string, number>;
  provenance: ForecastProvenance;
  alertThreshold: number;
  thresholdBreached: boolean;
  driftScore: number;
  driftStatus: string;
}

interface ForecastApiData {
  heads: ForecastHead[];
  headsCount: number;
  breachedCount: number;
  generatedAt: string;
  modelRegistry: string;
  inferenceBackend: string;
  calibrationMethod: string;
  featuresSource?: string;
}
import { Link } from 'wouter';

const ACCENT = '#38bdf8';
const BG = { page: '#060a10', surface: '#090d14', elevated: '#0d1118' } as const;
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
} as const;

interface ShadowVessel {
  id: string;
  name: string;
  imo: string;
  flag: string;
  type: string;
  lastKnownPos: string;
  aisGapHours: number;
  sanctionPrograms: string[];
  darkActivityScore: number;
  stsEvents: number;
  counterpartyRisk: string;
  routeAnomaly: boolean;
  estimatedCargo: string;
  cargoValueUsd: number;
}

const SCENARIO_VESSELS: ShadowVessel[] = [
  {
    id: 'MED-001',
    name: 'AURORA DELTA',
    imo: '9821045',
    flag: 'Comoros',
    type: 'VLCC',
    lastKnownPos: '36.2°N 13.8°E — Central Mediterranean',
    aisGapHours: 18.4,
    sanctionPrograms: ['OFAC_SDN', 'EU_FSF', 'UK_OFSI'],
    darkActivityScore: 0.91,
    stsEvents: 3,
    counterpartyRisk: 'Critical',
    routeAnomaly: true,
    estimatedCargo: 'Crude Oil (Russian origin)',
    cargoValueUsd: 142_000_000,
  },
  {
    id: 'MED-002',
    name: 'POSEIDON QUEST',
    imo: '9654321',
    flag: 'Palau',
    type: 'Suezmax',
    lastKnownPos: '37.5°N 10.2°E — Gulf of Tunis',
    aisGapHours: 11.2,
    sanctionPrograms: ['UN_Consolidated', 'EU_FSF'],
    darkActivityScore: 0.78,
    stsEvents: 2,
    counterpartyRisk: 'High',
    routeAnomaly: true,
    estimatedCargo: 'Crude Oil (mixed origin)',
    cargoValueUsd: 71_000_000,
  },
  {
    id: 'MED-003',
    name: 'TITAN CORSAIR',
    imo: '9112233',
    flag: 'Tanzania',
    type: 'Aframax',
    lastKnownPos: '35.9°N 14.5°E — Near Malta',
    aisGapHours: 7.8,
    sanctionPrograms: ['OFAC_SDN'],
    darkActivityScore: 0.67,
    stsEvents: 1,
    counterpartyRisk: 'High',
    routeAnomaly: false,
    estimatedCargo: 'Petroleum Products',
    cargoValueUsd: 38_500_000,
  },
  {
    id: 'MED-004',
    name: 'HELIOS PHANTOM',
    imo: '9445566',
    flag: 'Unknown / Deregistered',
    type: 'VLCC',
    lastKnownPos: '35.1°N 11.7°E — Libya offshore',
    aisGapHours: 31.0,
    sanctionPrograms: ['OFAC_SDN', 'UN_Consolidated', 'UK_OFSI', 'EU_FSF'],
    darkActivityScore: 0.97,
    stsEvents: 5,
    counterpartyRisk: 'Critical',
    routeAnomaly: true,
    estimatedCargo: 'Crude Oil (sanctioned origin)',
    cargoValueUsd: 185_000_000,
  },
];

const PIPELINE_STEPS = [
  {
    step: 1,
    label: 'Fleet Map — Live AIS',
    href: '/dashboard/fleet',
    icon: Map,
    description: 'Extended AIS feed (Digitraffic + BarentsWatch + USCG NAIS) detects 4 vessels in the Central Mediterranean with anomalous behavior patterns. Aegis threat overlay surfaces geopolitical risk zones.',
    findings: '4 vessels flagged · 2 AIS gaps >6h · Aegis risk overlay: elevated',
    status: 'complete',
  },
  {
    step: 2,
    label: 'Dark Vessel Detection',
    href: '/dark-vessel-detection',
    icon: Eye,
    description: 'Dark-activity ML head (vessels:dark-activity-v2, Monte Carlo calibrated) forecasts 24h ahead AIS gap probability. HELIOS PHANTOM: 97% · AURORA DELTA: 91% — both exceed critical threshold.',
    findings: '2 critical · 2 high · ML confidence: 87–94%',
    status: 'complete',
  },
  {
    step: 3,
    label: 'STS Transfer Detection',
    href: '/sts-detection',
    icon: Anchor,
    description: 'Ship-to-ship transfer events correlate to sanctioned port calls. 11 STS events across the 4 vessels in the past 30 days. Ownership chain analysis reveals beneficial owner opacity index > 0.85.',
    findings: '11 STS events · 4 sanctioned counterparties · Chain depth avg: 6.2 hops',
    status: 'complete',
  },
  {
    step: 4,
    label: 'Risk Scoring & Sanctions',
    href: '/risk-scoring',
    icon: Shield,
    description: 'OFAC SDN + UN Consolidated + UK OFSI + EU FSF cross-reference confirms all 4 vessels. Compliance exposure: $436M total cargo value at risk. Route-anomaly ML head confirms deviation from baseline.',
    findings: 'OFAC + 3 other lists · $436M exposure · Voyage TCE break-even prob: 34%',
    status: 'complete',
  },
];

const DIFFERENTIATION_POINTS = [
  {
    title: '24h Predictive Dark Activity',
    description: 'Most competitors flag AIS gaps after the fact. The dark-activity ML head (random forest, 14M trajectory training set) forecasts probability 24h before disappearance — enabling pre-emptive cargo hold or charter withdrawal.',
    vs: 'MarineTraffic, Windward flag after event',
    icon: Zap,
  },
  {
    title: 'Continuous Counterparty Risk Dossier',
    description: 'STS adjacency events, port co-visits, and ownership changes are continuously linked into a per-counterparty dossier that updates on every AIS position change. No manual refreshes needed.',
    vs: 'Spire / Kpler require manual watch-list runs',
    icon: BookOpen,
  },
  {
    title: 'Voyage PnL Stress Test',
    description: 'Monte Carlo TCE distribution (5k iterations) combines bunker shock, port congestion, counterparty default probability, and weather routing into a single stressed break-even probability — directly answering the commercial question.',
    vs: 'Pole Star / Kpler focus on compliance only',
    icon: TrendingDown,
  },
];

function VesselCard({ vessel }: { vessel: ShadowVessel }) {
  const [expanded, setExpanded] = useState(false);
  const isCritical = vessel.counterpartyRisk === 'Critical';

  return (
    <div
      className={`rounded-lg border p-4 space-y-3 cursor-pointer transition-all ${
        isCritical
          ? 'border-red-500/40 bg-red-500/5 hover:bg-red-500/8'
          : 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/8'
      }`}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${isCritical ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {vessel.counterpartyRisk}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">{vessel.id}</span>
          </div>
          <p className="text-sm font-semibold" style={{ color: TEXT.primary }}>{vessel.name}</p>
          <p className="text-[10px] font-mono text-muted-foreground">IMO {vessel.imo} · {vessel.type} · Flag: {vessel.flag}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-sm font-mono" style={{ color: isCritical ? '#f87171' : '#fbbf24' }}>
            {(vessel.darkActivityScore * 100).toFixed(0)}%
          </p>
          <p className="text-[9px] text-muted-foreground font-mono">dark-activity</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs font-mono font-semibold" style={{ color: TEXT.primary }}>{vessel.aisGapHours.toFixed(1)}h</p>
          <p className="text-[9px] text-muted-foreground">AIS gap</p>
        </div>
        <div>
          <p className="text-xs font-mono font-semibold" style={{ color: TEXT.primary }}>{vessel.stsEvents}</p>
          <p className="text-[9px] text-muted-foreground">STS events</p>
        </div>
        <div>
          <p className="text-xs font-mono font-semibold" style={{ color: TEXT.primary }}>{vessel.sanctionPrograms.length}</p>
          <p className="text-[9px] text-muted-foreground">sanction lists</p>
        </div>
      </div>

      {expanded && (
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="space-y-1">
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Position</p>
            <p className="text-xs text-foreground">{vessel.lastKnownPos}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Sanction Programs</p>
            <div className="flex flex-wrap gap-1">
              {vessel.sanctionPrograms.map((p) => (
                <span key={p} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">{p}</span>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Estimated Cargo</p>
            <p className="text-xs text-foreground">{vessel.estimatedCargo}</p>
            <p className="text-[10px] font-mono text-amber-400">${(vessel.cargoValueUsd / 1e6).toFixed(1)}M cargo value at risk</p>
          </div>
          {vessel.routeAnomaly && (
            <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-mono">
              <AlertTriangle className="w-3 h-3" />
              Route anomaly detected by ML head (vessels:route-anomaly-v2)
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PipelineStep({ step, isLast }: { step: typeof PIPELINE_STEPS[0]; isLast: boolean }) {
  const Icon = step.icon;
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center gap-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: `${ACCENT}20`, color: ACCENT, border: `1px solid ${ACCENT}40` }}
        >
          {step.step}
        </div>
        {!isLast && <div className="w-px flex-1 mt-1" style={{ background: `${ACCENT}30`, minHeight: 32 }} />}
      </div>
      <div className="flex-1 pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: ACCENT }} />
          <Link href={step.href}>
            <a className="text-sm font-semibold hover:underline" style={{ color: TEXT.primary }}>
              {step.label}
            </a>
          </Link>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-2.5 h-2.5 inline mr-0.5" />complete
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-amber-400/80">
          <Radio className="w-3 h-3" />
          {step.findings}
        </div>
      </div>
    </div>
  );
}

export default function MedShadowFleetCaseStudy() {
  const [forecastData, setForecastData] = useState<ForecastApiData | null>(null);
  const [loadingForecasts, setLoadingForecasts] = useState(false);

  const fetchForecasts = useCallback(async () => {
    setLoadingForecasts(true);
    try {
      const res = await fetch('/api/vessels/forecasts/heads', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        setForecastData(json.data ?? json);
      }
    } catch {
      /* silent */
    } finally {
      setLoadingForecasts(false);
    }
  }, []);

  useEffect(() => {
    fetchForecasts();
  }, [fetchForecasts]);

  const darkActivityHead = forecastData?.heads?.find((h) => h.headName === 'vessels:dark-activity');
  const totalExposure = SCENARIO_VESSELS.reduce((s, v) => s + v.cargoValueUsd, 0);

  return (
    <div
      className="min-h-screen space-y-8 pb-16"
      style={{ background: BG.page, color: TEXT.primary, fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="rounded-xl border p-6 space-y-4" style={{ background: BG.surface, borderColor: `${ACCENT}30` }}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border text-red-400 border-red-500/30 bg-red-500/10">
                LIVE SCENARIO
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">MED-SHADOW-2026</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: TEXT.primary }}>
              Mediterranean Shadow-Fleet Sanction Sweep
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              End-to-end intelligence walkthrough: 4 dark-fleet vessels operating in the Central Mediterranean
              evading sanctions on crude oil cargo. Follow the pipeline from live AIS detection through dark-activity
              ML forecasting, STS transfer mapping, and final risk scoring — with A11oy mesh integration throughout.
            </p>
          </div>
          <div className="shrink-0 space-y-2 text-right">
            <p className="text-2xl font-mono font-bold text-red-400">
              ${(totalExposure / 1e9).toFixed(2)}B
            </p>
            <p className="text-[10px] font-mono text-muted-foreground">total cargo at risk</p>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border">
          {[
            { label: 'Vessels Tracked', value: '4', sub: '2 critical · 2 high' },
            { label: 'AIS Gaps Detected', value: '4', sub: 'avg 17.1h duration' },
            { label: 'STS Transfer Events', value: '11', sub: 'past 30 days' },
            { label: 'Sanction Lists Hit', value: '4', sub: 'OFAC · UN · OFSI · EU' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-lg p-3 space-y-1" style={{ background: BG.elevated }}>
              <p className="text-xl font-mono font-bold" style={{ color: ACCENT }}>{value}</p>
              <p className="text-[10px] font-semibold text-foreground">{label}</p>
              <p className="text-[9px] text-muted-foreground font-mono">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Intelligence Pipeline */}
      <div className="rounded-xl border p-6 space-y-4" style={{ background: BG.surface, borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4" style={{ color: ACCENT }} />
          <h2 className="text-base font-semibold">Intelligence Pipeline — End to End</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Walk through each step to see how live AIS, ML forecasts, and sanction data converge into an actionable intelligence picture.
          Each step links to the live Vessels page.
        </p>
        <div className="pt-2">
          {PIPELINE_STEPS.map((step, idx) => (
            <PipelineStep key={step.step} step={step} isLast={idx === PIPELINE_STEPS.length - 1} />
          ))}
        </div>
      </div>

      {/* Vessel Cards */}
      <div className="rounded-xl border p-6 space-y-4" style={{ background: BG.surface, borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-semibold">Flagged Vessels — Shadow Fleet Profile</h2>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">Click any card to expand</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SCENARIO_VESSELS.map((v) => <VesselCard key={v.id} vessel={v} />)}
        </div>
      </div>

      {/* Live ML Forecast */}
      <div className="rounded-xl border p-6 space-y-4" style={{ background: BG.surface, borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: ACCENT }} />
            <h2 className="text-base font-semibold">Live Dark-Activity ML Head</h2>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">vessels:dark-activity-v2</span>
          </div>
          {loadingForecasts && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        <p className="text-xs text-muted-foreground">
          The dark-activity ML head forecasts AIS gap probability 24h before events occur — a key differentiator vs competitors
          who only flag after a gap happens. Below is the live fleet-level forecast from the model registry.
        </p>
        {darkActivityHead ? (
          <div className="rounded-lg border p-4 space-y-3" style={{ background: BG.elevated, borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-muted-foreground">{darkActivityHead.headName}</p>
                <p className="text-sm font-semibold">{darkActivityHead.label}</p>
              </div>
              {darkActivityHead.thresholdBreached && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-red-500/10 text-red-400 border-red-500/30">
                  Threshold Breached
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {darkActivityHead.intervals.map((iv) => (
                <div key={iv.horizon} className="text-center rounded p-2" style={{ background: BG.page }}>
                  <p className="text-[9px] font-mono text-muted-foreground">{iv.horizon}</p>
                  <p className="text-sm font-mono font-bold text-amber-400">{(iv.point * 100).toFixed(1)}%</p>
                  <p className="text-[9px] font-mono text-muted-foreground">[{(iv.lower80 * 100).toFixed(0)}–{(iv.upper80 * 100).toFixed(0)}]</p>
                </div>
              ))}
            </div>
            <p className="text-[9px] font-mono text-muted-foreground">
              model: {darkActivityHead.provenance?.modelName} · algorithm: {darkActivityHead.provenance?.algorithmFamily} · calibration: {darkActivityHead.provenance?.calibrationMethod}
            </p>
          </div>
        ) : !loadingForecasts ? (
          <div className="rounded-lg border p-4 text-xs text-muted-foreground text-center" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            Forecast data unavailable — ensure API server is running
          </div>
        ) : null}
      </div>

      {/* Competitive Differentiation */}
      <div className="rounded-xl border p-6 space-y-4" style={{ background: BG.surface, borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" style={{ color: ACCENT }} />
          <h2 className="text-base font-semibold">Vessels vs. The Field</h2>
          <span className="text-[9px] font-mono text-muted-foreground">vs. MarineTraffic · Windward · Spire · Pole Star · Kpler</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DIFFERENTIATION_POINTS.map((d) => {
            const Icon = d.icon;
            return (
              <div key={d.title} className="rounded-lg border p-4 space-y-3" style={{ background: BG.elevated, borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: ACCENT }} />
                  <p className="text-sm font-semibold">{d.title}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{d.description}</p>
                <div className="flex items-center gap-1 text-[9px] font-mono text-amber-400/70">
                  <TrendingDown className="w-3 h-3" />
                  {d.vs}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cross-pollination: Aegis + Pulse + Conduit */}
      <div className="rounded-xl border p-6 space-y-4" style={{ background: BG.surface, borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4" style={{ color: ACCENT }} />
          <h2 className="text-base font-semibold">Platform Mesh — Cross-App Integration</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border p-4 space-y-2" style={{ background: BG.elevated, borderColor: `${ACCENT}20` }}>
            <p className="text-xs font-semibold" style={{ color: ACCENT }}>Aegis Threat Overlay</p>
            <p className="text-xs text-muted-foreground">Geopolitical risk zones from Sentra/Aegis are overlaid on the fleet map. The Central Mediterranean zone is currently elevated due to increased shadow-fleet activity and Libyan coastal instability.</p>
            <Link href="/dashboard/fleet">
              <a className="inline-flex items-center gap-1 text-[10px] font-mono hover:underline" style={{ color: ACCENT }}>
                View Fleet Map <ArrowRight className="w-3 h-3" />
              </a>
            </Link>
          </div>
          <div className="rounded-lg border p-4 space-y-2" style={{ background: BG.elevated, borderColor: `${ACCENT}20` }}>
            <p className="text-xs font-semibold" style={{ color: ACCENT }}>Pulse Voyage Brief</p>
            <p className="text-xs text-muted-foreground">Daily AI-generated voyage brief synthesizes dark-fleet activity, sanctions updates, and PnL stress-test results into a single operator-ready intelligence brief.</p>
            <Link href="/pulse">
              <a className="inline-flex items-center gap-1 text-[10px] font-mono hover:underline" style={{ color: ACCENT }}>
                Open Pulse Brief <ArrowRight className="w-3 h-3" />
              </a>
            </Link>
          </div>
          <div className="rounded-lg border p-4 space-y-2" style={{ background: BG.elevated, borderColor: `${ACCENT}20` }}>
            <p className="text-xs font-semibold" style={{ color: ACCENT }}>Conduit Feed-Out</p>
            <p className="text-xs text-muted-foreground">Sanction adjacency hits are automatically exported via Conduit to downstream data warehouses and compliance teams. Structured JSON with confidence scores and source attestation.</p>
            <a
              href="/api/vessels/live/signals/sanction-adjacency"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-mono hover:underline"
              style={{ color: ACCENT }}
            >
              API Feed <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* A11oy Deep-Link */}
      <div
        className="rounded-xl border p-6 space-y-4"
        style={{ background: `linear-gradient(135deg, ${ACCENT}10 0%, transparent 100%)`, borderColor: `${ACCENT}40` }}
      >
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5" style={{ color: ACCENT }} />
          <h2 className="text-base font-semibold">A11oy Mesh — Single Lane Deep-Link</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The A11oy agent mesh has been briefed on this scenario. Invoke any registered vessel tool (AIS lookup, risk re-score, voyage replan, fleet sanctions sweep) directly from the A11oy command interface. All tools are registered under the <code className="text-sky-400 font-mono text-xs">vessels</code> domain.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/nexus"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:opacity-90"
            style={{ background: ACCENT, color: '#000' }}
          >
            Open A11oy Mesh <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href="/api/nexus/v1/domains/vessels"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border transition-all hover:opacity-90"
            style={{ borderColor: `${ACCENT}40`, color: ACCENT, background: `${ACCENT}10` }}
          >
            Vessels Tool Registry <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-muted-foreground">
          {['vessels.ais_lookup', 'vessels.risk_rescore', 'vessels.voyage_replan', 'vessels.sanctions_fleet_sweep', 'vessels.dark_activity_forecast'].map((tool) => (
            <div key={tool} className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">{tool}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
