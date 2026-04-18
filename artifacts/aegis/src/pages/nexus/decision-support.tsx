import { useState, useCallback } from "react";
import { InlineFeedbackBar } from "@szl-holdings/shared-ui";
import { Zap, Users, Globe, Shield, Target, TrendingUp, CheckCircle, Clock, AlertTriangle, ArrowRight, Eye } from "lucide-react";

const ACCENT = "#f59e0b";
const RED = "#ef4444";
const GREEN = "#22c55e";
const BLUE = "#3b82f6";
const PURPLE = "#8b5cf6";

const DS = {
  surface: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.06)",
  text: { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.5)", muted: "rgba(255,255,255,0.25)" },
};

interface Recommendation {
  id: string;
  threat: string;
  stakeholder: string;
  urgency: "immediate" | "24h" | "7d" | "30d";
  domain: string;
  action: string;
  rationale: string;
  expectedOutcome: string;
  confidence: number;
  status: "pending" | "accepted" | "rejected" | "in-progress" | "completed";
  riskReduction: number;
}

const RECOMMENDATIONS: Recommendation[] = [
  { id: "REC-001", threat: "Red Sea Supply Chain Disruption", stakeholder: "VP Fleet Operations", urgency: "immediate", domain: "Maritime", action: "Reroute 3 LNG carriers (Meridian Star, Pacific Dawn, Atlantic Horizon) via Cape of Good Hope. Estimated transit extension: 10-14 days. Additional fuel cost: $2.1M.", rationale: "94% confidence in sustained Red Sea corridor disruption. Insurance premiums for Red Sea transit have increased 340%. Rerouting avoids $12M+ potential loss from vessel damage or cargo delays.", expectedOutcome: "Eliminate direct exposure to Red Sea attack corridor. Accept manageable transit delay vs. catastrophic loss risk.", confidence: 94, status: "pending", riskReduction: 85 },
  { id: "REC-002", threat: "Red Sea Supply Chain Disruption", stakeholder: "General Counsel", urgency: "24h", domain: "Legal", action: "Activate force majeure review on 12 maritime contracts with Pinnacle Technologies, Meridian Capital, and TransGlobal Logistics. Focus on clauses §14.2 (Acts of War) and §14.3 (Government Action).", rationale: "Force majeure triggers apply to current Red Sea military operations. Early activation protects against counterparty claims for delivery delays. Window for notice is 48 hours per contract terms.", expectedOutcome: "Contractual protection against late-delivery penalties. Estimated savings: $8M in potential claims.", confidence: 91, status: "pending", riskReduction: 72 },
  { id: "REC-003", threat: "China Supply Chain Exposure", stakeholder: "Portfolio Committee", urgency: "7d", domain: "Financial", action: "Initiate supplier diversification review for Pinnacle Technologies (42% China dependency) and DataVault Corp (38% China dependency). Engage McKinsey for nearshoring feasibility assessment — Mexico and Vietnam primary candidates.", rationale: "Geopolitical risk score for China escalated to 78/100. Two portfolio companies have critical single-source dependencies on Chinese suppliers. Historical analogs suggest 6-18 month window before potential disruption.", expectedOutcome: "Reduce China single-source dependency below 20% within 12 months. Estimated portfolio risk reduction: $180M exposure → $45M.", confidence: 82, status: "pending", riskReduction: 65 },
  { id: "REC-004", threat: "EU Carbon Tax Expansion", stakeholder: "CFO", urgency: "30d", domain: "Financial", action: "Begin proactive carbon clause amendments across 23 existing contracts. Engage Deloitte for carbon accounting audit. Establish $5M carbon compliance reserve fund.", rationale: "71% probability of CBAM maritime expansion 6 months ahead of published timeline. Proactive compliance avoids last-minute legal costs and positions firm favorably with ESG-focused counterparties.", expectedOutcome: "Compliance readiness ahead of regulatory timeline. Estimated savings vs. reactive compliance: $3M.", confidence: 71, status: "pending", riskReduction: 55 },
  { id: "REC-005", threat: "Rotterdam Port Congestion", stakeholder: "Real Estate Committee", urgency: "7d", domain: "Real Estate", action: "Accelerate Rotterdam warehouse acquisition pipeline. Lock in 3 near-port logistics properties at current pricing before vessel rerouting drives demand spike. Budget: $45M total allocation.", rationale: "Vessel rerouting patterns predict 15-20% increase in Rotterdam throughput. Warehouse vacancy rates already declining. 2-3 week window before pricing adjusts upward by estimated 12-18%.", expectedOutcome: "Pre-positioned for demand spike. Estimated alpha generation: $8M over 24 months.", confidence: 76, status: "pending", riskReduction: 45 },
  { id: "REC-006", threat: "Ransomware Campaign — Maritime", stakeholder: "CISO", urgency: "immediate", domain: "Cyber", action: "Activate DDoS mitigation for MENA edge nodes. Issue security advisory to all logistics operations personnel. Implement emergency patching for 7 critical port system vulnerabilities. Activate threat hunting team.", rationale: "Threat intelligence indicates planning phase for coordinated ransomware attack on maritime infrastructure. 3 independent signals confirm: dark web RaaS advertising, reconnaissance patterns, and insurance pre-positioning.", expectedOutcome: "Reduce attack surface by 80%. Detect and block lateral movement before ransomware deployment.", confidence: 67, status: "pending", riskReduction: 78 },
];

const urgColor = (u: string) => u === "immediate" ? RED : u === "24h" ? ACCENT : u === "7d" ? BLUE : GREEN;
const statColor = (s: string) => s === "completed" ? GREEN : s === "in-progress" ? BLUE : s === "accepted" ? ACCENT : s === "rejected" ? DS.text.muted : ACCENT;

