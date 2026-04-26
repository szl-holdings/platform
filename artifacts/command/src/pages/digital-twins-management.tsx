import { useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  FlaskConical,
  Globe,
  Info,
  Loader2,
  Play,
  RefreshCw,
  Shield,
  Ship,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useState } from 'react';

const BG = '#080c14';
const CARD = 'rgba(255,255,255,0.035)';
const BORDER = 'rgba(255,255,255,0.07)';
const ACCENT = '#8b7ac8';

type TwinType = 'vessel' | 'property' | 'posture' | 'matter' | 'portfolio' | 'incident' | 'port';
type TwinStatus = 'active' | 'degraded' | 'offline' | 'simulating';

interface TwinAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metric: string;
  currentValue: unknown;
  threshold: unknown;
  triggeredAt: string;
}

interface PredictedState {
  timeHorizon: string;
  state: Record<string, unknown>;
  confidence: number;
  drivingFactors: string[];
  generatedAt: string;
}

interface TwinState {
  id: string;
  entityId: string;
  entityName: string;
  twinType: TwinType;
  status: TwinStatus;
  currentState: Record<string, unknown>;
  predictedStates: PredictedState[];
  lastSyncedAt: string;
  confidenceScore: number;
  alerts: TwinAlert[];
  metadata: Record<string, unknown>;
}

interface SimulationResult {
  scenarioName: string;
  riskAssessment: string;
  recommendedActions: string[];
  confidenceScore: number;
  runDurationMs: number;
  deltaMetrics: Record<string, { before: unknown; after: unknown; changePercent?: number }>;
  monteCarlo?: {
    iterations: number;
    primaryMetric: string;
    confidenceBands: Record<string, { p5: number; p25: number; p50: number; p75: number; p95: number; mean: number }>;
    sensitivityDrivers: Array<{ id: string; label: string; impact: number }>;
  };
}

interface SimulationRun {
  id: string;
  twinId: string;
  scenarioName: string;
  riskAssessment: string;
  confidenceScore: number;
  runDurationMs: number;
  deltaMetrics: Record<string, { before: unknown; after: unknown; changePercent?: number }>;
  recommendedActions: string[];
  monteCarloResult: SimulationResult['monteCarlo'] | null;
  createdAt: string;
  createdByUserId: number | null;
}

const TWIN_TYPE_CONFIG: Record<TwinType, { label: string; color: string; icon: typeof Ship }> = {
  vessel: { label: 'Vessel', color: '#06b6d4', icon: Ship },
  property: { label: 'Property', color: '#10b981', icon: Database },
  posture: { label: 'Posture', color: '#ef4444', icon: Shield },
  matter: { label: 'Matter', color: '#f59e0b', icon: Info },
  portfolio: { label: 'Portfolio', color: '#8b5cf6', icon: BarChart3 },
  incident: { label: 'Incident', color: '#f97316', icon: AlertTriangle },
  port: { label: 'Port', color: '#3b82f6', icon: Globe },
};

const STATUS_CONFIG: Record<TwinStatus, { color: string; label: string; bg: string }> = {
  active: { color: '#10b981', label: 'Active', bg: 'rgba(16,185,129,0.12)' },
  degraded: { color: '#f59e0b', label: 'Degraded', bg: 'rgba(245,158,11,0.12)' },
  offline: { color: '#6b7280', label: 'Offline', bg: 'rgba(107,114,128,0.12)' },
  simulating: { color: '#8b7ac8', label: 'Simulating', bg: 'rgba(139,122,200,0.12)' },
};

