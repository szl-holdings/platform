import { Shield, Eye, Lock, FileCheck, Users, AlertTriangle, Scale, CheckCircle } from "lucide-react";

const GOVERNANCE_POLICIES = [
  {
    id: "ai_review",
    icon: Eye,
    title: "AI Review & Verification Policy",
    content: [
      "All AI-generated content in PRISM Counsel NY undergoes a mandatory three-stage review before any use in matter strategy or external communication.",
      "Stage 1 — Grounding check: system verifies every assertion links to a specific source record in the matter file. Ungrounded assertions are flagged automatically.",
      "Stage 2 — Attorney review: assigned attorney reviews all flagged assertions, accepts or rejects proposed changes, and signs off on verified content.",
      "Stage 3 — Partner approval: any AI content used in external communications, demand packages, or court filings requires supervising partner approval with timestamped record.",
    ],
  },
  {
    id: "human_approval",
    icon: CheckCircle,
    title: "Human Approval Requirements",
    content: [
      "Demand send — partner approval required before any demand letter is transmitted to insurer",
      "Settlement acceptance — client and partner must both approve before any settlement is confirmed",
      "External communications — any AI-drafted external communication requires attorney review and approval",
      "Court filings — supervising partner must approve all AI-assisted filing content before submission",
      "Expert engagement — attorney approval required before retaining or relying on AI-recommended expert",
      "AI defensibility score < 80 — any matter below this threshold requires remediation review before approval gates can be cleared",
    ],
  },
  {
    id: "source_grounding",
    icon: FileCheck,
    title: "Source-Grounding Standard",
    content: [
      "Every AI assertion must cite a specific source record, document, or data point in the matter file.",
      "Citation format includes: document name, date, page/section reference, and record ID in PRISM database.",
      "Inferences — conclusions not directly supported by a source document — must be explicitly labeled as 'INFERENCE' and require attorney review before use.",
      "The grounding score (0–100) reflects the percentage of assertions fully grounded to source. A score below 70 blocks the review workflow until remediated.",
      "Source freshness: citations older than 90 days are flagged for reverification before use in strategy decisions.",
    ],
  },
  {
    id: "privilege_controls",
    icon: Lock,
    title: "Privileged Content Controls",
    content: [
      "All PRISM Counsel records carry a privilege classification: public, internal, attorney-client, or work product.",
      "Privilege-classified records are excluded from Copilot connector responses unless explicitly unlocked by an attorney for a specific session.",
      "Cross-matter privilege isolation: privileged content from one matter is never accessible to users working on a different matter.",
      "AI outputs generated from privileged source material inherit the privilege classification of the highest-classified source used.",
      "Export packages are scrubbed of privileged content automatically — privileged documents require explicit inclusion approval before export.",
    ],
  },
  {
    id: "export_redaction",
    icon: Users,
    title: "Export & Redaction Workflow",
    content: [
      "All data exports from PRISM Counsel NY trigger an automated redaction workflow before any document leaves the system.",
      "Redaction logic identifies: client PII, SSN/DOB fields, settlement authority, privileged strategy memos, and AI-generated content not yet approved for external use.",
      "Exports require: attorney approval + export purpose logging + recipient identity confirmation.",
      "Audit trail: every export is recorded with actor identity, timestamp, intended recipient, redaction log, and approval chain.",
      "Post-export verification: system confirms redacted fields against export template before delivery.",
    ],
  },
  {
    id: "matter_access",
    icon: Scale,
    title: "Matter-Scoped Access Model",
    content: [
      "Access to any matter record is scoped to users explicitly assigned to that matter — by role.",
      "Role hierarchy: Staff → Paralegal → Associate Attorney → Supervising Attorney → Partner → System Admin.",
      "Each role has a defined read/write/approve permission matrix per record type.",
      "Matter access cannot be granted by non-partner roles — all access grants require partner or admin action.",
      "Access is revoked automatically on matter closure or role change. Revocation is retroactive — no passive read access survives role termination.",
    ],
  },
  {
    id: "copilot_guardrails",
    icon: AlertTriangle,
    title: "Copilot Usage Guardrails",
    content: [
      "PRISM Copilot is a research and summarization tool — it does not make strategic decisions or draft external communications autonomously.",
      "All Copilot outputs are clearly labeled as AI-generated and include confidence level, source citations, and generation timestamp.",
      "Copilot is blocked from: drafting court filings, opining on settlement values outside the forecast model, referencing records outside its permitted scope, or making privilege determinations.",
      "Users may not share raw Copilot outputs externally without attorney review — doing so bypasses the approval workflow and is flagged in the audit log.",
      "Copilot sessions are recorded: input query, retrieved sources, generated response, and user action (accepted/edited/rejected) are all logged.",
    ],
  },
  {
    id: "generated_vs_source",
    icon: Eye,
    title: "Generated vs. Source Content Separation",
    content: [
      "PRISM Counsel maintains strict visual and data-layer separation between AI-generated content and verified source records.",
      "In all UI views: AI-generated content is displayed with an amber 'AI' badge; source records display a blue 'SOURCE' badge.",
      "In exported documents: generated content is watermarked 'AI-GENERATED — ATTORNEY REVIEW REQUIRED' until approved.",
      "In the database: all records carry a sourceLineage field indicating whether the record was ingested from source, generated by AI, or manually created by a user.",
      "Generated content that has passed the full review workflow is marked 'REVIEWED + APPROVED' with timestamp and reviewer identity — the AI badge is retired at that point.",
    ],
  },
];

