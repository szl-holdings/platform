import { useEffect } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import { ShieldCheck, Lock, Brain, Download, Settings, CheckSquare, ArrowRight, Layers, Database, Eye, Briefcase, Code2, UserCheck, BarChart2, Github, Calendar, Key, FileOutput, GitBranch, ExternalLink, FileText, Cookie, Accessibility, Scale, Shield, AlertTriangle } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { analytics } from "@/lib/analytics";

const DILIGENCE_PATHS = [
  {
    id: "executive",
    icon: Briefcase,
    color: "hsl(192,72%,48%)",
    colorMuted: "hsla(192,72%,48%,0.07)",
    colorBorder: "hsla(192,72%,48%,0.20)",
    audience: "Executive Buyer",
    question: "Is this safe to operate at scale?",
    summary: "Governance model, risk surface, audit readiness, and operational accountability.",
    briefHref: "/trust/diligence/executive",
    links: [
      { label: "AI Governance model", href: "/trust/governance" },
      { label: "Approval & HITL gates", href: "/trust/approvals" },
      { label: "System architecture", href: "/architecture" },
      { label: "Operating doctrine", href: "/operating-doctrine" },
    ],
  },
  {
    id: "technical",
    icon: Code2,
    color: "hsl(258,55%,68%)",
    colorMuted: "hsla(258,55%,68%,0.07)",
    colorBorder: "hsla(258,55%,68%,0.20)",
    audience: "Technical Evaluator",
    question: "How is this actually built?",
    summary: "Architecture layers, integration surface, Governance API, proof chain, and data handling.",
    briefHref: "/trust/diligence/technical",
    links: [
      { label: "Platform architecture", href: "/architecture" },
      { label: "Security controls", href: "/trust/security" },
      { label: "Governance API docs", href: "/docs/control-plane" },
      { label: "Proof chain docs", href: "/docs/proof-chain" },
    ],
  },
  {
    id: "security",
    icon: UserCheck,
    color: "hsl(145,62%,46%)",
    colorMuted: "hsla(145,62%,40%,0.07)",
    colorBorder: "hsla(145,62%,40%,0.20)",
    audience: "Security Reviewer",
    question: "What controls are actually in place today?",
    summary: "RBAC, data isolation, credential management, disclosure policy, and threat posture — current state, not roadmap.",
    briefHref: "/trust/diligence/security",
    links: [
      { label: "Security posture", href: "/trust/security" },
      { label: "AI governance", href: "/trust/governance" },
      { label: "Responsible disclosure", href: "/legal/security-disclosure" },
      { label: "Acceptable use policy", href: "/legal/acceptable-use" },
      { label: "Architecture trust layer", href: "/trust/architecture" },
    ],
  },
  {
    id: "investor",
    icon: BarChart2,
    color: "hsl(40,90%,54%)",
    colorMuted: "hsla(40,90%,54%,0.07)",
    colorBorder: "hsla(40,90%,54%,0.22)",
    audience: "Investor",
    question: "What makes this defensible?",
    summary: "Architecture moat, operating doctrine, audit-grade governance, and the thesis behind the platform.",
    briefHref: "/trust/diligence/investor",
    links: [
      { label: "Architecture defensibility", href: "/architecture" },
      { label: "Operating doctrine", href: "/operating-doctrine" },
      { label: "Investor relations", href: "/investor-relations" },
      { label: "Governance audit trail", href: "/trust/governance" },
      { label: "Privacy policy", href: "/legal/privacy" },
      { label: "Terms of service", href: "/legal/terms" },
    ],
  },
];

const LEGAL_PAGES = [
  {
    href: "/legal/privacy",
    icon: Shield,
    label: "Privacy Policy",
    description: "How we collect, use, and protect personal information. UK GDPR / EU GDPR aligned.",
  },
  {
    href: "/legal/terms",
    icon: Scale,
    label: "Terms of Service",
    description: "The contractual terms governing use of every SZL platform and the Governance API.",
  },
  {
    href: "/legal/acceptable-use",
    icon: FileText,
    label: "Acceptable Use Policy",
    description: "What is and isn't permitted on Lyte, Alloy, and the domain pack platforms.",
  },
  {
    href: "/legal/cookies",
    icon: Cookie,
    label: "Cookie Policy",
    description: "Strictly necessary, preference, and analytics cookies — with the consent model.",
  },
  {
    href: "/legal/security-disclosure",
    icon: ShieldCheck,
    label: "Security Disclosure",
    description: "Responsible vulnerability disclosure: reporting channel, scope, and safe-harbour.",
  },
  {
    href: "/accessibility",
    icon: Accessibility,
    label: "Accessibility Statement",
    description: "WCAG 2.1 AA conformance, reviewed annually, with a feedback channel for users.",
  },
];

