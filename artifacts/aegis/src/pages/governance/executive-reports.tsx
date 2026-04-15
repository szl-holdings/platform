import { useState } from "react";
import {
  FileText, Download, Shield, AlertTriangle, CheckCircle2, Clock,
  TrendingUp, TrendingDown, ChevronRight, Eye, Info, Calendar, BarChart3
} from "lucide-react";

type ReportType = "incident_brief" | "daily_digest" | "weekly_risk" | "board_summary" | "control_gap" | "incident_timeline" | "after_action" | "drill_summary";

interface Report {
  id: ReportType;
  title: string;
  description: string;
  cadence: string;
  lastGenerated: string;
  status: "current" | "stale" | "generating";
  audience: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const REPORTS: Report[] = [
  { id: "incident_brief", title: "Executive Incident Brief", description: "Current incident status, severity, containment actions taken, and immediate risk to operations. Includes evidence summary and analyst confidence.", cadence: "On-demand / triggered by P1/P2", lastGenerated: "14m ago", status: "current", audience: "CISO / Executive Sponsor", icon: Shield },
  { id: "daily_digest", title: "Daily Posture Digest", description: "24-hour security posture summary: new incidents, resolved findings, open approvals, alert volume, MTTD/MTTR against targets.", cadence: "Daily at 07:00", lastGenerated: "6h ago", status: "current", audience: "SOC Lead / CISO", icon: Calendar },
  { id: "weekly_risk", title: "Weekly Risk Report", description: "7-day risk trend analysis: escalation rates, policy blocks, retrieval quality, model trust metrics, control coverage deltas.", cadence: "Weekly — Monday", lastGenerated: "4d ago", status: "current", audience: "CISO / Risk Committee", icon: TrendingUp },
  { id: "board_summary", title: "Board-Ready Summary", description: "Non-technical risk posture summary for board consumption. Key risk indicators, control gaps, and strategic recommendations with confidence levels.", cadence: "Quarterly / on-demand", lastGenerated: "3w ago", status: "stale", audience: "Board / C-Suite", icon: BarChart3 },
  { id: "control_gap", title: "Control-Gap Memo", description: "Mapping of current control coverage against NIST CSF / FedRAMP baseline. Gaps, owners, timelines, and compensating controls.", cadence: "Monthly", lastGenerated: "12d ago", status: "current", audience: "CISO / GRC Team", icon: AlertTriangle },
  { id: "incident_timeline", title: "Incident Timeline Report", description: "Full chronological timeline of a specific incident: detection, triage, escalation, containment, resolution. Includes all analyst actions and approval events.", cadence: "Post-incident", lastGenerated: "2d ago", status: "current", audience: "IR Team / Legal / Compliance", icon: Clock },
  { id: "after_action", title: "After-Action Report (AAR)", description: "Structured post-incident analysis: root cause, contributing factors, gaps exposed, corrective actions assigned, and playbook update recommendations.", cadence: "Post-incident (within 72h)", lastGenerated: "2d ago", status: "current", audience: "IR Lead / CISO / GRC", icon: FileText },
  { id: "drill_summary", title: "Resilience Drill Summary", description: "Outcomes of tabletop or red/purple team exercise: scenario tested, gaps identified, detection coverage, response timing, and remediation assignments.", cadence: "Post-exercise", lastGenerated: "3w ago", status: "stale", audience: "IR Team / CISO / Board", icon: Shield },
];

const SAMPLE_INCIDENT_BRIEF = {
  incidentId: "INC-0041",
  title: "Active Lateral Movement — PROD-EAST Segment",
  generatedAt: "2025-04-03T14:22:00Z",
  severity: "critical",
  currentStatus: "containment",
  assignedAnalyst: "J. Chen",
  confidence: "HIGH",
  assumptions: ["Attacker pivoted from compromised SVC-ACCNT-04", "DC-PROD-03 is the primary beachhead"],
  evidenceSummary: [
    "Anomalous SMB lateral movement detected from SVC-ACCNT-04 to DC-PROD-03 at 13:48 UTC",
    "Memory artifacts indicate credential dumping tool (Mimikatz signature) on DC-PROD-03",
    "Network isolation of DC-PROD-03 requested at 13:54 UTC — approval pending",
  ],
  actionsCompleted: ["Alert triage — severity confirmed CRITICAL (13:50 UTC)", "Perimeter block for 103.45.18.22 (13:56 UTC)"],
  actionsPending: ["Network isolation DC-PROD-03 — awaiting approval", "Credential rotation SVC-ACCNT-04"],
  immediateRisk: "Active attacker with valid credentials in PROD segment. Risk of data exfiltration or ransomware deployment if containment delayed.",
  recommendation: "Approve network isolation immediately. Escalate to IR Lead if approval not received within 15 minutes.",
};

export default function ExecutiveReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [generating, setGenerating] = useState<ReportType | null>(null);

  function handleGenerate(id: ReportType) {
    setGenerating(id);
    setTimeout(() => {
      setGenerating(null);
      setSelectedReport(id);
    }, 1800);
  }

  const active = REPORTS.find(r => r.id === selectedReport);

