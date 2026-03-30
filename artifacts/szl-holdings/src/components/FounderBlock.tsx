import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export function FounderBlock() {
  return (
    <section
      style={{
        padding: "6rem 0",
        background: "hsl(210,12%,6%)",
        borderTop: "1px solid hsla(0,0%,100%,0.04)",
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="max-w-[760px]">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.75rem" }}>
              Built by an Operator
            </p>
            <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: "700", letterSpacing: "-0.022em", color: "hsl(38,12%,94%)", lineHeight: "1.12", marginBottom: "1.25rem" }}>
              Stephen Lutar builds systems that connect visibility, execution, and operating discipline.
            </h2>
            <p style={{ fontSize: "0.9375rem", lineHeight: "1.72", color: "hsl(210,5%,58%)", marginBottom: "2rem", maxWidth: "32rem" }}>
              From observability and workflow design to product architecture and execution systems, Stephen's work sits at the intersection of business clarity, technical structure, and command-centered thinking.
            </p>
            <Link
              href="/founder"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontWeight: "500",
                color: "hsl(210,5%,60%)",
                textDecoration: "none",
                transition: "all 0.18s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,94%)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,60%)";
              }}
            >
              Meet the Founder
              <ArrowRight size={13} strokeWidth={2.5} />
            </Link>
          </m.div>
        </div>
      </div>
    </section>
  );
}
