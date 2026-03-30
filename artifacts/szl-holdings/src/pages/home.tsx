import { useEffect } from "react";
import { m } from "framer-motion";
import { ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SectionHeader } from "@/components/SectionHeader";
import { analytics, initScrollDepthTracking } from "@/lib/analytics";

const FEATURED_PLATFORMS = [
  {
    id: "lyte",
    name: "Lyte",
    category: "Business Observability",
    status: "Live",
    tagline: "See risk, latency, ownership gaps, and workflow friction before they hit execution.",
    audience: "Executives, ops leaders, and delivery teams in complex service environments.",
    href: "/lyte-command-center/",
    accent: "#06b6d4",
    tier: 1,
  },
  {
    id: "vessels",
    name: "Vessels",
    category: "Maritime Command",
    status: "Live",
    tagline: "Turn fleet visibility, voyage performance, and operational exceptions into command.",
    audience: "Fleet operators, maritime managers, and owners requiring real-time vessel intelligence.",
    href: "/vessels/",
    accent: "#3b82f6",
    tier: 1,
  },
  {
    id: "carlota-jo",
    name: "Carlota Jo",
    category: "Premium Services",
    status: "Pilot Ready",
    tagline: "Discreet operational and residence support for high-touch environments.",
    audience: "HNWI families, principals, and estate managers requiring white-glove execution.",
    href: "/carlota-jo/",
    accent: "#d97706",
    tier: 2,
  },
];

const ALLOY_CAPABILITIES = [
  {
    name: "Signal Ingestion",
    desc: "Cross-platform data acquisition from operational, financial, and environmental sources.",
  },
  {
    name: "Workflow Orchestration",
    desc: "Multi-step process sequencing with conditional logic and human approval gates.",
  },
  {
    name: "Action Routing",
    desc: "Intelligent distribution of tasks and alerts to the right person at the right time.",
  },
  {
    name: "Output Generation",
    desc: "Structured reports, narratives, and decision briefs produced without manual effort.",
  },
  {
    name: "Human Approval",
    desc: "Built-in governance checkpoints that keep humans in the loop on high-stakes decisions.",
  },
];

const PROOF_CARDS = [
  {
    tag: "Observability",
    title: "Approval latency detected in 4 minutes",
    body: "Lyte surfaced a critical approval queue stall 8 days before the weekly review would have caught it. Revenue leakage recovered: $340K/quarter.",
  },
  {
    tag: "Maritime",
    title: "34-day dark vessel pre-detection lead",
    body: "Vessels flagged dark vessel activity 34 days before formal sanctions designation — a capability unavailable in traditional maritime data.",
  },
  {
    tag: "Operations",
    title: "Zero coordination gaps across 90-day relocation",
    body: "Carlota Jo coordinated 14 vendors, 6 household staff, and cross-border logistics. The principal described the transition as invisible.",
  },
  {
    tag: "Ecosystem",
    title: "40% lower infrastructure overhead",
    body: "Multiple platforms under one holding structure produces shared cloud spend, unified security overhead, and engineering leverage no standalone company can match.",
  },
];

const CASE_STUDIES = [
  { tag: "Observability", title: "Approval Latency", body: "Lyte surfaced critical approval queue stalls 8 days before the weekly review would have caught them." },
  { tag: "Ownership", title: "Ownership Gaps", body: "Lyte mapped ownership accountability across 12 teams — exposing 34 unassigned high-risk items in a single scan." },
  { tag: "Forecasting", title: "Forecast Drift", body: "Lyte detected forecast variance 11 days before quarter close — enough lead time to course-correct." },
  { tag: "Operational", title: "Readiness Tracking", body: "Lyte Readiness quantified framework maturity across 6 domains, replacing manual spreadsheet audits." },
  { tag: "Maritime", title: "Voyage Profitability", body: "Vessels isolated an underperforming voyage leg costing 14% margin compression across 3 routes." },
  { tag: "Maritime", title: "Operational Exceptions", body: "Vessels flagged dark vessel activity 34 days before formal sanctions designation." },
];

