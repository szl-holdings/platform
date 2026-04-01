import { useState } from "react";
import { m } from "framer-motion";
import { Shield, Lock, Eye, Activity, Database, Server, CheckCircle, AlertTriangle, Download, Loader2, FileText, Bug, List, ExternalLink } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

async function downloadPDF(template: string, data: Record<string, unknown>, filename: string): Promise<void> {
  const res = await fetch("/api/documents/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ template, data }),
  });
  if (!res.ok) throw new Error("PDF generation failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const sections = [
  {
    icon: Database,
    title: "Platform Architecture",
    accent: "hsl(210,55%,52%)",
    content: [
      {
        label: "Four-layer model",
        body: "The SZL platform is organised into Observe, Understand, Execute, and Advise layers. Each layer has a defined function and a defined interface contract with adjacent layers. Signals observed at the infrastructure level compound into decisions at the executive level.",
      },
      {
        label: "Shared infrastructure",
        body: "Every product in the ecosystem shares a common design system, event schema, entity model, and API layer. This is not incidental — it is the prerequisite for cross-domain traceability and compound intelligence.",
      },
      {
        label: "Explicit state",
        body: "Platform state — data freshness, demo mode, model version, agent confidence — is always visible. Users are never left to assume what they are looking at.",
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
        body: "Every SZL application implements role-based access control as a first-class concern. Access is granted by explicit role assignment. Roles are scoped to operational need — executives see strategic summaries; operators see tactical queues; compliance personnel see audit logs.",
      },
      {
        label: "Destructive action gates",
        body: "Actions that are irreversible, affect live systems, or touch sensitive data require a multi-step confirmation. This is enforced at the workflow level, not just the UI level. Session escalation is logged.",
      },
      {
        label: "Short-lived sessions",
        body: "Session tokens are time-limited. Privileged sessions require explicit re-authentication. Role assignment changes are logged and attributed.",
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
        body: "Every significant action generates an immutable audit event — attributed to an actor (person or agent), with role and timestamp recorded. Events cannot be edited or deleted by platform users.",
      },
      {
        label: "Agent accountability",
        body: "AI agent outputs are audit-logged alongside human actions. When an agent recommendation leads to a confirmed action, the full chain is preserved: recommendation → review → approval → execution.",
      },
      {
        label: "Queryable records",
        body: "Audit records are queryable by actor, action type, affected entity, and time range. The audit trail is an operational tool, not a compliance afterthought.",
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
        body: "AI agents in the SZL ecosystem — Helmsman (maritime), Sentinel (security), Beacon (operations) — are advisory agents. They analyse, recommend, and synthesise. They do not execute changes or trigger production actions without explicit human confirmation.",
      },
      {
        label: "Explainability first",
        body: "Every AI-generated recommendation includes reasoning. Risk scores include contributing factors. A vessel flagged as high-risk shows which signals contributed. A security finding shows the CVE chain and MITRE mapping. No black-box scoring.",
      },
      {
        label: "Model accountability",
        body: "Model versions are logged. Predictions are associated with the model version that produced them. Drift is monitored. When model behaviour changes materially, the platform flags it.",
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
        body: "Platform infrastructure configuration is version-controlled and reviewed before application. Deployment pipelines include automated build validation and environment-specific configuration injection.",
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
        body: "All inter-service communication is encrypted in transit (TLS 1.3). Data at rest is encrypted using AES-256 equivalent standards. API endpoints are authenticated — unauthenticated endpoints expose only public information.",
      },
      {
        label: "Vulnerability management",
        body: "Dependency vulnerability scanning is automated and integrated into the build pipeline. Critical vulnerabilities trigger immediate review. Firestorm's adversary emulation capability is used for regular red-team exercises.",
      },
      {
        label: "Data handling",
        body: "Operational data is used to deliver the service for which it was collected. It is not sold or shared for advertising. Data retention windows are defined and enforced. Data is classified at ingestion.",
      },
    ],
  },
];

