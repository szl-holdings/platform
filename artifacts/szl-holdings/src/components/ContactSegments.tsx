import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

const segments = [
  {
    audience: "Investors / Partners",
    headline: "Ecosystem-level conversations",
    body: "Strategic partnership, capital conversations, and ecosystem integration opportunities across the SZL portfolio.",
    type: "partner",
  },
  {
    audience: "Clients",
    headline: "Platform demos and pilot programs",
    body: "Product demonstrations, pilot programs, and enterprise deployments for Lyte and Vessels.",
    type: "client",
  },
  {
    audience: "Service Clients",
    headline: "Carlota Jo — operational support",
    body: "Discreet, high-trust operational and residence support for high-touch environments.",
    type: "client",
  },
  {
    audience: "Recruiters",
    headline: "Executive and strategic roles",
    body: "Executive search, advisory engagements, and strategic recruiting aligned to the ecosystem.",
    type: "recruiter",
  },
];

export function ContactSegments() {
  return (
    <section
      id="contact"
      style={{
        padding: "6rem 0",
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
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10"
        >
          <div>
            <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.75rem" }}>
              Start the Right Conversation
            </p>
            <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: "700", letterSpacing: "-0.022em", color: "hsl(38,12%,94%)", lineHeight: "1.1" }}>
              Four paths. Choose yours.
            </h2>
          </div>
          <Link
            href="/contact"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: "500",
              color: "hsl(210,5%,60%)",
              textDecoration: "none",
              transition: "all 0.18s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,94%)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,60%)";
            }}
          >
            Start a Conversation
            <ArrowRight size={13} strokeWidth={2.5} />
          </Link>
        </m.div>

        <div className="grid sm:grid-cols-2 gap-4">
          {segments.map((s, i) => (
            <m.div
              key={s.audience}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.48, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={`/contact?type=${s.type}`}
                style={{
                  display: "block",
                  textDecoration: "none",
                  padding: "1.5rem",
                  borderRadius: "0.875rem",
                  background: "hsla(0,0%,100%,0.025)",
                  border: "1px solid hsla(0,0%,100%,0.06)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.04)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.025)";
                }}
              >
                <p style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "0.625rem" }}>
                  {s.audience}
                </p>
                <p style={{ fontSize: "14px", fontWeight: "600", color: "hsl(38,12%,88%)", marginBottom: "0.5rem", letterSpacing: "-0.005em" }}>
                  {s.headline}
                </p>
                <p style={{ fontSize: "12.5px", lineHeight: "1.6", color: "hsl(210,5%,54%)" }}>
                  {s.body}
                </p>
              </Link>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
