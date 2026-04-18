import { Link } from "wouter";
import {
  ArrowRight,
  Building2,
  Layers,
  Shield,
  Map,
  Lock,
  User,
  FileText,
  ChevronRight,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const hubPages = [
  {
    href: "/investors/overview",
    icon: Building2,
    color: "#d4a054",
    label: "Overview",
    title: "Company & Category",
    description:
      "Why now, why this architecture, why these verticals, and why the demo matters more than the pitch.",
  },
  {
    href: "/investors/architecture",
    icon: Layers,
    color: "#8b7ac8",
    label: "Architecture",
    title: "Technical Defensibility",
    description:
      "The six-layer stack that every vertical inherits — and why rebuilding it from scratch is the wrong competitive strategy.",
  },
  {
    href: "/investors/moat",
    icon: Shield,
    color: "#4a90b8",
    label: "Moat",
    title: "Why It's Hard to Copy",
    description:
      "Shared spine, pack twins, audit timeline, proof chain, governed inference layer, governance API, Microsoft-native distribution.",
  },
  {
    href: "/investors/roadmap",
    icon: Map,
    color: "#6aaa72",
    label: "Roadmap",
    title: "Phased Rollout",
    description:
      "Flagship pack → expansion lanes → portfolio maturity. Design-partner milestones. Operational proof checkpoints.",
  },
  {
    href: "/investors/trust",
    icon: Lock,
    color: "#c8953c",
    label: "Trust",
    title: "Governance & Enterprise Readiness",
    description:
      "How the governance model connects to enterprise buyer requirements — and why trust is the product boundary, not a feature.",
  },
  {
    href: "/investors/data-room",
    icon: FileText,
    color: "#5a9a8a",
    label: "Data Room",
    title: "Request Access",
    description:
      "Structured materials for qualified investors. Company overview, product architecture, commercial strategy, and operating plan.",
  },
  {
    href: "/investors/founder",
    icon: User,
    color: "#a07a5a",
    label: "Founder",
    title: "Stephen Lutar",
    description:
      "Builder, operator, systems thinker. Why the founder matters for a company at this stage — and what the operating thesis is.",
  },
];

const fundamentals = [
  {
    label: "Stage",
    value: "Design-partner / pre-commercial",
    note: "Working directly with early teams before scaling",
  },
  {
    label: "Category",
    value: "Business observability",
    note: "Signal detection → action routing → outcome verification",
  },
  {
    label: "Architecture",
    value: "Shared spine, vertical packs",
    note: "One platform, multiple domain-specific products",
  },
  {
    label: "Wedge",
    value: "Lyte + Alloy → PRISM Counsel",
    note: "Legal operations is the first commercial vertical",
  },
  {
    label: "Expansion logic",
    value: "Vessels, Aegis, Terra",
    note: "Same architecture, new operating domains",
  },
  {
    label: "Edge",
    value: "Demo > pitch > architecture > GitHub",
    note: "Live product is the primary proof vehicle",
  },
];

export default function InvestorsHubPage() {
  usePageMeta({
    title: "Investor Hub — SZL Holdings",
    description:
      "The full investor surface for SZL Holdings — overview, architecture, moat, roadmap, trust, data room, and founder.",
    canonical: "https://szlholdings.com/investors",
  });

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main>
        {/* Hero */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:px-8 lg:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a054]/25 bg-[#d4a054]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#d4a054]">
              <Building2 className="h-3.5 w-3.5" />
              Investor Relations
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              SZL Holdings.
              <br />
              Investor Hub.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">
              Business observability infrastructure for organizations that need to see execution risk,
              workflow latency, and ownership gaps — and close them. One architecture. Multiple
              domain-specific packs. Operational proof first.
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
                href="/investors/data-room"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/25 hover:bg-white/[0.04]"
              >
                Request data room access
              </Link>
            </div>
          </div>
        </section>

        {/* Fundamentals */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
              Company fundamentals
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fundamentals.map((f) => (
                <div
                  key={f.label}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
                    {f.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">{f.value}</p>
                  <p className="mt-1 text-xs leading-5 text-white/50">{f.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hub navigation */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
              Explore the investor surface
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {hubPages.map((page) => {
                const Icon = page.icon;
                return (
                  <Link key={page.href} href={page.href}>
                    <div className="group flex cursor-pointer items-start gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition hover:border-white/10 hover:bg-white/[0.04]">
                      <div
                        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/25"
                        style={{ color: page.color }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className="text-xs font-semibold uppercase tracking-[0.18em]"
                            style={{ color: page.color }}
                          >
                            {page.label}
                          </p>
                        </div>
                        <p className="mt-1 text-base font-semibold text-white">{page.title}</p>
                        <p className="mt-2 text-sm leading-6 text-white/55">{page.description}</p>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-white/25 transition group-hover:text-white/45" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
            <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-8 lg:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/40">
                Start the conversation
              </p>
              <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-white">
                The clearest way to understand SZL is to see it running.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/60">
                Every investor conversation starts with the live product, not a slide deck. If you
                want structured materials, request data room access and we will route the right
                package.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  See the live demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/25 hover:bg-white/[0.04]"
                >
                  Send a note
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
