import { Link } from "wouter";
import { Brain, ArrowRight, ShieldCheck, Eye, FileCheck2, AlertTriangle, Users, Workflow } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const principles = [
  {
    icon: Users,
    title: "Human-in-the-loop by default",
    body: "Every AI-generated recommendation, draft, or classification requires explicit human approval before it becomes an action. No autonomous execution without operator consent.",
  },
  {
    icon: Eye,
    title: "Source-grounded assertions",
    body: "Every AI output is traceable to the source material that informed it. When a claim cannot be grounded in source, it is flagged as unsupported — never silently presented as fact.",
  },
  {
    icon: FileCheck2,
    title: "Approval class enforcement",
    body: "AI actions are classified into approval tiers: auto (low-risk read operations), review (human review before execution), and admin-only (requires elevated authorization).",
  },
  {
    icon: AlertTriangle,
    title: "Hallucination detection",
    body: "Every generated output passes through contradiction detection and confidence scoring. Unsupported claims are surfaced with warnings before reaching any review queue.",
  },
  {
    icon: Workflow,
    title: "Decision lineage",
    body: "The full chain from signal detection through AI recommendation to human approval and final action is recorded as an immutable audit trail — not just the outcome.",
  },
  {
    icon: ShieldCheck,
    title: "Model isolation and governance",
    body: "Tenant data is never used for model training. Model selection, prompt templates, and inference boundaries are governed through the Model Mesh configuration layer.",
  },
];

const boundaries = [
  "AI never sends external communications without human sign-off",
  "AI never modifies financial records, legal filings, or compliance artifacts autonomously",
  "AI never accesses data outside the scoped tenant boundary",
  "AI recommendations always show confidence scores and source references",
  "AI-generated content is labeled as generated — never presented as human-authored",
  "Model providers receive only anonymized, scoped context — never raw client data",
];

export default function TrustAIPage() {
  usePageMeta({
    title: "AI Governance — Trust Center — SZL Holdings",
    description: "How SZL governs AI usage across Lyte, Alloy, and every vertical pack.",
    canonical: "https://szlholdings.com/trust/ai",
  });

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8b7ac8]/20 bg-[#8b7ac8]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#8b7ac8]">
              <Brain className="h-3.5 w-3.5" />
              AI Governance
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              AI that operates under governance, not alongside it.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
              Every AI capability in the SZL platform — from Copilot recommendations to signal classification
              to document generation — operates within a governance framework that enforces source grounding,
              human approval, and full decision lineage.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/trust" className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]">
                Trust Center
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90">
                Request AI governance review <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-white">Core AI governance principles</h2>
            <p className="mt-2 text-sm text-white/56">Applied uniformly across Lyte, Alloy, PRISM Counsel, Terra, Vessels, and Aegis.</p>
            <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {principles.map((p) => (
                <div key={p.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <p.icon className="h-5 w-5 text-[#8b7ac8]" />
                  <h3 className="mt-4 text-base font-semibold text-white">{p.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-white">Hard boundaries</h2>
            <p className="mt-2 text-sm text-white/56">These are not configurable. They apply to every tenant, every pack, every environment.</p>
            <div className="mt-8 space-y-4">
              {boundaries.map((b, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
                  <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#d4a054]" />
                  <span className="text-sm text-white/72">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-white">Model usage policy</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <h3 className="text-base font-semibold text-white">What models are used</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  SZL uses commercially licensed language models through API access for classification,
                  summarization, recommendation, and document generation. Model selection is governed
                  through the Model Mesh layer, which allows per-tenant and per-task model configuration.
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <h3 className="text-base font-semibold text-white">What models never receive</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Raw client data, personally identifiable information, privileged legal communications,
                  or financial credentials are never sent to model providers. Context is scoped, anonymized,
                  and minimized before inference.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
