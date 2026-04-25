import { Link } from "wouter";
import { ArrowRight, Cpu, GitBranch, DollarSign, Shield, RefreshCw, BarChart3 } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const MESH_PROPERTIES = [
  {
    icon: GitBranch,
    name: "Model routing by task type",
    desc: "The governed inference layer routes each inference request to the appropriate model based on task type, domain context, latency requirements, and cost constraints. No single model handles all tasks — each is selected for fit.",
  },
  {
    icon: RefreshCw,
    name: "Model versioning and rollback",
    desc: "Every model version used in production is tracked. If a new version degrades output quality or increases cost beyond threshold, rollback is executed without requiring a full system redeployment. Version history is auditable.",
  },
  {
    icon: DollarSign,
    name: "Cost tracking per invocation",
    desc: "Each model invocation is tracked by tenant, workflow, task type, and model version. Cost data is surfaced through the Governance API and included in tenant billing summaries. No hidden inference costs.",
  },
  {
    icon: Shield,
    name: "Output governance integration",
    desc: "Model outputs flow into the governance layer before any recommendation is presented to an operator. The governed inference layer does not bypass governance — it feeds it. Every output is labeled with its model version for review context.",
  },
  {
    icon: BarChart3,
    name: "Quality signal collection",
    desc: "Operator approvals, rejections, and correction signals are fed back into the governed inference quality tracking system. Quality signals inform routing preferences and trigger evaluation cycles for underperforming model versions.",
  },
  {
    icon: Cpu,
    name: "Multi-provider architecture",
    desc: "The governed inference layer is provider-agnostic. Models from different providers can be used for different task types within the same workflow. Provider dependencies are isolated at the inference layer — no provider lock-in reaches the application layer.",
  },
];

const ROUTING_FACTORS = [
  { factor: "Task type", desc: "Classification, summarization, reasoning, extraction, and generation are routed to different model profiles." },
  { factor: "Domain context", desc: "Legal, maritime, real estate, and security task types route to domain-calibrated model configurations." },
  { factor: "Latency requirement", desc: "Interactive tasks (real-time recommendations) route to lower-latency models. Batch tasks can use higher-quality, slower models." },
  { factor: "Cost threshold", desc: "Operator-configured cost thresholds influence routing decisions — cost-sensitive tasks route to lower-cost models within quality tolerance." },
  { factor: "Quality history", desc: "Models with recent quality signal degradation for a task type are deprioritized in routing until evaluation is complete." },
  { factor: "Context length", desc: "Long-context tasks are routed to models with appropriate context windows rather than truncating inputs to fit standard models." },
];

export default function DocsModelMeshPage() {
  const __pageMeta = usePageMeta({
    title: "Governed Inference — Docs — SZL Holdings",
    description: "Governed inference documentation: AI model routing, versioning, cost tracking, quality signals, and governance integration in the Lyte + Counsel platform.",
    canonical: "https://szlholdings.com/docs/model-mesh",
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
                <span className="text-white/60">Governed Inference</span>
              </div>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                <Cpu className="h-3 w-3" />
                Platform infrastructure
              </div>
              <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                Governed Inference.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
                Governed inference is the AI model management layer of the Lyte + Counsel platform. It handles
                model routing, versioning, cost tracking, quality signal collection, and governance integration.
                No model in the platform operates outside this layer — all inference is tracked, governed, and
                accountable.
              </p>
            </div>
          </section>
  
          {/* Properties */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">System properties</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">What governed inference provides</h2>
              <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {MESH_PROPERTIES.map((prop) => {
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
  
          {/* Routing factors */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Routing logic</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Factors that determine model routing</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                Routing decisions are made at invocation time based on the following factors, evaluated in priority order.
              </p>
              <div className="mt-8 space-y-2">
                {ROUTING_FACTORS.map((rf) => (
                  <div key={rf.factor} className="flex gap-5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
                    <div className="w-40 flex-shrink-0 text-xs font-semibold text-white/55">{rf.factor}</div>
                    <span className="text-sm text-white/65">{rf.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Governance position */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Governance position</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">The governed inference layer is not the decision maker</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65">
                The governed inference layer produces candidate outputs — classification results, summaries,
                recommendations, and extracted facts. Every output flows into the governance layer before any
                operator sees it. Governed inference does not approve actions. It does not execute workflows.
                It does not make consequential decisions. Its role is to produce well-attributed, version-tracked,
                cost-monitored candidates that humans review and approve.
              </p>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65">
                This is a structural property of the platform, not a policy configuration. The governance
                layer cannot be bypassed by an inference routing decision.
              </p>
              <div className="mt-6">
                <Link href="/docs/proof-chain" className="inline-flex items-center gap-2 text-sm text-white/58 transition hover:text-white/85">
                  How model invocations appear in the proof chain <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </section>
  
          {/* Related docs */}
          <section>
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Related documentation</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "Proof chain", href: "/docs/proof-chain", detail: "How model invocations are recorded in output provenance" },
                  { label: "Architecture", href: "/docs/architecture", detail: "Where governed inference fits in the platform pipeline" },
                  { label: "Trust", href: "/docs/trust", detail: "Governance model and AI accountability" },
                  { label: "Covenant Policy", href: "/docs/control-plane", detail: "API access to model cost and quality data" },
                  { label: "Audit Timeline", href: "/docs/worldline", detail: "Model invocation events in the chronological record" },
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
