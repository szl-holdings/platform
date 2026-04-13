import { Scale, AlertTriangle, Clock, TrendingUp, DollarSign, ShieldCheck, FileText, ArrowRight, ChevronRight, Wifi, WifiOff, Shield, CheckCircle, XCircle, Brain, Gavel, Target } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DEMO_MATTERS, PILLAR_LABELS } from "../data/demo-matters";
import { usePrismDashboard, usePrismMatters } from "../hooks/use-prism-api";
import { SectionErrorBoundary } from "@szl-holdings/shared-ui/error-boundary";

function useFilingGateStats() {
  return useQuery({
    queryKey: ["filing-gate", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/prism-counsel/review-desk/filing-gate/stats", {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    staleTime: 60000,
    retry: false,
  });
}

function PillarBar({ label, score, max = 100 }: { label: string; score: number; max?: number }) {
  const pct = Math.round((score / max) * 100);
  const color = pct >= 75 ? "#4a90b8" : pct >= 50 ? "#d4a054" : "#c45a4a";
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-slate-400 w-20">{label}</span>
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-mono text-slate-300 w-8 text-right">{score}</span>
    </div>
  );
}

function KpiCard({ label, value, sub, icon: Icon, accent }: { label: string; value: string; sub?: string; icon: any; accent: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-slate-100">{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function DeadlineRow({ title, date, priority, matter }: { title: string; date: string; priority: string; matter: string }) {
  const d = new Date(date);
  const daysLeft = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const urgency = daysLeft <= 7 ? "#c45a4a" : daysLeft <= 30 ? "#d4a054" : "#4a90b8";
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: urgency }} />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-200 truncate">{title}</div>
        <div className="text-[10px] text-slate-500">{matter}</div>
      </div>
      <div className="text-[11px] font-mono text-slate-400">{daysLeft > 0 ? `${daysLeft}d` : "OVERDUE"}</div>
    </div>
  );
}

