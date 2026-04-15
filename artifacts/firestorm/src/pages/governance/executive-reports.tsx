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
  audience: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const REPORTS: Report[] = [
  { id: "incident_brief", title: "Executive Incident Brief", description: "Current incident status, severity, containment actions taken, and immediate risk to operations. Includes evidence summary and analyst confidence.", cadence: "On-demand / triggered by P1/P2", audience: "CISO / Executive Sponsor", icon: Shield },
  { id: "daily_digest", title: "Daily Posture Digest", description: "24-hour security posture summary: new incidents, resolved findings, open approvals, alert volume, MTTD/MTTR against targets.", cadence: "Daily at 07:00", audience: "SOC Lead / CISO", icon: Calendar },
  { id: "weekly_risk", title: "Weekly Risk Report", description: "7-day risk trend analysis: escalation rates, policy blocks, retrieval quality, model trust metrics, control coverage deltas.", cadence: "Weekly — Monday", audience: "CISO / Risk Committee", icon: TrendingUp },
  { id: "board_summary", title: "Board-Ready Summary", description: "Non-technical risk posture summary for board consumption. Key risk indicators, control gaps, and strategic recommendations with confidence levels.", cadence: "Quarterly / on-demand", audience: "Board / C-Suite", icon: BarChart3 },
  { id: "control_gap", title: "Control-Gap Memo", description: "Mapping of current control coverage against NIST CSF / FedRAMP baseline. Gaps, owners, timelines, and compensating controls.", cadence: "Monthly", audience: "CISO / GRC Team", icon: AlertTriangle },
  { id: "incident_timeline", title: "Incident Timeline Report", description: "Full chronological timeline of a specific incident: detection, triage, escalation, containment, resolution. Includes all analyst actions and approval events.", cadence: "Post-incident", audience: "IR Team / Legal / Compliance", icon: Clock },
  { id: "after_action", title: "After-Action Report (AAR)", description: "Structured post-incident analysis: root cause, contributing factors, gaps exposed, corrective actions assigned, and playbook update recommendations.", cadence: "Post-incident (within 72h)", audience: "IR Lead / CISO / GRC", icon: FileText },
  { id: "drill_summary", title: "Resilience Drill Summary", description: "Outcomes of tabletop or red/purple team exercise: scenario tested, gaps identified, detection coverage, response timing, and remediation assignments.", cadence: "Post-exercise", audience: "IR Team / CISO / Board", icon: Shield },
];


export default function ExecutiveReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [generating, setGenerating] = useState<ReportType | null>(null);

  function handleGenerate(id: ReportType) {
    setGenerating(id);
    fetch(`/api/firestorm/reports/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ reportType: id }),
    }).finally(() => {
      setGenerating(null);
      setSelectedReport(id);
    });
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
                    <p className="text-sm font-semibold text-white leading-tight">{r.title}</p>
                    <p className="text-xs text-[#8b9ab0] font-mono">{r.cadence}</p>
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
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono font-bold">INCIDENT BRIEF</span>
                    </div>
                    <h2 className="text-base font-bold text-white">Active Incident Brief</h2>
                    <p className="text-xs text-[#8b9ab0] font-mono mt-1">Generated on demand from active incident pipeline</p>
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-2 bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs rounded-lg font-mono hover:bg-amber-400/30 transition-colors">
                    <Download size={12} /> Export PDF
                  </button>
                </div>
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                  <FileText size={36} className="text-[#1e2a3a]" />
                  <p className="text-sm text-[#8b9ab0] font-mono">No active incident</p>
                  <p className="text-xs text-[#8b9ab0]/60 font-mono max-w-xs">Select an active incident from the Incident Management module to generate a real-time incident brief with evidence, actions, and analyst assignments.</p>
                </div>
              </div>
            )}

            {selectedReport && !generating && selectedReport !== "incident_brief" && active && (
              <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white">{active.title}</h2>
                    <p className="text-xs text-[#8b9ab0] font-mono mt-1">Audience: {active.audience}</p>
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
