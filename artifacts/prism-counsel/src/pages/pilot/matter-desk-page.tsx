import { useMatterDesk, usePilotForecasts, useNextActions } from "../../hooks/use-prism-pilot";
import { useParams, Link } from "wouter";
import { ArrowLeft, Activity, Mail, FileText, Clock, AlertTriangle, TrendingUp, Shield, ChevronRight, CheckCircle } from "lucide-react";

const DEMO_DESK = {
  matter: { id: 1, title: "Rodriguez v. National General", caseNumber: "2024-CV-1847", status: "active", jurisdiction: "Queens County, NY", healthScore: 72 },
  lastChanges: [
    { type: "new_communication", title: "Reserve increase notification received", summary: "National General raised reserves from $15K to $28K — signals softening defense posture", severity: "info", createdAt: new Date(Date.now() - 3600000).toISOString() },
    { type: "new_file", title: "IME report uploaded", summary: "Dr. Whitmore orthopedic evaluation — consistent with treating physician findings", severity: "info", createdAt: new Date(Date.now() - 7200000).toISOString() },
    { type: "pressure_change", title: "Insurer pressure increased", summary: "Insurer pressure rose from 0.52 to 0.58 (+6%) — carrier response lag exceeds 21 days", severity: "warning", createdAt: new Date(Date.now() - 10800000).toISOString() },
    { type: "forecast_shift", title: "Settlement probability improved", summary: "Settlement probability increased from 62% to 68% following reserve increase", severity: "info", createdAt: new Date(Date.now() - 14400000).toISOString() },
  ],
  commsSummary: { recent: 3, latest: "Reserve increase notification from adjuster Lisa Park — indicates carrier is reassessing exposure" },
  newFiles: [
    { title: "IME Report — Dr. Whitmore", sourceType: "email_attachment", createdAt: new Date(Date.now() - 7200000).toISOString() },
    { title: "Updated medical records — Queens Medical", sourceType: "matter_files", createdAt: new Date(Date.now() - 86400000).toISOString() },
  ],
  deadlineWatch: [
    { title: "Respond to Interrogatories", dueDate: new Date(Date.now() + 2 * 86400000).toISOString(), priority: "critical", daysRemaining: 2 },
    { title: "Expert Disclosure Deadline", dueDate: new Date(Date.now() + 14 * 86400000).toISOString(), priority: "high", daysRemaining: 14 },
    { title: "Mediation Scheduled", dueDate: new Date(Date.now() + 22 * 86400000).toISOString(), priority: "medium", daysRemaining: 22 },
  ],
  missingSupport: [
    { reviewTitle: "Demand draft — damages section", count: 2 },
    { reviewTitle: "Chronology — post-accident treatment", count: 1 },
  ],
  forecastSummary: [
    { type: "settlement_probability", confidence: 0.68, explanation: "Settlement likelihood improved following reserve increase and consistent IME findings" },
    { type: "deadline_breach_risk", confidence: 0.35, explanation: "Interrogatory deadline approaching in 2 days — response is 80% drafted" },
    { type: "demand_readiness", confidence: 0.74, explanation: "Demand package at 74% readiness — missing wage verification and one provider record" },
  ],
  nextBestAction: { title: "Complete interrogatory responses", description: "Response is 80% drafted. Finalize and submit for review before 2-day deadline.", impactScore: 0.95 },
  signoffStatus: "pending",
  pendingSignoffs: 1,
  quietRisks: [],
};

const DEMO_FORECASTS = [
  { forecastType: "deadline_breach_risk", confidence: 0.35, explanation: "Interrogatory deadline in 2 days — response is 80% drafted", valueMid: null, createdAt: new Date().toISOString() },
  { forecastType: "demand_readiness", confidence: 0.74, explanation: "Missing wage verification and one provider record", valueMid: null, createdAt: new Date().toISOString() },
  { forecastType: "communication_silence_risk", confidence: 0.15, explanation: "Active carrier communication — no silence risk", valueMid: null, createdAt: new Date().toISOString() },
  { forecastType: "chronology_integrity_risk", confidence: 0.28, explanation: "One gap in post-accident treatment timeline", valueMid: null, createdAt: new Date().toISOString() },
  { forecastType: "ai_defensibility_score", confidence: 0.82, explanation: "All AI outputs source-grounded with proof chain references", valueMid: null, createdAt: new Date().toISOString() },
];

