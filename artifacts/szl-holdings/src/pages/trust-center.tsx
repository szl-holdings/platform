import { m } from "framer-motion";
import { Shield, Lock, Eye, Activity, Database, Server, CheckCircle, AlertTriangle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

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

export default function TrustCenter() {
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

      {/* Footer note */}
      <section style={{
        paddingTop: "2rem",
        paddingBottom: "3rem",
        borderTop: "1px solid hsla(0,0%,100%,0.05)",
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
          <p style={{ fontSize: "0.8125rem", color: "hsl(210,5%,38%)", lineHeight: "1.6", maxWidth: "38rem" }}>
            SZL Holdings does not claim SOC 2 certification or any formal regulatory compliance status at this time. This document describes our engineering and operational practices as they stand today. Enterprise compliance documentation and security posture details are available on request.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