const SCENARIO_PRESETS: Record<TwinType, Array<{ name: string; description: string; parameters: Record<string, unknown> }>> = {
  vessel: [
    { name: 'Storm Diversion', description: 'Heavy weather forces a route change adding 2 knots loss and wave height increase', parameters: { speedChange: -2, waveHeight: 6.5, routeRisk: 'high' } },
    { name: 'Fuel Emergency', description: 'Fuel depletion accelerated — 15% reduction forcing bunker stop', parameters: { fuelDelta: -15 } },
    { name: 'Sanctions Reroute', description: 'Sanctions exposure forces emergency rerouting', parameters: { routeRisk: 'critical' } },
  ],
  property: [
    { name: 'Rate Shock +200bps', description: 'Interest rate spike of 2% impacting cap rate and valuation', parameters: { interestRateChange: 0.02 } },
    { name: 'Tenant Default', description: 'Major tenant defaults — 15% occupancy drop', parameters: { occupancyChange: -0.15 } },
    { name: 'Market Correction', description: 'Market-wide value correction of -12%', parameters: { marketValueChange: -0.12 } },
  ],
  posture: [
    { name: 'Ransomware Attack', description: 'Ransomware incident with potential data exfiltration', parameters: { attackType: 'ransomware', attackSuccess: false, lateralMovement: false } },
    { name: 'APT Breach', description: 'Advanced persistent threat with lateral movement', parameters: { attackType: 'apt', attackSuccess: true, lateralMovement: true } },
    { name: 'Supply Chain Compromise', description: 'Software supply chain attack vector', parameters: { attackType: 'supply_chain', attackSuccess: false, lateralMovement: false } },
  ],
  matter: [
    { name: 'Settlement Push', description: 'Push for 70% probability settlement negotiation', parameters: { settlementProbability: 0.7, damageReduction: 0.3 } },
  ],
  portfolio: [],
  incident: [],
  port: [],
};