export default function MatterDeskPage() {
  const params = useParams<{ id: string }>();
  const matterId = params.id ? parseInt(params.id) : null;
  const { data, isLoading } = useMatterDesk(matterId);
  const { data: forecastData } = usePilotForecasts(matterId);

  const desk = data ?? DEMO_DESK;
  const forecasts = forecastData?.forecasts ?? DEMO_FORECASTS;
  const isDemo = !data;
  const m = desk.matter;

  const healthColor = (m.healthScore ?? 0) >= 70 ? "text-emerald-400" : (m.healthScore ?? 0) >= 50 ? "text-amber-400" : "text-red-400";

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-4">
        <Link href="/today">
          <button className="p-1.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-white">{m.title}</h1>
            <span className="text-xs font-mono text-slate-500">{m.caseNumber}</span>
            {isDemo && <span className="px-2 py-0.5 text-xs font-mono bg-amber-900/30 text-amber-400 rounded">DEMO</span>}
          </div>
          <p className="text-sm text-slate-400">{m.jurisdiction} · {m.status}</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 uppercase">Health</span>
          <div className={`text-2xl font-semibold ${healthColor}`}>{m.healthScore ?? "—"}%</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">
          <Section title="What Changed" icon={<Activity className="w-4 h-4 text-[#4a90b8]" />}>
            {desk.lastChanges?.map((c: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded bg-slate-900/50">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${c.severity === "warning" ? "bg-amber-400" : "bg-blue-400"}`} />
                <div className="min-w-0">
                  <span className="text-sm text-white">{c.title}</span>
                  <p className="text-xs text-slate-400 mt-0.5">{c.summary}</p>
                  <span className="text-[10px] text-slate-600">{timeAgo(c.createdAt)}</span>
                </div>
              </div>
            ))}
          </Section>

          <Section title="Communications" icon={<Mail className="w-4 h-4 text-[#8b7ac8]" />}>
            <div className="p-3 rounded bg-slate-900/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-white">{desk.commsSummary?.recent ?? 0} recent communications</span>
              </div>
              {desk.commsSummary?.latest && <p className="text-xs text-slate-400">{desk.commsSummary.latest}</p>}
            </div>
          </Section>

          <Section title="New Files" icon={<FileText className="w-4 h-4 text-[#c8953c]" />}>
            {(desk.newFiles ?? []).map((f: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-sm text-white">{f.title}</span>
                </div>
                <span className="text-[10px] text-slate-500">{f.sourceType?.replace(/_/g, " ")}</span>
              </div>
            ))}
          </Section>

          <Section title="Forecasts" icon={<TrendingUp className="w-4 h-4 text-[#d4a054]" />}>
            {forecasts.map((f: any, i: number) => (
              <div key={i} className="p-3 rounded bg-slate-900/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white capitalize">{f.forecastType?.replace(/_/g, " ")}</span>
                  <span className={`text-sm font-mono font-semibold ${f.confidence >= 0.7 ? "text-emerald-400" : f.confidence >= 0.4 ? "text-amber-400" : "text-red-400"}`}>
                    {Math.round(f.confidence * 100)}%
                  </span>
                </div>
                <p className="text-xs text-slate-400">{f.explanation}</p>
              </div>
            ))}
          </Section>
        </div>

        <div className="space-y-5">
          {desk.nextBestAction && (
            <div className="bg-[#d4a054]/10 border border-[#d4a054]/30 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-[#d4a054] uppercase tracking-wider mb-2">Next Best Action</h3>
              <span className="text-sm font-medium text-white">{desk.nextBestAction.title}</span>
              <p className="text-xs text-slate-400 mt-1">{desk.nextBestAction.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-1 flex-1 bg-slate-700 rounded-full">
                  <div className="h-1 bg-[#d4a054] rounded-full" style={{ width: `${(desk.nextBestAction.impactScore ?? 0.5) * 100}%` }} />
                </div>
                <span className="text-[10px] text-slate-500">impact {Math.round((desk.nextBestAction.impactScore ?? 0.5) * 100)}%</span>
              </div>
            </div>
          )}

          <Section title="Deadline Watchlist" icon={<Clock className="w-4 h-4 text-[#c45a4a]" />}>
            {(desk.deadlineWatch ?? []).map((d: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${d.priority === "critical" ? "bg-red-400" : d.priority === "high" ? "bg-amber-400" : "bg-blue-400"}`} />
                  <span className="text-xs text-white">{d.title}</span>
                </div>
                <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${d.daysRemaining <= 3 ? "bg-red-900/30 text-red-400" : d.daysRemaining <= 7 ? "bg-amber-900/30 text-amber-400" : "bg-slate-700/50 text-slate-400"}`}>
                  {d.daysRemaining}d
                </span>
              </div>
            ))}
          </Section>

          <Section title="Missing Support" icon={<AlertTriangle className="w-4 h-4 text-[#c45a4a]" />}>
            {(desk.missingSupport ?? []).length === 0 ? (
              <p className="text-xs text-slate-500 italic flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-400" /> All support complete</p>
            ) : (
              (desk.missingSupport ?? []).map((s: any, i: number) => (
                <div key={i} className="p-2 rounded bg-slate-900/50 flex items-center justify-between">
                  <span className="text-xs text-white">{s.reviewTitle}</span>
                  <span className="text-[10px] text-red-400">{s.count} unsupported</span>
                </div>
              ))
            )}
          </Section>

          <Section title="Sign-Off" icon={<Shield className="w-4 h-4 text-[#8b7ac8]" />}>
            <div className="p-3 rounded bg-slate-900/50">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${desk.signoffStatus === "pending" ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                <span className="text-sm text-white capitalize">{desk.signoffStatus}</span>
              </div>
              {desk.pendingSignoffs > 0 && (
                <Link href="/signoff-queue">
                  <p className="text-xs text-[#d4a054] mt-1 cursor-pointer hover:underline">{desk.pendingSignoffs} pending sign-off(s) →</p>
                </Link>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-3">{icon} {title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
