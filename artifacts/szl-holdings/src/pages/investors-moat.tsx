import { Link } from "wouter";
import { Shield, ArrowRight, Lock, Layers, Brain, Database, GitBranch, Globe, FileCheck2, Workflow } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const moatLayers = [
  {
    icon: Layers,
    title: "Shared execution fabric",
    depth: "Architectural",
    body: "Every vertical pack runs on the same Alloy execution fabric — connector mesh, workflow orchestration, approval engine, and audit infrastructure. Competitors building single-vertical tools must rebuild this for each new domain.",
  },
  {
    icon: Brain,
    title: "Model Mesh governance",
    body: "AI is not a feature — it is a governed capability. The Model Mesh layer provides per-tenant, per-task model selection, source grounding enforcement, and hallucination detection. This is not promptengineering — it is AI infrastructure.",
    depth: "Technical",
  },
  {
    icon: GitBranch,
    title: "Domain-specific twins",
    body: "Matter Twin, Property Twin, Voyage Twin, Threat Twin — each vertical has a structured digital twin that accumulates intelligence over time. The twin is the defensible data asset.",
    depth: "Data",
  },
  {
    icon: Globe,
    title: "Worldline enrichment",
    body: "External signal ingestion from official high-signal sources (NWS, CISA, Census, FEMA, court records) creates enrichment layers that improve twin quality without requiring customer data.",
    depth: "Data",
  },
  {
    icon: FileCheck2,
    title: "Proof Chain",
    body: "Every output carries a cryptographic proof chain linking source → AI recommendation → human review → approval → export. This is not just an audit log — it is verifiable provenance.",
    depth: "Trust",
  },
  {
    icon: Workflow,
    title: "GraphQL control plane",
    body: "A unified GraphQL API exposes every domain's data through a single, governed query layer. This enables cross-vertical analytics through Lyte without duplicating integration work.",
    depth: "Technical",
  },
  {
    icon: Lock,
    title: "Microsoft-native integration",
    body: "The platform is designed to embed into Microsoft 365 environments — Outlook, SharePoint, Teams — where enterprise workflows already live. This is a distribution advantage, not just a feature.",
    depth: "Distribution",
  },
  {
    icon: Database,
    title: "Operational proof strategy",
    body: "SZL leads with live product and controlled demos, not pitch decks. Design-partner workflows create proof objects that compound into the moat.",
    depth: "GTM",
  },
];

export default function InvestorsMoatPage() {
  usePageMeta({
    title: "Moat & Defensibility — Investor Relations — SZL Holdings",
    description: "What makes SZL Holdings defensible: shared architecture, trust infrastructure, and data leverage.",
    canonical: "https://szlholdings.com/investors/moat",
  });

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a054]/20 bg-[#d4a054]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#d4a054]">
              <Shield className="h-3.5 w-3.5" />
              Moat & Defensibility
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              The moat is the architecture, not a single feature.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
              SZL's defensibility comes from the compounding advantage of a shared execution fabric,
              domain-specific twins, governed AI infrastructure, and verifiable proof chains — not from
              any single product capability.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/investors/overview" className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]">
                Back to overview
              </Link>
              <Link href="/demo" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90">
                See the live product <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-white">Eight layers of defensibility</h2>
            <div className="mt-10 space-y-4">
              {moatLayers.map((m) => (
                <div key={m.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <div className="flex items-start gap-4">
                    <m.icon className="mt-1 h-5 w-5 flex-shrink-0 text-[#d4a054]" />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-semibold text-white">{m.title}</h3>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase text-white/40">{m.depth}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-white/60">{m.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-white">Why live demo beats deck</h2>
            <div className="mt-6 rounded-2xl border border-[#d4a054]/20 bg-[#d4a054]/[0.04] p-6">
              <p className="text-sm leading-7 text-white/72">
                The recommended investor evaluation sequence is: <strong className="text-white">live product demo</strong> first,
                then architecture and trust review, then GitHub technical proof. SZL leads with operational
                evidence because the architecture only matters if it produces working, governed workflows.
                The code is open for verification — but the product speaks first.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
