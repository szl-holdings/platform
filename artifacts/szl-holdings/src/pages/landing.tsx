import { Link } from "wouter";
import { m } from "framer-motion";
import {
  ArrowRight,
  Radar,
  Workflow,
  Shield,
  Anchor,
  Map,
  Gavel,
  Building2,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const ARCH_LAYERS = [
  { label: "Command Layer", desc: "Lyte", color: "#d4a054", sublabel: "Signal surface & operator console" },
  { label: "Action Spine", desc: "Alloy", color: "#4a90b8", sublabel: "Workflow orchestration & audit trail" },
  { label: "Vertical Packs", desc: "Domain OS", color: "#8b7ac8", sublabel: "PRISM · Terra · Vessels · Aegis · Carlota Jo" },
  { label: "Trust Layer", desc: "Governance", color: "#5fa87a", sublabel: "Policy routing & approval controls" },
  { label: "Worldline", desc: "Temporal fabric", color: "#c8853c", sublabel: "Event chain & state history" },
  { label: "Proof Chain", desc: "Audit engine", color: "#a07cc8", sublabel: "Immutable action trace" },
  { label: "Model Mesh", desc: "AI inference", color: "#4aa8b8", sublabel: "Governed model routing" },
  { label: "GraphQL Control Plane", desc: "Data access", color: "#b8a04a", sublabel: "Unified API surface" },
];

const PRODUCT_PACKS = [
  {
    slug: "prism-counsel",
    href: "/solutions/prism-counsel",
    label: "PRISM Counsel",
    category: "Legal Observability",
    color: "#8b7ac8",
    who: "Litigation teams & law firm operators",
    twin: "Matter twin with deadline, pressure & discovery state",
    signal: "Docket events, counterparty moves, cost drift",
    output: "Governed action queue with audit-grade trace",
  },
  {
    slug: "terra",
    href: "/solutions/terra",
    label: "Terra",
    category: "Real Estate Intelligence",
    color: "#5fa87a",
    who: "Acquisition and asset management teams",
    twin: "Deal twin with distress signals, ownership chain & underwriting state",
    signal: "Market anomalies, distress indicators, pipeline velocity",
    output: "Underwriting workflows with approval controls",
  },
  {
    slug: "vessels",
    href: "/solutions/vessels",
    label: "Vessels",
    category: "Maritime Intelligence",
    color: "#4a90b8",
    who: "Fleet operators, cargo managers, compliance teams",
    twin: "Vessel twin with voyage economics, route anomaly & sanction status",
    signal: "AIS, weather, port state, sanctions feeds",
    output: "Fleet command with risk-ranked action surface",
  },
  {
    slug: "aegis",
    href: "/solutions/aegis",
    label: "Aegis",
    category: "Security & Defense Intelligence",
    color: "#c85a5a",
    who: "SOC analysts, security operations leaders",
    twin: "Alert twin with triage state, investigation graph & policy trace",
    signal: "Threat feeds, SIEM events, endpoint telemetry",
    output: "Guided response with policy routing & audit chain",
  },
  {
    slug: "carlota-jo",
    href: "/carlota-jo/",
    label: "Carlota Jo",
    category: "Private Advisory",
    color: "#c8a05a",
    who: "Private clients seeking premium residential advisory",
    twin: "Client profile with property intelligence & lifecycle state",
    signal: "Market conditions, portfolio health, transaction readiness",
    output: "Advisory actions with document workflow",
  },
];

const DIFF_POINTS = [
  {
    title: "Signal → Visibility → Forecast → Governed Action",
    body: "Not dashboards. Not copilots. Not chat. A complete operating arc from raw signal to accountable, audited execution.",
  },
  {
    title: "One architecture. Every domain.",
    body: "Alloy is the shared spine. Each vertical pack inherits the same workflow engine, audit trail, and policy routing — not a bespoke build per industry.",
  },
  {
    title: "AI that is traceable by design",
    body: "Model outputs flow through the proof chain. Every inference is governed, logged, and linkable to the action it triggered. No black boxes.",
  },
  {
    title: "Accountability without overhead",
    body: "Approval controls and audit trace are built into the action primitive — not bolted on by compliance teams after the fact.",
  },
];

const TRUST_ITEMS = [
  "Design-partner mode — working directly with operators before formal go-to-market",
  "No fake traction, no fabricated logos, no generic 'AI platform' language",
  "Washington, D.C. · London · Singapore",
  "Founder-led: Stephen Lutar runs every design-partner and investor conversation personally",
];

const PACK_ICONS: Record<string, React.ReactNode> = {
  "prism-counsel": <Gavel className="h-5 w-5" />,
  terra: <Map className="h-5 w-5" />,
  vessels: <Anchor className="h-5 w-5" />,
  aegis: <Shield className="h-5 w-5" />,
  "carlota-jo": <Building2 className="h-5 w-5" />,
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function HomePage() {
  usePageMeta({
    title: "SZL Holdings — Intelligence & Action Architecture",
    description:
      "SZL Holdings builds one intelligence and action architecture with distinct vertical operating systems. Signal → visibility → forecast → governed action.",
    canonical: "https://szlholdings.com/",
  });

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main id="main-content">

        {/* ── 1. Hero ────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[#d4a054]/5 blur-[160px]" />
          </div>
          <div className="relative mx-auto max-w-7xl px-6 pt-28 pb-20 lg:px-8 lg:pt-36 lg:pb-28">
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200">
                <Radar className="h-3 w-3" />
                Design-partner stage · 2026
              </div>
              <p className="mb-4 text-sm uppercase tracking-[0.28em] text-white/45">SZL Holdings</p>
              <h1 className="max-w-5xl text-5xl font-semibold leading-[1.08] tracking-[-0.025em] text-white md:text-6xl lg:text-7xl">
                Signal → visibility →{" "}
                <span className="text-[#d4a054]">forecast</span> →{" "}
                governed action.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
                One intelligence and action architecture with distinct vertical operating systems. Not dashboards. Not copilots. Not chat — a complete arc from raw signal to accountable, audited execution.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#d4a054] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#c8953c]"
                >
                  See a live demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/design-partner"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
                >
                  Become a design partner
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        {/* ── 2. What The Company Is ─────────────────────────────────── */}
        <section className="border-b border-white/10 bg-white/[0.015]">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <div className="mb-12 max-w-2xl">
              <p className="text-xs uppercase tracking-[0.24em] text-[#d4a054]">The architecture</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                Lyte is the command layer. Alloy is the action spine. Vertical packs are the domain OS.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/60">
                SZL Holdings is building one intelligence and action architecture with distinct vertical operating systems for industries where execution latency, fragmented signal, and audit requirements make governed automation essential.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {/* Lyte */}
              <m.div
                custom={0} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="rounded-3xl border border-[#d4a054]/25 bg-[#d4a054]/8 p-7"
              >
                <div className="mb-4 inline-flex rounded-xl border border-[#d4a054]/20 bg-black/20 p-3">
                  <Radar className="h-5 w-5 text-[#d4a054]" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d4a054]">Command Layer</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Lyte</h3>
                <p className="mt-3 text-sm leading-7 text-white/65">
                  The operator console. Surfaces execution risk, ownership gaps, and workflow friction before they compound. The surface operators interact with every day.
                </p>
              </m.div>
              {/* Alloy */}
              <m.div
                custom={1} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="rounded-3xl border border-[#4a90b8]/25 bg-[#4a90b8]/8 p-7"
              >
                <div className="mb-4 inline-flex rounded-xl border border-[#4a90b8]/20 bg-black/20 p-3">
                  <Workflow className="h-5 w-5 text-[#4a90b8]" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4a90b8]">Action Spine</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Alloy</h3>
                <p className="mt-3 text-sm leading-7 text-white/65">
                  Workflow orchestration, signal normalization, approval controls, and audit trace. The durable operating layer beneath every vertical pack.
                </p>
              </m.div>
              {/* Packs */}
              <m.div
                custom={2} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="rounded-3xl border border-[#8b7ac8]/25 bg-[#8b7ac8]/8 p-7"
              >
                <div className="mb-4 inline-flex rounded-xl border border-[#8b7ac8]/20 bg-black/20 p-3">
                  <Building2 className="h-5 w-5 text-[#8b7ac8]" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b7ac8]">Domain OS</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Vertical Packs</h3>
                <p className="mt-3 text-sm leading-7 text-white/65">
                  PRISM Counsel, Terra, Vessels, Aegis, Carlota Jo — each a distinct vertical operating system on the shared Alloy spine. One architecture, every high-consequence domain.
                </p>
              </m.div>
            </div>
          </div>
        </section>

        {/* ── 3. Operating Architecture Diagram ─────────────────────── */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <div className="mb-12 max-w-2xl">
              <p className="text-xs uppercase tracking-[0.24em] text-[#4a90b8]">Architecture</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                One operating architecture. Eight layers. Infinite domains.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/60">
                Each layer has a single responsibility. Together they form the complete signal-to-action arc that powers every vertical pack.
              </p>
            </div>
            <div className="relative">
              <div className="flex flex-col gap-0">
                {ARCH_LAYERS.map((layer, i) => (
                  <m.div
                    key={layer.label}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="group relative flex items-stretch"
                  >
                    {/* connector line */}
                    {i < ARCH_LAYERS.length - 1 && (
                      <div
                        className="absolute left-8 top-full z-10 w-px"
                        style={{ height: "1px", background: `${layer.color}30`, transform: "scaleY(12)" }}
                      />
                    )}
                    <div
                      className="flex w-full items-center gap-5 rounded-xl border px-6 py-4 transition-all duration-200 group-hover:border-white/15 group-hover:bg-white/[0.02]"
                      style={{
                        borderColor: `${layer.color}22`,
                        marginBottom: i < ARCH_LAYERS.length - 1 ? "2px" : 0,
                      }}
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold"
                        style={{ background: `${layer.color}18`, color: layer.color, border: `1px solid ${layer.color}30` }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex flex-1 items-baseline gap-3 flex-wrap">
                        <span className="text-sm font-semibold text-white">{layer.label}</span>
                        <span className="text-xs text-white/40">—</span>
                        <span className="text-xs text-white/55">{layer.sublabel}</span>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
                        style={{ background: `${layer.color}15`, color: layer.color }}
                      >
                        {layer.desc}
                      </span>
                    </div>
                  </m.div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                <Link
                  href="/architecture"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/12 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white/25 hover:text-white"
                >
                  Explore the full architecture
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. Product Pack Cards ──────────────────────────────────── */}
        <section className="border-b border-white/10 bg-white/[0.015]">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <div className="mb-12 max-w-2xl">
              <p className="text-xs uppercase tracking-[0.24em] text-[#8b7ac8]">Product packs</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                Five vertical operating systems. One spine.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/60">
                Each pack ships a domain-specific digital twin, signal layer, and governed action surface — built on the same Alloy execution fabric.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {PRODUCT_PACKS.map((pack, i) => (
                <m.div
                  key={pack.slug}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                >
                  <Link
                    href={pack.href}
                    className="group block h-full rounded-2xl border border-white/8 bg-white/[0.02] p-6 transition-all duration-200 hover:border-white/15 hover:bg-white/[0.04]"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-xl"
                        style={{ background: `${pack.color}18`, color: pack.color, border: `1px solid ${pack.color}30` }}
                      >
                        {PACK_ICONS[pack.slug]}
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: pack.color }}>
                          {pack.category}
                        </p>
                        <h3 className="text-base font-semibold text-white">{pack.label}</h3>
                      </div>
                    </div>
                    <div className="space-y-2.5 text-xs leading-5 text-white/50">
                      <div className="flex gap-2">
                        <span className="shrink-0 font-semibold text-white/30 uppercase tracking-[0.12em]">Who</span>
                        <span className="text-white/60">{pack.who}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="shrink-0 font-semibold text-white/30 uppercase tracking-[0.12em]">Twin</span>
                        <span className="text-white/60">{pack.twin}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="shrink-0 font-semibold text-white/30 uppercase tracking-[0.12em]">Signal</span>
                        <span className="text-white/60">{pack.signal}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="shrink-0 font-semibold text-white/30 uppercase tracking-[0.12em]">Output</span>
                        <span className="text-white/60">{pack.output}</span>
                      </div>
                    </div>
                    <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold" style={{ color: pack.color }}>
                      Explore {pack.label}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. Why It's Different ──────────────────────────────────── */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <div className="mb-12 max-w-2xl">
              <p className="text-xs uppercase tracking-[0.24em] text-[#c8953c]">Differentiation</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                Not a dashboard. Not a copilot. Not a chat interface.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/60">
                Most AI software visualises the past or generates text. SZL builds systems that close the loop — from signal to accountable action with an auditable trail.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {DIFF_POINTS.map((point, i) => (
                <m.div
                  key={point.title}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className="rounded-2xl border border-white/10 bg-white/[0.025] p-7"
                >
                  <h3 className="text-base font-semibold text-white">{point.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/60">{point.body}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. Trust Summary ───────────────────────────────────────── */}
        <section className="border-b border-white/10 bg-white/[0.015]">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#5fa87a]">Trust</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  Honest posture. No fake traction.
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/60">
                  SZL operates transparently at design-partner stage. The architecture is real. The products are built. The go-to-market is disciplined and honest.
                </p>
                <div className="mt-6">
                  <Link
                    href="/trust"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/5"
                  >
                    Explore the trust center
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
              <div className="space-y-3">
                {TRUST_ITEMS.map((item, i) => (
                  <m.div
                    key={item}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5fa87a]" />
                    <span className="text-sm leading-6 text-white/70">{item}</span>
                  </m.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 7. Design Partner CTA ──────────────────────────────────── */}
        <section>
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
            <m.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-8 lg:p-12"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-[#d4a054]">Design partner programme</p>
              <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                One workflow. One founder. Real results.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">
                We work directly with a small number of operators to instrument one real workflow end-to-end using the Lyte + Alloy architecture. Design partners get direct access to Stephen and meaningful input into the product direction.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/design-partner"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  Apply as a design partner
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
                >
                  See a live demo
                </Link>
                <Link
                  href="/investors"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/5"
                >
                  Investor story
                </Link>
              </div>
            </m.div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
