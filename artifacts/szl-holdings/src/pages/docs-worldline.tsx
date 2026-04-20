import { Link } from "wouter";
import { ArrowRight, Clock, GitCommit, Search, Shield, AlertCircle, BarChart3 } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const WORLDLINE_PROPERTIES = [
  {
    icon: GitCommit,
    name: "Unified chronological record",
    desc: "Every signal ingestion, Twin state change, AI recommendation, operator decision, and execution event is recorded in the governed audit timeline in chronological order. The timeline is the single source of truth for what happened in a workflow, when, and in what sequence.",
  },
  {
    icon: Shield,
    name: "Immutable and tamper-evident",
    desc: "Audit timeline events are written once and cannot be modified. Each event carries a cryptographic commitment that allows any observer to verify the record has not been altered. Retroactive modification of the timeline is structurally prevented.",
  },
  {
    icon: Search,
    name: "Queryable by subject and time",
    desc: "The governed audit timeline is queryable by subject (a specific matter, voyage, property, or threat), by event type, by actor, or by time window. Governance teams can reconstruct the exact decision context for any moment in a workflow's history.",
  },
  {
    icon: Clock,
    name: "Decision replay support",
    desc: "Any point in the audit timeline can be used as a basis for reconstructing the full context that existed at that moment — including the Twin state, the signals that had arrived, and the recommendations that were pending. This supports post-hoc review without requiring a separate audit database.",
  },
  {
    icon: AlertCircle,
    name: "Exception and escalation events",
    desc: "Escalations, missed checkpoints, policy violations, and human overrides are all first-class audit timeline events. They are queryable independently for exception review and pattern analysis.",
  },
  {
    icon: BarChart3,
    name: "Aggregated timeline views",
    desc: "Lyte's What Changed surface and Today dashboard are both derived from the governed audit timeline. The timeline is the common data layer that powers all observability surfaces — there is no separate metrics store or shadow database.",
  },
];

const EVENT_TYPES = [
  { type: "SIGNAL_INGESTED", desc: "A new signal arrived from an external source and was classified." },
  { type: "TWIN_UPDATED", desc: "A Domain Twin was updated with new enrichment data or a revised score." },
  { type: "RECOMMENDATION_GENERATED", desc: "The system produced a candidate action recommendation for human review." },
  { type: "DECISION_MADE", desc: "An operator approved or rejected a recommendation. Includes the rationale if provided." },
  { type: "ACTION_EXECUTED", desc: "An approved action was executed via the Alloy execution fabric." },
  { type: "CHECKPOINT_MISSED", desc: "A required checkpoint was not reached within the configured time window." },
  { type: "ESCALATION_TRIGGERED", desc: "An escalation condition was detected and routed to the configured escalation path." },
  { type: "PROOF_CHAIN_SEALED", desc: "A proof chain was finalized and attached to an export or output document." },
];

export default function DocsWorldlinePage() {
  const __pageMeta = usePageMeta({
    title: "Governed Audit Timeline — Docs — SZL Holdings",
    description: "Governed audit timeline documentation: the unified, immutable chronological event and decision record that powers all observability and audit surfaces in Lyte + Alloy.",
    canonical: "https://szlholdings.com/docs/worldline",
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
                <span className="text-white/60">Governed Audit Timeline</span>
              </div>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                <Clock className="h-3 w-3" />
                Platform infrastructure
              </div>
              <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                Governed Audit Timeline.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
                The governed audit timeline is the unified, immutable chronological record of everything that
                happens in a Lyte + Alloy workflow — signals, Twin updates, AI recommendations, operator
                decisions, execution events, and escalations. It is the common data layer beneath all
                observability surfaces and the foundation of the Proof Chain.
              </p>
            </div>
          </section>
  
          {/* Properties */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">System properties</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">What the governed audit timeline provides</h2>
              <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {WORLDLINE_PROPERTIES.map((prop) => {
                  const Icon = prop.icon;
                  return (
                    <div key={prop.name} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                      <div className="mb-4 inline-flex rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                        <Icon className="h-4 w-4 text-white/50" />
                      </div>
                      <h3 className="text-base font-semibold text-white">{prop.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-white/58">{prop.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
  
          {/* Event types */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Event types</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">First-class audit timeline event types</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                These are the core event types recorded in the governed audit timeline. All are queryable by
                type, subject, actor, or time window through the governance API.
              </p>
              <div className="mt-8 space-y-2">
                {EVENT_TYPES.map((et) => (
                  <div key={et.type} className="flex gap-5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
                    <code className="w-52 flex-shrink-0 text-xs font-mono font-semibold text-white/55">{et.type}</code>
                    <span className="text-sm text-white/65">{et.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          {/* What it powers */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Built on the audit timeline</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Surfaces powered by the governed audit timeline</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "What Changed", detail: "Surfaces the most significant audit timeline events since the last operator session." },
                  { label: "Today dashboard", detail: "Aggregates priority signals across all active subjects into one operational view." },
                  { label: "Proof chain", detail: "Derives output provenance by traversing the audit timeline back from a decision event to its source signals." },
                  { label: "Audit trail", detail: "Exposes the full audit timeline record to governance teams through the governance API query interface." },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <h3 className="text-sm font-semibold text-white">{s.label}</h3>
                    <p className="mt-2 text-xs leading-5 text-white/55">{s.detail}</p>
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
                  { label: "Architecture", href: "/docs/architecture", detail: "How the full platform pipeline connects" },
                  { label: "Proof chain", href: "/docs/proof-chain", detail: "How outputs trace back to source signals" },
                  { label: "Covenant Policy", href: "/docs/control-plane", detail: "Governance API for querying audit timeline data" },
                  { label: "Trust", href: "/docs/trust", detail: "How the audit timeline supports governance requirements" },
                  { label: "Governed inference", href: "/docs/model-mesh", detail: "AI model invocation events in the audit timeline" },
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
