import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, ExternalLink } from "lucide-react";
import { FounderLayout } from "./FounderLayout";
import { registry } from "@szl-holdings/brand-registry";

const THESIS_POINTS = [
  {
    number: "01",
    headline: "The gap between signal and action is where value dies",
    body: "Every organization has more operational data than it can act on. The bottleneck is not intelligence — it's conversion: turning a signal into a structured recommendation in the hands of the person who can do something about it, in the window where action is still possible.",
  },
  {
    number: "02",
    headline: "Governance is an architectural property, not a feature",
    body: "You cannot bolt governance onto an autonomous system. It has to be structural: AI agents advise, humans confirm, the proof chain records everything. This is not a compliance posture — it's the engineering requirement that makes enterprise AI deployable.",
  },
  {
    number: "03",
    headline: "One fabric beneath multiple verticals compounds the advantage",
    body: "Alloy is the shared execution spine. Every improvement to the fabric benefits every vertical simultaneously. This is not an efficiency measure — it's a strategic property. The portfolio gets stronger with every product added, not weaker.",
  },
  {
    number: "04",
    headline: "Architecture before go-to-market, every time",
    body: "The temptation in startup building is to optimize for the appearance of traction. I've done the opposite: build the architecture right, build the proof, then scale on evidence. Slower at first. Much harder to replicate.",
  },
];

const QUICK_LINKS = [
  { href: "/founder/doctrine", label: "Read the doctrine" },
  { href: "/founder/architecture", label: "Explore the architecture" },
  { href: "/founder/essays", label: "Essays & memos" },
  { href: "/founder/design-partner", label: "Become a design partner" },
];

