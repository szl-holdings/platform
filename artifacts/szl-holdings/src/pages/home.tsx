import { useEffect, useRef, useState } from "react";
import { m, useInView } from "framer-motion";
import { ChevronRight, ArrowRight, Activity, TrendingUp, Shield, Zap } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SectionHeader } from "@/components/SectionHeader";
import { CommandBackground } from "@/components/CommandBackground";
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
    accentRgb: "6, 182, 212",
    tier: 1,
    metric: "< 4 min",
    metricLabel: "Signal detection",
  },
  {
    id: "vessels",
    name: "Vessels",
    category: "Maritime Command",
    status: "Live",
    tagline: "Turn fleet visibility, voyage performance, and operational exceptions into command.",
    audience: "Fleet operators, maritime managers, and principals requiring real-time vessel intelligence.",
    href: "/vessels/",
    accent: "#3b82f6",
    accentRgb: "59, 130, 246",
    tier: 1,
    metric: "34 days",
    metricLabel: "Pre-designation lead time",
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
    accentRgb: "217, 119, 6",
    tier: 2,
    metric: "100%",
    metricLabel: "Pilot client retention",
  },
];

const ALLOY_CAPABILITIES = [
  { num: "01", name: "Signal Ingestion", desc: "Cross-platform data acquisition from operational, financial, and environmental sources." },
  { num: "02", name: "Workflow Orchestration", desc: "Multi-step process sequencing with conditional logic and human approval gates." },
  { num: "03", name: "Action Routing", desc: "Intelligent distribution of tasks and alerts to the right person at the right time." },
  { num: "04", name: "Output Generation", desc: "Structured reports, narratives, and decision briefs produced without manual effort." },
  { num: "05", name: "Human Approval", desc: "Built-in governance checkpoints that keep humans in the loop on high-stakes decisions." },
];

const PROOF_METRICS = [
  { value: "$340K", label: "Revenue recovered / quarter", sublabel: "Lyte · Approval latency detection", icon: TrendingUp, accent: "var(--color-szl-lyte)" },
  { value: "34 days", label: "Dark vessel pre-detection", sublabel: "Vessels · Before formal designation", icon: Shield, accent: "var(--color-szl-vessels)" },
  { value: "3.4×", label: "Decision velocity", sublabel: "Alloy · Workflow orchestration", icon: Zap, accent: "var(--color-szl-alloy)" },
  { value: "40%", label: "Lower infrastructure overhead", sublabel: "Ecosystem · Shared architecture", icon: Activity, accent: "var(--color-szl-accent)" },
];

const PROOF_CARDS = [
  {
    tag: "Observability",
    accentColor: "var(--color-szl-lyte)",
    accentRgb: "6, 182, 212",
    title: "Approval latency detected in 4 minutes",
    body: "Lyte surfaced a critical approval queue stall 8 days before the weekly review would have caught it. Revenue leakage recovered: $340K/quarter.",
  },
  {
    tag: "Maritime",
    accentColor: "var(--color-szl-vessels)",
    accentRgb: "59, 130, 246",
    title: "34-day dark vessel pre-detection lead",
    body: "Vessels flagged dark vessel activity 34 days before formal sanctions designation — a capability unavailable in traditional maritime data.",
  },
  {
    tag: "Operations",
    accentColor: "var(--color-szl-carlota)",
    accentRgb: "217, 119, 6",
    title: "Zero coordination gaps across 90-day relocation",
    body: "Carlota Jo coordinated 14 vendors, 6 household staff, and cross-border logistics. The principal described the transition as invisible.",
  },
  {
    tag: "Ecosystem",
    accentColor: "var(--color-szl-accent)",
    accentRgb: "201, 169, 110",
    title: "40% lower infrastructure overhead",
    body: "Multiple platforms under one holding structure produces shared cloud spend, unified security overhead, and engineering leverage no standalone company can match.",
  },
];

const CONTACT_PATHS = [
  { audience: "Investors / Partners", headline: "Capital, co-development, and strategic alignment opportunities", cta: "Start a Conversation", href: "/contact?type=partner" },
  { audience: "Clients", headline: "Demo a platform or request a pilot deployment", cta: "Request a Demo", href: "/contact?type=client" },
  { audience: "Recruiters", headline: "Executive search, advisory, and strategic operator roles", cta: "Connect with Stephen", href: "/contact?type=recruiter" },
  { audience: "Strategic", headline: "Carlota Jo — discreet, high-trust operational support", cta: "Start a Conversation", href: "/contact?type=client" },
];

function CountUpNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const duration = 1200;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
      else setDisplay(value);
    };
    requestAnimationFrame(tick);
  }, [inView, value]);

  return <span ref={ref}>{display}{suffix}</span>;
}

export default function HomePage() {
  useEffect(() => {
    document.title = "SZL Holdings — Premium Command Systems";
    const cleanup = initScrollDepthTracking("home");
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-szl-bg)" }}>
      <SiteNav />
      <main>
        <HeroSection />
        <LiveMetricsStrip />
        <FeaturedPlatformsSection />
        <EcosystemLogicSection />
        <AlloyBackboneSection />
        <ProofMetricsSection />
        <ProofSection />
        <FounderSection />
        <ContactByAudienceSection />
      </main>
      <SiteFooter />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <CommandBackground accentColor="201, 169, 110" intensity="medium" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <span
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-sm text-xs font-medium tracking-wide"
            style={{
              background: "hsla(38, 55%, 60%, 0.08)",
              border: "1px solid hsla(38, 55%, 60%, 0.20)",
              color: "var(--color-szl-accent)",
              fontFamily: "var(--font-mono)",
            }}
          >
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-50" />
              <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-500" />
            </span>
            SZL-HOLDINGS · ALLOY · LYTE · VESSELS · CARLOTA-JO
          </span>
        </m.div>

        <m.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.6rem, 6vw, 5rem)",
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
            marginBottom: "1.5rem",
            color: "var(--color-szl-text)",
          }}
        >
          Building premium command systems<br />
          <span style={{ color: "var(--color-szl-accent)" }}>across observability,</span>
          <br />operations, and specialized platforms.
        </m.h1>

        <m.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          style={{ color: "var(--color-szl-text-secondary)", fontSize: "1.0625rem", maxWidth: "36rem", margin: "0 auto 0.75rem", lineHeight: 1.7 }}
        >
          One parent company. One intelligence backbone. Purpose-built platforms across
          business observability, maritime command, real estate operations, and high-trust services —
          all powered by Alloy.
        </m.p>

        <m.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          style={{ color: "var(--color-szl-text-muted)", fontSize: "0.8125rem", marginBottom: "2.5rem", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}
        >
          ONE ECOSYSTEM · ONE OPERATING PHILOSOPHY · ONE STANDARD OF EXECUTION
        </m.p>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="flex flex-col items-center gap-3 mb-10"
        >
          <Link
            href="/portfolio"
            onClick={() => analytics.heroCTAClick("Explore the Ecosystem")}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-sm text-sm font-semibold transition-all duration-200"
            style={{
              background: "var(--color-szl-accent)",
              color: "hsl(214, 16%, 4%)",
              fontFamily: "var(--font-display)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--color-szl-accent-light)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px hsla(38, 55%, 60%, 0.30)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--color-szl-accent)";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            Explore the Ecosystem
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/founder"
            onClick={() => analytics.heroCTAClick("Meet the Founder")}
            className="inline-flex items-center gap-1.5 text-xs transition-colors duration-200"
            style={{
              color: "var(--color-szl-text-muted)",
              fontFamily: "var(--font-display)",
              textDecoration: "none",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-muted)";
            }}
          >
            Meet the Founder
            <ArrowRight size={12} strokeWidth={2} />
          </Link>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-20"
        >
          {[
            { label: "Lyte", href: "/lyte-command-center/" },
            { label: "Vessels", href: "/vessels/" },
            { label: "Carlota Jo", href: "/carlota-jo/" },
            { label: "Alloy", href: "/alloy/" },
          ].map((link, i) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => analytics.heroCTAClick(`Explore ${link.label}`)}
              className="flex items-center gap-1 transition-colors duration-200"
              style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-szl-text-muted)", fontFamily: "var(--font-mono)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-accent)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-muted)"; }}
            >
              {link.label} <ArrowRight className="w-3 h-3" />
            </a>
          ))}
        </m.div>
      </div>
    </section>
  );
}

