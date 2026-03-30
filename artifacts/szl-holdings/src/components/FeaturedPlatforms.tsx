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
    accentBg: "hsla(190,90%,50%,0.06)",
    accentBorder: "hsla(190,90%,50%,0.14)",
    status: "Live",
  },
  {
    name: "Vessels",
    label: "Maritime Command Platform",
    copy: "Turn fleet visibility, voyage performance, and operational exceptions into command.",
    cta: "Explore Vessels",
    href: "/vessels/",
    accent: "hsl(205,85%,55%)",
    accentBg: "hsla(205,85%,55%,0.06)",
    accentBorder: "hsla(205,85%,55%,0.14)",
    status: "Live",
  },
  {
    name: "Carlota Jo Consulting",
    label: "High-Trust Service Brand",
    copy: "Discreet operational and residence support for high-touch environments.",
    cta: "Explore Carlota Jo",
    href: "/carlota-jo/",
    accent: "hsl(38,45%,65%)",
    accentBg: "hsla(38,45%,65%,0.06)",
    accentBorder: "hsla(38,45%,65%,0.14)",
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
          <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.75rem" }}>
            Featured Platforms
          </p>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: "700", letterSpacing: "-0.022em", color: "hsl(38,12%,94%)", lineHeight: "1.1" }}>
            Two flagships. One service brand.
          </h2>
        </m.div>

        <div className="grid md:grid-cols-3 gap-5">
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
                  display: "block",
                  background: p.accentBg,
                  border: `1px solid ${p.accentBorder}`,
                  borderRadius: "0.875rem",
                  padding: "1.75rem",
                  textDecoration: "none",
                  transition: "all 0.22s ease",
                  height: "100%",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = `hsla(0,0%,100%,0.04)`;
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px hsla(0,0%,0%,0.28)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = p.accentBg;
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span style={{
                    fontSize: "10px",
                    fontWeight: "600",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: p.accent,
                  }}>
                    {p.label}
                  </span>
                  <span style={{
                    fontSize: "10px",
                    fontWeight: "500",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: "hsla(152,50%,42%,0.1)",
                    border: "1px solid hsla(152,50%,42%,0.2)",
                    color: "hsl(152,50%,50%)",
                    letterSpacing: "0.04em",
                  }}>
                    {p.status}
                  </span>
                </div>

                <h3 style={{ fontSize: "1.25rem", fontWeight: "700", letterSpacing: "-0.016em", color: "hsl(38,12%,94%)", marginBottom: "0.75rem", lineHeight: "1.2" }}>
                  {p.name}
                </h3>

                <p style={{ fontSize: "0.875rem", lineHeight: "1.6", color: "hsl(210,5%,58%)", marginBottom: "1.5rem" }}>
                  {p.copy}
                </p>

                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12.5px",
                  fontWeight: "500",
                  color: p.accent,
                  letterSpacing: "-0.003em",
                }}>
                  {p.cta}
                  <ArrowRight size={12} strokeWidth={2.5} />
                </div>
              </a>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
