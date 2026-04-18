import { useState, useEffect, useCallback } from "react";
import {
  FlaskConical,
  RefreshCw,
  PlayCircle,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart2,
  Loader,
  TrendingDown,
  TrendingUp,
  Minus,
  Shield,
} from "lucide-react";

const API = "/api";

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!r.ok) throw new Error(`${r.status}`);
  const json = await r.json() as { data?: T } & T;
  return (json as { data?: T }).data ?? json as T;
}

interface DomainInfo {
  domain: string;
  count: number;
  redTeam: boolean;
}

interface DatasetInfo {
  totalCases: number;
  domains: DomainInfo[];
}

interface EvalReport {
  suiteId: string;
  suiteName?: string;
  model: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  passRate: number;
  avgScore: number;
  avgLatencyMs: number;
  totalCostUsd: number;
  domains?: string[];
  completedAt?: string;
}

interface RegressionEntry {
  suiteId: string;
  model: string;
  basePassRate: number;
  currentPassRate?: number;
  passRateDelta?: number;
  baseScore: number;
  currentScore?: number;
  scoreDelta?: number;
  status: "ok" | "regressed" | "improved" | "no_current";
  recordedAt: string;
}

interface RegressionDashboard {
  baselines: RegressionEntry[];
}

function PassRateBadge({ rate }: { rate: number }) {
  const pct = (rate * 100).toFixed(1);
  const color = rate >= 0.85 ? "text-nexus-green" : rate >= 0.7 ? "text-nexus-amber" : "text-nexus-red";
  return <span className={`font-mono text-sm font-bold ${color}`}>{pct}%</span>;
}

function TrendIcon({ delta }: { delta?: number }) {
  if (delta == null) return <Minus className="w-3 h-3 text-muted-foreground/40" />;
  if (delta > 0.01) return <TrendingUp className="w-3 h-3 text-nexus-green" />;
  if (delta < -0.01) return <TrendingDown className="w-3 h-3 text-nexus-red" />;
  return <Minus className="w-3 h-3 text-nexus-amber" />;
}

function EvalReportCard({ report }: { report: EvalReport }) {
  return (
    <div className="rounded-lg bg-nexus-surface border border-nexus p-4 space-y-3">
      <div className="flex items-center gap-2 justify-between">
        <div>
          <div className="text-sm font-semibold">{report.suiteName ?? report.suiteId}</div>
          <div className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
            model: {report.model} · {report.domains?.join(", ")}
          </div>
        </div>
        <div className="text-right">
          <PassRateBadge rate={report.passRate} />
          <div className="text-[10px] text-muted-foreground/50 mt-0.5">pass rate</div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="rounded border border-nexus bg-nexus-bg py-2">
          <div className="text-lg font-mono font-bold text-foreground">{report.totalCases}</div>
          <div className="text-[9px] text-muted-foreground/60">cases</div>
        </div>
        <div className="rounded border border-nexus-green/30 bg-nexus-green/5 py-2">
          <div className="text-lg font-mono font-bold text-nexus-green">{report.passedCases}</div>
          <div className="text-[9px] text-muted-foreground/60">passed</div>
        </div>
        <div className="rounded border border-red-500/30 bg-red-500/5 py-2">
          <div className="text-lg font-mono font-bold text-nexus-red">{report.failedCases}</div>
          <div className="text-[9px] text-muted-foreground/60">failed</div>
        </div>
        <div className="rounded border border-nexus bg-nexus-bg py-2">
          <div className="text-lg font-mono font-bold text-muted-foreground/80">{report.avgLatencyMs.toFixed(0)}ms</div>
          <div className="text-[9px] text-muted-foreground/60">avg latency</div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
        <BarChart2 className="w-3 h-3" />
        avg score: {(report.avgScore).toFixed(1)} · cost: ${report.totalCostUsd.toFixed(5)}
        {report.completedAt && (
          <span className="ml-auto">{new Date(report.completedAt).toLocaleTimeString()}</span>
        )}
      </div>
    </div>
  );
}

