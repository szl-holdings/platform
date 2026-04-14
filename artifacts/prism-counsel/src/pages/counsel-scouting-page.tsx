import { useState } from "react";
import { Users, TrendingUp, Target, Shield, AlertTriangle, FileText, BarChart3, ChevronRight } from "lucide-react";

const PRISM_GOLD = "#c8a96e";

interface CounselProfile {
  id: string;
  name: string;
  firm: string;
  jurisdiction: string;
  practiceArea: string;
  yearsActive: number;
  casesObserved: number;
  winRate: number;
  settlementRate: number;
  avgSettlementMultiple: number;
  avgDaysToSettle: number;
  preferredTactics: string[];
  knownWeaknesses: string[];
  aggression: number;
  motionPractice: number;
  discoveryStyle: string;
  depositionApproach: string;
  notableOutcomes: Array<{ case: string; result: string; amount?: number }>;
  threatLevel: "low" | "moderate" | "high" | "elite";
}

const COUNSEL_PROFILES: CounselProfile[] = [
  {
    id: "c1",
    name: "Dominic R. Stavros, Esq.",
    firm: "Stavros & Marchetti LLP",
    jurisdiction: "SDNY / EDNY",
    practiceArea: "Personal Injury / Commercial Auto",
    yearsActive: 22,
    casesObserved: 87,
    winRate: 68,
    settlementRate: 74,
    avgSettlementMultiple: 1.31,
    avgDaysToSettle: 310,
    preferredTactics: ["Early mediation push", "Aggressive expert designation", "Broad discovery requests", "Pre-trial publicity pressure"],
    knownWeaknesses: ["Weak on medical causation arguments", "Over-relies on emotional narrative", "Thin on economic damages modeling"],
    aggression: 82,
    motionPractice: 58,
    discoveryStyle: "Scorched-earth — broad RFPs, heavy interrogatories, multiple depositions",
    depositionApproach: "Narrative-building — focuses on witness sympathy over technical facts",
    notableOutcomes: [
      { case: "Torres v. Allied Freight", result: "Settled", amount: 1_850_000 },
      { case: "Ruiz v. Metro Contractors", result: "Plaintiff Verdict", amount: 3_200_000 },
      { case: "Lee v. Coastal Transit", result: "Defense Verdict", amount: 0 },
    ],
    threatLevel: "high",
  },
  {
    id: "c2",
    name: "Patricia A. Ng, Esq.",
    firm: "Ng Huang & Associates",
    jurisdiction: "EDNY",
    practiceArea: "Premises Liability / Slip & Fall",
    yearsActive: 14,
    casesObserved: 52,
    winRate: 59,
    settlementRate: 81,
    avgSettlementMultiple: 0.94,
    avgDaysToSettle: 195,
    preferredTactics: ["Fast settlement — avoids trial", "Medicaid lien negotiations", "Structured settlement proposals", "Quick liability concession trades"],
    knownWeaknesses: ["Reluctant to try cases", "Poor trial preparation discipline", "Limited appellate experience"],
    aggression: 41,
    motionPractice: 35,
    discoveryStyle: "Targeted — focused requests, limited depositions",
    depositionApproach: "Efficient — quick fact-gathering, rarely extended",
    notableOutcomes: [
      { case: "Kim v. Harbor Mall", result: "Settled", amount: 420_000 },
      { case: "Santos v. Greenpoint Realty", result: "Settled", amount: 680_000 },
      { case: "Walsh v. Brooklyn Housing", result: "Defense Verdict", amount: 0 },
    ],
    threatLevel: "low",
  },
  {
    id: "c3",
    name: "Theodore J. Walcott, Esq.",
    firm: "Walcott, Baines & Greer",
    jurisdiction: "SDNY",
    practiceArea: "Bad Faith / Insurance Coverage",
    yearsActive: 31,
    casesObserved: 134,
    winRate: 72,
    settlementRate: 62,
    avgSettlementMultiple: 1.58,
    avgDaysToSettle: 480,
    preferredTactics: ["Extracontractual damages claims", "Regulatory complaint leverage", "Class action threat as settlement pressure", "Punitive damages arguments"],
    knownWeaknesses: ["Overcomplicates simple matters", "Slow — doesn't manage pace well", "Hostile court relationships in EDNY"],
    aggression: 91,
    motionPractice: 78,
    discoveryStyle: "Maximalist — deposits everything, challenges every objection",
    depositionApproach: "Confrontational — long, aggressive, seeks admissions on bad faith elements",
    notableOutcomes: [
      { case: "Okafor v. National Indemnity", result: "Plaintiff Verdict", amount: 5_600_000 },
      { case: "Freeman v. Allied Coverage", result: "Settled", amount: 2_900_000 },
      { case: "Grant v. Continental Mutual", result: "Defense Verdict", amount: 0 },
    ],
    threatLevel: "elite",
  },
];

