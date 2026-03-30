import { useEffect, useRef } from "react";
import { m } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { VentureCard } from "@/components/VentureCard";
import { KPIStrip } from "@/components/KPIStrip";
import { SectionHeader } from "@/components/SectionHeader";
import { Constellation } from "@/components/Constellation";
import { ventures } from "@/data/ventures";
import { analytics, initScrollDepthTracking } from "@/lib/analytics";

const KPI_ITEMS = [
  { value: "$2.4B+", label: "Combined TAM", trend: "up" as const },
  { value: "8", label: "Active Ventures", trend: "neutral" as const },
  { value: "142%", label: "YoY Rev Growth", trend: "up" as const },
  { value: "91%", label: "Talent Retention", trend: "up" as const },
];

const WHY_ITEMS = [
  {
    title: "Vertical Integration Compounds",
    body: "Six platforms sharing one intelligence fabric, one security layer, and one infrastructure stack. Each venture benefits from the whole — and makes the whole more valuable.",
  },
  {
    title: "Domain Depth is the Moat",
    body: "General AI won't displace five years of maritime routing signals, cybersecurity red team playbooks, and CRE portfolio intelligence — all interconnected. That's the defensible position.",
  },
  {
    title: "Operators Build Better Software",
    body: "Every platform was designed by practitioners who've run the systems they're replacing. The result is software that solves real problems — not hypothetical ones.",
  },
  {
    title: "The Holding Structure Accelerates",
    body: "Portfolio companies access credibility, capital, talent pipelines, and shared infrastructure from day one. They compete as if they're larger than they are — because operationally, they are.",
  },
];

const AUDIENCE_CTAS = [
  {
    audience: "Investors",
    headline: "Investment thesis and portfolio briefings",
    cta: "Request a briefing",
    href: "/contact?type=investor",
    color: "#0f172a",
  },
  {
    audience: "Clients",
    headline: "Demo a venture or request a pilot",
    cta: "Schedule a demo",
    href: "/contact?type=client",
    color: "#2563eb",
  },
  {
    audience: "Partners",
    headline: "Integration and co-development opportunities",
    cta: "Explore partnership",
    href: "/contact?type=partner",
    color: "#7c3aed",
  },
  {
    audience: "Recruiters",
    headline: "Executive search and advisory engagement",
    cta: "Start a conversation",
    href: "/contact?type=recruiter",
    color: "#0891b2",
  },
];

const PRINCIPLES = [
  "Systems over tools",
  "Proprietary data before features",
  "Operators not consultants",
  "Compound value over quick exits",
  "Ship to learn — don't theorize to perfection",
];

export default function HomePage() {
  useEffect(() => {
    document.title = "SZL Holdings — Building Premium Command Systems";
    const cleanup = initScrollDepthTracking("home");
    return cleanup;
  }, []);

  const featuredVentures = ventures.filter((v) =>
    ["lyte", "vessels", "firestorm", "inca"].includes(v.id)
  );

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main>
        <HeroSection />
        <KPISection />
        <div className="bg-white border-t border-szl-border">
          <div className="max-w-7xl mx-auto px-6 pt-20 lg:pt-28">
            <SectionHeader
              eyebrow="Ecosystem"
              title="One operating fabric."
              subtitle="Eight ventures. Shared intelligence infrastructure, unified security, and compounding network effects — all connected through a single orchestration layer."
              accentWord="Eight ventures."
              align="center"
            />
          </div>
          <Constellation />
        </div>
        <WhySection />
        <FeaturedVenturesSection ventures={featuredVentures} />
        <FounderCredibilitySection />
        <ProofSection />
        <AudienceCTASection />
      </main>

      <SiteFooter />
    </div>
  );
}

