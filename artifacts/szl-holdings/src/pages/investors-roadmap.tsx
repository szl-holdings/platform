import { Link } from "wouter";
import {
  Map,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Users,
  Layers,
  Shield,
  Building2,
  Target,
  Zap,
  FileCheck2,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const phases = [
  {
    phase: "Phase 1",
    label: "Flagship Pack",
    color: "#d4a054",
    status: "Active",
    timeframe: "Now → 90 days",
    summary:
      "Establish the commercial wedge. Prove the workflow instrumentation thesis with real design partners before scaling. Every dollar raised supports proof, not expansion.",
    milestones: [
      {
        done: true,
        label: "PRISM Counsel product architecture complete",
        note: "Matter Twin, Deadline Engine, Proof Chain, Export Safety",
      },
      {
        done: true,
        label: "Lyte command layer operational",
        note: "Cross-vertical observability surface running live",
      },
      {
        done: true,
        label: "Alloy execution fabric operational",
        note: "Workflow orchestration, approval engine, audit infrastructure",
      },
      {
        done: false,
        label: "3–5 design-partner agreements signed",
        note: "Legal operations teams feeling execution latency today",
      },
      {
        done: false,
        label: "1–2 paid pilots or structured discovery engagements",
        note: "First commercial revenue. Proof-object generation begins.",
      },
      {
        done: false,
        label: "First operating proof objects published",
        note: "Real outcomes, real data, real audit trails",
      },
    ],
  },
  {
    phase: "Phase 2",
    label: "Expansion",
    color: "#4a90b8",
    status: "Next",
    timeframe: "90 days → 12 months",
    summary:
      "Prove repeatability. Use PRISM Counsel proof to enter the next vertical. Validate that the shared architecture delivers on its promise: lower cost per new pack, faster time to market.",
    milestones: [
      {
        done: false,
        label: "Vessels enters design-partner phase",
        note: "Maritime intelligence with voyage twins and AIS monitoring",
      },
      {
        done: false,
        label: "Cross-vertical analytics live in Lyte",
        note: "Investors and operators see the portfolio through one surface",
      },
      {
        done: false,
        label: "PRISM Counsel reference customers established",
        note: "Published case studies with measurable outcomes",
      },
      {
        done: false,
        label: "Aegis architecture finalized for enterprise pilot",
        note: "Security and incident workflow observability",
      },
      {
        done: false,
        label: "Microsoft 365 integration pathway activated",
        note: "Outlook, Teams, SharePoint distribution channel live",
      },
    ],
  },
  {
    phase: "Phase 3",
    label: "Portfolio Maturity",
    color: "#8b7ac8",
    status: "Later",
    timeframe: "12–24 months",
    summary:
      "Open the remaining vertical lanes. The architecture has proven it can travel. Unit economics across multiple verticals demonstrate the compounding value of the shared spine.",
    milestones: [
      {
        done: false,
        label: "Terra enters commercial stage",
        note: "Real estate intelligence — property twins, distress scoring",
      },
      {
        done: false,
        label: "Carlota Jo advisory layer revenue generating",
        note: "Premium client-facing layer with structured delivery model",
      },
      {
        done: false,
        label: "Portfolio unit economics published",
        note: "Cost per new vertical demonstrates compounding platform value",
      },
      {
        done: false,
        label: "Enterprise GTM motion established",
        note: "Named account strategy, channel partnerships, MSP distribution",
      },
    ],
  },
];

const designPartnerMilestones = [
  {
    icon: Users,
    label: "Identification",
    body: "Target organizations with high-stakes operational workflows that feel execution latency and ownership drift today. Legal operations is the wedge. Maritime, security, and real estate are the follow-on.",
  },
  {
    icon: Target,
    label: "Qualification",
    body: "Ideal design partner has a named pain, an identified champion, and an environment where a controlled pilot can produce measurable outcomes within 60–90 days.",
  },
  {
    icon: Zap,
    label: "Activation",
    body: "Structured discovery engagement or paid pilot. The design partner co-develops the workflow configuration. SZL delivers the instrumented environment. Outcomes are tracked and documented.",
  },
  {
    icon: FileCheck2,
    label: "Proof generation",
    body: "Every engagement produces proof objects: outcome data, audit trails, reference materials, and a testimonial-ready case narrative. This is the product of the design-partner program.",
  },
];

const operationalProofMilestones = [
  "Live product observable at any time — no demo mode, no mockups",
  "Workflow execution data available to qualified investors on request",
  "Design-partner engagement terms available for due diligence review",
  "Architecture documentation aligned with running codebase, not aspirational specs",
  "Audit trails and proof chains demonstrable in real environments",
];

export default function InvestorsRoadmapPage() {
  usePageMeta({
    title: "Roadmap — Investor Relations — SZL Holdings",
    description:
      "SZL Holdings phased rollout — flagship pack to expansion to portfolio maturity. Design-partner milestones and operational proof checkpoints.",
    canonical: "https://szlholdings.com/investors/roadmap",
  });

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main>
        {/* Hero */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#6aaa72]/20 bg-[#6aaa72]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#6aaa72]">
              <Map className="h-3.5 w-3.5" />
              Roadmap
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Phased rollout.
              <br />
              Evidence-gated expansion.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">
              The company does not expand because the product is ready. It expands when the proof is
              ready. Every phase is gated by evidence from the previous one — design-partner
              agreements, operating proof objects, and real commercial outcomes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/investors/overview"
                className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]"
              >
                Company overview
              </Link>
              <Link
                href="/investors/moat"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Moat & defensibility
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Phase timeline */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
              Three phases
            </p>
            <div className="mt-10 space-y-8">
              {phases.map((phase) => (
                <div
                  key={phase.phase}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 lg:p-8"
                >
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <span
                      className="text-xs font-bold uppercase tracking-[0.2em]"
                      style={{ color: phase.color }}
                    >
                      {phase.phase}
                    </span>
                    <h3 className="text-xl font-semibold text-white">{phase.label}</h3>
                    <div className="flex items-center gap-2 rounded-full border border-white/[0.08] px-3 py-1 text-xs text-white/45">
                      <Clock className="h-3 w-3" />
                      {phase.timeframe}
                    </div>
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                      style={{
                        background: `${phase.color}18`,
                        color: phase.color,
                        border: `1px solid ${phase.color}30`,
                      }}
                    >
                      {phase.status}
                    </span>
                  </div>
                  <p className="text-sm leading-7 text-white/55 max-w-3xl mb-6">{phase.summary}</p>
                  <div className="space-y-3">
                    {phase.milestones.map((m) => (
                      <div key={m.label} className="flex items-start gap-3">
                        {m.done ? (
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0"
                            style={{ color: phase.color }}
                          />
                        ) : (
                          <Circle className="mt-0.5 h-4 w-4 shrink-0 text-white/20" />
                        )}
                        <div>
                          <p
                            className="text-sm font-medium"
                            style={{ color: m.done ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.60)" }}
                          >
                            {m.label}
                          </p>
                          <p className="text-xs text-white/35 mt-0.5">{m.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Design-partner milestones */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
              Design-partner milestones
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              Four stages of design-partner engagement.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {designPartnerMilestones.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6"
                  >
                    <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20">
                      <Icon className="h-4 w-4 text-[#d4a054]" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d4a054]">
                      Step {i + 1}
                    </p>
                    <h3 className="mt-1.5 text-base font-semibold text-white">{item.label}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/55">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Operational proof */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                  Operational proof milestones
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  Proof is not a future deliverable. It is the present standard.
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/60">
                  Every investor claim is currently observable. No mockups. No decks that describe
                  features that do not exist. The product runs. The architecture is documented. The
                  workflows execute.
                </p>
              </div>
              <div className="space-y-3">
                {operationalProofMilestones.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#6aaa72]" />
                    <p className="text-sm leading-6 text-white/65">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <section>
          <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Overview", href: "/investors/overview", icon: Building2 },
                { label: "Architecture", href: "/investors/architecture", icon: Layers },
                { label: "Data Room", href: "/investors/data-room", icon: Shield },
              ].map((item) => (
                <Link key={item.label} href={item.href}>
                  <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition hover:bg-white/[0.04]">
                    <item.icon className="h-4 w-4 text-[#d4a054]" />
                    <span className="text-sm font-medium text-white/80">{item.label}</span>
                    <ArrowRight className="ml-auto h-3.5 w-3.5 text-white/25" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