export default function DecisionSupportPage() {
  const [recs, setRecs] = useState(() => RECOMMENDATIONS.map(r => ({ ...r })));
  const [filterStakeholder, setFilterStakeholder] = useState<string>("all");

  const stakeholders = [...new Set(RECOMMENDATIONS.map(r => r.stakeholder))];
  const filtered = filterStakeholder === "all" ? recs : recs.filter(r => r.stakeholder === filterStakeholder);

  const handleAction = useCallback((id: string, status: Recommendation["status"]) => {
    setRecs(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white tracking-tight">Decision Support & Recommendation Engine</h1>
        <p className="text-[11px] mt-1" style={{ color: DS.text.muted }}>Stakeholder-specific actionable recommendations for each detected threat or opportunity across all domains</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Pending Actions", value: recs.filter(r => r.status === "pending").length.toString(), icon: Clock, color: ACCENT },
          { label: "Immediate Priority", value: recs.filter(r => r.urgency === "immediate" && r.status === "pending").length.toString(), icon: AlertTriangle, color: RED },
          { label: "Accepted", value: recs.filter(r => r.status === "accepted" || r.status === "in-progress" || r.status === "completed").length.toString(), icon: CheckCircle, color: GREEN },
          { label: "Avg Risk Reduction", value: `${Math.round(recs.reduce((s, r) => s + r.riskReduction, 0) / recs.length)}%`, icon: Shield, color: BLUE },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
              <span className="text-[9px] uppercase tracking-wider" style={{ color: DS.text.muted }}>{s.label}</span>
            </div>
            <p className="text-xl font-semibold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={() => setFilterStakeholder("all")} aria-label="Show all stakeholders"
          className="text-[9px] font-semibold rounded-lg px-3 py-1.5 transition"
          style={{ background: filterStakeholder === "all" ? ACCENT + "15" : "transparent", color: filterStakeholder === "all" ? ACCENT : DS.text.muted }}>All</button>
        {stakeholders.map(s => (
          <button key={s} onClick={() => setFilterStakeholder(s)} aria-label={`Filter by ${s}`}
            className="text-[9px] font-semibold rounded-lg px-3 py-1.5 transition"
            style={{ background: filterStakeholder === s ? ACCENT + "15" : "transparent", color: filterStakeholder === s ? ACCENT : DS.text.muted }}>{s}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(rec => (
          <div key={rec.id} className="rounded-xl p-5" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] font-mono" style={{ color: DS.text.muted }}>{rec.id}</span>
              <span className="text-[8px] uppercase font-bold rounded px-1.5 py-0.5" style={{ background: urgColor(rec.urgency) + "15", color: urgColor(rec.urgency) }}>{rec.urgency}</span>
              <span className="text-[9px] font-semibold" style={{ color: BLUE }}>{rec.stakeholder}</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.03)", color: DS.text.muted }}>{rec.domain}</span>
              <span className="text-[8px] uppercase font-bold rounded px-1.5 py-0.5 ml-auto" style={{ background: statColor(rec.status) + "15", color: statColor(rec.status) }}>{rec.status}</span>
            </div>
            <p className="text-[9px] mb-1" style={{ color: DS.text.muted }}>Threat: <span className="text-white">{rec.threat}</span></p>
            <div className="rounded-lg p-3 mb-3" style={{ background: ACCENT + "06", borderLeft: `2px solid ${ACCENT}` }}>
              <p className="text-[10px] leading-relaxed" style={{ color: DS.text.secondary }}>{rec.action}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-[8px] uppercase tracking-wider mb-1" style={{ color: DS.text.muted }}>Rationale</p>
                <p className="text-[10px] leading-relaxed" style={{ color: DS.text.muted }}>{rec.rationale}</p>
              </div>
              <div>
                <p className="text-[8px] uppercase tracking-wider mb-1" style={{ color: DS.text.muted }}>Expected Outcome</p>
                <p className="text-[10px] leading-relaxed" style={{ color: DS.text.muted }}>{rec.expectedOutcome}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[9px]" style={{ color: DS.text.muted }}>Confidence: <span className="font-semibold text-white">{rec.confidence}%</span></span>
              <span className="text-[9px]" style={{ color: DS.text.muted }}>Risk Reduction: <span className="font-semibold" style={{ color: GREEN }}>{rec.riskReduction}%</span></span>
              {rec.status === "pending" && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <button onClick={() => handleAction(rec.id, "accepted")} aria-label={`Accept ${rec.id}`}
                    className="text-[8px] font-semibold rounded px-2.5 py-1 hover:brightness-125 transition" style={{ background: GREEN + "20", color: GREEN }}>Accept</button>
                  <button onClick={() => handleAction(rec.id, "in-progress")} aria-label={`Begin ${rec.id}`}
                    className="text-[8px] font-semibold rounded px-2.5 py-1 hover:brightness-125 transition" style={{ background: BLUE + "20", color: BLUE }}>Begin</button>
                  <button onClick={() => handleAction(rec.id, "rejected")} aria-label={`Reject ${rec.id}`}
                    className="text-[8px] font-semibold rounded px-2.5 py-1 hover:brightness-125 transition" style={{ background: "rgba(255,255,255,0.04)", color: DS.text.muted }}>Reject</button>
                </div>
              )}
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 10, marginTop: 4 }}>
              <InlineFeedbackBar
                recommendationKey={`aegis-decision-support-${rec.id}`}
                domain="security"
                recommendationText={rec.action}
                apiBaseUrl="/api"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
