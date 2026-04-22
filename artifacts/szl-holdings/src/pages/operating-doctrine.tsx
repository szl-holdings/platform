import { Link } from "wouter";
import { m } from "framer-motion";
import {
  Layers, Cpu, Eye, ShieldCheck, Target, ChevronRight,
  GitBranch, Activity, Database, Network, BarChart3, 
  ArrowRight, Zap, Lock, Clock, CheckCircle2
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

const ACCENT = "#d4a054";
const ACCENT_DIM = "rgba(212,160,84,0.12)";

const PILLARS = [
  {
    icon: Eye,
    number: "01",
    title: "Observability as architecture",
    body: "Visibility into execution state, ownership gaps, and workflow friction must be designed into every system from the start — not bolted on after problems surface. Every platform in the SZL ecosystem exposes its own health surface.",
    principle: "If you can't see it, you can't govern it.",
  },
  {
    icon: Layers,
    number: "02",
    title: "Compound infrastructure",
    body: "Every shared layer — auth, design system, observability spine, event fabric — reduces the marginal cost of each subsequent platform. The 8th product costs a fraction of the 1st. Structural compounding is the primary moat.",
    principle: "Each layer built once, used by every product forever.",
  },
  {
    icon: GitBranch,
    number: "03",
    title: "Staged concentration",
    body: "Capital, time, and attention are scarce. The company maintains one commercial wedge (KORA + FORGE) while the remainder of the ecosystem is staged as expansion value — visible but not simultaneously chased.",
    principle: "One story well-told beats five stories half-told.",
  },
  {
    icon: Lock,
    number: "04",
    title: "Governed action over autonomous execution",
    body: "In high-stakes operational domains, the cost of a wrong decision vastly exceeds the cost of a slow one. Every consequential action passes through a human-in-the-loop approval gate with a complete audit trail.",
    principle: "Automation accelerates. Governance protects.",
  },
  {
    icon: Network,
    number: "05",
    title: "Command-centered product design",
    body: "The best tools surface the right decision to the right person at the right moment — with the right context. Every SZL product follows this pattern: observe, surface, recommend, route, govern.",
    principle: "Observation to action. Governance at every step.",
  },
  {
    icon: Target,
    number: "06",
    title: "Precision over throughput",
    body: "In maritime, security, real estate, and AI operations, precision and auditability outperform raw throughput. Every platform is optimized for correctness first, speed second.",
    principle: "Right before fast. Always.",
  },
];

const OPERATING_LOOP = [
  { step: "Signal", desc: "Systems emit structured events from every material operation — approvals, workflow state, ownership changes, risk flags.", icon: Activity },
  { step: "Surface", desc: "Intelligence layers process signals into prioritized action surfaces — ranked by business impact, urgency, and ownership clarity.", icon: Eye },
  { step: "Recommend", desc: "Explainable recommendations with evidence, confidence, and source attribution. No opaque outputs.", icon: Cpu },
  { step: "Route", desc: "Actions route to the right person through the right channel — with context, priority, and clear authority.", icon: Network },
  { step: "Govern", desc: "Every consequential action passes through approval controls and is recorded in an immutable audit trail.", icon: ShieldCheck },
  { step: "Learn", desc: "Outcomes feed back into signal calibration. The system improves with every decision cycle.", icon: BarChart3 },
];

const PORTFOLIO_COLUMNS = [
  {
    label: "Commercial Wedge",
    color: ACCENT,
    items: [
      { name: "KORA", desc: "Governed decision command layer" },
      { name: "Alloy Engine", desc: "Execution and orchestration fabric" },
    ],
  },
  {
    label: "Expansion Lanes",
    color: "#7ba3d4",
    items: [
      { name: "PARAGON", desc: "Security & incident command" },
      { name: "SEXTANT", desc: "Maritime intelligence platform" },
      { name: "DOMAINE", desc: "Real estate intelligence platform" },
      { name: "Counsel", desc: "Legal observability (early stage)" },
    ],
  },
  {
    label: "Services & Advisory",
    color: "#8b7ac8",
    items: [
      { name: "Carlota Jo", desc: "Premium advisory & consulting brand" },
    ],
  },
];

export default function OperatingDoctrinePage() {
  const __pageMeta = usePageMeta({
    title: "Operating Doctrine — SZL Holdings",
    description: "The principles, architecture, and operating loop that govern every SZL Holdings product and decision.",
    canonical: "https://szlholdings.com/operating-doctrine",
  });

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen bg-[#070a10] text-white">
        <SiteNav />
        <main>
          {/* Hero */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <p className="text-xs uppercase tracking-[0.24em] text-white/45 mb-4">Operating Doctrine</p>
                <h1 className="text-5xl font-semibold tracking-tight text-white md:text-6xl lg:text-7xl mb-6 max-w-4xl">
                  The principles that govern every decision.
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-white/70">
                  SZL Holdings is built on a small set of durable operating principles — not a mission statement, not a values poster.
                  These are the structural commitments that inform architecture, prioritization, product design, and capital allocation across the entire ecosystem.
                </p>
              </m.div>
            </div>
          </section>
  
          {/* Operating Loop */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
              <div className="mb-10">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/40 mb-3">The Operating Loop</p>
                <h2 className="text-3xl font-semibold text-white">Signal → Surface → Govern</h2>
                <p className="mt-3 text-white/60 max-w-2xl">Every SZL platform runs a common operational arc — from raw events to governed action. The loop is the same whether it's a security incident, a voyage anomaly, or a stalled approval.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {OPERATING_LOOP.map((node, i) => {
                  const Icon = node.icon;
                  return (
                    <m.div
                      key={node.step}
                      custom={i}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true }}
                      variants={fadeUp}
                      className="relative rounded-2xl border border-white/8 bg-white/[0.02] p-5"
                    >
                      <div className="mb-3 inline-flex rounded-lg border border-white/8 bg-black/20 p-2">
                        <Icon className="h-4 w-4" style={{ color: ACCENT }} />
                      </div>
                      <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: ACCENT }}>{String(i + 1).padStart(2, "0")}</p>
                      <p className="text-sm font-semibold text-white mb-2">{node.step}</p>
                      <p className="text-xs leading-relaxed text-white/50">{node.desc}</p>
                      {i < OPERATING_LOOP.length - 1 && (
                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 hidden lg:block z-10">
                          <ChevronRight className="h-4 w-4 text-white/20" />
                        </div>
                      )}
                    </m.div>
                  );
                })}
              </div>
            </div>
          </section>
  
          {/* Six Pillars */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
              <div className="mb-12">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/40 mb-3">Six Pillars</p>
                <h2 className="text-3xl font-semibold text-white">The structural commitments</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {PILLARS.map((pillar, i) => {
                  const Icon = pillar.icon;
                  return (
                    <m.div
                      key={pillar.number}
                      custom={i}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true }}
                      variants={fadeUp}
                      className="rounded-3xl border border-white/8 bg-white/[0.02] p-7 flex flex-col"
                    >
                      <div className="flex items-center gap-3 mb-5">
                        <div className="inline-flex rounded-xl border p-2.5" style={{ borderColor: `${ACCENT}30`, background: ACCENT_DIM }}>
                          <Icon className="h-5 w-5" style={{ color: ACCENT }} />
                        </div>
                        <span className="text-[11px] uppercase tracking-widest text-white/30">{pillar.number}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-3 leading-snug">{pillar.title}</h3>
                      <p className="text-sm leading-relaxed text-white/60 flex-1 mb-5">{pillar.body}</p>
                      <div className="rounded-xl border px-4 py-3 text-xs italic leading-relaxed" style={{ borderColor: `${ACCENT}20`, background: ACCENT_DIM, color: ACCENT }}>
                        "{pillar.principle}"
                      </div>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </section>
  
          {/* Portfolio Architecture */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
              <div className="mb-12">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/40 mb-3">Portfolio Architecture</p>
                <h2 className="text-3xl font-semibold text-white">One wedge. Staged expansion.</h2>
                <p className="mt-3 text-white/60 max-w-2xl">The portfolio is intentionally staged. Capital and GTM resources concentrate on the commercial wedge. Expansion lanes remain visible as future value built on the same operating spine.</p>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {PORTFOLIO_COLUMNS.map((col, ci) => (
                  <m.div
                    key={col.label}
                    custom={ci}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className="rounded-3xl border border-white/8 bg-white/[0.02] p-6"
                  >
                    <div className="mb-5 pb-4 border-b border-white/8">
                      <div className="inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ background: `${col.color}18`, color: col.color }}>
                        {col.label}
                      </div>
                    </div>
                    <div className="space-y-4">
                      {col.items.map((item) => (
                        <div key={item.name} className="flex items-start gap-3">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: col.color }} />
                          <div>
                            <p className="text-sm font-medium text-white">{item.name}</p>
                            <p className="text-xs text-white/45 mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Capital Discipline */}
          <section className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
              <div className="grid lg:grid-cols-2 gap-12 items-start">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/40 mb-3">Capital Discipline</p>
                  <h2 className="text-3xl font-semibold text-white mb-5">Operating with founder-grade accountability</h2>
                  <p className="text-white/60 leading-relaxed mb-6">
                    SZL Holdings operates with the same capital discipline it designs into its products. Every resource allocation maps to a specific milestone. Every milestone has a measurable outcome.
                  </p>
                  <div className="space-y-4">
                    {[
                      { icon: Clock, label: "90-day operating cycles", desc: "Planning and capital allocation in 90-day windows with explicit outcomes." },
                      { icon: Target, label: "Milestone-gated spending", desc: "No resource deployment without a measurable milestone that justifies it." },
                      { icon: Database, label: "Single source of truth", desc: "Financial model, operating plan, and roadmap are a single document — not three." },
                      { icon: Zap, label: "Revenue-first instinct", desc: "Every initiative is evaluated against its path to revenue. Services subsidize product." },
                    ].map((item, _i) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="flex gap-4">
                          <div className="shrink-0 mt-0.5 inline-flex rounded-lg border border-white/8 bg-black/20 p-2 h-fit">
                            <Icon className="h-4 w-4" style={{ color: ACCENT }} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white mb-1">{item.label}</p>
                            <p className="text-sm text-white/50">{item.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-3xl border border-white/8 bg-white/[0.02] p-8">
                  <p className="text-[11px] uppercase tracking-widest text-white/40 mb-6">Decision Filters</p>
                  <div className="space-y-5">
                    {[
                      "Does this create structural advantage that compounds?",
                      "Does this move the commercial wedge forward?",
                      "Can this be built on existing shared infrastructure?",
                      "Does this produce evidence for the next capital conversation?",
                      "Can we explain the ROI in one sentence?",
                    ].map((q, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-[11px] text-white/30 mt-0.5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                        <p className="text-sm text-white/70 leading-relaxed">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
  
          {/* CTA */}
          <section>
            <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2">See the platform in action</h2>
                  <p className="text-white/55">Explore the commercial wedge and the full portfolio map.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a href="/command/operations/" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-80" style={{ background: ACCENT, color: "#070a10" }}>
                    Explore Lyte <ArrowRight className="h-4 w-4" />
                  </a>
                  <Link href="/ventures" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/30">
                    Platform Map <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
