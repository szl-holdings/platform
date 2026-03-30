import { m } from "framer-motion";

const credibilityBlocks = [
  {
    label: "Capital deployed",
    value: "$180M+",
    description: "Across six operational technology platforms since 2022.",
  },
  {
    label: "Platforms live",
    value: "6",
    description: "Maritime, intelligence, advisory, security, and AI platforms fully operational.",
  },
  {
    label: "Market reach",
    value: "3 continents",
    description: "Clients and operations spanning North America, Europe, and Asia-Pacific.",
  },
  {
    label: "Operational model",
    value: "Founder-led",
    description: "Principals with direct operating accountability across every platform.",
  },
];

export function TrustSection() {
  return (
    <section id="trust" style={{
      background: "hsl(210,12%,5%)",
      paddingTop: "clamp(5rem,9vw,8rem)",
      paddingBottom: "clamp(5rem,9vw,8rem)",
    }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: "clamp(2.5rem,5vw,4rem)" }}
        >
          <span style={{
            display: "block",
            fontSize: "11px",
            fontWeight: "500",
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: "hsl(210,5%,46%)",
            marginBottom: "1rem",
          }}>Credentials</span>
          <h2 style={{
            fontSize: "clamp(1.75rem,3.5vw,2.5rem)",
            fontWeight: "700",
            letterSpacing: "-0.022em",
            lineHeight: "1.12",
            color: "hsl(38,12%,94%)",
            marginBottom: "0.75rem",
          }}>Built for enterprise scale</h2>
          <p style={{ fontSize: "1.0625rem", color: "hsl(210,5%,58%)", lineHeight: "1.65", maxWidth: "36rem" }}>
            SZL Holdings platforms are designed for organisations where reliability, security, and accountability are non-negotiable.
          </p>
        </m.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4" style={{
          background: "hsla(0,0%,100%,0.03)",
          borderRadius: "1rem",
          border: "1px solid hsla(0,0%,100%,0.06)",
          overflow: "hidden",
        }}>
          {credibilityBlocks.map((b, i) => (
            <m.div
              key={b.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              style={{
                padding: "clamp(1.5rem,3vw,2rem)",
                borderRight: i < credibilityBlocks.length - 1 ? "1px solid hsla(0,0%,100%,0.05)" : "none",
              }}
              className={i < 2 ? "sm:border-b sm:border-[hsla(0,0%,100%,0.05)] lg:border-b-0" : ""}
            >
              <p style={{
                fontSize: "11px",
                fontWeight: "500",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "hsl(210,5%,40%)",
                marginBottom: "0.75rem",
              }}>{b.label}</p>
              <p style={{
                fontSize: "clamp(1.75rem,3.5vw,2.25rem)",
                fontWeight: "700",
                letterSpacing: "-0.025em",
                lineHeight: "1.1",
                color: "hsl(38,12%,94%)",
                marginBottom: "0.625rem",
              }}>{b.value}</p>
              <p style={{
                fontSize: "0.875rem",
                color: "hsl(210,5%,52%)",
                lineHeight: "1.58",
              }}>{b.description}</p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