function LiveMetricsStrip() {
  const STRIP_METRICS = [
    { label: "PLATFORMS LIVE", value: "4", mono: true },
    { label: "SIGNAL DETECTION", value: "< 4 MIN", mono: true },
    { label: "VESSELS TRACKED", value: "10+", mono: true },
    { label: "DARK VESSEL LEAD", value: "34 DAYS", mono: true },
    { label: "RECOVERY / QTR", value: "$340K", mono: true },
    { label: "CLIENT RETENTION", value: "100%", mono: true },
  ];

  return (
    <section
      style={{
        borderTop: "1px solid var(--color-szl-border)",
        borderBottom: "1px solid var(--color-szl-border)",
        background: "var(--color-szl-bg-secondary)",
        padding: "0.875rem 0",
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-0 divide-x" style={{ borderColor: "var(--color-szl-border)" }}>
          {STRIP_METRICS.map((m, i) => (
            <div key={m.label} className="px-4 py-2 text-center first:pl-0 last:pr-0">
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "1.0625rem",
                  fontWeight: 500,
                  color: "var(--color-szl-text)",
                  letterSpacing: "-0.01em",
                  lineHeight: 1,
                  marginBottom: "0.25rem",
                }}
              >
                {m.value}
              </p>
              <p style={{ fontSize: "0.625rem", fontWeight: 500, letterSpacing: "0.1em", color: "var(--color-szl-text-faint)", textTransform: "uppercase" }}>
                {m.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedPlatformsSection() {
  return (
    <section
      style={{
        padding: "5rem 0 5.5rem",
        borderBottom: "1px solid var(--color-szl-border)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="Featured Platforms"
          title="Command-grade products."
          subtitle="Built for the real work. Each platform solves a specific domain problem — all running on the same intelligence backbone."
        />

        <div className="grid lg:grid-cols-3 gap-5 mt-12">
          {FEATURED_PLATFORMS.map((p, i) => (
            <m.a
              key={p.id}
              href={p.href}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group block rounded-sm overflow-hidden relative cursor-pointer"
              style={{
                background: "var(--color-szl-surface)",
                border: "1px solid var(--color-szl-border)",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = `rgba(${p.accentRgb}, 0.28)`;
                el.style.background = "var(--color-szl-elevated)";
                el.style.boxShadow = `0 0 20px rgba(${p.accentRgb}, 0.10), 0 4px 32px rgba(0,0,0,0.40)`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--color-szl-border)";
                el.style.background = "var(--color-szl-surface)";
                el.style.boxShadow = "none";
              }}
            >
              <div className="h-0.5 w-full" style={{ background: p.accent }} />
              <div className="p-7">
                <div className="flex items-center justify-between mb-5">
                  <span style={{ fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", fontFamily: "var(--font-mono)" }}>
                    {p.category}
                  </span>
                  <span
                    style={{
                      fontSize: "0.625rem", fontWeight: 500, padding: "2px 8px", borderRadius: "2px",
                      background: "hsla(142, 64%, 42%, 0.10)", border: "1px solid hsla(142, 64%, 42%, 0.20)", color: "hsl(142, 64%, 52%)",
                      fontFamily: "var(--font-mono)", letterSpacing: "0.06em",
                    }}
                  >
                    {p.status}
                  </span>
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-szl-text)", marginBottom: "0.75rem", letterSpacing: "-0.02em" }}>
                  {p.name}
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-szl-text-secondary)", lineHeight: 1.65, marginBottom: "0.75rem" }}>
                  {p.tagline}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-szl-text-muted)", lineHeight: 1.55, marginBottom: "1.5rem", fontStyle: "italic" }}>
                  {p.audience}
                </p>

                <div
                  className="rounded-sm p-3 mb-5"
                  style={{ background: `rgba(${p.accentRgb}, 0.06)`, border: `1px solid rgba(${p.accentRgb}, 0.12)` }}
                >
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem", fontWeight: 500, color: p.accent, letterSpacing: "-0.01em", lineHeight: 1 }}>
                    {p.metric}
                  </p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--color-szl-text-muted)", marginTop: "0.25rem", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                    {p.metricLabel}
                  </p>
                </div>

                <div
                  className="group-hover:translate-x-0.5 transition-transform flex items-center gap-1.5"
                  style={{ fontSize: "0.75rem", fontWeight: 600, color: p.accent, fontFamily: "var(--font-mono)" }}
                >
                  Explore {p.name} <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </m.a>
          ))}
        </div>
      </div>
    </section>
  );
}

function EcosystemLogicSection() {
  const HIERARCHY = [
    { level: "Parent Company", name: "SZL Holdings", desc: "The holding company. Sets operating standards, allocates capital, and governs the ecosystem.", accent: "#c9a96e", accentRgb: "201, 169, 110", tier: 0 },
    { level: "Intelligence Backbone", name: "Alloy", desc: "Core systems and orchestration engine. Powers signal ingestion, workflow orchestration, action routing, output generation, and human approval gates across all platforms.", accent: "#6e9ef5", accentRgb: "110, 158, 245", tier: 1, href: "/alloy/" },
    { level: "Platform — Observability", name: "Lyte", desc: "Business observability. Surfaces risk, latency, ownership gaps, and workflow friction — before they hit execution.", accent: "#06b6d4", accentRgb: "6, 182, 212", tier: 2, href: "/lyte-command-center/", status: "Live" },
    { level: "Platform — Maritime", name: "Vessels", desc: "Maritime command. Turns fleet visibility, voyage performance, and operational exceptions into decisive action.", accent: "#3b82f6", accentRgb: "59, 130, 246", tier: 2, href: "/vessels/", status: "Live" },
    { level: "Service Brand", name: "Carlota Jo", desc: "Premium service brand. Discreet, high-trust operational and residence support for demanding environments.", accent: "#d97706", accentRgb: "217, 119, 6", tier: 2, href: "/carlota-jo/", status: "Pilot Ready" },
  ];

  return (
    <section style={{ padding: "5rem 0 5.5rem", borderBottom: "1px solid var(--color-szl-border)", background: "var(--color-szl-bg-secondary)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="Ecosystem Logic"
          title="The hierarchy is intentional."
          subtitle="SZL Holdings is the parent entity. Alloy is the intelligence backbone shared across every platform. Lyte, Vessels, and Carlota Jo are purpose-built command surfaces — each solving a specific domain problem, all running on the same operating fabric."
        />

        <div className="mt-12 space-y-2.5">
          {HIERARCHY.map((item, i) => (
            <m.div
              key={item.name}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              style={{ marginLeft: item.tier === 2 ? "1.5rem" : item.tier === 1 ? "0.5rem" : "0" }}
            >
              {item.href ? (
                <a
                  href={item.href}
                  className="group flex items-start gap-5 rounded-sm p-4 transition-all duration-220"
                  style={{ background: "var(--color-szl-surface)", border: "1px solid var(--color-szl-border)" }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = `rgba(${item.accentRgb}, 0.24)`;
                    el.style.background = "var(--color-szl-elevated)";
                    el.style.boxShadow = `0 0 14px rgba(${item.accentRgb}, 0.08)`;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "var(--color-szl-border)";
                    el.style.background = "var(--color-szl-surface)";
                    el.style.boxShadow = "none";
                  }}
                >
                  <div className="w-2 h-2 rounded-full shrink-0 mt-2.5" style={{ backgroundColor: item.accent }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", fontFamily: "var(--font-mono)" }}>
                        {item.level}
                      </p>
                      {item.status && (
                        <span style={{ fontSize: "0.5625rem", fontWeight: 600, padding: "1px 6px", borderRadius: "2px", background: "hsla(142,64%,42%,0.08)", border: "1px solid hsla(142,64%,42%,0.18)", color: "hsl(142,64%,52%)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
                          {item.status}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-szl-text)", marginBottom: "0.25rem", letterSpacing: "-0.015em" }}>
                      {item.name}
                    </h3>
                    <p style={{ fontSize: "0.8125rem", color: "var(--color-szl-text-secondary)", lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-start gap-5 rounded-sm p-4" style={{ background: "var(--color-szl-overlay)", border: `1px solid rgba(${item.accentRgb}, 0.16)` }}>
                  <div className="w-2 h-2 rounded-full shrink-0 mt-2.5" style={{ backgroundColor: item.accent }} />
                  <div className="flex-1">
                    <p style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "0.25rem", fontFamily: "var(--font-mono)" }}>
                      {item.level}
                    </p>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-szl-text)", marginBottom: "0.25rem" }}>
                      {item.name}
                    </h3>
                    <p style={{ fontSize: "0.8125rem", color: "var(--color-szl-text-secondary)", lineHeight: 1.6 }}>{item.desc}</p>
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
          style={{ fontSize: "0.75rem", color: "var(--color-szl-text-faint)", textAlign: "center", marginTop: "2rem", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}
        >
          STEPHEN LUTAR — FOUNDER & OPERATOR
        </m.p>
      </div>
    </section>
  );
}

function AlloyBackboneSection() {
  return (
    <section className="relative overflow-hidden" style={{ padding: "5rem 0 5.5rem", borderBottom: "1px solid var(--color-szl-border)" }}>
      <div className="absolute inset-0 szl-depth-glow-blue pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-alloy)", marginBottom: "0.75rem", fontFamily: "var(--font-mono)" }}>
            Alloy Backbone
          </p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 700, color: "var(--color-szl-text)", marginBottom: "1rem", letterSpacing: "-0.025em" }}>
            The intelligence layer behind every platform.
          </h2>
          <p style={{ color: "var(--color-szl-text-secondary)", fontSize: "1rem", maxWidth: "38rem", margin: "0 auto", lineHeight: 1.7 }}>
            Alloy is not a product you buy. It is the operating infrastructure that makes every SZL platform credible — shared signal ingestion, workflow orchestration, action routing, output generation, and human approval gates.
          </p>
        </m.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {ALLOY_CAPABILITIES.map((cap, i) => (
            <m.div
              key={cap.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-sm p-5"
              style={{ background: "var(--color-szl-surface)", border: "1px solid var(--color-szl-border)" }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "hsla(222, 68%, 58%, 0.24)";
                el.style.boxShadow = "0 0 14px hsla(222, 68%, 58%, 0.08)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--color-szl-border)";
                el.style.boxShadow = "none";
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, color: "var(--color-szl-alloy)", letterSpacing: "0.05em" }}>
                  {cap.num}
                </span>
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700, color: "var(--color-szl-text)", marginBottom: "0.5rem" }}>
                {cap.name}
              </h3>
              <p style={{ fontSize: "0.75rem", color: "var(--color-szl-text-muted)", lineHeight: 1.65 }}>{cap.desc}</p>
            </m.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a
            href="/alloy/"
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-sm text-sm font-semibold transition-all duration-200"
            style={{ border: "1px solid hsla(222, 68%, 58%, 0.24)", color: "var(--color-szl-alloy)", fontFamily: "var(--font-display)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsla(222, 68%, 58%, 0.08)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            Explore Alloy <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
}

function ProofMetricsSection() {
  return (
    <section style={{ padding: "5rem 0 5.5rem", borderBottom: "1px solid var(--color-szl-border)", background: "var(--color-szl-bg-tertiary)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "0.75rem" }}>
            Operational Proof
          </p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 700, color: "var(--color-szl-text)", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            Real outcomes. Active deployment.
          </h2>
        </m.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROOF_METRICS.map((metric, i) => (
            <m.div
              key={metric.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              className="rounded-sm p-5 relative overflow-hidden"
              style={{ background: "var(--color-szl-surface)", border: "1px solid var(--color-szl-border)" }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--color-szl-border-hover)";
                el.style.background = "var(--color-szl-elevated)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--color-szl-border)";
                el.style.background = "var(--color-szl-surface)";
              }}
            >
              <metric.icon size={16} style={{ color: metric.accent, marginBottom: "0.75rem", opacity: 0.8 }} />
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "1.625rem", fontWeight: 500, color: "var(--color-szl-text)", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: "0.375rem" }}>
                {metric.value}
              </p>
              <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-szl-text-secondary)", marginBottom: "0.25rem" }}>
                {metric.label}
              </p>
              <p style={{ fontSize: "0.6875rem", color: "var(--color-szl-text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                {metric.sublabel}
              </p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProofSection() {
  return (
    <section style={{ padding: "5rem 0 5.5rem", borderBottom: "1px solid var(--color-szl-border)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="Case Studies"
          title="Documented results from production."
          subtitle="Not projections. Not hypotheticals. Specific operational outcomes from platforms operating in the field."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          {PROOF_CARDS.map((item, i) => (
            <m.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="rounded-sm p-5 transition-all duration-220"
              style={{ background: "var(--color-szl-surface)", border: "1px solid var(--color-szl-border)" }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = `rgba(${item.accentRgb}, 0.24)`;
                el.style.background = "var(--color-szl-elevated)";
                el.style.boxShadow = `0 0 14px rgba(${item.accentRgb}, 0.08)`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--color-szl-border)";
                el.style.background = "var(--color-szl-surface)";
                el.style.boxShadow = "none";
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: item.accentColor }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: item.accentColor }}>
                  {item.tag}
                </span>
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700, color: "var(--color-szl-text)", marginBottom: "0.5rem", letterSpacing: "-0.01em" }}>
                {item.title}
              </h3>
              <p style={{ fontSize: "0.75rem", color: "var(--color-szl-text-secondary)", lineHeight: 1.65 }}>{item.body}</p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FounderSection() {
  return (
    <section style={{ padding: "5rem 0 5.5rem", borderBottom: "1px solid var(--color-szl-border)", background: "var(--color-szl-bg-secondary)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <m.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
              Founder & Operator
            </p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 700, color: "var(--color-szl-text)", lineHeight: 1.08, marginBottom: "1.25rem", letterSpacing: "-0.025em" }}>
              Stephen Lutar.<br />
              <span style={{ color: "var(--color-szl-accent)" }}>Builder. Operator. Systems thinker.</span>
            </h2>
            <p style={{ color: "var(--color-szl-text-secondary)", fontSize: "1rem", lineHeight: 1.7, marginBottom: "2rem" }}>
              Stephen Lutar builds systems that connect visibility, execution, and operating discipline. Every platform in the ecosystem was designed around operational problems he has personally encountered — not market research, not feature requests. The result is command-grade software built by an operator, for operators.
            </p>
            <div className="flex flex-wrap gap-2.5 mb-8">
              {["Systems over tools", "Proprietary data before features", "Operators not consultants", "Ship to learn"].map((p) => (
                <span
                  key={p}
                  style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: "2px",
                    background: "var(--color-szl-surface)",
                    border: "1px solid var(--color-szl-border)",
                    fontSize: "0.75rem",
                    color: "var(--color-szl-text-secondary)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.03em",
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
            <Link
              href="/founder"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-sm text-sm font-semibold transition-all duration-200"
              style={{ background: "var(--color-szl-accent)", color: "hsl(214, 16%, 4%)", fontFamily: "var(--font-display)" }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "var(--color-szl-accent-light)";
                el.style.boxShadow = "0 0 20px hsla(38, 55%, 60%, 0.24)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "var(--color-szl-accent)";
                el.style.boxShadow = "none";
              }}
            >
              Meet the Founder <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </m.div>

          <m.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 gap-3.5"
          >
            {[
              { value: "5+", label: "Years Operating", note: "Across enterprise verticals" },
              { value: "4", label: "Platforms Live", note: "Alloy, Lyte, Vessels, Carlota Jo" },
              { value: "34 days", label: "Dark Vessel Lead", note: "Before formal designation" },
              { value: "100%", label: "Client Retention", note: "Carlota Jo pilot cohort" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-sm p-5 text-center transition-all duration-200"
                style={{ background: "var(--color-szl-surface)", border: "1px solid var(--color-szl-border)" }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "hsla(38, 55%, 60%, 0.22)";
                  el.style.background = "var(--color-szl-elevated)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "var(--color-szl-border)";
                  el.style.background = "var(--color-szl-surface)";
                }}
              >
                <p style={{ fontFamily: "var(--font-mono)", fontWeight: 500, fontSize: "1.5rem", color: "var(--color-szl-text)", marginBottom: "0.25rem", letterSpacing: "-0.02em" }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-szl-text-secondary)" }}>{stat.label}</p>
                <p style={{ fontSize: "0.625rem", color: "var(--color-szl-text-faint)", marginTop: "0.25rem", fontFamily: "var(--font-mono)" }}>{stat.note}</p>
              </div>
            ))}
          </m.div>
        </div>
      </div>
    </section>
  );
}

function ContactByAudienceSection() {
  return (
    <section className="relative overflow-hidden" style={{ padding: "5rem 0 5.5rem" }}>
      <div className="absolute inset-0 szl-depth-glow-gold pointer-events-none" />
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "0.75rem" }}>
            Contact by Audience
          </p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 700, color: "var(--color-szl-text)", marginBottom: "1rem", letterSpacing: "-0.025em" }}>
            Start the right conversation.
          </h2>
          <p style={{ color: "var(--color-szl-text-secondary)", fontSize: "1rem", maxWidth: "32rem", margin: "0 auto", lineHeight: 1.6 }}>
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
                className="group block rounded-sm p-6 h-full transition-all duration-220"
                style={{ background: "var(--color-szl-surface)", border: "1px solid var(--color-szl-border)" }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "hsla(38, 55%, 60%, 0.24)";
                  el.style.background = "var(--color-szl-elevated)";
                  el.style.boxShadow = "0 0 16px hsla(38, 55%, 60%, 0.08)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "var(--color-szl-border)";
                  el.style.background = "var(--color-szl-surface)";
                  el.style.boxShadow = "none";
                }}
              >
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "0.5rem" }}>
                  {item.audience}
                </p>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", fontWeight: 700, color: "var(--color-szl-text)", marginBottom: "1.25rem", lineHeight: 1.45, letterSpacing: "-0.01em" }}>
                  {item.headline}
                </h3>
                <div
                  className="flex items-center gap-1.5 group-hover:translate-x-0.5 transition-transform"
                  style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-szl-accent)", fontFamily: "var(--font-mono)" }}
                >
                  {item.cta} <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
