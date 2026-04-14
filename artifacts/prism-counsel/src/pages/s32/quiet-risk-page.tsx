import { useState } from "react";
import { Eye, AlertTriangle, Clock, MessageSquare, TrendingDown, CheckCircle, ChevronRight, Zap } from "lucide-react";
import { Link } from "wouter";

const QUIET_RISKS = [
  {
    matterId: 5,
    title: "Kim v. Progressive",
    caseNumber: "2025-CV-03122",
    riskType: "sol_approaching",
    label: "SOL Approaching",
    description: "Statute of limitations deadline in 45 days. Matter has had no clock movement in 30 days — appears inactive but requires immediate action.",
    severity: "critical",
    indicators: ["No new filings in 30 days", "No carrier communications since Feb", "No internal activity since March 10"],
    urgentAction: "File or take protective action by May 18",
    daysSilent: 30,
  },
  {
    matterId: 4,
    title: "Park v. Liberty Mutual",
    caseNumber: "2025-CV-02871",
    riskType: "carrier_silence",
    label: "Carrier Silence",
    description: "No carrier communication in 18 days — demand response overdue. Carrier silence beyond firm threshold of 14 days.",
    severity: "high",
    indicators: ["Demand sent March 16, no response", "Adjuster not returning calls (3 attempts)", "No reserve activity detected"],
    urgentAction: "Escalate to supervisor — send certified follow-up",
    daysSilent: 18,
  },
  {
    matterId: 7,
    title: "Torres v. GEICO",
    caseNumber: "2025-CV-04011",
    riskType: "readiness_deterioration",
    label: "Readiness Declining",
    description: "Matter readiness dropped from 74% to 61% over 3 weeks. No new records arriving but mediation in 28 days.",
    severity: "high",
    indicators: ["Evidence pillar score fell 13 points", "3 records requests unanswered", "Mediation in 28 days without memo"],
    urgentAction: "Re-issue records requests, begin mediation memo",
    daysSilent: null,
  },
  {
    matterId: 6,
    title: "Williams v. Allstate",
    caseNumber: "2025-CV-03558",
    riskType: "missing_records",
    label: "Critical Records Missing",
    description: "Primary treating physician records not received in 45 days. Matter has a discovery cutoff in 21 days.",
    severity: "high",
    indicators: ["Subpoena issued 45 days ago", "HIPAA authorization expired", "Discovery cutoff in 21 days"],
    urgentAction: "File motion to compel or renew subpoena immediately",
    daysSilent: null,
  },
];

const FRICTION_ITEMS = [
  {
    type: "settlement_friction",
    label: "Settlement Friction",
    items: [
      { matter: "Kim v. Progressive", issue: "Medicare lien unresolved — carrier will not finalize until lien confirmed", action: "Contact CMS MSP contractor" },
      { matter: "Rodriguez v. National General", issue: "Lost wage documentation missing — weakens settlement position", action: "Follow up with employer" },
    ],
  },
  {
    type: "no_fault_friction",
    label: "No-Fault Friction",
    items: [
      { matter: "Chen v. Allstate", issue: "NF-2 verification pending 21 days — verification delays blocking claim", action: "Contact no-fault adjustor directly" },
    ],
  },
  {
    type: "approval_lag",
    label: "Approval Lag",
    items: [
      { matter: "Rodriguez v. National General", issue: "Demand sign-off pending 5 days — blocking send", action: "Escalate to supervising partner" },
    ],
  },
  {
    type: "review_friction",
    label: "Review Queue Backlog",
    items: [
      { matter: "Multiple", issue: "3 documents in review queue over 3 days — blocking downstream actions", action: "Clear review queue" },
    ],
  },
];

