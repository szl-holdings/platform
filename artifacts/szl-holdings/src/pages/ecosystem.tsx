import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";

const brands = [
  {
    name: "SZL Holdings",
    role: "Parent Brand / Ecosystem Authority",
    description: "The masterbrand and operating philosophy behind every entity in the ecosystem. Sets standards, defines the system, and holds the structure together.",
    accent: "hsl(210,10%,60%)",
    status: "Active",
    href: "/",
  },
  {
    name: "Alloy",
    role: "Intelligence & Orchestration Engine",
    description: "The systems engine powering workflows, signals, outputs, and human-guided execution across every platform in the ecosystem. Not a product — the backbone.",
    accent: "hsl(214,80%,65%)",
    status: "Live",
    href: "/alloy/",
  },
  {
    name: "Lyte",
    role: "Business Observability Platform",
    description: "See risk, latency, ownership gaps, and workflow friction before they hit execution. Role-based command for executive, operations, and delivery views.",
    accent: "hsl(190,90%,55%)",
    status: "Live",
    href: "/lyte-command-center/",
  },
  {
    name: "Vessels",
    role: "Maritime Command Platform",
    description: "Turn fleet visibility, voyage performance, and operational exceptions into command. Connects movement to consequence.",
    accent: "hsl(205,85%,55%)",
    status: "Live",
    href: "/vessels/",
  },
  {
    name: "Carlota Jo Consulting",
    role: "Premium Service Brand",
    description: "Discreet, white-glove operational and residence support for high-touch environments. Quietly structured. Precisely executed.",
    accent: "hsl(38,45%,65%)",
    status: "Live",
    href: "/carlota-jo/",
  },
  {
    name: "Stephen Lutar",
    role: "Founder / Operator",
    description: "Builder, operator, and systems thinker. The founder who built the ecosystem, designed the platforms, and operates the system.",
    accent: "hsl(210,8%,56%)",
    status: "Active",
    href: "/stephen/",
  },
];

const internal = [
  {
    name: "Lyte Readiness",
    role: "Module under Lyte",
    description: "Project execution readiness tracking as a first-class Lyte module. Not a standalone product.",
    accent: "hsl(190,90%,55%)",
  },
  {
    name: "Alloy — Predictive Intelligence",
    role: "Internal / Alloy Capability",
    description: "Predictive intelligence is a core embedded capability within Alloy. No separate public presence.",
    accent: "hsl(214,80%,65%)",
  },
];

export default function EcosystemPage() {
  usePageMeta({
    title: "Ecosystem — SZL Holdings",
    description: "The full SZL Holdings ecosystem: Alloy, Beacon, Lyte, Vessels, Firestorm, INCA, Rosie, Carlota Jo, and Dreamscape. One operating philosophy. Multiple sovereign platforms.",
    canonical: "https://szlholdings.com/ecosystem",
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
                Ecosystem
              </p>
              <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: "700", letterSpacing: "-0.025em", color: "hsl(38,12%,94%)", lineHeight: "1.08", marginBottom: "1.25rem" }}>
                One masterbrand. One engine.<br />Two flagships. One service brand.
              </h1>
              <p style={{ fontSize: "1rem", lineHeight: "1.7", color: "hsl(210,5%,58%)", maxWidth: "36rem" }}>
                The SZL ecosystem is built around a clear hierarchy — every entity has a defined role, and nothing competes with anything else.
              </p>
            </m.div>
          </div>
        </section>

        <section style={{ padding: "2rem 0 5rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="space-y-3">
              {brands.map((b, i) => (
                <m.a
                  key={b.name}
                  href={b.href}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.48, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    display: "flex",
                    gap: "1.5rem",
                    alignItems: "center",
                    padding: "1.375rem 1.5rem",
                    borderRadius: "0.875rem",
                    background: "hsla(0,0%,100%,0.025)",
                    border: "1px solid hsla(0,0%,100%,0.06)",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.04)";
                    (e.currentTarget as HTMLElement).style.borderColor = `${b.accent}25`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.025)";
                    (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.06)";
                  }}
                >
                  <div style={{ width: "4px", borderRadius: "2px", alignSelf: "stretch", background: b.accent, flexShrink: 0, opacity: 0.7 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.375rem" }}>
                      <p style={{ fontSize: "15px", fontWeight: "700", color: "hsl(38,12%,92%)", letterSpacing: "-0.008em" }}>{b.name}</p>
                      <span style={{
                        fontSize: "10px", fontWeight: "500", padding: "2px 8px", borderRadius: "4px",
                        background: "hsla(152,50%,42%,0.1)", border: "1px solid hsla(152,50%,42%,0.2)", color: "hsl(152,50%,50%)",
                      }}>{b.status}</span>
                    </div>
                    <p style={{ fontSize: "11.5px", fontWeight: "500", color: b.accent, marginBottom: "0.4rem", letterSpacing: "0.02em" }}>{b.role}</p>
                    <p style={{ fontSize: "12.5px", lineHeight: "1.58", color: "hsl(210,5%,54%)", maxWidth: "40rem" }}>{b.description}</p>
                  </div>
                  <ArrowRight size={14} strokeWidth={2} style={{ color: "hsl(210,5%,38%)", flexShrink: 0 }} />
                </m.a>
              ))}
            </div>

            <div style={{ marginTop: "3rem" }}>
              <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,38%)", marginBottom: "1rem" }}>
                Absorbed / Internal — Not public
              </p>
              <div className="space-y-2">
                {internal.map((b, i) => (
                  <m.div
                    key={b.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      display: "flex",
                      gap: "1rem",
                      padding: "1rem 1.25rem",
                      borderRadius: "0.75rem",
                      background: "hsla(0,0%,100%,0.015)",
                      border: "1px solid hsla(0,0%,100%,0.04)",
                    }}
                  >
                    <div style={{ width: "3px", borderRadius: "2px", alignSelf: "stretch", background: b.accent, flexShrink: 0, opacity: 0.4 }} />
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: "600", color: "hsl(38,12%,75%)", marginBottom: "0.2rem" }}>{b.name}</p>
                      <p style={{ fontSize: "11px", color: "hsl(210,5%,40%)", marginBottom: "0.3rem" }}>{b.role}</p>
                      <p style={{ fontSize: "12px", lineHeight: "1.55", color: "hsl(210,5%,44%)" }}>{b.description}</p>
                    </div>
                  </m.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