function HeroSection() {
  const handleCTAClick = (label: string) => analytics.heroCTAClick(label);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(ellipse at center, rgba(37,99,235,0.06) 0%, transparent 65%)" }} />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(ellipse at center, rgba(139,92,246,0.04) 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(ellipse at center, rgba(6,182,212,0.04) 0%, transparent 65%)" }} />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: "linear-gradient(rgba(15,23,42,0.8) 1px, transparent 1px), linear-gradient(to right, rgba(15,23,42,0.8) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-szl-border bg-szl-bg-secondary text-szl-text-secondary text-xs font-medium tracking-wide">
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-50" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-500" />
            </span>
            Operating · 8 Active Ventures · Est. 2021
          </span>
        </m.div>

        <m.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="font-[var(--font-display)] text-5xl sm:text-6xl lg:text-7xl xl:text-[5rem] font-extrabold leading-[1.0] mb-6 tracking-tight text-szl-text"
        >
          Building premium
          <br />
          <span className="text-szl-accent">command systems.</span>
        </m.h1>

        <m.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="text-szl-text-secondary text-base sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          A venture and operating ecosystem building observability products, maritime intelligence,
          AI infrastructure, and high-trust service brands — all sharing one intelligence fabric.
        </m.p>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-20"
        >
          <Link
            href="/portfolio"
            onClick={() => handleCTAClick("Explore the Portfolio")}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-szl-primary text-white font-semibold text-sm hover:bg-szl-primary-light transition-colors shadow-sm"
          >
            Explore the Portfolio
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/founder"
            onClick={() => handleCTAClick("Meet the Founder")}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-szl-border text-szl-text-secondary font-semibold text-sm hover:text-szl-text hover:border-szl-border-hover hover:bg-szl-bg-secondary transition-all"
          >
            Meet the Founder
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </m.div>
      </div>
    </section>
  );
}

function KPISection() {
  return (
    <section className="border-y border-szl-border bg-szl-bg-secondary py-0">
      <div className="max-w-5xl mx-auto px-6">
        <KPIStrip items={KPI_ITEMS} variant="border" className="border-0 rounded-none" />
      </div>
    </section>
  );
}

function WhySection() {
  return (
    <section className="py-24 lg:py-32 bg-szl-bg-secondary border-t border-szl-border">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="Why SZL Exists"
          title="The enterprise software market has a systems problem."
          subtitle="Most software is built in isolation — a tool for this, a dashboard for that. SZL Holdings builds operating ecosystems: platforms that compound intelligence across verticals, share infrastructure, and get meaningfully better as they grow together."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {WHY_ITEMS.map((item, i) => (
            <m.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="rounded-2xl border border-szl-border bg-white p-6 hover:border-szl-border-hover hover:shadow-sm transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-lg bg-szl-primary flex items-center justify-center mb-4 text-white text-xs font-bold font-[var(--font-display)]">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="font-[var(--font-display)] text-sm font-bold text-szl-text mb-2">{item.title}</h3>
              <p className="text-xs text-szl-text-secondary leading-relaxed">{item.body}</p>
            </m.div>
          ))}
        </div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-szl-border bg-white p-8 sm:p-10"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-szl-text-muted mb-6">Founding Thesis</p>
          <blockquote className="font-[var(--font-display)] text-lg sm:text-xl text-szl-text leading-relaxed mb-6 max-w-4xl">
            "The next trillion-dollar companies won't be built on a single product — they'll emerge from intelligently orchestrated ecosystems where data flows between verticals, AI compounds across domains, and every platform makes the others exponentially more valuable. That's not a vision. It's an engineering problem. And we're solving it."
          </blockquote>
          <p className="text-szl-text-secondary text-sm font-semibold">
            — Stephen Lutar, Founder & Managing Partner
          </p>
        </m.div>
      </div>
    </section>
  );
}