export default function FounderHome() {
  const { founder, metrics } = registry;

  return (
    <FounderLayout>
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "clamp(5rem, 10vw, 9rem) clamp(1.5rem, 5vw, 3rem) clamp(4rem, 8vw, 6rem)",
        }}
      >
        <m.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              marginBottom: "2rem",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "hsl(38, 52%, 58%)",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: "0.8125rem",
                color: "hsl(214, 6%, 57%)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              Founder & CEO, SZL Holdings
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: "clamp(2.5rem, 7vw, 5.5rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "hsl(38, 8%, 95%)",
              marginBottom: "2rem",
              maxWidth: "14ch",
            }}
          >
            Stephen
            <br />
            Lutar.
          </h1>

          <p
            style={{
              fontSize: "clamp(1.0625rem, 2vw, 1.25rem)",
              lineHeight: 1.65,
              color: "hsl(214, 6%, 57%)",
              maxWidth: "56ch",
              marginBottom: "3rem",
            }}
          >
            {founder.longBio}
          </p>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {QUICK_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    padding: "0.625rem 1.25rem",
                    borderRadius: "8px",
                    border: "1px solid hsla(0,0%,100%,0.10)",
                    background: "hsla(0,0%,100%,0.03)",
                    fontSize: "0.875rem",
                    color: "hsl(38, 8%, 95%)",
                    cursor: "pointer",
                    textDecoration: "none",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.18)";
                    (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.10)";
                    (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.03)";
                  }}
                >
                  {link.label}
                  <ArrowRight size={14} style={{ color: "hsl(214, 6%, 57%)" }} />
                </span>
              </Link>
            ))}
          </div>
        </m.div>
      </section>

      <section
        style={{
          borderTop: "1px solid hsla(0,0%,100%,0.055)",
          borderBottom: "1px solid hsla(0,0%,100%,0.055)",
          background: "hsla(214, 14%, 6%, 0.5)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "clamp(3rem, 6vw, 5rem) clamp(1.5rem, 5vw, 3rem)",
          }}
        >
          <blockquote
            style={{
              margin: 0,
              padding: 0,
              borderLeft: "3px solid hsl(38, 52%, 58%)",
              paddingLeft: "2rem",
            }}
          >
            <p
              style={{
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
                fontWeight: 400,
                fontSize: "clamp(1.125rem, 2.5vw, 1.5rem)",
                lineHeight: 1.55,
                color: "hsl(38, 8%, 95%)",
                fontStyle: "italic",
                maxWidth: "72ch",
                marginBottom: "1rem",
              }}
            >
              "{founder.quote}"
            </p>
            <footer
              style={{ fontSize: "0.8125rem", color: "hsl(214, 6%, 57%)" }}
            >
              — {founder.quoteAttribution}
            </footer>
          </blockquote>
        </div>
      </section>

      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 3rem)",
        }}
      >
        <m.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              marginBottom: "2.5rem",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "hsl(38, 52%, 58%)",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: "0.8125rem",
                color: "hsl(214, 6%, 57%)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              Thesis
            </span>
          </div>

          <h2
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontWeight: 600,
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              letterSpacing: "-0.02em",
              color: "hsl(38, 8%, 95%)",
              marginBottom: "3.5rem",
              maxWidth: "36ch",
              lineHeight: 1.15,
            }}
          >
            Four things I believe that most builders don't act on.
          </h2>
        </m.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 520px), 1fr))",
            gap: "2rem",
          }}
        >
          {THESIS_POINTS.map((point, i) => (
            <m.div
              key={point.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              style={{
                padding: "2rem",
                borderRadius: "12px",
                border: "1px solid hsla(0,0%,100%,0.055)",
                background: "hsla(214, 14%, 6%, 0.6)",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: "hsl(38, 52%, 58%)",
                  marginBottom: "0.875rem",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {point.number}
              </div>
              <h3
                style={{
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  fontWeight: 600,
                  fontSize: "1.0625rem",
                  lineHeight: 1.3,
                  color: "hsl(38, 8%, 95%)",
                  marginBottom: "0.875rem",
                  letterSpacing: "-0.01em",
                }}
              >
                {point.headline}
              </h3>
              <p
                style={{
                  fontSize: "0.9375rem",
                  lineHeight: 1.65,
                  color: "hsl(214, 6%, 57%)",
                  margin: 0,
                }}
              >
                {point.body}
              </p>
            </m.div>
          ))}
        </div>
      </section>

      <section
        style={{
          borderTop: "1px solid hsla(0,0%,100%,0.055)",
          background: "hsla(214, 14%, 6%, 0.4)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "clamp(3rem, 6vw, 5rem) clamp(1.5rem, 5vw, 3rem)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "2rem",
          }}
        >
          {[
            {
              value: metrics.platformCount.value,
              label: metrics.platformCount.label,
            },
            {
              value: metrics.seriesA.value,
              label: metrics.seriesA.label,
            },
            {
              value: metrics.seriesAValuation.value,
              label: metrics.seriesAValuation.label,
            },
            {
              value: metrics.alloyConnectors.value,
              label: metrics.alloyConnectors.label,
            },
          ].map((stat) => (
            <div key={stat.label}>
              <div
                style={{
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                  letterSpacing: "-0.025em",
                  color: "hsl(38, 52%, 58%)",
                  lineHeight: 1,
                  marginBottom: "0.5rem",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: "0.8125rem",
                  color: "hsl(214, 6%, 57%)",
                  lineHeight: 1.4,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 3rem)",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "1.5rem",
        }}
      >
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontWeight: 600,
              fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
              letterSpacing: "-0.02em",
              color: "hsl(38, 8%, 95%)",
              marginBottom: "0.75rem",
              lineHeight: 1.2,
            }}
          >
            Working with an operator who builds real systems?
          </h2>
          <p
            style={{
              fontSize: "1rem",
              color: "hsl(214, 6%, 57%)",
              marginBottom: "1.5rem",
              maxWidth: "50ch",
              lineHeight: 1.6,
            }}
          >
            The design partner program is structured around one real workflow, documented proof, and direct founder access. No hand-offs.
          </p>
          <Link href="/founder/design-partner">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                background: "hsl(38, 52%, 58%)",
                color: "hsl(214, 18%, 3%)",
                fontSize: "0.9375rem",
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "hsl(38, 52%, 66%)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "hsl(38, 52%, 58%)";
              }}
            >
              Apply to design partner program
              <ArrowRight size={16} />
            </span>
          </Link>
        </m.div>
      </section>
    </FounderLayout>
  );
}