  return (
    <div className="min-h-screen bg-[#07090d] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <FileText size={22} className="text-amber-400" />
          <h1 className="text-xl font-bold text-white font-mono tracking-tight">Executive Reports</h1>
        </div>
        <p className="text-xs text-[#8b9ab0] font-mono mb-8">Incident brief · Daily digest · Weekly risk · Board summary · Control-gap memo · Incident timeline · AAR · Drill summary</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            {REPORTS.map(r => (
              <button key={r.id} onClick={() => selectedReport === r.id ? setSelectedReport(null) : setSelectedReport(r.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedReport === r.id ? "bg-amber-400/10 border-amber-400/40" : "bg-[#0d1117] border-[#1e2a3a] hover:border-[#2e3a4a]"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-mono font-bold ${r.status === "current" ? "bg-green-500/20 text-green-400" : r.status === "stale" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"}`}>{r.status === "current" ? "Current" : r.status === "stale" ? "Stale" : "Generating"}</span>
                    </div>
                    <p className="text-sm font-semibold text-white leading-tight">{r.title}</p>
                    <p className="text-xs text-[#8b9ab0] font-mono">{r.cadence}</p>
                    <p className="text-xs text-[#8b9ab0]/60 font-mono">Last: {r.lastGenerated}</p>
                  </div>
                  <ChevronRight size={14} className={`text-[#8b9ab0] mt-1 shrink-0 transition-transform ${selectedReport === r.id ? "rotate-90" : ""}`} />
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            {!selectedReport && !generating && (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center space-y-3">
                <FileText size={40} className="text-[#1e2a3a]" />
                <p className="text-sm text-[#8b9ab0] font-mono">Select a report to preview or generate</p>
              </div>
            )}

            {generating && (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] space-y-4">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-amber-400 font-mono">Generating report...</p>
                <p className="text-xs text-[#8b9ab0] font-mono">Assembling evidence · Scoring confidence · Structuring output</p>
              </div>
            )}

            {selectedReport && !generating && selectedReport === "incident_brief" && (
              <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-mono font-bold">CRITICAL</span>
                      <span className="text-xs text-[#8b9ab0] font-mono">{SAMPLE_INCIDENT_BRIEF.incidentId}</span>
                    </div>
                    <h2 className="text-base font-bold text-white">{SAMPLE_INCIDENT_BRIEF.title}</h2>
                    <p className="text-xs text-[#8b9ab0] font-mono mt-1">Generated: {new Date(SAMPLE_INCIDENT_BRIEF.generatedAt).toLocaleString()} · Analyst: {SAMPLE_INCIDENT_BRIEF.assignedAnalyst}</p>
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-2 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs rounded-lg font-mono hover:bg-amber-400/30 transition-colors">
                    <Download size={12} /> Export PDF
                  </button>
                </div>

                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-xs text-red-300 font-mono leading-relaxed"><strong>Immediate Risk:</strong> {SAMPLE_INCIDENT_BRIEF.immediateRisk}</p>
                </div>

                <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded-lg">
                  <p className="text-xs text-amber-200 font-mono"><strong>Recommendation:</strong> {SAMPLE_INCIDENT_BRIEF.recommendation}</p>
                </div>

                <div>
                  <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-2">Evidence Summary</h3>
                  <div className="space-y-2">
                    {SAMPLE_INCIDENT_BRIEF.evidenceSummary.map((e, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-[#0a0f16] rounded border border-[#1e2a3a]">
                        <Eye size={12} className="text-amber-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-white">{e}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-2">Actions Completed</h3>
                    <div className="space-y-1.5">
                      {SAMPLE_INCIDENT_BRIEF.actionsCompleted.map((a, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle2 size={12} className="text-green-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-[#8b9ab0]">{a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs text-[#8b9ab0] uppercase tracking-widest font-mono mb-2">Actions Pending</h3>
                    <div className="space-y-1.5">
                      {SAMPLE_INCIDENT_BRIEF.actionsPending.map((a, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Clock size={12} className="text-amber-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-amber-200">{a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Info size={12} className="text-blue-400" />
                    <span className="text-xs text-blue-400 font-mono font-bold">Confidence: {SAMPLE_INCIDENT_BRIEF.confidence}</span>
                  </div>
                  <p className="text-xs text-[#8b9ab0] font-mono">Assumptions: {SAMPLE_INCIDENT_BRIEF.assumptions.join("; ")}</p>
                </div>
              </div>
            )}

            {selectedReport && !generating && selectedReport !== "incident_brief" && active && (
              <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${active.status === "current" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}`}>{active.status === "current" ? "Current" : "Stale"}</span>
                    </div>
                    <h2 className="text-base font-bold text-white">{active.title}</h2>
                    <p className="text-xs text-[#8b9ab0] font-mono mt-1">Audience: {active.audience} · Last: {active.lastGenerated}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleGenerate(active.id)} className="flex items-center gap-1.5 px-3 py-2 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs rounded-lg font-mono hover:bg-amber-400/30 transition-colors">
                      Generate Now
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-[#0a0f16] border border-[#1e2a3a] text-[#8b9ab0] text-xs rounded-lg font-mono hover:text-white transition-colors">
                      <Download size={12} /> Export
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[#8b9ab0]">{active.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Cadence", value: active.cadence },
                    { label: "Audience", value: active.audience },
                    { label: "Last Generated", value: active.lastGenerated },
                    { label: "Confidence Labeled", value: "Yes — all AI assertions" },
                    { label: "Evidence Included", value: "Yes — inline citations" },
                    { label: "Assumptions Visible", value: "Yes — clearly separated" },
                  ].map(m => (
                    <div key={m.label} className="p-3 bg-[#0a0f16] rounded border border-[#1e2a3a]">
                      <p className="text-xs text-[#8b9ab0] font-mono">{m.label}</p>
                      <p className="text-xs text-white font-mono mt-0.5">{m.value}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-xs text-blue-300 font-mono">All generated reports include: confidence level, evidence citations, assumptions, and current vs planned capability labels. No claims are generated without retrieval support.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