const CONTACT_PATHS = [
  {
    audience: "Investors / Partners",
    headline: "Capital, co-development, and strategic alignment opportunities",
    cta: "Start a Conversation",
    href: "/contact?type=partner",
  },
  {
    audience: "Clients",
    headline: "Demo a platform or request a pilot deployment",
    cta: "Request a Demo",
    href: "/contact?type=client",
  },
  {
    audience: "Recruiters",
    headline: "Executive search, advisory, and strategic operator roles",
    cta: "Connect with Stephen",
    href: "/contact?type=recruiter",
  },
  {
    audience: "Strategic Conversations",
    headline: "Carlota Jo — discreet, high-trust operational support",
    cta: "Start a Conversation",
    href: "/contact?type=client",
  },
];

export default function HomePage() {
  useEffect(() => {
    document.title = "SZL Holdings — Premium Command Systems";
    const cleanup = initScrollDepthTracking("home");
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main>
        <HeroSection />
        <FeaturedPlatformsSection />
        <EcosystemLogicSection />
        <AlloyBackboneSection />
        <FounderSection />
        <ProofSection />
        <CaseStudyStripSection />
        <ContactByAudienceSection />
      </main>

      <SiteFooter />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(ellipse at center, rgba(37,99,235,0.06) 0%, transparent 65%)" }} />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(ellipse at center, rgba(6,182,212,0.04) 0%, transparent 65%)" }} />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: "linear-gradient(rgba(15,23,42,0.8) 1px, transparent 1px), linear-gradient(to right, rgba(15,23,42,0.8) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
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
            Alloy · Lyte · Vessels · Carlota Jo
          </span>
        </m.div>

        <m.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="font-[var(--font-display)] text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.02] mb-6 tracking-tight text-szl-text"
        >
          SZL Holdings builds
          <br />
          <span className="text-szl-accent">premium command systems</span>
          <br />
          across observability and operations.
        </m.h1>

        <m.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="text-szl-text-secondary text-base sm:text-lg max-w-2xl mx-auto mb-3 leading-relaxed"
        >
          One parent company. One intelligence backbone. Four purpose-built platforms — Lyte for business observability,
          Vessels for maritime command, Carlota Jo for high-trust operational support, and Alloy powering the ecosystem.
        </m.p>

        <m.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="text-szl-text-muted text-sm mb-10 tracking-wide"
        >
          One ecosystem. One operating philosophy. One standard of execution.
        </m.p>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10"
        >
          <Link
            href="/portfolio"
            onClick={() => analytics.heroCTAClick("Explore the Ecosystem")}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-szl-primary text-white font-semibold text-sm hover:bg-szl-primary-light transition-colors shadow-sm"
          >
            Explore the Ecosystem
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/founder"
            onClick={() => analytics.heroCTAClick("Meet the Founder")}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-szl-border text-szl-text-secondary font-semibold text-sm hover:text-szl-text hover:border-szl-border-hover hover:bg-szl-bg-secondary transition-all"
          >
            Meet the Founder
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-20"
        >
          <a
            href="/lyte-command-center/"
            onClick={() => analytics.heroCTAClick("Explore Lyte")}
            className="text-xs font-semibold text-szl-text-muted hover:text-szl-accent transition-colors flex items-center gap-1"
          >
            Explore Lyte <ArrowRight className="w-3 h-3" />
          </a>
          <span className="text-szl-border">·</span>
          <a
            href="/vessels/"
            onClick={() => analytics.heroCTAClick("Explore Vessels")}
            className="text-xs font-semibold text-szl-text-muted hover:text-szl-accent transition-colors flex items-center gap-1"
          >
            Explore Vessels <ArrowRight className="w-3 h-3" />
          </a>
          <span className="text-szl-border">·</span>
          <a
            href="/carlota-jo/"
            onClick={() => analytics.heroCTAClick("Explore Carlota Jo")}
            className="text-xs font-semibold text-szl-text-muted hover:text-szl-accent transition-colors flex items-center gap-1"
          >
            Explore Carlota Jo <ArrowRight className="w-3 h-3" />
          </a>
        </m.div>
      </div>
    </section>
  );
}

