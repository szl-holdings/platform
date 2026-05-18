import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@szl-holdings/shared-ui/ui/card';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  EyeOff,
  Globe2,
  Loader2,
  Radio,
  RefreshCw,
  Satellite,
  Shield,
  ShieldAlert,
  Signal,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';

// ─── Types ────────────────────────────────────────────────────────────────────

type AnomalyType = 'SPOOFING' | 'AIS_GAP' | 'DARK_VESSEL' | 'POSITION_JUMP';
type CorrelationStatus = 'nominal' | 'degraded' | 'dark' | 'spoofing';
type AnomalySeverity = 'critical' | 'high' | 'medium' | 'low';

interface RfMeta {
  totalTrackedVessels: number;
  activeAnomalies: number;
  darkVessels: number;
  aisGapVessels: number;
  spoofingAlerts: number;
  passes24h: number;
  avgCorrelationScore: number;
  generatedAt: string;
}

interface RfAnomaly {
  id: string;
  entityId: string;
  vesselName: string;
  imoNumber: string;
  anomalyType: AnomalyType;
  severity: AnomalySeverity;
  lat: number;
  lon: number;
  driftDistanceNm: number | null;
  gapHours: number | null;
  correlationScore: number;
  satellitePassId: string;
  detectedAt: string;
  updatedAt: string;
  status: 'active' | 'investigating' | 'resolved';
  description: string;
  confidencePercent: number;
  tags: string[];
  region: string;
}

interface TrackedVesselSummary {
  entityId: string;
  imoNumber: string;
  mmsi: string;
  name: string;
  flag: string;
  vesselType: string;
  lat: number;
  lon: number;
  heading: number;
  speedKnots: number;
  destination: string;
  lastAisAt: string;
  aisGapHours: number;
  region: string;
  correlationStatus: CorrelationStatus;
  activeAnomalies: number;
}

interface SatellitePass {
  id: string;
  satelliteId: string;
  entityId: string;
  vesselName: string;
  imoNumber: string;
  observedLat: number;
  observedLon: number;
  aisReportedLat: number;
  aisReportedLon: number;
  driftDistanceNm: number;
  correlationScore: number;
  anomalyFlag: boolean;
  anomalyType: AnomalyType | null;
  passTimestamp: string;
  coverageQuality: 'excellent' | 'good' | 'marginal' | 'poor';
  confidencePercent: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE = import.meta.env.BASE_URL ?? '/vessels/';

function apiUrl(path: string): string {
  const base = BASE.replace(/\/$/, '');
  return `${base}${path}`;
}

function relTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const totalMins = Math.floor(diffMs / 60_000);
  if (totalMins < 1) return 'just now';
  if (totalMins < 60) return `${totalMins}m ago`;
  const h = Math.floor(totalMins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ANOMALY_LABELS: Record<AnomalyType, string> = {
  SPOOFING: 'AIS Spoofing',
  DARK_VESSEL: 'Dark Vessel',
  POSITION_JUMP: 'Position Jump',
  AIS_GAP: 'AIS Gap',
};

const STATUS_CONFIG: Record<CorrelationStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  nominal: { label: 'Nominal', color: '#4ade80', bg: '#4ade8020', icon: CheckCircle2 },
  degraded: { label: 'Degraded', color: '#facc15', bg: '#facc1520', icon: TrendingDown },
  dark: { label: 'Dark Vessel', color: '#6b7280', bg: '#6b728020', icon: EyeOff },
  spoofing: { label: 'Spoofing', color: '#ef4444', bg: '#ef444420', icon: ShieldAlert },
};

const SEVERITY_CONFIG: Record<AnomalySeverity, { color: string; bg: string }> = {
  critical: { color: '#ef4444', bg: '#ef444420' },
  high: { color: '#f97316', bg: '#f9731620' },
  medium: { color: '#facc15', bg: '#facc1520' },
  low: { color: '#60a5fa', bg: '#60a5fa20' },
};

const QUALITY_CONFIG: Record<SatellitePass['coverageQuality'], string> = {
  excellent: '#4ade80',
  good: '#86efac',
  marginal: '#facc15',
  poor: '#f97316',
};

// ─── Custom hook ──────────────────────────────────────────────────────────────

function useRfIntel() {
  const [meta, setMeta] = useState<RfMeta | null>(null);
  const [anomalies, setAnomalies] = useState<RfAnomaly[]>([]);
  const [vessels, setVessels] = useState<TrackedVesselSummary[]>([]);
  const [passes, setPasses] = useState<SatellitePass[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    try {
      const [metaRes, anomaliesRes, vesselsRes, passesRes] = await Promise.all([
        apiFetch<RfMeta>('/rf-intel/meta'),
        apiFetch<{ anomalies: RfAnomaly[] }>('/rf-intel/anomalies'),
        apiFetch<{ vessels: TrackedVesselSummary[] }>('/rf-intel/vessels'),
        apiFetch<{ passes: SatellitePass[] }>('/rf-intel/passes'),
      ]);
      setMeta(metaRes);
      setAnomalies(anomaliesRes.anomalies);
      setVessels(vesselsRes.vessels);
      setPasses(passesRes.passes.slice(-50).reverse());
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load RF intelligence data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetch();
    const t = setInterval(() => void fetch(), 60_000);
    return () => clearInterval(t);
  }, []);

  return { meta, anomalies, vessels, passes, loading, lastUpdated, error, refresh: fetch };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  color,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="border-white/5 bg-white/[0.02]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-1">{label}</div>
            <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
            {sub && <div className="text-[10px] text-slate-600 mt-0.5">{sub}</div>}
          </div>
          <Icon className="w-4 h-4 mt-1" style={{ color }} />
        </div>
      </CardContent>
    </Card>
  );
}

