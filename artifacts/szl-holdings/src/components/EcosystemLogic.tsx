import { m } from "framer-motion";

const tiers = [
  {
    entity: "SZL Holdings",
    role: "Parent brand. Ecosystem authority. Sets standards, holds the system together, and defines the operating philosophy.",
    accent: "hsl(210,10%,60%)",
  },
  {
    entity: "Alloy",
    role: "Systems and orchestration engine. Powers every platform. Handles signal ingestion, workflow execution, output generation, and governance.",
    accent: "hsl(214,80%,65%)",
  },
  {
    entity: "Lyte",
    role: "Business observability platform. Surfaces risk, latency, ownership gaps, and workflow friction before they hit execution.",
    accent: "hsl(190,90%,55%)",
  },
  {
    entity: "Vessels",
    role: "Maritime command platform. Connects fleet visibility, voyage performance, and operational exceptions in one operational layer.",
    accent: "hsl(205,85%,55%)",
  },
  {
    entity: "Carlota Jo Consulting",
    role: "Premium service brand. High-trust, discreet operational and residence support for high-touch environments.",
    accent: "hsl(38,45%,65%)",
  },
];

export function EcosystemLogic() {
  return (
    <section
      id="ecosystem"
      style={{
        padding: "6rem 0",
        background: "hsl(210,12%,6%)",
        borderTop: "1px solid hsla(0,0%,100%,0.04)",
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-[1fr,520px] gap-16 lg:gap-24 items-start">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.75rem" }}>
              How the Ecosystem Works
            </p>
            <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: "700", letterSpacing: "-0.022em", color: "hsl(38,12%,94%)", lineHeight: "1.1", marginBottom: "1.5rem" }}>
              One discipline. Every command surface.
            </h2>
            <p style={{ fontSize: "0.9375rem", lineHeight: "1.7", color: "hsl(210,5%,58%)", maxWidth: "28rem" }}>
              Together, they form one disciplined ecosystem built around visibility, action, and premium execution.
            </p>
          </m.div>

          <div className="space-y-3">
            {tiers.map((tier, i) => (
              <m.div
                key={tier.entity}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display: "flex",
                  gap: "1rem",
                  padding: "1.125rem 1.25rem",
                  borderRadius: "0.75rem",
                  background: "hsla(0,0%,100%,0.025)",
                  border: "1px solid hsla(0,0%,100%,0.06)",
                }}
              >
                <div style={{
                  width: "4px",
                  borderRadius: "2px",
                  background: tier.accent,
                  flexShrink: 0,
                  opacity: 0.7,
                }} />
                <div>
                  <p style={{ fontSize: "13px", fontWeight: "600", color: "hsl(38,12%,88%)", marginBottom: "0.25rem", letterSpacing: "-0.005em" }}>
                    {tier.entity}
                  </p>
                  <p style={{ fontSize: "12.5px", lineHeight: "1.6", color: "hsl(210,5%,54%)" }}>
                    {tier.role}
                  </p>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
