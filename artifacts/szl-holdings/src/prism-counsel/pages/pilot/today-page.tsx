import { useState } from "react";
import { useToday, useQuietRisks, useNextActions, useCompleteAction } from "../../hooks/use-prism-pilot";
import { Link } from "wouter";
import { Sun, AlertTriangle, Clock, CheckCircle, ChevronRight, FileText, Mail, Activity, Shield, Timer, Eye, Zap } from "lucide-react";

const DEMO_TODAY = {
  asOf: new Date().toISOString(),
  changedSinceYesterday: 14,
  mattersNeedingAttention: [
    { matterId: 1, title: "Rodriguez v. National General", caseNumber: "2024-CV-1847", changeCount: 5, changeTypes: ["new_communication", "new_file", "pressure_change"], latestChange: "Reserve increase notification received from carrier — $15K to $28K" },
    { matterId: 2, title: "Chen v. Allstate", caseNumber: "2024-CV-2103", changeCount: 3, changeTypes: ["deadline_updated", "new_file"], latestChange: "IME report uploaded — Dr. Whitmore, orthopedic evaluation" },
    { matterId: 3, title: "Vasquez v. GEICO", caseNumber: "2024-CV-1592", changeCount: 6, changeTypes: ["new_communication", "forecast_shift", "missing_evidence"], latestChange: "Discovery deadline extended to May 15 — new cutoff in 42 days" },
  ],
  deadlines: {
    next3Days: [
      { title: "Respond to Interrogatories — Rodriguez", matterId: 1, daysRemaining: 2, priority: "critical" },
      { title: "File Motion to Compel — Vasquez", matterId: 3, daysRemaining: 3, priority: "high" },
    ],
    next5Days: [
      { title: "Respond to Interrogatories — Rodriguez", matterId: 1, daysRemaining: 2, priority: "critical" },
      { title: "File Motion to Compel — Vasquez", matterId: 3, daysRemaining: 3, priority: "high" },
      { title: "IME Scheduling Response — Chen", matterId: 2, daysRemaining: 5, priority: "medium" },
    ],
    next10Days: [],
  },
  waitingOnYou: { signoffs: 2, reviews: 3 },
  waitingOnOthers: 2,
  quietRisks: [
    { matterId: 4, riskType: "no_carrier_response", title: "Park v. Liberty Mutual: No communication in 18 days", explanation: "Carrier has not responded to demand letter or follow-ups. This silence may indicate stalling.", severity: "high", daysSilent: 18 },
    { matterId: 5, riskType: "deadline_approaching", title: "Kim v. Progressive: SOL approaching in 45 days", explanation: "Statute of limitations deadline approaching. Filing must occur by May 18.", severity: "critical", deadlineDaysRemaining: 45 },
  ],
  nextBest30Minutes: [
    { matterId: 1, title: "Review reserve increase notification", description: "National General raised reserves from $15K to $28K. Review carrier correspondence and update demand strategy.", impactScore: 0.92, estimatedMinutes: 10, actionType: "review_draft" },
    { matterId: 3, title: "Clear missing medical records", description: "Outstanding records from 2 providers. Send follow-up requests to Dr. Martinez and Queens Medical.", impactScore: 0.87, estimatedMinutes: 15, actionType: "request_record" },
    { matterId: 2, title: "Review IME report", description: "Orthopedic IME report from Dr. Whitmore received. Review findings and flag any contradictions with treating physician.", impactScore: 0.84, estimatedMinutes: 20, actionType: "review_draft" },
    { matterId: 1, title: "Approve chronology export", description: "Reviewed chronology for Rodriguez matter is pending final sign-off. Ready for partner distribution.", impactScore: 0.78, estimatedMinutes: 5, actionType: "approve_memo" },
  ],
  quickMoves: [
    { matterId: 1, title: "Approve chronology export", estimatedMinutes: 5 },
    { matterId: 3, title: "Escalate carrier silence", estimatedMinutes: 5 },
  ],
};