export default function EvalConsole() {
  const [datasets, setDatasets] = useState<DatasetInfo | null>(null);
  const [regression, setRegression] = useState<RegressionDashboard | null>(null);
  const [reports, setReports] = useState<EvalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [redTeamRunning, setRedTeamRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [includeRedTeam, setIncludeRedTeam] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ds, reg] = await Promise.all([
        apiFetch<DatasetInfo>("/pulse-evals/datasets").catch(() => null),
        apiFetch<{ dashboard: RegressionDashboard }>("/pulse-evals/regression-dashboard")
          .then(r => r.dashboard)
          .catch(() => null),
      ]);
      setDatasets(ds);
      setRegression(reg);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleDomain(domain: string) {
    setSelectedDomains(prev =>
      prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]
    );
  }

  async function runEvals() {
    const key = selectedDomains.join(",") || "all";
    setRunning(key);
    setError(null);
    try {
      const result = await apiFetch<{ report: EvalReport }>("/pulse-evals/run", {
        method: "POST",
        body: JSON.stringify({
          domains: selectedDomains.length > 0 ? selectedDomains : undefined,
          includeRedTeam,
        }),
      });
      setReports(prev => [result.report, ...prev.slice(0, 4)]);
    } catch (e) {
      setError(`Eval run failed: ${String(e)} — requires operator role`);
    } finally {
      setRunning(null);
    }
  }

  async function runRedTeam() {
    setRedTeamRunning(true);
    setError(null);
    try {
      const result = await apiFetch<{ report: EvalReport }>("/pulse-evals/run-red-team", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setReports(prev => [result.report, ...prev.slice(0, 4)]);
    } catch (e) {
      setError(`Red team run failed: ${String(e)} — requires admin role`);
    } finally {
      setRedTeamRunning(false);
    }
  }

  const baselines = regression?.baselines ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-nexus-cyan font-mono tracking-wide">
            EVAL CONSOLE
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Run eval suites · browse results · regression tracking
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-nexus-surface border border-nexus text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-nexus-red flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="rounded-lg bg-nexus-surface border border-nexus p-4 space-y-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-nexus-cyan" />
          <h2 className="text-sm font-semibold text-nexus-cyan font-mono">RUN EVALS</h2>
          {datasets && (
            <span className="text-[10px] text-muted-foreground/60 ml-auto">
              {datasets.totalCases} cases · {datasets.domains.length} domains
            </span>
          )}
        </div>

        {datasets && (
          <div className="space-y-2">
            <div className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-mono">Select domains (empty = all)</div>
            <div className="flex flex-wrap gap-1.5">
              {datasets.domains.map(d => (
                <button
                  key={d.domain}
                  onClick={() => toggleDomain(d.domain)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-mono transition-colors ${
                    selectedDomains.includes(d.domain)
                      ? "border-nexus-cyan/40 bg-nexus-cyan/10 text-nexus-cyan"
                      : "border-nexus bg-nexus-bg text-muted-foreground/60 hover:text-foreground"
                  }`}
                >
                  {d.domain}
                  <span className="text-muted-foreground/40">({d.count})</span>
                  {d.redTeam && <Shield className="w-2.5 h-2.5 text-nexus-amber" />}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={includeRedTeam}
              onChange={e => setIncludeRedTeam(e.target.checked)}
              className="w-3 h-3 rounded border-nexus"
            />
            Include red-team cases
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={runEvals}
            disabled={running !== null || redTeamRunning}
            className="flex items-center gap-2 px-4 py-2 rounded border border-nexus-cyan/40 bg-nexus-cyan/10 text-nexus-cyan text-xs hover:bg-nexus-cyan/20 transition-colors disabled:opacity-50"
          >
            {running !== null ? <Loader className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
            {running !== null ? "Running…" : "Run Evals"}
          </button>
          <button
            onClick={runRedTeam}
            disabled={running !== null || redTeamRunning}
            className="flex items-center gap-2 px-4 py-2 rounded border border-nexus-amber/40 bg-nexus-amber/10 text-nexus-amber text-xs hover:bg-nexus-amber/20 transition-colors disabled:opacity-50"
          >
            {redTeamRunning ? <Loader className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
            Red Team Run
          </button>
        </div>
      </div>

      {reports.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest">Recent Runs</h2>
          {reports.map((r, i) => (
            <EvalReportCard key={`${r.suiteId}-${i}`} report={r} />
          ))}
        </div>
      )}

      {baselines.length > 0 && (
        <div className="rounded-lg bg-nexus-surface border border-nexus p-4 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-nexus-amber" />
            <h2 className="text-sm font-semibold text-nexus-amber font-mono">REGRESSION DASHBOARD</h2>
          </div>
          <div className="space-y-1.5">
            {baselines.map(b => (
              <div
                key={`${b.suiteId}-${b.model}`}
                className="rounded border border-nexus bg-nexus-bg px-3 py-2 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono">{b.suiteId}</div>
                  <div className="text-[10px] text-muted-foreground/60">{b.model}</div>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="text-muted-foreground/60">base: {(b.basePassRate * 100).toFixed(1)}%</span>
                  {b.currentPassRate != null && (
                    <>
                      <span className="text-foreground">{(b.currentPassRate * 100).toFixed(1)}%</span>
                      <TrendIcon delta={b.passRateDelta} />
                      {b.passRateDelta != null && (
                        <span className={b.passRateDelta > 0 ? "text-nexus-green" : b.passRateDelta < 0 ? "text-nexus-red" : "text-muted-foreground"}>
                          {b.passRateDelta > 0 ? "+" : ""}{(b.passRateDelta * 100).toFixed(1)}%
                        </span>
                      )}
                    </>
                  )}
                  <div className="ml-2">
                    {b.status === "ok" && <CheckCircle className="w-3.5 h-3.5 text-nexus-green" />}
                    {b.status === "regressed" && <XCircle className="w-3.5 h-3.5 text-nexus-red" />}
                    {b.status === "improved" && <CheckCircle className="w-3.5 h-3.5 text-nexus-cyan" />}
                    {b.status === "no_current" && <AlertCircle className="w-3.5 h-3.5 text-muted-foreground/40" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && baselines.length === 0 && reports.length === 0 && (
        <div className="text-center text-muted-foreground/50 text-sm py-8">
          Run an eval suite to see results and regression tracking
        </div>
      )}
    </div>
  );
}
