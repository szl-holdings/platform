import { useState } from "react";
import { m } from "framer-motion";
import { Shield, Lock, Eye, Activity, Database, Server, CheckCircle, FileText, ArrowRight, ExternalLink, BarChart2, GitBranch, Code2, FileDown } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useCapabilityManifest } from "@/hooks/useCapabilityManifest";

const TRUST_SOLUTION_BRIEFS: Array<{ slug: string; product: string; label: string; href: string }> = [
  { slug: "lyte", product: "Lyte (Business Observability)", label: "Lyte — Decision Intelligence", href: "/briefs/lyte-solution-brief.pdf" },
  { slug: "aegis", product: "Aegis (Defense & Intelligence)", label: "Aegis — Unified Defense", href: "/briefs/aegis-solution-brief.pdf" },
  { slug: "vessels", product: "Vessels (Maritime Intelligence)", label: "Vessels — Maritime Intelligence", href: "/briefs/vessels-solution-brief.pdf" },
  { slug: "terra", product: "Terra (Real Estate Intelligence)", label: "Terra — Real Estate Intelligence", href: "/briefs/terra-solution-brief.pdf" },
  { slug: "carlota-jo", product: "Carlota Jo (Private Advisory)", label: "Carlota Jo — Private Advisory", href: "/briefs/carlota-jo-solution-brief.pdf" },
];


const sections = [
  {
    icon: Database,
    title: "Platform Architecture",
    accent: "hsl(210,55%,52%)",
    content: [
      {
        label: "Observe, Execute, Verify",
        body: "Lyte + Alloy is built around three layers: signal ingestion (observability), action routing (execution), and outcome confirmation (accountability). Each layer has a defined function and a defined interface. Signals surface at the observability layer and compound into decisions at the execution layer.",
      },
      {
        label: "Explicit state",
        body: "Platform state — data freshness, model version, agent confidence — is always visible. Users are never left to assume what they are looking at.",
      },
      {
        label: "Generalized architecture",
        body: "The same architecture extends across verticals — Terra, Vessels, Aegis, Carlota Jo. Common event schema, entity model, and API layer. This is the prerequisite for cross-domain traceability.",
      },
    ],
  },
  {
    icon: Lock,
    title: "Access Control",
    accent: "hsl(152,50%,42%)",
    content: [
      {
        label: "Role-based access",
        body: "Access is granted by explicit role assignment. Roles are scoped to operational need — operators see what they need to act on, not everything in the system.",
      },
      {
        label: "Destructive action gates",
        body: "Actions that are irreversible, affect live systems, or touch sensitive data require multi-step confirmation. This is enforced at the workflow level. Session escalation is logged.",
      },
      {
        label: "Short-lived sessions",
        body: "Session tokens are time-limited. Privileged sessions require explicit re-authentication. Role changes are logged and attributed.",
      },
    ],
  },
  {
    icon: Eye,
    title: "Auditability",
    accent: "hsl(32,65%,52%)",
    content: [
      {
        label: "Immutable event log",
        body: "Every significant action generates an immutable audit event attributed to an actor (person or agent), with role and timestamp recorded.",
      },
      {
        label: "Agent accountability",
        body: "Agent-assisted outputs are logged alongside human actions. When an agent recommendation leads to a confirmed action, the full chain is preserved: signal → recommendation → review → execution.",
      },
      {
        label: "Queryable records",
        body: "Audit records are queryable by actor, action type, affected entity, and time range. The audit trail is an operational tool, not a compliance checkbox.",
      },
    ],
  },
  {
    icon: Activity,
    title: "AI Governance",
    accent: "hsl(246,55%,62%)",
    content: [
      {
        label: "Advisory, not autonomous",
        body: "AI agents in the platform are advisory agents. They analyse, recommend, and synthesise. They do not execute changes or trigger production actions without explicit human confirmation.",
      },
      {
        label: "Explainability first",
        body: "Every AI-generated recommendation includes reasoning. A signal flagged as high-risk shows which factors contributed. No black-box scoring.",
      },
      {
        label: "Model accountability",
        body: "Model versions are logged. Predictions are associated with the model version that produced them. When model behavior changes materially, the platform flags it.",
      },
    ],
  },
  {
    icon: Server,
    title: "Deployment Discipline",
    accent: "hsl(200,65%,46%)",
    content: [
      {
        label: "Infrastructure as code",
        body: "Platform infrastructure configuration is version-controlled and reviewed before application. Deployment pipelines include automated build validation.",
      },
      {
        label: "Secrets management",
        body: "API credentials are managed via environment-variable injection. Credentials are never committed to source control. Credential scope follows least-privilege principles.",
      },
      {
        label: "Environment isolation",
        body: "Production and development environments are isolated. Every release supports rollback. Configuration changes to live systems are gated behind an approval step.",
      },
    ],
  },
  {
    icon: Shield,
    title: "Security Posture",
    accent: "hsl(0,62%,52%)",
    content: [
      {
        label: "Encryption",
        body: "All inter-service communication is encrypted in transit (TLS 1.3). Data at rest is encrypted using AES-256 equivalent standards. Unauthenticated endpoints expose only public information.",
      },
      {
        label: "Vulnerability management",
        body: "Dependency vulnerability scanning is automated and integrated into the build pipeline. Critical vulnerabilities trigger immediate review.",
      },
      {
        label: "Data handling",
        body: "Operational data is used to deliver the service for which it was collected. It is not sold or shared for advertising. Data retention windows are defined and enforced.",
      },
    ],
  },
];

