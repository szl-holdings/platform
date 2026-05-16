import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  PlayCircle,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Link } from 'wouter';

const BG = 'hsl(214,16%,4%)';
const SURFACE = 'hsla(0,0%,100%,0.03)';
const SURFACE2 = 'hsla(0,0%,100%,0.06)';
const BORDER = 'hsla(0,0%,100%,0.07)';
const TEXT = 'hsl(38,8%,92%)';
const TEXT_SEC = 'hsl(214,7%,55%)';
const ACCENT = '#f5f5f5';
const GOLD = '#c9b787';
const GREEN = '#22c55e';
const RED = '#ef4444';
const ORANGE = '#f97316';
const BLUE = '#3b82f6';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

interface TechniqueResult {
  techniqueId: string;
  techniqueName: string;
  tacticName: string;
  detected: boolean;
  mttdSeconds: number;
  mttcSeconds: number;
  blastRadiusPrevented: number;
  falsePositivesGenerated: number;
  analystHoursSaved: number;
  outcome: 'detected-and-contained' | 'detected-not-contained' | 'missed';
  coverageGap?: string;
}

interface Scorecard {
  payloadId: string;
  payloadName: string;
  domain: string;
  runId: string;
  ranAt: string;
  techniqueResults: TechniqueResult[];
  mttdSeconds: number;
  mttcSeconds: number;
  blastRadiusPrevented: number;
  falsePositiveBurden: number;
  analystHoursSaved: number;
  compositeConfidence: number;
  detectionRate: number;
  containmentRate: number;
  status: 'pass' | 'regression' | 'fail';
  coverageGaps: string[];
}

interface RunSummary {
  runId: string;
  ranAt: string;
  status: string;
  overallCompositeScore: number | null;
  weekOverWeekDelta: number | null;
  rollingFourWeekAvg: number | null;
  regressionCount: number;
  durationMs: number | null;
  scorecards: Scorecard[];
}

interface QuarterlyReport {
  generatedAt: string;
  periodLabel: string;
  totalRuns: number;
  averageCompositeScore: number;
  scoreImprovement: number | null;
  bestPayload: { name: string; score: number } | null;
  worstPayload: { name: string; score: number } | null;
  totalAnalystHoursSaved: number;
  totalBlastRadiusPrevented: number;
  totalRegressions: number;
  coverageGaps: string[];
  payloadSummaries: Array<{
    payloadId: string;
    payloadName: string;
    domain: string;
    latestScore: number;
    trend: 'improving' | 'stable' | 'degrading';
    detectionRate: number;
    containmentRate: number;
    mttdSeconds: number;
    mttcSeconds: number;
  }>;
  executiveSummary: string;
  residualRisks: string[];
}

function fmtSeconds(s: number): string {
  if (s >= 3600) return `${(s / 3600).toFixed(1)}h`;
  if (s >= 60) return `${Math.round(s / 60)}m`;
  return `${s}s`;
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function scoreColor(score: number): string {
  if (score >= 0.8) return GREEN;
  if (score >= 0.65) return GOLD;
  if (score >= 0.5) return ORANGE;
  return RED;
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pass: { label: 'PASS', color: GREEN, bg: 'rgba(34,197,94,0.08)' },
    completed: { label: 'PASS', color: GREEN, bg: 'rgba(34,197,94,0.08)' },
    regression: { label: 'REGRESSION', color: ORANGE, bg: 'rgba(249,115,22,0.08)' },
    fail: { label: 'FAIL', color: RED, bg: 'rgba(239,68,68,0.08)' },
    failed: { label: 'FAIL', color: RED, bg: 'rgba(239,68,68,0.08)' },
    missed: { label: 'MISSED', color: RED, bg: 'rgba(239,68,68,0.08)' },
    'detected-and-contained': { label: 'CONTAINED', color: GREEN, bg: 'rgba(34,197,94,0.08)' },
    'detected-not-contained': { label: 'NOT CONTAINED', color: ORANGE, bg: 'rgba(249,115,22,0.08)' },
  };
  const m = map[status] ?? { label: status.toUpperCase(), color: TEXT_SEC, bg: SURFACE };
  return (
    <span
      className="text-[9px] font-mono px-1.5 py-0.5 rounded"
      style={{ color: m.color, background: m.bg }}
    >
      {m.label}
    </span>
  );
}