function FeaturedVenturesSection({ ventures }: { ventures: typeof import("@/data/ventures").ventures }) {
  return (
    <section className="py-24 lg:py-32 bg-white border-t border-szl-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <SectionHeader
            eyebrow="Featured Ventures"
            title="Command-grade products across critical verticals."
            className="mb-0"
          />
          <Link
            href="/portfolio"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-szl-text-secondary hover:text-szl-accent transition-colors shrink-0 ml-6"
          >
            View all <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ventures.map((venture, i) => (
            <VentureCard key={venture.id} venture={venture} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FounderCredibilitySection() {
  return (
    <section className="py-24 lg:py-32 bg-szl-bg-secondary border-t border-szl-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <m.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-szl-text-muted mb-4">Founder</p>
            <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-szl-text leading-tight mb-5">
              Built by an operator,
              <br />
              <span className="text-szl-accent">not a theorist.</span>
            </h2>
            <p className="text-szl-text-secondary text-base leading-relaxed mb-6">
              Stephen Lutar founded SZL Holdings after years of running enterprise systems in high-stakes environments.
              Every platform in the portfolio was designed around operational problems he's personally seen — not market research.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {PRINCIPLES.map((p) => (
                <span key={p} className="px-3 py-1.5 rounded-lg bg-white border border-szl-border text-xs text-szl-text-secondary font-medium">
                  {p}
                </span>
              ))}
            </div>
            <Link
              href="/founder"
              onClick={() => analytics.founderPageView()}
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-szl-primary text-white text-sm font-semibold hover:bg-szl-primary-light transition-colors shadow-sm"
            >
              Read the founder story <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </m.div>

          <m.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { value: "5+", label: "Years Operating", note: "Across enterprise verticals" },
              { value: "8", label: "Ventures Built", note: "From zero to live" },
              { value: "$180M+", label: "Capital Deployed", note: "Across the ecosystem" },
              { value: "3", label: "Continents", note: "Active operations" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-szl-border bg-white p-5 text-center">
                <p className="font-[var(--font-display)] font-bold text-2xl text-szl-text mb-0.5">{stat.value}</p>
                <p className="text-xs font-semibold text-szl-text-secondary">{stat.label}</p>
                <p className="text-[10px] text-szl-text-muted mt-0.5">{stat.note}</p>
              </div>
            ))}
          </m.div>
        </div>
      </div>
    </section>
  );
}

function ProofSection() {
  const proofItems = [
    {
      title: "91% talent retention",
      body: "Across all portfolio companies — 23 points above comparable-stage venture-backed peers. The holding structure creates career trajectories, not just jobs.",
      tag: "Operations",
    },
    {
      title: "34-day dark vessel pre-detection",
      body: "Vessels Maritime Intelligence flagged dark vessel activity an average of 34 days before formal sanctions designations — a capability that doesn't exist in traditional maritime data.",
      tag: "Maritime",
    },
    {
      title: "$14M Series A — INCA AI",
      body: "Closed February 2026. The LLM evaluation market will be enormous; INCA is building the standard before the market consolidates.",
      tag: "AI / ML",
    },
    {
      title: "3 Fortune 500 security clients",
      body: "Firestorm Security replaced annual penetration testing with continuous adversarial simulation for three Fortune 500 organizations.",
      tag: "Cybersecurity",
    },
    {
      title: "40% shared infrastructure savings",
      body: "Eight platforms under one holding structure produces 40% lower cloud spend, unified security overhead, and engineering leverage standalone companies can't match.",
      tag: "Ecosystem",
    },
    {
      title: "142% aggregate YoY revenue growth",
      body: "Across the active portfolio. Domain-specific AI compounds differently than horizontal platform plays — and the numbers are showing it.",
      tag: "Performance",
    },
  ];

  return (
    <section className="py-24 lg:py-32 bg-white border-t border-szl-border">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="Proof Layer"
          title="Real outcomes from a real ecosystem."
          subtitle="Not projections. Not case studies from adjacent companies. Results from SZL portfolio operations, measured and verified."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {proofItems.map((item, i) => (
            <m.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-2xl border border-szl-border bg-white p-6 hover:border-szl-border-hover hover:shadow-sm transition-all duration-200"
            >
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-szl-bg-secondary border border-szl-border text-[10px] font-bold uppercase tracking-wider text-szl-text-muted mb-4">
                {item.tag}
              </span>
              <h3 className="font-[var(--font-display)] text-base font-bold text-szl-text mb-2">{item.title}</h3>
              <p className="text-xs text-szl-text-secondary leading-relaxed">{item.body}</p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AudienceCTASection() {
  return (
    <section className="py-24 lg:py-32 bg-szl-primary border-t border-szl-primary">
      <div className="max-w-6xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Get in Touch</p>
          <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-white mb-4">
            How can we help?
          </h2>
          <p className="text-white/60 text-base max-w-xl mx-auto">
            Different conversations for different contexts. Start with what applies to you.
          </p>
        </m.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {AUDIENCE_CTAS.map((item, i) => (
            <m.div
              key={item.audience}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Link
                href={item.href}
                onClick={() => analytics.contactFunnelStart(item.audience.toLowerCase())}
                className="group block rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 p-6 transition-all duration-200 h-full"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">{item.audience}</p>
                <h3 className="font-[var(--font-display)] text-sm font-bold text-white mb-4 leading-snug">{item.headline}</h3>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white/60 group-hover:text-white transition-colors">
                  {item.cta} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
