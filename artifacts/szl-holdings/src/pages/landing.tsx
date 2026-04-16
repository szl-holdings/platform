import { useState } from "react";
import { Link } from "wouter";
import { m } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  Lock,
  Database,
  Activity,
  Shield,
  GitBranch,
  Layers,
  Zap,
  Eye,
  CheckCircle2,
  Globe,
  Handshake,
  BarChart3,
  TrendingUp,
  Code2,
  Network,
  FileText,
  Cpu,
  Workflow,
  MoveRight,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

const GOVERNED_LOOP = [
  {
    step: "01",
    label: "Signal Ingestion",
    body: "Lyte connects to the approval queues, task systems, and workflow tools your teams already use. Every event is timestamped, attributed, and held in the Outcome Graph.",
    accent: "hsl(192,72%,48%)",
  },
  {
    step: "02",
    label: "Risk Surface",
    body: "Ownership gaps, workflow friction, and execution risk appear before damage compounds. The signal-to-visibility arc is always live — not a weekly report.",
    accent: "hsl(215,60%,60%)",
  },
  {
    step: "03",
    label: "Governed Decision",
    body: "Covenant Policy routes every consequential action through the right approval channel. No autonomous execution. Every decision is bounded, explained, and attributable.",
    accent: "hsl(258,55%,68%)",
  },
  {
    step: "04",
    label: "Proof Chain",
    body: "Every signal, forecast, approval, and action is linked in an immutable record. The audit trail is not an afterthought — it is the operating primitive.",
    accent: "hsl(38,72%,58%)",
  },
];

const DIFFERENTIATION = [
  {
    label: "Proof over promise",
    body: "Every action traces to the signal that caused it. Every model output carries source attribution. You can explain any decision to a regulator or board — in real time.",
    icon: FileText,
  },
  {
    label: "Governance is the primitive",
    body: "Covenant Policy is built into the action layer, not added by compliance after the fact. Human-in-the-loop controls are not optional features.",
    icon: Lock,
  },
  {
    label: "One architecture, every domain",
    body: "Domain Packs — Aegis, Vessels, Terra, PRISM Counsel — are governed extensions of the same spine. They inherit the Proof Chain, the Outcome Graph, and Alloy's execution fabric.",
    icon: Layers,
  },
  {
    label: "Operator surfaces, not analyst reports",
    body: "Lyte is built for the person who owns the outcome. Signals surface what's stuck and what's at risk. Alloy routes the response. Command gives the executive view. No analyst required.",
    icon: Eye,
  },
];

const TRUST_PRIMITIVES = [
  {
    icon: Lock,
    label: "Human-in-the-loop by default",
    body: "Covenant Policy enforces approval gates on every consequential action. Autonomous execution requires explicit, documented authorization.",
  },
  {
    icon: Database,
    label: "Source attribution on every output",
    body: "Every signal traces to its origin. Model outputs are grounded and linkable — never opaque, never hallucinated without flagging.",
  },
  {
    icon: Activity,
    label: "Immutable Proof Chain",
    body: "The Proof Chain records every action, approval, and inference in sequence. Defensible, retrievable, and auditable without additional tooling.",
  },
  {
    icon: Shield,
    label: "Policy routing, not bolt-on compliance",
    body: "Governance is encoded in the action primitive. Compliance is an output of operations, not a separate team reviewing logs after the fact.",
  },
];

const DOMAIN_PACKS = [
  {
    slug: "PRISM Counsel",
    category: "Legal Operations",
    desc: "Matter twins, deadline tracking, and governed demand workflows for litigation teams. Proof Chain and Outcome Graph, legal domain layer.",
    color: "#8b7ac8",
    href: "/solutions/prism-counsel",
  },
  {
    slug: "Vessels",
    category: "Maritime Intelligence",
    desc: "Voyage and fleet twins with risk-ranked action surfaces for fleet operators. Pre-designation signals, sanctions exposure, and port risk — governed and audited.",
    color: "#4a90b8",
    href: "/solutions/vessels",
  },
  {
    slug: "Aegis",
    category: "Defense & Security",
    desc: "Threat twins and SOC command for environments where every decision has consequence. Policy-gated, attribution-complete, fully audited.",
    color: "#c85a5a",
    href: "/solutions/aegis",
  },
  {
    slug: "Terra",
    category: "Real Estate Intelligence",
    desc: "Property twins with distress signals, deal tracking, and governed underwriting flows. Surface the opportunity 19 days before it hits public records.",
    color: "#5fa87a",
    href: "/solutions/terra",
  },
  {
    slug: "Carlota Jo",
    category: "Private Advisory",
    desc: "Premium client advisory with discreet intake, managed service flows, and audit-grade delivery. Governed from first engagement.",
    color: "#c8a05a",
    href: "/carlota-jo/",
  },
];

