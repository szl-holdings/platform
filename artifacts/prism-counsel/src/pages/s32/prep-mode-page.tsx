import { useState } from "react";
import { BookOpen, FileText, AlertTriangle, CheckCircle, ChevronRight, Download, Clock, TrendingUp, MessageSquare, Shield, Users, Briefcase, ArrowRight, XCircle, Building2 } from "lucide-react";
import { Link } from "wouter";
import { DEMO_MATTERS } from "../../data/demo-matters";

const PREP_FLOWS = [
  {
    id: "demand",
    label: "Demand Prep",
    description: "Assemble everything needed before sending a demand package",
    icon: FileText,
    accent: "#d4a054",
    steps: ["Source facts", "Damages summary", "Missing records", "Offer trail", "Export safety check"],
  },
  {
    id: "mediation",
    label: "Mediation Prep",
    description: "Build your mediation package — facts, forecast, posture",
    icon: MessageSquare,
    accent: "#4a90b8",
    steps: ["Case narrative", "Settlement range", "Insurer posture", "Liability summary", "Mediation memo"],
  },
  {
    id: "deposition",
    label: "Deposition Prep",
    description: "Organize witness facts, contradictions, and key lines",
    icon: Users,
    accent: "#8b7ac8",
    steps: ["Witness profile", "Key facts", "Known contradictions", "Question outline", "Supporting documents"],
  },
  {
    id: "coverage",
    label: "Coverage Review",
    description: "Review policy coverage, exclusions, and reservation of rights",
    icon: Shield,
    accent: "#c45a4a",
    steps: ["Policy summary", "Coverage positions", "ROR letters", "Exclusion review", "Recommendations"],
  },
  {
    id: "no-fault",
    label: "No-Fault Packet Prep",
    description: "Assemble no-fault verification and claim packet",
    icon: AlertTriangle,
    accent: "#c8953c",
    steps: ["NF-2 verification", "Medical authorizations", "Lost wage forms", "IME responses", "Appeal eligibility"],
  },
  {
    id: "partner-update",
    label: "Partner Update Prep",
    description: "Prepare a clear, factual partner update on matter status",
    icon: Briefcase,
    accent: "#6b7280",
    steps: ["Status summary", "Key developments", "Risk flags", "Next steps", "Approval needs"],
  },
];

const DEMAND_PREP_DATA = {
  matterId: 1,
  matterTitle: "Rodriguez v. National General Insurance",
  caseNumber: "2025-CV-04821",
  readiness: 74,
  sourceFacts: [
    { fact: "Motor vehicle accident — Queens Blvd, Jan 15, 2025", source: "Police Report #2024-QN-4782", confidence: 0.99, status: "verified" },
    { fact: "L4-L5 disc herniation confirmed by MRI", source: "Queens Medical Center, Feb 8 2025", confidence: 0.97, status: "verified" },
    { fact: "3x/week physical therapy — Queens PT Associates", source: "PT billing records", confidence: 0.95, status: "verified" },
    { fact: "IME consistent with treating physician", source: "Dr. Whitmore IME, Mar 30 2025", confidence: 0.95, status: "verified" },
    { fact: "Reserve increased from $15K to $28K", source: "National General correspondence", confidence: 0.98, status: "verified" },
  ],
  missingItems: [
    { item: "Lost wage verification", reason: "Employer has not responded to verification request (14 days outstanding)", severity: "high" },
    { item: "Medical records — Dr. Perez (treating spine specialist)", reason: "Records requested 21 days ago. No response received.", severity: "high" },
    { item: "Property damage appraisal", reason: "PD appraisal not yet in matter file", severity: "medium" },
  ],
  contradictions: [
    { item: "Medical expense total: demand draft shows $42,800, billing summary shows $39,200", recommendation: "Reconcile $3,600 discrepancy before sending" },
  ],
  exportSafety: {
    score: 72,
    blockers: ["Lost wage verification missing", "Medical record gap (Dr. Perez)"],
    warnings: ["Expense discrepancy not reconciled"],
    cleared: ["Liability established", "IME consistent", "Reserve increase documented"],
  },
};

