import { Link } from "wouter";
import { ArrowRight, Users, Gauge, Workflow, Target } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const steps = [
  {
    icon: Target,
    title: "Pick one painful workflow",
    body: "Choose a process where ownership drift, approval latency, handoff confusion, or status opacity is already costing time or revenue.",
  },
  {
    icon: Workflow,
    title: "Instrument the workflow",
    body: "Use Lyte + Alloy to map signals, route action, define checkpoints, and create a cleaner record of what happened and what is still blocked.",
  },
  {
    icon: Gauge,
    title: "Measure the improvement",
    body: "Track cycle time, visibility, risk detection, handoff quality, and follow-through so the partnership creates proof instead of just opinions.",
  },
];

const fit = [
  "Operators running critical workflows across multiple systems",
  "Teams that need clearer ownership, faster intervention, and visible follow-through",
  "Organizations open to founder-led implementation and fast iteration",
];

export default function DesignPartnersPage() {
  usePageMeta({
    title: "Design Partners \u2014 SZL Holdings",
    description:
      "Work directly with SZL to shape Lyte + Alloy around a high-friction operating workflow.",
    canonical: "https://szlholdings.com/design-partners",
  });

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#4a90b8]/20 bg-[#4a90b8]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#4a90b8]">
              <Users className="h-3.5 w-3.5" />
              Design Partner Program
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Work directly with the founder on one workflow that actually matters.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
              SZL is working with a limited number of early teams to shape Lyte + Alloy around real
              operating pain. The goal is not a generic software trial. The goal is to instrument one
              high-friction workflow, prove measurable improvement, and turn that proof into a repeatable
              operating system.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Request a design partner conversation
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/platform"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
              >
                See the platform
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="grid gap-6 md:grid-cols-3">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                  >
                    <div className="mb-4 inline-flex rounded-2xl border border-[#d4a054]/20 bg-[#d4a054]/10 p-3 text-[#d4a054]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">{step.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-white/72">{step.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
                Best fit
              </p>
              <ul className="mt-5 space-y-3">
                {fit.map((item) => (
                  <li key={item} className="text-sm leading-7 text-white/78">
                    \u2022 {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
