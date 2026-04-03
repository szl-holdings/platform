import { Shield, Scale, Eye, Lock, FileCheck, Users, AlertTriangle } from "lucide-react";

const PRINCIPLES = [
  {
    icon: Eye,
    title: "Source-Grounded Assertions",
    description: "Every AI-generated assertion is traceable to source data or explicitly flagged as inference. No invented citations, no unstated assumptions presented as facts.",
  },
  {
    icon: Lock,
    title: "Privilege-Aware Architecture",
    description: "Privilege-sensitive content is matter-scoped and access-controlled. The system respects attorney-client privilege boundaries and prevents cross-matter information leakage.",
  },
  {
    icon: Shield,
    title: "Human-in-the-Loop Governance",
    description: "All externally consequential actions require explicit human approval. AI outputs are recommendations — humans confirm before execution.",
  },
  {
    icon: FileCheck,
    title: "Immutable Audit Trail",
    description: "Every action, recommendation, approval, and access event is logged with actor attribution, timestamp, and context. The audit trail is an operational tool, not a compliance artifact.",
  },
  {
    icon: Users,
    title: "Role-Based Access Control",
    description: "Organization-scoped, role-based access ensures that attorneys, paralegals, partners, and staff see only what their role permits. No global access by default.",
  },
  {
    icon: AlertTriangle,
    title: "Confidence and Provenance",
    description: "Every forecast, recommendation, and AI output includes confidence level, contributing signals, and source freshness. Low-confidence outputs are visually marked and require human review.",
  },
];

export default function TrustPage() {
  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">Trust & Governance</h1>
        </div>
        <p className="text-xs text-slate-500">How PRISM Counsel handles data, AI, privilege, and accountability</p>
      </div>

      <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
        <h2 className="text-sm font-semibold text-slate-200 mb-2">What PRISM Counsel Is</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          PRISM Counsel is a matter observability and governed execution platform. It improves visibility into matter health, readiness, and trajectory. It does not replace legal judgment, draft filings autonomously, or make settlement decisions. Every consequential action requires attorney review and approval.
        </p>
      </div>

      <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
        <h2 className="text-sm font-semibold text-slate-200 mb-2">What PRISM Counsel Is Not</h2>
        <ul className="space-y-1.5 text-xs text-slate-400">
          <li>Not a replacement for legal research platforms (Westlaw, Lexis)</li>
          <li>Not an autonomous filing or drafting system</li>
          <li>Not a source of legal advice</li>
          <li>Not a system that makes settlement or litigation decisions</li>
          <li>Not an unaudited AI assistant — every output is traced and reviewable</li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PRINCIPLES.map((p, i) => {
          const Icon = p.icon;
          return (
            <div key={i} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-[#d4a054]" />
                <h3 className="text-xs font-semibold text-slate-200">{p.title}</h3>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">{p.description}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
        <h2 className="text-sm font-semibold text-slate-200 mb-2">AI Usage Model</h2>
        <div className="space-y-2 text-xs text-slate-400">
          <p>PRISM Counsel uses AI for signal analysis, forecasting, and recommendation generation. All AI outputs follow these rules:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>No invented legal citations</li>
            <li>Every assertion traceable to source data or flagged as inference</li>
            <li>Confidence levels displayed on all generated outputs</li>
            <li>Raw model output preserved in audit trail</li>
            <li>Human approval required before any consequential action</li>
            <li>Generated content visually distinct from source truth</li>
          </ul>
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
        <h2 className="text-sm font-semibold text-slate-200 mb-2">PRISM Observability Pillars</h2>
        <div className="grid grid-cols-3 gap-3 mt-3">
          {[
            { name: "Posture", desc: "Liability, coverage, venue, opposing counsel assessment" },
            { name: "Readiness", desc: "Demand, discovery, deposition, mediation, trial readiness" },
            { name: "Integrity", desc: "Source lineage, privilege risk, deadline completeness" },
            { name: "Strategy", desc: "Next best actions, leverage points, evidence gaps" },
            { name: "Money", desc: "Settlement forecasting, lien exposure, damages completeness" },
            { name: "Governance", desc: "Approval state, AI trace, role attribution, access scope" },
          ].map((p, i) => (
            <div key={i} className="rounded border border-white/[0.04] p-2.5" style={{ background: "#080c14" }}>
              <div className="text-[11px] font-medium text-[#d4a054]">{p.name}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
