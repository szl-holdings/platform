import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface EcosystemSummary {
  lyte: { incidents: number };
  vessels: { trackedVessels: number; fleets: number };
  aegis: { incidents: number; findings: number };
  terra: { distressProperties: number; activeDeals: number };
  carlotaJo: { inquiries: number };
}

const PLATFORM_DEFS = [
  {
    name: "Lyte",
    label: "Operational Decision Intelligence",
    copy: "See risk, latency, ownership gaps, and workflow friction before they hit execution.",
    cta: "Explore Lyte",
    href: "/command/operations/",
    accent: "hsl(190,90%,50%)",
    accentRgb: "14,188,212",
    accentBg: "hsla(190,90%,50%,0.05)",
    accentBorder: "hsla(190,90%,50%,0.12)",
    key: "lyte" as const,
    getMetrics: (d: EcosystemSummary) => [
      { label: "Active Incidents", value: d.lyte.incidents.toLocaleString() },
    ],
    fallbackMetrics: [
      { label: "Observability", value: "Live" },
    ],
  },
  {
    name: "Vessels",
    label: "Maritime Intelligence Platform",
    copy: "Turn fleet visibility, voyage performance, and operational exceptions into command.",
    cta: "Explore Vessels",
    href: "/vessels/",
    accent: "hsl(205,85%,55%)",
    accentRgb: "38,155,212",
    accentBg: "hsla(205,85%,55%,0.05)",
    accentBorder: "hsla(205,85%,55%,0.12)",
    key: "vessels" as const,
    getMetrics: (d: EcosystemSummary) => [
      { label: "Tracked Vessels", value: d.vessels.trackedVessels.toLocaleString() },
      { label: "Fleets", value: d.vessels.fleets.toLocaleString() },
    ],
    fallbackMetrics: [
      { label: "Fleet Tracking", value: "Live" },
      { label: "Maritime Command", value: "Active" },
    ],
  },
  {
    name: "Aegis",
    label: "Unified Defense & Intelligence Command",
    copy: "Security operations, managed services, and AI intelligence in one unified platform. SOC command, XDR, MSP ops, and agentic cortex.",
    cta: "Enter Aegis",
    href: "/aegis/",
    accent: "hsl(232,68%,60%)",
    accentRgb: "99,102,241",
    accentBg: "hsla(232,68%,60%,0.05)",
    accentBorder: "hsla(232,68%,60%,0.12)",
    key: "aegis" as const,
    getMetrics: (d: EcosystemSummary) => [
      { label: "Open Findings", value: d.aegis.findings.toLocaleString() },
      { label: "Incidents", value: d.aegis.incidents.toLocaleString() },
    ],
    fallbackMetrics: [
      { label: "SOC Command", value: "Live" },
      { label: "XDR", value: "Active" },
    ],
  },
  {
    name: "Terra",
    label: "Real Estate Intelligence Platform",
    copy: "Distress property tracking, deal pipeline management, ownership intelligence, and NYC market data for serious operators.",
    cta: "Explore Terra",
    href: "/terra/",
    accent: "hsl(88,42%,44%)",
    accentRgb: "85,140,48",
    accentBg: "hsla(88,42%,44%,0.05)",
    accentBorder: "hsla(88,42%,44%,0.12)",
    key: "terra" as const,
    getMetrics: (d: EcosystemSummary) => [
      { label: "Distress Properties", value: d.terra.distressProperties.toLocaleString() },
      { label: "Active Deals", value: d.terra.activeDeals.toLocaleString() },
    ],
    fallbackMetrics: [
      { label: "Distress Engine", value: "Live" },
      { label: "Deal Pipeline", value: "Active" },
    ],
  },
  {
    name: "Carlota Jo",
    label: "Private Advisory & Residential Support",
    copy: "A refined advisory brand for high-trust private client operations.",
    cta: "Explore Carlota Jo",
    href: "/carlota-jo/",
    accent: "hsl(38,55%,58%)",
    accentRgb: "191,152,82",
    accentBg: "hsla(38,55%,58%,0.05)",
    accentBorder: "hsla(38,55%,58%,0.12)",
    key: "carlotaJo" as const,
    getMetrics: (d: EcosystemSummary) => [
      { label: "Client Inquiries", value: d.carlotaJo.inquiries.toLocaleString() },
    ],
    fallbackMetrics: [
      { label: "Advisory", value: "Live" },
    ],
  },
];

