import { useState, useEffect } from "react";
import { m } from "framer-motion";
import {
  ArrowRight, CheckCircle, Building2, Users, Zap, BarChart3, GitBranch,
  Shield, Scale, Eye, Layers, Star, Check, X as XIcon, MessageSquare,
} from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { analytics, initScrollDepthTracking, initTimeOnPageTracking } from "@/lib/analytics";

const TIERS = [
  {
    id: "observer",
    name: "Observer",
    tagline: "Visibility without obligation.",
    description: "Read-only signal monitoring. See what's happening across your operations before committing to full instrumentation.",
    price: "Contact sales",
    priceSub: "Engagement-based",
    highlight: false,
    color: "hsl(214,7%,55%)",
    accentColor: "hsla(0,0%,100%,0.08)",
    borderColor: "hsla(0,0%,100%,0.1)",
    icon: Eye,
    cta: "Start a conversation",
    ctaHref: "/contact",
    features: [
      { label: "Signal detection (read-only)", included: true },
      { label: "Up to 3 signal categories", included: true },
      { label: "Weekly digest reports", included: true },
      { label: "Basic approval queue visibility", included: true },
      { label: "Single data source connector", included: true },
      { label: "Alloy action routing", included: false },
      { label: "Audit trail & proof chain", included: false },
      { label: "Multi-source data mesh", included: false },
      { label: "Domain packs (PRISM, Vessels, etc.)", included: false },
      { label: "Dedicated success engineer", included: false },
    ],
  },
  {
    id: "operator",
    name: "Operator",
    tagline: "Full-stack observability and execution.",
    description: "Complete signal-to-action loop. Lyte detects. Alloy routes. Every action is audited, attributed, and defensible.",
    price: "Contact sales",
    priceSub: "Design-partner pricing",
    highlight: true,
    color: "hsl(192,72%,48%)",
    accentColor: "hsla(192,72%,48%,0.08)",
    borderColor: "hsla(192,72%,48%,0.3)",
    icon: Zap,
    badge: "Most popular",
    cta: "Apply for pilot",
    ctaHref: "/contact",
    features: [
      { label: "Signal detection (full coverage)", included: true },
      { label: "Unlimited signal categories", included: true },
      { label: "Real-time operational dashboard", included: true },
      { label: "Multi-source approval queue", included: true },
      { label: "Multi-source data mesh", included: true },
      { label: "Alloy action routing (full)", included: true },
      { label: "Immutable audit trail & proof chain", included: true },
      { label: "Human-in-the-loop governance", included: true },
      { label: "Domain packs (choose one)", included: true },
      { label: "Dedicated success engineer", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "White-glove. Custom. Compliant.",
    description: "Dedicated instance, custom SLAs, premium support, full domain pack access, and deep Microsoft ecosystem integration.",
    price: "Custom",
    priceSub: "Bespoke engagement",
    highlight: false,
    color: "hsl(38,72%,58%)",
    accentColor: "hsla(38,72%,58%,0.06)",
    borderColor: "hsla(38,72%,58%,0.25)",
    icon: Building2,
    cta: "Talk to enterprise sales",
    ctaHref: "/contact",
    features: [
      { label: "Everything in Operator", included: true },
      { label: "Dedicated cloud instance", included: true },
      { label: "Custom SLA & uptime guarantee", included: true },
      { label: "All domain packs included", included: true },
      { label: "Custom connector development", included: true },
      { label: "Dedicated success engineer", included: true },
      { label: "Executive readout cadence", included: true },
      { label: "Priority model inference (Model Mesh)", included: true },
      { label: "Azure AD / SCIM provisioning", included: true },
      { label: "Compliance package (SOC 2, GDPR, HIPAA)", included: true },
    ],
  },
];

const PILOT_DELIVERABLES = [
  { icon: BarChart3, label: "Lyte instrumented against your data", desc: "PRISM signal detection running on your actual operational surface — approval queues, workflow health, risk signals — within the first two weeks." },
  { icon: GitBranch, label: "Alloy routing live", desc: "Action routing and audit trail configured for your org structure. Every signal gets an owner. Every action gets a record." },
  { icon: Shield, label: "Playbook for your three highest-risk signal categories", desc: "Custom detection logic, routing rules, and escalation paths for the operational risks that matter most in your environment." },
  { icon: Zap, label: "Executive readout at week 12", desc: "Full operational summary: signals detected, actions routed, outcomes verified, and a roadmap for expansion." },
];

const DOMAIN_PACKS = [
  { name: "PRISM Counsel", desc: "Legal matter signals, deadline compliance, demand packet generation", color: "hsl(38,72%,58%)", icon: Scale },
  { name: "Aegis", desc: "SOC operations, threat intelligence, incident response", color: "hsl(222,60%,62%)", icon: Shield },
  { name: "Vessels", desc: "Fleet tracking, route risk, sanctions compliance", color: "hsl(206,72%,52%)", icon: Building2 },
  { name: "Terra", desc: "Property intelligence, distress detection, deal pipeline", color: "hsl(140,50%,48%)", icon: Building2 },
];

const COMPARISON_ROWS = [
  { category: "Signal Detection", features: [
    { label: "Signal categories", observer: "Up to 3", operator: "Unlimited", enterprise: "Unlimited" },
    { label: "Real-time monitoring", observer: false, operator: true, enterprise: true },
    { label: "Custom detection logic", observer: false, operator: true, enterprise: true },
    { label: "Multi-source data mesh", observer: false, operator: true, enterprise: true },
  ]},
  { category: "Execution & Action", features: [
    { label: "Alloy action routing", observer: false, operator: true, enterprise: true },
    { label: "Approval chains & governance", observer: false, operator: true, enterprise: true },
    { label: "Immutable audit trail", observer: false, operator: true, enterprise: true },
    { label: "Human-in-the-loop controls", observer: false, operator: true, enterprise: true },
  ]},
  { category: "Domain Packs", features: [
    { label: "PRISM Counsel", observer: false, operator: "Add-on", enterprise: true },
    { label: "Aegis / Vessels / Terra", observer: false, operator: "Add-on", enterprise: true },
    { label: "Custom domain development", observer: false, operator: false, enterprise: true },
  ]},
  { category: "Support & Success", features: [
    { label: "Onboarding support", observer: "Self-serve", operator: "Guided", enterprise: "White-glove" },
    { label: "Dedicated success engineer", observer: false, operator: false, enterprise: true },
    { label: "Executive readouts", observer: false, operator: "Quarterly", enterprise: "Monthly" },
    { label: "Custom SLA", observer: false, operator: false, enterprise: true },
  ]},
  { category: "Infrastructure", features: [
    { label: "Deployment", observer: "Shared", operator: "Shared", enterprise: "Dedicated" },
    { label: "Azure AD / SCIM", observer: false, operator: "Basic", enterprise: true },
    { label: "Compliance package", observer: false, operator: false, enterprise: true },
    { label: "Custom connector dev", observer: false, operator: false, enterprise: true },
  ]},
];

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value
      ? <Check size={15} color="hsl(145,60%,46%)" />
      : <XIcon size={13} color="hsl(214,7%,30%)" />;
  }
  return <span style={{ fontSize: "0.75rem", color: "hsl(214,7%,60%)" }}>{value}</span>;
}

