import { useEffect } from "react";
import { Link } from "wouter";
import { UserCheck, Download, ArrowLeft, ShieldCheck, Lock, Eye, AlertTriangle, ArrowRight } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { analytics } from "@/lib/analytics";

const SECTIONS = [
  {
    icon: Lock,
    title: "Access Controls — Current State",
    items: [
      "Six-tier RBAC enforced server-side — every API call checks role before execution, not after",
      "OpenID Connect with PKCE; Azure AD multi-tenant SSO with SCIM 2.0 provisioning",
      "Session management via DB-backed sessions with expiration, rotation, and invalidation on logout",
      "Organization-scoped middleware prevents cross-tenant access at the request layer",
      "Platform role mapping from external IdP groups to internal RBAC tiers",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Data Isolation",
    items: [
      "Multi-tenant data isolation enforced at the database and middleware layer — not application-level filtering",
      "Retrieval engine scoped by tenant context — ambient cross-tenant queries are architecturally impossible",
      "Personal data handling follows minimum-necessary principle with defined retention policies per category",
      "Demo and test data is synthetic — never derived from real customer data",
      "External data ingestion governed by connector permission scoping with minimum-required access grants",
    ],
  },
  {
    icon: Eye,
    title: "Credential & Secret Management",
    items: [
      "No plaintext credentials in codebase, logs, or any system surface — verified as structural policy",
      "All secrets managed in environment secret management; rotation process defined for critical credentials",
      "Third-party integrations use scoped access tokens; audit log of credential access events maintained",
      "Sensitive key redaction applied to audit logs before storage",
      "HTTPS / TLS 1.3 enforced across all public-facing surfaces; database connections use encrypted channels",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Disclosure & Threat Posture",
    items: [
      "Responsible disclosure policy published at szlholdings.com/legal/security-disclosure",
      "Security reports acknowledged within 48 hours with initial severity assessment",
      "CSRF protection active on all mutating endpoints",
      "Staging, pilot, and production environments logically separated",
      "AI-generated content always labeled — no unmarked AI output reaches operational or audit surfaces",
    ],
  },
];

const KEY_QUESTIONS = [
  { q: "Is RBAC enforced server-side or only in the UI?", a: "Server-side only. Every API call checks role before execution. The UI reflects permissions but cannot override them." },
  { q: "How is multi-tenancy enforced?", a: "At the database query and middleware layer. Organization scope is injected at the request level — cross-tenant leakage is architecturally prevented." },
  { q: "What is the disclosure policy?", a: "Published at szlholdings.com/legal/security-disclosure. Reports acknowledged within 48 hours with severity triage." },
  { q: "Are secrets ever logged?", a: "No. Sensitive key redaction is applied before any log storage. No plaintext credentials appear in codebase, logs, or observable surfaces." },
];

export default function DiligenceSecurityPage() {
  const __pageMeta = usePageMeta({
    title: "Security Diligence Brief — SZL Holdings",
    description: "One-page security controls, data isolation, and threat posture brief for security reviewers evaluating the SZL Holdings platform.",
    canonical: "https://szlholdings.com/trust/diligence/security",
  });

  useEffect(() => {
    analytics.diligenceBriefView('security');
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "print-override";
    style.textContent = `
      @media print {
        .no-print { display: none !important; }
        body { background: #fff !important; color: #111 !important; }
        .brief-card { break-inside: avoid; border: 1px solid var(--gi-text-primary) !important; background: #f8fafc !important; }
        a { color: #15803d !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById("print-override")?.remove(); };
  }, []);

  const accentColor = "hsl(145,62%,46%)";
  const accentMuted = "hsla(145,62%,40%,0.07)";
  const accentBorder = "hsla(145,62%,40%,0.22)";

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <div className="no-print" style={{ borderBottom: "1px solid hsla(214,12%,18%,0.8)", padding: "1rem var(--space-content-x, 1.5rem)", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "1280px", margin: "0 auto" }}>
          <Link href="/trust#evaluators" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: accentColor, textDecoration: "none" }}>
            <ArrowLeft size={13} /> Back to Trust Center
          </Link>
          <button
            onClick={() => { analytics.diligenceBriefDownload('security'); window.print(); }}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "0.5rem", background: accentColor, color: "#fff", border: "none", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}
          >
            <Download size={13} /> Save as PDF
          </button>
        </div>
  
        <main style={{ maxWidth: "860px", margin: "0 auto", padding: "2.5rem var(--space-content-x, 1.5rem) 4rem" }}>
  
          <div style={{ borderRadius: "0.875rem", background: accentMuted, border: `1px solid ${accentBorder}`, padding: "2rem 2.25rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1.5rem", flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0.75rem", borderRadius: "99px", background: "hsla(145,62%,40%,0.12)", border: `1px solid ${accentBorder}`, marginBottom: "1rem" }}>
                  <UserCheck size={12} color={accentColor} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: accentColor }}>Security Reviewer Brief</span>
                </div>
                <h1 style={{ fontSize: "clamp(1.5rem,4vw,2.25rem)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: "0.625rem" }}>
                  What controls are actually in place today?
                </h1>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.65, color: "hsl(214,7%,62%)", maxWidth: "52ch" }}>
                  RBAC, data isolation, credential management, disclosure policy, and threat posture — current state only, no roadmap items included.
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "hsl(214,7%,50%)", marginBottom: "0.25rem" }}>SZL Holdings</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "hsl(214,7%,50%)" }}>szlholdings.com/trust</p>
              </div>
            </div>
          </div>
  
          <div style={{ marginBottom: "2rem" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: accentColor, marginBottom: "1rem" }}>Key Questions Answered</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "0.75rem" }}>
              {KEY_QUESTIONS.map((kq, i) => (
                <div key={i} className="brief-card" style={{ borderRadius: "0.625rem", padding: "1rem 1.25rem", background: "hsla(214,12%,8%,0.7)", border: "1px solid hsla(214,12%,18%,0.7)" }}>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,88%)", marginBottom: "0.375rem" }}>{kq.q}</p>
                  <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,56%)" }}>{kq.a}</p>
                </div>
              ))}
            </div>
          </div>
  
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
            {SECTIONS.map((section, i) => {
              const Icon = section.icon;
              return (
                <div key={i} className="brief-card" style={{ borderRadius: "0.75rem", padding: "1.375rem 1.5rem", background: "hsla(214,12%,6%,0.6)", border: "1px solid hsla(214,12%,18%,0.6)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <Icon size={14} color={accentColor} />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: accentColor }}>{section.title}</span>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {section.items.map((item, j) => (
                      <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                        <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: accentColor, flexShrink: 0, marginTop: "7px", opacity: 0.7 }} />
                        <span style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,58%)" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
  
          <div style={{ borderTop: "1px solid hsla(214,12%,18%,0.6)", paddingTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,48%)", marginBottom: "0.5rem" }}>Explore the full documentation:</p>
              <div className="no-print" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {[
                  { label: "Security Posture", href: "/trust/security" },
                  { label: "AI Governance", href: "/trust/governance" },
                  { label: "Responsible Disclosure", href: "/legal/security-disclosure" },
                  { label: "Architecture Trust Layer", href: "/trust/architecture" },
                  { label: "AI Policy", href: "/trust/ai" },
                ].map((l) => (
                  <Link key={l.href} href={l.href} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: accentColor, textDecoration: "none", padding: "0.25rem 0.625rem", borderRadius: "0.375rem", border: `1px solid ${accentBorder}`, background: accentMuted }}>
                    <ArrowRight size={10} />{l.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="no-print">
              <Link href="/contact" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 1rem", borderRadius: "0.5rem", background: accentColor, color: "#fff", textDecoration: "none", fontSize: "0.8125rem", fontWeight: 600 }}>
                Schedule a security review <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </main>
  
        <style>{`@media print { .no-print { display: none !important; } body { background: #fff !important; color: #111 !important; } }`}</style>
      </div>
        </>
  );
}