export default function QuietRiskPage() {
  const [tab, setTab] = useState<"quiet" | "friction">("quiet");

  const criticalCount = QUIET_RISKS.filter(r => r.severity === "critical").length;
  const highCount = QUIET_RISKS.filter(r => r.severity === "high").length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Eye className="w-5 h-5 text-[#c45a4a]" />
          <h1 className="text-lg font-semibold text-slate-100">Quiet Risk Detector</h1>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#c45a4a]/10 text-[#c45a4a]">{criticalCount} CRITICAL · {highCount} HIGH</span>
        </div>
        <p className="text-xs text-slate-500">Matters that look quiet but are becoming dangerous — carrier silence, missing records, clock stagnation, readiness deterioration</p>
      </div>

      <div className="flex gap-1 bg-white/[0.03] rounded p-0.5 w-fit">
        <button onClick={() => setTab("quiet")} className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${tab === "quiet" ? "bg-white/[0.08] text-slate-200" : "text-slate-500"}`}>
          Quiet Risk ({QUIET_RISKS.length})
        </button>
        <button onClick={() => setTab("friction")} className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${tab === "friction" ? "bg-white/[0.08] text-slate-200" : "text-slate-500"}`}>
          Friction Detector
        </button>
      </div>

      {tab === "quiet" && (
        <div className="space-y-3">
          {QUIET_RISKS.map(risk => (
            <div key={risk.matterId} className={`rounded-lg border p-4 ${risk.severity === "critical" ? "border-[#c45a4a]/30" : "border-[#d4a054]/20"}`} style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${risk.severity === "critical" ? "bg-[#c45a4a] animate-pulse" : "bg-[#d4a054]"}`} />
                    <span className="text-sm font-medium text-slate-200">{risk.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{risk.caseNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium uppercase ${risk.severity === "critical" ? "bg-[#c45a4a]/10 text-[#c45a4a]" : "bg-[#d4a054]/10 text-[#d4a054]"}`}>{risk.severity}</span>
                    <span className="text-[10px] text-slate-500">{risk.label}</span>
                    {risk.daysSilent && <span className="text-[10px] text-slate-500">{risk.daysSilent} days silent</span>}
                  </div>
                </div>
                <Link href={`/prism-counsel/matter-desk/${risk.matterId}`}>
                  <ChevronRight className="w-4 h-4 text-slate-600 hover:text-slate-300 cursor-pointer" />
                </Link>
              </div>

              <p className="text-xs text-slate-400 mb-3">{risk.description}</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Risk Indicators</div>
                  {risk.indicators.map((ind, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-400 py-0.5">
                      <div className="w-1 h-1 rounded-full bg-slate-600" />
                      {ind}
                    </div>
                  ))}
                </div>
                <div className="rounded border border-white/[0.06] p-2.5" style={{ background: "#080c14" }}>
                  <div className="text-[9px] text-[#d4a054] uppercase tracking-wider mb-1">Urgent Action</div>
                  <p className="text-[10px] text-slate-300">{risk.urgentAction}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "friction" && (
        <div className="space-y-4">
          {FRICTION_ITEMS.map(section => (
            <div key={section.type} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">{section.label}</h3>
              <div className="space-y-3">
                {section.items.map((item, i) => (
                  <div key={i} className="rounded border border-white/[0.04] p-3" style={{ background: "#080c14" }}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 mr-3">
                        <div className="text-[11px] font-medium text-slate-200 mb-0.5">{item.matter}</div>
                        <div className="text-[10px] text-slate-400">{item.issue}</div>
                      </div>
                      <div className="rounded px-2 py-1 bg-[#4a90b8]/10 text-[10px] text-[#4a90b8] flex-shrink-0">
                        {item.action}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5 text-[#d4a054]" />
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Next Best 30 Minutes</h3>
            </div>
            <div className="space-y-2">
              {[
                { label: "Clear approval — Rodriguez demand", minutes: 5, impact: 0.92, href: "/prism-counsel/signoff-queue" },
                { label: "Follow up on Park carrier silence", minutes: 10, impact: 0.87, href: "/prism-counsel/matter-desk/4" },
                { label: "Re-issue records requests — Williams", minutes: 15, impact: 0.83, href: "/prism-counsel/matter-desk/6" },
                { label: "Review NF-2 verification — Chen", minutes: 10, impact: 0.76, href: "/prism-counsel/matter-desk/2" },
              ].map((a, i) => (
                <Link key={i} href={a.href}>
                  <div className="flex items-center gap-3 py-2 px-3 rounded border border-white/[0.04] hover:border-white/[0.08] cursor-pointer transition-colors" style={{ background: "#080c14" }}>
                    <div className="w-4 h-4 rounded-full border border-[#d4a054]/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-[8px] font-semibold text-[#d4a054]">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] text-slate-200">{a.label}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-12 h-1 bg-white/[0.06] rounded-full">
                        <div className="h-full bg-[#d4a054] rounded-full" style={{ width: `${a.impact * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{a.minutes}m</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
