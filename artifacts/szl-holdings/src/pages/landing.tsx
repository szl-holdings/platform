import { m } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Zap,
  GitBranch,
  ShieldCheck,
  Ship,
  Building2,
  BriefcaseBusiness,
  Eye,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const PIPELINE = [
  { label: "Signal", sub: "Lyte detects it", color: "var(--color-lyte)", accentClass: "bg-lyte" },
  { label: "Interpretation", sub: "Context & priority", color: "var(--color-lyte)", accentClass: "" },
  { label: "Recommendation", sub: "Alloy proposes action", color: "var(--color-alloy)", accentClass: "" },
  { label: "Approval", sub: "Human-in-the-loop", color: "var(--color-alloy)", accentClass: "" },
  { label: "Action", sub: "Alloy executes", color: "var(--color-alloy)", accentClass: "" },
  { label: "Audit", sub: "Immutable record", color: "hsl(145,62%,40%)", accentClass: "" },
];

const PROBLEMS = [
  {
    title: "Invisible execution risk",
    body: "Revenue, approvals, handoffs, and ownership drift live in disconnected tools. By the time leadership sees the problem, the damage is done.",
  },
  {
    title: "No command layer",
    body: "Teams have dashboards, BI, and messaging channels — but not a system that connects signal to decision to confirmed action.",
  },
  {
    title: "AI without accountability",
    body: "Most AI outputs are not traceable, governed, or tied to execution. That creates noise and liability instead of trust and velocity.",
  },
];

const VERTICALS = [
  {
    icon: ShieldCheck,
    name: "Aegis",
    domain: "Defense & intelligence",
    body: "SOC command, XDR, managed security operations — the same observability + execution discipline applied to high-consequence security environments.",
    accent: "var(--color-aegis)",
    href: "/solutions/aegis",
  },
  {
    icon: Ship,
    name: "Vessels",
    domain: "Maritime intelligence",
    body: "Fleet visibility, voyage performance, and operational exceptions — business observability for assets underway.",
    accent: "var(--color-vessels)",
    href: "/solutions/vessels",
  },
  {
    icon: Building2,
    name: "Terra",
    domain: "Real estate intelligence",
    body: "Distress tracking, deal pipeline, and market signal — a data-rich, execution-poor industry that needs a command layer.",
    accent: "var(--color-terra)",
    href: "/solutions/terra",
  },
  {
    icon: BriefcaseBusiness,
    name: "Carlota Jo",
    domain: "Executive advisory",
    body: "High-trust advisory services around complex operations, capital situations, and organizational execution for principals who need a thought partner.",
    accent: "var(--color-carlota)",
    href: "/carlota-jo",
  },
];

const CATEGORY_TERMS = [
  "business observability",
  "decision-grade intelligence",
  "governed action",
  "signal-to-decision-to-action",
  "human-in-the-loop automation",
  "audit-grade execution",
];