const TRUST_PAGES = [
  {
    href: "/trust/security",
    icon: Lock,
    color: "hsl(145,62%,46%)",
    colorMuted: "hsla(145,62%,40%,0.08)",
    colorBorder: "hsla(145,62%,40%,0.20)",
    label: "Security",
    headline: "Access controls, credential management & responsible disclosure",
    items: ["Six-tier RBAC enforced server-side", "OpenID Connect / PKCE + Azure AD SSO", "Multi-tenant data isolation", "Encrypted infrastructure throughout"],
  },
  {
    href: "/trust/governance",
    icon: Brain,
    color: "var(--color-alloy-light)",
    colorMuted: "var(--color-alloy-muted)",
    colorBorder: "var(--color-alloy-border)",
    label: "Governance",
    headline: "Approval model, human-in-the-loop gates & decision lineage",
    items: ["AI never acts without human sign-off", "Configurable HITL approval gates", "Complete decision lineage exportable", "Override records — not hidden"],
  },
  {
    href: "/trust/ai",
    icon: Brain,
    color: "hsl(258,55%,68%)",
    colorMuted: "hsla(258,55%,68%,0.08)",
    colorBorder: "hsla(258,55%,68%,0.20)",
    label: "AI Policy",
    headline: "AI usage model, source-grounding, governed inference layer",
    items: ["Source-grounded assertions only", "Model isolation — no training on client data", "Confidence scoring and contradiction detection", "Generated content always labeled as such"],
  },
  {
    href: "/trust/approvals",
    icon: CheckSquare,
    color: "hsl(40,90%,54%)",
    colorMuted: "hsla(40,90%,54%,0.08)",
    colorBorder: "hsla(40,90%,54%,0.22)",
    label: "Approvals",
    headline: "Approval path model, sign-off workflows & escalation model",
    items: ["Tiered approval paths by action risk", "Dual-approval for high-impact actions", "Escalation chains with fallback owners", "Emergency override — logged and mandatory review"],
  },
  {
    href: "/trust/exports",
    icon: Download,
    color: "hsl(210,80%,60%)",
    colorMuted: "hsla(210,80%,60%,0.08)",
    colorBorder: "hsla(210,80%,60%,0.20)",
    label: "Exports",
    headline: "Export model, write-back controls & document generation governance",
    items: ["Proof chain on every exported document", "Privilege screening before export", "Immutable export record with hash", "Post-export access audit trail"],
  },
  {
    href: "/trust/operations",
    icon: Settings,
    color: "hsl(200,70%,52%)",
    colorMuted: "hsla(200,70%,52%,0.08)",
    colorBorder: "hsla(200,70%,52%,0.20)",
    label: "Operations",
    headline: "Operational model, admin visibility & external data policy",
    items: ["Continuous service health monitoring", "Runbook-backed operational procedures", "Tenant-isolated query architecture", "External data ingestion governance"],
  },
  {
    href: "/trust/architecture",
    icon: Layers,
    color: "var(--color-lyte-light)",
    colorMuted: "var(--color-lyte-muted)",
    colorBorder: "var(--color-lyte-border)",
    label: "Architecture",
    headline: "System architecture from a trust and auditability perspective",
    items: ["Signal → action 6-stage pipeline", "Tenant namespace isolation by design", "Domain pack layering model", "Connector permission scoping"],
  },
];

const TRUST_SIGNALS = [
  { icon: Database, text: "Multi-tenant data isolation enforced at the database and middleware layer" },
  { icon: Eye, text: "Every AI decision is observable — signal source, confidence, approver attribution" },
  { icon: ShieldCheck, text: "Audit trail designed for LP reporting, regulatory inquiry, and compliance diligence" },
  { icon: Lock, text: "No plaintext credentials in codebase, logs, or any system surface" },
];