function ConfidenceBar({ value, color = ACCENT }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.round(value * 100)}%`, background: color }}
        />
      </div>
      <span className="text-xs font-mono" style={{ color, minWidth: 32 }}>
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

function AlertBadge({ alert }: { alert: TwinAlert }) {
  const colors = {
    info: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', text: '#60a5fa' },
    warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24' },
    critical: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#f87171' },
  }[alert.severity];
  return (
    <div
      className="rounded px-2 py-1.5 text-xs"
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
    >
      <div className="font-medium mb-0.5" style={{ color: colors.text }}>{alert.message}</div>
      <div className="opacity-60" style={{ color: colors.text }}>
        {alert.metric}: {String(alert.currentValue)} (threshold: {String(alert.threshold)})
      </div>
    </div>
  );
}

function MonteCarloPanel({ mc }: { mc: NonNullable<SimulationResult['monteCarlo']> }) {
  const primaryBand = mc.confidenceBands[mc.primaryMetric];
  if (!primaryBand) return null;
  const maxImpact = Math.max(...mc.sensitivityDrivers.map((d) => d.impact), 0.01);

  return (
    <div className="rounded-lg p-4 mt-3" style={{ background: 'rgba(139,122,200,0.06)', border: '1px solid rgba(139,122,200,0.2)' }}>
      <div className="flex items-center gap-2 mb-3">
        <FlaskConical size={12} style={{ color: ACCENT }} />
        <span className="text-xs font-medium" style={{ color: ACCENT }}>Monte Carlo — {mc.iterations.toLocaleString()} iterations</span>
      </div>
      <div className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {mc.primaryMetric.replace(/([A-Z])/g, ' $1').trim()} confidence distribution
      </div>
      <div className="flex items-end gap-0.5 h-8 mb-2">
        {['p5', 'p25', 'p50', 'p75', 'p95'].map((p, i) => {
          const key = p as keyof typeof primaryBand;
          const val = primaryBand[key] ?? 0;
          const heights = [20, 50, 100, 55, 25];
          return (
            <div key={p} className="flex-1 flex flex-col items-center justify-end gap-0.5">
              <div
                className="w-full rounded-sm"
                style={{
                  height: `${heights[i]}%`,
                  background: i === 2 ? ACCENT : `rgba(139,122,200,${0.2 + i * 0.05})`,
                }}
                title={`${p}: ${typeof val === 'number' ? val.toFixed(1) : val}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
        <span>P5: {primaryBand.p5.toFixed(1)}</span>
        <span>P50: {primaryBand.p50.toFixed(1)}</span>
        <span>P95: {primaryBand.p95.toFixed(1)}</span>
      </div>
      {mc.sensitivityDrivers.length > 0 && (
        <div>
          <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Key sensitivity drivers</div>
          {mc.sensitivityDrivers.slice(0, 4).map((d) => (
            <div key={d.id} className="flex items-center gap-2 mb-1">
              <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.7)', minWidth: 100, maxWidth: 120 }}>{d.label}</div>
              <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.round((d.impact / maxImpact) * 100)}%`, background: ACCENT }}
                />
              </div>
              <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {(d.impact * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TwinCard({
  twin,
  isSelected,
  onClick,
}: {
  twin: TwinState;
  isSelected: boolean;
  onClick: () => void;
}) {
  const typeConfig = TWIN_TYPE_CONFIG[twin.twinType] ?? TWIN_TYPE_CONFIG.vessel;
  const statusConfig = STATUS_CONFIG[twin.status] ?? STATUS_CONFIG.active;
  const Icon = typeConfig.icon;
  const criticalAlerts = twin.alerts.filter((a) => a.severity === 'critical').length;
  const warningAlerts = twin.alerts.filter((a) => a.severity === 'warning').length;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg p-3 transition-all duration-150"
      style={{
        background: isSelected ? 'rgba(139,122,200,0.12)' : CARD,
        border: `1px solid ${isSelected ? 'rgba(139,122,200,0.4)' : BORDER}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
          style={{ background: `${typeConfig.color}18` }}
        >
          <Icon size={14} style={{ color: typeConfig.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium truncate" style={{ color: '#e2e8f0' }}>
              {twin.entityName}
            </span>
            <span
              className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded"
              style={{ background: statusConfig.bg, color: statusConfig.color }}
            >
              {statusConfig.label}
            </span>
          </div>
          <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {typeConfig.label} · {twin.entityId}
          </div>
          <ConfidenceBar value={twin.confidenceScore} color={typeConfig.color} />
          {(criticalAlerts > 0 || warningAlerts > 0) && (
            <div className="flex items-center gap-2 mt-1.5">
              {criticalAlerts > 0 && (
                <span className="flex items-center gap-1 text-xs" style={{ color: '#f87171' }}>
                  <AlertTriangle size={10} />
                  {criticalAlerts} critical
                </span>
              )}
              {warningAlerts > 0 && (
                <span className="flex items-center gap-1 text-xs" style={{ color: '#fbbf24' }}>
                  <AlertTriangle size={10} />
                  {warningAlerts} warning
                </span>
              )}
            </div>
          )}
        </div>
        <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.3)' }} className="flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

function HistoryPanel({ twinId }: { twinId: string }) {
  const { data, isLoading } = useStandardQuery<{ runs: SimulationRun[]; total: number }>({
    queryKey: ['digital-twins-history', twinId],
    queryFn: () =>
      fetch(`/api/digital-twins/${twinId}/simulation-history`, { credentials: 'include' })
        .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then((r) => r.data ?? r),
    staleTime: 30_000,
    retry: 1,
  });
  const [compareIds, setCompareIds] = useState<[string | null, string | null]>([null, null]);
  const runs = data?.runs ?? [];

  const toggleCompare = (id: string) => {
    setCompareIds(([a, b]) => {
      if (a === id) return [null, b];
      if (b === id) return [a, null];
      if (!a) return [id, b];
      if (!b) return [a, id];
      return [id, b];
    });
  };

  const runA = runs.find((r) => r.id === compareIds[0]);
  const runB = runs.find((r) => r.id === compareIds[1]);

  const riskColor = (ra: string) =>
    ra.startsWith('CRITICAL') ? '#f87171' : ra.startsWith('HIGH') ? '#fbbf24' : '#34d399';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 size={18} className="animate-spin" style={{ color: ACCENT }} />
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="text-xs text-center py-10" style={{ color: 'rgba(255,255,255,0.3)' }}>
        No simulation runs recorded yet. Run a scenario to build history.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
        SIMULATION HISTORY{compareIds[0] && compareIds[1] ? ' — select 2 runs to compare' : ' — select up to 2 runs to compare'}
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {runs.map((run) => {
          const isA = compareIds[0] === run.id;
          const isB = compareIds[1] === run.id;
          const isSelected = isA || isB;
          return (
            <button
              key={run.id}
              onClick={() => toggleCompare(run.id)}
              className="w-full text-left rounded-lg p-2.5 transition-all"
              style={{
                background: isSelected ? 'rgba(139,122,200,0.12)' : CARD,
                border: `1px solid ${isSelected ? 'rgba(139,122,200,0.4)' : BORDER}`,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: '#e2e8f0' }}>
                  {run.scenarioName}
                </span>
                {isSelected && (
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(139,122,200,0.2)', color: ACCENT }}>
                    {isA ? 'A' : 'B'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <span style={{ color: riskColor(run.riskAssessment) }}>{run.riskAssessment.split(':')[0]}</span>
                <span>{Math.round(run.confidenceScore * 100)}% conf</span>
                <span>{new Date(run.createdAt).toLocaleDateString()}</span>
              </div>
            </button>
          );
        })}
      </div>

      {runA && runB && (
        <div className="rounded-lg p-3 mt-2" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
          <div className="text-xs font-medium mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
            SIDE-BY-SIDE COMPARISON
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[runA, runB].map((run, idx) => (
              <div key={run.id} className="rounded p-2" style={{ background: 'rgba(139,122,200,0.08)', border: '1px solid rgba(139,122,200,0.2)' }}>
                <div className="text-xs font-medium mb-0.5" style={{ color: ACCENT }}>{idx === 0 ? 'A' : 'B'}: {run.scenarioName}</div>
                <div className="text-xs" style={{ color: riskColor(run.riskAssessment) }}>{run.riskAssessment.split(':')[0]}</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{Math.round(run.confidenceScore * 100)}% conf · {run.runDurationMs}ms</div>
              </div>
            ))}
          </div>
          {Object.keys({ ...runA.deltaMetrics, ...runB.deltaMetrics }).map((key) => {
            const dA = runA.deltaMetrics[key];
            const dB = runB.deltaMetrics[key];
            if (!dA && !dB) return null;
            return (
              <div key={key} className="flex items-start gap-2 text-xs py-1.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <span className="flex-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{key}</span>
                <span className="font-mono" style={{ color: '#e2e8f0', minWidth: 80, textAlign: 'right' }}>
                  {dA ? `${String(dA.before)}→${String(dA.after)}` : '—'}
                </span>
                <span className="font-mono" style={{ color: '#e2e8f0', minWidth: 80, textAlign: 'right' }}>
                  {dB ? `${String(dB.before)}→${String(dB.after)}` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TwinDetail({ twin, onClose }: { twin: TwinState; onClose: () => void }) {
  const typeConfig = TWIN_TYPE_CONFIG[twin.twinType] ?? TWIN_TYPE_CONFIG.vessel;
  const presets = SCENARIO_PRESETS[twin.twinType] ?? [];
  const [activeScenario, setActiveScenario] = useState<(typeof presets)[0] | null>(null);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [simRunning, setSimRunning] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'state' | 'predictions' | 'simulate' | 'alerts' | 'history'>('state');

  const runSimulation = useCallback(async () => {
    if (!activeScenario) return;
    setSimRunning(true);
    setSimError(null);
    setSimResult(null);
    try {
      const resp = await fetch(`/api/digital-twins/${twin.id}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scenario: {
            name: activeScenario.name,
            description: activeScenario.description,
            parameters: activeScenario.parameters,
            impactedMetrics: Object.keys(activeScenario.parameters),
          },
        }),
      });
      const data = await resp.json();
      if (data.success) {
        setSimResult(data.result as SimulationResult);
      } else {
        setSimError(data.error ?? 'Simulation failed');
      }
    } catch (err) {
      setSimError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSimRunning(false);
    }
  }, [activeScenario, twin.id]);

  const Icon = typeConfig.icon;

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 12 }}
    >
      <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: BORDER }}>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${typeConfig.color}18` }}
        >
          <Icon size={16} style={{ color: typeConfig.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm" style={{ color: '#e2e8f0' }}>{twin.entityName}</div>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {typeConfig.label} · {twin.id}
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded hover:bg-white/5 transition-colors">
          <X size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
        </button>
      </div>

      <div className="flex border-b" style={{ borderColor: BORDER }}>
        {(['state', 'predictions', 'simulate', 'alerts', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 text-xs py-2 transition-colors capitalize"
            style={{
              color: activeTab === tab ? ACCENT : 'rgba(255,255,255,0.5)',
              borderBottom: activeTab === tab ? `2px solid ${ACCENT}` : '2px solid transparent',
            }}
          >
            {tab === 'history' ? <Clock size={10} className="inline mr-0.5" /> : null}{tab}
            {tab === 'alerts' && twin.alerts.length > 0 && (
              <span
                className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-xs"
                style={{ background: twin.alerts.some((a) => a.severity === 'critical') ? '#ef4444' : '#f59e0b', color: '#fff' }}
              >
                {twin.alerts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
        {activeTab === 'state' && (
          <div className="space-y-2">
            <div className="text-xs font-medium mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
              CURRENT STATE · synced {new Date(twin.lastSyncedAt).toLocaleTimeString()}
            </div>
            {Object.entries(twin.currentState).map(([key, val]) => (
              <div
                key={key}
                className="flex items-start justify-between gap-2 py-1.5 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.05)' }}
              >
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {key}
                </span>
                <span className="text-xs font-mono text-right" style={{ color: '#e2e8f0', maxWidth: '60%', wordBreak: 'break-all' }}>
                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="space-y-3">
            <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
              PREDICTED STATES
            </div>
            {twin.predictedStates.length === 0 && (
              <div className="text-xs text-center py-8" style={{ color: 'rgba(255,255,255,0.3)' }}>
                No predictions available for this twin type
              </div>
            )}
            {twin.predictedStates.map((ps, i) => (
              <div
                key={i}
                className="rounded-lg p-3"
                style={{ background: CARD, border: `1px solid ${BORDER}` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: typeConfig.color }}>
                    +{ps.timeHorizon}
                  </span>
                  <ConfidenceBar value={ps.confidence} color={typeConfig.color} />
                </div>
                <div className="space-y-1">
                  {Object.entries(ps.state).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{k}</span>
                      <span className="font-mono" style={{ color: '#e2e8f0' }}>
                        {typeof v === 'number' ? v.toFixed(2) : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {ps.drivingFactors.map((f) => (
                    <span
                      key={f}
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'simulate' && (
          <div className="space-y-3">
            <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
              SCENARIO BUILDER
            </div>
            {presets.length === 0 ? (
              <div className="text-xs text-center py-8" style={{ color: 'rgba(255,255,255,0.3)' }}>
                No scenarios defined for this twin type
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setActiveScenario(preset);
                        setSimResult(null);
                        setSimError(null);
                      }}
                      className="w-full text-left rounded-lg p-3 transition-all"
                      style={{
                        background: activeScenario?.name === preset.name ? 'rgba(139,122,200,0.12)' : CARD,
                        border: `1px solid ${activeScenario?.name === preset.name ? 'rgba(139,122,200,0.4)' : BORDER}`,
                      }}
                    >
                      <div className="text-sm font-medium mb-0.5" style={{ color: '#e2e8f0' }}>
                        {preset.name}
                      </div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {preset.description}
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={runSimulation}
                  disabled={!activeScenario || simRunning}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: activeScenario && !simRunning ? ACCENT : 'rgba(255,255,255,0.05)',
                    color: activeScenario && !simRunning ? '#fff' : 'rgba(255,255,255,0.3)',
                    cursor: activeScenario && !simRunning ? 'pointer' : 'not-allowed',
                  }}
                >
                  {simRunning ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Running Monte Carlo simulation…
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      Run Simulation{activeScenario ? ` — ${activeScenario.name}` : ''}
                    </>
                  )}
                </button>

                {simError && (
                  <div
                    className="rounded-lg p-3 text-xs"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
                  >
                    {simError}
                  </div>
                )}

                {simResult && (
                  <div className="space-y-3">
                    <div
                      className="rounded-lg p-3"
                      style={{
                        background: simResult.riskAssessment.startsWith('CRITICAL')
                          ? 'rgba(239,68,68,0.08)'
                          : simResult.riskAssessment.startsWith('HIGH')
                            ? 'rgba(245,158,11,0.08)'
                            : 'rgba(16,185,129,0.08)',
                        border: `1px solid ${simResult.riskAssessment.startsWith('CRITICAL') ? 'rgba(239,68,68,0.25)' : simResult.riskAssessment.startsWith('HIGH') ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)'}`,
                      }}
                    >
                      <div className="text-xs font-medium mb-1" style={{ color: simResult.riskAssessment.startsWith('CRITICAL') ? '#f87171' : simResult.riskAssessment.startsWith('HIGH') ? '#fbbf24' : '#34d399' }}>
                        Risk Assessment
                      </div>
                      <div className="text-xs" style={{ color: '#e2e8f0' }}>{simResult.riskAssessment}</div>
                    </div>

                    <div>
                      <div className="text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>DELTA METRICS</div>
                      {Object.entries(simResult.deltaMetrics).map(([key, delta]) => (
                        <div key={key} className="flex items-center justify-between py-1.5 border-b text-xs" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                          <span style={{ color: 'rgba(255,255,255,0.5)' }}>{key}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              {String(delta.before)}
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.3)' }}>→</span>
                            <span className="font-mono font-medium" style={{ color: delta.changePercent !== undefined && delta.changePercent < 0 ? '#f87171' : delta.changePercent !== undefined && delta.changePercent > 0 ? '#34d399' : '#e2e8f0' }}>
                              {String(delta.after)}
                            </span>
                            {delta.changePercent !== undefined && (
                              <span style={{ color: delta.changePercent < 0 ? '#f87171' : '#34d399' }}>
                                ({delta.changePercent > 0 ? '+' : ''}{delta.changePercent.toFixed(1)}%)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {simResult.recommendedActions.length > 0 && (
                      <div>
                        <div className="text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>RECOMMENDED ACTIONS</div>
                        {simResult.recommendedActions.map((action, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs mb-1.5">
                            <span className="font-mono mt-0.5" style={{ color: ACCENT }}>→</span>
                            <span style={{ color: '#e2e8f0' }}>{action}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {simResult.monteCarlo && <MonteCarloPanel mc={simResult.monteCarlo} />}

                    <div className="flex items-center justify-between text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      <span>Confidence: {Math.round(simResult.confidenceScore * 100)}%</span>
                      <span>Ran in {simResult.runDurationMs}ms</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-2">
            <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
              ACTIVE ALERTS
            </div>
            {twin.alerts.length === 0 ? (
              <div className="text-xs text-center py-8" style={{ color: 'rgba(255,255,255,0.3)' }}>
                No active alerts
              </div>
            ) : (
              twin.alerts.map((alert) => <AlertBadge key={alert.id} alert={alert} />)
            )}
          </div>
        )}

        {activeTab === 'history' && <HistoryPanel twinId={twin.id} />}
      </div>
    </div>
  );
}

export function DigitalTwinsManagementPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useStandardQuery<{ twins: TwinState[]; total: number }>({
    queryKey: ['digital-twins-registry'],
    queryFn: () =>
      fetch('/api/digital-twins', { credentials: 'include' }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }).then((r) => r.data ?? r),
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 1,
  });
  const refetch = () => queryClient.invalidateQueries({ queryKey: ['digital-twins-registry'] });

  const [selectedTwin, setSelectedTwin] = useState<TwinState | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TwinType | 'all'>('all');
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);

  const twins = data?.twins ?? [];
  const filtered = twins.filter((t) => {
    if (filterType !== 'all' && t.twinType !== filterType) return false;
    if (searchQuery && !t.entityName.toLowerCase().includes(searchQuery.toLowerCase()) && !t.entityId.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const seedDemo = useCallback(async () => {
    setIsSeedingDemo(true);
    try {
      await fetch('/api/digital-twins/demo/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      refetch();
    } finally {
      setIsSeedingDemo(false);
    }
  }, [refetch]);

  const totalAlerts = twins.reduce((s, t) => s + t.alerts.length, 0);
  const criticalAlerts = twins.reduce((s, t) => s + t.alerts.filter((a) => a.severity === 'critical').length, 0);
  const activeCount = twins.filter((t) => t.status === 'active').length;

  return (
    <div className="flex flex-col h-full" style={{ background: BG }}>
      <div className="flex-shrink-0 p-6 pb-4 border-b" style={{ borderColor: BORDER }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold mb-1" style={{ color: '#e2e8f0' }}>
              Digital Twin Registry
            </h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              HIL simulation layer — persistent twins with Monte Carlo probabilistic simulation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:bg-white/5"
              style={{ border: `1px solid ${BORDER}`, color: 'rgba(255,255,255,0.6)' }}
            >
              <RefreshCw size={12} />
              Refresh
            </button>
            {twins.length === 0 && (
              <button
                onClick={seedDemo}
                disabled={isSeedingDemo}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
                style={{ background: ACCENT, color: '#fff', opacity: isSeedingDemo ? 0.6 : 1 }}
              >
                {isSeedingDemo ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                Seed Demo Twins
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Total Twins', value: twins.length, icon: Cpu, color: ACCENT },
            { label: 'Active', value: activeCount, icon: Activity, color: '#10b981' },
            { label: 'Total Alerts', value: totalAlerts, icon: AlertTriangle, color: '#f59e0b' },
            { label: 'Critical', value: criticalAlerts, icon: AlertTriangle, color: '#ef4444' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-lg p-3"
              style={{ background: CARD, border: `1px solid ${BORDER}` }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={12} style={{ color }} />
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
              </div>
              <div className="text-2xl font-semibold font-mono" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search twins…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${BORDER}`,
              color: '#e2e8f0',
            }}
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${BORDER}`,
              color: '#e2e8f0',
            }}
          >
            <option value="all">All Types</option>
            {Object.entries(TWIN_TYPE_CONFIG).map(([type, cfg]) => (
              <option key={type} value={type}>{cfg.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div
          className="flex-shrink-0 overflow-y-auto p-4 space-y-2"
          style={{
            width: selectedTwin ? 320 : '100%',
            maxWidth: selectedTwin ? 320 : undefined,
            borderRight: selectedTwin ? `1px solid ${BORDER}` : undefined,
            scrollbarWidth: 'thin',
          }}
        >
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin" style={{ color: ACCENT }} />
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-12">
              <Cpu size={32} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
              <div className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {twins.length === 0 ? 'No twins registered. Seed demo data to get started.' : 'No twins match your filter.'}
              </div>
            </div>
          )}
          {filtered.map((twin) => (
            <TwinCard
              key={twin.id}
              twin={twin}
              isSelected={selectedTwin?.id === twin.id}
              onClick={() => setSelectedTwin(selectedTwin?.id === twin.id ? null : twin)}
            />
          ))}
        </div>

        {selectedTwin && (
          <div className="flex-1 overflow-hidden p-4">
            <TwinDetail twin={selectedTwin} onClose={() => setSelectedTwin(null)} />
          </div>
        )}
      </div>
    </div>
  );
}

export default DigitalTwinsManagementPage;
