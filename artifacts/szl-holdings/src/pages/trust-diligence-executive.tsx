import { useEffect } from "react";
import { Link } from "wouter";
import { Briefcase, Download, ArrowLeft, ShieldCheck, CheckSquare, Eye, Lock, ArrowRight } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const SECTIONS = [
  {
    title: "Governance Model",
    items: [
      "AI never takes consequential action without explicit human sign-off at each approval gate",
      "Tiered approval paths calibrated by action risk — routine, high-impact, and irreversible actions each require different quorums",
      "Full decision lineage is exportable on demand for LP reporting or regulatory inquiry",
      "Override records are permanent and mandatory — no hidden authority",
    ],
  },
  {
    title: "Risk Surface",
    items: [
      "HITL gates are configurable per workflow, not a global on/off switch",
      "Dual-approval required for high-impact actions; escalation chains have named fallback owners",
      "All AI-generated assertions are source-grounded — no hallucinated claims reach operational surfaces",
      "Emergency override protocol is logged and triggers mandatory post-action review",
    ],
  },
  {
    title: "Audit Readiness",
    items: [
      "Every AI decision surface captures signal source, confidence score, and approver attribution",
      "Export system attaches a proof chain and hash to every generated document",
      "Audit trail is designed for LP reporting, regulatory inquiry, and compliance diligence",
      "Post-export access audit trail maintained — who accessed what, when",
    ],
  },
  {
    title: "Operational Accountability",
    items: [
      "Six-tier RBAC enforced server-side — not advisory",
      "Organization-scoped data isolation at database and middleware layer",
      "No plaintext credentials in codebase, logs, or any system surface",
      "Continuous service health monitoring with runbook-backed incident procedures",
    ],
  },
];

const KEY_QUESTIONS = [
  { q: "Can AI act without human approval?", a: "No. Every consequential action requires explicit human sign-off through configurable HITL gates." },
  { q: "Is there a complete audit trail?", a: "Yes. Every AI decision, approval, override, and export is logged with full attribution and is exportable." },
  { q: "How is access controlled?", a: "Six-tier RBAC enforced server-side with OpenID Connect / PKCE and Azure AD SSO." },
  { q: "What happens if something goes wrong?", a: "Emergency override is logged, triggers mandatory review, and escalation chains have named fallback owners." },
];

