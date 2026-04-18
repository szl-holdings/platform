import { Link } from "wouter";
import { Layers, ArrowRight, GitBranch, Database, Shield, Workflow, Brain, Globe, Server } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const layers = [
  {
    icon: Globe,
    name: "Signal Layer",
    description: "Ingests raw events from connected systems — emails, files, API webhooks, scheduled crawls, and external data feeds. Normalizes into a common signal schema.",
    components: ["Connector mesh", "Webhook ingestion", "Scheduled crawlers", "External data adapters"],
  },
  {
    icon: Brain,
    name: "Intelligence Layer",
    description: "Classifies, enriches, and correlates signals. AI models provide recommendations, but every output is source-grounded and confidence-scored.",
    components: ["Model Mesh", "Signal Forge", "Worldline enrichment", "Contradiction detection"],
  },
  {
    icon: Workflow,
    name: "Action Layer",
    description: "Routes recommended actions through approval workflows. Human-in-the-loop enforcement ensures nothing executes autonomously.",
    components: ["Approval engine", "Review queue", "Sign-off workflow", "Decision objects"],
  },
  {
    icon: Shield,
    name: "Governance Layer",
    description: "Every action produces an immutable audit trail. Proof chains link signal to recommendation to approval to outcome.",
    components: ["Proof Chain", "Audit log", "Export safety", "Privilege screening"],
  },
  {
    icon: Database,
    name: "Data Layer",
    description: "PostgreSQL with tenant isolation, GraphQL control plane, and structured schema for every domain pack.",
    components: ["Tenant-scoped queries", "GraphQL API", "Schema registry", "Drizzle ORM"],
  },
  {
    icon: Server,
    name: "Operations Layer",
    description: "Health monitoring, incident management, retry/replay, and admin diagnostics for every running service.",
    components: ["Service health", "Incident tracking", "Job replay", "Runbook automation"],
  },
];

export default function InvestorsArchitecturePage() {
  usePageMeta({
    title: "Architecture — Investor Relations — SZL Holdings",
    description: "Technical architecture overview for investors: the six-layer stack powering every SZL product.",
    canonical: "https://szlholdings.com/investors/architecture",
  });

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8b7ac8]/20 bg-[#8b7ac8]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#8b7ac8]">
              <Layers className="h-3.5 w-3.5" />
              Architecture
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Six governance primitives. One platform. Every domain pack.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
              Every SZL domain pack — from maritime intelligence to legal matter command — runs on the
              same six-layer governed decision architecture. This is not a monolith. It is a shared
              platform where each domain pack inherits signal ingestion, AI governance, approval workflows,
              immutable audit trails, and cross-domain signal correlation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/investors/overview" className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]">
                Back to overview
              </Link>
              <Link href="/investors/moat" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90">
                Moat & defensibility <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-white">The six-layer stack</h2>
            <div className="mt-10 space-y-6">
              {layers.map((layer, i) => (
                <div key={layer.name} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04]">
                      <layer.icon className="h-5 w-5 text-[#8b7ac8]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[#8b7ac8]">LAYER {i + 1}</span>
                        <h3 className="text-lg font-semibold text-white">{layer.name}</h3>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-white/60">{layer.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {layer.components.map((c) => (
                          <span key={c} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-white/56">{c}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-white">Why this architecture matters</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <GitBranch className="h-5 w-5 text-[#d4a054]" />
                <h3 className="mt-4 text-base font-semibold text-white">Domain pack velocity</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">New domain packs inherit 80% of the governed platform stack. The unique work is domain-specific signal definitions, action vocabulary, and UI surfaces. The seventh pack costs a fraction of the first.</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <Shield className="h-5 w-5 text-[#4a90b8]" />
                <h3 className="mt-4 text-base font-semibold text-white">Governance compounding</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">Improvements to the shared governance layer — Proof Chain, Covenant Policy, Outcome Graph — improve every domain pack simultaneously. Security and compliance hardening is not duplicated per domain.</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <Database className="h-5 w-5 text-[#c8953c]" />
                <h3 className="mt-4 text-base font-semibold text-white">Cross-domain signal value</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">Cross-domain correlation through the Event Fabric surfaces intelligence no single-domain tool can produce. Each new domain pack adds signal sources that make all existing packs smarter.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
