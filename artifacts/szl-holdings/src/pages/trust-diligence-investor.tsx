import { useEffect } from "react";
import { Link } from "wouter";
import { BarChart2, Download, ArrowLeft, Layers, ShieldCheck, TrendingUp, Lock, ArrowRight } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { analytics } from "@/lib/analytics";

const SECTIONS = [
  {
    icon: Layers,
    title: "Architecture Moat",
    items: [
      "KORA + FORGE is a vertically-integrated agentic AI stack — not a thin wrapper on a foundation model",
      "Domain pack architecture creates compounding depth: each vertical (Legal, Maritime, Real Estate, Defense) deepens independently",
      "Digital twin layer enables state modeling that competitors cannot replicate without equivalent data history",
      "Proof Chain provides tamper-evident decision lineage — a structural compliance advantage in regulated markets",
      "Governance API and governed inference layer are proprietary — not off-the-shelf middleware",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Governance as Competitive Advantage",
    items: [
      "HITL-first architecture enables deployment in regulated environments that exclude autonomous AI products",
      "Configurable approval gates make the platform compliant by default, not by configuration",
      "Audit-grade decision trail is designed for LP reporting, regulatory inquiry, and Board-level accountability",
      "Operating doctrine is documented and externally verifiable — not a sales narrative",
    ],
  },
  {
    icon: TrendingUp,
    title: "Operating Doctrine",
    items: [
      "Platform is built for enterprise operating environments: legal, maritime, defense, and real estate",
      "Multi-tenant architecture enables rapid vertical expansion without per-customer infrastructure cost",
      "Domain packs are modular — each new vertical deploys on proven governance rails",
      "Export and connector surface enables seamless integration into existing enterprise workflows",
    ],
  },
  {
    icon: Lock,
    title: "Defensibility Factors",
    items: [
      "Regulatory moat: HITL gates and proof chain are required features for enterprise AI in legal and defense — hard to retrofit",
      "Data isolation architecture prevents co-mingling — a prerequisite for enterprise contracts in sensitive verticals",
      "Decision lineage exportability creates switching cost — organizations build workflows on top of audit trail",
      "Operating doctrine is embedded in the codebase, not just in the pitch — technical diligence validates it",
    ],
  },
];

const KEY_QUESTIONS = [
  { q: "What makes this defensible?", a: "Architecture depth (Proof Chain, governed inference layer, domain packs), regulatory moat in HITL-first design, and compounding data advantage across verticals." },
  { q: "Why can't incumbents copy this?", a: "Legacy enterprise software cannot retrofit audit-grade AI governance without rebuilding core data and workflow layers. This was designed HITL-first." },
  { q: "What is the expansion thesis?", a: "Each domain pack deploys on shared governance rails. Legal, Maritime, Real Estate, and Defense are live; additional verticals are additive, not multiplicative in cost." },
  { q: "Where is the audit-grade governance?", a: "Proof Chain, decision lineage export, and override logging are architectural — present in every deployment, not configurable off." },
];

export default function DiligenceInvestorPage() {
  const __pageMeta = usePageMeta({
    title: "Investor Diligence Brief — SZL Holdings",
    description: "One-page architecture moat, governance defensibility, and operating doctrine brief for investors evaluating SZL Holdings.",
    canonical: "https://szlholdings.com/trust/diligence/investor",
  });

  useEffect(() => {
    analytics.diligenceBriefView('investor');
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "print-override";
    style.textContent = `
      @media print {
        .no-print { display: none !important; }
        body { background: #fff !important; color: #111 !important; }
        .brief-card { break-inside: avoid; border: 1px solid #e2e8f0 !important; background: #f8fafc !important; }
        a { color: #92400e !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById("print-override")?.remove(); };
  }, []);

  const accentColor = "hsl(40,90%,54%)";
  const accentMuted = "hsla(40,90%,54%,0.07)";
  const accentBorder = "hsla(40,90%,54%,0.22)";

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <div className="no-print" style={{ borderBottom: "1px solid hsla(214,12%,18%,0.8)", padding: "1rem var(--space-content-x, 1.5rem)", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "1280px", margin: "0 auto" }}>
          <Link href="/trust#evaluators" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: accentColor, textDecoration: "none" }}>
            <ArrowLeft size={13} /> Back to Trust Center
          </Link>
          <button
            onClick={() => { analytics.diligenceBriefDownload('investor'); window.print(); }}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "0.5rem", background: accentColor, color: "#000", border: "none", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}
          >
            <Download size={13} /> Save as PDF
          </button>
        </div>
  
        <main style={{ maxWidth: "860px", margin: "0 auto", padding: "2.5rem var(--space-content-x, 1.5rem) 4rem" }}>
  
          <div style={{ borderRadius: "0.875rem", background: accentMuted, border: `1px solid ${accentBorder}`, padding: "2rem 2.25rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1.5rem", flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0.75rem", borderRadius: "99px", background: "hsla(40,90%,54%,0.12)", border: `1px solid ${accentBorder}`, marginBottom: "1rem" }}>
                  <BarChart2 size={12} color={accentColor} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: accentColor }}>Investor Brief</span>
                </div>
                <h1 style={{ fontSize: "clamp(1.5rem,4vw,2.25rem)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: "0.625rem" }}>
                  What makes this defensible?
                </h1>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.65, color: "hsl(214,7%,62%)", maxWidth: "52ch" }}>
                  Architecture moat, operating doctrine, audit-grade governance, and the thesis behind the platform — for investors and strategic evaluators who need to understand the structural advantage.
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
                  { label: "Architecture Defensibility", href: "/architecture" },
                  { label: "Operating Doctrine", href: "/operating-doctrine" },
                  { label: "Investor Relations", href: "/investor-relations" },
                  { label: "Governance Audit Trail", href: "/trust/governance" },
                  { label: "Trust Center", href: "/trust" },
                ].map((l) => (
                  <Link key={l.href} href={l.href} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: accentColor, textDecoration: "none", padding: "0.25rem 0.625rem", borderRadius: "0.375rem", border: `1px solid ${accentBorder}`, background: accentMuted }}>
                    <ArrowRight size={10} />{l.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="no-print">
              <Link href="/investor-relations" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 1rem", borderRadius: "0.5rem", background: accentColor, color: "#000", textDecoration: "none", fontSize: "0.8125rem", fontWeight: 600 }}>
                Investor relations <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </main>
  
        <style>{`@media print { .no-print { display: none !important; } body { background: #fff !important; color: #111 !important; } }`}</style>
      </div>
        </>
  );
}