export default function DiligenceExecutivePage() {
  const __pageMeta = usePageMeta({
    title: "Executive Diligence Brief — SZL Holdings",
    description: "One-page governance, risk, and audit readiness brief for executive buyers evaluating the SZL Holdings platform.",
    canonical: "https://szlholdings.com/trust/diligence/executive",
  });

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "print-override";
    style.textContent = `
      @media print {
        .no-print { display: none !important; }
        body { background: #fff !important; color: #111 !important; }
        .brief-card { break-inside: avoid; border: 1px solid #e2e8f0 !important; background: #f8fafc !important; }
        .brief-header { background: #0f172a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        a { color: #0369a1 !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById("print-override")?.remove(); };
  }, []);

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        {/* Top bar — hidden on print */}
        <div className="no-print" style={{ borderBottom: "1px solid hsla(214,12%,18%,0.8)", padding: "1rem var(--space-content-x, 1.5rem)", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "1280px", margin: "0 auto" }}>
          <Link href="/trust#evaluators" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "hsl(192,72%,48%)", textDecoration: "none" }}>
            <ArrowLeft size={13} /> Back to Trust Center
          </Link>
          <button
            onClick={() => window.print()}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "hsl(192,72%,48%)", color: "#fff", border: "none", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}
          >
            <Download size={13} /> Save as PDF
          </button>
        </div>
  
        <main style={{ maxWidth: "860px", margin: "0 auto", padding: "2.5rem var(--space-content-x, 1.5rem) 4rem" }}>
  
          {/* Brief header */}
          <div className="brief-header" style={{ borderRadius: "0.875rem", background: "hsla(192,72%,48%,0.07)", border: "1px solid hsla(192,72%,48%,0.22)", padding: "2rem 2.25rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1.5rem", flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0.75rem", borderRadius: "99px", background: "hsla(192,72%,48%,0.12)", border: "1px solid hsla(192,72%,48%,0.25)", marginBottom: "1rem" }}>
                  <Briefcase size={12} color="hsl(192,72%,48%)" />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "hsl(192,72%,48%)" }}>Executive Buyer Brief</span>
                </div>
                <h1 style={{ fontSize: "clamp(1.5rem,4vw,2.25rem)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: "0.625rem" }}>
                  Is this safe to operate at scale?
                </h1>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.65, color: "hsl(214,7%,62%)", maxWidth: "52ch" }}>
                  Governance model, risk surface, audit readiness, and operational accountability — the four things an executive buyer needs to evaluate before committing to a pilot.
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "hsl(214,7%,50%)", marginBottom: "0.25rem" }}>SZL Holdings</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "hsl(214,7%,50%)" }}>szlholdings.com/trust</p>
              </div>
            </div>
          </div>
  
          {/* Key Q&A */}
          <div style={{ marginBottom: "2rem" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(192,72%,48%)", marginBottom: "1rem" }}>Key Questions Answered</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "0.75rem" }}>
              {KEY_QUESTIONS.map((kq, i) => (
                <div key={i} className="brief-card" style={{ borderRadius: "0.625rem", padding: "1rem 1.25rem", background: "hsla(214,12%,8%,0.7)", border: "1px solid hsla(214,12%,18%,0.7)" }}>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,88%)", marginBottom: "0.375rem" }}>{kq.q}</p>
                  <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,56%)" }}>{kq.a}</p>
                </div>
              ))}
            </div>
          </div>
  
          {/* Main sections */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
            {SECTIONS.map((section, i) => (
              <div key={i} className="brief-card" style={{ borderRadius: "0.75rem", padding: "1.375rem 1.5rem", background: "hsla(214,12%,6%,0.6)", border: "1px solid hsla(214,12%,18%,0.6)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <ShieldCheck size={14} color="hsl(192,72%,48%)" />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(192,72%,48%)" }}>{section.title}</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {section.items.map((item, j) => (
                    <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                      <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "hsl(192,72%,48%)", flexShrink: 0, marginTop: "7px", opacity: 0.7 }} />
                      <span style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,58%)" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
  
          {/* Footer links */}
          <div style={{ borderTop: "1px solid hsla(214,12%,18%,0.6)", paddingTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,48%)", marginBottom: "0.5rem" }}>Explore the full documentation:</p>
              <div className="no-print" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {[
                  { label: "AI Governance", href: "/trust/governance" },
                  { label: "Approval & HITL Gates", href: "/trust/approvals" },
                  { label: "System Architecture", href: "/architecture" },
                  { label: "Operating Doctrine", href: "/operating-doctrine" },
                  { label: "Security Controls", href: "/trust/security" },
                ].map((l) => (
                  <Link key={l.href} href={l.href} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "hsl(192,72%,48%)", textDecoration: "none", padding: "0.25rem 0.625rem", borderRadius: "0.375rem", border: "1px solid hsla(192,72%,48%,0.2)", background: "hsla(192,72%,48%,0.05)" }}>
                    <ArrowRight size={10} />{l.label}
                  </Link>
                ))}
              </div>
              <p className="no-print" style={{ display: "none" }}>szlholdings.com/trust/governance · /trust/approvals · /architecture · /operating-doctrine · /trust/security</p>
            </div>
            <div className="no-print" style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <Link href="/contact" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "hsl(192,72%,48%)", color: "#fff", textDecoration: "none", fontSize: "0.8125rem", fontWeight: 600 }}>
                Start a diligence conversation <ArrowRight size={12} />
              </Link>
            </div>
          </div>
  
          {/* Print footer */}
          <div style={{ marginTop: "1.5rem", display: "none" }} className="print-only">
            <p style={{ fontSize: "0.75rem", color: "#64748b" }}>SZL Holdings — szlholdings.com/trust — Contact: inquiries@szlholdings.com</p>
          </div>
        </main>
  
        {/* Print show/hide utility */}
        <style>{`.print-only { display: none; } @media print { .print-only { display: block !important; } }`}</style>
      </div>
        </>
  );
}