const COMPLIANCE_FRAMEWORKS = [
  { name: "SOC 2 Type II", status: "In Progress", color: "#f59e0b", detail: "Audit preparation underway. Expected Q3 2026." },
  { name: "NIST 800-53", status: "Aligned", color: "#10b981", detail: "Controls mapped and implemented across all products." },
  { name: "GDPR", status: "Compliant", color: "#10b981", detail: "Data processing agreements, DPIAs, and subject access request workflows in place." },
  { name: "ISO 27001", status: "Planned", color: "#3b82f6", detail: "ISMS development in progress. Certification targeted Q1 2027." },
  { name: "CCPA", status: "Compliant", color: "#10b981", detail: "Consumer privacy rights implemented. Opt-out and deletion workflows operational." },
  { name: "MITRE ATT&CK", status: "Mapped", color: "#10b981", detail: "Aegis Defense maps all detections to ATT&CK framework techniques." },
];

const SLA_COMMITMENTS = [
  { metric: "Platform Uptime", target: "99.9%", current: "99.94%", color: "#10b981" },
  { metric: "API Response (p95)", target: "< 200ms", current: "142ms", color: "#10b981" },
  { metric: "Incident Response", target: "< 4 hours", current: "2.3h avg", color: "#10b981" },
  { metric: "Data Freshness (Signals)", target: "< 5 min", current: "Real-time", color: "#10b981" },
  { metric: "Security Patch SLA", target: "< 48 hours", current: "< 24h avg", color: "#10b981" },
  { metric: "Post-Incident Review", target: "< 5 business days", current: "3.1d avg", color: "#10b981" },
];

const VENDOR_DOCS = [
  { name: "Security Architecture Overview", format: "PDF", available: true },
  { name: "Data Processing Agreement (DPA)", format: "PDF", available: true },
  { name: "Penetration Test Summary", format: "PDF", available: true },
  { name: "Business Continuity Plan", format: "PDF", available: true },
  { name: "AI Governance Policy", format: "PDF", available: true },
  { name: "Subprocessor List", format: "PDF", available: true },
  { name: "Insurance Certificate", format: "PDF", available: false },
  { name: "SOC 2 Report", format: "PDF", available: false },
];

const reliabilityPrinciples = [
  {
    title: "Graceful degradation",
    body: "When external data sources are unavailable, the platform indicates the gap explicitly rather than silently serving stale or incomplete data.",
  },
  {
    title: "Transparent simulation",
    body: "Demo and simulation modes are explicitly labelled. Users always know whether they are looking at live data or simulated state.",
  },
  {
    title: "Performance as reliability",
    body: "Dashboard load times, query latency, and data freshness are monitored and treated as reliability metrics — not vanity metrics.",
  },
  {
    title: "Operator-built",
    body: "The platform is built by the people who operate it. There is no gap between the engineering team and the operating responsibility.",
  },
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
      const res = await fetch(`${BASE}/api/contact`, {
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
    outline: "none", boxSizing: "border-box",
  };

  if (state === "done") {
    return (
      <div style={{
        display: "flex", flexDirection: "column" as const, alignItems: "flex-start", justifyContent: "center",
        padding: "2rem", background: "hsla(152,50%,42%,0.06)", border: "1px solid hsla(152,50%,42%,0.18)",
        borderRadius: "10px", gap: "0.5rem",
      }}>
        <CheckCircle size={20} style={{ color: "#10b981" }} />
        <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,12%,92%)" }}>Report received</div>
        <div style={{ fontSize: "0.875rem", color: "hsl(210,5%,58%)", lineHeight: 1.55 }}>
          Thank you for the disclosure. We will acknowledge your report within 48 hours at the email you provided.
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
          <input
            style={inputStyle} required value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Your name"
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "hsl(210,5%,52%)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.375rem" }}>Email</label>
          <input
            style={inputStyle} type="email" required value={form.email}
            onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="you@example.com"
          />
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
          placeholder="Describe the vulnerability: what you found, how to reproduce it, and the potential impact."
        />
      </div>
      {state === "error" && (
        <div style={{ fontSize: "12px", color: "#ef4444" }}>{error}</div>
      )}
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
        Prefer email? Send directly to <a href="mailto:security@stephenl.dev" style={{ color: "hsl(210,55%,52%)", textDecoration: "none" }}>security@stephenl.dev</a>. PGP key available on request.
      </p>
    </form>
  );
}