function Sparkline({
  values,
  color,
  width = 96,
  height = 28,
}: {
  values: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-[8px] font-mono"
        style={{ width, height, color: TEXT_SEC }}
      >
        n=1
      </div>
    );
  }
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = w / (values.length - 1);
  const points = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + h - ((v - min) / range) * h;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const path = `M${points.join(' L')}`;
  const areaPath = `${path} L${(pad + w).toFixed(2)},${(pad + h).toFixed(2)} L${pad.toFixed(2)},${(pad + h).toFixed(2)} Z`;
  const lastX = pad + (values.length - 1) * stepX;
  const lastY = pad + h - ((values[values.length - 1]! - min) / range) * h;
  return (
    <svg width={width} height={height} aria-hidden="true">
      <path d={areaPath} fill={color} fillOpacity={0.12} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={1.75} fill={color} />
    </svg>
  );
}

function ScorecardCard({
  sc,
  history,
  expanded,
  onToggle,
}: {
  sc: Scorecard;
  history: number[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const conf = sc.compositeConfidence;
  const color = scoreColor(conf);
  const trendValues = history.length > 0 ? history : [conf];
  const first = trendValues[0]!;
  const last = trendValues[trendValues.length - 1]!;
  const delta = last - first;

  return (
    <div className="rounded-xl border" style={{ border: `1px solid ${BORDER}`, background: SURFACE }}>
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-start gap-4"
      >
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
          style={{ background: `${color}12`, color, border: `1px solid ${color}30` }}
        >
          {Math.round(conf * 100)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold" style={{ color: TEXT }}>{sc.payloadName}</span>
            {statusBadge(sc.status)}
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: TEXT_SEC, background: SURFACE2 }}>
              {sc.domain.toUpperCase()}
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: TEXT_SEC, background: SURFACE2 }}>
              n={trendValues.length}
            </span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-[10px]" style={{ color: TEXT_SEC }}>
              Detection: <span style={{ color }}>{fmtPct(sc.detectionRate)}</span>
            </span>
            <span className="text-[10px]" style={{ color: TEXT_SEC }}>
              Containment: <span style={{ color }}>{fmtPct(sc.containmentRate)}</span>
            </span>
            <span className="text-[10px]" style={{ color: TEXT_SEC }}>
              MTTD: <span style={{ color: ACCENT }}>{fmtSeconds(sc.mttdSeconds)}</span>
            </span>
            <span className="text-[10px]" style={{ color: TEXT_SEC }}>
              MTTC: <span style={{ color: ACCENT }}>{fmtSeconds(sc.mttcSeconds)}</span>
            </span>
            <span className="text-[10px]" style={{ color: TEXT_SEC }}>
              Blast radius prevented: <span style={{ color: GREEN }}>{sc.blastRadiusPrevented}</span>
            </span>
            <span className="text-[10px]" style={{ color: TEXT_SEC }}>
              Analyst hours saved: <span style={{ color: GREEN }}>{sc.analystHoursSaved.toFixed(1)}</span>
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <Sparkline values={trendValues} color={color} />
          <div className="flex items-center gap-1 text-[9px] font-mono" style={{ color: TEXT_SEC }}>
            <span>last {trendValues.length}</span>
            {trendValues.length > 1 && (
              <span style={{ color: delta >= 0 ? GREEN : RED }}>
                {delta >= 0 ? '+' : ''}{(delta * 100).toFixed(1)}%
              </span>
            )}
            {expanded ? (
              <ChevronUp className="w-3 h-3" style={{ color: TEXT_SEC }} />
            ) : (
              <ChevronDown className="w-3 h-3" style={{ color: TEXT_SEC }} />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t" style={{ borderColor: BORDER }}>
          {sc.coverageGaps.length > 0 && (
            <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <div className="text-[10px] font-mono mb-1.5" style={{ color: RED }}>COVERAGE GAPS</div>
              {sc.coverageGaps.map((gap, i) => (
                <div key={i} className="text-[11px] flex items-start gap-1.5 mb-1" style={{ color: 'hsl(0,70%,75%)' }}>
                  <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {gap}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <div className="text-[10px] font-mono uppercase tracking-wider mb-3" style={{ color: TEXT_SEC }}>
              Technique Results ({sc.techniqueResults.length})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]" style={{ minWidth: 600 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['Technique', 'Tactic', 'Outcome', 'MTTD', 'MTTC', 'Blast Prevented', 'FP Count', 'Analyst Hrs'].map(h => (
                      <th key={h} className="text-left py-2 px-2 font-medium" style={{ color: TEXT_SEC }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sc.techniqueResults.map(t => (
                    <tr key={t.techniqueId} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td className="py-2 px-2 font-mono" style={{ color: ACCENT }}>
                        <span style={{ color: BLUE }}>{t.techniqueId}</span> {t.techniqueName}
                      </td>
                      <td className="py-2 px-2" style={{ color: TEXT_SEC }}>{t.tacticName}</td>
                      <td className="py-2 px-2">{statusBadge(t.outcome)}</td>
                      <td className="py-2 px-2 font-mono" style={{ color: t.detected ? ACCENT : RED }}>
                        {t.detected ? fmtSeconds(t.mttdSeconds) : '—'}
                      </td>
                      <td className="py-2 px-2 font-mono" style={{ color: t.outcome === 'detected-and-contained' ? ACCENT : RED }}>
                        {t.outcome === 'detected-and-contained' ? fmtSeconds(t.mttcSeconds) : '—'}
                      </td>
                      <td className="py-2 px-2 font-mono" style={{ color: GREEN }}>{t.blastRadiusPrevented}</td>
                      <td className="py-2 px-2 font-mono" style={{ color: t.falsePositivesGenerated > 3 ? ORANGE : TEXT_SEC }}>
                        {t.falsePositivesGenerated}
                      </td>
                      <td className="py-2 px-2 font-mono" style={{ color: GREEN }}>{t.analystHoursSaved.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuarterlyReportPanel({ report }: { report: QuarterlyReport }) {
  return (
    <div className="rounded-xl border p-6" style={{ border: `1px solid ${BORDER}`, background: SURFACE }}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: GOLD }}>
            Trust & Response Report · {report.periodLabel}
          </div>
          <h3 className="text-lg font-semibold" style={{ color: TEXT }}>Executive Quarterly Report</h3>
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border hover:bg-white/5 transition-colors"
          style={{ borderColor: BORDER, color: TEXT_SEC }}
          onClick={() => {
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `trust-response-report-${report.periodLabel.replace(' ', '-')}.json`;
            a.click();
          }}
        >
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Emulation Cycles', value: String(report.totalRuns), color: ACCENT },
          { label: 'Avg Confidence', value: fmtPct(report.averageCompositeScore), color: scoreColor(report.averageCompositeScore) },
          { label: 'Analyst Hrs Saved', value: report.totalAnalystHoursSaved.toFixed(0), color: GREEN },
          { label: 'Blast Radius Prevented', value: String(report.totalBlastRadiusPrevented), color: GREEN },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg p-3" style={{ background: SURFACE2, border: `1px solid ${BORDER}` }}>
            <div className="text-lg font-bold font-mono" style={{ color }}>{value}</div>
            <div className="text-[10px] mt-0.5" style={{ color: TEXT_SEC }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 p-4 rounded-lg" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)' }}>
        <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: GOLD }}>Executive Summary</div>
        <p className="text-sm leading-relaxed" style={{ color: TEXT_SEC }}>{report.executiveSummary}</p>
      </div>

      <div className="mb-4">
        <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: TEXT_SEC }}>Payload Trendlines</div>
        <div className="flex flex-col gap-2">
          {report.payloadSummaries.map(ps => {
            const TrendIcon = ps.trend === 'improving' ? TrendingUp : ps.trend === 'degrading' ? TrendingDown : Activity;
            const trendColor = ps.trend === 'improving' ? GREEN : ps.trend === 'degrading' ? RED : TEXT_SEC;
            return (
              <div key={ps.payloadId} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: SURFACE2, border: `1px solid ${BORDER}` }}>
                <TrendIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: trendColor }} />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium" style={{ color: TEXT }}>{ps.payloadName}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono flex-shrink-0">
                  <span style={{ color: scoreColor(ps.latestScore) }}>{fmtPct(ps.latestScore)}</span>
                  <span style={{ color: TEXT_SEC }}>Detection {fmtPct(ps.detectionRate)}</span>
                  <span style={{ color: TEXT_SEC }}>MTTD {fmtSeconds(ps.mttdSeconds)}</span>
                  <span style={{ color: trendColor, textTransform: 'capitalize' }}>{ps.trend}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {report.residualRisks.length > 0 && (
        <div className="p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}>
          <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: RED }}>Residual Risks</div>
          {report.residualRisks.map((r, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[11px] mb-1" style={{ color: 'hsl(0,60%,75%)' }}>
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              {r}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EmulationScorecardPage() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [activeRun, setActiveRun] = useState<RunSummary | null>(null);
  const [report, setReport] = useState<QuarterlyReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = `${base}/../api`.replace('/sentra/../', '/');

  async function fetchRuns() {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/firestorm/emulation/runs?limit=12`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { runs: RunSummary[] };
      const r = data.runs ?? [];
      setRuns(r);
      if (r.length > 0) setActiveRun(r[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load runs');
    } finally {
      setLoading(false);
    }
  }

  async function triggerRun() {
    try {
      setTriggering(true);
      await fetch(`${apiBase}/firestorm/emulation/trigger`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'manual trigger from Sentra UI' }),
      });
      setTimeout(() => fetchRuns(), 3000);
    } catch {
    } finally {
      setTriggering(false);
    }
  }

  async function fetchReport() {
    try {
      setReportLoading(true);
      const res = await fetch(`${apiBase}/firestorm/emulation/report/quarterly`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as QuarterlyReport;
      setReport(data);
      setShowReport(true);
    } catch {
    } finally {
      setReportLoading(false);
    }
  }

  useEffect(() => { fetchRuns(); }, []);

  const latestRun = runs[0];

  return (
    <div className="min-h-screen" style={{ background: BG, color: TEXT }}>
      <nav
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b backdrop-blur"
        style={{ background: `${BG}ee`, borderColor: BORDER }}
      >
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <span className="text-[10px] font-mono uppercase tracking-widest cursor-pointer hover:opacity-70" style={{ color: TEXT_SEC }}>
              ← Dashboard
            </span>
          </Link>
          <span style={{ color: BORDER }}>|</span>
          <span className="text-sm font-semibold" style={{ color: TEXT }}>Adversary Emulation Scorecards</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: GOLD, background: 'rgba(201,183,135,0.08)', border: '1px solid rgba(201,183,135,0.2)' }}>
            ATT&CK-MAPPED
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchRuns()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border hover:bg-white/5 transition-colors"
            style={{ borderColor: BORDER, color: TEXT_SEC }}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={fetchReport}
            disabled={reportLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border hover:bg-white/5 transition-colors"
            style={{ borderColor: BORDER, color: TEXT_SEC }}
          >
            {reportLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            Quarterly Report
          </button>
          <button
            onClick={triggerRun}
            disabled={triggering}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold hover:opacity-90 transition-opacity"
            style={{ background: ACCENT, color: BG }}
          >
            {triggering ? <RefreshCw className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
            Run Now
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: RED }}>
            {error} — emulation data will populate after the first weekly run or manual trigger.
          </div>
        )}

        {latestRun && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {[
              {
                label: 'Composite Confidence',
                value: latestRun.overallCompositeScore != null ? fmtPct(latestRun.overallCompositeScore) : '—',
                color: latestRun.overallCompositeScore != null ? scoreColor(latestRun.overallCompositeScore) : TEXT_SEC,
              },
              {
                label: 'Week-over-Week',
                value: latestRun.weekOverWeekDelta != null
                  ? `${latestRun.weekOverWeekDelta >= 0 ? '+' : ''}${(latestRun.weekOverWeekDelta * 100).toFixed(1)}%`
                  : '—',
                color: latestRun.weekOverWeekDelta == null ? TEXT_SEC : latestRun.weekOverWeekDelta >= 0 ? GREEN : RED,
              },
              {
                label: '4-Week Rolling Avg',
                value: latestRun.rollingFourWeekAvg != null ? fmtPct(latestRun.rollingFourWeekAvg) : '—',
                color: latestRun.rollingFourWeekAvg != null ? scoreColor(latestRun.rollingFourWeekAvg) : TEXT_SEC,
              },
              {
                label: 'Regressions',
                value: String(latestRun.regressionCount),
                color: latestRun.regressionCount > 0 ? RED : GREEN,
              },
              {
                label: 'Last Run Status',
                value: latestRun.status.toUpperCase(),
                color: latestRun.status === 'completed' || latestRun.status === 'pass' ? GREEN : latestRun.status === 'regression' ? ORANGE : RED,
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl p-4" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                <div className="text-lg font-bold font-mono" style={{ color }}>{value}</div>
                <div className="text-[10px] mt-0.5" style={{ color: TEXT_SEC }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {showReport && report && (
          <div className="mb-6">
            <QuarterlyReportPanel report={report} />
          </div>
        )}

        {loading && runs.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex items-center gap-3" style={{ color: TEXT_SEC }}>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading emulation history…</span>
            </div>
          </div>
        ) : runs.length === 0 ? (
          <div className="rounded-xl border p-12 text-center" style={{ border: `1px solid ${BORDER}`, background: SURFACE }}>
            <Shield className="w-10 h-10 mx-auto mb-3" style={{ color: TEXT_SEC }} />
            <div className="text-sm font-medium mb-2" style={{ color: TEXT }}>No emulation runs yet</div>
            <p className="text-[11px] mb-4" style={{ color: TEXT_SEC }}>
              The weekly emulation loop runs automatically. Trigger a manual run to populate the first scorecard.
            </p>
            <button
              onClick={triggerRun}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 mx-auto"
              style={{ background: ACCENT, color: BG }}
            >
              <PlayCircle className="w-4 h-4" /> Run First Emulation
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-1">
              <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: TEXT_SEC }}>
                Run History
              </div>
              <div className="flex flex-col gap-2">
                {runs.map(run => {
                  const score = run.overallCompositeScore;
                  const color = score != null ? scoreColor(score) : TEXT_SEC;
                  const isActive = activeRun?.runId === run.runId;
                  return (
                    <button
                      key={run.runId}
                      onClick={() => setActiveRun(run)}
                      className="w-full text-left rounded-lg px-3 py-2.5 transition-all"
                      style={{
                        background: isActive ? `${color}08` : SURFACE,
                        border: `1px solid ${isActive ? `${color}30` : BORDER}`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono" style={{ color: TEXT_SEC }}>
                          {new Date(run.ranAt).toLocaleDateString()} {new Date(run.ranAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {statusBadge(run.status)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold font-mono" style={{ color }}>
                          {score != null ? fmtPct(score) : '—'}
                        </span>
                        {run.weekOverWeekDelta != null && (
                          <span className="text-[10px] font-mono" style={{ color: run.weekOverWeekDelta >= 0 ? GREEN : RED }}>
                            {run.weekOverWeekDelta >= 0 ? '+' : ''}{(run.weekOverWeekDelta * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                      {run.regressionCount > 0 && (
                        <div className="text-[9px] mt-1 flex items-center gap-1" style={{ color: RED }}>
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {run.regressionCount} regression{run.regressionCount !== 1 ? 's' : ''}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2">
              {activeRun ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: TEXT_SEC }}>
                      Payload Scorecards · {new Date(activeRun.ranAt).toLocaleString()}
                    </div>
                    <div className="text-[10px] font-mono" style={{ color: TEXT_SEC }}>
                      <Clock className="w-3 h-3 inline mr-1" />
                      {activeRun.durationMs != null ? `${(activeRun.durationMs / 1000).toFixed(1)}s` : '—'}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {activeRun.scorecards.map(sc => {
                      const history = runs
                        .slice()
                        .reverse()
                        .flatMap(r => r.scorecards.filter(s => s.payloadId === sc.payloadId).map(s => s.compositeConfidence))
                        .slice(-8);
                      return (
                        <ScorecardCard
                          key={sc.payloadId}
                          sc={sc}
                          history={history}
                          expanded={!!expanded[sc.payloadId]}
                          onToggle={() => setExpanded(e => ({ ...e, [sc.payloadId]: !e[sc.payloadId] }))}
                        />
                      );
                    })}
                    {activeRun.scorecards.length === 0 && (
                      <div className="rounded-xl border p-8 text-center" style={{ border: `1px solid ${BORDER}`, background: SURFACE }}>
                        <Activity className="w-6 h-6 mx-auto mb-2" style={{ color: TEXT_SEC }} />
                        <p className="text-[11px]" style={{ color: TEXT_SEC }}>
                          Scorecard detail not available for this run.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-xl border p-8 text-center" style={{ border: `1px solid ${BORDER}`, background: SURFACE }}>
                  <Shield className="w-6 h-6 mx-auto mb-2" style={{ color: TEXT_SEC }} />
                  <p className="text-[11px]" style={{ color: TEXT_SEC }}>Select a run to view scorecards</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 rounded-xl border p-4" style={{ border: `1px solid ${BORDER}`, background: SURFACE }}>
          <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: TEXT_SEC }}>
            CPS Payload Registry — Technique Coverage
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { name: 'Identity Kill-Chain', domain: 'identity', techniques: ['T1078', 'T1110', 'T1003', 'T1098', 'T1053'] },
              { name: 'Lateral Movement Containment', domain: 'lateral-movement', techniques: ['T1021', 'T1550', 'T1563', 'T1570', 'T1534'] },
              { name: 'Data Exfiltration Guardrail', domain: 'exfiltration', techniques: ['T1041', 'T1048', 'T1567', 'T1020', 'T1030'] },
            ].map(p => (
              <div key={p.name} className="rounded-lg p-3" style={{ background: SURFACE2, border: `1px solid ${BORDER}` }}>
                <div className="text-[11px] font-semibold mb-1" style={{ color: TEXT }}>{p.name}</div>
                <div className="text-[9px] mb-2 uppercase" style={{ color: TEXT_SEC }}>{p.domain}</div>
                <div className="flex flex-wrap gap-1">
                  {p.techniques.map(t => (
                    <span key={t} className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ color: BLUE, background: 'rgba(59,130,246,0.08)' }}>
                      {t}
                    </span>
                  ))}
                </div>
                <div className="text-[9px] mt-2" style={{ color: TEXT_SEC }}>
                  To add a technique: drop into TECHNIQUE_REGISTRY · no code change required
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
