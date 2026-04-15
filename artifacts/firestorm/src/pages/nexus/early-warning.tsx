import { useState, useCallback } from "react";
import { AlertTriangle, TrendingUp, Shield, Activity, Bell, Clock, Eye, CheckCircle, XCircle, Globe, Zap, BarChart3 } from "lucide-react";

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

interface EarlyWarning {
  id: string;
  title: string;
  category: "economic" | "political" | "conflict" | "pandemic" | "technology" | "climate";
  leadIndicators: string[];
  probability: number;
  timeHorizon: string;
  impactSeverity: "critical" | "high" | "medium" | "low";
  affectedDomains: string[];
  description: string;
  status: "active" | "monitoring" | "escalated" | "resolved";
  detectedAt: string;
  confidence: number;
}

const WARNINGS: EarlyWarning[] = [
  {
    id: "EW-001", title: "Red Sea Maritime Corridor Destabilization", category: "conflict",
    leadIndicators: ["Houthi attack frequency +340% (30d)", "Insurance premium spike", "Vessel rerouting pattern shift", "Military deployments CENTCOM region"],
    probability: 88, timeHorizon: "0-30 days", impactSeverity: "critical", affectedDomains: ["Maritime", "Financial", "Legal", "Real Estate"],
    description: "Multiple leading indicators converge on sustained disruption of Red Sea shipping corridor. Attack frequency has increased 340% in 30 days. Insurance markets already repricing. Estimated 15-20% of global container traffic at risk of extended rerouting via Cape of Good Hope.",
    status: "escalated", detectedAt: "2024-03-10T06:00:00Z", confidence: 92,
  },
  {
    id: "EW-002", title: "Semiconductor Supply Chain Stress — Taiwan Contingency", category: "political",
    leadIndicators: ["PLA military exercises frequency +60%", "TSMC advance orders surge", "US strategic reserve purchases", "Japan/Korea chip stockpile announcements"],
    probability: 18, timeHorizon: "6-18 months", impactSeverity: "critical", affectedDomains: ["Financial", "Technology", "Maritime", "Legal"],
    description: "Leading indicators suggest elevated risk of Taiwan contingency scenario. While base probability remains low, the cascading impact would be unprecedented. Supply chain pre-positioning behavior by major economies suggests growing concern.",
    status: "monitoring", detectedAt: "2024-02-15T06:00:00Z", confidence: 75,
  },
  {
    id: "EW-003", title: "EU Regulatory Acceleration — CBAM Maritime Expansion", category: "economic",
    leadIndicators: ["EU Parliament committee transcripts", "Commissioner public statements", "Lobbyist activity analysis", "Member state voting pattern shift"],
    probability: 72, timeHorizon: "3-9 months", impactSeverity: "high", affectedDomains: ["Maritime", "Financial", "Legal", "Infrastructure"],
    description: "Intelligence analysis of EU legislative signals indicates carbon border adjustment mechanism likely to expand scope to maritime emissions 6 months ahead of published timeline. Multiple committee transcripts and commissioner statements support this assessment.",
    status: "active", detectedAt: "2024-03-01T06:00:00Z", confidence: 71,
  },
  {
    id: "EW-004", title: "Coordinated Ransomware Campaign — Maritime Infrastructure", category: "technology",
    leadIndicators: ["RaaS advertisement dark web", "Port system vulnerability disclosures", "Threat actor reconnaissance patterns", "Insurance claims pre-positioning"],
    probability: 35, timeHorizon: "1-6 months", impactSeverity: "high", affectedDomains: ["Cyber", "Maritime", "Financial", "Infrastructure"],
    description: "Dark web intelligence and threat actor behavioral analysis suggest planning phase for coordinated ransomware attack on maritime port infrastructure. Multiple RaaS groups advertising maritime-specific capabilities. Port management systems have 7 unpatched critical vulnerabilities.",
    status: "active", detectedAt: "2024-03-08T06:00:00Z", confidence: 67,
  },
  {
    id: "EW-005", title: "US Commercial Real Estate Correction — Interest Rate Sensitivity", category: "economic",
    leadIndicators: ["Office vacancy rates trending", "CMBS delinquency signals", "Fed funds future pricing", "Regional bank CRE exposure"],
    probability: 62, timeHorizon: "3-12 months", impactSeverity: "medium", affectedDomains: ["Real Estate", "Financial", "Legal"],
    description: "Leading indicators suggest commercial real estate correction deepening, particularly in office sector. CMBS delinquency rates rising faster than models predicted. Regional bank exposure creates systemic transmission risk.",
    status: "monitoring", detectedAt: "2024-02-20T06:00:00Z", confidence: 78,
  },
];

const catColor = (c: string) => c === "conflict" ? RED : c === "economic" ? ACCENT : c === "political" ? PURPLE : c === "technology" ? BLUE : c === "climate" ? GREEN : "#06b6d4";
const sevColor = (s: string) => s === "critical" ? RED : s === "high" ? ACCENT : s === "medium" ? BLUE : GREEN;
const statColor = (s: string) => s === "escalated" ? RED : s === "active" ? ACCENT : s === "monitoring" ? BLUE : GREEN;

