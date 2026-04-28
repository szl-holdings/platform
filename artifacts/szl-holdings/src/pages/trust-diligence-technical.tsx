import { useEffect } from "react";
import { Link } from "wouter";
import { Code2, Download, ArrowLeft, Layers, Database, Lock, Cpu, ArrowRight } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { analytics } from "@/lib/analytics";

const SECTIONS = [
  {
    icon: Layers,
    title: "Architecture Layers",
    items: [
      "KORA is the command layer — orchestrates agents, handles query decomposition, routes to domain packs",
      "Counsel is the action spine — manages write-back, connector execution, and proof chain attachment",
      "Six-stage signal → action pipeline: Ingest → Parse → Enrich → Decide → Approve → Execute",
      "Domain packs (Legal, Maritime, Real Estate, Defense) are isolated, composable units",
      "Digital twin per domain allows state modeling without live system dependency",
    ],
  },
  {
    icon: Database,
    title: "Data Handling & Isolation",
    items: [
      "Multi-tenant data isolation enforced at database and middleware layer",
      "Organization-scoped queries prevent cross-tenant data leakage at the query level",
      "Retrieval engine scoped by tenant context — no ambient access across organizations",
      "External data ingestion governed by connector permission scoping",
      "No training on client data — model isolation is architectural, not policy-only",
    ],
  },
  {
    icon: Cpu,
    title: "Governance API & Governed Inference",
    items: [
      "Governance API exposes query/mutation surface with field-level permission enforcement",
      "Governed inference routes AI requests to best-fit model per signal type and latency requirement",
      "All AI assertions are source-grounded — confidence scores and source attribution required",
      "Contradiction detection flags conflicting signals before they surface to operators",
      "Generated content is always labeled — no unmarked AI output reaches decision surfaces",
    ],
  },
  {
    icon: Lock,
    title: "Integration Surface & Security",
    items: [
      "Connector permission scoping: each integration granted minimum-required access",
      "API surface protected with rate limiting, CSRF protection, and OpenID Connect / PKCE",
      "Proof chain attached to every write-back and exported document — cryptographic hash included",
      "The audit timeline provides temporal record — state snapshots indexed by decision event",
      "No plaintext credentials in codebase, environment logs, or any observable surface",
    ],
  },
];

const KEY_QUESTIONS = [
  { q: "How does the agent pipeline work?", a: "Six stages: Ingest → Parse → Enrich → Decide → Approve → Execute. Each stage is auditable and HITL gates sit at Approve." },
  { q: "How is multi-tenancy enforced?", a: "At the database query layer and middleware — scoped by org context, not just filtered in application code." },
  { q: "What is the Proof Chain?", a: "A cryptographic record attached to every agent-driven action and export, providing tamper-evident decision lineage." },
  { q: "How is the governed inference layer managed?", a: "Model selection is deterministic per signal type. Client data never flows back to model training pipelines." },
];

export default function DiligenceTechnicalPage() {
  const __pageMeta = usePageMeta({
    title: "Technical Diligence Brief — SZL Holdings",
    description: "One-page architecture, integration, and data-handling brief for technical evaluators assessing the SZL Holdings platform.",
    canonical: "https://szlholdings.com/trust/diligence/technical",
  });

  useEffect(() => {
    analytics.diligenceBriefView('technical');
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "print-override";
    style.textContent = `
      @media print {
        .no-print { display: none !important; }
        body { background: #fff !important; color: #111 !important; }
        .brief-card { break-inside: avoid; border: 1px solid var(--gi-text-primary) !important; background: #f8fafc !important; }
        .brief-header { background: var(--gi-bg-base) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        a { color: #6d28d9 !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById("print-override")?.remove(); };
  }, []);

  const accentColor = "hsl(258,55%,68%)";
  const accentMuted = "hsla(258,55%,68%,0.07)";
  const accentBorder = "hsla(258,55%,68%,0.22)";

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <div className="no-print" style={{ borderBottom: "1px solid hsla(214,12%,18%,0.8)", padding: "1rem var(--space-content-x, 1.5rem)", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "1280px", margin: "0 auto" }}>
          <Link href="/trust#evaluators" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: accentColor, textDecoration: "none" }}>
            <ArrowLeft size={13} /> Back to Trust Center
          </Link>
          <button
            onClick={() => { analytics.diligenceBriefDownload('technical'); window.print(); }}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "0.5rem", background: accentColor, color: "#fff", border: "none", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}
          >
            <Download size={13} /> Save as PDF
          </button>
        </div>
  
        <main style={{ maxWidth: "860px", margin: "0 auto", padding: "2.5rem var(--space-content-x, 1.5rem) 4rem" }}>
  
          <div className="brief-header" style={{ borderRadius: "0.875rem", background: accentMuted, border: `1px solid ${accentBorder}`, padding: "2rem 2.25rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1.5rem", flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0.75rem", borderRadius: "99px", background: "hsla(258,55%,68%,0.12)", border: `1px solid ${accentBorder}`, marginBottom: "1rem" }}>
                  <Code2 size={12} color={accentColor} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: accentColor }}>Technical Evaluator Brief</span>
                </div>
                <h1 style={{ fontSize: "clamp(1.5rem,4vw,2.25rem)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: "0.625rem" }}>
                  How is this actually built?
                </h1>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.65, color: "hsl(214,7%,62%)", maxWidth: "52ch" }}>
                  Architecture layers, integration surface, Governance API, Proof Chain, and data handling — documented for engineers and platform architects evaluating the SZL Holdings stack.
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
                  { label: "Platform Architecture", href: "/architecture" },
                  { label: "Security Controls", href: "/trust/security" },
                  { label: "Governance API Docs", href: "/docs/control-plane" },
                  { label: "Proof Chain Docs", href: "/docs/proof-chain" },
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
                Request a technical walkthrough <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </main>
  
        <style>{`@media print { .no-print { display: none !important; } body { background: #fff !important; color: #111 !important; } }`}</style>
      </div>
        </>
  );
}