const COMPLIANCE_FRAMEWORKS = [
  { name: "SOC 2 Type II", status: "Roadmapped", color: "#f59e0b", detail: "Not yet initiated. Targeted for Phase 3 post-funding. Controls alignment underway." },
  { name: "ISO 27001", status: "Aligned, not certified", color: "#3b82f6", detail: "Architecture aligned to ISO 27001 controls. No formal certification. Scoping after Series A." },
  { name: "GDPR", status: "Framework active", color: "#10b981", detail: "Privacy framework in place. Data subject rights requests: support@szlholdings.com" },
  { name: "CCPA", status: "Framework active", color: "#10b981", detail: "California resident rights honored within 45 days. Opt-out and deletion workflows operational." },
  { name: "HIPAA", status: "Per contract", color: "#6366f1", detail: "Business Associate Agreement evaluated per enterprise customer need." },
];

const TRUST_SUMMARY = [
  { concern: "AI without oversight", how: "Covenant Policy enforces approval gates — AI cannot execute consequential actions without human confirmation. Enforced at the library layer, not the UI." },
  { concern: "Opaque AI outputs", how: "All recommendations include source citations, model identity, confidence scores, and retrieval provenance via Proof Chain." },
  { concern: "Audit accountability", how: "Every action generates an immutable audit event with actor attribution, role context, and timestamp. Proof Chain is cryptographically verifiable." },
  { concern: "Access control", how: "11-role RBAC with org-scoped tenant isolation. Deny-by-default global auth enforcer on all /api/* routes." },
  { concern: "Multi-tenancy", how: "All queries scoped by org_id. Cross-org access returns 404 to prevent information leakage. AI/RAG retrieval is tenant-isolated at the library layer." },
  { concern: "Data in transit", how: "TLS 1.3 for all connections. WebSocket uses HMAC-signed tickets with 5-minute TTL." },
  { concern: "Secrets management", how: "All credentials injected via environment variables in Replit Secrets — encrypted, server-side only. No secrets in source control. Field-level encryption via FIELD_ENCRYPTION_KEY." },
  { concern: "Compliance posture", how: "GDPR/CCPA privacy frameworks in place. SOC 2 Type II roadmapped post-funding." },
];

const DILIGENCE_BRIEFS = [
  { label: "Technical Evaluator", description: "Architecture, tenancy, integration surface, control plane, and security controls", href: "/trust/diligence/technical", accent: "#3b82f6" },
  { label: "Executive Buyer", description: "Governance model, risk posture, AI oversight, and approval workflows", href: "/trust/diligence/executive", accent: "#8b5cf6" },
  { label: "Security Reviewer", description: "RBAC matrix, data isolation, credential handling, and vulnerability disclosure", href: "/trust/diligence/security", accent: "#10b981" },
  { label: "Investor", description: "Platform defensibility, architecture moat, governance depth, and operational maturity", href: "/trust/diligence/investor", accent: "#f59e0b" },
];