function DataSourceBadge({ isLive }: { isLive: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${
      isLive ? "bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20" : "bg-slate-500/10 text-slate-500 border border-white/[0.06]"
    }`}>
      {isLive ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
      {isLive ? "LIVE" : "DEMO"}
    </span>
  );
}

export default function PrismCounselDashboard() {
  const dashQ = usePrismDashboard();
  const mattersQ = usePrismMatters();

  const isLive = !!dashQ.data && !dashQ.isError;
  const liveMatters = mattersQ.data;
  const hasLiveMatters = Array.isArray(liveMatters) && liveMatters.length > 0;

  const matters = hasLiveMatters ? liveMatters : DEMO_MATTERS;

  const activeCount = isLive ? (dashQ.data!.matters?.active_matters ?? matters.length) : matters.length;
  const totalExposure = isLive
    ? `$${(Number(dashQ.data!.matters?.total_exposure || 0) / 1_000_000).toFixed(1)}M`
    : "$2.6M";
  const deadlineCount = isLive ? (dashQ.data!.deadlines?.total_pending ?? 0) : 0;
  const upcoming14d = isLive ? (dashQ.data!.deadlines?.upcoming_14d ?? 0) : 0;
  const pendingApprovals = isLive ? (dashQ.data!.approvals?.pending_approvals ?? 0) : 3;

  const allDeadlines = DEMO_MATTERS.flatMap(m =>
    (m.deadlines || []).map(d => ({ ...d, matterTitle: m.title }))
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const allRecs = DEMO_MATTERS.flatMap(m =>
    (m.recommendations || []).map(r => ({ ...r, matterTitle: m.title, matterId: m.id }))
  );

  const criticalRecs = allRecs.filter(r => r.priority === "critical" || r.priority === "high");

  const displayDeadlineCount = isLive ? deadlineCount : allDeadlines.length;
  const displayUpcoming = isLive ? upcoming14d : allDeadlines.filter(d => {
    const dl = Math.ceil((new Date(d.date).getTime() - Date.now()) / 86400000);
    return dl <= 14;
  }).length;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#d4a054]" />
            <h1 className="text-lg font-semibold text-slate-100">PRISM Counsel</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20">
              FUNCTIONAL ALPHA
            </span>
            <DataSourceBadge isLive={isLive} />
          </div>
          <p className="text-xs text-slate-500 mt-1">Matter observability and governed legal execution</p>
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
        </div>
      </div>

      <SectionErrorBoundary sectionName="KPI Summary">
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Active Matters" value={String(activeCount)} sub={hasLiveMatters ? `${liveMatters.filter(m => m.status === "discovery").length} in discovery` : "2 in discovery · 1 pre-trial"} icon={FolderOpen} accent="#d4a054" />
        <KpiCard label="Total Exposure" value={totalExposure} sub="Across all active matters" icon={DollarSign} accent="#c8953c" />
        <KpiCard label="Upcoming Deadlines" value={String(displayDeadlineCount)} sub={`${displayUpcoming} within 14 days`} icon={Clock} accent="#c45a4a" />
        <KpiCard label="Pending Approvals" value={String(pendingApprovals)} sub={isLive ? "from approval queue" : "1 demand send · 2 filings"} icon={ShieldCheck} accent="#4a90b8" />
      </div>
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName="Matter Intelligence">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-200">Matter Health</h2>
              <Link href="/matters">
                <span className="text-[10px] text-slate-500 hover:text-[#d4a054] cursor-pointer flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
            <div className="space-y-3">
              {(hasLiveMatters ? liveMatters.map(m => ({
                id: m.id,
                title: m.title,
                caseNumber: m.caseNumber,
                jurisdiction: m.jurisdiction ?? "",
                healthScore: m.healthScore ?? 0,
                status: m.status,
                readinessScores: {} as Record<string, number>,
              })) : DEMO_MATTERS).map(m => (
                <Link key={m.id} href={`/prism-counsel/matters/${m.id}`}>
                  <div className="rounded border border-white/[0.04] p-3 hover:border-white/[0.10] transition-colors cursor-pointer" style={{ background: "#080c14" }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold"
                          style={{
                            background: m.healthScore >= 70 ? "#4a90b820" : m.healthScore >= 50 ? "#d4a05420" : "#c45a4a20",
                            color: m.healthScore >= 70 ? "#4a90b8" : m.healthScore >= 50 ? "#d4a054" : "#c45a4a",
                          }}
                        >
                          {m.healthScore}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-200">{m.title}</div>
                          <div className="text-[10px] text-slate-500">{m.caseNumber} · {m.jurisdiction}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          m.status === "discovery" ? "bg-[#4a90b8]/10 text-[#4a90b8]" :
                          m.status === "pre_trial" ? "bg-[#d4a054]/10 text-[#d4a054]" :
                          "bg-slate-500/10 text-slate-400"
                        }`}>
                          {m.status.replace("_", " ").toUpperCase()}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                    </div>
                    {Object.keys(m.readinessScores).length > 0 && (
                      <div className="grid grid-cols-6 gap-2 mt-2">
                        {Object.entries(m.readinessScores).map(([k, v]) => (
                          <PillarBar key={k} label={PILLAR_LABELS[k] || k} score={v} />
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <h2 className="text-sm font-semibold text-slate-200 mb-3">AI Recommendations</h2>
            <div className="space-y-2">
              {criticalRecs.slice(0, 5).map((r, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0">
                  <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.priority === "critical" ? "bg-[#c45a4a]" : "bg-[#d4a054]"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-200">{r.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{r.description}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">{r.matterTitle}</div>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium uppercase ${
                    r.priority === "critical" ? "bg-[#c45a4a]/10 text-[#c45a4a]" : "bg-[#d4a054]/10 text-[#d4a054]"
                  }`}>{r.priority}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <h2 className="text-sm font-semibold text-slate-200 mb-3">Deadline Risk Queue</h2>
            <div className="space-y-0">
              {allDeadlines.slice(0, 8).map((d, i) => (
                <DeadlineRow key={i} title={d.title} date={d.date} priority={d.priority} matter={d.matterTitle} />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <h2 className="text-sm font-semibold text-slate-200 mb-3">Settlement Forecast</h2>
            <div className="space-y-3">
              {DEMO_MATTERS.map(m => (
                <div key={m.id} className="py-2 border-b border-white/[0.04] last:border-0">
                  <div className="text-[11px] text-slate-400 mb-1 truncate">{m.title.split(" v. ")[0]}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">${(m.settlementLow / 1000).toFixed(0)}K</span>
                    <div className="flex-1 h-2 bg-white/[0.06] rounded-full relative">
                      <div
                        className="absolute h-full rounded-full"
                        style={{
                          left: `${(m.settlementLow / m.settlementHigh) * 50}%`,
                          right: "0%",
                          background: "linear-gradient(90deg, #d4a054, #4a90b8)",
                          opacity: 0.6,
                        }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border border-slate-600"
                        style={{ left: `${((m.settlementMid - m.settlementLow) / (m.settlementHigh - m.settlementLow)) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-slate-500">${(m.settlementHigh / 1000).toFixed(0)}K</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <h2 className="text-sm font-semibold text-slate-200 mb-2">PRISM Pillars</h2>
            <p className="text-[10px] text-slate-500 mb-3">Six observability pillars across all matters</p>
            <div className="space-y-2">
              {Object.entries(PILLAR_LABELS).map(([key, label]) => {
                const avg = Math.round(
                  DEMO_MATTERS.reduce((sum, m) => sum + (m.readinessScores[key as keyof typeof m.readinessScores] || 0), 0) / DEMO_MATTERS.length
                );
                return <PillarBar key={key} label={label} score={avg} />;
              })}
            </div>
          </div>

          <FilingGateHealthWidget />
          <AutonomousLegalPanel />
        </div>
      </div>
      </SectionErrorBoundary>
    </div>
  );
}

function FolderOpen(props: any) {
  return <FileText {...props} />;
}

function FilingGateHealthWidget() {
  const { data, isLoading } = useFilingGateStats();
  const stats = data ?? {};
  const documentsVerified: number = stats.documentsVerified ?? 0;
  const citationsAnalyzed: number = stats.citationsAnalyzed ?? 0;
  const suspiciousCaught: number = stats.suspiciousCaught ?? 0;
  const blockedDocuments: number = stats.blockedDocuments ?? 0;
  const sealedAudits: number = stats.sealedAudits ?? 0;
  const catchRate: number = stats.catchRate ?? 0;
  const recentActivity: Array<{ auditId: string; documentTitle: string; overallStatus: string; suspiciousCount: number; createdAt: string; sealed: boolean }> = stats.recentActivity ?? [];

  function timeAgo(iso: string) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="rounded-lg border border-[#c8a96e]/15 p-4" style={{ background: "#0c1220" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[#c8a96e]" />
          <h2 className="text-sm font-semibold text-slate-200">Filing Gate Health</h2>
          <span className="text-[8px] px-1 py-0.5 rounded font-mono bg-[#c8a96e]/10 text-[#c8a96e]">{isLoading ? "LOADING" : "LIVE"}</span>
        </div>
        <Link href="/review-desk/filing-gate">
          <span className="text-[10px] text-slate-500 hover:text-[#c8a96e] cursor-pointer flex items-center gap-1 transition-colors">
            Open Gate <ChevronRight className="w-3 h-3" />
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded border border-white/[0.04] p-2 text-center" style={{ background: "#080c14" }}>
          <div className="text-lg font-bold text-[#4a90b8]">{documentsVerified}</div>
          <div className="text-[8px] text-slate-600 uppercase">Verified</div>
        </div>
        <div className="rounded border border-white/[0.04] p-2 text-center" style={{ background: "#080c14" }}>
          <div className="text-lg font-bold text-[#d4a054]">{citationsAnalyzed}</div>
          <div className="text-[8px] text-slate-600 uppercase">Citations</div>
        </div>
        <div className="rounded border border-white/[0.04] p-2 text-center" style={{ background: "#080c14" }}>
          <div className="text-lg font-bold text-[#c45a4a]">{suspiciousCaught}</div>
          <div className="text-[8px] text-slate-600 uppercase">Suspicious</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-slate-500">Citation Catch Rate (30d)</span>
        <span className="text-[9px] font-mono text-[#c8a96e]">{catchRate}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(catchRate, 100)}%`, background: "#c45a4a" }} />
      </div>

      <div className="space-y-1.5">
        <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Recent Activity</div>
        {recentActivity.length > 0 ? recentActivity.slice(0, 4).map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            {item.overallStatus === "clear" || item.sealed
              ? <CheckCircle className="w-2.5 h-2.5 text-[#4a90b8] flex-shrink-0" />
              : item.overallStatus === "blocked"
                ? <XCircle className="w-2.5 h-2.5 text-[#c45a4a] flex-shrink-0" />
                : <AlertTriangle className="w-2.5 h-2.5 text-[#d4a054] flex-shrink-0" />
            }
            <span className="text-[9px] text-slate-400 flex-1 truncate">{item.documentTitle}</span>
            <span className="text-[8px] text-slate-600 flex-shrink-0">{timeAgo(item.createdAt)}</span>
          </div>
        )) : (
          <div className="text-[9px] text-slate-600">No audits in the last 30 days. Run verification on a document to begin.</div>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between">
        <span className="text-[8.5px] text-slate-600">{blockedDocuments} docs flagged in 30d</span>
        <span className="text-[8.5px] text-[#4a90b8]">{sealedAudits} audit{sealedAudits !== 1 ? "s" : ""} sealed</span>
      </div>
    </div>
  );
}

type LitigationPredictionRow = {
  id: number;
  matter_id: string;
  case_type: string;
  jurisdiction: string;
  claim_amount: number;
  predicted_outcome: string;
  win_probability: number;
  settlement_recommendation: number;
  confidence: number;
  computed_at: string;
};

type ContractTriageRow = {
  id: number;
  triage_id: string;
  document_name: string;
  document_type: string;
  classification: string;
  risk_level: string;
  auto_routed: boolean;
  routing_decision: string;
  approval_status: string;
  ai_confidence: number;
};

type ZeroTouchTriageResult = {
  triageId: string;
  classification: string;
  riskLevel: string;
  routingDecision: string;
  autoRouted: boolean;
  confidence: number;
  triageCompleted: boolean;
};

function AutonomousLegalPanel() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ZeroTouchTriageResult | null>(null);

  const predictions = useQuery({
    queryKey: ["prism-litigation-predictions"],
    queryFn: async () => {
      const res = await fetch("/api/prism-counsel/litigation-predictions");
      if (!res.ok) throw new Error("fetch failed");
      return res.json() as Promise<LitigationPredictionRow[]>;
    },
    staleTime: 60000,
    retry: false,
  });

  const contracts = useQuery({
    queryKey: ["prism-contract-triage"],
    queryFn: async () => {
      const res = await fetch("/api/prism-counsel/contract-triage");
      if (!res.ok) throw new Error("fetch failed");
      return res.json() as Promise<{ items: ContractTriageRow[]; totalCount: number }>;
    },
    staleTime: 60000,
    retry: false,
  });

  async function runZeroTouchTriage() {
    setRunning(true);
    try {
      const res = await fetch("/api/prism-counsel/zero-touch-triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentName: `Document-${Math.floor(Math.random() * 9000 + 1000)}`, documentType: "contract" }),
      });
      if (!res.ok) throw new Error("failed");
      const body = await res.json() as ZeroTouchTriageResult;
      setResult(body);
    } catch {}
    setRunning(false);
  }

  const preds = predictions.data;
  const ctracts = contracts.data;

  return (
    <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: "rgba(212,160,84,0.2)", background: "rgba(212,160,84,0.03)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#d4a054]" />
          <span className="text-sm font-semibold text-slate-100">Autonomous Legal Intelligence · 2026</span>
          <span className="text-[8px] px-1.5 py-0.5 rounded font-mono uppercase bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20">AI-Native</span>
        </div>
        <button
          onClick={runZeroTouchTriage}
          disabled={running}
          className="text-[10px] px-2.5 py-1 rounded font-medium hover:opacity-80 disabled:opacity-40"
          style={{ background: "rgba(212,160,84,0.1)", color: "#d4a054", border: "1px solid rgba(212,160,84,0.25)" }}
        >
          {running ? "Running..." : "Zero-Touch Triage"}
        </button>
      </div>

      {result && (
        <div className="rounded p-2.5" style={{ background: "rgba(212,160,84,0.06)", border: "1px solid rgba(212,160,84,0.15)" }}>
          <div className="text-[10px] text-[#d4a054] font-mono">{result.triageId} · {result.classification} · {result.riskLevel} risk</div>
          <div className="text-[9px] mt-0.5 text-slate-500">{result.routingDecision?.replace(/_/g, " ")} · {result.autoRouted ? "auto-approved" : "manual review required"}</div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[9px] uppercase tracking-widest text-slate-600 mb-2">Litigation Predictions</div>
          {preds && preds.length > 0 ? (
            <div className="space-y-1.5">
              {preds.slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center gap-2">
                  <Target className="w-2.5 h-2.5 shrink-0 text-[#d4a054]/50" />
                  <span className="text-[10px] flex-1 truncate" style={{ color: "rgba(226,232,240,0.7)" }}>{p.matter_id}</span>
                  <span className="text-[8px] px-1 rounded" style={{ background: Number(p.win_probability) < 0.4 ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", color: Number(p.win_probability) < 0.4 ? "#ef4444" : "#10b981" }}>{Math.round(Number(p.win_probability) * 100)}% win</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[9px] text-slate-600">{predictions.isLoading ? "Loading..." : "No predictions yet"}</div>
          )}
        </div>

        <div>
          <div className="text-[9px] uppercase tracking-widest text-slate-600 mb-2">Contract Risk Triage</div>
          {ctracts ? (
            <div className="space-y-1.5">
              {(ctracts.items ?? []).slice(0, 3).map(c => (
                <div key={c.triage_id} className="flex items-center gap-2">
                  <Gavel className="w-2.5 h-2.5 shrink-0 text-[#d4a054]/50" />
                  <span className="text-[10px] flex-1 truncate" style={{ color: "rgba(226,232,240,0.7)" }}>{c.document_name}</span>
                  <span className="text-[8px] px-1 rounded" style={{ background: c.risk_level === "high" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", color: c.risk_level === "high" ? "#ef4444" : "#f59e0b" }}>{c.risk_level}</span>
                </div>
              ))}
              {(ctracts.items ?? []).length === 0 && (
                <div className="text-[9px] text-slate-600">Run triage to generate records</div>
              )}
            </div>
          ) : (
            <div className="text-[9px] text-slate-600">{contracts.isLoading ? "Loading..." : "No contracts"}</div>
          )}
        </div>
      </div>
    </div>
  );
}
