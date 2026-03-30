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
    href: "/lyte-command-center/",
    accent: "#06b6d4",
  },
  {
    id: "vessels",
    name: "Vessels",
    category: "Maritime Command",
    status: "Live",
    tagline: "Turn fleet visibility, voyage performance, and operational exceptions into command.",
    href: "/vessels/",
    accent: "#3b82f6",
  },
  {
    id: "carlota-jo",
    name: "Carlota Jo",
    category: "Premium Services",
    status: "Pilot Ready",
    tagline: "Discreet operational and residence support for high-touch environments.",
    href: "/carlota-jo/",
    accent: "#d97706",
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

const PROBLEM_TILES = [
  "Approval chains that stall without anyone noticing",
  "Fleet exceptions that surface too late to act on",
  "Workflow handoffs that break between systems",
  "Ownership gaps that let high-value items drift",
  "Forecast drift caught too late to course-correct",
  "Residence and estate operations without a trusted operator",
  "Operational intelligence without a command surface",
  "AI infrastructure without governance or explainability",
];

const CONTACT_PATHS = [
  {
    audience: "Product / Platform",
    headline: "Demo a platform or request a pilot",
    cta: "Request a Demo",
    href: "/contact?type=client",
  },
  {
    audience: "Service",
    headline: "Carlota Jo — discreet, high-trust operational support",
    cta: "Start a Conversation",
    href: "/contact?type=client",
  },
  {
    audience: "Strategic Partnership",
    headline: "Integration and co-development opportunities",
    cta: "Explore the Model",
    href: "/contact?type=partner",
  },
  {
    audience: "Founder / Recruiting",
    headline: "Executive search, advisory, and strategic roles",
    cta: "Connect with Stephen",
    href: "/contact?type=recruiter",
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
        <EcosystemSection />
        <FeaturedPlatformsSection />
        <HowItWorksSection />
        <PoweredByAlloySection />
        <FounderSection />
        <ProofSection />
        <ProblemTilesSection />
        <ContactPathsSection />
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
          Building premium command systems
          <br />
          <span className="text-szl-accent">across observability, operations,</span>
          <br />
          <span className="text-szl-accent">and specialized platforms.</span>
        </m.h1>

        <m.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="text-szl-text-secondary text-base sm:text-lg max-w-2xl mx-auto mb-3 leading-relaxed"
        >
          Alloy orchestrates the intelligence layer. Lyte delivers business observability. Vessels commands maritime operations.
          Carlota Jo provides high-trust operational support.
        </m.p>

        <m.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="text-szl-text-muted text-sm mb-10 tracking-wide"
        >
          One ecosystem. One operating philosophy. Multiple command surfaces.
        </m.p>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-20"
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
      </div>
    </section>
  );
}

function EcosystemSection() {
  return (
    <section className="py-20 lg:py-28 bg-szl-bg-secondary border-t border-szl-border">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="The Ecosystem"
          title="One operating fabric. Four command surfaces."
          subtitle="SZL Holdings is the parent company behind Alloy, Lyte, Vessels, and Carlota Jo. Each platform is purpose-built. All share one intelligence layer, one operating philosophy, and one standard of execution."
          align="center"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          {[
            { name: "Alloy", role: "Core Systems & Orchestration Engine", desc: "The intelligence layer that powers every platform in the ecosystem.", status: "Live", href: "/alloy/" },
            { name: "Lyte", role: "Business Observability Platform", desc: "See risk, latency, ownership gaps, and workflow friction before they hit execution.", status: "Live", href: "/lyte-command-center/" },
            { name: "Vessels", role: "Maritime Command Platform", desc: "Turn fleet visibility, voyage performance, and operational exceptions into command.", status: "Live", href: "/vessels/" },
            { name: "Carlota Jo", role: "Premium Service Brand", desc: "Discreet operational and residence support for high-touch environments.", status: "Pilot Ready", href: "/carlota-jo/" },
          ].map((platform, i) => (
            <m.a
              key={platform.name}
              href={platform.href}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="group block rounded-2xl border border-szl-border bg-white p-6 hover:border-szl-border-hover hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-[var(--font-display)] text-base font-bold text-szl-text">{platform.name}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-szl-border bg-szl-bg-secondary text-szl-text-muted">{platform.status}</span>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-szl-text-muted mb-2">{platform.role}</p>
              <p className="text-xs text-szl-text-secondary leading-relaxed">{platform.desc}</p>
            </m.a>
          ))}
        </div>
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
                <p className="text-sm text-szl-text-secondary leading-relaxed mb-5">{p.tagline}</p>
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

function HowItWorksSection() {
  return (
    <section className="py-20 lg:py-28 bg-szl-bg-secondary border-t border-szl-border">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="How the Ecosystem Works"
          title="The hierarchy is intentional."
          subtitle="SZL Holdings is the parent entity. Alloy is the intelligence and orchestration engine shared across every platform. Lyte, Vessels, and Carlota Jo are purpose-built command surfaces, each solving a specific domain problem — all running on the same operating fabric."
        />

        <div className="mt-12 space-y-3">
          {[
            { level: "Parent", name: "SZL Holdings", desc: "The holding company. Sets operating standards, allocates capital, and governs the ecosystem." },
            { level: "Engine", name: "Alloy", desc: "Core systems and orchestration layer. Powers signal ingestion, workflow orchestration, and action routing across all platforms." },
            { level: "Platform", name: "Lyte", desc: "Business observability. Surfaces risk, latency, ownership gaps, and workflow friction — before they hit execution." },
            { level: "Platform", name: "Vessels", desc: "Maritime command. Turns fleet visibility, voyage performance, and operational exceptions into decisive action." },
            { level: "Service Brand", name: "Carlota Jo", desc: "Premium service brand. Discreet, high-trust operational and residence support for demanding environments." },
          ].map((item, i) => (
            <m.div
              key={item.name}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="flex items-start gap-6 rounded-2xl border border-szl-border bg-white p-5"
            >
              <div className="w-24 shrink-0 pt-0.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-szl-text-muted">{item.level}</span>
              </div>
              <div>
                <h3 className="font-[var(--font-display)] text-sm font-bold text-szl-text mb-1">{item.name}</h3>
                <p className="text-xs text-szl-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PoweredByAlloySection() {
  return (
    <section className="py-20 lg:py-28 bg-szl-primary border-t border-szl-primary">
      <div className="max-w-6xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Powered by Alloy</p>
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
            View Architecture <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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
            <p className="text-xs font-bold uppercase tracking-widest text-szl-text-muted mb-4">Built by an Operator</p>
            <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-szl-text leading-tight mb-5">
              Stephen Lutar.<br />
              <span className="text-szl-accent">Builder. Operator. Systems thinker.</span>
            </h2>
            <p className="text-szl-text-secondary text-base leading-relaxed mb-4">
              Stephen founded SZL Holdings with a specific conviction: the most defensible positions in enterprise software are won by understanding the operational reality of an industry deeply enough to build the systems it actually needs.
            </p>
            <p className="text-szl-text-secondary text-base leading-relaxed mb-8">
              Every platform in the ecosystem was designed around operational problems he has personally encountered — not market research, not feature requests. The result is software that solves real problems at the command level.
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
          title="Real outcomes from a real ecosystem."
          subtitle="Not projections. Not hypotheticals. Operational results from platforms in active deployment."
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

function ProblemTilesSection() {
  return (
    <section className="py-20 lg:py-28 bg-white border-t border-szl-border">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="What the System Solves"
          title="Built for operational problems that don't fit in a single dashboard."
          align="center"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-12">
          {PROBLEM_TILES.map((tile, i) => (
            <m.div
              key={tile}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="rounded-xl border border-szl-border bg-szl-bg-secondary p-5"
            >
              <div className="w-4 h-4 rounded-full border-2 border-szl-accent mb-3" />
              <p className="text-sm font-medium text-szl-text leading-snug">{tile}</p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactPathsSection() {
  return (
    <section className="py-20 lg:py-28 bg-szl-primary border-t border-szl-primary">
      <div className="max-w-6xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Start the Right Conversation</p>
          <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-white mb-4">
            Four ways in.
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