const THREAT_CONFIG: Record<string, { color: string; label: string }> = {
  low: { color: "#4a90b8", label: "LOW THREAT" },
  moderate: { color: "#d4a054", label: "MODERATE" },
  high: { color: "#c45a4a", label: "HIGH THREAT" },
  elite: { color: "#9b2335", label: "ELITE — DANGER" },
};

function ThreatBadge({ level }: { level: string }) {
  const cfg = THREAT_CONFIG[level]!;
  return (
    <span className="px-2 py-0.5 rounded text-[9px] font-semibold border" style={{
      background: `${cfg.color}15`,
      color: cfg.color,
      borderColor: `${cfg.color}30`,
    }}>
      {cfg.label}
    </span>
  );
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

export default function CounselScoutingPage() {
  const [selected, setSelected] = useState<CounselProfile | null>(null);

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5" style={{ color: PRISM_GOLD }} />
          <h1 className="text-lg font-semibold text-slate-100">Opposing Counsel Scouting</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium border" style={{ background: `${PRISM_GOLD}15`, color: PRISM_GOLD, borderColor: `${PRISM_GOLD}30` }}>
            TACTICAL INTELLIGENCE
          </span>
        </div>
        <p className="text-xs text-slate-500">Automated dossiers on opposing attorneys — win rates, preferred tactics, settlement patterns, and notable case outcomes. Know your opponent before they know you.</p>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Counsel Profiled", value: COUNSEL_PROFILES.length, color: PRISM_GOLD },
          { label: "Elite Threat", value: COUNSEL_PROFILES.filter(c => c.threatLevel === "elite").length, color: "#9b2335" },
          { label: "High Threat", value: COUNSEL_PROFILES.filter(c => c.threatLevel === "high").length, color: "#c45a4a" },
          { label: "Avg Win Rate", value: `${Math.round(COUNSEL_PROFILES.reduce((s,c)=>s+c.winRate,0)/COUNSEL_PROFILES.length)}%`, color: "#d4a054" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <div className="text-[9px] font-medium text-slate-500 uppercase tracking-wider mb-2">{stat.label}</div>
            <div className="text-xl font-semibold font-mono" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Roster */}
        <div className="col-span-2 space-y-2">
          <div className="text-[9px] font-medium text-slate-600 uppercase tracking-wider px-1">Counsel Roster</div>
          {COUNSEL_PROFILES.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className={`w-full text-left rounded-lg border p-3 transition-all ${
                selected?.id === c.id
                  ? "border-[#c8a96e]/40 bg-[#c8a96e]/5"
                  : "border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-medium text-slate-200">{c.name}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{c.firm}</div>
                  <div className="text-[9px] text-slate-600 mt-0.5">{c.practiceArea}</div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <ThreatBadge level={c.threatLevel} />
                <span className="text-[9px] text-slate-600">{c.winRate}% win rate</span>
              </div>
            </button>
          ))}
        </div>

        {/* Dossier */}
        <div className="col-span-3">
          {selected ? (
            <div className="rounded-lg border border-white/[0.06] p-5 space-y-5" style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-100">{selected.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{selected.firm} · {selected.jurisdiction}</div>
                  <div className="text-[9px] text-slate-600 mt-0.5">{selected.practiceArea} · {selected.yearsActive}yr practice · {selected.casesObserved} cases observed</div>
                </div>
                <ThreatBadge level={selected.threatLevel} />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Win Rate", value: `${selected.winRate}%`, color: selected.winRate > 65 ? "#c45a4a" : "#4a90b8" },
                  { label: "Settlement Rate", value: `${selected.settlementRate}%`, color: "#d4a054" },
                  { label: "Avg Settlement ×", value: `${selected.avgSettlementMultiple.toFixed(2)}×`, color: selected.avgSettlementMultiple > 1.1 ? "#c45a4a" : "#4a90b8" },
                  { label: "Avg Days to Settle", value: `${selected.avgDaysToSettle}d`, color: PRISM_GOLD },
                  { label: "Aggression Score", value: `${selected.aggression}/100`, color: selected.aggression > 75 ? "#c45a4a" : "#d4a054" },
                  { label: "Motion Practice", value: `${selected.motionPractice}/100`, color: "#4a90b8" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded border border-white/[0.04] p-3" style={{ background: "#080c14" }}>
                    <div className="text-[9px] text-slate-500 mb-1">{stat.label}</div>
                    <div className="text-sm font-mono font-semibold" style={{ color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Styles */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded border border-white/[0.04] p-3" style={{ background: "#080c14" }}>
                  <div className="text-[9px] font-medium text-slate-500 uppercase mb-1.5">Discovery Style</div>
                  <p className="text-[10px] text-slate-300">{selected.discoveryStyle}</p>
                </div>
                <div className="rounded border border-white/[0.04] p-3" style={{ background: "#080c14" }}>
                  <div className="text-[9px] font-medium text-slate-500 uppercase mb-1.5">Deposition Approach</div>
                  <p className="text-[10px] text-slate-300">{selected.depositionApproach}</p>
                </div>
              </div>

              {/* Tactics */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[9px] font-medium text-[#c45a4a] uppercase tracking-wider mb-2">Preferred Tactics</div>
                  {selected.preferredTactics.map((t, i) => (
                    <div key={i} className="flex items-start gap-2 mb-1.5">
                      <AlertTriangle className="w-3 h-3 text-[#c45a4a] flex-shrink-0 mt-0.5" />
                      <span className="text-[10px] text-slate-300">{t}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-[9px] font-medium text-[#4a90b8] uppercase tracking-wider mb-2">Known Weaknesses</div>
                  {selected.knownWeaknesses.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 mb-1.5">
                      <Shield className="w-3 h-3 text-[#4a90b8] flex-shrink-0 mt-0.5" />
                      <span className="text-[10px] text-slate-300">{w}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notable Outcomes */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <div className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Notable Outcomes</div>
                </div>
                <div className="space-y-2">
                  {selected.notableOutcomes.map((o, i) => (
                    <div key={i} className="flex items-center justify-between rounded border border-white/[0.04] p-2.5" style={{ background: "#080c14" }}>
                      <span className="text-[10px] text-slate-300">{o.case}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] px-1.5 py-0.5 rounded border" style={{
                          background: o.result === "Defense Verdict" ? "#4a90b815" : o.result === "Plaintiff Verdict" ? "#c45a4a15" : "#d4a05415",
                          color: o.result === "Defense Verdict" ? "#4a90b8" : o.result === "Plaintiff Verdict" ? "#c45a4a" : "#d4a054",
                          borderColor: o.result === "Defense Verdict" ? "#4a90b830" : o.result === "Plaintiff Verdict" ? "#c45a4a30" : "#d4a05430",
                        }}>
                          {o.result}
                        </span>
                        {o.amount != null && o.amount > 0 && (
                          <span className="text-[10px] font-mono text-slate-400">{fmt(o.amount)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-white/[0.06] p-8 flex flex-col items-center justify-center text-center" style={{ background: "#0c1220" }}>
              <Users className="w-8 h-8 text-slate-700 mb-3" />
              <div className="text-xs text-slate-500">Select opposing counsel to view their tactical dossier</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