export default function TrustCenter() {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const handleDownloadCompliance = async () => {
    setDownloading(true);
    setDownloadError("");
    try {
      await downloadPDF("szl-compliance-summary", {}, "szl-compliance-summary.pdf");
    } catch {
      setDownloadError("PDF generation failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <Navbar />

      {/* Hero */}
      <section
        style={{
          paddingTop: "clamp(7rem,12vw,10rem)",
          paddingBottom: "clamp(4rem,7vw,6rem)",
          background: "hsl(210,12%,5%)",
          borderBottom: "1px solid hsla(0,0%,100%,0.05)",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          >
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 12px",
              borderRadius: "6px",
              background: "hsla(0,0%,100%,0.04)",
              border: "1px solid hsla(0,0%,100%,0.08)",
              color: "hsl(210,5%,52%)",
              fontSize: "11px",
              fontWeight: "500",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "1.5rem",
            }}>
              <CheckCircle size={10} />
              Trust Center
            </span>

            <h1 style={{
              fontSize: "clamp(2rem,4vw,3rem)",
              fontWeight: "700",
              letterSpacing: "-0.025em",
              lineHeight: "1.1",
              color: "hsl(38,12%,94%)",
              marginBottom: "1.25rem",
              maxWidth: "32rem",
            }}>
              Built for organisations where reliability is non-negotiable.
            </h1>

            <p style={{
              fontSize: "1.0625rem",
              color: "hsl(210,5%,60%)",
              lineHeight: "1.65",
              maxWidth: "36rem",
            }}>
              This document describes the platform architecture principles, access and control model, AI governance approach, deployment discipline, incident readiness, and security posture that underpin every product in the SZL ecosystem. Not a compliance checklist — a record of how we build and why.
            </p>
          </m.div>
        </div>
      </section>

      {/* Main Sections */}
      <section style={{ paddingTop: "clamp(4rem,7vw,6rem)", paddingBottom: "clamp(4rem,7vw,6rem)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <div style={{ display: "grid", gap: "clamp(3rem,6vw,5rem)" }}>
            {sections.map((section, si) => {
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
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: `${section.accent}14`,
                      border: `1px solid ${section.accent}28`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Icon size={16} style={{ color: section.accent }} />
                    </div>
                    <div>
                      <h2 style={{
                        fontSize: "1.1875rem",
                        fontWeight: "700",
                        letterSpacing: "-0.015em",
                        color: "hsl(38,12%,94%)",
                        marginBottom: "0.25rem",
                      }}>{section.title}</h2>
                    </div>
                  </div>

                  <div style={{
                    background: "hsla(0,0%,100%,0.02)",
                    border: "1px solid hsla(0,0%,100%,0.06)",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}>
                    {section.content.map((item, i) => (
                      <div
                        key={item.label}
                        style={{
                          padding: "1.375rem 1.75rem",
                          borderBottom: i < section.content.length - 1 ? "1px solid hsla(0,0%,100%,0.04)" : "none",
                          display: "grid",
                          gridTemplateColumns: "10rem 1fr",
                          gap: "2rem",
                          alignItems: "start",
                        }}
                        className="sm:grid block"
                      >
                        <p style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          color: section.accent,
                          paddingTop: "2px",
                          flexShrink: 0,
                        }}>{item.label}</p>
                        <p style={{
                          fontSize: "0.9375rem",
                          color: "hsl(210,5%,62%)",
                          lineHeight: "1.65",
                        }}>{item.body}</p>
                      </div>
                    ))}
                  </div>
                </m.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Incident Readiness */}
      <section style={{
        paddingTop: "clamp(4rem,7vw,6rem)",
        paddingBottom: "clamp(4rem,7vw,6rem)",
        background: "hsla(0,0%,100%,0.015)",
        borderTop: "1px solid hsla(0,0%,100%,0.05)",
        borderBottom: "1px solid hsla(0,0%,100%,0.05)",
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: "2.5rem" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "hsla(28,78%,56%,0.12)",
                border: "1px solid hsla(28,78%,56%,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <AlertTriangle size={16} style={{ color: "hsl(28,78%,56%)" }} />
              </div>
              <h2 style={{
                fontSize: "1.1875rem",
                fontWeight: "700",
                letterSpacing: "-0.015em",
                color: "hsl(38,12%,94%)",
              }}>Incident Readiness</h2>
            </div>
            <p style={{ fontSize: "1.0625rem", color: "hsl(210,5%,60%)", lineHeight: "1.65", maxWidth: "44rem" }}>
              SZL Holdings maintains documented incident response procedures for each platform. Detection is instrumented. Escalation paths are defined. Post-incident reviews are completed within five business days of resolution.
            </p>
          </m.div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1px",
            background: "hsla(0,0%,100%,0.05)",
            borderRadius: "12px",
            overflow: "hidden",
          }}>
            {[
              { step: "01", label: "Detection", body: "Continuous monitoring of service health, latency, error rates, and dependency status. Anomaly thresholds trigger automated alerts." },
              { step: "02", label: "Triage", body: "Incidents are classified by severity. Critical incidents trigger immediate principal notification. Escalation paths are documented and tested." },
              { step: "03", label: "Containment", body: "Isolation procedures are documented for each platform. Compromised sessions, exposed credentials, and service degradation have defined containment playbooks." },
              { step: "04", label: "Review", body: "Post-incident reviews are completed within five business days. Findings feed back into platform hardening and playbook updates." },
            ].map((item) => (
              <div key={item.step} style={{
                padding: "1.75rem",
                background: "hsl(210,12%,5%)",
              }}>
                <span style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: "700",
                  letterSpacing: "0.12em",
                  color: "hsl(210,5%,36%)",
                  marginBottom: "0.625rem",
                  fontFamily: "monospace",
                }}>{item.step}</span>
                <h3 style={{
                  fontSize: "0.9375rem",
                  fontWeight: "600",
                  color: "hsl(38,12%,92%)",
                  marginBottom: "0.625rem",
                }}>{item.label}</h3>
                <p style={{ fontSize: "0.875rem", color: "hsl(210,5%,56%)", lineHeight: "1.62" }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Reliability */}
      <section style={{ paddingTop: "clamp(4rem,7vw,6rem)", paddingBottom: "clamp(4rem,7vw,6rem)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: "2.5rem" }}
          >
            <span style={{
              display: "block",
              fontSize: "11px",
              fontWeight: "500",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "hsl(210,5%,46%)",
              marginBottom: "1rem",
            }}>Reliability</span>
            <h2 style={{
              fontSize: "clamp(1.5rem,3vw,2rem)",
              fontWeight: "700",
              letterSpacing: "-0.02em",
              lineHeight: "1.12",
              color: "hsl(38,12%,94%)",
              marginBottom: "0.875rem",
            }}>Product reliability intent</h2>
            <p style={{ fontSize: "1.0625rem", color: "hsl(210,5%,60%)", lineHeight: "1.65", maxWidth: "40rem" }}>
              SZL platforms are designed for operational contexts where unreliability is not a recoverable condition. This shapes every architectural decision.
            </p>
          </m.div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.25rem",
          }}>
            {reliabilityPrinciples.map((p, i) => (
              <m.div
                key={p.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: "hsla(0,0%,100%,0.02)",
                  border: "1px solid hsla(0,0%,100%,0.06)",
                  borderRadius: "10px",
                  padding: "1.5rem",
                }}
              >
                <h3 style={{
                  fontSize: "0.9375rem",
                  fontWeight: "600",
                  color: "hsl(38,12%,92%)",
                  marginBottom: "0.625rem",
                }}>{p.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "hsl(210,5%,56%)", lineHeight: "1.62" }}>{p.body}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Frameworks */}
      <section style={{ paddingTop: "clamp(4rem,7vw,6rem)", paddingBottom: "clamp(4rem,7vw,6rem)", borderTop: "1px solid hsla(0,0%,100%,0.05)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: "2.5rem" }}
          >
            <span style={{ display: "block", fontSize: "11px", fontWeight: "500", letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(210,5%,46%)", marginBottom: "1rem" }}>Compliance</span>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: "700", letterSpacing: "-0.02em", lineHeight: "1.12", color: "hsl(38,12%,94%)", marginBottom: "0.875rem" }}>Framework alignment</h2>
            <p style={{ fontSize: "1.0625rem", color: "hsl(210,5%,60%)", lineHeight: "1.65", maxWidth: "40rem" }}>
              SZL platforms are built to meet enterprise security and privacy standards. Current framework alignment status:
            </p>
          </m.div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1px", background: "hsla(0,0%,100%,0.05)", borderRadius: "12px", overflow: "hidden" }}>
            {COMPLIANCE_FRAMEWORKS.map((fw) => (
              <div key={fw.name} style={{ padding: "1.25rem 1.5rem", background: "hsl(210,12%,5%)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.9375rem", fontWeight: "600", color: "hsl(38,12%,92%)" }}>{fw.name}</span>
                  <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "4px", background: `${fw.color}18`, color: fw.color, border: `1px solid ${fw.color}30`, textTransform: "uppercase", letterSpacing: "0.06em" }}>{fw.status}</span>
                </div>
                <p style={{ fontSize: "0.8125rem", color: "hsl(210,5%,56%)", lineHeight: "1.5" }}>{fw.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SLA Commitments */}
      <section style={{ paddingTop: "clamp(4rem,7vw,6rem)", paddingBottom: "clamp(4rem,7vw,6rem)", background: "hsla(0,0%,100%,0.015)", borderTop: "1px solid hsla(0,0%,100%,0.05)", borderBottom: "1px solid hsla(0,0%,100%,0.05)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: "2.5rem" }}
          >
            <span style={{ display: "block", fontSize: "11px", fontWeight: "500", letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(210,5%,46%)", marginBottom: "1rem" }}>Service Levels</span>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: "700", letterSpacing: "-0.02em", lineHeight: "1.12", color: "hsl(38,12%,94%)", marginBottom: "0.875rem" }}>Uptime and performance commitments</h2>
          </m.div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1px", background: "hsla(0,0%,100%,0.05)", borderRadius: "12px", overflow: "hidden" }}>
            {SLA_COMMITMENTS.map((sla) => (
              <div key={sla.metric} style={{ padding: "1.25rem 1.5rem", background: "hsl(210,12%,5%)" }}>
                <div style={{ fontSize: "10px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.08em", color: "hsl(210,5%,42%)", marginBottom: "0.625rem" }}>{sla.metric}</div>
                <div style={{ fontSize: "1.125rem", fontWeight: "700", fontFamily: "monospace", color: sla.color, marginBottom: "0.25rem" }}>{sla.current}</div>
                <div style={{ fontSize: "10px", color: "hsl(210,5%,36%)" }}>Target: {sla.target}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vendor Review Documents */}
      <section style={{ paddingTop: "clamp(4rem,7vw,6rem)", paddingBottom: "clamp(4rem,7vw,6rem)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: "2.5rem" }}
          >
            <span style={{ display: "block", fontSize: "11px", fontWeight: "500", letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(210,5%,46%)", marginBottom: "1rem" }}>Procurement</span>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: "700", letterSpacing: "-0.02em", lineHeight: "1.12", color: "hsl(38,12%,94%)", marginBottom: "0.875rem" }}>Vendor review documents</h2>
            <p style={{ fontSize: "1.0625rem", color: "hsl(210,5%,60%)", lineHeight: "1.65", maxWidth: "40rem" }}>
              Self-serve access to the documents your security and procurement teams need. Available documents can be downloaded directly. For restricted documents, contact our security team.
            </p>
          </m.div>
          <div style={{ background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "12px", overflow: "hidden" }}>
            {VENDOR_DOCS.map((doc, i) => (
              <div key={doc.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1.5rem", borderBottom: i < VENDOR_DOCS.length - 1 ? "1px solid hsla(0,0%,100%,0.04)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Download size={14} style={{ color: doc.available ? "hsl(210,55%,52%)" : "hsl(210,5%,28%)" }} />
                  <span style={{ fontSize: "0.875rem", color: doc.available ? "hsl(38,12%,88%)" : "hsl(210,5%,36%)" }}>{doc.name}</span>
                  <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "3px", background: "hsla(0,0%,100%,0.04)", color: "hsl(210,5%,42%)", fontFamily: "monospace" }}>{doc.format}</span>
                </div>
                <span style={{ fontSize: "10px", fontWeight: "500", color: doc.available ? "hsl(152,50%,42%)" : "hsl(210,5%,36%)" }}>{doc.available ? "Available" : "On Request"}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Contact */}
      <section style={{ paddingTop: "clamp(3rem,5vw,4rem)", paddingBottom: "clamp(3rem,5vw,4rem)", background: "hsla(0,0%,100%,0.015)", borderTop: "1px solid hsla(0,0%,100%,0.05)", borderBottom: "1px solid hsla(0,0%,100%,0.05)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "3rem" }}>
              <div>
                <h3 style={{ fontSize: "1.0625rem", fontWeight: "700", color: "hsl(38,12%,94%)", marginBottom: "0.75rem" }}>Security inquiries</h3>
                <p style={{ fontSize: "0.875rem", color: "hsl(210,5%,56%)", lineHeight: "1.6", marginBottom: "1rem" }}>
                  For security reviews, vulnerability disclosures, penetration test coordination, or compliance questionnaires.
                </p>
                <a href="mailto:security@stephenl.dev" style={{ fontSize: "0.875rem", color: "hsl(210,55%,52%)", textDecoration: "none" }}>security@stephenl.dev</a>
              </div>
              <div>
                <h3 style={{ fontSize: "1.0625rem", fontWeight: "700", color: "hsl(38,12%,94%)", marginBottom: "0.75rem" }}>Procurement & compliance</h3>
                <p style={{ fontSize: "0.875rem", color: "hsl(210,5%,56%)", lineHeight: "1.6", marginBottom: "1rem" }}>
                  For vendor onboarding, data processing agreements, compliance documentation, and enterprise contracts.
                </p>
                <a href="mailto:contact@stephenl.dev" style={{ fontSize: "0.875rem", color: "hsl(210,55%,52%)", textDecoration: "none" }}>contact@stephenl.dev</a>
              </div>
            </div>
          </m.div>
        </div>
      </section>

      {/* Platform Status */}
      <section style={{ paddingTop: "clamp(4rem,7vw,6rem)", paddingBottom: "clamp(4rem,7vw,6rem)", borderTop: "1px solid hsla(0,0%,100%,0.05)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "8px",
                background: "hsla(152,50%,42%,0.10)", border: "1px solid hsla(152,50%,42%,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Activity size={16} style={{ color: "hsl(152,50%,42%)" }} />
              </div>
              <h2 style={{ fontSize: "1.1875rem", fontWeight: "700", letterSpacing: "-0.015em", color: "hsl(38,12%,94%)" }}>Platform Status</h2>
            </div>
            <p style={{ fontSize: "1.0625rem", color: "hsl(210,5%,60%)", lineHeight: "1.65", maxWidth: "44rem", marginBottom: "1.5rem" }}>
              Real-time service availability, incident history, and uptime metrics for all SZL platform services are publicly accessible without login.
            </p>
            <a
              href="/status"
              style={{
                display: "inline-flex", alignItems: "center", gap: "7px",
                padding: "0.625rem 1.125rem", borderRadius: "7px",
                background: "hsla(152,50%,42%,0.1)", border: "1px solid hsla(152,50%,42%,0.22)",
                color: "hsl(152,50%,52%)", fontSize: "0.875rem", fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "hsl(152,50%,52%)" }} />
              View Platform Status
              <ExternalLink size={12} />
            </a>
          </m.div>
        </div>
      </section>

      {/* Subprocessors */}
      <section style={{ paddingTop: "clamp(4rem,7vw,6rem)", paddingBottom: "clamp(4rem,7vw,6rem)", background: "hsla(0,0%,100%,0.015)", borderTop: "1px solid hsla(0,0%,100%,0.05)", borderBottom: "1px solid hsla(0,0%,100%,0.05)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: "2.5rem" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "8px",
                background: "hsla(210,55%,52%,0.10)", border: "1px solid hsla(210,55%,52%,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <List size={16} style={{ color: "hsl(210,55%,52%)" }} />
              </div>
              <h2 style={{ fontSize: "1.1875rem", fontWeight: "700", letterSpacing: "-0.015em", color: "hsl(38,12%,94%)" }}>Subprocessors</h2>
            </div>
            <p style={{ fontSize: "1.0625rem", color: "hsl(210,5%,60%)", lineHeight: "1.65", maxWidth: "44rem" }}>
              SZL Holdings uses the following third-party subprocessors to deliver platform services. All subprocessors are bound by data processing agreements. This list is updated when subprocessors are added or removed.
            </p>
          </m.div>

          <div style={{ background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "12px", overflow: "hidden" }}>
            {[
              { name: "Replit", purpose: "Cloud infrastructure, compute, and managed database hosting", category: "Infrastructure", location: "United States", dpa: true },
              { name: "OpenAI", purpose: "AI language model inference for advisory and analysis agents", category: "AI / Inference", location: "United States", dpa: true },
              { name: "Anthropic", purpose: "AI language model inference for safety-sensitive agent contexts", category: "AI / Inference", location: "United States", dpa: true },
              { name: "Google Cloud", purpose: "Maps, geocoding, and geospatial data services", category: "Infrastructure / Data", location: "United States", dpa: true },
              { name: "Stripe", purpose: "Payment processing and billing infrastructure", category: "Payments", location: "United States", dpa: true },
              { name: "Microsoft Azure", purpose: "Azure Active Directory, tenant provisioning, and enterprise SSO", category: "Identity / Enterprise", location: "United States / EU", dpa: true },
              { name: "Resend / SendGrid", purpose: "Transactional email delivery for alerts and notifications", category: "Communications", location: "United States", dpa: true },
            ].map((sp, i, arr) => (
              <div key={sp.name} style={{
                display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "1.5rem",
                padding: "1rem 1.5rem",
                borderBottom: i < arr.length - 1 ? "1px solid hsla(0,0%,100%,0.04)" : "none",
                alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "hsl(38,12%,88%)", marginBottom: 2 }}>{sp.name}</div>
                  <div style={{ fontSize: "0.8125rem", color: "hsl(210,5%,54%)", lineHeight: 1.5 }}>{sp.purpose}</div>
                </div>
                <div>
                  <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: 4, background: "hsla(0,0%,100%,0.05)", border: "1px solid hsla(0,0%,100%,0.08)", color: "hsl(210,5%,60%)", marginRight: 6 }}>{sp.category}</span>
                  <span style={{ fontSize: "10px", color: "hsl(210,5%,44%)" }}>{sp.location}</span>
                </div>
                <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "hsla(152,50%,42%,0.1)", color: "hsl(152,50%,52%)", border: "1px solid hsla(152,50%,42%,0.2)", whiteSpace: "nowrap" as const }}>DPA Signed</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: "12px", color: "hsl(210,5%,40%)", marginTop: "1rem", lineHeight: "1.55" }}>
            Last updated: April 2026. To request notification of subprocessor changes, contact <a href="mailto:security@stephenl.dev" style={{ color: "hsl(210,55%,52%)", textDecoration: "none" }}>security@stephenl.dev</a>.
          </p>
        </div>
      </section>

      {/* Penetration Testing */}
      <section style={{ paddingTop: "clamp(4rem,7vw,6rem)", paddingBottom: "clamp(4rem,7vw,6rem)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: "2.5rem" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "8px",
                background: "hsla(246,55%,62%,0.10)", border: "1px solid hsla(246,55%,62%,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <FileText size={16} style={{ color: "hsl(246,55%,62%)" }} />
              </div>
              <h2 style={{ fontSize: "1.1875rem", fontWeight: "700", letterSpacing: "-0.015em", color: "hsl(38,12%,94%)" }}>Penetration Testing Cadence</h2>
            </div>
            <p style={{ fontSize: "1.0625rem", color: "hsl(210,5%,60%)", lineHeight: "1.65", maxWidth: "44rem" }}>
              SZL Holdings conducts regular adversarial testing across all platform surfaces. Findings are tracked to closure with defined SLA windows by severity.
            </p>
          </m.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1px", background: "hsla(0,0%,100%,0.05)", borderRadius: "12px", overflow: "hidden" }}>
            {[
              { cadence: "Quarterly", scope: "Full external penetration test covering all internet-facing API endpoints, authentication flows, and web application surfaces. Conducted using OWASP methodology with manual exploitation attempts." },
              { cadence: "Monthly", scope: "Automated vulnerability scanning using static analysis, dependency auditing, and DAST against staging environments. Results reviewed within 24 hours; critical findings escalate immediately." },
              { cadence: "Continuous", scope: "Dependency vulnerability monitoring via automated tooling on every build. CVE-classified findings with CVSS ≥ 7.0 trigger mandatory 48-hour remediation." },
              { cadence: "Ad hoc", scope: "Firestorm adversary emulation exercises run against internal access controls, agent permission boundaries, and privileged operation gates. Conducted before major releases." },
            ].map((item) => (
              <div key={item.cadence} style={{ padding: "1.5rem 1.75rem", background: "hsl(210,12%,5%)" }}>
                <span style={{ display: "block", fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", color: "hsl(246,55%,62%)", marginBottom: "0.5rem", textTransform: "uppercase" as const }}>{item.cadence}</span>
                <p style={{ fontSize: "0.875rem", color: "hsl(210,5%,56%)", lineHeight: "1.62" }}>{item.scope}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "1.5rem", display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            {[
              { label: "Critical (CVSS 9+)", target: "< 24 hours", color: "#ef4444" },
              { label: "High (CVSS 7–9)", target: "< 48 hours", color: "#f59e0b" },
              { label: "Medium (CVSS 4–7)", target: "< 14 days", color: "#3b82f6" },
              { label: "Low (CVSS < 4)", target: "< 90 days", color: "#6b7280" },
            ].map((sla) => (
              <div key={sla.label} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: sla.color, display: "block", flexShrink: 0 }} />
                <span style={{ fontSize: "12px", color: "hsl(210,5%,56%)" }}>{sla.label}: <span style={{ color: "hsl(38,12%,82%)", fontWeight: 600 }}>{sla.target}</span></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Responsible Disclosure */}
      <section style={{ paddingTop: "clamp(4rem,7vw,6rem)", paddingBottom: "clamp(4rem,7vw,6rem)", background: "hsla(0,0%,100%,0.015)", borderTop: "1px solid hsla(0,0%,100%,0.05)", borderBottom: "1px solid hsla(0,0%,100%,0.05)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "8px",
                background: "hsla(32,65%,52%,0.10)", border: "1px solid hsla(32,65%,52%,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Bug size={16} style={{ color: "hsl(32,65%,52%)" }} />
              </div>
              <h2 style={{ fontSize: "1.1875rem", fontWeight: "700", letterSpacing: "-0.015em", color: "hsl(38,12%,94%)" }}>Responsible Disclosure</h2>
            </div>
            <p style={{ fontSize: "1.0625rem", color: "hsl(210,5%,60%)", lineHeight: "1.65", maxWidth: "44rem", marginBottom: "2rem" }}>
              If you have discovered a security vulnerability in any SZL Holdings platform, we ask that you disclose it to us privately before public disclosure. We commit to acknowledging valid reports within 48 hours, and resolving critical findings within 72 hours.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "3rem" }}>
              <div>
                <h3 style={{ fontSize: "0.9375rem", fontWeight: "700", color: "hsl(38,12%,92%)", marginBottom: "1rem" }}>Our commitments to you</h3>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.75rem" }}>
                  {[
                    "Acknowledge your report within 48 hours",
                    "Confirm whether the issue is valid within 5 business days",
                    "Notify you when the vulnerability has been resolved",
                    "Credit researchers who follow this policy (if desired)",
                    "Not pursue legal action for good-faith disclosures",
                  ].map((item) => (
                    <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                      <CheckCircle size={13} style={{ color: "#10b981", marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: "0.875rem", color: "hsl(210,5%,60%)", lineHeight: 1.55 }}>{item}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "1.5rem" }}>
                  <h4 style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,12%,72%)", marginBottom: "0.5rem" }}>In scope</h4>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.375rem" }}>
                    {["Authentication bypass", "Privilege escalation", "SQL injection", "XSS (stored)", "SSRF", "Data exposure", "Broken access control"].map(s => (
                      <span key={s} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: 4, background: "hsla(152,50%,42%,0.08)", border: "1px solid hsla(152,50%,42%,0.15)", color: "hsl(152,50%,52%)" }}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              <DisclosureForm />
            </div>
          </m.div>
        </div>
      </section>

      {/* Footer note */}
      <section style={{
        paddingTop: "2rem",
        paddingBottom: "3rem",
        borderTop: "1px solid hsla(0,0%,100%,0.05)",
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem" }}>
            <p style={{ fontSize: "0.8125rem", color: "hsl(210,5%,38%)", lineHeight: "1.6", maxWidth: "38rem" }}>
              SZL Holdings does not claim SOC 2 certification or any formal regulatory compliance status at this time. This document describes our engineering and operational practices as they stand today. Enterprise compliance documentation and security posture details are available on request.
            </p>
            <button
              onClick={handleDownloadCompliance}
              disabled={downloading}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "0.5rem 1rem", borderRadius: "6px",
                background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.09)",
                color: "hsl(210,5%,52%)", fontSize: "12px", fontWeight: 500,
                cursor: downloading ? "not-allowed" : "pointer", opacity: downloading ? 0.7 : 1,
                flexShrink: 0,
              }}
            >
              {downloading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Download size={13} />}
              {downloading ? "Generating..." : "Download Compliance PDF"}
            </button>
            {downloadError && <p style={{ fontSize: "11px", color: "hsl(0,72%,51%)", marginTop: "6px" }}>{downloadError}</p>}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
