import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";

const VENTURES = [
  {
    name: "Alloy",
    type: "Platform / Engine",
    description: "Intelligence and orchestration engine. Powers workflows, signals, outputs, and human-guided decision support across the ecosystem.",
    status: "Live",
    accent: "hsl(214,80%,65%)",
    href: "/alloy/",
  },
  {
    name: "Lyte",
    type: "SaaS Platform",
    description: "Business observability platform. Surfaces risk, latency, ownership gaps, and workflow friction before they hit execution.",
    status: "Live",
    accent: "hsl(190,90%,55%)",
    href: "/lyte-command-center/",
  },
  {
    name: "Vessels",
    type: "SaaS Platform",
    description: "Maritime command platform. Fleet visibility, voyage performance, and operational exception management in one command layer.",
    status: "Live",
    accent: "hsl(205,85%,55%)",
    href: "/vessels/",
  },
  {
    name: "Carlota Jo Consulting",
    type: "Service Brand",
    description: "High-trust, discreet operational and residence support for principals and organizations with complex, high-touch environments.",
    status: "Live",
    accent: "hsl(38,45%,65%)",
    href: "/carlota-jo/",
  },
];

export default function VenturesPage() {
  usePageMeta({
    title: "Ventures — SZL Holdings",
    description: "SZL Holdings portfolio: sovereign platforms built for operational complexity — Alloy, Lyte, Vessels, Firestorm, INCA, Rosie, Dreamscape, and Carlota Jo.",
    canonical: "https://szlholdings.com/ventures",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <Navbar />
      <main className="pt-24">
        <section style={{ padding: "4rem 0 3rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.75rem" }}>
                Ventures
              </p>
              <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: "700", letterSpacing: "-0.025em", color: "hsl(38,12%,94%)", lineHeight: "1.08", marginBottom: "1.25rem" }}>
                The portfolio.
              </h1>
              <p style={{ fontSize: "1rem", lineHeight: "1.7", color: "hsl(210,5%,58%)", maxWidth: "32rem" }}>
                SZL Holdings is the parent ecosystem behind Alloy, Lyte, Vessels, and Carlota Jo. Every entity is built with a defined purpose, a clear role, and zero internal competition.
              </p>
            </m.div>
          </div>
        </section>

        <section style={{ padding: "2rem 0 5rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="space-y-3">
              {VENTURES.map((v, i) => (
                <m.a
                  key={v.name}
                  href={v.href}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.48, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    display: "flex",
                    gap: "1.25rem",
                    alignItems: "center",
                    padding: "1.5rem",
                    borderRadius: "0.875rem",
                    background: "hsla(0,0%,100%,0.025)",
                    border: "1px solid hsla(0,0%,100%,0.06)",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.04)";
                    (e.currentTarget as HTMLElement).style.borderColor = `${v.accent}25`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.025)";
                    (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.06)";
                  }}
                >
                  <div style={{ width: "4px", borderRadius: "2px", alignSelf: "stretch", background: v.accent, flexShrink: 0, opacity: 0.7 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.375rem" }}>
                      <p style={{ fontSize: "15px", fontWeight: "700", color: "hsl(38,12%,92%)", letterSpacing: "-0.008em" }}>{v.name}</p>
                      <span style={{ fontSize: "10px", fontWeight: "500", color: v.accent, letterSpacing: "0.04em" }}>{v.type}</span>
                      <span style={{
                        marginLeft: "auto",
                        fontSize: "10px", fontWeight: "500", padding: "2px 8px", borderRadius: "4px",
                        background: "hsla(152,50%,42%,0.1)", border: "1px solid hsla(152,50%,42%,0.2)", color: "hsl(152,50%,50%)",
                      }}>{v.status}</span>
                    </div>
                    <p style={{ fontSize: "13px", lineHeight: "1.6", color: "hsl(210,5%,55%)" }}>{v.description}</p>
                  </div>
                  <ArrowRight size={14} strokeWidth={2} style={{ color: "hsl(210,5%,38%)", flexShrink: 0 }} />
                </m.a>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
