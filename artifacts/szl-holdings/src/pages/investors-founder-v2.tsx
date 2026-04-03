import { Link } from "wouter";
import {
  User,
  ArrowRight,
  Building2,
  Code2,
  Shield,
  Target,
  Layers,
  Zap,
  CheckCircle2,
  Map,
  FileText,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const operatingPrinciples = [
  {
    icon: Code2,
    color: "#4a90b8",
    title: "Builder-operator, not just founder",
    body: "Stephen builds the product, runs the operations, and works directly with design partners. At this stage, there is no separation between vision and execution. The founder is also the engineer, the product manager, the sales lead, and the operating architect. This is by design — not a constraint to be solved later.",
  },
  {
    icon: Target,
    color: "#d4a054",
    title: "Proof over pitch",
    body: "Every claim is backed by running code, live demos, and operational evidence. The default is always to show a working system rather than describe a future one. Investors see the product first. Architecture documentation follows. The GitHub repo is the last resort.",
  },
  {
    icon: Shield,
    color: "#c8953c",
    title: "Trust-first architecture",
    body: "Governance, audit trails, source grounding, and AI accountability are architectural constraints built from the start — not retrofitted when enterprise buyers demand them. This is not a compliance posture. It is a product philosophy that reflects how high-stakes operational software should be built.",
  },
  {
    icon: Layers,
    color: "#8b7ac8",
    title: "Systems thinking over feature thinking",
    body: "Features are copied. Systems — the interconnected logic of how an organization actually operates — are not. Every platform is designed around the operational system first, and the feature surface second. This distinction drives every architectural decision.",
  },
  {
    icon: Zap,
    color: "#6aaa72",
    title: "Observability before optimization",
    body: "You cannot improve what you cannot see. The first step in every engagement is instrumenting the reality of how the system behaves — not how leadership assumes it behaves. Observability is not a monitoring feature. It is the epistemological foundation of the entire product.",
  },
  {
    icon: Building2,
    color: "#5a9a8a",
    title: "Vertical focus with platform discipline",
    body: "Start with one vertical, prove it works, then extend the architecture horizontally. The expansion lanes are real. They are just not the primary story. The commercial wedge always comes first. Platform ambition follows commercial proof — not the other way around.",
  },
];

const founderMarketFit = [
  {
    label: "Domain expertise",
    body: "Deep familiarity with the operational failure modes of high-stakes organizations — legal, maritime, security, real estate. The product is built around the actual pain, not an adjacent signal.",
  },
  {
    label: "Technical depth",
    body: "Able to build the full stack: data layer, AI infrastructure, workflow engine, governance architecture, and product surface. The architecture is not outsourced. The founder made the design decisions.",
  },
  {
    label: "Operating experience",
    body: "Has run real operations under pressure — not just advised on them. The instinct for where workflows break, where ownership drifts, and where audit trails matter comes from doing the work, not studying it.",
  },
  {
    label: "Category timing",
    body: "Built at the convergence of AI adoption, enterprise workflow automation, and governance risk. The timing is not accidental. The company was architected to address what comes after AI gets adopted — not AI adoption itself.",
  },
];

const operatingThesis = [
  "Execution latency and ownership drift are the real problems. Dashboards are the wrong tool for solving them.",
  "AI that cannot be audited is a liability for enterprise buyers. Source grounding and proof chains are product requirements, not nice-to-haves.",
  "The moat is the architecture, not any single feature. Build the spine first, then extend it into new domains.",
  "Design partners are not beta customers. They are proof-generation partners who make the next raise credible.",
  "The founder is the product at this stage. The company narrative is inseparable from the operating philosophy.",
];

const proofObjects = [
  {
    title: "Approval latency detection",
    platform: "Lyte",
    color: "#4a90b8",
    outcome:
      "Designed and built a signal compression and prioritization layer to surface approval queue stalling that was invisible to leadership. The system ranks severity, exposes root cause context, and routes next actions to the right owner.",
  },
  {
    title: "Pre-designation behavioral fingerprinting",
    platform: "Vessels",
    color: "#4a90b8",
    outcome:
      "Built an AIS anomaly detection system to identify sanctions-risk vessel behavior before formal regulatory designation — using pattern analysis across large vessel datasets to detect behavioral laundering and position manipulation.",
  },
  {
    title: "Workflow orchestration engine",
    platform: "Alloy",
    color: "#8b7ac8",
    outcome:
      "Designed and built the six-layer Alloy orchestration engine: signal ingestion, normalization, reasoning, routing, outputs, and governance. Human approval gates at every critical decision point. Audit trail on every execution.",
  },
  {
    title: "Matter Twin architecture",
    platform: "PRISM Counsel",
    color: "#d4a054",
    outcome:
      "Legal matter observability layer with deadline tracking, pressure scoring, proof chain export, and privilege-safe document handling. Architecture complete. In design-partner engagement.",
  },
];

export default function InvestorsFounderPage() {
  usePageMeta({
    title: "Founder — Stephen Lutar — SZL Holdings",
    description:
      "Stephen Lutar — Founder & CEO of SZL Holdings. Builder, operator, systems thinker. Founder-market fit, operating thesis, and proof objects.",
    canonical: "https://szlholdings.com/investors/founder",
  });

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main>
        {/* Hero */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a054]/20 bg-[#d4a054]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#d4a054]">
              <User className="h-3.5 w-3.5" />
              Founder
            </div>
            <h1 className="mt-6 max-w-2xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Stephen Lutar
            </h1>
            <p className="mt-2 text-lg text-[#d4a054]">Founder & CEO — SZL Holdings</p>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">
              Builder, operator, systems thinker. Designing the infrastructure layer for how
              governed organizations make and audit operational decisions — starting with business
              observability, and extending through maritime, security, real estate, and advisory.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/investors/data-room"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Request data room access
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]"
              >
                Start a conversation
              </Link>
            </div>
          </div>
        </section>

        {/* Founder-market fit */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
              Founder-market fit
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              Why this founder for this problem at this time.
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {founderMarketFit.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d4a054]">
                    {item.label}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/65">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Operating principles */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
              Operating principles
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              Six principles that govern every product decision.
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {operatingPrinciples.map((principle) => {
                const Icon = principle.icon;
                return (
                  <div
                    key={principle.title}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
                  >
                    <div
                      className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20"
                      style={{ color: principle.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">{principle.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/55">{principle.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Operating thesis */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                  Operating thesis
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  Five beliefs that drive the company.
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/55">
                  The operating thesis is not a vision document. It is a set of bets that are either
                  right or wrong — and that can be tested with evidence. Every product decision maps
                  back to one of these.
                </p>
              </div>
              <div className="space-y-3">
                {operatingThesis.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#d4a054]" />
                    <p className="text-sm leading-6 text-white/65">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Proof objects */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
              Proof objects
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              Built systems. Produced outcomes.
            </h2>
            <div className="mt-10 space-y-4">
              {proofObjects.map((proof) => (
                <div
                  key={proof.title}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
                  style={{ borderLeft: `3px solid ${proof.color}50` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="text-xs font-semibold uppercase tracking-[0.14em]"
                      style={{ color: proof.color }}
                    >
                      {proof.platform}
                    </span>
                    <h3 className="text-sm font-semibold text-white">{proof.title}</h3>
                  </div>
                  <p className="text-sm leading-7 text-white/60">{proof.outcome}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why this stage matters */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-8 lg:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                Why this stage
              </p>
              <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-white">
                The founder is the asset at this stage. Not the team deck.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">
                SZL Holdings is at the stage where the founder's judgment, technical depth, and
                operating instinct are the primary risk and the primary asset. The company is raising
                on the strength of the architecture, the operating philosophy, and the proof that the
                platform can deliver outcomes in real environments — not on a team chart or a market
                size calculation.
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">
                The right investor at this stage understands that a founder who can build the full
                stack, run the operation, and generate real proof objects is the foundation of a
                scalable company — not a gap to be filled by hiring. The team grows around the
                architecture, not the other way around.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  Start the conversation
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/investors/data-room"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]"
                >
                  Request data room access
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <section>
          <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Investor overview", href: "/investors/overview", icon: Building2 },
                { label: "Roadmap", href: "/investors/roadmap", icon: Map },
                { label: "Data room", href: "/investors/data-room", icon: FileText },
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
