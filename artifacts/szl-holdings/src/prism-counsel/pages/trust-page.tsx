import { Shield, Scale, Eye, Lock, FileCheck, Users, AlertTriangle, Server, Download, Cpu, ChevronRight } from "lucide-react";
import { useState } from "react";

type TrustTab = "overview" | "security" | "governance" | "architecture" | "ai" | "exports";

const TABS: { key: TrustTab; label: string; icon: typeof Shield }[] = [
  { key: "overview", label: "Overview", icon: Shield },
  { key: "security", label: "Security", icon: Lock },
  { key: "governance", label: "Governance", icon: Scale },
  { key: "architecture", label: "Architecture", icon: Server },
  { key: "ai", label: "AI Usage", icon: Cpu },
  { key: "exports", label: "Exports & Redaction", icon: Download },
];

const PRINCIPLES = [
  { icon: Eye, title: "Source-Grounded Assertions", description: "Every AI-generated assertion is traceable to source data or explicitly flagged as inference. No invented citations, no unstated assumptions presented as facts." },
  { icon: Lock, title: "Privilege-Aware Architecture", description: "Privilege-sensitive content is matter-scoped and access-controlled. The system respects attorney-client privilege boundaries and prevents cross-matter information leakage." },
  { icon: Shield, title: "Human-in-the-Loop Governance", description: "All externally consequential actions require explicit human approval. AI outputs are recommendations — humans confirm before execution." },
  { icon: FileCheck, title: "Immutable Audit Trail", description: "Every action, recommendation, approval, and access event is logged with actor attribution, timestamp, and context. The audit trail is an operational tool, not a compliance artifact." },
  { icon: Users, title: "Role-Based Access Control", description: "Organization-scoped, role-based access ensures that attorneys, paralegals, partners, and staff see only what their role permits. No global access by default." },
  { icon: AlertTriangle, title: "Confidence and Provenance", description: "Every forecast, recommendation, and AI output includes confidence level, contributing signals, and source freshness. Low-confidence outputs are visually marked and require human review." },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
      <h2 className="text-sm font-semibold text-slate-200 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-xs text-slate-400">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <ChevronRight className="w-3 h-3 text-[#d4a054] mt-0.5 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function TrustPage() {
  const [tab, setTab] = useState<TrustTab>("overview");

  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">Trust & Governance Center</h1>
        </div>
        <p className="text-xs text-slate-500">How PRISM Counsel handles data, AI, privilege, security, and accountability</p>
      </div>

      <div className="flex gap-1 border-b border-white/[0.06] pb-px overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-t transition-colors whitespace-nowrap ${
              tab === t.key ? "bg-white/[0.06] text-slate-100 border-b-2 border-[#d4a054]" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          <Section title="What PRISM Counsel Is">
            <p className="text-xs text-slate-400 leading-relaxed">
              PRISM Counsel is a matter observability and governed execution platform for plaintiff-side litigation teams. It improves visibility into matter health, deadline compliance, insurer behavior patterns, and settlement readiness. It does not replace legal judgment, draft filings autonomously, or make settlement decisions. Every consequential action requires attorney review and approval.
            </p>
          </Section>
          <Section title="What PRISM Counsel Is Not">
            <BulletList items={[
              "Not a replacement for legal research platforms (Westlaw, Lexis)",
              "Not an autonomous filing or drafting system",
              "Not a source of legal advice — it is an operational intelligence tool",
              "Not a system that makes settlement or litigation decisions",
              "Not an unaudited AI assistant — every output is traced and reviewable",
              "Not a generic chatbot or drafting toy",
              "Not a case management system replacement — it is a command layer above case management",
            ]} />
          </Section>
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
          <Section title="PRISM Observability Pillars">
            <div className="grid grid-cols-3 gap-3">
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
          </Section>
        </div>
      )}

      {tab === "security" && (
        <div className="space-y-4">
          <Section title="Data Security Model">
            <BulletList items={[
              "All matter data is organization-scoped — no cross-tenant data access",
              "Role-based access control with principle of least privilege",
              "Session-based authentication with secure cookie management",
              "TLS encryption for all data in transit",
              "PostgreSQL with row-level access patterns for matter data isolation",
              "No client PII stored in AI model training pipelines",
              "Connector credentials encrypted at rest with per-tenant key management",
            ]} />
          </Section>
          <Section title="Access Control Matrix">
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-2 text-slate-400 font-medium">Role</th>
                    <th className="text-center py-2 text-slate-400 font-medium">View Matters</th>
                    <th className="text-center py-2 text-slate-400 font-medium">Edit Matters</th>
                    <th className="text-center py-2 text-slate-400 font-medium">Approve Actions</th>
                    <th className="text-center py-2 text-slate-400 font-medium">Access Privileged</th>
                    <th className="text-center py-2 text-slate-400 font-medium">Export Data</th>
                    <th className="text-center py-2 text-slate-400 font-medium">Admin Settings</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { role: "Partner", perms: [true, true, true, true, true, true] },
                    { role: "Lead Attorney", perms: [true, true, true, true, true, false] },
                    { role: "Associate", perms: [true, true, false, true, false, false] },
                    { role: "Paralegal", perms: [true, true, false, false, false, false] },
                    { role: "Staff", perms: [true, false, false, false, false, false] },
                  ].map((r) => (
                    <tr key={r.role} className="border-b border-white/[0.03]">
                      <td className="py-2 text-slate-300">{r.role}</td>
                      {r.perms.map((p, i) => (
                        <td key={i} className="text-center py-2">
                          <span style={{ color: p ? "#4a7a5a" : "#c45a4a" }}>{p ? "✓" : "—"}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
          <Section title="Privilege Handling">
            <BulletList items={[
              "Attorney-client privilege markers on communications and documents",
              "Privilege flags prevent AI from surfacing protected content in general queries",
              "Work product doctrine markers for internal analysis documents",
              "Privilege log generation support for discovery compliance",
              "Matter-scoped data boundaries prevent cross-matter privilege leakage",
            ]} />
          </Section>
        </div>
      )}

      {tab === "governance" && (
        <div className="space-y-4">
          <Section title="Human Approval Model">
            <p className="text-xs text-slate-400 mb-3">Every externally consequential action flows through a governed approval chain:</p>
            <BulletList items={[
              "Demand sends require lead attorney review and partner sign-off",
              "Settlement acceptance requires partner approval with documented rationale",
              "External communications require attorney review before transmission",
              "Expert engagement requires budget approval and conflict check",
              "Court filings require attorney review with privilege and accuracy check",
              "Client disclosures require lead attorney authorization",
              "AI-generated outputs require human review before any external use",
            ]} />
          </Section>
          <Section title="Audit Trail Architecture">
            <BulletList items={[
              "Every user action logged with actor ID, timestamp, and context",
              "Every AI recommendation logged with model route, confidence, and citations",
              "Every approval decision logged with approver, rationale, and source basis",
              "Every data access event logged for compliance reporting",
              "Every export operation logged with scope, format, and recipient",
              "Audit trail is immutable — no retroactive modification",
              "Audit data retained per organization retention policy",
            ]} />
          </Section>
          <Section title="Alloy Governance Integration">
            <p className="text-xs text-slate-400 leading-relaxed">
              PRISM Counsel governance is built on the Alloy execution fabric. Approval workflows, audit trails, and action routing leverage Alloy's orchestration engine, ensuring consistency with enterprise governance policies across the SZL Holdings platform.
            </p>
          </Section>
        </div>
      )}

      {tab === "architecture" && (
        <div className="space-y-4">
          <Section title="Platform Architecture">
            <p className="text-xs text-slate-400 mb-3">PRISM Counsel is built on the Lyte + Alloy platform spine:</p>
            <BulletList items={[
              "Lyte provides the command surface — dashboards, scoring, and visualization",
              "Alloy provides workflow orchestration, approval routing, and audit infrastructure",
              "PostgreSQL for structured matter data with Drizzle ORM",
              "Organization-scoped multi-tenancy with role-based access",
              "React + Vite frontend with lazy-loaded route modules",
              "Express 5 API server with Zod validation",
              "WebSocket support for real-time updates",
            ]} />
          </Section>
          <Section title="Connector Architecture">
            <BulletList items={[
              "Adapter pattern for external system integration (Microsoft 365, case management)",
              "Permission-aware retrieval — connectors respect source system ACLs",
              "Sync status tracking with partial failure handling",
              "Replayable ingestion — failed syncs can be retried without data loss",
              "Tenant-safe connector state — each organization has isolated connector config",
              "Connector health monitoring with automated alerting",
            ]} />
          </Section>
          <Section title="Data Model">
            <p className="text-xs text-slate-400 mb-3">Core entities in the PRISM Counsel data model:</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                "Matters", "Parties", "Claims", "Policies", "Carriers", "Adjusters",
                "Medical Events", "Damages", "Liens", "Offers", "Reserves", "Deadlines",
                "Discovery", "Depositions", "Communications", "Documents",
                "Forecasts", "Readiness Scores", "Recommendations", "Approvals",
                "Audit Events", "Clock Rules", "No-Fault Claims", "Venue Profiles",
              ].map((entity) => (
                <div key={entity} className="px-2 py-1 rounded text-[10px] text-slate-400 bg-white/[0.03] border border-white/[0.04]">
                  {entity}
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {tab === "ai" && (
        <div className="space-y-4">
          <Section title="AI Usage Model">
            <p className="text-xs text-slate-400 mb-3">PRISM Counsel uses AI for signal analysis, forecasting, and recommendation generation. All AI outputs follow strict rules:</p>
            <BulletList items={[
              "No invented legal citations — every citation must map to a source document",
              "No unstated assumptions presented as facts — inference is always labeled",
              "Every assertion traceable to source data or flagged as inference",
              "Confidence levels displayed on all generated outputs",
              "Raw model output preserved in audit trail for review",
              "Human approval required before any consequential action",
              "Generated content visually distinct from source truth in all UI surfaces",
              "Model usage logs include model identifier, input tokens, and output tokens",
            ]} />
          </Section>
          <Section title="Defensibility Framework">
            <BulletList items={[
              "Defensibility score computed for every AI-generated artifact",
              "Source trace drawer — click any assertion to see supporting evidence",
              "Unsupported claim detector — flags assertions without source backing",
              "Privileged content flagger — prevents AI from surfacing privilege-protected data",
              "AI review checklist — structured review workflow before external use",
              "One-click review packet builder — generates defensibility documentation",
            ]} />
          </Section>
          <Section title="Forecasting Methodology">
            <p className="text-xs text-slate-400 mb-3">PRISM Counsel forecasts are operator-friendly and explainable:</p>
            <BulletList items={[
              "Settlement band forecasting — range-based, never presented as certainty",
              "Deadline breach risk — probabilistic assessment with contributing factors",
              "Demand readiness scoring — checklist-based with gap detection",
              "Every forecast shows confidence level, trend, and contributing signals",
              "Every forecast shows what changed since previous snapshot",
              "Forecasts recommend next actions but never prescribe legal strategy",
              "Attorney review flag on any forecast with material client impact",
            ]} />
          </Section>
          <Section title="Copilot Guardrails">
            <BulletList items={[
              "Matter-scoped answer shaping — Copilot only surfaces data from authorized matters",
              "Role-aware answer shaping — responses filtered by user's access level",
              "Source grounding on all Copilot responses — no hallucinated information",
              "Privilege boundary enforcement — Copilot cannot surface privileged content to unauthorized users",
              "Copilot outputs labeled as AI-generated in all rendering contexts",
              "Copilot interaction logs preserved for audit and compliance",
            ]} />
          </Section>
        </div>
      )}

      {tab === "exports" && (
        <div className="space-y-4">
          <Section title="Export Safety Model">
            <BulletList items={[
              "All exports require explicit authorization based on user role",
              "Export scope is matter-specific — no bulk cross-matter exports without partner approval",
              "Export operations logged with scope, format, timestamp, and recipient",
              "Privilege-flagged content excluded from standard exports",
              "Generated content clearly marked in exported documents",
              "Export format support: PDF, DOCX, CSV (structured data), JSON (API)",
            ]} />
          </Section>
          <Section title="Redaction Controls">
            <BulletList items={[
              "Automated PII detection and redaction suggestion",
              "Privilege-aware redaction — privileged content auto-redacted in discovery exports",
              "Manual redaction override with audit trail",
              "Redaction verification workflow before external send",
              "Redacted document versioning — original and redacted versions tracked separately",
            ]} />
          </Section>
          <Section title="Review Packet Generation">
            <p className="text-xs text-slate-400 leading-relaxed">
              PRISM Counsel can generate structured review packets for internal use, client reporting, and compliance documentation. Each packet includes source citations, AI defensibility scores, approval chain documentation, and export safety verification. Review packets are designed to support attorney review workflows and are never sent externally without explicit approval.
            </p>
          </Section>
        </div>
      )}
    </div>
  );
}
