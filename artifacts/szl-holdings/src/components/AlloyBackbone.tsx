import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";

const capabilities = [
  { label: "Signal Ingestion", desc: "Cross-platform data acquisition from operational, financial, and environmental sources." },
  { label: "Workflow Orchestration", desc: "Multi-step process sequencing with conditional logic and dependency resolution." },
  { label: "Action Routing", desc: "Intelligent distribution of tasks to the right person, system, or workflow queue." },
  { label: "Output Generation", desc: "Structured reports, briefs, and automated workflows produced from raw signal." },
  { label: "Human Approval", desc: "Built-in governance checkpoints that keep humans in the loop on high-stakes decisions." },
];

export function AlloyBackbone() {
  return (
    <section
      id="alloy"
      style={{
        padding: "6rem 0",
        background: "hsl(210,12%,5%)",
        borderTop: "1px solid hsla(0,0%,100%,0.04)",
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-[480px,1fr] gap-16 lg:gap-24 items-start">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(214,60%,58%)", marginBottom: "0.75rem" }}>
              Powered by Alloy
            </p>
            <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: "700", letterSpacing: "-0.022em", color: "hsl(38,12%,94%)", lineHeight: "1.1", marginBottom: "1.25rem" }}>
              The intelligence and orchestration layer.
            </h2>
            <p style={{ fontSize: "0.9375rem", lineHeight: "1.7", color: "hsl(210,5%,58%)", marginBottom: "2rem" }}>
              Alloy is the intelligence and orchestration layer powering workflows, signals, outputs, and decision support across the SZL ecosystem.
            </p>
            <a
              href="/alloy/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontWeight: "500",
                color: "hsl(214,80%,65%)",
                textDecoration: "none",
                transition: "all 0.18s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "hsl(214,80%,75%)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "hsl(214,80%,65%)";
              }}
            >
              View Architecture
              <ArrowRight size={13} strokeWidth={2.5} />
            </a>
          </m.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {capabilities.map((cap, i) => (
              <m.div
                key={cap.label}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.48, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display: "flex",
                  gap: "0.875rem",
                  padding: "1rem 1.125rem",
                  borderRadius: "0.625rem",
                  background: "hsla(214,60%,58%,0.05)",
                  border: "1px solid hsla(214,60%,58%,0.1)",
                }}
              >
                <div style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "hsl(214,80%,65%)",
                  flexShrink: 0,
                  marginTop: "5px",
                  opacity: 0.8,
                }} />
                <div>
                  <p style={{ fontSize: "12.5px", fontWeight: "600", color: "hsl(38,12%,88%)", marginBottom: "0.2rem", letterSpacing: "-0.003em" }}>
                    {cap.label}
                  </p>
                  <p style={{ fontSize: "12px", lineHeight: "1.55", color: "hsl(210,5%,52%)" }}>
                    {cap.desc}
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
