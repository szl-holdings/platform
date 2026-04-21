import { Link } from "wouter";
import { Scale, Shield, Eye, FileCheck2, Lock, Users, AlertTriangle, ArrowRight, CheckCircle, Server, Workflow, Brain } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const GOVERNANCE_CONTROLS = [
  {
    icon: Eye,
    title: "Source lineage on every output",
    body: "Every AI-generated recommendation, risk flag, or forecast references the specific documents, records, and data feeds that informed it. No black-box conclusions.",
  },
  {
    icon: Lock,
    title: "Privilege-aware processing",
    body: "Attorney-client privileged materials are tagged at ingestion. AI models never train on privileged content. Export pipelines automatically screen and redact privileged references.",
  },
  {
    icon: FileCheck2,
    title: "Approval-class enforcement",
    body: "Every AI action is classified: auto (read-only, low-risk), review (human approval required), admin-only (elevated authorization). No autonomous execution of high-risk actions.",
  },
  {
    icon: Users,
    title: "Role-based access with audit",
    body: "Partner, associate, paralegal, and admin roles with granular permissions. Every access, edit, export, and approval is logged with actor identity, timestamp, and rationale.",
  },
  {
    icon: AlertTriangle,
    title: "Hallucination detection",
    body: "AI outputs pass through contradiction detection and confidence scoring. Unsupported claims are flagged before reaching any review queue. Grounding failures surface immediately.",
  },
  {
    icon: Workflow,
    title: "Decision lineage & proof chain",
    body: "Every decision — from risk assessment to demand packet assembly — is recorded with SHA-256 integrity hashing. Complete chain of custody for every matter action.",
  },
];

const DATA_ISOLATION = [
  { label: "Org-scoped tenancy", desc: "Every table includes orgId. Cross-tenant data access is impossible at the query layer." },
  { label: "Matter-scoped access", desc: "All matter data is scoped by matterId with role-based visibility. Conflict checks run at assignment." },
  { label: "No cross-matter training", desc: "AI models are never trained on client matter data. Inference uses retrieval augmentation, not fine-tuning." },
  { label: "Export-safe pipelines", desc: "Every export passes through privilege screening, PII detection, and approval-class verification before delivery." },
];

const COMPLIANCE = [
  { title: "NY Reg 68 compliance clocks", desc: "Automated tracking of insurance regulation deadlines with escalation ladders and breach-risk forecasting." },
  { title: "Statute of limitations tracking", desc: "Per-matter SOL monitoring with configurable warning windows and automatic escalation." },
  { title: "Ethics wall enforcement", desc: "Automated conflict detection and access restriction when matters involve overlapping parties or interests." },
  { title: "Client consent checkpoints", desc: "Governed workflows require explicit client consent documentation before proceeding with sensitive actions." },
];

export default function SolutionsPrismCounselTrustPage() {
  const __pageMeta = usePageMeta({
    title: "Counsel Trust & Governance · SZL Holdings",
    description: "How Counsel protects privileged information, governs AI actions, and maintains complete audit trails for legal matter management.",
    canonical: "https://szlholdings.com/counsel/trust",
  });

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen" style={{ background: "#080c14" }}>
        <SiteNav />
  
        <section className="max-w-5xl mx-auto px-6 pt-32 pb-16">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-5 h-5 text-[#d4a054]" />
            <span className="text-[11px] font-medium text-[#d4a054] uppercase tracking-widest">Counsel · Trust</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-100 leading-tight mb-4">
            Governed AI for legal matter execution.
          </h1>
          <p className="text-base text-slate-400 max-w-2xl leading-relaxed mb-8">
            Counsel handles privileged, time-sensitive, and ethically complex legal data. Every surface — from AI recommendations to export pipelines — is built with governance as a first-class constraint, not an afterthought.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/counsel">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20 hover:bg-[#d4a054]/20 transition-colors cursor-pointer">
                Product Overview <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link href="/trust">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:bg-white/[0.08] transition-colors cursor-pointer">
                Platform Trust Center
              </span>
            </Link>
          </div>
        </section>
  
        <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Governance Controls</h2>
          <p className="text-sm text-slate-400 max-w-2xl mb-8">
            Six governance layers that ensure every AI action, data access, and export is traceable, approved, and defensible.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GOVERNANCE_CONTROLS.map((c) => (
              <div key={c.title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center gap-3 mb-3">
                  <c.icon className="w-5 h-5 text-[#d4a054]/70" />
                  <h3 className="text-sm font-semibold text-slate-200">{c.title}</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </section>
  
        <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Data Isolation</h2>
          <p className="text-sm text-slate-400 max-w-2xl mb-8">
            Legal data requires strict isolation. Every boundary is enforced at the database and application layer.
          </p>
          <div className="space-y-3">
            {DATA_ISOLATION.map((d) => (
              <div key={d.label} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <CheckCircle className="w-4 h-4 text-[#4a90b8] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-slate-200">{d.label}</span>
                  <p className="text-sm text-slate-400 mt-0.5">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
  
        <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Regulatory Compliance</h2>
          <p className="text-sm text-slate-400 max-w-2xl mb-8">
            Built-in compliance support for New York insurance litigation requirements.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMPLIANCE.map((c) => (
              <div key={c.title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">{c.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>
  
        <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
            <Shield className="w-8 h-8 text-[#d4a054] mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-100 mb-2">Audit-ready by default</h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto mb-6">
              Every action in Counsel generates a complete audit record — who did what, when, why, and what informed the decision. Export audit packets for compliance review at any time.
            </p>
            <a href="/aegis/">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20 hover:bg-[#d4a054]/20 transition-colors cursor-pointer">
                Enter Counsel <ArrowRight className="w-4 h-4" />
              </span>
            </a>
          </div>
        </section>
  
        <SiteFooter />
      </div>
        </>
  );
}
