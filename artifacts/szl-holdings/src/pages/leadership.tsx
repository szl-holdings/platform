import { useState } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, ExternalLink, BookOpen, Network, Activity, TrendingUp, Users, Target } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const THESIS_POINTS = [
  {
    label: "Observability is the missing layer",
    body: "Organizations have dashboards that show what happened. They have AI that suggests what to do. What they lack is the layer that catches what's about to break — in real time, across systems, with explainable attribution.",
  },
  {
    label: "Execution is the harder problem",
    body: "Visibility without execution is just more information. The real value is in closing the loop: routing the right action to the right person, verifying it happened, and building an audit-grade record of the whole chain.",
  },
  {
    label: "Architecture before go-to-market",
    body: "Building one shared spine (Alloy) beneath multiple vertical operating systems is a deliberate architectural bet. It creates compounding leverage: every improvement to the execution fabric benefits every platform simultaneously.",
  },
  {
    label: "Disciplined honesty as strategy",
    body: "No fake traction. No vaporware. No generic 'AI platform' positioning. The products are built. The architecture is real. This posture is not just ethical — it is a strategic differentiator in a market full of noise.",
  },
];

const CASE_STUDIES = [
  {
    label: "Maritime Intelligence",
    product: "SEXTANT",
    outcome: "AIS analytics (live public feeds plus simulated demo data), route intelligence, and fleet command for maritime operators — replacing fragmented data feeds with a single command surface.",
    accent: "#22d3ee",
    href: "/vessels/",
  },
  {
    label: "Security Operations",
    product: "PARAGON",
    outcome: "Unified SOC command, XDR correlation, managed operations, and governed analyst intelligence — built on the principle that defense, operations, and intelligence must share one accountable data layer.",
    accent: "#ef4444",
    href: "/aegis/",
  },
  {
    label: "Real Estate Intelligence",
    product: "DOMAINE",
    outcome: "Broker command system replacing spreadsheet workflows with live market intelligence, client CRM, and deal pipeline automation — designed for high-volume, precision-oriented operators.",
    accent: "#4ade80",
    href: "/terra/",
  },
  {
    label: "Business Observability",
    product: "KORA",
    outcome: "The operations intelligence layer: surfacing what's about to break before it does — across revenue, ops, and customer signals — in a single command surface with governed execution.",
    accent: "#d4a054",
    href: "/command/operations/",
  },
];

const ECOSYSTEM_HEALTH = [
  { label: "Platforms Live", value: "6", sub: "web + mobile" },
  { label: "Architecture Tables", value: "446", sub: "one shared schema" },
  { label: "API Endpoints", value: "1,618+", sub: "fully typed" },
  { label: "Design Partners", value: "12", sub: "active engagements" },
];

const CURRENT_FOCUS = [
  "Design-partner engagements for Lyte — working directly with operators on one instrumented workflow",
  "Investor conversations with a tight principal-only process — no intermediaries",
  "Architecture refinement across the Alloy execution fabric based on real operator feedback",
  "Disciplined company-building: no premature scale, no artificial traction signals",
];

const WRITING = [
  {
    title: "The observability gap in enterprise software",
    summary: "Most enterprise software tells you what happened. Very few tell you what's about to happen — and fewer still close the loop into action. That gap is the founding thesis.",
    tag: "Thesis",
  },
  {
    title: "Why architecture compounds before go-to-market",
    summary: "Building one shared fabric beneath multiple verticals is a bet that compounding leverage — not first-mover advantage — is the durable moat in enterprise software.",
    tag: "Strategy",
  },
  {
    title: "On disciplined honesty as competitive strategy",
    summary: "The market for enterprise software is full of vaporware and inflated claims. Radical transparency about what is real and what is roadmap has become a differentiation, not just an ethic.",
    tag: "Operating Doctrine",
  },
];