export default function PricingPage() {
  const [showComparison, setShowComparison] = useState(false);

  usePageMeta({
    title: "Plans & Pricing — SZL Holdings",
    description: "Observer, Operator, and Enterprise plans. Lyte + Alloy instrumented against your operational data. Business observability and execution accountability, live in your environment.",
    canonical: "https://szlholdings.com/pricing",
  });

  useEffect(() => {
    analytics.pageView("/pricing");
    analytics.funnelStage("pricing-page", "/pricing");
    TIERS.forEach(t => analytics.pricingTierView(t.id));
    const cleanupScroll = initScrollDepthTracking("/pricing");
    const cleanupTime = initTimeOnPageTracking("/pricing");
    return () => { cleanupScroll(); cleanupTime(); };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        {/* ── Hero ── */}
        <section
          className="szl-grid-texture"
          style={{
            paddingTop: "var(--space-hero-pt)",
            paddingBottom: "clamp(4rem,8vw,6rem)",
            borderBottom: "1px solid var(--color-szl-border)",
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.875rem", borderRadius: "99px", border: "1px solid hsla(192,72%,48%,0.22)", background: "hsla(192,72%,48%,0.08)", marginBottom: "1.75rem" }}>
                <Layers size={13} color="hsl(192,72%,48%)" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "hsl(192,72%,48%)" }}>Plans & Pricing</span>
              </div>
            </m.div>
            <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }}>
              <h1 style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.06, maxWidth: "22ch", marginBottom: "1.25rem" }}>
                Built for operators. Priced for outcomes.
              </h1>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "55ch", marginBottom: "2rem" }}>
                Start with visibility. Add execution. Scale across domains. Every tier gives you the foundation for operational accountability — the depth depends on where you are.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Link
                  href="/contact"
                  className="szl-btn-primary"
                  onClick={() => analytics.ctaClick("Start a conversation", "/pricing", "hero")}
                >
                  Start a Conversation <ArrowRight size={14} />
                </Link>
                <Link href="/demo" className="szl-btn-secondary">
                  See the Demo First
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        {/* ── Tier Cards ── */}
        <section style={{ padding: "clamp(4rem,8vw,6rem) 0", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", alignItems: "stretch" }}>
              {TIERS.map((tier, i) => {
                const Icon = tier.icon;
                return (
                  <m.div
                    key={tier.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: i * 0.08 }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: "1rem",
                      border: `1px solid ${tier.borderColor}`,
                      background: tier.accentColor,
                      padding: "2rem",
                      position: "relative",
                      boxShadow: tier.highlight ? `0 0 40px ${tier.accentColor.replace("0.08", "0.12")}` : "none",
                    }}
                  >
                    {tier.badge && (
                      <div style={{
                        position: "absolute",
                        top: "-1px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        padding: "0.25rem 0.875rem",
                        background: tier.color,
                        borderRadius: "0 0 0.5rem 0.5rem",
                        fontSize: "0.625rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "hsl(214,16%,4%)",
                        whiteSpace: "nowrap",
                      }}>
                        {tier.badge}
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.25rem" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "0.625rem", display: "flex", alignItems: "center", justifyContent: "center", background: `${tier.color.replace("hsl", "hsla").replace(")", ", 0.12)")}`, border: `1px solid ${tier.color.replace("hsl", "hsla").replace(")", ", 0.25)")}` }}>
                        <Icon size={16} color={tier.color} />
                      </div>
                      <div>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: tier.color, margin: 0 }}>
                          {tier.name}
                        </p>
                      </div>
                    </div>

                    <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "hsl(38,8%,90%)", marginBottom: "0.5rem", letterSpacing: "-0.01em" }}>
                      {tier.tagline}
                    </h3>
                    <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)", lineHeight: 1.65, marginBottom: "1.5rem", flex: "none" }}>
                      {tier.description}
                    </p>

                    <div style={{ marginBottom: "1.75rem" }}>
                      <p style={{ fontSize: "1.375rem", fontWeight: 700, color: "hsl(38,8%,92%)", letterSpacing: "-0.02em", margin: 0 }}>
                        {tier.price}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "hsl(214,7%,45%)", margin: "0.125rem 0 0" }}>
                        {tier.priceSub}
                      </p>
                    </div>

                    <div style={{ flex: 1, marginBottom: "1.75rem" }}>
                      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {tier.features.map((f) => (
                          <li key={f.label} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                            {f.included
                              ? <Check size={13} color="hsl(145,60%,46%)" style={{ flexShrink: 0 }} />
                              : <XIcon size={11} color="hsl(214,7%,28%)" style={{ flexShrink: 0 }} />
                            }
                            <span style={{ fontSize: "0.8125rem", color: f.included ? "hsl(38,8%,78%)" : "hsl(214,7%,40%)" }}>
                              {f.label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Link
                      href={tier.ctaHref}
                      onClick={() => analytics.ctaClick(tier.cta, "/pricing", tier.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1.25rem",
                        borderRadius: "0.625rem",
                        background: tier.highlight ? tier.color : "hsla(0,0%,100%,0.06)",
                        border: `1px solid ${tier.highlight ? "transparent" : "hsla(0,0%,100%,0.12)"}`,
                        color: tier.highlight ? "hsl(214,16%,4%)" : "hsl(38,8%,85%)",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        textDecoration: "none",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                    >
                      {tier.cta} <ArrowRight size={14} />
                    </Link>
                  </m.div>
                );
              })}
            </div>

            {/* Comparison toggle */}
            <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
              <button
                onClick={() => setShowComparison(s => !s)}
                style={{
                  background: "none",
                  border: "1px solid hsla(0,0%,100%,0.1)",
                  borderRadius: "0.5rem",
                  padding: "0.625rem 1.25rem",
                  color: "hsl(214,7%,60%)",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.2)"; (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,80%)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.1)"; (e.currentTarget as HTMLElement).style.color = "hsl(214,7%,60%)"; }}
              >
                <BarChart3 size={13} />
                {showComparison ? "Hide" : "Show"} full comparison table
              </button>
            </div>
          </div>
        </section>

        {/* ── Comparison Table ── */}
        {showComparison && (
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "clamp(3rem,6vw,4rem) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)", overflowX: "auto" }}>
              <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "640px" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "0.75rem 1rem", fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(214,7%,40%)", borderBottom: "1px solid hsla(0,0%,100%,0.08)", width: "40%" }}>
                        Feature
                      </th>
                      {TIERS.map(t => (
                        <th key={t.id} style={{ textAlign: "center", padding: "0.75rem 1rem", fontSize: "0.8125rem", fontWeight: 600, color: t.color, borderBottom: "1px solid hsla(0,0%,100%,0.08)" }}>
                          {t.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_ROWS.map(section => (
                      <>
                        <tr key={`cat-${section.category}`}>
                          <td colSpan={4} style={{ padding: "1.25rem 1rem 0.375rem", fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(214,7%,40%)" }}>
                            {section.category}
                          </td>
                        </tr>
                        {section.features.map(f => (
                          <tr key={f.label} style={{ borderBottom: "1px solid hsla(0,0%,100%,0.04)" }}>
                            <td style={{ padding: "0.625rem 1rem", fontSize: "0.8125rem", color: "hsl(214,7%,60%)" }}>{f.label}</td>
                            <td style={{ padding: "0.625rem 1rem", textAlign: "center" }}><FeatureValue value={f.observer} /></td>
                            <td style={{ padding: "0.625rem 1rem", textAlign: "center", background: "hsla(192,72%,48%,0.03)" }}><FeatureValue value={f.operator} /></td>
                            <td style={{ padding: "0.625rem 1rem", textAlign: "center" }}><FeatureValue value={f.enterprise} /></td>
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </m.div>
            </div>
          </section>
        )}

        {/* ── Design Partner Program ── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0", background: "hsla(0,0%,100%,0.01)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "0.75rem" }}>
                Design Partner Program
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: "1rem" }}>
                Start with a 3-month pilot.
              </h2>
              <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "hsl(214,7%,60%)", maxWidth: "52ch", marginBottom: "2.5rem" }}>
                We work directly with design partners before scaling. Lyte and Alloy get instrumented against your operational data. You get signal coverage and a proof-of-value readout at week 12.
              </p>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {PILOT_DELIVERABLES.map((item, i) => {
                const Icon = item.icon;
                return (
                  <m.div
                    key={item.label}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    className="szl-card"
                    style={{ borderRadius: "0.75rem", padding: "1.375rem" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.625rem" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "0.375rem", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(191,92%,44%,0.10)", border: "1px solid hsla(191,92%,44%,0.20)" }}>
                        <Icon size={13} style={{ color: "hsl(191,92%,44%)" }} />
                      </div>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,88%)", letterSpacing: "-0.005em" }}>{item.label}</p>
                    </div>
                    <p style={{ fontSize: "0.8125rem", lineHeight: 1.65, color: "hsl(214,7%,58%)" }}>{item.desc}</p>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Domain Packs ── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1rem" }}>
                Expand into domain packs
              </p>
              <h2 style={{ fontSize: "clamp(1.375rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.020em", lineHeight: 1.2, marginBottom: "2rem" }}>
                Start with Lyte. Add domain intelligence.
              </h2>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
              {DOMAIN_PACKS.map((pack, i) => {
                const Icon = pack.icon;
                return (
                  <m.div
                    key={pack.name}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.06 }}
                    className="szl-card"
                    style={{ borderRadius: "0.75rem", padding: "1.25rem", borderLeft: `3px solid ${pack.color}` }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <Icon size={14} style={{ color: pack.color }} />
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,88%)" }}>{pack.name}</p>
                    </div>
                    <p style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "hsl(214,7%,55%)" }}>{pack.desc}</p>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── FAQ quick ── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0", background: "hsla(0,0%,100%,0.01)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1.5rem" }}>
                Common questions
              </p>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1rem" }}>
              {[
                { q: "Is there a free trial?", a: "We don't offer self-serve trials. Every engagement starts with a conversation. We're in design-partner stage — we want to make sure the fit is right before we invest in instrumentation." },
                { q: "What does 'design-partner pricing' mean?", a: "We work closely with early customers to ensure real value delivery. Design-partner pricing reflects the depth of involvement and is structured around engagement scope, not per-seat SaaS rates." },
                { q: "How long does implementation take?", a: "Lyte is typically instrumented against your data within the first two weeks. Alloy routing goes live by week 5-8. Full operational proof at week 12." },
                { q: "Can I start with Observer and upgrade?", a: "Yes. Observer gives you signal visibility before committing. Most customers move to Operator once they see the signal surface. Upgrades are handled without data migration — the same architecture, expanded." },
                { q: "What systems does Lyte connect to?", a: "Salesforce, Jira, Linear, Slack, Teams, ServiceNow, PagerDuty, HubSpot, Zendesk, and any system with a webhook or API. Enterprise includes custom connector development." },
                { q: "Is this available outside the US?", a: "Yes. Enterprise tier includes dedicated regional deployment options. Current design partners are in the US, UK, and Singapore." },
              ].map((item, i) => (
                <m.div
                  key={item.q}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className="szl-card"
                  style={{ borderRadius: "0.75rem", padding: "1.25rem" }}
                >
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,88%)", marginBottom: "0.5rem" }}>{item.q}</p>
                  <p style={{ fontSize: "0.8125rem", lineHeight: 1.65, color: "hsl(214,7%,55%)" }}>{item.a}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section style={{ padding: "var(--space-section-sm) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                padding: "clamp(2rem,4vw,3rem)",
                borderRadius: "1rem",
                background: "hsla(192,72%,48%,0.05)",
                border: "1px solid hsla(192,72%,48%,0.2)",
                display: "flex",
                flexWrap: "wrap",
                gap: "1.5rem",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
                  <MessageSquare size={14} color="hsl(192,72%,48%)" />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(192,72%,48%)" }}>Start the conversation</span>
                </div>
                <h3 style={{ fontSize: "clamp(1.25rem,2.5vw,1.625rem)", fontWeight: 600, letterSpacing: "-0.02em", color: "hsl(38,8%,92%)", marginBottom: "0.5rem" }}>
                  Every engagement starts with a conversation.
                </h3>
                <p style={{ fontSize: "0.875rem", color: "hsl(214,7%,55%)", lineHeight: 1.65, maxWidth: "48ch" }}>
                  We don't do one-size pricing. Tell us what you're solving and we'll tell you what tier makes sense — and whether the timing is right.
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", flexShrink: 0 }}>
                <Link
                  href="/contact"
                  className="szl-btn-primary"
                  onClick={() => analytics.ctaClick("Contact Sales", "/pricing", "footer-cta")}
                >
                  Contact Sales <ArrowRight size={14} />
                </Link>
                <Link href="/demo" className="szl-btn-secondary">
                  Watch the Demo
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