export default function TrustPage() {
  usePageMeta({
    title: "Trust Center — SZL Holdings",
    description: "Security, governance, AI policy, approvals, exports, operations and architecture — documented for buyer and investor diligence.",
    canonical: "https://szlholdings.com/trust",
  });

  useEffect(() => {
    analytics.trustCenterView("page-mount", "/trust");
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        {/* Hero */}
        <section className="szl-grid-texture szl-depth-glow-dual" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.875rem", borderRadius: "99px", border: "1px solid hsla(145,62%,40%,0.22)", background: "hsla(145,62%,40%,0.08)", marginBottom: "1.75rem" }}>
                <ShieldCheck size={13} color="hsl(145,62%,46%)" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "hsl(145,62%,46%)" }}>Trust Center</span>
              </div>
              <h1 style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.06, maxWidth: "20ch", marginBottom: "1.5rem" }}>
                Trust is part of the product, not a slide at the end.
              </h1>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "55ch", marginBottom: "2rem" }}>
                SZL is building Lyte + Alloy for serious operating environments. That means access discipline,
                workflow accountability, observable AI behavior, and full auditability — documented here, not
                promised in a deck.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link href="/contact" className="szl-btn-primary">
                  Start a diligence conversation <ArrowRight size={14} />
                </Link>
                <Link href="/architecture" className="szl-btn-secondary">
                  System architecture →
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        {/* Trust signal strip */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "2rem 0", background: "hsla(214,12%,6%,0.60)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
              {TRUST_SIGNALS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <m.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.06 }}
                    style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}
                  >
                    <div style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(145,62%,40%,0.08)", border: "1px solid hsla(145,62%,40%,0.18)", borderRadius: "0.4375rem", flexShrink: 0 }}>
                      <Icon size={14} color="hsl(145,62%,46%)" />
                    </div>
                    <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,58%)", marginTop: "2px" }}>{s.text}</p>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Audience diligence paths */}
        <section id="evaluators" style={{ padding: "var(--space-section-md) 0", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Self-serve diligence paths</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "32ch", marginBottom: "0.75rem" }}>
                Start where you are.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.68, color: "hsl(214,7%,58%)", maxWidth: "52ch", marginBottom: "3rem" }}>
                Each path below takes you directly to the materials most relevant to your role — no hunting, no gating.
              </p>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
              {DILIGENCE_PATHS.map((path, i) => {
                const Icon = path.icon;
                return (
                  <m.div
                    key={path.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.38, delay: i * 0.07 }}
                    style={{
                      borderRadius: "0.875rem",
                      padding: "1.5rem",
                      background: path.colorMuted,
                      border: `1px solid ${path.colorBorder}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: path.colorMuted, border: `1px solid ${path.colorBorder}`, borderRadius: "0.375rem", flexShrink: 0 }}>
                        <Icon size={15} color={path.color} />
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: path.color }}>{path.audience}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,88%)", marginBottom: "0.375rem", lineHeight: 1.35 }}>{path.question}</p>
                      <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,54%)" }}>{path.summary}</p>
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {path.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", fontWeight: 500, color: path.color, textDecoration: "none", opacity: 0.9, transition: "opacity 0.15s ease" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.9"; }}
                          >
                            <ArrowRight size={11} />
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div style={{ borderTop: `1px solid ${path.colorBorder}`, paddingTop: "0.875rem", marginTop: "0.25rem" }}>
                      <Link
                        href={path.briefHref}
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", fontWeight: 600, color: path.color, textDecoration: "none", padding: "0.375rem 0.75rem", borderRadius: "0.4375rem", background: path.colorMuted, border: `1px solid ${path.colorBorder}`, transition: "opacity 0.15s ease" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                      >
                        <Download size={11} />
                        Download one-page brief
                      </Link>
                    </div>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Trust hub grid */}
        <section style={{ padding: "var(--space-section-md) 0", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Seven coverage areas</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "3rem" }}>
                Everything a serious buyer needs to see.
              </h2>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem" }}>
              {TRUST_PAGES.map((page, i) => {
                const Icon = page.icon;
                return (
                  <m.div
                    key={page.href}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.38, delay: i * 0.06 }}
                  >
                    <Link href={page.href} style={{ display: "block", textDecoration: "none" }}>
                      <div className="szl-card" style={{ borderRadius: "0.875rem", padding: "1.5rem", height: "100%", transition: "border-color 0.18s ease, background 0.18s ease", cursor: "pointer" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = page.color + "40"; (e.currentTarget as HTMLElement).style.background = page.colorMuted; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = ""; (e.currentTarget as HTMLElement).style.background = ""; }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: page.colorMuted, border: `1px solid ${page.colorBorder}`, borderRadius: "0.4375rem" }}>
                              <Icon size={16} color={page.color} />
                            </div>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: page.color }}>{page.label}</span>
                          </div>
                          <ArrowRight size={14} color="hsl(214,7%,42%)" />
                        </div>
                        <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "hsl(38,8%,80%)", marginBottom: "1rem", lineHeight: 1.5 }}>{page.headline}</p>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                          {page.items.map((item) => (
                            <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                              <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: page.color, flexShrink: 0, marginTop: "7px", opacity: 0.7 }} />
                              <span style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "hsl(214,7%,54%)" }}>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Link>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Six Pillars (spec-aligned inline content) */}
        <section id="pillars" style={{ padding: "var(--space-section-md) 0", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>The six pillars</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "32ch", marginBottom: "0.75rem" }}>
                What's actually in place today.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.68, color: "hsl(214,7%,58%)", maxWidth: "56ch", marginBottom: "3rem" }}>
                Each pillar lists the controls a security reviewer can verify against the running system. No aspirational language; no certifications we don't hold.
              </p>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.25rem" }}>
              {[
                {
                  icon: Shield,
                  label: "1 · Security Architecture",
                  href: "/trust/security",
                  color: "hsl(145,62%,46%)",
                  colorMuted: "hsla(145,62%,40%,0.07)",
                  colorBorder: "hsla(145,62%,40%,0.20)",
                  items: [
                    "TLS 1.3 enforced on every browser, mobile and API connection",
                    "mTLS on internal Replit proxy preview connections",
                    "Sessions: HttpOnly + Secure + SameSite=Lax, 24-hour expiry with sliding refresh",
                    "Authentication: bearer token (mobile/API) and session cookie (web), same RBAC enforcement",
                    "Rate limiting: 200 req/15min global, 5 req/1min on auth, 60/min on writes — per user, fail-closed",
                    "10MB body size limit to prevent large-payload DoS",
                    "Tenant isolation enforced at the data layer via callerOrgIds() — architectural, not query-level",
                  ],
                },
                {
                  icon: Database,
                  label: "2 · Data Handling",
                  href: "/trust/architecture",
                  color: "hsl(210,80%,60%)",
                  colorMuted: "hsla(210,80%,60%,0.07)",
                  colorBorder: "hsla(210,80%,60%,0.20)",
                  items: [
                    "Encryption at rest: AES-256-GCM with authentication tags on sensitive fields",
                    "Encryption in transit: TLS 1.3 end-to-end",
                    "Field-level encryption via FIELD_ENCRYPTION_KEY managed in Replit Secrets, not source code",
                    "Database: PostgreSQL 16 on managed Replit infrastructure",
                    "Audit trail: append-only Proof Chain with SHA-256 integrity, activity logger on all consequential actions",
                    "Data residency: United States (Replit-managed)",
                    "Retention: defined in privacy policy; enterprise contracts can specify custom terms",
                  ],
                },
                {
                  icon: Brain,
                  label: "3 · AI Governance",
                  href: "/trust/governance",
                  color: "hsl(258,55%,68%)",
                  colorMuted: "hsla(258,55%,68%,0.07)",
                  colorBorder: "hsla(258,55%,68%,0.20)",
                  items: [
                    "Advisory-only model: AI surfaces recommendations; consequential actions require explicit human approval",
                    "Proof Chain anchoring: every AI output creates an immutable audit trail entry",
                    "Source grounding: every AI recommendation includes the data points it drew from and a confidence score",
                    "Covenant Policy: approval gates enforced at the platform layer — AI cannot route around them",
                    "Multi-provider: OpenAI, Anthropic, Gemini with fallback logic — no single AI provider dependency",
                    "No autonomous execution: AI cannot execute consequential actions without human confirmation",
                  ],
                },
                {
                  icon: UserCheck,
                  label: "4 · Access Controls",
                  href: "/trust/security",
                  color: "hsl(40,90%,54%)",
                  colorMuted: "hsla(40,90%,54%,0.07)",
                  colorBorder: "hsla(40,90%,54%,0.22)",
                  items: [
                    "Role hierarchy: super_admin → ops → manager → analyst → viewer → guest, inheriting downward",
                    "SCIM 2.0 available for enterprise identity lifecycle management",
                    "Azure AD SSO available for enterprise single sign-on",
                    "ALLOY_INTERNAL_TOKEN restricted to server-side; never in client bundles",
                    "Cross-org requests return 404 (not 403) to prevent information leakage",
                    "Experimental features behind server-side feature flags, not client-toggleable",
                  ],
                },
                {
                  icon: Calendar,
                  label: "5 · Compliance Roadmap",
                  href: "#compliance",
                  color: "hsl(192,72%,48%)",
                  colorMuted: "hsla(192,72%,48%,0.07)",
                  colorBorder: "hsla(192,72%,48%,0.20)",
                  items: [
                    "SOC 2 Type II: not yet certified. Targeted 6–9 months post-funding close",
                    "Penetration test: not yet conducted. Scheduled pre-production launch",
                    "GDPR: not yet formally assessed. Pre-EU customer acquisition",
                    "HIPAA: not currently targeted (only if healthcare vertical pursued)",
                    "FedRAMP: not currently targeted (only if federal vertical pursued)",
                    "ISO 27001: aligned architecture, not certified",
                  ],
                },
                {
                  icon: AlertTriangle,
                  label: "6 · Incident Response",
                  href: "/legal/security-disclosure",
                  color: "hsl(0,62%,52%)",
                  colorMuted: "hsla(0,62%,52%,0.07)",
                  colorBorder: "hsla(0,62%,52%,0.22)",
                  items: [
                    "Disclosure contact: security@szlholdings.com",
                    "Acknowledge within 24 hours; patch within 48–72 hours for critical issues",
                    "Rollback capability: previous deployment versions available via Replit for rapid rollback",
                    "Incident logging: structured Pino logs with correlation IDs on every incident",
                    "No SLA commitments offered without a signed enterprise contract",
                  ],
                },
              ].map((pillar, i) => {
                const Icon = pillar.icon;
                return (
                  <m.div
                    key={pillar.label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.38, delay: (i % 3) * 0.06 }}
                    className="szl-card"
                    style={{ borderRadius: "0.875rem", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: pillar.colorMuted, border: `1px solid ${pillar.colorBorder}`, borderRadius: "0.375rem", flexShrink: 0 }}>
                        <Icon size={15} color={pillar.color} />
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: pillar.color }}>{pillar.label}</span>
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {pillar.items.map((item) => (
                        <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                          <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: pillar.color, flexShrink: 0, marginTop: "8px", opacity: 0.85 }} />
                          <span style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,62%)" }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={pillar.href}
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", fontWeight: 600, color: pillar.color, textDecoration: "none", marginTop: "auto", paddingTop: "0.5rem" }}
                    >
                      Verify in detail <ArrowRight size={11} />
                    </Link>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Known Gaps (proactive disclosure) */}
        <section id="known-gaps" style={{ padding: "var(--space-section-md) 0", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <AlertTriangle size={14} color="hsl(40,90%,54%)" />
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(40,90%,54%)" }}>Known gaps · proactive disclosure</p>
              </div>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "34ch", marginBottom: "0.75rem" }}>
                The gaps we know about, with current mitigation.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.68, color: "hsl(214,7%,58%)", maxWidth: "60ch", marginBottom: "2.5rem" }}>
                Disclosing known gaps with mitigation plans is more credible than pretending they don't exist. Each row below names the gap, the control we currently rely on, and the planned remediation.
              </p>
            </m.div>
            <div style={{ borderRadius: "0.875rem", overflow: "hidden", border: "1px solid var(--color-szl-border)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(12rem,1.2fr) minmax(14rem,1.5fr) minmax(10rem,1fr)", padding: "0.875rem 1.25rem", background: "hsla(0,0%,100%,0.025)", borderBottom: "1px solid var(--color-szl-border)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(214,7%,52%)" }}>Gap</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(214,7%,52%)" }}>Current mitigation</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(214,7%,52%)" }}>Roadmap</span>
              </div>
              {[
                { gap: "Immutable log sink", mitigation: "Pino structured logs with correlation IDs; no external tamper-proof sink yet.", roadmap: "External logging service (post-funding)" },
                { gap: "ALLOY_INTERNAL_TOKEN rotation", mitigation: "Static token managed in Replit Secrets, server-side only.", roadmap: "Implement rotation policy post-funding" },
                { gap: "Database query timeout enforcement", mitigation: "Not yet enforced at the database statement level.", roadmap: "Engineering backlog" },
                { gap: "AI provider circuit breakers", mitigation: "Multi-provider fallback exists across OpenAI, Anthropic, and Gemini.", roadmap: "Circuit breaker pattern on engineering backlog" },
              ].map((row, i, arr) => (
                <div
                  key={row.gap}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(12rem,1.2fr) minmax(14rem,1.5fr) minmax(10rem,1fr)",
                    padding: "1rem 1.25rem",
                    borderBottom: i < arr.length - 1 ? "1px solid var(--color-szl-border)" : "none",
                    gap: "1rem",
                    alignItems: "start",
                  }}
                >
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,82%)" }}>{row.gap}</span>
                  <span style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,60%)" }}>{row.mitigation}</span>
                  <span style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,60%)" }}>{row.roadmap}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: "0.75rem", color: "hsl(214,7%,42%)", marginTop: "1rem" }}>
              Source: <code style={{ fontFamily: "var(--font-mono)", color: "hsl(214,7%,52%)" }}>ops/security/threat-model-summary.md</code>. Last reviewed April 2026.
            </p>
          </div>
        </section>

        {/* Legal & policy documents */}
        <section id="legal" style={{ padding: "var(--space-section-md) 0", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Legal & policy documents</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "32ch", marginBottom: "0.75rem" }}>
                Legal documents, next to the technical controls.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.68, color: "hsl(214,7%,58%)", maxWidth: "56ch", marginBottom: "3rem" }}>
                Compliance reviewers expect the legal documents to live alongside the security and governance controls — not buried in a footer. Privacy, terms, acceptable use, cookies, security disclosure, and accessibility, all from one place.
              </p>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {LEGAL_PAGES.map((page, i) => {
                const Icon = page.icon;
                return (
                  <m.div
                    key={page.href}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.05 }}
                  >
                    <Link href={page.href} style={{ display: "block", textDecoration: "none" }}>
                      <div className="szl-card" style={{ borderRadius: "0.75rem", padding: "1.25rem", height: "100%", display: "flex", flexDirection: "column", gap: "0.75rem", transition: "border-color 0.18s ease, background 0.18s ease", cursor: "pointer" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(145,62%,40%,0.32)"; (e.currentTarget as HTMLElement).style.background = "hsla(145,62%,40%,0.04)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = ""; (e.currentTarget as HTMLElement).style.background = ""; }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                            <div style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(145,62%,40%,0.07)", border: "1px solid hsla(145,62%,40%,0.20)", borderRadius: "0.375rem" }}>
                              <Icon size={14} color="hsl(145,62%,46%)" />
                            </div>
                            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,86%)" }}>{page.label}</span>
                          </div>
                          <ArrowRight size={13} color="hsl(214,7%,42%)" />
                        </div>
                        <p style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "hsl(214,7%,58%)" }}>{page.description}</p>
                      </div>
                    </Link>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Encryption Standards */}
        <section style={{ padding: "var(--space-section-md) 0", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Encryption & data protection</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "32ch", marginBottom: "0.75rem" }}>
                Concrete standards, not vague promises.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.68, color: "hsl(214,7%,58%)", maxWidth: "52ch", marginBottom: "3rem" }}>
                Every data path in the platform has a defined encryption standard. No implicit defaults.
              </p>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
              {[
                {
                  icon: Lock,
                  label: "Data in Transit",
                  standard: "TLS 1.3",
                  detail: "Enforced on all public-facing surfaces, API endpoints, WebSocket connections, and inter-service calls. No downgrade to TLS 1.2 in production.",
                  color: "hsl(145,62%,46%)",
                  colorMuted: "hsla(145,62%,40%,0.07)",
                  colorBorder: "hsla(145,62%,40%,0.20)",
                },
                {
                  icon: Database,
                  label: "Data at Rest",
                  standard: "AES-256-GCM",
                  detail: "PostgreSQL encryption at rest (managed deployment). Sensitive fields encrypted at the application layer before storage. No plaintext PII in logs.",
                  color: "hsl(210,80%,60%)",
                  colorMuted: "hsla(210,80%,60%,0.07)",
                  colorBorder: "hsla(210,80%,60%,0.20)",
                },
                {
                  icon: Key,
                  label: "Credential Management",
                  standard: "Env-injected secrets",
                  detail: "All secrets managed as environment variables in Replit Secrets — encrypted, server-side only, never in client bundles. Field-level encryption via FIELD_ENCRYPTION_KEY. No credentials in source control, logs, or build artifacts.",
                  color: "hsl(40,90%,54%)",
                  colorMuted: "hsla(40,90%,54%,0.07)",
                  colorBorder: "hsla(40,90%,54%,0.22)",
                },
                {
                  icon: GitBranch,
                  label: "Integrity & Audit",
                  standard: "SHA-256 hashing",
                  detail: "Every decision receipt, exported document, and audit log entry carries a SHA-256 content hash. Immutable append-only audit trail across all platform actions.",
                  color: "hsl(258,55%,68%)",
                  colorMuted: "hsla(258,55%,68%,0.07)",
                  colorBorder: "hsla(258,55%,68%,0.20)",
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <m.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.38, delay: i * 0.07 }}
                    className="szl-card"
                    style={{ borderRadius: "0.875rem", padding: "1.5rem" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
                      <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: item.colorMuted, border: `1px solid ${item.colorBorder}`, borderRadius: "0.375rem", flexShrink: 0 }}>
                        <Icon size={15} color={item.color} />
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: item.color }}>{item.label}</span>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 700, color: "hsl(38,8%,88%)", marginBottom: "0.5rem", letterSpacing: "-0.01em" }}>{item.standard}</div>
                    <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,54%)" }}>{item.detail}</p>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Compliance Roadmap */}
        <section style={{ padding: "var(--space-section-md) 0", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Compliance roadmap</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "32ch", marginBottom: "0.75rem" }}>
                Where we are. Where we're going.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.68, color: "hsl(214,7%,58%)", maxWidth: "56ch", marginBottom: "3rem" }}>
                We don't claim certifications we don't hold. Here is the current compliance posture and the dated roadmap toward enterprise certification targets.
              </p>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              {/* Current posture */}
              <m.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38 }} className="szl-card" style={{ borderRadius: "0.875rem", padding: "1.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(145,62%,40%,0.08)", border: "1px solid hsla(145,62%,40%,0.20)", borderRadius: "0.375rem" }}>
                    <ShieldCheck size={15} color="hsl(145,62%,46%)" />
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(145,62%,46%)" }}>Current Posture</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {[
                    "TLS 1.3 enforced platform-wide",
                    "AES-256-GCM encryption at rest",
                    "Six-tier RBAC enforced server-side",
                    "Immutable audit trail on all platform actions",
                    "SHA-256 integrity hashing on all exports",
                    "Automated dependency vulnerability scanning (blocks on high/critical)",
                    "Secret scanning in CI pipeline",
                    "Multi-tenant data isolation at DB + middleware layer",
                  ].map((item) => (
                    <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                      <CheckSquare size={13} color="hsl(145,62%,46%)" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <span style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "hsl(214,7%,66%)" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </m.div>
              {/* Roadmap */}
              <m.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: 0.07 }} className="szl-card" style={{ borderRadius: "0.875rem", padding: "1.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(40,90%,54%,0.08)", border: "1px solid hsla(40,90%,54%,0.22)", borderRadius: "0.375rem" }}>
                    <Calendar size={15} color="hsl(40,90%,54%)" />
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(40,90%,54%)" }}>Certification Roadmap</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {[
                    { milestone: "SOC 2 Type I readiness audit", target: "Q3 2026", status: "Planned", color: "hsl(40,90%,54%)" },
                    { milestone: "SOC 2 Type II certification", target: "Q1–Q2 2027", status: "Target", color: "hsl(40,90%,54%)" },
                    { milestone: "Redis session store (scalability pre-req)", target: "Revenue activation phase", status: "Planned", color: "hsl(210,80%,60%)" },
                    { milestone: "External uptime monitoring", target: "Pre-commercial launch", status: "Planned", color: "hsl(210,80%,60%)" },
                    { milestone: "FedRAMP readiness assessment (Aegis)", target: "18–24 months post-revenue", status: "Roadmap", color: "hsl(258,55%,68%)" },
                    { milestone: "ISO 27001 scoping", target: "Post Series A", status: "Roadmap", color: "hsl(258,55%,68%)" },
                  ].map((row) => (
                    <div key={row.milestone} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", paddingBottom: "0.875rem", borderBottom: "1px solid var(--color-szl-border)" }}>
                      <div>
                        <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: "hsl(38,8%,80%)", marginBottom: "0.2rem" }}>{row.milestone}</p>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "hsl(214,7%,48%)" }}>{row.target}</p>
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: row.color, background: row.color + "14", border: `1px solid ${row.color}30`, borderRadius: "99px", padding: "0.2rem 0.6rem", whiteSpace: "nowrap", flexShrink: 0 }}>{row.status}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: "0.75rem", lineHeight: 1.55, color: "hsl(214,7%,42%)", marginTop: "1rem" }}>
                  SZL does not currently hold SOC 2 or ISO 27001 certification. This roadmap reflects the planned certification path. Gap register maintained at <code style={{ fontFamily: "var(--font-mono)", color: "hsl(214,7%,52%)" }}>docs/known-gaps.md</code>.
                </p>
              </m.div>
            </div>
          </div>
        </section>

        {/* Open-Source Governance Primitives */}
        <section style={{ padding: "var(--space-section-md) 0", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Open-source governance</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "34ch", marginBottom: "0.75rem" }}>
                Governance primitives are public. Audit what you trust.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.68, color: "hsl(214,7%,58%)", maxWidth: "56ch", marginBottom: "3rem" }}>
                The core governance architecture — Proof Chain, Covenant Policy, Outcome Graph, and Alloy's approval gate — is published on GitHub. Technical buyers can inspect the implementation before committing to a diligence conversation.
              </p>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {[
                {
                  name: "Proof Chain",
                  slug: "proof-chain",
                  description: "Immutable decision lineage. Every AI recommendation carries source attribution, model ID, confidence score, and SHA-256 content hash — before any human action is taken.",
                  tags: ["audit", "lineage", "attribution"],
                  href: "https://github.com/szl-holdings/proof-chain",
                },
                {
                  name: "Covenant Policy Engine",
                  slug: "covenant-policy",
                  description: "Declarative governance rules that gate every Alloy action. Policies are version-controlled, audited on change, and enforced at the workflow layer — not just the UI.",
                  tags: ["policy", "governance", "workflow"],
                  href: "https://github.com/szl-holdings/covenant-policy",
                },
                {
                  name: "Outcome Graph",
                  slug: "outcome-graph",
                  description: "Tracks predicted versus actual outcomes for every AI-influenced decision. Variance is quantified, logged, and surfaced for compliance and model accountability.",
                  tags: ["outcomes", "accountability", "variance"],
                  href: "https://github.com/szl-holdings/outcome-graph",
                },
                {
                  name: "Alloy Approval Gate",
                  slug: "alloy-approval",
                  description: "Human-in-the-loop enforcement at the execution fabric level. Consequential actions cannot bypass approval — enforced in code, not UI convention.",
                  tags: ["hitl", "approvals", "enforcement"],
                  href: "https://github.com/szl-holdings/alloy-approval",
                },
              ].map((lib, i) => (
                <m.div
                  key={lib.slug}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.38, delay: i * 0.07 }}
                >
                  <a
                    href={lib.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "block", textDecoration: "none" }}
                  >
                    <div
                      className="szl-card"
                      style={{ borderRadius: "0.875rem", padding: "1.5rem", height: "100%", transition: "border-color 0.18s ease", cursor: "pointer" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(258,55%,68%,0.35)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = ""; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                          <div style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(258,55%,68%,0.08)", border: "1px solid hsla(258,55%,68%,0.20)", borderRadius: "0.375rem" }}>
                            <Github size={14} color="hsl(258,55%,68%)" />
                          </div>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(258,55%,68%)" }}>szl-holdings/{lib.slug}</span>
                        </div>
                        <ExternalLink size={13} color="hsl(214,7%,42%)" />
                      </div>
                      <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "hsl(38,8%,85%)", marginBottom: "0.625rem", lineHeight: 1.4 }}>{lib.name}</p>
                      <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,54%)", marginBottom: "1rem" }}>{lib.description}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                        {lib.tags.map((tag) => (
                          <span key={tag} style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.08em", color: "hsl(214,7%,48%)", background: "hsla(214,12%,12%,0.70)", border: "1px solid var(--color-szl-border)", borderRadius: "99px", padding: "0.175rem 0.5rem" }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </a>
                </m.div>
              ))}
            </div>
            <m.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.3 }} style={{ marginTop: "1.5rem" }}>
              <a
                href="https://github.com/szl-holdings"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", fontWeight: 600, color: "hsl(258,55%,68%)", textDecoration: "none", opacity: 0.9, transition: "opacity 0.15s ease" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "0.9"; }}
              >
                <Github size={14} />
                View all SZL open-source on GitHub
                <ExternalLink size={11} />
              </a>
            </m.div>
          </div>
        </section>

        {/* Decision Receipt Export */}
        <section style={{ padding: "var(--space-section-md) 0", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <div className="szl-card" style={{ borderRadius: "1rem", padding: "clamp(2rem,4vw,3rem)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2rem", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
                      <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(210,80%,60%,0.08)", border: "1px solid hsla(210,80%,60%,0.20)", borderRadius: "0.4375rem" }}>
                        <FileOutput size={15} color="hsl(210,80%,60%)" />
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(210,80%,60%)" }}>Decision Receipt Export</span>
                    </div>
                    <h2 style={{ fontSize: "clamp(1.375rem,2.5vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.22, marginBottom: "0.875rem", maxWidth: "38ch" }}>
                      Every AI decision is exportable proof — for your compliance team, your auditors, and your board.
                    </h2>
                    <p style={{ fontSize: "0.9375rem", lineHeight: 1.68, color: "hsl(214,7%,58%)", maxWidth: "54ch", marginBottom: "1.5rem" }}>
                      Decision receipts capture the full lineage of every consequential action: signal source, model attribution, confidence score, approval chain, and SHA-256 integrity hash. Export as PDF for LP reporting, JSON for SIEM integration, or structured data for GRC frameworks.
                    </p>
                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem 0", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {[
                        "PDF export — LP reporting, board packs, regulatory inquiry",
                        "JSON export — SIEM, GRC, and compliance toolchain integration",
                        "SHA-256 hash on every receipt — tamper-evident by design",
                        "Full Proof Chain included — signal → recommendation → approval → execution → outcome",
                      ].map((item) => (
                        <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                          <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "hsl(210,80%,60%)", flexShrink: 0, marginTop: "8px" }} />
                          <span style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "hsl(214,7%,60%)" }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "flex-end" }}>
                    <Link href="/trust/exports" className="szl-btn-primary">
                      View export model <ArrowRight size={14} />
                    </Link>
                    <Link href="/demos" className="szl-btn-secondary">
                      See live demo
                    </Link>
                  </div>
                </div>
              </div>
            </m.div>
          </div>
        </section>

        {/* Architecture CTA */}
        <section style={{ padding: "var(--space-section-md) 0", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <div className="szl-card" style={{ borderRadius: "1rem", padding: "clamp(2rem,4vw,3rem)", display: "grid", gridTemplateColumns: "1fr auto", gap: "2rem", alignItems: "center" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-lyte-light)", marginBottom: "0.875rem" }}>System Architecture</p>
                  <h2 style={{ fontSize: "clamp(1.375rem,2.5vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.22, marginBottom: "0.875rem", maxWidth: "32ch" }}>
                    Why this architecture is hard to copy — and why that matters.
                  </h2>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.68, color: "hsl(214,7%,58%)", maxWidth: "50ch" }}>
                    The standalone architecture page explains every layer of Lyte + Alloy — Lyte as command layer,
                    Alloy as action spine, pack-specific twins, Proof Chain, external intelligence, the governance
                    API, and the governed inference layer — in terms of business value, trust, and defensibility.
                  </p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <Link href="/architecture" className="szl-btn-primary">
                    View architecture <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </m.div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{ padding: "var(--space-section-sm) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              <Link href="/contact" className="szl-btn-primary">
                Request a diligence package <ArrowRight size={14} />
              </Link>
              <Link href="/investor-relations" className="szl-btn-ghost">
                Investor relations
              </Link>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
