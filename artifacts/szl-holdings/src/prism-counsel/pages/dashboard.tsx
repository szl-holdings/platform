import { Scale, AlertTriangle, Clock, TrendingUp, DollarSign, ShieldCheck, FileText, ArrowRight, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { DEMO_MATTERS, PILLAR_LABELS } from "../data/demo-matters";

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

export default function PrismCounselDashboard() {
  const allDeadlines = DEMO_MATTERS.flatMap(m =>
    (m.deadlines || []).map(d => ({ ...d, matterTitle: m.title }))
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const allRecs = DEMO_MATTERS.flatMap(m =>
    (m.recommendations || []).map(r => ({ ...r, matterTitle: m.title, matterId: m.id }))
  );

  const criticalRecs = allRecs.filter(r => r.priority === "critical" || r.priority === "high");

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
          </div>
          <p className="text-xs text-slate-500 mt-1">Matter observability and governed legal execution</p>
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Active Matters" value={String(DEMO_MATTERS.length)} sub="2 in discovery · 1 pre-trial" icon={FolderOpen} accent="#d4a054" />
        <KpiCard label="Total Exposure" value="$2.6M" sub="Across all active matters" icon={DollarSign} accent="#c8953c" />
        <KpiCard label="Upcoming Deadlines" value={String(allDeadlines.length)} sub={`${allDeadlines.filter(d => { const dl = Math.ceil((new Date(d.date).getTime() - Date.now()) / 86400000); return dl <= 14; }).length} within 14 days`} icon={Clock} accent="#c45a4a" />
        <KpiCard label="Pending Approvals" value="3" sub="1 demand send · 2 filings" icon={ShieldCheck} accent="#4a90b8" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-200">Matter Health</h2>
              <Link href="/prism-counsel/matters">
                <span className="text-[10px] text-slate-500 hover:text-[#d4a054] cursor-pointer flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
            <div className="space-y-3">
              {DEMO_MATTERS.map(m => (
                <Link key={m.id} href={`/prism-counsel/matters/${m.id}`}>
                  <div className="rounded border border-white/[0.04] p-3 hover:border-white/[0.10] transition-colors cursor-pointer" style={{ background: "#080c14" }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold"
                          style={{
                            background: m.healthScore >= 70 ? "#4a90b8" + "20" : m.healthScore >= 50 ? "#d4a054" + "20" : "#c45a4a" + "20",
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
                    <div className="grid grid-cols-6 gap-2 mt-2">
                      {Object.entries(m.readinessScores).map(([k, v]) => (
                        <PillarBar key={k} label={PILLAR_LABELS[k] || k} score={v} />
                      ))}
                    </div>
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
        </div>
      </div>
    </div>
  );
}

function FolderOpen(props: any) {
  return <FileText {...props} />;
}
