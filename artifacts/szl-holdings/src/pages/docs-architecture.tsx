import { Link } from "wouter";
import { ArrowRight, Layers, Database, Network, Cpu, Shield, GitBranch } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const LAYERS = [
  {
    icon: Database,
    name: "Signal ingestion layer",
    desc: "Raw signals arrive from external data sources — APIs, feeds, file ingest, tenant-configured connectors — and are normalized, classified, and timestamped before entering the processing layer. Every signal has a source record, a classification, and an ingestion timestamp that follows it through the full pipeline.",
  },
  {
    icon: Cpu,
    name: "Twin enrichment layer",
    desc: "Domain Twins — Matter, Property, Voyage, Threat — are maintained as persistent structured objects. As new signals arrive, the twin updates incrementally: facts are confirmed or revised, scores are recalculated, and change events are emitted to downstream consumers. Twins are not snapshots. They are live, versioned models of the operating subject.",
  },
  {
    icon: Network,
    name: "Signal-to-action pipeline",
    desc: "Enriched twin state flows through the signal-to-action pipeline where patterns are evaluated against operator-configured thresholds. When conditions are met, the system generates a candidate action with source support, confidence scoring, and a recommended decision. No action is issued without human review.",
  },
  {
    icon: Shield,
    name: "Governance and approval layer",
    desc: "Every candidate action passes through the human-in-the-loop governance layer. Operators review the recommendation, verify source grounding, and approve or reject with a single decision. Rejections carry an explanation that feeds back into pattern calibration. Approvals trigger the execution layer.",
  },
  {
    icon: GitBranch,
    name: "Execution and audit layer",
    desc: "Approved actions are executed via the Counsel execution fabric. Every execution step is logged in the immutable audit trail — what was decided, who approved it, what data supported it, and when it occurred. The audit trail cannot be altered post-hoc.",
  },
  {
    icon: Layers,
    name: "Proof chain and export layer",
    desc: "Outputs — documents, reports, exports — are generated with embedded proof chain metadata. Every claim in an output links to the source signal, the twin state at decision time, and the approval record. This proof chain travels with the export for review, archive, and regulatory use.",
  },
];

const PROPERTIES = [
  { label: "Multi-tenant isolation", detail: "Each tenant's data, Twins, and signal history are fully isolated. No cross-tenant signal leakage at any layer." },
  { label: "Versioned Twin state", detail: "Every Twin state change is versioned and retained. Reconstructing the state of a Twin at any prior decision point is supported." },
  { label: "Configurable domain vocabulary", detail: "Signal classifiers, threshold parameters, and domain vocabulary are configured per vertical pack — not hardcoded into the base platform." },
  { label: "No autonomous action", detail: "The architecture structurally prevents autonomous action. Human approval is a required layer, not an optional policy overlay." },
  { label: "Incremental enrichment", detail: "Twin enrichment is incremental and source-attributed. Bulk batch re-computation is not required when new signals arrive." },
  { label: "Observable at every layer", detail: "Lyte's observability surface exposes signal volume, processing latency, approval queue depth, and Twin staleness at every layer of the pipeline." },
];

export default function DocsArchitecturePage() {
  const __pageMeta = usePageMeta({
    title: "Architecture — Docs — SZL Holdings",
    description: "Technical architecture documentation for the Lyte + Counsel platform: signal ingestion, twin enrichment, signal-to-action pipeline, governance, and proof chain.",
    canonical: "https://szlholdings.com/docs/architecture",
  });

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen bg-[#070a10] text-white">
        <SiteNav />
        <main>
  
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
              <div className="flex items-center gap-2 text-sm text-white/40">
                <Link href="/docs" className="hover:text-white/70 transition">Docs</Link>
                <span>/</span>
                <span className="text-white/60">Architecture</span>
              </div>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                <Layers className="h-3 w-3" />
                Technical architecture
              </div>
              <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                Platform architecture.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
                The Lyte + Counsel platform is a layered signal-to-action operating system. Each layer has a
                defined input, a defined output, and a defined governance boundary. This page documents how
                those layers connect.
              </p>
            </div>
          </section>
  
          {/* Architecture layers */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Pipeline layers</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">From signal arrival to auditable output</h2>
              <div className="mt-10 space-y-4">
                {LAYERS.map((layer, i) => {
                  const Icon = layer.icon;
                  return (
                    <div key={layer.name} className="flex gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                      <div className="flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                          <Icon className="h-5 w-5 text-white/55" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-white/30">{String(i + 1).padStart(2, "0")}</span>
                          <h3 className="text-base font-semibold text-white">{layer.name}</h3>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-white/60">{layer.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
  
          {/* Architectural properties */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Architectural properties</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">System-level guarantees</h2>
              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {PROPERTIES.map((p) => (
                  <div key={p.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <h3 className="text-sm font-semibold text-white">{p.label}</h3>
                    <p className="mt-2 text-xs leading-5 text-white/55">{p.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Related docs */}
          <section>
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Related documentation</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "Covenant Policy", href: "/docs/control-plane", detail: "Governance API and Covenant Policy management" },
                  { label: "Audit Timeline", href: "/docs/worldline", detail: "The unified chronological event and decision record" },
                  { label: "Proof chain", href: "/docs/proof-chain", detail: "How outputs are traced back to source signals" },
                  { label: "Governed inference", href: "/docs/model-mesh", detail: "AI model routing, versioning, and cost management" },
                  { label: "Trust", href: "/docs/trust", detail: "Trust controls and governance model documentation" },
                  { label: "Back to docs hub", href: "/docs", detail: "Full documentation index" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-white/12 hover:bg-white/[0.04]"
                  >
                    <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/30" />
                    <div>
                      <div className="text-sm font-semibold text-white">{link.label}</div>
                      <div className="mt-0.5 text-xs text-white/45">{link.detail}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
  
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
