import { Link } from "wouter";
import {
  Building2,
  ArrowRight,
  Layers,
  Shield,
  Target,
  Clock,
  Users,
  Zap,
  Map,
  Ship,
  ShieldCheck,
  Home,
  BriefcaseBusiness,
  CheckCircle2,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const whyNow = [
  {
    icon: Zap,
    title: "AI adoption without governance",
    body: "Organizations are adopting AI at the process level, but most have no infrastructure for tracking what the AI recommended, who approved it, and what actually happened. That gap is the product.",
  },
  {
    icon: Clock,
    title: "Execution latency is invisible",
    body: "Most leadership teams can see their metrics. Almost none can see why approvals are stalling, where ownership drifted, or which signals were missed before a decision was made. Dashboards show what happened. Observability shows what needs to happen next.",
  },
  {
    icon: Users,
    title: "Enterprise workflow is still unstructured",
    body: "Email, meetings, and spreadsheets still govern most high-stakes operational decisions. The market for structured, auditable, AI-assisted workflow is large and underpenetrated.",
  },
];

const whyArchitecture = [
  {
    title: "Build once, deploy everywhere",
    body: "The Alloy execution fabric — connector mesh, workflow engine, approval gates, audit infrastructure — is built once and shared across every vertical. Each new domain pack inherits the full platform instead of rebuilding from scratch.",
  },
  {
    title: "Trust is a first-class layer",
    body: "Source grounding, proof chains, export safety, and human-in-the-loop approval are architectural constraints, not features. Enterprise buyers don't negotiate on these. We never had to retrofit them.",
  },
  {
    title: "GraphQL control plane",
    body: "A unified API layer means cross-vertical analytics, cross-domain queries, and future integrations are structurally possible without new backend work per use case.",
  },
];

const verticals = [
  {
    icon: Target,
    name: "PRISM Counsel",
    wedge: true,
    color: "hsl(38,72%,58%)",
    body: "Legal matter observability — deadlines, exposure tracking, approval governance, export safety. The commercial wedge. First vertical entering design-partner engagement.",
  },
  {
    icon: Ship,
    name: "Vessels",
    color: "hsl(206,72%,52%)",
    body: "Maritime intelligence — voyage twins, AIS monitoring, route risk, port congestion, sanctions compliance. Second vertical. Infrastructure ready.",
  },
  {
    icon: ShieldCheck,
    name: "Aegis",
    color: "hsl(222,60%,62%)",
    body: "Security and defense observability — threat twins, incident workflows, exposure prioritization. Third vertical. Architecture shared.",
  },
  {
    icon: Home,
    name: "Terra",
    color: "hsl(140,50%,48%)",
    body: "Real estate intelligence — property twins, diligence workflows, distress scoring. Fourth vertical. Same execution model.",
  },
  {
    icon: BriefcaseBusiness,
    name: "Carlota Jo",
    color: "hsl(280,50%,65%)",
    body: "Advisory and consulting intelligence. Premium client-facing layer. Near-term revenue opportunity while the software matures.",
  },
];

const rolloutPath = [
  {
    phase: "Phase 1",
    label: "Flagship pack",
    items: [
      "PRISM Counsel in active design-partner engagement",
      "Lyte + Alloy as the product narrative in every investor conversation",
      "Live demo as primary proof vehicle",
      "3–5 design-partner agreements targeting paid pilot",
    ],
  },
  {
    phase: "Phase 2",
    label: "Expansion",
    items: [
      "Vessels enters design-partner phase",
      "Aegis architecture finalized for enterprise pilot",
      "Cross-vertical analytics via Lyte command layer",
      "First operating proof objects published",
    ],
  },
  {
    phase: "Phase 3",
    label: "Portfolio maturity",
    items: [
      "Terra and Carlota Jo enter commercial stage",
      "Shared platform proves unit economics across multiple verticals",
      "Enterprise GTM with Microsoft 365 integration as distribution lever",
    ],
  },
];

const designPartnerStrategy = [
  "Target organizations with complex, high-stakes operational workflows",
  "Prioritize teams that feel the execution latency and ownership drift problem today",
  "Use paid pilots to generate proof objects — real data, real outcomes, real testimonials",
  "Every design-partner engagement becomes a reference architecture for the next vertical",
];

export default function InvestorsOverviewPage() {
  usePageMeta({
    title: "Investor Overview — SZL Holdings",
    description:
      "SZL Holdings company overview for investors — category definition, why now, architecture rationale, vertical strategy, and rollout path.",
    canonical: "https://szlholdings.com/investors/overview",
  });

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main>
        {/* Hero */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(38,72%,58%)]/20 bg-[hsl(38,72%,58%)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "hsl(38,72%,58%)", borderColor: "hsla(38,72%,58%,0.20)", background: "hsla(38,72%,58%,0.08)" }}>
              <Building2 className="h-3.5 w-3.5" />
              Company Overview
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              One architecture.
              <br />
              Multiple verticals.
              <br />
              Operational proof first.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">
              SZL Holdings is building the business observability category — software that connects
              signal detection, action routing, and outcome verification into a single accountable
              workflow. The company is not pitching a feature. It is building the infrastructure
              layer for how governed organizations make and audit operational decisions.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                See the live product
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/investors/architecture"
                className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]"
              >
                Architecture deep dive
              </Link>
            </div>
          </div>
        </section>

        {/* Category definition */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                  Category definition
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  Business observability is not a dashboard.
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/60">
                  Dashboards show what happened. Observability shows what needs to happen next — and
                  verifies that it did. The category connects signal detection to action routing to
                  outcome verification in one auditable workflow. That is not a feature set. It is a
                  new software layer.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {[
                  { label: "What dashboards do", value: "Show historical state" },
                  { label: "What observability does", value: "Surface next actions" },
                  { label: "What dashboards miss", value: "Ownership and accountability" },
                  { label: "What observability adds", value: "Audit trail and proof chain" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <p className="text-xs text-white/40">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why now */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
              Why now
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              Three converging conditions create the window.
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {whyNow.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6"
                  >
                    <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20">
                      <Icon className="h-4.5 w-4.5" style={{ color: "hsl(38,72%,58%)" }} />
                    </div>
                    <h3 className="text-base font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/55">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why this architecture */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
              Why this architecture
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              The shared spine is the strategic asset.
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {whyArchitecture.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6"
                >
                  <h3 className="text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/55">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why the demo matters */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="rounded-[2rem] p-8 lg:p-10" style={{ border: "1px solid hsla(206,72%,52%,0.15)", background: "hsla(206,72%,52%,0.06)" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "hsla(206,72%,52%,0.7)" }}>
                Why the demo matters
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                The product is not a pitch. It is running code.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">
                Every claim in this investor surface is backed by a running product. Live dashboards,
                real workflow execution, actual data ingestion. The strategy is: demo first, then
                architecture, then GitHub if needed. Proof beats narrative at every stage.
              </p>
              <div className="mt-6">
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  Open the live product
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Vertical strategy */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
              Vertical strategy
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              Five operating domains. One shared execution fabric.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">
              Vertical packs are not separate products — they are domain-specific configurations of
              the same architecture. Each one inherits signal ingestion, AI governance, workflow
              orchestration, and audit infrastructure.
            </p>
            <div className="mt-10 space-y-3">
              {verticals.map((v) => {
                const Icon = v.icon;
                return (
                  <div
                    key={v.name}
                    className="flex items-start gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
                  >
                    <div
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20"
                      style={{ color: v.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-white">{v.name}</span>
                        {v.wedge && (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ border: "1px solid hsla(38,72%,58%,0.25)", background: "hsla(38,72%,58%,0.10)", color: "hsl(38,72%,58%)" }}>
                            Commercial wedge
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm leading-6 text-white/55">{v.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Rollout path */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
              Rollout path
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              Three phases. One escalating evidence chain.
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {rolloutPath.map((phase, i) => (
                <div
                  key={phase.phase}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-6"
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.2em]"
                    style={{
                      color: i === 0 ? "hsl(38,72%,58%)" : i === 1 ? "hsl(206,72%,52%)" : "hsl(258,55%,68%)",
                    }}
                  >
                    {phase.phase}
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-white">{phase.label}</h3>
                  <ul className="mt-4 space-y-2.5">
                    {phase.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-white/55">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/25" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Design-partner strategy */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                  Design-partner strategy
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  Proof is the go-to-market strategy.
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/60">
                  Design partners are not beta customers. They are proof-generation partners. Each
                  engagement creates reference architecture, operating evidence, and the beginning of
                  a customer reference network.
                </p>
              </div>
              <div className="space-y-3">
                {designPartnerStrategy.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "hsl(38,72%,58%)" }} />
                    <p className="text-sm leading-6 text-white/70">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Explore further */}
        <section>
          <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
              Explore further
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Architecture", href: "/investors/architecture", icon: Layers },
                { label: "Moat & Defensibility", href: "/investors/moat", icon: Shield },
                { label: "Roadmap", href: "/investors/roadmap", icon: Map },
                { label: "Founder", href: "/investors/founder", icon: Building2 },
              ].map((item) => (
                <Link key={item.label} href={item.href}>
                  <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition hover:bg-white/[0.04]">
                    <item.icon className="h-4 w-4" style={{ color: "hsl(38,72%,58%)" }} />
                    <span className="text-sm font-medium text-white/80">{item.label}</span>
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
