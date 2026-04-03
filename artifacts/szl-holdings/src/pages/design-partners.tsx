import { Link } from "wouter";
import { ArrowRight, Users, Calendar, CheckCircle2, Zap, Shield, BarChart3, MessageSquare, Clock } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const WHAT_YOU_GET = [
  {
    icon: Zap,
    title: "Direct founder access",
    body: "You work with the founder, not an account team. Every decision, every iteration, every call goes through the person who built this.",
  },
  {
    icon: BarChart3,
    title: "Instrumented proof, not a trial",
    body: "We don't hand you software and wait. We instrument one real workflow together — with observability, checkpoints, and a measurable baseline — so the pilot produces actual proof.",
  },
  {
    icon: Shield,
    title: "Governance from day one",
    body: "The same trust controls, AI governance model, and audit trail that run in production run in your pilot. No security gaps to close later.",
  },
  {
    icon: MessageSquare,
    title: "Feedback shapes the product",
    body: "Design partners have direct influence on the product roadmap, integration priorities, and domain vocabulary. Your operating context becomes the template.",
  },
  {
    icon: CheckCircle2,
    title: "Proof chain output",
    body: "Every workflow produces a defensible record — what happened, what the AI recommended, what the human approved, and why. You leave the pilot with documented evidence of improvement.",
  },
  {
    icon: BarChart3,
    title: "Expansion-ready architecture",
    body: "The pilot is scoped to one workflow, but the architecture is built to expand. If the proof lands, scaling is not a rebuild — it's a configuration.",
  },
];

const TIMELINE = [
  {
    week: "Week 1–2",
    label: "Workflow selection",
    detail: "Identify the one high-friction workflow to instrument. Define the baseline, the signals, and the success criteria together.",
  },
  {
    week: "Week 3–4",
    label: "Integration setup",
    detail: "Configure the required integrations for your environment. Test data ingestion and signal classification against real inputs.",
  },
  {
    week: "Month 2",
    label: "Proof workflow live",
    detail: "End-to-end workflow instrumented. Observability, governance checkpoints, and AI recommendations running on live data.",
  },
  {
    week: "Month 3",
    label: "Measurement and review",
    detail: "Measure cycle time, risk detection, and follow-through against the baseline. Review findings and define expansion scope.",
  },
];

const FIT = [
  "Operators running critical workflows across multiple systems where ownership drift and status opacity are already costing you",
  "Organizations open to founder-led implementation — not enterprise sales cycles with hand-offs",
  "Teams that need clearer accountability, faster intervention, and auditable follow-through — not dashboards for dashboards' sake",
  "Enterprise and government buyers who need to prove the platform works before committing to a full rollout",
];

const NOT_FIT = [
  "Teams looking for a generic SaaS trial with self-serve onboarding and no direct engagement",
  "Organizations that cannot commit a named operator to the workflow instrumentation process",
  "Buyers who need production deployment before the 90-day proof window",
];

export default function DesignPartnersPage() {
  usePageMeta({
    title: "Design Partners — SZL Holdings",
    description:
      "Work directly with SZL to instrument one high-friction workflow, prove measurable improvement, and expand from a proven foundation.",
    canonical: "https://szlholdings.com/design-partners",
  });

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main>

        {/* Hero */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#4a90b8]/20 bg-[#4a90b8]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#4a90b8]">
              <Users className="h-3.5 w-3.5" />
              Design Partner Program
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Instrument one workflow. Build proof you can expand from.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
              SZL is working with a limited number of early operators to instrument real workflows — not run
              generic trials. A design partner engagement picks one high-friction process, instruments it with
              Lyte + Alloy, proves measurable improvement within 90 days, and builds the foundation for
              everything that follows.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Start a conversation
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

        {/* What you get */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">What a design partner receives</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white">
              Engagement, not onboarding.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">
              Design partners don't get handed a login and a support ticket queue. They get direct engagement
              with the founder throughout the proof workflow, with governance built in from the start.
            </p>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {WHAT_YOU_GET.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                    <div className="mb-4 inline-flex rounded-xl border border-[#4a90b8]/20 bg-[#4a90b8]/10 p-2.5 text-[#4a90b8]">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="text-base font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/60">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Timeline expectations</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white">
              A 90-day proof window. Structured, not open-ended.
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TIMELINE.map((phase, i) => (
                <div key={phase.week} className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#d4a054]/15 text-[10px] font-bold text-[#d4a054]">
                      {i + 1}
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d4a054]">
                      {phase.week}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">{phase.label}</h3>
                  <p className="mt-2 text-xs leading-5 text-white/55">{phase.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who it's for / who it's not */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                <div className="mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">Good fit</p>
                </div>
                <ul className="space-y-3">
                  {FIT.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-white/68">
                      <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400/60" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-white/35" />
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">Not a fit right now</p>
                </div>
                <ul className="space-y-3">
                  {NOT_FIT.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-white/58">
                      <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/20" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Limited availability</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                Ready to instrument something real?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-white/60">
                Design partner slots are limited and selected carefully. If you have a workflow that has real
                operating pain and genuine interest in proving improvement, the conversation starts here.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  Start a conversation
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/5"
                >
                  Technical documentation
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
