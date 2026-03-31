import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";

const platforms = [
  {
    name: "Lyte",
    label: "Business Observability Platform",
    copy: "See risk, latency, ownership gaps, and workflow friction before they hit execution.",
    cta: "Explore Lyte",
    href: "/lyte-command-center/",
    accent: "hsl(190,90%,50%)",
    accentRgb: "14,188,212",
    accentBg: "hsla(190,90%,50%,0.05)",
    accentBorder: "hsla(190,90%,50%,0.12)",
    status: "Live",
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
    status: "Live",
  },
  {
    name: "Aegis",
    label: "Unified Defense & Intelligence Command",
    copy: "Security operations, managed services, and AI intelligence in one unified platform. SOC command, XDR, MSP ops, model registry, and agentic cortex.",
    cta: "Enter Aegis",
    href: "/firestorm/",
    accent: "hsl(232,68%,60%)",
    accentRgb: "99,102,241",
    accentBg: "hsla(232,68%,60%,0.05)",
    accentBorder: "hsla(232,68%,60%,0.12)",
    status: "Live",
  },
  {
    name: "Alloy",
    label: "Workflow & Intelligence Engine",
    copy: "Normalize signals, orchestrate multi-step workflows, generate artifacts, and govern approvals across the SZL ecosystem.",
    cta: "Explore Alloy",
    href: "/alloy/",
    accent: "hsl(214,80%,65%)",
    accentRgb: "92,155,228",
    accentBg: "hsla(214,80%,65%,0.05)",
    accentBorder: "hsla(214,80%,65%,0.12)",
    status: "Live",
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
    status: "Live",
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
    status: "Live",
  },
];

export function FeaturedPlatforms() {
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
            Six platforms. One architecture.
          </h2>
        </m.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {platforms.map((p, i) => (
            <m.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
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
                    {p.status}
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
                    marginBottom: "1.5rem",
                  }}>
                    {p.copy}
                  </p>
                </div>

                <div className="flex items-center gap-1.5" style={{ color: p.accent, fontSize: "12.5px", fontWeight: "600", letterSpacing: "-0.003em" }}>
                  {p.cta}
                  <ArrowRight size={13} strokeWidth={2.5} />
                </div>
              </a>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