export default function LeadershipPage() {
  const [activeCase, setActiveCase] = useState(0);

  const __pageMeta = usePageMeta({
    title: "Leadership — SZL Holdings",
    description: "Meet the founder and investment thesis behind SZL Holdings — the governed decision operating system built for enterprise operations, domain intelligence, and accountable AI execution.",
    canonical: "https://szlholdings.com/leadership",
    ogImage: "https://szlholdings.com/og/og-home.jpg",
  });

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen bg-white">
        <SiteNav />
  
        {/* Hero */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "clamp(5rem,10vw,8rem) 0 clamp(3rem,6vw,5rem)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1rem" }}
            >
              SZL Holdings · Leadership
            </m.p>
            <m.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.1, color: "hsl(38,8%,94%)", marginBottom: "1.5rem", maxWidth: "36rem" }}
            >
              Stephen Lutar
            </m.h1>
            <m.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.75, color: "var(--color-szl-text-secondary)", maxWidth: "38rem", marginBottom: "2.5rem" }}
            >
              Founder and architect of SZL Holdings. I build a governed decision operating system at the intersection of observability, model-assisted reasoning, and accountable execution — across maritime, security, real estate, and advisory domains.
            </m.p>
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18 }}
              style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}
            >
              <Link
                href="/contact"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.6875rem 1.375rem",
                  background: "linear-gradient(135deg, #d4a054 0%, #c8953c 100%)",
                  color: "hsl(214,18%,4%)",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem", fontWeight: 600,
                  textDecoration: "none",
                  boxShadow: "0 2px 12px hsla(38,50%,52%,0.2)",
                }}
              >
                Start a conversation <ArrowRight size={14} />
              </Link>
              <Link
                href="/founder"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.6875rem 1.375rem",
                  background: "transparent",
                  color: "var(--color-szl-text-secondary)",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem", fontWeight: 500,
                  textDecoration: "none",
                  border: "1px solid var(--color-szl-border)",
                }}
              >
                Full profile
              </Link>
            </m.div>
          </div>
        </section>
  
        {/* Ecosystem health widget */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "clamp(2.5rem,5vw,4rem) 0", background: "hsla(0,0%,0%,0.015)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1.5rem" }}>
              Ecosystem Health
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1px", background: "var(--color-szl-border)", borderRadius: "0.75rem", overflow: "hidden", border: "1px solid var(--color-szl-border)" }}>
              {ECOSYSTEM_HEALTH.map((item, i) => (
                <m.div
                  key={item.label}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  style={{ padding: "1.5rem 1.25rem", background: "hsl(214,16%,4%)" }}
                >
                  <div style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 700, fontFamily: "var(--font-mono)", color: "hsl(38,8%,94%)", lineHeight: 1 }}>{item.value}</div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--color-szl-text-secondary)", marginTop: "0.375rem" }}>{item.label}</div>
                  <div style={{ fontSize: "0.625rem", fontFamily: "var(--font-mono)", color: "var(--color-szl-text-faint)", marginTop: "0.25rem" }}>{item.sub}</div>
                </m.div>
              ))}
            </div>
          </div>
        </section>
  
        {/* Thesis */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "clamp(3.5rem,7vw,5.5rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "3rem", maxWidth: "56rem" }}>
              <div>
                <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1rem" }}>
                  Thesis
                </p>
                <h2 style={{ fontSize: "clamp(1.375rem,2.8vw,2rem)", fontWeight: 600, letterSpacing: "-0.018em", lineHeight: 1.15, marginBottom: "1.25rem", color: "hsl(38,8%,94%)" }}>
                  Observability without execution is noise. Execution without observability is risk.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1rem" }}>
                  The gap between knowing and doing is where enterprise software fails. Most tools surface data. Few close the loop into governed action with a full audit trail. SZL Holdings is built around that gap — with platforms that observe, understand, decide, and execute.
                </p>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)" }}>
                  This is not a generalist platform story. It is a focused bet on the industries where that arc is worth the most: litigation, maritime, security, real estate, and executive advisory.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {THESIS_POINTS.map((point, i) => (
                  <m.div
                    key={point.label}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.07 }}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: "1rem",
                      padding: "1.125rem 1.25rem",
                      borderRadius: "0.5rem",
                      background: "hsla(0,0%,100%,0.025)",
                      border: "1px solid hsla(0,0%,100%,0.06)",
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 700, color: "#d4a054", flexShrink: 0, paddingTop: "2px", minWidth: "20px" }}>
                      0{i + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,88%)", marginBottom: "0.375rem" }}>{point.label}</div>
                      <p style={{ fontSize: "0.8125rem", lineHeight: 1.62, color: "var(--color-szl-text-secondary)" }}>{point.body}</p>
                    </div>
                  </m.div>
                ))}
              </div>
            </div>
          </div>
        </section>
  
        {/* Case studies */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "clamp(3.5rem,7vw,5.5rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1.5rem" }}>
              Case Studies
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1px", background: "var(--color-szl-border)", borderRadius: "0.75rem", overflow: "hidden", border: "1px solid var(--color-szl-border)" }}>
              {CASE_STUDIES.map((cs, i) => (
                <m.a
                  key={cs.product}
                  href={cs.href}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  style={{
                    display: "block",
                    padding: "1.5rem",
                    background: "hsl(214,16%,4%)",
                    textDecoration: "none",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(214,16%,6%)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(214,16%,4%)"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.625rem", fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: cs.accent }}>{cs.label}</span>
                    <ExternalLink size={11} style={{ color: "rgba(255,255,255,0.2)" }} />
                  </div>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,88%)", marginBottom: "0.625rem" }}>{cs.product}</div>
                  <p style={{ fontSize: "0.8125rem", lineHeight: 1.62, color: "rgba(255,255,255,0.4)" }}>{cs.outcome}</p>
                </m.a>
              ))}
            </div>
          </div>
        </section>
  
        {/* Current focus */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "clamp(3.5rem,7vw,5.5rem) 0", background: "hsla(0,0%,0%,0.01)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1.5rem" }}>
              Current Focus
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", maxWidth: "44rem" }}>
              {CURRENT_FOCUS.map((item, i) => (
                <m.div
                  key={item}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "0.875rem",
                    padding: "1rem 1.25rem",
                    borderRadius: "0.5rem",
                    background: "hsla(0,0%,100%,0.025)",
                    border: "1px solid hsla(0,0%,100%,0.06)",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 700, color: "#d4a054", flexShrink: 0, paddingTop: "2px", minWidth: "20px" }}>
                    0{i + 1}
                  </span>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.62, color: "var(--color-szl-text-secondary)" }}>{item}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>
  
        {/* Ecosystem Network Graph */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "clamp(3.5rem,7vw,5.5rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1.5rem" }}>
              Portfolio Topology
            </p>
            <div style={{ position: "relative", borderRadius: "0.75rem", border: "1px solid hsla(0,0%,100%,0.06)", background: "hsl(214,20%,4%)", overflow: "hidden", minHeight: "320px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 800 280" style={{ width: "100%", maxHeight: "320px" }} preserveAspectRatio="xMidYMid meet">
                <defs>
                  <radialGradient id="node-glow-szl" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#d4a054" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#d4a054" stopOpacity="0" />
                  </radialGradient>
                </defs>
                {/* Center node */}
                <circle cx="400" cy="140" r="40" fill="rgba(212,160,84,0.08)" stroke="rgba(212,160,84,0.35)" strokeWidth="1.5" />
                <text x="400" y="136" textAnchor="middle" fill="rgba(212,160,84,0.9)" fontSize="9" fontFamily="monospace" fontWeight="700" letterSpacing="0.1em">SZL</text>
                <text x="400" y="149" textAnchor="middle" fill="rgba(212,160,84,0.5)" fontSize="7" fontFamily="monospace">HOLDINGS</text>
                {/* Satellite nodes with edges */}
                {[
                  { cx: 180, cy: 60, label: "PARAGON", sub: "Defense", color: "#ef4444" },
                  { cx: 620, cy: 60, label: "SEXTANT", sub: "Maritime", color: "#22d3ee" },
                  { cx: 140, cy: 200, label: "DOMAINE", sub: "Real Estate", color: "#4ade80" },
                  { cx: 660, cy: 200, label: "KORA", sub: "AIOps", color: "#818cf8" },
                  { cx: 400, cy: 20, label: "IMPERIUM", sub: "Cloud", color: "#a78bfa" },
                  { cx: 260, cy: 250, label: "Carlota Jo", sub: "Advisory", color: "#f472b6" },
                  { cx: 540, cy: 250, label: "PRAXIS", sub: "→ Aegis Legal", color: "#fbbf24" },
                ].map((node) => (
                  <g key={node.label}>
                    <line x1={node.cx} y1={node.cy} x2="400" y2="140" stroke={`${node.color}25`} strokeWidth="1" strokeDasharray="4 4" />
                    <circle cx={node.cx} cy={node.cy} r="28" fill={`${node.color}08`} stroke={`${node.color}30`} strokeWidth="1" />
                    <text x={node.cx} y={node.cy - 2} textAnchor="middle" fill={`${node.color}cc`} fontSize="8" fontFamily="monospace" fontWeight="700">{node.label}</text>
                    <text x={node.cx} y={node.cy + 10} textAnchor="middle" fill={`${node.color}55`} fontSize="6.5" fontFamily="monospace">{node.sub}</text>
                  </g>
                ))}
              </svg>
            </div>
            <p style={{ marginTop: "1rem", fontSize: "0.8125rem", color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-mono)", letterSpacing: "0.02em" }}>
              Six platforms. One intelligence layer. All sovereign.
            </p>
          </div>
        </section>
  
        {/* Writing / thought leadership */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "clamp(3.5rem,7vw,5.5rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)" }}>
                Thought Leadership
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0px", border: "1px solid var(--color-szl-border)", borderRadius: "0.75rem", overflow: "hidden" }}>
              {WRITING.map((item, i) => (
                <m.div
                  key={item.title}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  style={{
                    padding: "1.25rem 1.5rem",
                    borderBottom: i < WRITING.length - 1 ? "1px solid var(--color-szl-border)" : "none",
                    background: "hsl(214,16%,4%)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.5rem", fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#d4a054", padding: "2px 6px", border: "1px solid rgba(212,160,84,0.2)", borderRadius: "3px" }}>
                      {item.tag}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,88%)", marginBottom: "0.375rem" }}>{item.title}</div>
                  <p style={{ fontSize: "0.8125rem", lineHeight: 1.62, color: "rgba(255,255,255,0.35)" }}>{item.summary}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>
  
        {/* CTA */}
        <section style={{ padding: "clamp(3.5rem,7vw,5.5rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ maxWidth: "32rem" }}>
              <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1rem" }}>
                Get in touch
              </p>
              <h2 style={{ fontSize: "clamp(1.25rem,2.5vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.018em", lineHeight: 1.15, marginBottom: "1rem", color: "hsl(38,8%,94%)" }}>
                All conversations go to the founder.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1.75rem" }}>
                Design-partner sessions, investor conversations, media inquiries, and partner discussions — all handled directly. No sales queue.
              </p>
              <Link
                href="/contact"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.75rem 1.5rem",
                  background: "linear-gradient(135deg, #d4a054 0%, #c8953c 100%)",
                  color: "hsl(214,18%,4%)",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem", fontWeight: 600,
                  textDecoration: "none",
                  boxShadow: "0 2px 12px hsla(38,50%,52%,0.2)",
                }}
              >
                Start a conversation
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
  
        <SiteFooter />
      </div>
        </>
  );
}
