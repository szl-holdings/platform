import { Link } from "wouter";
import { ArrowRight, FlaskConical, TrendingUp, GitBranch, Shield, Clock, Sliders } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const SIMULATION_CAPABILITIES = [
  {
    icon: TrendingUp,
    name: "Forward-looking scenario modeling",
    desc: "Operators submit a set of hypothetical signal changes and the platform resolves their downstream effects through the Outcome Graph — producing updated Twin states, recomputed risk scores, and projected recommendation sets without touching live data.",
  },
  {
    icon: GitBranch,
    name: "Branch comparison",
    desc: "Multiple scenario branches can be run in parallel against the same baseline state. Operators compare projected outcomes side by side before committing to a course of action — with full visibility into how each branch diverges.",
  },
  {
    icon: Shield,
    name: "Governed sandbox",
    desc: "Simulation runs execute in a fully isolated sandbox. No simulated state leaks into the live Outcome Graph, audit timeline, or Domain Twin records. Every run is explicitly scoped, time-bounded, and attributed to the requesting principal.",
  },
  {
    icon: Sliders,
    name: "Parameter sensitivity analysis",
    desc: "Operators adjust threshold parameters, risk weights, and classification rules within a scenario to observe how output distributions shift. Sensitivity analysis surfaces which parameters have the greatest leverage on outcomes.",
  },
  {
    icon: Clock,
    name: "Temporal replay",
    desc: "The simulation engine can replay past audit timeline events under current model versions to show how current AI capabilities would have handled historical situations — useful for governance validation and model upgrade assessments.",
  },
  {
    icon: FlaskConical,
    name: "Pre-authorization modeling",
    desc: "Before authorizing a significant action, operators can simulate its projected downstream effects through the Outcome Graph. The simulation surfaces second-order consequences and flags Covenant Policy violations before the action is approved.",
  },
];

const SIMULATION_MODES = [
  { mode: "Prospective scenario", desc: "Model the effect of future signal changes or external events on current Twin state and pending workflows." },
  { mode: "Parameter sweep", desc: "Run the same scenario across a range of parameter values to understand the sensitivity of outcomes to configuration choices." },
  { mode: "Branch comparison", desc: "Compare two or more decision paths from the same starting state to determine which produces the best projected outcome under current policy." },
  { mode: "Temporal replay", desc: "Re-run a historical audit timeline segment under a different model version or configuration to validate upgrade decisions." },
  { mode: "Covenant stress test", desc: "Subject a proposed Covenant Policy configuration to synthetic signal load to verify it enforces correctly before deployment." },
];

export default function DocsSimulationPage() {
  const __pageMeta = usePageMeta({
    title: "Simulation — Docs — SZL Holdings",
    description: "Simulation documentation: forward-looking scenario modeling, branch comparison, and pre-authorization impact analysis in the KORA + Counsel platform.",
    canonical: "https://szlholdings.com/docs/simulation",
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
                <span className="text-white/60">Simulation</span>
              </div>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                <FlaskConical className="h-3 w-3" />
                Platform primitive
              </div>
              <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                Simulation.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
                Simulation is the forward-looking decision modeling engine in KORA + Counsel. Operators submit
                hypothetical scenarios — signal changes, parameter adjustments, alternative decisions — and the
                platform resolves their projected effects through the Outcome Graph without touching live state.
                Every significant action can be modeled before it is authorized.
              </p>
            </div>
          </section>
  
          {/* Capabilities */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Simulation capabilities</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">What simulation enables</h2>
              <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {SIMULATION_CAPABILITIES.map((cap) => {
                  const Icon = cap.icon;
                  return (
                    <div key={cap.name} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                      <div className="mb-4 inline-flex rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                        <Icon className="h-4 w-4 text-white/50" />
                      </div>
                      <h3 className="text-base font-semibold text-white">{cap.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-white/58">{cap.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
  
          {/* Simulation modes */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Simulation modes</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Available simulation run types</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                Each simulation run is scoped to a mode that defines how the sandbox is initialized and what
                outputs are produced. All modes execute in full isolation from live platform state.
              </p>
              <div className="mt-8 space-y-2">
                {SIMULATION_MODES.map((s) => (
                  <div key={s.mode} className="flex gap-5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
                    <code className="w-44 flex-shrink-0 text-xs font-mono font-semibold text-white/55">{s.mode}</code>
                    <span className="text-sm text-white/65">{s.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Governance model */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Governance model</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">How simulation runs are governed</h2>
              <div className="mt-6 space-y-3">
                {[
                  { rule: "Full isolation", detail: "Simulation runs execute against a point-in-time snapshot of the Outcome Graph. No write paths from a simulation sandbox reach live Twin state, the audit timeline, or the approval queue." },
                  { rule: "Attribution", detail: "Every simulation run is attributed to the requesting principal with their role and timestamp recorded. Run history is retained for governance review and audit access." },
                  { rule: "Covenant Policy enforcement", detail: "Simulation sandboxes enforce the same Covenant Policy rules as the live platform. A run cannot be configured to bypass policy constraints — stress testing policy is a supported use case; bypassing it is not." },
                  { rule: "Expiry", detail: "Simulation runs and their outputs expire after a configurable retention window. Expired runs are purged from the sandbox — they are never written to the audit timeline or Proof Chain of live records." },
                ].map((r) => (
                  <div key={r.rule} className="flex gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
                    <div className="w-44 flex-shrink-0 text-xs font-semibold text-white/55">{r.rule}</div>
                    <div className="text-sm text-white/65">{r.detail}</div>
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
                  { label: "Outcome Graph", href: "/docs/outcome-graph", detail: "The graph traversal engine simulation runs against" },
                  { label: "Covenant Policy", href: "/docs/covenant-policy", detail: "Policy rules enforced inside simulation sandboxes" },
                  { label: "Audit Timeline", href: "/docs/worldline", detail: "Temporal replay uses audit timeline event sequences" },
                  { label: "Governed Inference", href: "/docs/model-mesh", detail: "Inference layer invoked during simulation runs" },
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