export default function HomePage() {
  usePageMeta({
    title: "SZL Holdings — Lyte + Alloy",
    description:
      "SZL Holdings is building Lyte, a business observability platform powered by Alloy, its execution fabric and audit layer. Signal to decision to governed action.",
    canonical: "https://szlholdings.com/",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />

      <main id="main-content" role="main">

        {/* ── Hero ── */}
        <section
          className="szl-grid-texture szl-depth-glow-dual"
          style={{
            paddingTop: "var(--space-hero-pt)",
            paddingBottom: "clamp(5rem, 9vw, 7rem)",
            borderBottom: "1px solid var(--color-szl-border)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  border: "1px solid var(--color-lyte-border)",
                  background: "var(--color-lyte-muted)",
                  borderRadius: "9999px",
                  padding: "0.25rem 0.75rem",
                  marginBottom: "1.75rem",
                }}
              >
                <span className="szl-pulse-cyan" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-lyte-light)" }}>
                  Operating Platform
                </span>
              </div>
            </m.div>

            <div style={{ display: "grid", gap: "clamp(2.5rem, 5vw, 4rem)", alignItems: "end" }} className="lg:grid-cols-[1.3fr_0.7fr]">
              <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }}>
                <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.20em", color: "var(--color-szl-text-muted)", marginBottom: "1rem", fontFamily: "var(--font-mono)" }}>
                  SZL Holdings
                </p>
                <h1
                  style={{
                    fontSize: "clamp(2.75rem, 6vw, 4.75rem)",
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.04,
                    color: "hsl(38,8%,96%)",
                    maxWidth: "18ch",
                    marginBottom: "1.5rem",
                  }}
                >
                  Lyte is the product.
                  <br />
                  <span style={{ color: "var(--color-lyte)" }}>Alloy</span> is the engine.
                </h1>
                <p
                  style={{
                    fontSize: "clamp(1rem, 1.8vw, 1.125rem)",
                    lineHeight: 1.72,
                    color: "hsl(214,7%,66%)",
                    maxWidth: "52ch",
                    marginBottom: "2.25rem",
                  }}
                >
                  Business observability for operators who need to see execution risk, ownership
                  drift, and workflow friction before it compounds — and a governed execution
                  fabric to act on it without losing auditability.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <Link href="/platform" className="szl-btn-primary">
                    See the platform
                    <ArrowRight size={15} />
                  </Link>
                  <Link href="/demo" className="szl-btn-secondary">
                    Interactive demo
                  </Link>
                  <Link href="/contact" className="szl-btn-ghost">
                    Book a design partner session
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.15 }}
                className="szl-command-card"
                style={{ borderRadius: "0.875rem", padding: "clamp(1.25rem, 3vw, 1.75rem)" }}
              >
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
                  Signal → Action pipeline
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {PIPELINE.map((step, i) => (
                    <div
                      key={step.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.625rem 0.875rem",
                        background: "hsla(214,12%,8%,0.70)",
                        border: `1px solid hsla(0,0%,100%,${i === 0 ? "0.10" : "0.04"})`,
                        borderRadius: "0.375rem",
                        borderLeft: `2px solid ${step.color}`,
                      }}
                    >
                      <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: step.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", fontWeight: 700, color: "hsl(214,18%,3%)" }}>{i + 1}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,92%)", letterSpacing: "-0.01em" }}>{step.label}</div>
                        <div style={{ fontSize: "0.6875rem", color: "var(--color-szl-text-muted)", marginTop: "1px" }}>{step.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </m.div>
            </div>

            {/* Category language strip */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.30 }}
              style={{ marginTop: "3.5rem", paddingTop: "2rem", borderTop: "1px solid var(--color-szl-border)" }}
            >
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "0.875rem" }}>
                Category language
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {CATEGORY_TERMS.map((term) => (
                  <span
                    key={term}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6875rem",
                      fontWeight: 500,
                      letterSpacing: "0.06em",
                      color: "var(--color-szl-text-secondary)",
                      background: "hsla(0,0%,100%,0.04)",
                      border: "1px solid var(--color-szl-border)",
                      borderRadius: "0.25rem",
                      padding: "0.25rem 0.625rem",
                    }}
                  >
                    {term}
                  </span>
                ))}
              </div>
            </m.div>
          </div>
        </section>

        {/* ── Problem framing ── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
            >
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-lyte)", marginBottom: "1rem" }}>
                The problem
              </p>
              <h2
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                  fontWeight: 600,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.14,
                  maxWidth: "28ch",
                  marginBottom: "0.75rem",
                }}
              >
                Operators are drowning in signal but still blind at decision time.
              </h2>
              <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "hsl(214,7%,60%)", maxWidth: "50ch" }}>
                Every team has more data than they can act on. The problem isn't visibility — it's the missing layer between signal and governed action.
              </p>
            </m.div>

            <div className="szl-grid-3" style={{ marginTop: "3rem" }}>
              {PROBLEMS.map((item, i) => (
                <m.div
                  key={item.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="szl-card"
                  style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}
                >
                  <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.75rem" }}>{item.title}</h3>
                  <p style={{ fontSize: "0.9rem", lineHeight: 1.68, color: "hsl(214,7%,62%)" }}>{item.body}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Lyte + Alloy wedge ── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gap: "clamp(3rem, 6vw, 5rem)", alignItems: "start" }} className="lg:grid-cols-[0.85fr_1.15fr]">
              <m.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
              >
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-accent)", marginBottom: "1rem" }}>
                  The platform wedge
                </p>
                <h2
                  style={{
                    fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                    fontWeight: 600,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.14,
                    marginBottom: "1.25rem",
                  }}
                >
                  One focused commercial wedge.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "hsl(214,7%,64%)", marginBottom: "2rem" }}>
                  Lyte is the application layer operators use to see what's happening. Alloy is
                  the execution and audit fabric beneath it — signals, routing, workflows,
                  approvals, and immutable records. Together they tell the story: business
                  observability with governed action.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <Link
                    href="/lyte"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "var(--color-lyte-light)",
                      textDecoration: "none",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Explore Lyte <ArrowRight size={14} />
                  </Link>
                  <Link
                    href="/alloy-fabric"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "var(--color-alloy-light)",
                      textDecoration: "none",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Explore Alloy <ArrowRight size={14} />
                  </Link>
                </div>
              </m.div>

              <div className="szl-grid-2">
                <m.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.08 }}
                  className="szl-lyte-card"
                  style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}
                >
                  <div
                    style={{
                      width: "40px", height: "40px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "var(--color-lyte-muted)",
                      border: "1px solid var(--color-lyte-border)",
                      borderRadius: "0.5rem",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <Eye size={18} color="var(--color-lyte)" />
                  </div>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-lyte)", marginBottom: "0.5rem" }}>
                    Lyte
                  </p>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.015em", marginBottom: "0.75rem" }}>Business Observability</h3>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,62%)" }}>
                    Surface execution risk, ownership drift, approval latency, and workflow
                    friction before it compounds into a real problem.
                  </p>
                </m.div>

                <m.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.14 }}
                  className="szl-alloy-card"
                  style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}
                >
                  <div
                    style={{
                      width: "40px", height: "40px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "var(--color-alloy-muted)",
                      border: "1px solid var(--color-alloy-border)",
                      borderRadius: "0.5rem",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <GitBranch size={18} color="var(--color-alloy-light)" />
                  </div>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-alloy-light)", marginBottom: "0.5rem" }}>
                    Alloy
                  </p>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.015em", marginBottom: "0.75rem" }}>Execution Fabric</h3>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,62%)" }}>
                    Signal normalization, workflow routing, human-in-the-loop approval gates,
                    and immutable audit trail from action to confirmation.
                  </p>
                </m.div>

                {/* Pipeline proof */}
                <m.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.20 }}
                  className="szl-card"
                  style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}
                >
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
                    How they connect
                  </p>
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.375rem" }}>
                    {["Signal", "→", "Context", "→", "Decision", "→", "Approval", "→", "Action", "→", "Audit"].map((item, i) => (
                      <span
                        key={i}
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.8125rem",
                          fontWeight: item === "→" ? 400 : 600,
                          color: item === "→"
                            ? "var(--color-szl-text-faint)"
                            : i < 5
                            ? "var(--color-lyte-light)"
                            : i > 5 && i < 9
                            ? "var(--color-alloy-light)"
                            : "hsl(145,62%,52%)",
                          letterSpacing: item === "→" ? "0.04em" : "-0.01em",
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontSize: "0.8125rem", lineHeight: 1.65, color: "hsl(214,7%,55%)", marginTop: "0.75rem" }}>
                    Every step is logged, attributable, and exportable. Human approval gates before consequential actions. No black-box execution.
                  </p>
                </m.div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Who this is for ── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-sm) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
                Who it's for
              </p>
              <h2
                style={{
                  fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
                  fontWeight: 600,
                  letterSpacing: "-0.022em",
                  lineHeight: 1.18,
                  marginBottom: "2.5rem",
                  maxWidth: "28ch",
                }}
              >
                Built for operators who run on signal, not spreadsheets.
              </h2>
            </m.div>
            <div className="szl-grid-3" style={{ gap: "1rem" }}>
              {[
                { who: "Operators & founders", pain: "Running critical workflows across multiple systems without a unified command view." },
                { who: "Commercial & ops leaders", pain: "Needing faster visibility into approval latency, ownership gaps, and execution risk." },
                { who: "Teams adopting AI", pain: "Wanting AI-assisted workflow without sacrificing auditability, governance, or human control." },
              ].map((item, i) => (
                <m.div
                  key={item.who}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.38, delay: i * 0.07 }}
                  className="szl-card"
                  style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
                    <CheckCircle2 size={15} color="var(--color-lyte)" />
                    <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em" }}>{item.who}</h3>
                  </div>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{item.pain}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Vertical packs as proof ── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
                Domain expansion
              </p>
              <h2
                style={{
                  fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
                  fontWeight: 600,
                  letterSpacing: "-0.022em",
                  lineHeight: 1.18,
                  maxWidth: "28ch",
                  marginBottom: "0.875rem",
                }}
              >
                Vertical packs extend the core into high-stakes domains.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "hsl(214,7%,60%)", maxWidth: "52ch", marginBottom: "2.75rem" }}>
                The same Lyte + Alloy operating system — adapted for the specific signal vocabulary,
                decision models, and audit requirements of each vertical. Not separate products,
                domain packs built on a shared platform.
              </p>
            </m.div>

            <div className="szl-grid-4">
              {VERTICALS.map((v, i) => {
                const Icon = v.icon;
                return (
                  <m.div
                    key={v.name}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.07 }}
                    className="szl-card"
                    style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)", borderTop: `1px solid ${v.accent}26` }}
                  >
                    <div
                      style={{
                        width: "36px", height: "36px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: `${v.accent}14`,
                        border: `1px solid ${v.accent}22`,
                        borderRadius: "0.4375rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <Icon size={16} color={v.accent} />
                    </div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: v.accent, marginBottom: "0.25rem", opacity: 0.85 }}>
                      {v.domain}
                    </p>
                    <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.625rem" }}>{v.name}</h3>
                    <p style={{ fontSize: "0.8375rem", lineHeight: 1.65, color: "hsl(214,7%,58%)", marginBottom: "1rem" }}>{v.body}</p>
                    <Link
                      href={v.href}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "0.3rem",
                        fontSize: "0.8125rem", fontWeight: 500, color: v.accent,
                        textDecoration: "none", opacity: 0.80,
                        transition: "opacity 0.18s ease",
                      }}
                    >
                      Learn more <ArrowRight size={12} />
                    </Link>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Trust posture callout ── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-sm) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="szl-card szl-grid-cta"
              style={{
                borderRadius: "0.875rem",
                padding: "clamp(2rem, 4vw, 3rem)",
                gap: "clamp(2rem, 4vw, 3.5rem)",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <ShieldCheck size={16} color="hsl(145,62%,46%)" />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(145,62%,46%)" }}>
                    Trust Center
                  </span>
                </div>
                <h2
                  style={{
                    fontSize: "clamp(1.5rem, 3vw, 2rem)",
                    fontWeight: 600,
                    letterSpacing: "-0.022em",
                    lineHeight: 1.2,
                    marginBottom: "0.875rem",
                  }}
                >
                  Trust is part of the product, not an afterthought.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "55ch" }}>
                  Security posture, AI governance model, human-in-the-loop approval architecture,
                  audit trail design, and responsible disclosure — all documented for customer
                  and capital diligence.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flexShrink: 0 }}>
                <Link href="/trust" className="szl-btn-secondary" style={{ whiteSpace: "nowrap" }}>
                  Explore Trust Center <ArrowRight size={14} />
                </Link>
                <Link href="/trust/architecture" className="szl-btn-ghost" style={{ justifyContent: "center" }}>
                  Architecture overview
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        {/* ── Conversion CTA ── */}
        <section style={{ padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              style={{
                borderRadius: "1rem",
                padding: "clamp(2.5rem, 5vw, 4rem)",
                background: "linear-gradient(135deg, hsla(191,30%,6%,0.90) 0%, hsla(228,30%,6%,0.80) 100%)",
                border: "1px solid hsla(191,92%,44%,0.12)",
                position: "relative",
                overflow: "hidden",
              }}
              className="szl-grid-texture-sm"
            >
              <div style={{ position: "relative", zIndex: 1 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-lyte)", marginBottom: "1.25rem" }}>
                  Next step
                </p>
                <h2
                  style={{
                    fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                    fontWeight: 600,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.12,
                    marginBottom: "1.25rem",
                    maxWidth: "28ch",
                  }}
                >
                  Ready to see it applied to your operating environment?
                </h2>
                <p style={{ fontSize: "1rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "48ch", marginBottom: "2.25rem" }}>
                  We work with a limited number of design partners to instrument one high-friction
                  workflow, measure improvement, and build a replicable operating system.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.875rem" }}>
                  <Link href="/contact" className="szl-btn-primary">
                    Book a design partner session
                    <ArrowRight size={15} />
                  </Link>
                  <Link href="/demo" className="szl-btn-secondary">
                    See the interactive demo
                  </Link>
                  <Link href="/trust" className="szl-btn-ghost">
                    Explore Trust Center <ArrowUpRight size={13} />
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