export default function NyTrustPage() {
  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">NY Trust & Governance</h1>
        </div>
        <p className="text-xs text-slate-500">AI review policy, human approval requirements, source-grounding standard, privileged content controls, and export/redaction workflow</p>
      </div>

      <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
        <h2 className="text-sm font-semibold text-slate-200 mb-2">What PRISM Counsel NY Governance Is</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          PRISM Counsel NY extends the base PRISM Counsel governance framework with New York-specific controls for insurance litigation: mandatory clock-breach escalations, no-fault verification compliance, disclaimer timeliness audit trails, and insurer communication silence detection — all governed by the same source-grounding, privilege-isolation, and human-approval architecture as the base platform. Every AI output in the NY layer is traceable, reviewable, and requires attorney sign-off before informing any matter decision.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {GOVERNANCE_POLICIES.map((policy, i) => {
          const Icon = policy.icon;
          return (
            <div key={i} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-[#d4a054]" />
                <h3 className="text-xs font-semibold text-slate-200">{policy.title}</h3>
              </div>
              <div className="space-y-1.5">
                {policy.content.map((point, pi) => (
                  <div key={pi} className="flex items-start gap-2 text-[10px] text-slate-400 leading-relaxed">
                    <div className="w-1 h-1 rounded-full bg-[#d4a054]/60 flex-shrink-0 mt-1.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
        <h2 className="text-sm font-semibold text-slate-200 mb-3">NY-Specific Governance Controls</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: "No-Fault Clock Audit", desc: "All NY statutory clocks logged with breach detection, source citations, and auto-escalation" },
            { name: "Disclaimer Timeliness Log", desc: "Disclaimer dates, basis, and challenge status tracked with Insurance Law § 3420(d)(2) compliance" },
            { name: "EUO / Verification Compliance", desc: "Verification request scheduling and attendance documented — suspension risk auto-flagged" },
            { name: "Insurer Silence Log", desc: "Communication silence tracked with timestamps — escalation triggered at configurable thresholds" },
            { name: "Offer Movement Audit", desc: "Every offer and counter-offer logged with actor attribution and reserve movement correlation" },
            { name: "Mediation Authority Record", desc: "Client authority and partner approval documented before every mediation session" },
          ].map((item, i) => (
            <div key={i} className="rounded border border-white/[0.04] p-2.5" style={{ background: "#080c14" }}>
              <div className="text-[11px] font-medium text-[#d4a054] mb-0.5">{item.name}</div>
              <div className="text-[9px] text-slate-500">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h2 className="text-sm font-semibold text-slate-200 mb-2">AI Defensibility Score Methodology</h2>
        <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
          Each NY matter carries an AI Defensibility Score (0–100) computed weekly across five dimensions. A score below 80 triggers a governance review flag that blocks demand approval until remediated.
        </p>
        <div className="grid grid-cols-5 gap-2">
          {[
            { name: "Source Grounding", weight: "25%" },
            { name: "Human Approval Chain", weight: "25%" },
            { name: "Privilege Integrity", weight: "20%" },
            { name: "Audit Completeness", weight: "20%" },
            { name: "Actor Attribution", weight: "10%" },
          ].map((dim, i) => (
            <div key={i} className="rounded border border-white/[0.04] p-2 text-center" style={{ background: "#080c14" }}>
              <div className="text-[11px] font-medium text-[#d4a054]">{dim.weight}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{dim.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
