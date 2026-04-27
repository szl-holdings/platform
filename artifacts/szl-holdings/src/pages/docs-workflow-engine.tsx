import { Link } from "wouter";
import { ArrowRight, Workflow, GitMerge, ShieldCheck, Zap, Clock, BarChart2 } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const ENGINE_CAPABILITIES = [
  {
    icon: GitMerge,
    name: "DAG-based execution",
    desc: "Every workflow is expressed as a directed acyclic graph of steps. The engine resolves dependencies, parallelises independent branches automatically, and guarantees correct execution order — eliminating race conditions by construction.",
  },
  {
    icon: ShieldCheck,
    name: "Governance envelope",
    desc: "Each step executes inside a governance envelope enforced by the Covenant Policy engine. Steps that would violate policy are halted before execution, not after — with the blocking rule surfaced in the audit record.",
  },
  {
    icon: Zap,
    name: "Event-driven triggers",
    desc: "Workflows can be triggered by Outcome Graph state changes, Proof Chain entries, external webhook events, scheduled cadences, or operator-initiated runs. All trigger sources are attributed and recorded.",
  },
  {
    icon: Clock,
    name: "Durable execution",
    desc: "The engine persists workflow state at each step boundary. Infrastructure interruptions, transient failures, or approval waits do not lose progress — execution resumes from the last committed checkpoint.",
  },
  {
    icon: BarChart2,
    name: "Observability and tracing",
    desc: "Every step produces a structured execution trace: inputs, outputs, latency, model invocations, and policy decisions. Traces are appended to the Proof Chain and available for audit and operational review.",
  },
  {
    icon: Workflow,
    name: "Human-in-the-loop gates",
    desc: "Workflows can require an explicit operator approval before crossing a gate. The engine suspends execution, routes the approval request through the configured principal hierarchy, and only resumes when the required signatures are obtained.",
  },
];

const EXECUTION_STATES = [
  { state: "Pending", desc: "The workflow has been registered and is waiting for its trigger condition to be satisfied." },
  { state: "Running", desc: "Execution is in progress. One or more steps are active and the engine is resolving the dependency graph forward." },
  { state: "Awaiting approval", desc: "Execution is paused at a human-in-the-loop gate. The engine holds state until the required operator approval is recorded." },
  { state: "Completed", desc: "All steps have executed successfully. The workflow execution record is sealed and written to the Proof Chain." },
  { state: "Halted — policy", desc: "A step violated the active Covenant Policy. Execution stopped before the step ran; the blocking rule is recorded in the audit trail." },
  { state: "Failed", desc: "A step encountered an unrecoverable error after retries. The execution record includes the full trace up to the point of failure." },
];

export default function DocsWorkflowEnginePage() {
  const __pageMeta = usePageMeta({
    title: "Workflow Engine — Docs — SZL Holdings",
    description: "Workflow Engine documentation: DAG-based execution, governance envelopes, durable state, human-in-the-loop gates, and full Proof Chain tracing.",
    canonical: "https://szlholdings.com/docs/workflow-engine",
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
                <span className="text-white/60">Workflow Engine</span>
              </div>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
                <Workflow className="h-3 w-3" />
                Platform primitive
              </div>
              <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                Workflow Engine.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
                The Workflow Engine is the execution layer that orchestrates multi-step agentic processes
                across the platform. It resolves dependency graphs, enforces governance at every step,
                maintains durable state through interruptions, and emits a complete execution trace to
                the Proof Chain — so every automated process is observable, auditable, and policy-bound
                from start to finish.
              </p>
            </div>
          </section>

          {/* How it works */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">How it works</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Execution model</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
                Operators define workflows as a set of typed steps with explicit dependency declarations.
                The engine compiles these into a directed acyclic graph (DAG), identifies all parallelisable
                branches, and begins execution from root nodes. Each step receives its inputs from the outputs
                of its upstream dependencies — resolved at runtime from the live Outcome Graph — and writes
                its outputs back into the workflow state before the next layer of the graph is scheduled.
              </p>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
                Before any step executes, the engine evaluates the step's proposed action against the active
                Covenant Policy for the workflow's principal scope. If the action is permitted, execution
                proceeds and the authorisation decision is appended to the step's trace. If the action is
                blocked, execution halts at that step, the blocking rule is recorded, and the overall workflow
                transitions to a <code className="rounded bg-white/[0.06] px-1 text-xs text-white/70">Halted — policy</code> state.
                No side-effects from the blocked step are applied.
              </p>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
                State is checkpointed after each step completes. If the host is interrupted, execution resumes
                from the most recent checkpoint without replaying completed steps. Approval gates behave as
                durable pauses — the engine stores the pending approval record, releases host resources, and
                resumes only after the required signatures are collected.
              </p>
            </div>
          </section>

          {/* Capabilities */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Engine capabilities</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">What the Workflow Engine provides</h2>
              <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {ENGINE_CAPABILITIES.map((cap) => {
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

          {/* Execution states */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Execution states</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Workflow lifecycle states</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                Every workflow instance moves through a defined set of states. All state transitions are
                recorded in the Proof Chain with a timestamp and the principal or event that caused the transition.
              </p>
              <div className="mt-8 space-y-2">
                {EXECUTION_STATES.map((s) => (
                  <div key={s.state} className="flex gap-5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
                    <code className="w-48 flex-shrink-0 text-xs font-mono font-semibold text-white/55">{s.state}</code>
                    <span className="text-sm text-white/65">{s.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Governance envelope */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Governance envelope</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">How workflows are governed</h2>
              <div className="mt-6 space-y-3">
                {[
                  { rule: "Step-level policy checks", detail: "Covenant Policy is evaluated before each step executes — not after. A policy violation halts execution at the boundary, and the blocking rule is written to the step trace before any side-effects occur." },
                  { rule: "Principal attribution", detail: "Every workflow run is attributed to the initiating principal — operator, scheduled trigger, or upstream workflow. The principal's role and permissions are bound to the run and used for all policy evaluations within it." },
                  { rule: "Approval gate signatures", detail: "Human-in-the-loop gates require a digital approval from one or more configured principals. The approval record, including the approver identity and timestamp, is sealed into the Proof Chain before execution resumes." },
                  { rule: "Immutable execution trace", detail: "The full execution trace — step inputs, outputs, policy decisions, model invocations, and latency — is written to the Proof Chain at workflow completion. Traces cannot be modified or deleted after sealing." },
                  { rule: "Sandboxed simulation", detail: "Workflows can be run in simulation mode via the Simulation Engine. Simulated runs execute the full DAG and governance logic against a sandbox state — no side-effects reach live Outcome Graph records or the audit timeline." },
                ].map((r) => (
                  <div key={r.rule} className="flex gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
                    <div className="w-52 flex-shrink-0 text-xs font-semibold text-white/55">{r.rule}</div>
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
                  { label: "Covenant Policy", href: "/docs/covenant-policy", detail: "Policy rules evaluated at every workflow step" },
                  { label: "Outcome Graph", href: "/docs/outcome-graph", detail: "State source that workflow steps read and write" },
                  { label: "Proof Chain", href: "/docs/proof-chain", detail: "Immutable log where execution traces are sealed" },
                  { label: "Simulation", href: "/docs/simulation", detail: "Run workflows in a governed sandbox before authorising" },
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