function AnomalyCard({ anomaly }: { anomaly: RfAnomaly }) {
  const sev = SEVERITY_CONFIG[anomaly.severity];
  const isSpoof = anomaly.anomalyType === 'SPOOFING' || anomaly.anomalyType === 'POSITION_JUMP';
  const Icon = isSpoof ? ShieldAlert : anomaly.anomalyType === 'DARK_VESSEL' ? EyeOff : AlertTriangle;

  return (
    <div
      className="rounded-lg border p-3 space-y-2"
      style={{ borderColor: `${sev.color}30`, background: sev.bg }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: sev.color }} />
          <span className="font-mono text-[10px] tracking-widest font-bold uppercase" style={{ color: sev.color }}>
            {ANOMALY_LABELS[anomaly.anomalyType]}
          </span>
        </div>
        <Badge
          variant="outline"
          className="text-[9px] font-mono tracking-wider flex-shrink-0"
          style={{ borderColor: `${sev.color}40`, color: sev.color }}
        >
          {anomaly.severity.toUpperCase()}
        </Badge>
      </div>

      <div>
        <div className="text-xs font-semibold text-white leading-tight">{anomaly.vesselName}</div>
        <div className="text-[10px] text-slate-500">IMO {anomaly.imoNumber} · {anomaly.region}</div>
      </div>

      <p className="text-[10px] text-slate-400 leading-relaxed">{anomaly.description}</p>

      <div className="flex items-center justify-between text-[9px] text-slate-600 font-mono">
        <span>Pass: {anomaly.satellitePassId}</span>
        <span>Corr: {anomaly.correlationScore}%</span>
        <span>{relTime(anomaly.updatedAt)}</span>
      </div>

      <div className="flex flex-wrap gap-1">
        {anomaly.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="px-1.5 py-0.5 rounded text-[8px] font-mono tracking-wider"
            style={{ background: `${sev.color}15`, color: `${sev.color}cc`, border: `1px solid ${sev.color}25` }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function VesselCorrelationRow({ vessel }: { vessel: TrackedVesselSummary }) {
  const cfg = STATUS_CONFIG[vessel.correlationStatus];
  const Icon = cfg.icon;

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border"
      style={{ borderColor: `${cfg.color}20`, background: `${cfg.color}08` }}
    >
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white truncate">{vessel.name}</span>
          {vessel.activeAnomalies > 0 && (
            <span
              className="text-[9px] font-mono px-1 rounded"
              style={{ background: '#ef444420', color: '#ef4444' }}
            >
              {vessel.activeAnomalies} alert{vessel.activeAnomalies > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="text-[9px] text-slate-500 font-mono">
          IMO {vessel.imoNumber} · {vessel.flag} · {vessel.vesselType}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-1 justify-end">
          <Icon className="w-3 h-3" style={{ color: cfg.color }} />
          <span className="text-[9px] font-mono tracking-wider font-bold" style={{ color: cfg.color }}>
            {cfg.label.toUpperCase()}
          </span>
        </div>
        <div className="text-[9px] text-slate-600">
          {vessel.aisGapHours >= 4
            ? `${Math.round(vessel.aisGapHours * 10) / 10}h dark`
            : `AIS ${relTime(vessel.lastAisAt)}`}
        </div>
      </div>
    </div>
  );
}

function PassTimelineRow({ pass }: { pass: SatellitePass }) {
  const qColor = QUALITY_CONFIG[pass.coverageQuality];
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded border text-[10px] font-mono"
      style={{
        borderColor: pass.anomalyFlag ? '#ef444430' : 'rgba(255,255,255,0.05)',
        background: pass.anomalyFlag ? '#ef444408' : 'rgba(255,255,255,0.01)',
      }}
    >
      <Satellite className="w-3 h-3 flex-shrink-0" style={{ color: qColor }} />
      <div className="flex-1 min-w-0">
        <div className="text-white">{pass.vesselName}</div>
        <div className="text-slate-600 text-[9px]">{pass.satelliteId} · {pass.coverageQuality}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div style={{ color: pass.correlationScore >= 80 ? '#4ade80' : pass.correlationScore >= 55 ? '#facc15' : '#ef4444' }}>
          {pass.correlationScore}%
        </div>
        {pass.driftDistanceNm > 0 && (
          <div className="text-slate-600 text-[9px]">{pass.driftDistanceNm}nm drift</div>
        )}
      </div>
      {pass.anomalyFlag && (
        <span
          className="px-1.5 py-0.5 rounded text-[8px] tracking-wider flex-shrink-0"
          style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef444430' }}
        >
          {pass.anomalyType}
        </span>
      )}
      <div className="text-slate-600 text-[9px] flex-shrink-0">{relTime(pass.passTimestamp)}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SatelliteRfIntelligence() {
  const { meta, anomalies, vessels, passes, loading, lastUpdated, error, refresh } = useRfIntel();
  const [activeTab, setActiveTab] = useState<'anomalies' | 'fleet' | 'passes'>('anomalies');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
        <span className="ml-2 text-sm text-slate-500 font-mono">Loading RF intelligence feed…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-red-400 text-sm font-mono">
        <AlertTriangle className="w-4 h-4" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Radio className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg font-bold tracking-[0.15em] text-emerald-400 uppercase font-mono">
              Satellite RF Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-500 ml-8">
            Live satellite AIS correlation · Position spoofing detection · Dark vessel identification
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-green-400">
              <span
                className="w-1.5 h-1.5 rounded-full bg-green-400"
                style={{ boxShadow: '0 0 6px #4ade80' }}
              />
              LIVE · {relTime(lastUpdated.toISOString())}
            </div>
          )}
          <button
            onClick={() => void refresh()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border text-[10px] font-mono tracking-wider text-slate-400 border-white/10 hover:border-emerald-400/30 hover:text-emerald-400 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            REFRESH
          </button>
        </div>
      </div>

      {/* KPI Row */}
      {meta && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard
            label="Tracked"
            value={meta.totalTrackedVessels}
            sub="vessels"
            color="#60a5fa"
            icon={Globe2}
          />
          <KpiCard
            label="Active Anomalies"
            value={meta.activeAnomalies}
            sub="RF alerts"
            color={meta.activeAnomalies > 0 ? '#ef4444' : '#4ade80'}
            icon={meta.activeAnomalies > 0 ? ShieldAlert : Shield}
          />
          <KpiCard
            label="Dark Vessels"
            value={meta.darkVessels}
            sub="AIS gap ≥ 8h"
            color={meta.darkVessels > 0 ? '#6b7280' : '#4ade80'}
            icon={EyeOff}
          />
          <KpiCard
            label="AIS Gaps"
            value={meta.aisGapVessels ?? 0}
            sub="4h–8h silent"
            color={(meta.aisGapVessels ?? 0) > 0 ? '#f59e0b' : '#4ade80'}
            icon={Radio}
          />
          <KpiCard
            label="Spoofing"
            value={meta.spoofingAlerts}
            sub="position spoof"
            color={meta.spoofingAlerts > 0 ? '#f97316' : '#4ade80'}
            icon={Zap}
          />
          <KpiCard
            label="Passes (24h)"
            value={meta.passes24h}
            sub="satellite passes"
            color="#a78bfa"
            icon={Satellite}
          />
          <KpiCard
            label="Avg Correlation"
            value={`${meta.avgCorrelationScore}%`}
            sub="satellite vs AIS"
            color={meta.avgCorrelationScore >= 80 ? '#4ade80' : meta.avgCorrelationScore >= 60 ? '#facc15' : '#ef4444'}
            icon={Activity}
          />
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-white/5 pb-0">
        {(['anomalies', 'fleet', 'passes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 text-[11px] font-mono tracking-[0.12em] uppercase transition-all border-b-2 -mb-px"
            style={{
              color: activeTab === tab ? '#34d399' : '#6b7280',
              borderColor: activeTab === tab ? '#34d399' : 'transparent',
            }}
          >
            {tab === 'anomalies' && `Anomalies (${anomalies.length})`}
            {tab === 'fleet' && `Fleet Status (${vessels.length})`}
            {tab === 'passes' && `Satellite Passes (${passes.length})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'anomalies' && (
        <div className="space-y-3">
          {anomalies.length === 0 ? (
            <div className="flex items-center justify-center h-32 gap-2 text-slate-500 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No active RF anomalies detected</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                <Signal className="w-3 h-3" />
                <span>{anomalies.length} active RF anomaly{anomalies.length !== 1 ? 'ies' : ''} — satellite correlation engine running</span>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {anomalies.map((a) => (
                  <AnomalyCard key={a.id} anomaly={a} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'fleet' && (
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-slate-500 mb-3 flex items-center gap-2">
            <Radio className="w-3 h-3" />
            RF correlation status for all {vessels.length} tracked vessels
          </div>
          {vessels.map((v) => (
            <VesselCorrelationRow key={v.entityId} vessel={v} />
          ))}
        </div>
      )}

      {activeTab === 'passes' && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono text-slate-500 mb-3 flex items-center gap-2">
            <Satellite className="w-3 h-3" />
            Recent satellite passes — correlation score vs AIS-reported position
          </div>
          {passes.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-500 text-sm font-mono">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating satellite passes…
            </div>
          ) : (
            passes.map((p) => <PassTimelineRow key={p.id} pass={p} />)
          )}
        </div>
      )}

      {/* Methodology footer */}
      <div
        className="rounded-lg border p-4 text-[10px] font-mono text-slate-600 leading-relaxed space-y-1"
        style={{ borderColor: 'rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}
      >
        <div className="text-slate-500 font-semibold mb-1 flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          RF Intelligence Methodology
        </div>
        <div>
          Satellite AIS passes are sourced every 90 seconds per tracked vessel from the contracted RF intelligence constellation ({['ATLAS-SAT-01/02/03', 'SENTINEL-SAT-07/12', 'HORIZON-SAT-04/09'].join(', ')}).
        </div>
        <div>
          Position correlation compares satellite-observed lat/lon against last AIS report.
          Drift distance is computed using haversine formula (nm). Spoofing threshold: 8nm.
          Dark vessel threshold: AIS gap ≥ 8 hours. AIS gap alert threshold: 4–8 hours.
        </div>
        <div>
          Anomaly classification: SPOOFING (drift 8–20nm), POSITION_JUMP (drift &gt;20nm),
          DARK_VESSEL (AIS gap ≥ 8h), AIS_GAP (gap 4–8h). Confidence scores reflect
          satellite observation quality and historical pass density.
        </div>
      </div>
    </div>
  );
}
