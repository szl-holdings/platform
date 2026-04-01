import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Hero } from "@/components/Hero";
import { usePageMeta } from "@/hooks/usePageMeta";

const EXPANSION_PLATFORMS = [
  { name: "Terra", desc: "Real estate intelligence — distress tracking, deal pipeline, ownership data.", color: "hsl(88,42%,44%)", rgb: "85,140,48" },
  { name: "Vessels", desc: "Maritime command — fleet visibility, voyage performance, operational exceptions.", color: "hsl(205,85%,55%)", rgb: "38,164,218" },
  { name: "Aegis", desc: "Defense & intelligence — SOC command, managed operations, AI-native security.", color: "hsl(232,68%,60%)", rgb: "99,102,241" },
  { name: "Carlota Jo", desc: "Private advisory — high-trust operational support for high-consequence decisions.", color: "hsl(38,55%,58%)", rgb: "191,152,82" },
];

export default function HomePage() {
  usePageMeta({
    title: "SZL Holdings — See the Operational Risk Before It Becomes a Revenue Problem",
    description: "Lyte + Alloy helps teams surface critical business signals, route action fast, and verify follow-through across the workflows that usually break between systems.",
    canonical: "https://szlholdings.com",
  });

  return (
    <div className="min-h-screen" style={{ background: "hsl(210,12%,5%)" }}>
      <SiteNav />
      <main id="main-content" role="main">
        <Hero />

        <section style={{
          padding: "clamp(4rem,7vw,6rem) 0",
          borderTop: "1px solid hsla(0,0%,100%,0.04)",
          background: "hsl(210,12%,6%)",
        }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
            <m.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{ marginBottom: "2.5rem" }}
            >
              <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "0.75rem", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
                What it does
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.25rem)", fontWeight: 700, letterSpacing: "-0.024em", color: "hsl(38,12%,94%)", lineHeight: 1.1, maxWidth: "30rem", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
                The layer between your tools and your execution.
              </h2>
            </m.div>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  step: "Lyte surfaces the signal",
                  body: "Approval latency. Missing ownership. Workflow friction that turns into a missed quarter. Lyte makes the invisible visible — across the tools you already use.",
                  accent: "hsl(190,90%,55%)",
                },
                {
                  step: "Alloy routes the action",
                  body: "The right task goes to the right person with no manual translation. No 'just check the dashboard.' No status meeting to find out if it moved.",
                  accent: "hsl(214,80%,65%)",
                },
                {
                  step: "Alloy verifies the outcome",
                  body: "Assignment isn't accountability. Alloy confirms the action completed. If it didn't, it escalates. The loop closes — and the evidence stays.",
                  accent: "hsl(190,90%,55%)",
                },
              ].map((item, i) => (
                <m.div
                  key={item.step}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    padding: "1.5rem",
                    borderRadius: "6px",
                    background: "hsla(0,0%,100%,0.025)",
                    border: "1px solid hsla(0,0%,100%,0.06)",
                  }}
                >
                  <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: item.accent, fontFamily: "'JetBrains Mono', monospace", display: "block", marginBottom: "0.75rem" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "hsl(38,12%,90%)", marginBottom: "0.5rem", letterSpacing: "-0.008em", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>{item.step}</p>
                  <p style={{ fontSize: "13px", lineHeight: 1.65, color: "hsl(210,5%,55%)" }}>{item.body}</p>
                </m.div>
              ))}
            </div>

            <m.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{ marginTop: "2rem" }}
            >
              <Link
                href="/platform"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "5px",
                  fontSize: "13px", fontWeight: 600, color: "hsl(190,90%,55%)",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(190,90%,68%)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(190,90%,55%)"; }}
              >
                How the platform works <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
            </m.div>
          </div>
        </section>

        <section style={{
          padding: "clamp(4rem,7vw,6rem) 0",
          borderTop: "1px solid hsla(0,0%,100%,0.04)",
        }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
            <m.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{ marginBottom: "2rem" }}
            >
              <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "0.75rem", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
                Where we're going
              </p>
              <p style={{ fontSize: "0.9375rem", color: "hsl(210,5%,58%)", lineHeight: 1.65, maxWidth: "34rem" }}>
                The same architecture that powers Lyte + Alloy extends to purpose-built verticals. These platforms are built and operating — they scale as the architecture proves itself.
              </p>
            </m.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3" style={{ marginBottom: "1.5rem" }}>
              {EXPANSION_PLATFORMS.map((p, i) => (
                <m.div
                  key={p.name}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    padding: "1.25rem",
                    borderRadius: "6px",
                    background: `rgba(${p.rgb}, 0.025)`,
                    border: `1px solid rgba(${p.rgb}, 0.1)`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "hsl(38,12%,88%)", letterSpacing: "-0.005em", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>{p.name}</span>
                  </div>
                  <p style={{ fontSize: "11.5px", lineHeight: 1.6, color: "hsl(210,5%,50%)" }}>{p.desc}</p>
                </m.div>
              ))}
            </div>
            <m.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link
                href="/venture-portfolio"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "5px",
                  fontSize: "12px", fontWeight: 600, color: "hsl(210,5%,45%)",
                  textDecoration: "none", letterSpacing: "0.04em",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,65%)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,45%)"; }}
              >
                View full portfolio <ArrowRight size={12} strokeWidth={2.5} />
              </Link>
            </m.div>
          </div>
        </section>

        <section style={{
          padding: "clamp(4rem,7vw,6rem) 0",
          borderTop: "1px solid hsla(0,0%,100%,0.04)",
          background: "hsl(210,12%,6%)",
        }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
            <m.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{ maxWidth: "32rem" }}
            >
              <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 700, letterSpacing: "-0.022em", color: "hsl(38,12%,94%)", lineHeight: 1.15, marginBottom: "1rem", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
                Working with early teams.
              </h2>
              <p style={{ fontSize: "0.9375rem", color: "hsl(210,5%,58%)", lineHeight: 1.65, marginBottom: "1.5rem" }}>
                Design partners get direct founder access, a focused engagement on one real workflow, and measurable improvement before any broader commitment.
              </p>
              <Link
                href="/design-partners"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "0.625rem 1.25rem", background: "hsl(210,8%,88%)",
                  color: "hsl(210,12%,6%)", borderRadius: "4px",
                  fontSize: "13px", fontWeight: 600, textDecoration: "none",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(38,15%,96%)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(210,8%,88%)"; }}
              >
                Request a design partner conversation <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
            </m.div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