export function FeaturedPlatforms() {
  const [summary, setSummary] = useState<EcosystemSummary | null>(null);

  useEffect(() => {
    fetch("/api/holdings/ecosystem-summary")
      .then((r) => r.json())
      .then((d) => setSummary(d))
      .catch(() => {});
  }, []);

  return (
    <section
      id="platforms"
      style={{
        padding: "7rem 0 6rem",
        background: "hsl(210,12%,5%)",
        borderTop: "1px solid hsla(0,0%,100%,0.04)",
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <p style={{
            fontSize: "10px",
            fontWeight: "600",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "hsl(210,5%,40%)",
            marginBottom: "0.75rem",
            fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
          }}>
            Featured Platforms
          </p>
          <h2 style={{
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            fontWeight: "700",
            letterSpacing: "-0.026em",
            color: "hsl(38,12%,94%)",
            lineHeight: "1.06",
            fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
          }}>
            Five platforms. One architecture.
          </h2>
        </m.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORM_DEFS.map((p, i) => {
            const metrics = summary ? p.getMetrics(summary) : p.fallbackMetrics;
            return (
              <m.div
                key={p.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <a
                  href={p.href}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: p.accentBg,
                    border: `1px solid ${p.accentBorder}`,
                    borderRadius: "6px",
                    padding: "1.75rem",
                    textDecoration: "none",
                    transition: "all 0.22s ease",
                    height: "100%",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = `rgba(${p.accentRgb}, 0.07)`;
                    el.style.borderColor = `rgba(${p.accentRgb}, 0.26)`;
                    el.style.boxShadow = `0 0 22px rgba(${p.accentRgb}, 0.09), 0 8px 28px rgba(0,0,0,0.32)`;
                    el.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = p.accentBg;
                    el.style.borderColor = p.accentBorder;
                    el.style.boxShadow = "none";
                    el.style.transform = "translateY(0)";
                  }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <span style={{
                      fontSize: "10px",
                      fontWeight: "600",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: p.accent,
                      opacity: 0.85,
                      fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                    }}>
                      {p.name}
                    </span>
                    <span style={{
                      fontSize: "9.5px",
                      fontWeight: "600",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "hsl(142,62%,46%)",
                      background: "hsla(142,62%,46%,0.10)",
                      border: "1px solid hsla(142,62%,46%,0.18)",
                      padding: "2px 7px",
                      borderRadius: "3px",
                      fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
                    }}>
                      Live
                    </span>
                  </div>

                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: "hsl(38,12%,86%)",
                      marginBottom: "0.5rem",
                      letterSpacing: "-0.012em",
                      lineHeight: "1.3",
                      fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                    }}>
                      {p.label}
                    </p>
                    <p style={{
                      fontSize: "12.5px",
                      lineHeight: "1.6",
                      color: "hsl(210,5%,52%)",
                      marginBottom: "1.25rem",
                    }}>
                      {p.copy}
                    </p>
                  </div>

                  {metrics.length > 0 && (
                    <div style={{ display: "flex", gap: "1.25rem", marginBottom: "1.25rem", paddingTop: "0.875rem", borderTop: "1px solid hsla(0,0%,100%,0.05)" }}>
                      {metrics.map((m) => (
                        <div key={m.label}>
                          <p style={{ fontSize: "1.125rem", fontWeight: 800, color: p.accent, letterSpacing: "-0.04em", lineHeight: 1, fontFamily: "'Space Grotesk', system-ui" }}>
                            {m.value}
                          </p>
                          <p style={{ fontSize: "9.5px", color: "hsl(210,5%,44%)", marginTop: "0.2rem", letterSpacing: "0.02em" }}>{m.label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5" style={{ color: p.accent, fontSize: "12.5px", fontWeight: "600", letterSpacing: "-0.003em" }}>
                    {p.cta}
                    <ArrowRight size={13} strokeWidth={2.5} />
                  </div>
                </a>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