const PLATFORM_LAYERS = [
  {
    tier: "Platform",
    label: "Command surfaces",
    items: ["Lyte", "Alloy", "CORTEX", "Command"],
    color: "hsl(192,72%,48%)",
    desc: "The operating consoles — observability, execution, mobile command, and executive view.",
  },
  {
    tier: "Primitives",
    label: "Core building blocks",
    items: ["Outcome Graph", "Proof Chain", "Covenant Policy", "Simulation", "Workflow Engine"],
    color: "hsl(258,55%,68%)",
    desc: "The durable infrastructure that every surface and every domain pack is built on.",
  },
  {
    tier: "Domain Packs",
    label: "Governed vertical extensions",
    items: ["Aegis", "Vessels", "Terra", "PRISM Counsel", "Carlota Jo", "IMPERIUM"],
    color: "hsl(38,72%,58%)",
    desc: "High-consequence domains with purpose-built signal layers, powered by the same governed spine.",
  },
];

function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      setStatus("error");
      return;
    }
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "newsletter",
          name: email.split("@")[0],
          email,
          app: "szl-holdings",
          message: "Newsletter signup from homepage",
          metadata: { source: "homepage-newsletter-cta" },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || "Submission failed");
      }
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <section style={{ borderBottom: "1px solid var(--color-szl-border)" }} aria-label="Insights newsletter">
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(3rem,6vw,4rem) var(--space-content-x)" }}>
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            display: "flex", flexWrap: "wrap", gap: "2rem", alignItems: "center", justifyContent: "space-between",
            padding: "2rem 2.5rem",
            borderRadius: "0.875rem",
            background: "hsla(0,0%,100%,0.025)",
            border: "1px solid hsla(0,0%,100%,0.07)",
          }}
        >
          <div style={{ maxWidth: "32rem" }}>
            <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.5rem" }}>
              Insights & analysis
            </p>
            <h3 style={{ fontSize: "clamp(1.1rem,2vw,1.4rem)", fontWeight: 600, letterSpacing: "-0.018em", color: "hsl(38,8%,92%)", marginBottom: "0.5rem" }}>
              Governed operations, decision infrastructure, and the SZL thesis.
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--color-szl-text-secondary)", lineHeight: 1.6 }}>
              Founder-written analysis on the ideas shaping operational governance. Published when it's worth reading.
            </p>
          </div>
          <div style={{ minWidth: "280px", flex: "1 1 280px", maxWidth: "420px" }}>
            {status === "success" ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1.125rem", borderRadius: "0.5rem", background: "hsla(145,60%,46%,0.12)", border: "1px solid hsla(145,60%,46%,0.25)" }}>
                <span style={{ fontSize: "1.25rem" }} role="img" aria-label="Success">✓</span>
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(145,60%,72%)", margin: 0 }}>You're on the list.</p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-szl-text-secondary)", margin: "0.15rem 0 0" }}>We'll reach out when something worth reading is published.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate aria-label="Subscribe to SZL Insights">
                <label htmlFor="newsletter-email" style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--color-szl-text-secondary)", marginBottom: "0.5rem" }}>
                  Email address
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    id="newsletter-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (status === "error") { setStatus("idle"); setErrorMsg(""); } }}
                    placeholder="you@company.com"
                    aria-describedby={errorMsg ? "newsletter-error" : undefined}
                    aria-invalid={status === "error"}
                    disabled={status === "submitting"}
                    style={{
                      flex: 1,
                      padding: "0.625rem 0.875rem",
                      background: "hsla(0,0%,100%,0.06)",
                      border: `1px solid ${status === "error" ? "hsla(0,72%,60%,0.6)" : "hsla(0,0%,100%,0.14)"}`,
                      borderRadius: "0.375rem",
                      color: "hsl(38,8%,92%)",
                      fontSize: "0.875rem",
                      outline: "none",
                      transition: "border-color 0.2s ease",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "hsla(192,72%,48%,0.7)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = status === "error" ? "hsla(0,72%,60%,0.6)" : "hsla(0,0%,100%,0.14)"; }}
                  />
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    style={{
                      padding: "0.625rem 1rem",
                      background: "hsl(192,72%,48%)",
                      color: "hsl(214,18%,4%)",
                      border: "none",
                      borderRadius: "0.375rem",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: status === "submitting" ? "not-allowed" : "pointer",
                      opacity: status === "submitting" ? 0.7 : 1,
                      whiteSpace: "nowrap",
                      transition: "opacity 0.2s ease",
                    }}
                  >
                    {status === "submitting" ? "Sending…" : "Subscribe"}
                  </button>
                </div>
                {errorMsg && (
                  <p id="newsletter-error" role="alert" style={{ fontSize: "0.78125rem", color: "hsl(0,72%,68%)", marginTop: "0.375rem", margin: "0.375rem 0 0" }}>
                    {errorMsg}
                  </p>
                )}
                <p style={{ fontSize: "0.75rem", color: "var(--color-szl-text-faint)", marginTop: "0.5rem" }}>
                  No spam. Unsubscribe anytime.{" "}
                  <Link href="/insights" style={{ color: "var(--color-szl-text-secondary)", textDecoration: "underline" }}>Browse the archive</Link>
                </p>
              </form>
            )}
          </div>
        </m.div>
      </div>
    </section>
  );
}