export default function TodayPage() {
  const { data, isLoading } = useToday();
  const { data: risksData } = useQuietRisks();
  const completeAction = useCompleteAction();
  const [deadlineRange, setDeadlineRange] = useState<"3" | "5" | "10">("5");

  const today = data ?? DEMO_TODAY;
  const isDemo = !data;
  const risks = risksData?.risks ?? DEMO_TODAY.quietRisks;

  const deadlineKey = `next${deadlineRange}Days` as keyof typeof today.deadlines;
  const deadlines = today.deadlines?.[deadlineKey] ?? [];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sun className="w-6 h-6 text-[#d4a054]" />
          <div>
            <h1 className="text-2xl font-semibold text-white">Today</h1>
            <p className="text-sm text-slate-400">What matters right now — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
        </div>
        {isDemo && <span className="px-2 py-0.5 text-xs font-mono bg-amber-900/30 text-amber-400 rounded">DEMO</span>}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={<Activity className="w-4 h-4" />} label="Changed Overnight" value={today.changedSinceYesterday} color="blue" />
        <StatCard icon={<Clock className="w-4 h-4" />} label="Deadlines (5 days)" value={today.deadlines?.next5Days?.length ?? 0} color={today.deadlines?.next3Days?.length > 0 ? "red" : "amber"} />
        <StatCard icon={<FileText className="w-4 h-4" />} label="Waiting on You" value={(today.waitingOnYou?.signoffs ?? 0) + (today.waitingOnYou?.reviews ?? 0)} sub={`${today.waitingOnYou?.signoffs ?? 0} sign-offs · ${today.waitingOnYou?.reviews ?? 0} reviews`} color="amber" />
        <StatCard icon={<AlertTriangle className="w-4 h-4" />} label="Quiet but Dangerous" value={risks.length} color="red" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <section className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Matters Needing Attention</h2>
              <span className="text-xs text-slate-500">{today.mattersNeedingAttention?.length ?? 0} matters</span>
            </div>
            <div className="space-y-3">
              {(today.mattersNeedingAttention ?? []).map((m: any, i: number) => (
                <Link key={i} href={`/prism-counsel/matter-desk/${m.matterId}`}>
                  <div className="group p-3 rounded-lg bg-slate-900/50 border border-slate-700/30 hover:border-[#d4a054]/30 cursor-pointer transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{m.title}</span>
                          <span className="text-xs text-slate-500 font-mono">{m.caseNumber}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 truncate">{m.latestChange}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {m.changeTypes?.map((t: string, j: number) => (
                            <span key={j} className="px-1.5 py-0.5 text-[10px] rounded bg-slate-700/50 text-slate-400">
                              {t.replace(/_/g, " ")}
                            </span>
                          ))}
                          <span className="text-[10px] text-slate-500">{m.changeCount} changes</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-[#d4a054] transition-colors flex-shrink-0 mt-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#c45a4a]" /> Deadline Watchlist
              </h2>
              <div className="flex gap-1">
                {(["3", "5", "10"] as const).map(r => (
                  <button key={r} onClick={() => setDeadlineRange(r)}
                    className={`px-2 py-0.5 text-xs rounded ${deadlineRange === r ? "bg-[#c45a4a]/20 text-[#c45a4a]" : "text-slate-500 hover:text-slate-300"}`}>
                    {r}d
                  </button>
                ))}
              </div>
            </div>
            {deadlines.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No deadlines in the next {deadlineRange} days</p>
            ) : (
              <div className="space-y-2">
                {deadlines.map((d: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-900/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${d.priority === "critical" ? "bg-red-400" : d.priority === "high" ? "bg-amber-400" : "bg-blue-400"}`} />
                      <div>
                        <span className="text-sm text-white">{d.title}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${d.daysRemaining <= 2 ? "bg-red-900/30 text-red-400" : d.daysRemaining <= 5 ? "bg-amber-900/30 text-amber-400" : "bg-slate-700/50 text-slate-400"}`}>
                      {d.daysRemaining}d
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-[#d4a054]" /> Best Next 30 Minutes
            </h2>
            <div className="space-y-3">
              {(today.nextBest30Minutes ?? []).map((a: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-medium text-white">{a.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono ml-2 flex-shrink-0">{a.estimatedMinutes}m</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{a.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="h-1 flex-1 bg-slate-700 rounded-full mr-3">
                      <div className="h-1 bg-[#d4a054] rounded-full" style={{ width: `${(a.impactScore ?? 0.5) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500">impact {Math.round((a.impactScore ?? 0.5) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-800/50 border border-[#c45a4a]/20 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-[#c45a4a] uppercase tracking-wider flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4" /> Quiet but Dangerous
            </h2>
            <div className="space-y-3">
              {risks.map((r: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${r.severity === "critical" ? "bg-red-400 animate-pulse" : "bg-amber-400"}`} />
                    <span className="text-xs font-medium text-white">{r.title}</span>
                  </div>
                  <p className="text-xs text-slate-400">{r.explanation}</p>
                  {r.daysSilent && <p className="text-[10px] text-slate-500 mt-1">{r.daysSilent} days silent</p>}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: number; sub?: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "text-[#4a90b8]",
    amber: "text-[#d4a054]",
    red: "text-[#c45a4a]",
    green: "text-emerald-400",
  };
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={colorMap[color] ?? "text-slate-400"}>{icon}</span>
        <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl font-semibold ${colorMap[color] ?? "text-white"}`}>{value}</div>
      {sub && <p className="text-[10px] text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}
