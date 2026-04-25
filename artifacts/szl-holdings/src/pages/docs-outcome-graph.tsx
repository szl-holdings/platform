import { Link } from "wouter";
import { ArrowRight, GitMerge, Layers, Zap, Database, Network, RefreshCw } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const GRAPH_PROPERTIES = [
  {
    icon: Network,
    name: "Signal-to-state traceability",
    desc: "Every node in the Outcome Graph is connected to the signals that produced it. Changes in source signals propagate through the graph in deterministic order — there are no unexplained state transitions.",
  },
  {
    icon: Layers,
    name: "Domain Twin substrate",
    desc: "Domain Twins — the live digital representations of matters, voyages, properties, and threats — are graph nodes. Their state is the accumulated result of all signals and events that have affected them, resolved in graph order.",
  },
  {
    icon: Zap,
    name: "Real-time propagation",
    desc: "When new signals arrive, the graph resolves downstream effects immediately. Operators see updated Twin state, recomputed risk scores, and new recommendation candidates without manual refresh or batch processing.",
  },
  {
    icon: GitMerge,
    name: "Causal edge capture",
    desc: "Every edge in the graph represents a causal relationship between nodes — a signal produced a state update, a state update triggered a workflow, a workflow produced an output. The full causal chain is queryable.",
  },
  {
    icon: Database,
    name: "Versioned snapshots",
    desc: "The Outcome Graph retains versioned snapshots of every node at every state transition. Operators can query what the graph looked like at any prior point in time — decisions are always traceable to a concrete graph state.",
  },
  {
    icon: RefreshCw,
    name: "Cross-domain aggregation",
    desc: "A single Outcome Graph spans all active Domain Packs within a tenant. Signals from Aegis, Vessels, Terra, and Counsel resolve into a unified graph — surfacing relationships that siloed systems cannot see.",
  },
];

const GRAPH_NODE_TYPES = [
  { type: "Signal node", desc: "A discrete, timestamped input from a source system — a filing, an AIS position report, a CVE alert, a property transaction. Immutable once ingested." },
  { type: "State node", desc: "An accumulated view of a Domain Twin derived from one or more upstream signals. Versioned and queryable at any past timestamp." },
  { type: "Inference node", desc: "The output of a model invocation — a risk score, a classification, an anomaly flag. Always linked to the model version and input hash that produced it." },
  { type: "Decision node", desc: "A human or governed-AI decision point — an approval, a rejection, an escalation. Contains actor identity, role, timestamp, and rationale." },
  { type: "Output node", desc: "A produced artifact — a recommendation, an exported document, a governance report. Linked to all upstream nodes that contributed to it, forming the Proof Chain." },
  { type: "Workflow node", desc: "An orchestrated action sequence triggered by a decision node. Records routing, execution state, and completion status with full governance envelope." },
];

export default function DocsOutcomeGraphPage() {
  const __pageMeta = usePageMeta({
    title: "Outcome Graph — Docs — SZL Holdings",
    description: "Outcome Graph documentation: the directed signal and state fabric that connects every input, inference, decision, and output in the Lyte + Counsel platform.",
    canonical: "https://szlholdings.com/docs/outcome-graph",
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
                <span className="text-white/60">Outcome Graph</span>
              </div>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                <Network className="h-3 w-3" />
                Platform primitive
              </div>
              <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                Outcome Graph.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
                The Outcome Graph is the directed signal and state fabric at the core of Lyte + Counsel.
                Every input signal, Domain Twin state transition, model inference, human decision, and
                produced output is a node in this graph. The graph resolves causal relationships
                deterministically — every outcome traces to a complete, auditable chain of causes.
              </p>
            </div>
          </section>
  
          {/* Properties */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Graph properties</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">What the Outcome Graph provides</h2>
              <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {GRAPH_PROPERTIES.map((prop) => {
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
  
          {/* Node types */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Graph anatomy</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Node types in the Outcome Graph</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                Each node in the Outcome Graph represents a distinct kind of event or state in the platform
                pipeline. Edges connect nodes causally — a downstream node only exists because its upstream
                nodes were resolved first.
              </p>
              <div className="mt-8 space-y-2">
                {GRAPH_NODE_TYPES.map((node) => (
                  <div key={node.type} className="flex gap-5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
                    <code className="w-36 flex-shrink-0 text-xs font-mono font-semibold text-white/55">{node.type}</code>
                    <span className="text-sm text-white/65">{node.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          {/* How signals flow */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Signal flow</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">How a signal becomes an outcome</h2>
              <div className="mt-6 space-y-3">
                {[
                  { step: "1 · Ingestion", detail: "A source signal arrives through a connector — an AIS position update, a CISA advisory, a court filing. The signal is timestamped, classified, and written as an immutable Signal node." },
                  { step: "2 · Twin resolution", detail: "The platform identifies which Domain Twin(s) are affected by the signal. The Twin's State node is updated to reflect the new information, preserving the prior state as a versioned snapshot." },
                  { step: "3 · Inference", detail: "Model invocations run against the updated Twin state. Inference nodes are created for each model output — risk scores, anomaly flags, recommendations — each linked to the model version and input hash." },
                  { step: "4 · Decision gate", detail: "Inferences that require human authorization are routed to a governed approval queue. The operator reviews the recommendation with full source context. Their decision creates a Decision node in the graph." },
                  { step: "5 · Output production", detail: "Approved recommendations produce Output nodes — exported documents, workflow triggers, governance reports. Each Output node is connected to all upstream nodes that contributed to it, completing the Proof Chain." },
                ].map((s) => (
                  <div key={s.step} className="flex gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
                    <div className="w-32 flex-shrink-0 text-xs font-semibold text-white/50 font-mono">{s.step}</div>
                    <div className="text-sm text-white/65">{s.detail}</div>
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
                  { label: "Proof Chain", href: "/docs/proof-chain", detail: "Audit trail derived from the Outcome Graph" },
                  { label: "Audit Timeline", href: "/docs/worldline", detail: "Temporal event sequence that the graph resolves against" },
                  { label: "Governed Inference", href: "/docs/model-mesh", detail: "Inference layer that produces Inference nodes" },
                  { label: "Simulation", href: "/docs/simulation", detail: "Forward-looking graph traversal for decision modeling" },
                  { label: "Architecture", href: "/docs/architecture", detail: "Full platform pipeline and three-tier design" },
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
