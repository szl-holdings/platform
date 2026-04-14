import { Activity, TrendingUp, Clock, DollarSign } from "lucide-react";
import { NY_DEMO_MATTERS } from "../../data/ny-demo-matters";

export default function NyMediationPage() {
  const allMediations = NY_DEMO_MATTERS.flatMap(m =>
    m.mediationEvents.map(e => ({ ...e, matter: m }))
  );

  const MEDIATION_CHECKLIST = [
    "Demand readiness score ≥ 70",
    "All lien holders contacted — negotiated amount confirmed",
    "Expert reports on file (if applicable)",
    "Life care plan / future damages support",
    "Privileged mediation brief drafted and partner-approved",
    "Client authority confirmed in writing",
    "Opening demand figure approved by supervising partner",
    "Communication history assembled (offer movements, silence log)",
    "Venue intelligence reviewed (typical settlement range in county/part)",
    "PRISM forecast read-out reviewed with attorney before session",
  ];

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">Mediation Command</h1>
        </div>
        <p className="text-xs text-slate-500">NY mediation sessions, readiness scoring, conversion probability, and pre-mediation preparation</p>
      </div>

      <div className="space-y-3">
        {allMediations.map((e, i) => {
          const convPct = Math.round(e.conversionProbability * 100);
          return (
            <div key={i} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs font-semibold text-slate-200">{e.matter.title.split(" (")[0]}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {e.mediatorName} · {e.scheduledAt ? new Date(e.scheduledAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Date TBD"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] ${e.status === "scheduled" ? "bg-[#4a90b8]/10 text-[#4a90b8]" : "bg-slate-500/10 text-slate-400"}`}>
                    {e.status.toUpperCase()}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] bg-[#d4a054]/10 text-[#d4a054]">
                    {e.sessionType.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-3">
                <div>
                  <div className="text-[10px] text-slate-500 mb-0.5">Readiness Score</div>
                  <div className="text-2xl font-mono" style={{ color: e.preReadinessScore >= 70 ? "#4a90b8" : "#d4a054" }}>
                    {e.preReadinessScore}
                  </div>
                  <div className="w-full h-1 bg-white/[0.06] rounded-full mt-1 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${e.preReadinessScore}%`, background: e.preReadinessScore >= 70 ? "#4a90b8" : "#d4a054" }} />
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 mb-0.5">Conversion Probability</div>
                  <div className="text-2xl font-mono" style={{ color: convPct >= 60 ? "#4a90b8" : "#d4a054" }}>{convPct}%</div>
                </div>
                {e.openingDemand && (
                  <div>
                    <div className="text-[10px] text-slate-500 mb-0.5">Opening Demand</div>
                    <div className="text-lg font-mono text-slate-200">${(e.openingDemand / 1000).toFixed(0)}K</div>
                  </div>
                )}
                {e.openingOffer && (
                  <div>
                    <div className="text-[10px] text-slate-500 mb-0.5">Opening Offer</div>
                    <div className="text-lg font-mono text-slate-200">${(e.openingOffer / 1000).toFixed(0)}K</div>
                  </div>
                )}
              </div>

              {e.openingDemand && e.openingOffer && (
                <div className="rounded border border-white/[0.04] p-2.5 mt-2" style={{ background: "#080c14" }}>
                  <div className="text-[10px] text-slate-500 mb-1">Position Gap</div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400">${(e.openingOffer / 1000).toFixed(0)}K</span>
                    <div className="flex-1 h-2 bg-white/[0.06] rounded-full relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 rounded-full" style={{
                        width: `${(e.openingOffer / e.openingDemand) * 100}%`,
                        background: "linear-gradient(90deg, #c45a4a, #d4a054)",
                        opacity: 0.7,
                      }} />
                    </div>
                    <span className="text-xs font-mono text-slate-400">${(e.openingDemand / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1">
                    Gap: ${((e.openingDemand - e.openingOffer) / 1000).toFixed(0)}K · {Math.round(((e.openingDemand - e.openingOffer) / e.openingDemand) * 100)}% of demand
                  </div>
                </div>
              )}

              {e.matter.forecasts.filter(f => f.type === "mediation_conversion_probability").map((fc, fci) => (
                <div key={fci} className="rounded border border-[#d4a054]/10 p-2.5 mt-2" style={{ background: "#0e0d08" }}>
                  <div className="text-[10px] text-[#d4a054] font-medium mb-1">Next Best Action</div>
                  <div className="text-[10px] text-slate-400">{fc.nextBestAction}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h2 className="text-sm font-semibold text-slate-200 mb-3">Pre-Mediation Readiness Checklist</h2>
        <div className="grid grid-cols-2 gap-2">
          {MEDIATION_CHECKLIST.map((item, i) => (
            <div key={i} className="flex items-start gap-2 py-1">
              <div className="w-3.5 h-3.5 rounded border border-white/[0.12] flex-shrink-0 mt-0.5" />
              <span className="text-[11px] text-slate-400">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