export default function EarlyWarningPage() {
  const [warnings, setWarnings] = useState(() => WARNINGS.map(w => ({ ...w })));
  const [selectedId, setSelectedId] = useState(WARNINGS[0].id);
  const selected = warnings.find(w => w.id === selectedId) ?? warnings[0];

  const handleEscalate = useCallback((id: string) => {
    setWarnings(prev => prev.map(w => w.id === id ? { ...w, status: "escalated" as const } : w));
  }, []);

  const handleResolve = useCallback((id: string) => {
    setWarnings(prev => prev.map(w => w.id === id ? { ...w, status: "resolved" as const } : w));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Strategic Early Warning System</h1>
          <p className="text-[11px] mt-1" style={{ color: DS.text.muted }}>ML models identifying leading indicators of emerging crises across economic, political, conflict, and technology domains</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px]" style={{ color: RED }}>{warnings.filter(w => w.status === "escalated").length} Escalated</span>
          <span className="text-[9px]" style={{ color: ACCENT }}>{warnings.filter(w => w.status === "active").length} Active</span>
          <span className="text-[9px]" style={{ color: BLUE }}>{warnings.filter(w => w.status === "monitoring").length} Monitoring</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5 space-y-2">
          {warnings.sort((a, b) => { const p = { escalated: 0, active: 1, monitoring: 2, resolved: 3 }; return (p[a.status] ?? 4) - (p[b.status] ?? 4); }).map(w => (
            <button key={w.id} onClick={() => setSelectedId(w.id)} aria-label={`Select warning ${w.title}`}
              className="w-full text-left rounded-xl p-4 transition" style={{ background: selectedId === w.id ? "rgba(255,255,255,0.04)" : DS.surface, border: `1px solid ${selectedId === w.id ? "rgba(255,255,255,0.12)" : DS.border}` }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-mono" style={{ color: DS.text.muted }}>{w.id}</span>
                <span className="text-[8px] uppercase font-bold rounded px-1.5 py-0.5" style={{ background: catColor(w.category) + "15", color: catColor(w.category) }}>{w.category}</span>
                <span className="text-[8px] uppercase font-bold rounded px-1.5 py-0.5" style={{ background: statColor(w.status) + "15", color: statColor(w.status) }}>{w.status}</span>
              </div>
              <p className="text-sm font-medium text-white mb-1">{w.title}</p>
              <div className="flex items-center gap-3">
                <span className="text-[9px]" style={{ color: DS.text.muted }}>Prob: <span className="font-semibold" style={{ color: w.probability > 70 ? RED : w.probability > 40 ? ACCENT : BLUE }}>{w.probability}%</span></span>
                <span className="text-[9px]" style={{ color: DS.text.muted }}>{w.timeHorizon}</span>
                <span className="text-[8px] uppercase font-bold rounded px-1.5 py-0.5" style={{ background: sevColor(w.impactSeverity) + "15", color: sevColor(w.impactSeverity) }}>{w.impactSeverity}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="col-span-7 space-y-4">
          <div className="rounded-xl p-5" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4" style={{ color: sevColor(selected.impactSeverity) }} />
              <h2 className="text-lg font-semibold text-white">{selected.title}</h2>
            </div>
            <p className="text-[11px] leading-relaxed mb-4" style={{ color: DS.text.secondary }}>{selected.description}</p>

            <h4 className="text-[9px] uppercase tracking-wider font-semibold mb-2" style={{ color: DS.text.muted }}>Leading Indicators</h4>
            <div className="space-y-1.5 mb-4">
              {selected.leadIndicators.map(li => (
                <div key={li} className="flex items-center gap-2 rounded-lg p-2" style={{ background: "rgba(255,255,255,0.015)", border: `1px solid ${DS.border}` }}>
                  <TrendingUp className="h-3 w-3 flex-shrink-0" style={{ color: ACCENT }} />
                  <span className="text-[10px]" style={{ color: DS.text.secondary }}>{li}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg p-3 text-center" style={{ background: "rgba(255,255,255,0.015)", border: `1px solid ${DS.border}` }}>
                <p className="text-[8px] uppercase tracking-wider mb-1" style={{ color: DS.text.muted }}>Probability</p>
                <p className="text-xl font-semibold" style={{ color: selected.probability > 70 ? RED : selected.probability > 40 ? ACCENT : BLUE }}>{selected.probability}%</p>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ background: "rgba(255,255,255,0.015)", border: `1px solid ${DS.border}` }}>
                <p className="text-[8px] uppercase tracking-wider mb-1" style={{ color: DS.text.muted }}>Confidence</p>
                <p className="text-xl font-semibold text-white">{selected.confidence}%</p>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ background: "rgba(255,255,255,0.015)", border: `1px solid ${DS.border}` }}>
                <p className="text-[8px] uppercase tracking-wider mb-1" style={{ color: DS.text.muted }}>Time Horizon</p>
                <p className="text-sm font-semibold text-white">{selected.timeHorizon}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {selected.affectedDomains.map(d => (
                <span key={d} className="text-[8px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${DS.border}`, color: DS.text.secondary }}>{d}</span>
              ))}
            </div>

            {(selected.status === "active" || selected.status === "monitoring") && (
              <div className="flex items-center gap-2">
                <button onClick={() => handleEscalate(selected.id)} aria-label="Escalate warning"
                  className="text-[9px] font-semibold rounded-lg px-3 py-1.5 hover:brightness-125 transition" style={{ background: RED + "20", color: RED }}>Escalate</button>
                <button onClick={() => handleResolve(selected.id)} aria-label="Resolve warning"
                  className="text-[9px] font-semibold rounded-lg px-3 py-1.5 hover:brightness-125 transition" style={{ background: GREEN + "20", color: GREEN }}>Resolve</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
