import { Bell, TrendingUp, TrendingDown, Clock, AlertTriangle, FileText, Zap, Eye, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

function useMorningBrief() {
  return useQuery({
    queryKey: ["morning-brief"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/prism-counsel/morning-brief`, { credentials: "include" });
      if (!res.ok) throw new Error("No brief available");
      const json = await res.json();
      return json.data as {
        attorney?: string;
        pressureShifts: Array<{ matter: string; shift: string; label: string; severity: string }>;
        deadlineClusters: Array<{ window: string; items: string[] }>;
        newRecords: Array<{ matter: string; record: string; type: string }>;
        frictionSources: Array<{ type: string; label: string; severity: string }>;
        recommendedFirstActions: Array<{ label: string; reason: string; minutes: number; href: string }>;
        quietRisks: Array<{ matter: string; risk: string; severity: string }>;
      };
    },
    staleTime: 300_000,
    retry: false,
  });
}

export default function MorningBriefPage() {
  const { data, isLoading, isError } = useMorningBrief();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const pressureShifts = data?.pressureShifts ?? [];
  const deadlineClusters = data?.deadlineClusters ?? [];
  const newRecords = data?.newRecords ?? [];
  const frictionSources = data?.frictionSources ?? [];
  const recommendedFirstActions = data?.recommendedFirstActions ?? [];
  const quietRisks = data?.quietRisks ?? [];

  const urgentCount = pressureShifts.filter(p => p.severity === "critical" || p.severity === "high").length;
  const nextDeadlineCount = deadlineClusters[0]?.items.length ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-lg border border-[#d4a054]/20 p-5" style={{ background: "linear-gradient(135deg, #0c1220, #0f1a2a)" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#d4a054]" />
            <span className="text-xs font-semibold text-[#d4a054] uppercase tracking-wider">Morning Brief</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">{today}</span>
        </div>
        <h1 className="text-xl font-semibold text-slate-100 mb-1">Good morning.</h1>
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading your brief…</p>
        ) : isError || !data ? (
          <p className="text-sm text-slate-500">No brief available yet. Connect your matter data to generate a morning brief.</p>
        ) : (
          <p className="text-sm text-slate-400">
            {urgentCount} matters need your attention today.
            {" "}{nextDeadlineCount > 0 ? `${nextDeadlineCount} deadlines in the next 3 days.` : ""}
            {" "}{quietRisks.length > 0 ? `${quietRisks.length} matters appear quiet but carry risk.` : ""}
          </p>
        )}
      </div>

      {!isLoading && !isError && data && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <BriefSection title="Pressure Shifts" icon={<TrendingUp className="w-3.5 h-3.5 text-[#c45a4a]" />}>
              {pressureShifts.length === 0 ? <EmptyRow message="No pressure shifts" /> : pressureShifts.map((p, i) => (
                <div key={i} className="flex items-start gap-2 py-2 border-b border-white/[0.04] last:border-0">
                  <div className="mt-0.5 flex-shrink-0">
                    {p.shift === "rising" ? <TrendingUp className={`w-3 h-3 ${p.severity === "critical" ? "text-[#c45a4a]" : "text-[#d4a054]"}`} /> : <TrendingDown className="w-3 h-3 text-[#4a90b8]" />}
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-200">{p.matter.split(" v. ")[0]}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{p.label}</div>
                  </div>
                </div>
              ))}
            </BriefSection>

            <BriefSection title="Deadline Clusters" icon={<Clock className="w-3.5 h-3.5 text-[#c45a4a]" />}>
              {deadlineClusters.length === 0 ? <EmptyRow message="No upcoming deadlines" /> : deadlineClusters.map((cluster, i) => (
                <div key={i} className="py-2 border-b border-white/[0.04] last:border-0">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{cluster.window}</div>
                  {cluster.items.map((item, j) => (
                    <div key={j} className="flex items-center gap-1.5 py-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === 0 ? "bg-[#c45a4a]" : "bg-[#d4a054]"}`} />
                      <span className="text-[11px] text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </BriefSection>

            <BriefSection title="New Records Arrived" icon={<FileText className="w-3.5 h-3.5 text-[#4a90b8]" />}>
              {newRecords.length === 0 ? <EmptyRow message="No new records" /> : newRecords.map((r, i) => (
                <div key={i} className="flex items-start gap-2 py-2 border-b border-white/[0.04] last:border-0">
                  <FileText className="w-3 h-3 text-slate-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[11px] font-medium text-slate-200">{r.matter.split(" v. ")[0]}</div>
                    <div className="text-[10px] text-slate-400">{r.record}</div>
                    <div className="text-[9px] text-slate-600 capitalize mt-0.5">{r.type.replace(/_/g, " ")}</div>
                  </div>
                </div>
              ))}
            </BriefSection>

            <BriefSection title="Friction Sources" icon={<AlertTriangle className="w-3.5 h-3.5 text-[#d4a054]" />}>
              {frictionSources.length === 0 ? <EmptyRow message="No friction sources" /> : frictionSources.map((f, i) => (
                <div key={i} className="flex items-start gap-2 py-2 border-b border-white/[0.04] last:border-0">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${f.severity === "high" ? "bg-[#c45a4a]" : "bg-[#d4a054]"}`} />
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{f.type.replace(/_/g, " ")}</div>
                    <div className="text-[11px] text-slate-300">{f.label}</div>
                  </div>
                </div>
              ))}
            </BriefSection>
          </div>

          {quietRisks.length > 0 && (
            <BriefSection title="Quiet but Dangerous" icon={<Eye className="w-3.5 h-3.5 text-[#c45a4a]" />}>
              <div className="grid grid-cols-2 gap-3">
                {quietRisks.map((q, i) => (
                  <div key={i} className="rounded border border-[#c45a4a]/20 p-3" style={{ background: "#1a0c0c" }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${q.severity === "critical" ? "bg-[#c45a4a] animate-pulse" : "bg-[#d4a054]"}`} />
                      <span className="text-[11px] font-medium text-slate-200">{q.matter.split(" v. ")[0]}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{q.risk}</p>
                  </div>
                ))}
              </div>
            </BriefSection>
          )}

          {recommendedFirstActions.length > 0 && (
            <div className="rounded-lg border border-[#d4a054]/20 p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-3.5 h-3.5 text-[#d4a054]" />
                <span className="text-xs font-semibold text-[#d4a054] uppercase tracking-wider">Recommended First Actions</span>
              </div>
              <div className="space-y-2">
                {recommendedFirstActions.map((a, i) => (
                  <Link key={i} href={a.href}>
                    <div className="flex items-center gap-3 p-3 rounded border border-white/[0.04] hover:border-white/[0.10] cursor-pointer transition-colors" style={{ background: "#080c14" }}>
                      <div className="w-5 h-5 rounded-full border border-[#d4a054]/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-semibold text-[#d4a054]">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-200">{a.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{a.reason}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-slate-500 font-mono">{a.minutes}m</span>
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BriefSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return <div className="py-4 text-center text-[10px] text-slate-600">{message}</div>;
}
