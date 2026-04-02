import { Link } from "wouter";
import {
  ArrowRight,
  Radar,
  Workflow,
  ShieldCheck,
  Building2,
  Ship,
  BriefcaseBusiness,
  CheckCircle2,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const proofPoints = [
  "Focused wedge: Lyte + Alloy",
  "Shared execution fabric and audit trail",
  "Enterprise-style command surface and trust posture",
  "Expansion lanes already prototyped inside the wider SZL ecosystem",
];

const customerProblems = [
  {
    title: "Invisible execution risk",
    body: "Revenue, approvals, handoffs, and ownership drift are usually tracked in disconnected tools. By the time leadership sees the problem, the damage is already real.",
  },
  {
    title: "No command layer",
    body: "Teams have dashboards, BI, workflow tools, and messaging channels, but not a system that connects signal to decision to confirmed action.",
  },
  {
    title: "AI without accountability",
    body: "Most AI outputs are not traceable, governed, or tied to execution. That creates noise instead of trust.",
  },
];

const lanes = [
  {
    icon: Ship,
    name: "Vessels",
    stage: "Expansion lane",
    body: "A future maritime intelligence application built on the same operating logic once the core wedge is commercially proven.",
  },
  {
    icon: ShieldCheck,
    name: "Aegis / Firestorm",
    stage: "Expansion lane",
    body: "A security and command surface for high-consequence environments where observability and execution discipline matter.",
  },
  {
    icon: Building2,
    name: "Terra",
    stage: "Expansion lane",
    body: "A real-estate intelligence workflow application for a data-rich, execution-poor operating environment.",
  },
  {
    icon: BriefcaseBusiness,
    name: "Carlota Jo",
    stage: "Services lane",
    body: "A premium advisory and services brand that can create near-term revenue and high-trust relationships around the platform.",
  },
];

const targetBuyers = [
  "Founders and operators who run on spreadsheets, inboxes, and status meetings",
  "Commercial and operations leaders who need faster visibility into latency and risk",
  "Teams that want AI-assisted workflow without losing auditability",
];

export default function HomePage() {
  usePageMeta({
    title: "SZL Holdings — Lyte + Alloy",
    description:
      "SZL Holdings is building Lyte, a business observability platform, powered by Alloy, its execution fabric and audit layer.",
    canonical: "https://szlholdings.com/",
  });

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
              <Radar className="h-3.5 w-3.5" />
              Focused company narrative
            </div>
            <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
              <div>
                <p className="mb-4 text-sm uppercase tracking-[0.28em] text-white/55">
                  SZL Holdings
                </p>
                <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-white md:text-6xl">
                  Lyte is the product.
                  <br />
                  Alloy is the engine.
                </h1>
                <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
                  SZL Holdings is building a focused business observability company. Lyte helps
                  operators see execution risk, ownership drift, and workflow friction before they
                  compound. Alloy is the execution fabric beneath it: signals, routing, workflows,
                  audit trail, and accountable action.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/investor-story"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                  >
                    See the investor story
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/investor-relations"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
                  >
                    Investor relations
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 px-5 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/15"
                  >
                    Request a meeting
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/30">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">What changed</p>
                <ul className="mt-4 space-y-3">
                  {proofPoints.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm leading-6 text-white/80">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#d4a054]" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 rounded-2xl border border-[#4a90b8]/25 bg-[#4a90b8]/10 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#4a90b8]">Raise story</p>
                  <p className="mt-2 text-sm leading-6 text-white/75">
                    Lead with one software wedge now. Present the rest of the ecosystem as expansion
                    value, not present-tense go-to-market sprawl.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.24em] text-[#4a90b8]">Problem</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                Operators are drowning in signal but still blind at decision time.
              </h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {customerProblems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/72">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#d4a054]">Core now</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  Lyte + Alloy is the commercial wedge.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/72">
                  Lyte is the application layer for business observability. Alloy is the shared
                  execution, workflow, signal, and audit layer behind it. Together they tell a
                  tighter story to investors, lenders, and design partners than a broad multi-market
                  portfolio does.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-[#d4a054]/25 bg-[#d4a054]/10 p-6">
                  <div className="mb-4 inline-flex rounded-xl border border-[#d4a054]/20 bg-black/15 p-3">
                    <Radar className="h-5 w-5 text-[#d4a054]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Lyte</h3>
                  <p className="mt-3 text-sm leading-7 text-white/78">
                    Business observability software for teams that need to see risk, bottlenecks,
                    ownership gaps, and next actions in one place.
                  </p>
                </div>
                <div className="rounded-3xl border border-[#4a90b8]/25 bg-[#4a90b8]/10 p-6">
                  <div className="mb-4 inline-flex rounded-xl border border-[#4a90b8]/20 bg-black/15 p-3">
                    <Workflow className="h-5 w-5 text-[#4a90b8]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Alloy</h3>
                  <p className="mt-3 text-sm leading-7 text-white/78">
                    Execution fabric for workflow orchestration, signal normalization, routing, and
                    auditability. The layer that makes the product durable.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Buyers</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                Who this is for first
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {targetBuyers.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-white/78">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Expansion logic</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                The rest of the ecosystem becomes option value.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/72">
                These lanes matter, but they should be presented as expansion paths powered by the
                same underlying operating system rather than as simultaneous day-one go-to-market
                motions.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {lanes.map((lane) => {
                const Icon = lane.icon;
                return (
                  <div key={lane.name} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                    <div className="mb-4 inline-flex rounded-xl border border-white/10 bg-black/20 p-3">
                      <Icon className="h-5 w-5 text-white/80" />
                    </div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">{lane.name}</h3>
                      <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
                        {lane.stage}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-white/72">{lane.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-8 lg:p-10">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Next step</p>
              <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-white">
                Raise and sell the company as one focused wedge, then let expansion earn the right to
                happen.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
                Use Lyte + Alloy for the near-term capital narrative, design-partner motion, and
                website copy. Keep the broader ecosystem visible, but subordinate it to a disciplined
                sequence.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/ventures"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
                >
                  View platform map
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  Start a conversation
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
