import { Link } from "wouter";
import { Zap, Shield, Eye, FileCheck2, Lock, ArrowRight, CheckCircle, Activity, Workflow, Brain } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const GOVERNANCE_CONTROLS = [
  {
    icon: Eye,
    title: "Observable AI decisions",
    body: "Every AI-generated insight, recommendation, and action in the Lyte command surface includes the signals, models, and logic that informed it. No opaque outputs. Full decision lineage.",
  },
  {
    icon: Brain,
    title: "Model routing transparency",
    body: "The Model Mesh routes requests across multiple AI providers based on task class, cost, and capability. Every routing decision is logged with model selection rationale and cost attribution.",
  },
  {
    icon: Lock,
    title: "Org-scoped data boundaries",
    body: "All business data, metrics, and operational signals are scoped by organization. Cross-org data access is enforced at the database, API, and UI layers. No shared data planes.",
  },
  {
    icon: Workflow,
    title: "Alloy execution governance",
    body: "Every workflow executed through Alloy — from task routing to escalation — is logged with trigger condition, actor identity, approval state, and outcome. Complete action audit trail.",
  },
  {
    icon: FileCheck2,
    title: "Export and reporting controls",
    body: "Data exports pass through approval gates with role-based authorization. Report generation is governed by access policies. No bulk data extraction without explicit authorization.",
  },
  {
    icon: Activity,
    title: "Cost and usage observability",
    body: "AI model usage, API calls, and compute consumption are tracked per organization with real-time cost attribution. No surprise bills. Full visibility into platform resource consumption.",
  },
];

const TRUST_LAYERS = [
  { label: "Human-in-the-loop", desc: "High-impact AI actions require explicit human approval. Auto-approval only for read-only, low-risk operations." },
  { label: "Proof chain integrity", desc: "SHA-256 hashed records for every decision, action, and state change. Tamper-evident audit trail." },
  { label: "Role-based access control", desc: "11-role RBAC system with granular permissions at the feature, data, and action level." },
  { label: "Session-scoped authentication", desc: "OIDC/PKCE authentication with session management. No persistent tokens. Automatic session expiry." },
];

export default function SolutionsLyteTrustPage() {
  usePageMeta({
    title: "Lyte Trust & AI Governance · SZL Holdings",
    description: "How Lyte governs AI decisions, model routing, data boundaries, and execution workflows with full observability and audit trails.",
    canonical: "https://szlholdings.com/solutions/lyte/trust",
  });

  return (
    <div className="min-h-screen" style={{ background: "#080c14" }}>
      <SiteNav />

      <section className="max-w-5xl mx-auto px-6 pt-32 pb-16">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-[#d4a054]" />
          <span className="text-[11px] font-medium text-[#d4a054] uppercase tracking-widest">Lyte · Trust</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-100 leading-tight mb-4">
          AI you can audit. Actions you can trace.
        </h1>
        <p className="text-base text-slate-400 max-w-2xl leading-relaxed mb-8">
          Lyte is the command surface for the entire SZL platform. Every AI decision, model selection, workflow execution, and data access is observable, governed, and auditable — because business intelligence without governance is just noise.
        </p>
        <div className="flex items-center gap-3">
          <Link href="/lyte">
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
          Six layers of governance that make every AI decision, data access, and workflow execution observable and auditable.
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
        <h2 className="text-xl font-semibold text-slate-100 mb-2">Trust Architecture</h2>
        <p className="text-sm text-slate-400 max-w-2xl mb-8">
          Structural trust guarantees built into Lyte at the platform level.
        </p>
        <div className="space-y-3">
          {TRUST_LAYERS.map((t) => (
            <div key={t.label} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <CheckCircle className="w-4 h-4 text-[#d4a054] mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-slate-200">{t.label}</span>
                <p className="text-sm text-slate-400 mt-0.5">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
          <Shield className="w-8 h-8 text-[#d4a054] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-100 mb-2">Governed by design</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto mb-6">
            Lyte doesn't bolt on governance after the fact. Trust, auditability, and human oversight are structural constraints that shape every feature. See the platform trust center for the full architecture.
          </p>
          <Link href="/trust">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20 hover:bg-[#d4a054]/20 transition-colors cursor-pointer">
              Platform Trust Center <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