export default function PrepModePage() {
  const [activeFlow, setActiveFlow] = useState<string | null>(null);
  const [activeMatter, setActiveMatter] = useState<number>(1);

  if (activeFlow === "demand") {
    return <DemandPrepFlow onBack={() => setActiveFlow(null)} />;
  }

  if (activeFlow === "mediation") {
    return <MediationPrepFlow onBack={() => setActiveFlow(null)} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-[#8b7ac8]" />
          <h1 className="text-lg font-semibold text-slate-100">Prep Mode</h1>
        </div>
        <p className="text-xs text-slate-500">Auto-assemble everything you need before key legal events — facts, gaps, contradictions, export safety</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PREP_FLOWS.map(flow => {
          const Icon = flow.icon;
          return (
            <button
              key={flow.id}
              onClick={() => setActiveFlow(flow.id)}
              className="text-left rounded-lg border border-white/[0.06] p-4 hover:border-white/[0.12] transition-colors cursor-pointer"
              style={{ background: "#0c1220" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: flow.accent + "15" }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: flow.accent }} />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-200">{flow.label}</div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 ml-auto" />
              </div>
              <p className="text-[11px] text-slate-500 mb-2">{flow.description}</p>
              <div className="flex items-center gap-1 flex-wrap">
                {flow.steps.map((step, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded text-[9px] bg-white/[0.04] text-slate-500">{step}</span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Prep Windows — What's Available</h3>
        <div className="space-y-2">
          {DEMO_MATTERS.map(m => {
            const daysToNextEvent = Math.min(...(m.deadlines || []).map(d => Math.ceil((new Date(d.date).getTime() - Date.now()) / 86400000)).filter(d => d > 0));
            const readiness = m.healthScore;
            return (
              <div key={m.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ background: readiness >= 70 ? "#4a90b815" : readiness >= 50 ? "#d4a05415" : "#c45a4a15", color: readiness >= 70 ? "#4a90b8" : readiness >= 50 ? "#d4a054" : "#c45a4a" }}>
                  {readiness}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-200 truncate">{m.title}</div>
                  <div className="text-[10px] text-slate-500">{m.status.replace("_", " ")} · {m.jurisdiction}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isNaN(daysToNextEvent) && daysToNextEvent < 30 && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${daysToNextEvent <= 7 ? "bg-[#c45a4a]/10 text-[#c45a4a]" : "bg-[#d4a054]/10 text-[#d4a054]"}`}>
                      {daysToNextEvent}d to next event
                    </span>
                  )}
                  <button onClick={() => { setActiveMatter(m.id); setActiveFlow("demand"); }}
                    className="px-2 py-0.5 rounded text-[10px] bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200 transition-colors">
                    Prep
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DemandPrepFlow({ onBack }: { onBack: () => void }) {
  const d = DEMAND_PREP_DATA;
  const safetyColor = d.exportSafety.score >= 80 ? "#4a90b8" : d.exportSafety.score >= 60 ? "#d4a054" : "#c45a4a";

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1 transition-colors">
          ← Back
        </button>
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#d4a054]" />
            <h1 className="text-base font-semibold text-slate-100">Demand Prep — {d.matterTitle.split(" v. ")[0]}</h1>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">{d.caseNumber} · Demand readiness: <span style={{ color: safetyColor }}>{d.readiness}%</span></p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <PrepCard title="Source Facts" icon={<CheckCircle className="w-3.5 h-3.5 text-[#4a90b8]" />} count={d.sourceFacts.length} status="good">
          {d.sourceFacts.map((f, i) => (
            <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
              <CheckCircle className="w-3 h-3 text-[#4a90b8] mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] text-slate-200 leading-tight">{f.fact}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">{f.source} · {Math.round(f.confidence * 100)}%</div>
              </div>
            </div>
          ))}
        </PrepCard>

        <PrepCard title="Missing Items" icon={<AlertTriangle className="w-3.5 h-3.5 text-[#c45a4a]" />} count={d.missingItems.length} status="bad">
          {d.missingItems.map((m, i) => (
            <div key={i} className="py-1.5 border-b border-white/[0.04] last:border-0">
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${m.severity === "high" ? "bg-[#c45a4a]" : "bg-[#d4a054]"}`} />
                <span className="text-[11px] text-slate-200">{m.item}</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-0.5 ml-3">{m.reason}</p>
            </div>
          ))}
        </PrepCard>

        <PrepCard title="Contradictions" icon={<XCircle className="w-3.5 h-3.5 text-[#d4a054]" />} count={d.contradictions.length} status={d.contradictions.length > 0 ? "warn" : "good"}>
          {d.contradictions.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No contradictions detected</p>
          ) : d.contradictions.map((c, i) => (
            <div key={i} className="py-1.5">
              <p className="text-[11px] text-[#d4a054]">{c.item}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Recommended: {c.recommendation}</p>
            </div>
          ))}
        </PrepCard>

        <PrepCard title="Export Safety" icon={<Shield className="w-3.5 h-3.5" style={{ color: safetyColor }} />} count={null} status={d.exportSafety.score >= 80 ? "good" : d.exportSafety.score >= 60 ? "warn" : "bad"}>
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500">Demand Safety</span>
              <span className="text-sm font-bold font-mono" style={{ color: safetyColor }}>{d.exportSafety.score}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full transition-all" style={{ width: `${d.exportSafety.score}%`, background: safetyColor }} />
            </div>
          </div>
          {d.exportSafety.blockers.map((b, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] text-[#c45a4a] py-0.5">
              <XCircle className="w-2.5 h-2.5 flex-shrink-0" /> {b}
            </div>
          ))}
          {d.exportSafety.warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] text-[#d4a054] py-0.5">
              <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0" /> {w}
            </div>
          ))}
          {d.exportSafety.cleared.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] text-[#4a90b8] py-0.5">
              <CheckCircle className="w-2.5 h-2.5 flex-shrink-0" /> {c}
            </div>
          ))}
        </PrepCard>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border border-white/[0.08]" style={{ background: "#0c1220" }}>
        <div>
          <div className="text-sm font-medium text-slate-200">Ready to proceed?</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {d.exportSafety.score >= 80 ? "Demand is ready for review and sign-off" :
             d.exportSafety.score >= 60 ? "Demand can proceed with noted caveats — address blockers first" :
             "Demand is not ready — resolve blockers before proceeding"}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/review-before-send">
            <button className="px-3 py-1.5 rounded text-xs font-medium bg-white/[0.06] text-slate-300 hover:bg-white/[0.10] transition-colors">
              Go to Review
            </button>
          </Link>
          <Link href="/word-export">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium hover:opacity-80 transition-opacity" style={{ background: safetyColor + "20", color: safetyColor, border: `1px solid ${safetyColor}40` }}>
              <Download className="w-3 h-3" /> Export Draft
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function MediationPrepFlow({ onBack }: { onBack: () => void }) {
  const m = DEMO_MATTERS[2];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1 transition-colors">
          ← Back
        </button>
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#4a90b8]" />
            <h1 className="text-base font-semibold text-slate-100">Mediation Prep — {m.title.split(" v. ")[0]}</h1>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">{m.caseNumber} · Mediation: 19 days</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Settlement Range" value={`$${(m.settlementLow/1000).toFixed(0)}K – $${(m.settlementHigh/1000).toFixed(0)}K`} sub={`Mid: $${(m.settlementMid/1000).toFixed(0)}K`} color="#d4a054" />
        <MetricCard label="Matter Readiness" value={`${m.healthScore}%`} sub="Health score across 6 pillars" color={m.healthScore >= 70 ? "#4a90b8" : "#d4a054"} />
        <MetricCard label="Days to Mediation" value="19" sub="April 22, 2026" color="#c45a4a" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <PrepCard title="Liability Summary" icon={<Shield className="w-3.5 h-3.5 text-[#4a90b8]" />} count={null} status="good">
          <div className="space-y-2 text-[11px]">
            <div><span className="text-slate-500">Incident:</span> <span className="text-slate-300">Rear-end collision, Queens Blvd — clear liability</span></div>
            <div><span className="text-slate-500">Police report:</span> <span className="text-slate-300">Filed, defendant at fault noted</span></div>
            <div><span className="text-slate-500">Witnesses:</span> <span className="text-slate-300">2 identified, 1 statement obtained</span></div>
            <div><span className="text-slate-500">IME:</span> <span className="text-slate-300">Consistent with treating physician findings</span></div>
          </div>
        </PrepCard>

        <PrepCard title="Insurer Posture" icon={<Building2 className="w-3.5 h-3.5 text-[#c8953c]" />} count={null} status="warn">
          <div className="space-y-2 text-[11px]">
            <div><span className="text-slate-500">Reserve:</span> <span className="text-slate-300">Raised to $28K — signals reassessment</span></div>
            <div><span className="text-slate-500">Last offer:</span> <span className="text-slate-300">$95K (Jan 18) — 42% below demand</span></div>
            <div><span className="text-slate-500">Response lag:</span> <span className="text-[#d4a054]">21 days — above firm threshold</span></div>
            <div><span className="text-slate-500">Adjuster:</span> <span className="text-slate-300">Lisa Park — assigned 6 months</span></div>
          </div>
        </PrepCard>

        <PrepCard title="Mediation Memo" icon={<FileText className="w-3.5 h-3.5 text-[#c45a4a]" />} count={null} status="bad">
          <div className="text-center py-4">
            <AlertTriangle className="w-6 h-6 text-[#c45a4a] mx-auto mb-2" />
            <p className="text-xs text-slate-400">Mediation memo not yet drafted</p>
            <p className="text-[10px] text-slate-500 mt-1">19 days until mediation</p>
            <button className="mt-3 px-3 py-1.5 rounded text-xs font-medium bg-[#4a90b8]/10 text-[#4a90b8] hover:bg-[#4a90b8]/20 transition-colors">
              Start with Workbench
            </button>
          </div>
        </PrepCard>

        <PrepCard title="Missing Before Mediation" icon={<AlertTriangle className="w-3.5 h-3.5 text-[#d4a054]" />} count={3} status="warn">
          {[
            { item: "Mediation memo", priority: "critical" },
            { item: "Lost wage documentation", priority: "high" },
            { item: "Revised demand calculation", priority: "high" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
              <div className={`w-1.5 h-1.5 rounded-full ${item.priority === "critical" ? "bg-[#c45a4a]" : "bg-[#d4a054]"}`} />
              <span className="text-[11px] text-slate-300">{item.item}</span>
            </div>
          ))}
        </PrepCard>
      </div>
    </div>
  );
}

function PrepCard({ title, icon, count, status, children }: { title: string; icon: React.ReactNode; count: number | null; status: "good" | "warn" | "bad"; children: React.ReactNode }) {
  const statusColors = { good: "border-[#4a90b8]/20", warn: "border-[#d4a054]/20", bad: "border-[#c45a4a]/20" };
  return (
    <div className={`rounded-lg border p-4 ${statusColors[status]}`} style={{ background: "#0c1220" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{title}</span>
        </div>
        {count !== null && <span className="text-[10px] text-slate-500">{count} items</span>}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-lg font-semibold font-mono" style={{ color }}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}
