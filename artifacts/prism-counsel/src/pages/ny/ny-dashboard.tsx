import { AlertTriangle, Clock, TrendingUp, DollarSign, Activity, Building2, ShieldOff, Shield, FileText, MapPin, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { NY_DEMO_MATTERS } from "../../data/ny-data";

function useNyDashboardSummary() {
  return useQuery({
    queryKey: ["ny-dashboard-summary"],
    queryFn: async () => {
      const res = await fetch("/api/prism-counsel/ny/dashboard");
      if (!res.ok) throw new Error("Failed to load NY dashboard summary");
      const json = await res.json();
      return json.data as { activeMatters: number; criticalClocks: number; breachedClocks: number; pendingAppeals: number };
    },
    staleTime: 60_000,
  });
}

function Widget({ title, children, href }: { title: string; children: React.ReactNode; href?: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-300">{title}</h3>
        {href && (
          <Link href={href}>
            <span className="text-[10px] text-slate-500 hover:text-[#d4a054] cursor-pointer flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </span>
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

export default function NyDashboard() {
  const { data: summary, isLoading: summaryLoading } = useNyDashboardSummary();

  const allClocks = NY_DEMO_MATTERS.flatMap(m => m.clocks.map(c => ({ ...c, matterTitle: m.title, matterId: m.id })));
  const breachedClocks = allClocks.filter(c => c.status === "breached");
  const urgentClocks = allClocks.filter(c => c.status === "running" && c.daysRemaining < 30);

  const allComms = NY_DEMO_MATTERS.flatMap(m =>
    m.communicationWindows.map(c => ({ ...c, matterTitle: m.title }))
  ).sort((a, b) => b.daysSilent - a.daysSilent);

  const criticalSilence = allComms.filter(c => c.silenceRisk === "critical" || c.silenceRisk === "high");

  const allMediations = NY_DEMO_MATTERS.flatMap(m =>
    m.mediationEvents.map(e => ({ ...e, matterTitle: m.title, matterId: m.id }))
  );

  const allOfferMovements = NY_DEMO_MATTERS.flatMap(m =>
    m.offerMovements.map(o => ({ ...o, matterTitle: m.title }))
  ).sort((a, b) => new Date(b.offeredAt).getTime() - new Date(a.offeredAt).getTime());

  const allDemandPackets = NY_DEMO_MATTERS.filter(m => m.demandPacket).map(m => ({
    ...m.demandPacket!,
    matterTitle: m.title,
    matterId: m.id,
  }));

  const allForecasts = NY_DEMO_MATTERS.flatMap(m =>
    m.forecasts.map(f => ({ ...f, matterTitle: m.title, matterId: m.id }))
  );

  const deadlineBreachForecasts = allForecasts.filter(f => f.type === "deadline_breach_risk").sort((a, b) => b.score - a.score);

  const aiDefensibility = allForecasts.filter(f => f.type === "ai_defensibility_score");
  const avgDefensibility = Math.round(aiDefensibility.reduce((s, f) => s + f.score, 0) / (aiDefensibility.length || 1));

  const disclaimerMatters = NY_DEMO_MATTERS.filter(m => m.disclaimers.length > 0);

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">NY Insurance Command Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">New York signal intelligence · {NY_DEMO_MATTERS.length} active matters · {allClocks.length} clocks tracked</p>
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Deadline Breach Risk", value: `${deadlineBreachForecasts[0]?.score ?? 0}`, sub: "Highest risk matter", color: "#c45a4a", icon: AlertTriangle },
          { label: "Critical Silence", value: String(criticalSilence.length), sub: "Insurer / counsel silent", color: "#c45a4a", icon: Clock },
          { label: "Breached Clocks", value: summaryLoading ? "—" : String(summary?.breachedClocks ?? breachedClocks.length), sub: "NY statutory clocks (live)", color: (summary?.breachedClocks ?? breachedClocks.length) > 0 ? "#c45a4a" : "#4a90b8", icon: ShieldOff },
          { label: "Active Matters", value: summaryLoading ? "—" : String(summary?.activeMatters ?? NY_DEMO_MATTERS.length), sub: "DB-backed (live)", color: "#4a90b8", icon: Shield },
          { label: "Upcoming Mediation", value: String(allMediations.filter(e => e.status === "scheduled" || e.status === "pending").length), sub: "Sessions scheduled", color: "#d4a054", icon: Activity },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{kpi.label}</span>
              </div>
              <div className="text-2xl font-semibold" style={{ color: kpi.color }}>{kpi.value}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Widget title="Deadline Breach Watchlist" href="/ny/watchlist">
          <div className="space-y-2">
            {deadlineBreachForecasts.map((f, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-white/[0.04] last:border-0">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: f.score >= 65 ? "#c45a4a20" : "#d4a05420", color: f.score >= 65 ? "#c45a4a" : "#d4a054" }}
                >
                  {f.score}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-slate-300 truncate">{f.matterTitle.split(" (")[0]}</div>
                  <div className="text-[10px] text-slate-500">{f.nextBestAction.slice(0, 60)}…</div>
                </div>
              </div>
            ))}
          </div>
        </Widget>

        <Widget title="Demand Readiness Leaderboard" href="/ny/no-fault">
          <div className="space-y-2">
            {allDemandPackets.sort((a, b) => b.readinessScore - a.readinessScore).map((dp, i) => (
              <div key={i} className="py-1.5 border-b border-white/[0.04] last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-slate-300 truncate mr-2">{dp.matterTitle.split(" (")[0]}</span>
                  <span className="text-[11px] font-mono" style={{ color: dp.readinessScore >= 70 ? "#4a90b8" : dp.readinessScore >= 50 ? "#d4a054" : "#c45a4a" }}>
                    {dp.readinessScore}%
                  </span>
                </div>
                <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${dp.readinessScore}%`,
                      background: dp.readinessScore >= 70 ? "#4a90b8" : dp.readinessScore >= 50 ? "#d4a054" : "#c45a4a",
                    }}
                  />
                </div>
                {dp.missingItems.length > 0 && (
                  <div className="text-[9px] text-slate-600 mt-0.5">{dp.missingItems.length} items missing</div>
                )}
              </div>
            ))}
          </div>
        </Widget>

        <Widget title="Mediation Windows" href="/ny/mediation">
          <div className="space-y-2">
            {allMediations.map((e, i) => (
              <div key={i} className="py-1.5 border-b border-white/[0.04] last:border-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] text-slate-300 truncate mr-2">{e.matterTitle.split(" (")[0]}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${e.status === "scheduled" ? "bg-[#4a90b8]/10 text-[#4a90b8]" : "bg-slate-500/10 text-slate-400"}`}>
                    {e.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">{e.scheduledAt ? new Date(e.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD"}</span>
                  <span style={{ color: e.conversionProbability >= 0.6 ? "#4a90b8" : "#d4a054" }}>
                    {Math.round(e.conversionProbability * 100)}% convert
                  </span>
                </div>
                <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${e.preReadinessScore}%`, background: e.preReadinessScore >= 70 ? "#4a90b8" : "#d4a054" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Widget>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Widget title="Reserve / Offer Tracker" href="/ny/forecast">
          <div className="space-y-2">
            {allOfferMovements.slice(0, 5).map((o, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{
                  background: o.movementSignal === "approaching" ? "#4a90b8" : o.movementSignal === "stalling" ? "#d4a054" : "#c45a4a"
                }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-slate-300 truncate">{o.offeringParty}</div>
                  <div className="text-[10px] text-slate-500">{o.matterTitle.split(" (")[0].split(" v.")[0]}</div>
                </div>
                <div className="text-[11px] font-mono text-slate-300">${(o.amount / 1000).toFixed(0)}K</div>
                {o.deltaPct !== undefined && (
                  <div className="text-[10px]" style={{ color: o.deltaPct > 0 ? "#4a90b8" : "#c45a4a" }}>
                    +{o.deltaPct.toFixed(0)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </Widget>

        <Widget title="Communication Silence Tracker" href="/ny/insurer-intel">
          <div className="space-y-2">
            {allComms.slice(0, 4).map((c, i) => (
              <div key={i} className="py-1.5 border-b border-white/[0.04] last:border-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] text-slate-300 truncate mr-2">{c.partyName.split("(")[0].trim()}</span>
                  <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                    c.silenceRisk === "critical" ? "bg-[#c45a4a]/10 text-[#c45a4a]" :
                    c.silenceRisk === "high" ? "bg-[#d4a054]/10 text-[#d4a054]" : "bg-slate-500/10 text-slate-400"
                  }`}>{c.daysSilent}d silent</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">{c.matterTitle.split(" (")[0]}</div>
                <div className="text-[10px] text-slate-600">{c.outstandingItems.length} outstanding items</div>
              </div>
            ))}
          </div>
        </Widget>

        <Widget title="Chronology Integrity / AI Defensibility" href="/ny/trust">
          <div className="space-y-2">
            {NY_DEMO_MATTERS.map((m, i) => {
              const defensibility = m.forecasts.find(f => f.type === "ai_defensibility_score");
              return (
                <div key={i} className="py-1.5 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-300 truncate mr-2">{m.title.split(" (")[0]}</span>
                    <span className="text-[11px] font-mono" style={{ color: (defensibility?.score ?? 0) >= 85 ? "#4a90b8" : "#d4a054" }}>
                      {defensibility?.score ?? 0}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${defensibility?.score ?? 0}%`,
                        background: (defensibility?.score ?? 0) >= 85 ? "#4a90b8" : "#d4a054",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Widget>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Widget title="Disclaimer Vulnerability Queue" href="/ny/coverage">
          {disclaimerMatters.length === 0 ? (
            <div className="text-[10px] text-slate-600 py-3 text-center">No active disclaimer challenges</div>
          ) : (
            <div className="space-y-2">
              {disclaimerMatters.map((m, i) =>
                m.disclaimers.map((d, di) => (
                  <div key={`${i}-${di}`} className="py-1.5 border-b border-white/[0.04] last:border-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] text-slate-300 truncate mr-2">{m.title.split(" (")[0]}</span>
                      <span className="text-[10px] font-mono" style={{ color: d.vulnerabilityScore >= 75 ? "#c45a4a" : "#d4a054" }}>
                        Vuln {d.vulnerabilityScore}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">{d.isTimely ? "Timely" : "UNTIMELY DISCLAIMER"} · {d.daysFromLoss}d post-loss</div>
                    <div className="text-[10px] text-slate-600 truncate">{d.basis}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </Widget>

        <Widget title="Damages / Lien Gaps" href="/ny/no-fault">
          <div className="space-y-2">
            {NY_DEMO_MATTERS.filter(m => m.demandPacket && m.demandPacket.missingItems.length > 0).map((m, i) => (
              <div key={i} className="py-1.5 border-b border-white/[0.04] last:border-0">
                <div className="text-[11px] text-slate-300 mb-1 truncate">{m.title.split(" (")[0]}</div>
                {m.demandPacket!.missingItems.slice(0, 2).map((item, ii) => (
                  <div key={ii} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <div className="w-1 h-1 rounded-full bg-[#c45a4a] flex-shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
                {m.demandPacket!.missingItems.length > 2 && (
                  <div className="text-[9px] text-slate-600 ml-2.5">+{m.demandPacket!.missingItems.length - 2} more</div>
                )}
              </div>
            ))}
          </div>
        </Widget>

        <Widget title="Approval Queue — NY Matters">
          <div className="space-y-2">
            {[
              { title: "Demand send — Vasquez v. Progressive", type: "demand_send", urgency: "high" },
              { title: "AI review packet — Okafor (chronology)", type: "ai_review", urgency: "medium" },
              { title: "Coverage memo — Kensington (partner sign-off)", type: "partner_review", urgency: "high" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
                <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.urgency === "high" ? "bg-[#c45a4a]" : "bg-[#d4a054]"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-slate-300 truncate">{item.title}</div>
                  <div className="text-[10px] text-slate-500">{item.type.replace(/_/g, " ")}</div>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${item.urgency === "high" ? "bg-[#c45a4a]/10 text-[#c45a4a]" : "bg-[#d4a054]/10 text-[#d4a054]"}`}>
                  {item.urgency.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </Widget>
      </div>
    </div>
  );
}