function SolutionBriefDownloadGrid() {
  const { products } = useCapabilityManifest();
  const summaries = new Map(products.map(p => [p.product, p] as const));
  return (
    <div
      style={{
        marginTop: "2.5rem",
        padding: "1.5rem 1.75rem",
        borderRadius: "12px",
        border: "1px solid hsla(0,0%,100%,0.07)",
        background: "hsla(0,0%,100%,0.015)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
        <FileDown size={14} style={{ color: "hsl(38,55%,62%)" }} />
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(38,55%,62%)", margin: 0 }}>
          Solution Brief Downloads
        </p>
      </div>
      <p style={{ fontSize: "13px", color: "hsl(210,5%,55%)", lineHeight: 1.6, marginBottom: "1.25rem", maxWidth: "60ch" }}>
        Per-product PDFs generated directly from the platform capability manifest — capability counts, status mix, top proof points, and open risks. Regenerated on every manifest change so figures stay aligned with the readiness matrix.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "0.75rem" }}>
        {TRUST_SOLUTION_BRIEFS.map(brief => {
          const summary = summaries.get(brief.product);
          return (
            <a
              key={brief.slug}
              href={brief.href}
              download
              data-testid={`download-solution-brief-${brief.slug}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                padding: "0.875rem 1rem",
                borderRadius: "9px",
                background: "hsla(0,0%,100%,0.025)",
                border: "1px solid hsla(0,0%,100%,0.06)",
                textDecoration: "none",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,90%)", margin: 0, marginBottom: "0.2rem" }}>{brief.label}</p>
                <p style={{ fontSize: "11.5px", color: "hsl(210,5%,50%)", margin: 0 }}>
                  {summary
                    ? `${summary.total} capabilities · ${summary.readinessScore}% readiness · PDF`
                    : "PDF"}
                </p>
              </div>
              <FileDown size={14} style={{ color: "hsl(210,5%,46%)", flexShrink: 0 }} />
            </a>
          );
        })}
      </div>
    </div>
  );
}

function DisclosureForm() {
  const [form, setForm] = useState({ name: "", email: "", severity: "medium", description: "" });
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "security_disclosure",
          app: "szl-holdings",
          name: form.name,
          email: form.email,
          message: `[Security Disclosure - ${form.severity.toUpperCase()}]\n\n${form.description}`,
          metadata: { severity: form.severity, source: "trust-center-disclosure-form" },
        }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Submission failed");
      setState("done");
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.625rem 0.875rem",
    background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)",
    borderRadius: "7px", color: "hsl(38,12%,88%)", fontSize: "0.875rem",
    outline: "none", boxSizing: "border-box" as const,
  };

  if (state === "done") {
    return (
      <div style={{
        display: "flex", flexDirection: "column" as const, alignItems: "flex-start",
        padding: "2rem", background: "hsla(152,50%,42%,0.06)", border: "1px solid hsla(152,50%,42%,0.18)",
        borderRadius: "10px", gap: "0.5rem",
      }}>
        <CheckCircle size={20} style={{ color: "#10b981" }} />
        <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,12%,92%)" }}>Report received</div>
        <div style={{ fontSize: "0.875rem", color: "hsl(210,5%,58%)", lineHeight: 1.55 }}>
          We will acknowledge your report within 48 hours.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" as const, gap: "1rem" }}>
      <h3 style={{ fontSize: "0.9375rem", fontWeight: "700", color: "hsl(38,12%,92%)", marginBottom: "0.25rem" }}>Submit a vulnerability report</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
        <div>
          <label htmlFor="tc-name" style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "hsl(210,5%,52%)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.375rem" }}>Name</label>
          <input id="tc-name" style={inputStyle} required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="tc-email" style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "hsl(210,5%,52%)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.375rem" }}>Email</label>
          <input id="tc-email" style={inputStyle} type="email" required value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" />
        </div>
      </div>
      <div>
        <label htmlFor="tc-severity" style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "hsl(210,5%,52%)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.375rem" }}>Severity</label>
        <select
          id="tc-severity"
          aria-label="Severity level"
          style={{ ...inputStyle, appearance: "none" as const, cursor: "pointer" }}
          value={form.severity}
          onChange={(e) => setForm(f => ({ ...f, severity: e.target.value }))}
        >
          <option value="critical">Critical — Immediate risk to user data or systems</option>
          <option value="high">High — Significant security impact</option>
          <option value="medium">Medium — Moderate risk, no immediate exploitation</option>
          <option value="low">Low — Minor risk or hardening recommendation</option>
        </select>
      </div>
      <div>
        <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "hsl(210,5%,52%)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.375rem" }}>Description</label>
        <textarea
          style={{ ...inputStyle, minHeight: "100px", resize: "vertical" as const, fontFamily: "inherit" }}
          required value={form.description}
          onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Describe the vulnerability, how to reproduce it, and potential impact."
        />
      </div>
      {state === "error" && <div style={{ fontSize: "12px", color: "#ef4444" }}>{error}</div>}
      <button
        type="submit"
        disabled={state === "loading"}
        style={{
          padding: "0.625rem 1.125rem", borderRadius: "7px",
          background: "hsla(0,0%,100%,0.06)", border: "1px solid hsla(0,0%,100%,0.12)",
          color: "hsl(38,12%,86%)", fontSize: "0.875rem", fontWeight: 600,
          cursor: state === "loading" ? "not-allowed" : "pointer",
          opacity: state === "loading" ? 0.7 : 1, alignSelf: "flex-start" as const,
        }}
      >
        {state === "loading" ? "Submitting..." : "Submit Report"}
      </button>
      <p style={{ fontSize: "11.5px", color: "hsl(210,5%,57%)", lineHeight: 1.5 }}>
        Prefer email? Send to <a href="mailto:security@stephenl.dev" style={{ color: "hsl(210,55%,65%)", textDecoration: "underline" }}>security@stephenl.dev</a>. PGP key available on request.
      </p>
    </form>
  );
}

export default function TrustCenter() {
  const __pageMeta = usePageMeta({
    title: "Trust — SZL Holdings",
    description: "Security and control are part of the product. Platform architecture, access control, auditability, AI governance, and security posture.",
    canonical: "https://szlholdings.com/trust",
  });

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
        <SiteNav />
        <main id="main-content" role="main">
  
        <section style={{
          paddingTop: "clamp(7rem,12vw,10rem)",
          paddingBottom: "clamp(4rem,7vw,6rem)",
          borderBottom: "1px solid hsla(0,0%,100%,0.05)",
        }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
            >
              <span style={{
                display: "inline-block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "hsl(210,5%,57%)", marginBottom: "1.5rem",
              }}>
                Trust
              </span>
              <h1 style={{
                fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 700, letterSpacing: "-0.025em",
                lineHeight: 1.1, color: "hsl(38,12%,94%)", marginBottom: "1.25rem", maxWidth: "32rem",
              }}>
                Trust is part of the product.
              </h1>
              <p style={{
                fontSize: "1.0625rem", color: "hsl(210,5%,60%)", lineHeight: 1.65, maxWidth: "36rem", marginBottom: "1.5rem",
              }}>
                The enterprise diligence hub for SZL Holdings — security architecture, AI governance, access control, compliance posture, and operational commitments. Start here for procurement reviews.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.75rem" }}>
                <Link href="/trust" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.875rem", fontWeight: 600, color: "hsl(210,55%,58%)", textDecoration: "none" }}>
                  Choose diligence path <ArrowRight size={13} />
                </Link>
                <span style={{ color: "hsl(210,5%,30%)" }}>·</span>
                <a href="mailto:security@szlholdings.com" style={{ fontSize: "0.875rem", color: "hsl(210,5%,48%)", textDecoration: "none" }}>security@szlholdings.com</a>
                <span style={{ color: "hsl(210,5%,30%)" }}>·</span>
                <span style={{ fontSize: "0.875rem", color: "hsl(210,5%,36%)" }}>Last reviewed: 2026-04-16</span>
              </div>
            </m.div>
          </div>
        </section>
  
        {/* Trust Summary */}
        <section style={{
          paddingTop: "clamp(3.5rem,6vw,5rem)", paddingBottom: "clamp(3rem,5vw,4rem)",
          borderBottom: "1px solid hsla(0,0%,100%,0.05)",
          background: "hsla(0,0%,100%,0.012)",
        }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "hsl(210,5%,40%)", marginBottom: "1.5rem" }}>Trust Summary</p>
            </m.div>
            <div style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid hsla(0,0%,100%,0.06)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(10rem,18rem) 1fr", padding: "0.75rem 1.25rem", background: "hsla(0,0%,100%,0.03)", borderBottom: "1px solid hsla(0,0%,100%,0.06)" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "hsl(210,5%,40%)" }}>Concern</span>
                <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "hsl(210,5%,40%)" }}>How it is addressed</span>
              </div>
              {TRUST_SUMMARY.map((row, i) => (
                <m.div
                  key={row.concern}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(10rem,18rem) 1fr",
                    padding: "0.875rem 1.25rem",
                    borderBottom: i < TRUST_SUMMARY.length - 1 ? "1px solid hsla(0,0%,100%,0.04)" : "none",
                    gap: "1.5rem",
                    alignItems: "start",
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,80%)" }}>{row.concern}</span>
                  <span style={{ fontSize: "13px", lineHeight: 1.62, color: "hsl(210,5%,56%)" }}>{row.how}</span>
                </m.div>
              ))}
            </div>
          </div>
        </section>
  
        {/* Enterprise Diligence Packet */}
        <section style={{
          paddingTop: "clamp(3.5rem,6vw,5rem)", paddingBottom: "clamp(3rem,5vw,4rem)",
          borderBottom: "1px solid hsla(0,0%,100%,0.05)",
        }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{ marginBottom: "2rem" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
                <FileText size={14} style={{ color: "hsl(210,55%,58%)" }} />
                <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "hsl(210,55%,58%)" }}>Enterprise Diligence Packet</p>
              </div>
              <h2 style={{ fontSize: "clamp(1.375rem,2.5vw,1.75rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "hsl(38,12%,92%)", marginBottom: "0.875rem", maxWidth: "32rem" }}>
                Audience-specific diligence briefs
              </h2>
              <p style={{ fontSize: "0.9375rem", color: "hsl(210,5%,56%)", lineHeight: 1.65, maxWidth: "52ch" }}>
                Each brief packages the relevant architecture, security, governance, and compliance content for a specific reviewer type. Select the path that matches your role in the evaluation.
              </p>
            </m.div>
            <div className="grid sm:grid-cols-2 gap-3" style={{ marginBottom: "1.5rem" }}>
              {DILIGENCE_BRIEFS.map((brief, i) => (
                <m.div
                  key={brief.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={brief.href}
                    style={{
                      display: "block",
                      padding: "1.25rem 1.5rem",
                      borderRadius: "10px",
                      background: "hsla(0,0%,100%,0.02)",
                      border: `1px solid hsla(0,0%,100%,0.07)`,
                      borderTop: `2px solid ${brief.accent}`,
                      textDecoration: "none",
                      transition: "background 0.18s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "hsl(38,12%,90%)", letterSpacing: "-0.01em" }}>{brief.label}</span>
                      <ArrowRight size={13} style={{ color: brief.accent }} />
                    </div>
                    <p style={{ fontSize: "12.5px", lineHeight: 1.6, color: "hsl(210,5%,52%)" }}>{brief.description}</p>
                  </Link>
                </m.div>
              ))}
            </div>
            <m.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              style={{ fontSize: "12px", color: "hsl(210,5%,38%)" }}
            >
              Full technical diligence packet available on request — contact{" "}
              <a href="mailto:security@szlholdings.com" style={{ color: "hsl(210,55%,52%)", textDecoration: "none" }}>security@szlholdings.com</a>.
            </m.p>
  
            <SolutionBriefDownloadGrid />
          </div>
        </section>
  
        <section style={{ paddingTop: "clamp(4rem,7vw,6rem)", paddingBottom: "clamp(4rem,7vw,6rem)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
            <div style={{ display: "grid", gap: "clamp(3rem,6vw,5rem)" }}>
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <m.div
                    key={section.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.58, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", marginBottom: "2rem" }}>
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "8px",
                        background: `${section.accent}14`, border: `1px solid ${section.accent}28`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Icon size={16} style={{ color: section.accent }} />
                      </div>
                      <h2 style={{
                        fontSize: "1.1875rem", fontWeight: 700, letterSpacing: "-0.015em",
                        color: "hsl(38,12%,94%)", paddingTop: "8px",
                      }}>{section.title}</h2>
                    </div>
  
                    <div style={{
                      background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)",
                      borderRadius: "12px", overflow: "hidden",
                    }}>
                      {section.content.map((item, i) => (
                        <div
                          key={item.label}
                          style={{
                            padding: "1.375rem 1.75rem",
                            borderBottom: i < section.content.length - 1 ? "1px solid hsla(0,0%,100%,0.04)" : "none",
                            display: "grid", gridTemplateColumns: "10rem 1fr", gap: "2rem", alignItems: "start",
                          }}
                          className="sm:grid block"
                        >
                          <p style={{
                            fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em",
                            textTransform: "uppercase", color: section.accent, paddingTop: "2px", flexShrink: 0,
                          }}>{item.label}</p>
                          <p style={{ fontSize: "0.9375rem", color: "hsl(210,5%,62%)", lineHeight: 1.65 }}>{item.body}</p>
                        </div>
                      ))}
                    </div>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>
  
        <section style={{
          paddingTop: "clamp(4rem,7vw,6rem)", paddingBottom: "clamp(4rem,7vw,6rem)",
          background: "hsla(0,0%,100%,0.015)", borderTop: "1px solid hsla(0,0%,100%,0.05)",
          borderBottom: "1px solid hsla(0,0%,100%,0.05)",
        }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
            <m.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "1.75rem" }}
            >
              Compliance Frameworks
            </m.p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {COMPLIANCE_FRAMEWORKS.map((fw, i) => (
                <m.div
                  key={fw.name}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    padding: "1.125rem 1.375rem", borderRadius: "8px",
                    background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "hsl(38,12%,88%)", letterSpacing: "-0.005em" }}>{fw.name}</span>
                    <span style={{
                      fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
                      padding: "2px 8px", borderRadius: "4px", color: fw.color,
                      background: `${fw.color}18`, border: `1px solid ${fw.color}30`,
                    }}>{fw.status}</span>
                  </div>
                  <p style={{ fontSize: "12px", lineHeight: 1.6, color: "hsl(210,5%,50%)" }}>{fw.detail}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>
  
        {/* Legal & Compliance Pages */}
        <section style={{
          paddingTop: "clamp(3.5rem,6vw,5rem)", paddingBottom: "clamp(3rem,5vw,4rem)",
          borderTop: "1px solid hsla(0,0%,100%,0.05)", borderBottom: "1px solid hsla(0,0%,100%,0.05)",
          background: "hsla(0,0%,100%,0.012)",
        }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{ marginBottom: "2rem" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
                <FileText size={14} style={{ color: "hsl(210,55%,58%)" }} />
                <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "hsl(210,55%,58%)" }}>Legal & Compliance</p>
              </div>
              <h2 style={{ fontSize: "clamp(1.375rem,2.5vw,1.75rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "hsl(38,12%,92%)", marginBottom: "0.875rem", maxWidth: "32rem" }}>
                Legal documentation for compliance reviewers
              </h2>
              <p style={{ fontSize: "0.9375rem", color: "hsl(210,5%,56%)", lineHeight: 1.65, maxWidth: "52ch" }}>
                All legal agreements, privacy policies, and compliance documents in one place. For enterprise procurement teams and legal reviewers.
              </p>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.75rem" }}>
              {[
                { label: "Privacy Policy", desc: "Data collection, processing, and user rights under GDPR/CCPA", href: "/legal/privacy", accent: "#3b82f6" },
                { label: "Terms of Service", desc: "Platform usage terms, acceptable conduct, and service boundaries", href: "/legal/terms", accent: "#8b5cf6" },
                { label: "Cookie Policy", desc: "Cookie types, consent management, and opt-out instructions", href: "/legal/cookies", accent: "#10b981" },
                { label: "Acceptable Use Policy", desc: "Permitted use cases, prohibited activity, and enforcement", href: "/legal/acceptable-use", accent: "#f59e0b" },
                { label: "Security Disclosure", desc: "Responsible disclosure program, scope, and contact", href: "/legal/security-disclosure", accent: "#ef4444" },
                { label: "Data Processing Agreement", desc: "DPA template for enterprise customers. Request via security@szlholdings.com", href: "mailto:security@szlholdings.com?subject=DPA%20Request", accent: "#6366f1" },
              ].map((doc, i) => (
                <m.div
                  key={doc.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                >
                  <a
                    href={doc.href}
                    style={{
                      display: "block",
                      padding: "1.125rem 1.375rem",
                      borderRadius: "8px",
                      background: "hsla(0,0%,100%,0.02)",
                      border: `1px solid hsla(0,0%,100%,0.07)`,
                      borderLeft: `3px solid ${doc.accent}`,
                      textDecoration: "none",
                      transition: "background 0.18s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "hsl(38,12%,90%)", letterSpacing: "-0.01em" }}>{doc.label}</span>
                      <ExternalLink size={11} style={{ color: doc.accent, opacity: 0.7 }} />
                    </div>
                    <p style={{ fontSize: "12px", lineHeight: 1.6, color: "hsl(210,5%,52%)" }}>{doc.desc}</p>
                  </a>
                </m.div>
              ))}
            </div>
          </div>
        </section>
  
        <section style={{ paddingTop: "clamp(4rem,7vw,6rem)", paddingBottom: "clamp(4rem,7vw,6rem)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
              <div>
                <m.p
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "1.25rem" }}
                >
                  Reliability Principles
                </m.p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {[
                    { title: "Graceful degradation", body: "When external data sources are unavailable, the platform indicates the gap explicitly rather than silently serving stale or incomplete data." },
                    { title: "Transparent simulation", body: "Demo and simulation modes are explicitly labelled. Users always know whether they are looking at live data or simulated state." },
                    { title: "Performance as reliability", body: "Dashboard load times, query latency, and data freshness are monitored and treated as reliability metrics." },
                    { title: "Operator-built", body: "The platform is built by the people who operate it. There is no gap between the engineering team and the operating responsibility." },
                  ].map((item, i) => (
                    <m.div
                      key={item.title}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        padding: "1.125rem 1.25rem", borderRadius: "8px",
                        background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)",
                      }}
                    >
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,86%)", marginBottom: "0.35rem" }}>{item.title}</p>
                      <p style={{ fontSize: "12.5px", lineHeight: 1.6, color: "hsl(210,5%,52%)" }}>{item.body}</p>
                    </m.div>
                  ))}
                </div>
              </div>
  
              <div>
                <m.p
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "1.25rem" }}
                >
                  Responsible Disclosure
                </m.p>
                <DisclosureForm />
              </div>
            </div>
          </div>
        </section>
  
        {/* Proof & Evidence Navigation */}
        <section style={{
          paddingTop: "clamp(3rem,5vw,4rem)", paddingBottom: "clamp(3rem,5vw,4rem)",
          borderTop: "1px solid hsla(0,0%,100%,0.05)",
          background: "hsla(0,0%,100%,0.01)",
        }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "hsl(210,5%,38%)", marginBottom: "1.25rem" }}>
                Proof &amp; Evidence
              </p>
            </m.div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                {
                  label: "Product Readiness Matrix",
                  description: "Every capability status derived from the platform manifest — no hand-edited claims.",
                  href: "/product-readiness",
                  Icon: BarChart2,
                  accent: "#3b82f6",
                },
                {
                  label: "Live Status",
                  description: "Uptime probe, database health, security posture, and SOC 2 progress — live data.",
                  href: "/trust-center/status",
                  Icon: Activity,
                  accent: "#10b981",
                },
                {
                  label: "Technical Proof",
                  description: "Architecture layers, real API shapes, and audit-trail record samples. Citation-linked.",
                  href: "/technical-proof",
                  Icon: Code2,
                  accent: "#8b5cf6",
                },
                {
                  label: "Changelog",
                  description: "Material capabilities shipped, derived from real git commit history.",
                  href: "/changelog-highlights",
                  Icon: GitBranch,
                  accent: "#f59e0b",
                },
              ].map((item, i) => (
                <m.div
                  key={item.label}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                >
                  <Link
                    href={item.href}
                    style={{
                      display: "flex", flexDirection: "column" as const, gap: "0.5rem",
                      padding: "1.125rem 1.375rem",
                      borderRadius: "10px",
                      background: "hsla(0,0%,100%,0.02)",
                      border: "1px solid hsla(0,0%,100%,0.06)",
                      borderTop: `2px solid ${item.accent}`,
                      textDecoration: "none",
                      transition: "background 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <item.Icon size={14} style={{ color: item.accent }} />
                      <ArrowRight size={12} style={{ color: "hsl(210,5%,38%)" }} />
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "hsl(38,12%,88%)" }}>{item.label}</span>
                    <span style={{ fontSize: "12px", lineHeight: 1.55, color: "hsl(210,5%,48%)" }}>{item.description}</span>
                  </Link>
                </m.div>
              ))}
            </div>
          </div>
        </section>
  
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