function EcosystemLogicSection() {
  const HIERARCHY = [
    { level: "Parent Company", name: "SZL Holdings", desc: "The holding company. Sets operating standards, allocates capital, and governs the ecosystem.", accent: "#2563eb", tier: 0 },
    { level: "Intelligence Backbone", name: "Alloy", desc: "Core systems and orchestration engine. Powers signal ingestion, workflow orchestration, action routing, output generation, and human approval gates across all platforms.", accent: "#06b6d4", tier: 1, href: "/alloy/" },
    { level: "Platform — Observability", name: "Lyte", desc: "Business observability. Surfaces risk, latency, ownership gaps, and workflow friction — before they hit execution.", accent: "#f59e0b", tier: 2, href: "/lyte-command-center/", status: "Live" },
    { level: "Platform — Maritime", name: "Vessels", desc: "Maritime command. Turns fleet visibility, voyage performance, and operational exceptions into decisive action.", accent: "#3b82f6", tier: 2, href: "/vessels/", status: "Live" },
    { level: "Service Brand", name: "Carlota Jo", desc: "Premium service brand. Discreet, high-trust operational and residence support for demanding environments.", accent: "#d97706", tier: 2, href: "/carlota-jo/", status: "Pilot Ready" },
  ];

  return (
    <section className="py-20 lg:py-28 bg-szl-bg-secondary border-t border-szl-border">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="Ecosystem Logic"
          title="The hierarchy is intentional."
          subtitle="SZL Holdings is the parent entity. Alloy is the intelligence backbone shared across every platform. Lyte, Vessels, and Carlota Jo are purpose-built command surfaces — each solving a specific domain problem, all running on the same operating fabric."
        />

        <div className="mt-12 space-y-3">
          {HIERARCHY.map((item, i) => (
            <m.div
              key={item.name}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              {item.href ? (
                <a href={item.href} className="group flex items-start gap-6 rounded-2xl border border-szl-border bg-white p-5 hover:border-szl-border-hover hover:shadow-sm transition-all duration-200 block"
                  style={{ marginLeft: item.tier === 2 ? "1.5rem" : item.tier === 1 ? "0.5rem" : "0" }}>
                  <div className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ backgroundColor: item.accent }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-szl-text-muted">{item.level}</p>
                      {item.status && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-szl-border bg-szl-bg-secondary text-szl-text-muted">{item.status}</span>
                      )}
                    </div>
                    <h3 className="font-[var(--font-display)] text-sm font-bold text-szl-text mb-1 group-hover:text-szl-accent transition-colors">{item.name}</h3>
                    <p className="text-xs text-szl-text-secondary leading-relaxed">{item.desc}</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-start gap-6 rounded-2xl border border-szl-border bg-white p-5">
                  <div className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ backgroundColor: item.accent }} />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-szl-text-muted mb-1">{item.level}</p>
                    <h3 className="font-[var(--font-display)] text-sm font-bold text-szl-text mb-1">{item.name}</h3>
                    <p className="text-xs text-szl-text-secondary leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              )}
            </m.div>
          ))}
        </div>

        <m.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-xs text-szl-text-muted text-center mt-8"
        >
          Stephen Lutar — Founder & Operator
        </m.p>
      </div>
    </section>
  );
}

function FeaturedPlatformsSection() {
  return (
    <section className="py-20 lg:py-28 bg-white border-t border-szl-border">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="Featured Platforms"
          title="Command-grade products. Built for the real work."
        />

        <div className="grid lg:grid-cols-3 gap-6 mt-12">
          {FEATURED_PLATFORMS.map((p, i) => (
            <m.a
              key={p.id}
              href={p.href}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group block rounded-2xl border border-szl-border bg-white hover:border-szl-border-hover hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div className="h-1.5 w-full" style={{ backgroundColor: p.accent }} />
              <div className="p-7">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-szl-text-muted">{p.category}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-szl-border bg-szl-bg-secondary text-szl-text-muted">{p.status}</span>
                </div>
                <h3 className="font-[var(--font-display)] text-xl font-bold text-szl-text mb-3">{p.name}</h3>
                <p className="text-sm text-szl-text-secondary leading-relaxed mb-3">{p.tagline}</p>
                <p className="text-xs text-szl-text-muted leading-relaxed mb-5 italic">{p.audience}</p>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-szl-text-secondary group-hover:text-szl-accent transition-colors">
                  Explore {p.name} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </m.a>
          ))}
        </div>
      </div>
    </section>
  );
}

