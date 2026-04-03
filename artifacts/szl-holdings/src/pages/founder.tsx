import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const CURRENT_FOCUS = [
  "Design-partner engagements for Lyte — working directly with operators on one instrumented workflow",
  "Investor conversations with a tight principal-only process",
  "Architecture and product refinement based on real operator feedback",
  "Disciplined company-building: no premature scale, no fake traction",
];

const THESIS_POINTS = [
  {
    label: "Observability is the missing layer",
    body: "Organizations have dashboards that show what happened. They have AI that suggests what to do. What they lack is the layer that catches what's about to break — in real time, across systems, with explainable attribution.",
  },
  {
    label: "Execution is the harder problem",
    body: "Visibility without execution is just more information. The real value is in closing the loop: routing the right action to the right person, verifying it happened, and building an audit-grade record of the whole chain.",
  },
  {
    label: "Architecture before go-to-market",
    body: "Building one shared spine (Alloy) beneath multiple vertical operating systems is a deliberate architectural bet. It creates compounding leverage: every improvement to the execution fabric benefits every pack simultaneously.",
  },
  {
    label: "Disciplined honesty as strategy",
    body: "No fake traction. No vaporware. No generic 'AI platform' positioning. The products are built. The architecture is real. This posture is not just ethical — it is a strategic differentiator in a market full of noise.",
  },
];

export default function FounderPage() {
  usePageMeta({
    title: "Founder — SZL Holdings",
    description: "Stephen Lutar — founder and operator at SZL Holdings. Operator positioning, company thesis, and current focus.",
    canonical: "https://szlholdings.com/founder",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        {/* Hero */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1.25rem" }}>
                Founder
              </p>
              <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", fontWeight: 600, letterSpacing: "-0.026em", lineHeight: 1.1, maxWidth: "20ch", marginBottom: "1.5rem", color: "hsl(38,8%,96%)" }}>
                Stephen Lutar
              </h1>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", maxWidth: "46ch" }}>
                Founder and officer at SZL Holdings. Building the operating layer that closes the gap between business intelligence and accountable execution.
              </p>
            </m.div>
          </div>
        </section>

        {/* Operator positioning */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "clamp(3.5rem,7vw,5.5rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ maxWidth: "52rem" }}>
              <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1rem" }}>
                Operator, not evangelist
              </p>
              <h2 style={{ fontSize: "clamp(1.25rem,2.5vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.018em", lineHeight: 1.15, marginBottom: "1.25rem", color: "hsl(38,8%,94%)" }}>
                The problem was visible before the product was.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1rem" }}>
                SZL Holdings was built from a clear-eyed observation: every organization of consequence runs on processes that break between systems, and no one can see it happening in real time. Dashboards show history. AI tools suggest text. But the layer that catches what's about to break — and routes the right action before the damage compounds — does not exist.
              </p>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1rem" }}>
                Lyte is the answer to that problem. Alloy is the operating fabric that makes the answer durable. The vertical packs are the proof that the architecture generalizes.
              </p>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)" }}>
                Every design-partner conversation, every investor conversation, every product decision runs through that same lens: does this close the gap between signal and governed action?
              </p>
            </div>
          </div>
        </section>

        {/* Company thesis */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "clamp(3.5rem,7vw,5.5rem) 0", background: "hsla(0,0%,100%,0.01)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "2rem" }}>
              Company thesis
            </p>
            <div style={{ display: "grid", gap: "1rem" }} className="lg:grid-cols-2">
              {THESIS_POINTS.map((point, i) => (
                <m.div
                  key={point.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.07 }}
                  style={{
                    padding: "1.5rem",
                    borderRadius: "0.75rem",
                    background: "hsla(0,0%,100%,0.025)",
                    border: "1px solid hsla(0,0%,100%,0.07)",
                  }}
                >
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,92%)", marginBottom: "0.625rem", letterSpacing: "-0.01em" }}>{point.label}</h3>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "var(--color-szl-text-secondary)" }}>{point.body}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why observability and execution matter */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "clamp(3.5rem,7vw,5.5rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ maxWidth: "52rem" }}>
              <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1rem" }}>
                Why observability and execution
              </p>
              <h2 style={{ fontSize: "clamp(1.25rem,2.5vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.018em", lineHeight: 1.15, marginBottom: "1.25rem", color: "hsl(38,8%,94%)" }}>
                The gap between insight and action is where organizations lose the most.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1rem" }}>
                Every significant operational failure follows the same pattern: a signal was available — in a system, in a log, in a pattern of behavior — and no one connected it to an action before the damage was done. Not because people weren't paying attention. Because the layer that would have caught it and routed the response simply didn't exist.
              </p>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1rem" }}>
                Observability without execution is just more expensive dashboards. Execution without observability is just faster action on the wrong things. The value is in the operating arc: signal → visibility → forecast → governed action.
              </p>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)" }}>
                This is not a generalist platform story. It is a focused bet on the industries where that arc is worth the most: litigation, maritime, security, real estate, and executive advisory.
              </p>
            </div>
          </div>
        </section>

        {/* Current focus */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "clamp(3.5rem,7vw,5.5rem) 0", background: "hsla(0,0%,100%,0.01)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1.5rem" }}>
              Current focus
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", maxWidth: "44rem" }}>
              {CURRENT_FOCUS.map((item, i) => (
                <m.div
                  key={item}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "0.875rem",
                    padding: "1rem 1.25rem",
                    borderRadius: "0.5rem",
                    background: "hsla(0,0%,100%,0.025)",
                    border: "1px solid hsla(0,0%,100%,0.06)",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 700, color: "hsl(192,72%,48%)", flexShrink: 0, paddingTop: "2px", minWidth: "20px" }}>
                    0{i + 1}
                  </span>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.62, color: "var(--color-szl-text-secondary)" }}>{item}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "clamp(3.5rem,7vw,5.5rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ maxWidth: "32rem" }}>
              <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1rem" }}>
                Get in touch
              </p>
              <h2 style={{ fontSize: "clamp(1.25rem,2.5vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.018em", lineHeight: 1.15, marginBottom: "1rem", color: "hsl(38,8%,94%)" }}>
                All conversations go to the founder.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1.75rem" }}>
                Design-partner sessions, investor conversations, media inquiries, and partner discussions — all handled directly. No sales queue.
              </p>
              <Link
                href="/contact"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.75rem 1.5rem",
                  background: "hsl(192,72%,48%)",
                  color: "hsl(214,18%,4%)",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem", fontWeight: 600,
                  textDecoration: "none",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(192,72%,54%)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(192,72%,48%)"; }}
              >
                Start a conversation
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
