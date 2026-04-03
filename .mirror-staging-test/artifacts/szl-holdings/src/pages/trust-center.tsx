import { useState } from "react";
import { m } from "framer-motion";
import { Shield, Lock, Eye, Activity, Database, Server, CheckCircle } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";


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
        body: "AI-assisted outputs are logged alongside human actions. When an agent recommendation leads to a confirmed action, the full chain is preserved: signal → recommendation → review → execution.",
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
  { name: "SOC 2 Type II", status: "In Progress", color: "#f59e0b", detail: "Audit preparation underway. Expected Q3 2026." },
  { name: "NIST 800-53", status: "Aligned", color: "#10b981", detail: "Controls mapped and implemented." },
  { name: "GDPR", status: "Compliant", color: "#10b981", detail: "Data processing agreements, DPIAs, and subject access request workflows in place." },
  { name: "ISO 27001", status: "Planned", color: "#3b82f6", detail: "ISMS development in progress. Certification targeted Q1 2027." },
  { name: "CCPA", status: "Compliant", color: "#10b981", detail: "Consumer privacy rights implemented. Opt-out and deletion workflows operational." },
];

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
          <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "hsl(210,5%,52%)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.375rem" }}>Name</label>
          <input style={inputStyle} required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "hsl(210,5%,52%)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.375rem" }}>Email</label>
          <input style={inputStyle} type="email" required value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" />
        </div>
      </div>
      <div>
        <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "hsl(210,5%,52%)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.375rem" }}>Severity</label>
        <select
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
      <p style={{ fontSize: "11.5px", color: "hsl(210,5%,42%)", lineHeight: 1.5 }}>
        Prefer email? Send to <a href="mailto:security@stephenl.dev" style={{ color: "hsl(210,55%,52%)", textDecoration: "none" }}>security@stephenl.dev</a>. PGP key available on request.
      </p>
    </form>
  );
}

export default function TrustCenter() {
  usePageMeta({
    title: "Trust — SZL Holdings",
    description: "Security and control are part of the product. Platform architecture, access control, auditability, AI governance, and security posture.",
    canonical: "https://szlholdings.com/trust",
  });

  return (
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
              textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "1.5rem",
            }}>
              Trust
            </span>
            <h1 style={{
              fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 700, letterSpacing: "-0.025em",
              lineHeight: 1.1, color: "hsl(38,12%,94%)", marginBottom: "1.25rem", maxWidth: "32rem",
            }}>
              Security and control are part of the product.
            </h1>
            <p style={{
              fontSize: "1.0625rem", color: "hsl(210,5%,60%)", lineHeight: 1.65, maxWidth: "36rem",
            }}>
              This page describes the architecture principles, access and control model, AI governance approach, deployment discipline, and security posture built into Lyte + Alloy from the start. Not a compliance checklist — a record of how we build.
            </p>
          </m.div>
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

      </main>
      <SiteFooter />
    </div>
  );
}