function AlloyBackboneSection() {
  return (
    <section className="py-20 lg:py-28 bg-szl-primary border-t border-szl-primary">
      <div className="max-w-6xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Alloy Backbone</p>
          <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-white mb-4">
            The intelligence layer behind every platform.
          </h2>
          <p className="text-white/60 text-base max-w-2xl mx-auto leading-relaxed">
            Alloy is not a product you buy. It is the operating infrastructure that makes every SZL platform credible — shared signal ingestion, workflow orchestration, action routing, output generation, and human approval gates.
          </p>
        </m.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {ALLOY_CAPABILITIES.map((cap, i) => (
            <m.div
              key={cap.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center mb-3">
                <span className="text-white text-[10px] font-bold font-[var(--font-display)]">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="font-[var(--font-display)] text-sm font-bold text-white mb-1.5">{cap.name}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{cap.desc}</p>
            </m.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href="/alloy/"
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            Explore Alloy <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
}

function FounderSection() {
  return (
    <section className="py-20 lg:py-28 bg-white border-t border-szl-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <m.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-szl-text-muted mb-4">Founder & Operator</p>
            <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-szl-text leading-tight mb-5">
              Stephen Lutar.<br />
              <span className="text-szl-accent">Builder. Operator. Systems thinker.</span>
            </h2>
            <p className="text-szl-text-secondary text-base leading-relaxed mb-8">
              Stephen Lutar builds systems that connect visibility, execution, and operating discipline. Every platform in the ecosystem was designed around operational problems he has personally encountered — not market research, not feature requests. The result is command-grade software built by an operator, for operators.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {["Systems over tools", "Proprietary data before features", "Operators not consultants", "Ship to learn"].map((p) => (
                <span key={p} className="px-3 py-1.5 rounded-lg bg-szl-bg-secondary border border-szl-border text-xs text-szl-text-secondary font-medium">
                  {p}
                </span>
              ))}
            </div>
            <Link
              href="/founder"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-szl-primary text-white text-sm font-semibold hover:bg-szl-primary-light transition-colors shadow-sm"
            >
              Meet the Founder <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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
              { value: "4", label: "Platforms Live", note: "Alloy, Lyte, Vessels, Carlota Jo" },
              { value: "34 days", label: "Dark Vessel Lead Time", note: "Before formal designation" },
              { value: "100%", label: "Client Retention", note: "Carlota Jo pilot cohort" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-szl-border bg-szl-bg-secondary p-5 text-center">
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
  return (
    <section className="py-20 lg:py-28 bg-szl-bg-secondary border-t border-szl-border">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="Proof of Execution"
          title="Real outcomes. Active deployment."
          subtitle="Not projections. Not hypotheticals. Documented results from platforms operating in production environments."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          {PROOF_CARDS.map((item, i) => (
            <m.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="rounded-2xl border border-szl-border bg-white p-6 hover:border-szl-border-hover hover:shadow-sm transition-all duration-200"
            >
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-szl-bg-secondary border border-szl-border text-[10px] font-bold uppercase tracking-wider text-szl-text-muted mb-4">
                {item.tag}
              </span>
              <h3 className="font-[var(--font-display)] text-sm font-bold text-szl-text mb-2">{item.title}</h3>
              <p className="text-xs text-szl-text-secondary leading-relaxed">{item.body}</p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CaseStudyStripSection() {
  return (
    <section className="py-20 lg:py-28 bg-white border-t border-szl-border">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="Case Studies"
          title="Real outcomes. Documented results."
          subtitle="Specific operational outcomes from platforms in active deployment — not projections, not hypotheticals."
          align="center"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
          {CASE_STUDIES.map((item, i) => (
            <m.div
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="rounded-xl border border-szl-border bg-szl-bg-secondary p-5 hover:border-szl-border-hover hover:bg-white transition-all duration-200"
            >
              <span className="inline-block px-2 py-0.5 rounded-full bg-white border border-szl-border text-[9px] font-bold uppercase tracking-wider text-szl-text-muted mb-3">{item.tag}</span>
              <h3 className="font-[var(--font-display)] text-sm font-bold text-szl-text mb-2">{item.title}</h3>
              <p className="text-xs text-szl-text-secondary leading-relaxed">{item.body}</p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactByAudienceSection() {
  return (
    <section className="py-20 lg:py-28 bg-szl-primary border-t border-szl-primary">
      <div className="max-w-6xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Contact by Audience</p>
          <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-white mb-4">
            Start the right conversation.
          </h2>
          <p className="text-white/60 text-base max-w-xl mx-auto">
            Different audiences, different contexts. Tell us what applies to you.
          </p>
        </m.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CONTACT_PATHS.map((item, i) => (
            <m.div
              key={item.audience}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Link
                href={item.href}
                className="group block rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 p-6 transition-all duration-200 h-full"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">{item.audience}</p>
                <h3 className="font-[var(--font-display)] text-sm font-bold text-white mb-5 leading-snug">{item.headline}</h3>
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
