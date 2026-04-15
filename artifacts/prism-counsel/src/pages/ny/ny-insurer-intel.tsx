import { Building2, Clock, TrendingUp, AlertTriangle } from "lucide-react";

export default function NyInsurerIntelPage() {
  const insurers: Array<{ carrierName: string; claimOffice: string; reservingStyle: string; mediationBehavior: string; averageResponseDays: number; litigationTolerance: string; denialPattern: string; matterTitle: string; matter: { reserveMovements: Array<{ movementType: string; reserveAmount: number; priorReserve?: number; inferredSignal: string; reserveDate: string }>; communicationWindows: Array<{ partyRole: string; daysSilent: number; silenceRisk: string; outstandingItems: string[] }> } }> = [];

  const BEHAVIOR_PATTERNS = [
    { carrier: "Progressive Insurance", claimOffice: "Long Island City, NY", patterns: ["EUO scheduling as suspension tactic", "Peer review denials at 60–90 day mark", "Reserve moved upward when litigation risk confirmed", "IME-focused defense strategy for high BI cases"], style: "conservative", mediationBehavior: "strategic" },
    { carrier: "AIG / Chartis", claimOffice: "New York Metro", patterns: ["Early low-ball offer on all premises claims", "Silent on demands past 60 days", "IME scheduled late in discovery as pressure tactic", "Reserve set conservatively below demand"], style: "conservative", mediationBehavior: "resistant" },
    { carrier: "Travelers Insurance", claimOffice: "Hartford (NY Unit)", patterns: ["Immediate disclaimer on commercial claims", "Pollution exclusion invoked broadly", "Underwriting file production delayed", "Coverage counsel engaged early to limit exposure"], style: "aggressive", mediationBehavior: "strategic" },
  ];

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">Insurer Intelligence</h1>
        </div>
        <p className="text-xs text-slate-500">Insurer profiles, adjuster behavior, claim office patterns, communication cadence, reserve movements, and negotiation signals</p>
      </div>

      <div className="space-y-3">
        {insurers.map((ins, i) => (
          <div key={i} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-slate-200">{ins.carrierName}</div>
                <div className="text-[10px] text-slate-500">{ins.claimOffice}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">Matter: {ins.matterTitle.split(" (")[0]}</div>
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-0.5 rounded text-[9px] ${
                  ins.reservingStyle === "aggressive" ? "bg-[#c45a4a]/10 text-[#c45a4a]" :
                  ins.reservingStyle === "conservative" ? "bg-[#d4a054]/10 text-[#d4a054]" :
                  "bg-slate-500/10 text-slate-400"
                }`}>
                  RESERVING: {ins.reservingStyle.toUpperCase()}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] ${
                  ins.mediationBehavior === "cooperative" ? "bg-[#4a90b8]/10 text-[#4a90b8]" :
                  ins.mediationBehavior === "resistant" ? "bg-[#c45a4a]/10 text-[#c45a4a]" :
                  "bg-[#d4a054]/10 text-[#d4a054]"
                }`}>
                  MEDIATION: {ins.mediationBehavior.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <div className="text-[10px] text-slate-500 mb-0.5">Avg Response Time</div>
                <div className="text-lg font-mono text-slate-200">{ins.averageResponseDays}d</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 mb-0.5">Litigation Tolerance</div>
                <div className="text-sm font-medium" style={{ color: ins.litigationTolerance === "high" ? "#c45a4a" : "#d4a054" }}>
                  {ins.litigationTolerance.toUpperCase()}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 mb-0.5">Denial Pattern</div>
                <div className="text-[10px] text-slate-400 leading-relaxed">{ins.denialPattern}</div>
              </div>
            </div>

            {ins.matter.reserveMovements.length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Reserve Movements</div>
                <div className="space-y-1.5">
                  {ins.matter.reserveMovements.map((r, ri) => (
                    <div key={ri} className="flex items-center gap-3 py-1.5 border-b border-white/[0.04] last:border-0">
                      <div className={`w-2 h-2 rounded-full ${r.movementType === "increase" ? "bg-[#4a90b8]" : r.movementType === "decrease" ? "bg-[#c45a4a]" : "bg-[#d4a054]"}`} />
                      <div className="flex-1">
                        <span className="text-[11px] font-mono text-slate-200">${(r.reserveAmount / 1000).toFixed(0)}K</span>
                        {r.priorReserve && <span className="text-[10px] text-slate-500 ml-2">(from ${(r.priorReserve / 1000).toFixed(0)}K)</span>}
                        <div className="text-[10px] text-slate-500">{r.inferredSignal}</div>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{new Date(r.reserveDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ins.matter.communicationWindows.filter(c => c.partyRole === "insurer").map((c, ci) => (
              <div key={ci} className="mt-3 rounded border border-white/[0.04] p-2.5" style={{ background: "#080c14" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-slate-300">Communication Window</span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded"
                    style={{
                      background: c.silenceRisk === "critical" ? "#c45a4a20" : c.silenceRisk === "high" ? "#d4a05420" : "#4a90b820",
                      color: c.silenceRisk === "critical" ? "#c45a4a" : c.silenceRisk === "high" ? "#d4a054" : "#4a90b8",
                    }}
                  >
                    {c.daysSilent}d SILENT · {c.silenceRisk.toUpperCase()} RISK
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">Outstanding: {c.outstandingItems.join(" · ")}</div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h2 className="text-sm font-semibold text-slate-200 mb-3">Behavioral Pattern Library</h2>
        <div className="space-y-3">
          {BEHAVIOR_PATTERNS.map((bp, i) => (
            <div key={i} className="rounded border border-white/[0.04] p-3" style={{ background: "#080c14" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-200">{bp.carrier}</span>
                <span className="text-[10px] text-slate-500">{bp.claimOffice}</span>
              </div>
              <div className="space-y-1">
                {bp.patterns.map((p, pi) => (
                  <div key={pi} className="flex items-center gap-2 text-[10px] text-slate-400">
                    <div className="w-1 h-1 rounded-full bg-[#d4a054] flex-shrink-0" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