export default function HomePage() {
  usePageMeta({
    title: "SZL Holdings — Governed decision infrastructure for high-consequence operations.",
    description:
      "SZL Holdings builds the governed decision system connecting signal to audited execution. Platform: Lyte, Alloy, CORTEX, Command. Primitives: Outcome Graph, Proof Chain, Covenant Policy. Domain Packs: Aegis, Vessels, Terra, PRISM Counsel.",
    canonical: "https://szlholdings.com/",
  });

  return (
    <div className="min-h-screen" style={{ background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content">

        {/* ── 1. Hero ─────────────────────────────────────────────────── */}
        <section style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
          }}>
            <div style={{
              position: "absolute",
              top: "-10rem",
              left: "50%",
              transform: "translateX(-50%)",
              width: "900px",
              height: "600px",
              borderRadius: "50%",
              background: "hsla(192,72%,48%,0.04)",
              filter: "blur(140px)",
            }} />
          </div>
          <div style={{ position: "relative", maxWidth: "1280px", margin: "0 auto", padding: "clamp(7rem,14vw,10rem) var(--space-content-x) clamp(4rem,8vw,6rem)" }}>
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            >
              <p style={{ marginBottom: "1.5rem", fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)" }}>
                SZL Holdings · Design-partner stage · 2026
              </p>
              <h1 style={{
                fontSize: "clamp(2.5rem,5.5vw,4.25rem)",
                fontWeight: 600,
                letterSpacing: "-0.028em",
                lineHeight: 1.08,
                maxWidth: "22ch",
                marginBottom: "1.5rem",
                color: "hsl(38,8%,96%)",
              }}>
                Governed decision infrastructure for high-consequence operations.
              </h1>
              <p style={{
                fontSize: "clamp(1rem,1.8vw,1.125rem)",
                lineHeight: 1.72,
                color: "var(--color-szl-text-secondary)",
                maxWidth: "50ch",
                marginBottom: "0.875rem",
              }}>
                SZL Holdings builds the system that connects every operational signal to an audited, governed decision — with a Proof Chain on every action and human-in-the-loop controls on every consequence.
              </p>
              <p style={{
                fontSize: "clamp(0.9rem,1.5vw,1rem)",
                lineHeight: 1.65,
                color: "var(--color-szl-text-faint)",
                maxWidth: "52ch",
                marginBottom: "2.5rem",
                fontFamily: "var(--font-mono)",
              }}>
                Platform → Primitives → Domain Packs. Signal → visibility → governed execution.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link
                  href="/demo"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.75rem 1.5rem",
                    background: "hsl(192,72%,48%)",
                    color: "hsl(214,18%,4%)",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem", fontWeight: 600,
                    textDecoration: "none",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(192,72%,54%)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(192,72%,48%)"; }}
                >
                  Request a demo
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href="/platform"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.75rem 1.5rem",
                    background: "transparent",
                    color: "var(--color-szl-text-secondary)",
                    border: "1px solid var(--color-szl-border-hover)",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem", fontWeight: 500,
                    textDecoration: "none",
                    transition: "border-color 0.2s ease, color 0.2s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.25)"; (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,90%)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-szl-border-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
                >
                  Explore the platform
                </Link>
                <Link
                  href="/design-partner"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.75rem 1.5rem",
                    background: "transparent",
                    color: "var(--color-szl-text-secondary)",
                    border: "1px solid var(--color-szl-border-hover)",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem", fontWeight: 500,
                    textDecoration: "none",
                    transition: "border-color 0.2s ease, color 0.2s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.25)"; (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,90%)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-szl-border-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
                >
                  <Handshake size={15} />
                  Become a design partner
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        {/* ── 2. Category Definition ──────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", background: "hsla(0,0%,100%,0.015)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(2.5rem,5vw,3.5rem) var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              style={{ display: "grid", gap: "2rem", alignItems: "center" }}
              className="lg:grid-cols-[1fr_auto_1fr]"
            >
              <div>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.75rem" }}>
                  What it is
                </p>
                <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.65, color: "hsl(38,8%,88%)", fontWeight: 500, letterSpacing: "-0.01em" }}>
                  A governed decision system — the operating layer that connects signal ingestion to verified, audited action across every high-consequence domain.
                </p>
              </div>
              <div style={{ width: "1px", height: "100%", minHeight: "60px", background: "var(--color-szl-border)" }} className="hidden lg:block" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {[
                  { label: "Not an AI assistant", accent: "hsl(0,60%,56%)" },
                  { label: "Not a dashboard tool", accent: "hsl(0,60%,56%)" },
                  { label: "Not a workflow automation SaaS", accent: "hsl(0,60%,56%)" },
                ].map((item) => (
                  <span key={item.label} style={{
                    padding: "0.375rem 0.875rem",
                    borderRadius: "2rem",
                    background: `${item.accent}10`,
                    border: `1px solid ${item.accent}25`,
                    fontSize: "0.8125rem",
                    color: item.accent,
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.02em",
                  }}>
                    {item.label}
                  </span>
                ))}
                <span style={{
                  padding: "0.375rem 0.875rem",
                  borderRadius: "2rem",
                  background: "hsla(192,72%,48%,0.1)",
                  border: "1px solid hsla(192,72%,48%,0.25)",
                  fontSize: "0.8125rem",
                  color: "hsl(192,72%,48%)",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.02em",
                }}>
                  Governed decision infrastructure ✓
                </span>
              </div>
            </m.div>
          </div>
        </section>

        {/* ── 3. Architecture / Operating Model ───────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <div style={{ marginBottom: "3rem", maxWidth: "40rem" }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                Architecture
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, color: "hsl(38,8%,94%)", marginBottom: "0.875rem" }}>
                One governed spine. Three tiers. Every domain.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)" }}>
                The platform is not a collection of apps. It is a three-tier architecture where every surface inherits the same primitives, and every domain pack is a governed extension of the same spine.
              </p>
            </div>

            <div style={{ display: "grid", gap: "0.875rem" }}>
              {PLATFORM_LAYERS.map((layer, i) => (
                <m.div
                  key={layer.tier}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  style={{
                    padding: "1.75rem",
                    borderRadius: "0.875rem",
                    background: "hsla(0,0%,100%,0.025)",
                    border: `1px solid ${layer.color}20`,
                    display: "grid",
                    gap: "1.25rem",
                    alignItems: "start",
                  }}
                  className="lg:grid-cols-[160px_1fr_1fr]"
                >
                  <div>
                    <p style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: layer.color, fontFamily: "var(--font-mono)", marginBottom: "0.375rem" }}>
                      {layer.tier}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-szl-text-faint)", lineHeight: 1.5 }}>{layer.label}</p>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                    {layer.items.map((item) => (
                      <span key={item} style={{
                        padding: "0.25rem 0.625rem",
                        borderRadius: "0.3rem",
                        background: `${layer.color}10`,
                        border: `1px solid ${layer.color}25`,
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        color: layer.color,
                        fontFamily: "var(--font-mono)",
                      }}>
                        {item}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontSize: "0.8125rem", lineHeight: 1.62, color: "var(--color-szl-text-secondary)" }}>{layer.desc}</p>
                </m.div>
              ))}
            </div>

            <div style={{ marginTop: "1.75rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <Link
                href="/architecture"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.375rem",
                  fontSize: "0.875rem", fontWeight: 500,
                  color: "var(--color-szl-text-secondary)",
                  textDecoration: "none",
                  transition: "color 0.18s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,90%)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
              >
                Full architecture <ChevronRight size={14} />
              </Link>
              <Link
                href="/how-it-works"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.375rem",
                  fontSize: "0.875rem", fontWeight: 500,
                  color: "var(--color-szl-text-secondary)",
                  textDecoration: "none",
                  transition: "color 0.18s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,90%)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
              >
                How it works <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── 4. Flagship Workflow — The Governed Decision Loop ────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", background: "hsla(0,0%,100%,0.01)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <div style={{ marginBottom: "3rem", maxWidth: "40rem" }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                The governed decision loop
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, color: "hsl(38,8%,94%)", marginBottom: "0.875rem" }}>
                From signal to audited execution. End to end.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--color-szl-text-secondary)" }}>
                Every consequential operation follows the same loop — regardless of domain. The primitives handle the infrastructure. The domain pack supplies the signal logic. The operator sees the surface.
              </p>
            </div>
            <div style={{ display: "grid", gap: "1rem" }} className="sm:grid-cols-2 lg:grid-cols-4">
              {GOVERNED_LOOP.map((step, i) => (
                <m.div
                  key={step.step}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  style={{
                    padding: "1.5rem",
                    borderRadius: "0.75rem",
                    background: "hsla(0,0%,100%,0.025)",
                    border: `1px solid ${step.accent}20`,
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: step.accent, letterSpacing: "0.06em" }}>
                      {step.step}
                    </p>
                    {i < GOVERNED_LOOP.length - 1 && (
                      <MoveRight size={12} style={{ color: "var(--color-szl-text-faint)", opacity: 0.4 }} className="hidden lg:block" />
                    )}
                  </div>
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em", color: "hsl(38,8%,92%)", marginBottom: "0.625rem" }}>
                    {step.label}
                  </h3>
                  <p style={{ fontSize: "0.8125rem", lineHeight: 1.62, color: "var(--color-szl-text-secondary)" }}>
                    {step.body}
                  </p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. Lyte + Alloy ─────────────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <div style={{ display: "grid", gap: "2rem" }} className="lg:grid-cols-2">

              {/* Lyte */}
              <m.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                style={{
                  padding: "2rem",
                  borderRadius: "0.875rem",
                  background: "hsla(192,72%,48%,0.04)",
                  border: "1px solid hsla(192,72%,48%,0.16)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <Eye size={14} style={{ color: "hsl(192,72%,48%)" }} />
                  <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(192,72%,48%)", fontFamily: "var(--font-mono)" }}>
                    Lyte — Business Observability
                  </p>
                </div>
                <h2 style={{ fontSize: "clamp(1.25rem,2vw,1.625rem)", fontWeight: 600, letterSpacing: "-0.018em", lineHeight: 1.15, marginBottom: "0.875rem", color: "hsl(38,8%,94%)" }}>
                  The operator console. What's stuck surfaces here first.
                </h2>
                <p style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "var(--color-szl-text-secondary)", marginBottom: "1.25rem" }}>
                  Lyte ingests signals from the approval queues, handoffs, and workflow tools your teams already use. It surfaces what's stuck, at risk, or about to fail — with explainable context behind every flag.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  {[
                    "Approval latency tracked across every tool and team",
                    "Ownership gaps surfaced before accountability breaks down",
                    "Workflow friction identified with root cause context",
                    "Cross-system visibility, no data warehouse required",
                  ].map((point) => (
                    <div key={point} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                      <CheckCircle2 size={13} style={{ color: "hsl(192,72%,48%)", marginTop: "2px", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "var(--color-szl-text-secondary)" }}>{point}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/lyte"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.375rem",
                    fontSize: "0.8125rem", fontWeight: 600,
                    color: "hsl(192,72%,48%)",
                    textDecoration: "none",
                    transition: "opacity 0.18s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                >
                  Explore Lyte <ChevronRight size={13} />
                </Link>
              </m.div>

              {/* Alloy */}
              <m.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.08 }}
                style={{
                  padding: "2rem",
                  borderRadius: "0.875rem",
                  background: "hsla(215,35%,56%,0.04)",
                  border: "1px solid hsla(215,35%,56%,0.16)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <Zap size={14} style={{ color: "hsl(215,35%,65%)" }} />
                  <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(215,35%,65%)", fontFamily: "var(--font-mono)" }}>
                    Alloy — Execution Fabric
                  </p>
                </div>
                <h2 style={{ fontSize: "clamp(1.25rem,2vw,1.625rem)", fontWeight: 600, letterSpacing: "-0.018em", lineHeight: 1.15, marginBottom: "0.875rem", color: "hsl(38,8%,94%)" }}>
                  The execution spine beneath every governed action.
                </h2>
                <p style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "var(--color-szl-text-secondary)", marginBottom: "1.25rem" }}>
                  Alloy routes action to the right person through the right channel, with Covenant Policy controlling every consequential step and the Proof Chain recording the complete trace.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  {[
                    "Structured workflow routing across teams and systems",
                    "Automated escalation when tasks stall past SLA",
                    "Follow-through verification, not just task assignment",
                    "Governance-grade Proof Chain for every decision taken",
                  ].map((point) => (
                    <div key={point} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                      <CheckCircle2 size={13} style={{ color: "hsl(215,35%,65%)", marginTop: "2px", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "var(--color-szl-text-secondary)" }}>{point}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/alloy-fabric"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.375rem",
                    fontSize: "0.8125rem", fontWeight: 600,
                    color: "hsl(215,35%,65%)",
                    textDecoration: "none",
                    transition: "opacity 0.18s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                >
                  Explore Alloy <ChevronRight size={13} />
                </Link>
              </m.div>
            </div>
          </div>
        </section>

        {/* ── 6. Why We're Different ──────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", background: "hsla(0,0%,100%,0.01)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <div style={{ marginBottom: "3rem", maxWidth: "40rem" }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                Why it's different
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, color: "hsl(38,8%,94%)" }}>
                Four things that change what's possible.
              </h2>
            </div>
            <div style={{ display: "grid", gap: "1rem" }} className="sm:grid-cols-2">
              {DIFFERENTIATION.map((item, i) => {
                const Icon = item.icon;
                return (
                  <m.div
                    key={item.label}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    style={{
                      padding: "1.75rem",
                      borderRadius: "0.875rem",
                      background: "hsla(0,0%,100%,0.025)",
                      border: "1px solid hsla(0,0%,100%,0.07)",
                    }}
                  >
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "0.5rem", marginBottom: "1rem",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "hsla(192,72%,48%,0.08)",
                      border: "1px solid hsla(192,72%,48%,0.18)",
                    }}>
                      <Icon size={15} style={{ color: "hsl(192,72%,48%)" }} />
                    </div>
                    <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em", color: "hsl(38,8%,92%)", marginBottom: "0.625rem" }}>{item.label}</h3>
                    <p style={{ fontSize: "0.8125rem", lineHeight: 1.65, color: "var(--color-szl-text-secondary)" }}>{item.body}</p>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 7. Trust Section ────────────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <div style={{ marginBottom: "3rem", maxWidth: "40rem" }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                Trust & control
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, color: "hsl(38,8%,94%)" }}>
                Accountability is built in. Not bolted on.
              </h2>
            </div>
            <div style={{ display: "grid", gap: "1rem" }} className="sm:grid-cols-2">
              {TRUST_PRIMITIVES.map((t, i) => {
                const Icon = t.icon;
                return (
                  <m.div
                    key={t.label}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: "1rem",
                      padding: "1.5rem",
                      borderRadius: "0.75rem",
                      background: "hsla(0,0%,100%,0.025)",
                      border: "1px solid hsla(0,0%,100%,0.07)",
                    }}
                  >
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "0.5rem", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "hsla(192,72%,48%,0.08)",
                      border: "1px solid hsla(192,72%,48%,0.18)",
                    }}>
                      <Icon size={15} style={{ color: "hsl(192,72%,48%)" }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,92%)", marginBottom: "0.375rem" }}>{t.label}</h3>
                      <p style={{ fontSize: "0.8125rem", lineHeight: 1.62, color: "var(--color-szl-text-secondary)" }}>{t.body}</p>
                    </div>
                  </m.div>
                );
              })}
            </div>
            <div style={{ marginTop: "2rem" }}>
              <Link
                href="/trust"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.375rem",
                  fontSize: "0.875rem", fontWeight: 500,
                  color: "var(--color-szl-text-secondary)",
                  textDecoration: "none",
                  transition: "color 0.18s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,90%)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
              >
                View the Trust Center <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── 8. Domain Packs ─────────────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", background: "hsla(0,0%,100%,0.01)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <div style={{ marginBottom: "3rem", maxWidth: "42rem" }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                Domain Packs
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, color: "hsl(38,8%,94%)", marginBottom: "0.875rem" }}>
                The same governed spine. Purpose-built signal layers for high-consequence verticals.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)" }}>
                Domain Packs are not separate products. They are governed extensions of the same platform — each with a domain-specific signal layer that runs on the Outcome Graph, the Proof Chain, and Alloy.
              </p>
            </div>
            <div style={{ display: "grid", gap: "0.875rem" }} className="sm:grid-cols-2 lg:grid-cols-3">
              {DOMAIN_PACKS.map((pack, i) => (
                <m.div
                  key={pack.slug}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                >
                  <Link href={pack.href} style={{ display: "block", textDecoration: "none" }}>
                    <div
                      style={{
                        padding: "1.5rem",
                        borderRadius: "0.875rem",
                        background: "hsla(0,0%,100%,0.025)",
                        border: "1px solid hsla(0,0%,100%,0.07)",
                        transition: "border-color 0.2s ease, background 0.2s ease",
                        height: "100%",
                      }}
                      onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${pack.color}35`; el.style.background = `${pack.color}06`; }}
                      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "hsla(0,0%,100%,0.07)"; el.style.background = "hsla(0,0%,100%,0.025)"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                        <div>
                          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: pack.color, letterSpacing: "-0.01em" }}>{pack.slug}</p>
                          <p style={{ fontSize: "0.6875rem", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginTop: "1px" }}>{pack.category}</p>
                        </div>
                        <span style={{
                          fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
                          padding: "2px 7px", borderRadius: "3px",
                          background: `${pack.color}12`, border: `1px solid ${pack.color}25`,
                          color: pack.color, fontFamily: "var(--font-mono)",
                        }}>
                          Domain Pack
                        </span>
                      </div>
                      <p style={{ fontSize: "0.8125rem", lineHeight: 1.62, color: "var(--color-szl-text-secondary)" }}>{pack.desc}</p>
                      <p style={{
                        display: "inline-flex", alignItems: "center", gap: "0.25rem",
                        fontSize: "0.75rem", fontWeight: 600, color: pack.color,
                        marginTop: "1.25rem",
                      }}>
                        Learn more <ChevronRight size={12} />
                      </p>
                    </div>
                  </Link>
                </m.div>
              ))}
            </div>
            <div style={{ marginTop: "2rem" }}>
              <Link
                href="/solutions"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.375rem",
                  fontSize: "0.875rem", fontWeight: 500,
                  color: "var(--color-szl-text-secondary)",
                  textDecoration: "none",
                  transition: "color 0.18s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,90%)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
              >
                All Domain Packs <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── 9. Operator Value ────────────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <div style={{ marginBottom: "3rem", maxWidth: "40rem" }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                Who it's for
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, color: "hsl(38,8%,94%)" }}>
                Operators who own consequence. Not analysts who study it.
              </h2>
            </div>
            <div style={{ display: "grid", gap: "0.75rem" }} className="sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  icon: TrendingUp,
                  label: "Executive buyer",
                  desc: "Value proposition, ROI case, and design-partner path.",
                  href: "/platform",
                  accent: "hsl(192,72%,48%)",
                },
                {
                  icon: Code2,
                  label: "Technical evaluator",
                  desc: "Architecture, stack, integration surface, and API contracts.",
                  href: "/architecture",
                  accent: "hsl(215,60%,60%)",
                },
                {
                  icon: Shield,
                  label: "Security reviewer",
                  desc: "Governance controls, Proof Chain design, and audit posture.",
                  href: "/trust",
                  accent: "hsl(340,60%,58%)",
                },
                {
                  icon: Handshake,
                  label: "Design partner",
                  desc: "Direct access to the founding team. Shape what gets built.",
                  href: "/design-partner",
                  accent: "hsl(38,72%,58%)",
                },
                {
                  icon: BarChart3,
                  label: "Investor",
                  desc: "Market thesis, structural moat, and data room.",
                  href: "/investor",
                  accent: "hsl(145,60%,50%)",
                },
              ].map((path, i) => {
                const Icon = path.icon;
                return (
                  <m.div
                    key={path.label}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                  >
                    <Link href={path.href} style={{ display: "block", textDecoration: "none" }}>
                      <div
                        style={{
                          padding: "1.125rem 1.25rem",
                          borderRadius: "0.75rem",
                          background: "hsla(0,0%,100%,0.025)",
                          border: "1px solid hsla(0,0%,100%,0.07)",
                          transition: "border-color 0.2s ease, background 0.2s ease",
                          cursor: "pointer",
                          height: "100%",
                        }}
                        onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${path.accent}35`; el.style.background = `${path.accent}06`; }}
                        onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "hsla(0,0%,100%,0.07)"; el.style.background = "hsla(0,0%,100%,0.025)"; }}
                      >
                        <div style={{
                          width: "30px", height: "30px", borderRadius: "0.4rem", marginBottom: "0.75rem",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: `${path.accent}12`,
                          border: `1px solid ${path.accent}28`,
                        }}>
                          <Icon size={14} style={{ color: path.accent }} />
                        </div>
                        <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,90%)", marginBottom: "0.3rem" }}>{path.label}</p>
                        <p style={{ fontSize: "0.75rem", lineHeight: 1.5, color: "var(--color-szl-text-faint)" }}>{path.desc}</p>
                      </div>
                    </Link>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 10. Enterprise Credibility ───────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", background: "hsla(0,0%,100%,0.01)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <div style={{ display: "grid", gap: "3rem", alignItems: "center" }} className="lg:grid-cols-2">
              <m.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                  Enterprise-grade from day one
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, color: "hsl(38,8%,94%)", marginBottom: "1rem" }}>
                  Built for organizations where decisions have legal and operational consequence.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1.5rem" }}>
                  Proof Chain audit logs, Azure SSO and SCIM provisioning, role-based Covenant Policy gates, and SOC-2 aligned controls. Governance is not a roadmap item — it is the operating assumption.
                </p>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <Link
                    href="/trust"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.375rem",
                      fontSize: "0.875rem", fontWeight: 500,
                      color: "var(--color-szl-text-secondary)",
                      textDecoration: "none",
                      padding: "0.5rem 1rem",
                      border: "1px solid var(--color-szl-border-hover)",
                      borderRadius: "0.375rem",
                      transition: "color 0.18s ease, border-color 0.18s ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,90%)"; (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.25)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-szl-border-hover)"; }}
                  >
                    Trust Center <ChevronRight size={13} />
                  </Link>
                  <Link
                    href="/trust/security"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.375rem",
                      fontSize: "0.875rem", fontWeight: 500,
                      color: "var(--color-szl-text-secondary)",
                      textDecoration: "none",
                      padding: "0.5rem 1rem",
                      border: "1px solid var(--color-szl-border-hover)",
                      borderRadius: "0.375rem",
                      transition: "color 0.18s ease, border-color 0.18s ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,90%)"; (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.25)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-szl-border-hover)"; }}
                  >
                    Security posture <ChevronRight size={13} />
                  </Link>
                  <Link
                    href="/founder"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.375rem",
                      fontSize: "0.875rem", fontWeight: 500,
                      color: "var(--color-szl-text-secondary)",
                      textDecoration: "none",
                      padding: "0.5rem 1rem",
                      border: "1px solid var(--color-szl-border-hover)",
                      borderRadius: "0.375rem",
                      transition: "color 0.18s ease, border-color 0.18s ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,90%)"; (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.25)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-szl-border-hover)"; }}
                  >
                    About the founder <ChevronRight size={13} />
                  </Link>
                </div>
              </m.div>
              <m.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
                <div style={{
                  padding: "1.75rem",
                  borderRadius: "0.875rem",
                  background: "hsla(0,0%,100%,0.025)",
                  border: "1px solid hsla(0,0%,100%,0.07)",
                }}>
                  {[
                    "Design-partner mode — working directly with operators in live environments",
                    "No fabricated traction, no generic messaging, no anonymous team",
                    "Founder runs every design-partner and investor conversation personally",
                    "Architecture and domain packs are built and running — not roadmap items",
                  ].map((item, i) => (
                    <div key={item} style={{
                      display: "flex", alignItems: "flex-start", gap: "0.75rem",
                      paddingBottom: i < 3 ? "0.875rem" : 0,
                      marginBottom: i < 3 ? "0.875rem" : 0,
                      borderBottom: i < 3 ? "1px solid hsla(0,0%,100%,0.05)" : "none",
                    }}>
                      <Globe size={13} style={{ color: "hsl(192,72%,48%)", marginTop: "2px", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.875rem", lineHeight: 1.58, color: "var(--color-szl-text-secondary)" }}>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Design partner testimony block */}
                <div style={{ marginTop: "1.25rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {["Financial Services", "Maritime Operations", "Real Estate Investment", "Cybersecurity", "Legal Operations", "Private Advisory"].map((sector) => (
                    <div key={sector} style={{
                      padding: "0.4rem 1rem",
                      borderRadius: "2rem",
                      background: "hsla(0,0%,100%,0.03)",
                      border: "1px solid hsla(0,0%,100%,0.08)",
                      fontSize: "0.6875rem",
                      color: "var(--color-szl-text-faint)",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.06em",
                    }}>
                      {sector}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: "0.6875rem", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginTop: "0.875rem" }}>
                  Design partners — names withheld at participant request
                </p>
              </m.div>
            </div>
          </div>
        </section>

        {/* ── Newsletter Signup ────────────────────────────────────────── */}
        <NewsletterSection />

        {/* ── Final CTA ────────────────────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", background: "hsla(192,72%,48%,0.02)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              style={{
                borderRadius: "1rem",
                border: "1px solid hsla(192,72%,48%,0.18)",
                padding: "clamp(2rem,5vw,3.5rem)",
                background: "hsla(0,0%,100%,0.025)",
              }}
            >
              <div style={{ maxWidth: "36rem" }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(192,72%,48%)", fontFamily: "var(--font-mono)", marginBottom: "1rem" }}>
                  Request a demo
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.12, color: "hsl(38,8%,94%)", marginBottom: "1rem" }}>
                  See the governed decision loop on a real workflow.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "2rem" }}>
                  The demo covers the full signal-to-action arc — signal ingestion, risk surface, Covenant Policy routing, and the Proof Chain — using staged data. Request a design-partner conversation to instrument one of your own workflows.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <Link
                    href="/demo"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.5rem",
                      padding: "0.75rem 1.5rem",
                      background: "hsl(192,72%,48%)",
                      color: "hsl(214,18%,4%)",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem", fontWeight: 600,
                      textDecoration: "none",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(192,72%,54%)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(192,72%,48%)"; }}
                  >
                    Request a demo
                    <ArrowRight size={15} />
                  </Link>
                  <Link
                    href="/design-partner"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.5rem",
                      padding: "0.75rem 1.5rem",
                      background: "transparent",
                      color: "var(--color-szl-text-secondary)",
                      border: "1px solid var(--color-szl-border-hover)",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem", fontWeight: 500,
                      textDecoration: "none",
                      transition: "border-color 0.2s ease, color 0.2s ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.25)"; (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,90%)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-szl-border-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
                  >
                    Become a design partner
                  </Link>
                </div>
              </div>
            </m.div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
