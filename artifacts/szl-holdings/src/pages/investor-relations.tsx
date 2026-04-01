import { useState } from "react";
import { m } from "framer-motion";
import { ArrowRight, CheckCircle, Send } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const WEDGE_POINTS = [
  {
    heading: "The wedge is a real problem",
    body: "Operational risk that lives between systems — approval latency, ownership gaps, workflow friction that compounds into revenue loss — is a problem in every organization above a certain size. Lyte + Alloy addresses it from first principles.",
  },
  {
    heading: "The architecture generalizes",
    body: "The observability and execution accountability architecture powering Lyte + Alloy is the same architecture being extended to Terra (real estate), Vessels (maritime), Aegis (defense), and Carlota Jo (private advisory). The business model and core system are proven before the verticals scale.",
  },
  {
    heading: "Expansion is pull, not push",
    body: "The vertical platforms expand when the architecture proves its value in their domain — not on a predetermined roadmap. Each vertical has a clear operational problem where observability and execution accountability are worth paying for.",
  },
];

const EXPANSION_PLATFORMS = [
  { name: "Terra", domain: "Real estate intelligence", note: "Distress tracking, deal pipeline, market data for serious operators." },
  { name: "Vessels", domain: "Maritime command", note: "Fleet visibility, voyage performance, operational exceptions." },
  { name: "Aegis", domain: "Defense & intelligence", note: "SOC command, managed operations, AI-native security." },
  { name: "Carlota Jo", domain: "Private advisory", note: "High-trust operational support for high-consequence decisions." },
];

export default function InvestorRelationsPage() {
  const [form, setForm] = useState({ email: "" });
  const [requestSent, setRequestSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  usePageMeta({
    title: "Investors — SZL Holdings",
    description: "Focused now. Expandable later. The Lyte + Alloy wedge, the expansion thesis, and how to start a conversation.",
    canonical: "https://szlholdings.com/investors",
  });

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch(`${BASE}/api/holdings/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Investor",
          email: form.email.trim(),
          subject: "Investor Inquiry",
          message: `Investor inquiry from ${form.email.trim()}`,
        }),
      });
      if (response.status === 201 || response.ok) {
        setRequestSent(true);
      } else {
        setError("Request failed. Email hello@szlholdings.com directly.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <SiteNav />
      <main id="main-content" role="main" className="pt-24">

        <section style={{ padding: "4rem 0 3rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
              <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.75rem" }}>
                Investors
              </p>
              <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "hsl(38,12%,94%)", lineHeight: 1.08, marginBottom: "1.25rem", maxWidth: "28rem" }}>
                Focused now. Expandable later.
              </h1>
              <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "hsl(210,5%,58%)", maxWidth: "38rem", marginBottom: "2rem" }}>
                SZL Holdings is built around a focused operating wedge: Lyte + Alloy, delivering business observability and execution accountability to organizations where unreliability is not a recoverable condition. The broader ecosystem — Aegis, Terra, Vessels, Carlota Jo — represents expansion paths built on the same shared architecture.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <a
                  href="mailto:hello@szlholdings.com?subject=Investor Inquiry"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.625rem 1.25rem", borderRadius: "6px", fontSize: "13px", fontWeight: 600, color: "hsl(210,12%,6%)", background: "hsl(210,8%,88%)", textDecoration: "none", transition: "all 0.2s ease" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(38,15%,96%)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(210,8%,88%)"; }}
                >
                  Start a conversation <ArrowRight size={13} strokeWidth={2.5} />
                </a>
                <a
                  href="mailto:hello@szlholdings.com"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.625rem 1.25rem", borderRadius: "6px", fontSize: "13px", fontWeight: 500, color: "hsl(210,5%,56%)", border: "1px solid hsla(0,0%,100%,0.09)", textDecoration: "none", background: "transparent", transition: "all 0.2s ease" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,88%)"; (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.18)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,56%)"; (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.09)"; }}
                >
                  hello@szlholdings.com
                </a>
              </div>
            </m.div>
          </div>
        </section>

        <section style={{ padding: "3rem 0", borderTop: "1px solid hsla(0,0%,100%,0.04)" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "1.5rem" }}>
              The Thesis
            </p>
            <div style={{ display: "grid", gap: "1rem", maxWidth: "52rem" }}>
              {WEDGE_POINTS.map((point, i) => (
                <m.div
                  key={point.heading}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    padding: "1.5rem",
                    borderRadius: "10px",
                    background: "hsla(0,0%,100%,0.025)",
                    border: "1px solid hsla(0,0%,100%,0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <div style={{ width: "4px", background: "hsl(190,90%,55%)", borderRadius: "2px", flexShrink: 0, marginTop: "3px", height: "auto", alignSelf: "stretch", opacity: 0.6 }} />
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "hsl(38,12%,88%)", marginBottom: "0.5rem", letterSpacing: "-0.008em" }}>{point.heading}</p>
                      <p style={{ fontSize: "13px", lineHeight: 1.65, color: "hsl(210,5%,55%)" }}>{point.body}</p>
                    </div>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "3rem 0", borderTop: "1px solid hsla(0,0%,100%,0.04)", background: "hsl(210,12%,6%)" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "1.5rem" }}>
              The Expansion Platforms
            </p>
            <p style={{ fontSize: "0.9375rem", color: "hsl(210,5%,58%)", lineHeight: 1.65, maxWidth: "36rem", marginBottom: "1.75rem" }}>
              These platforms aren't ideas on a roadmap — they're built and operating. They represent where the architecture extends as the wedge proves itself.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {EXPANSION_PLATFORMS.map((p, i) => (
                <m.div
                  key={p.name}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    padding: "1.375rem",
                    borderRadius: "10px",
                    background: "hsla(0,0%,100%,0.02)",
                    border: "1px solid hsla(0,0%,100%,0.06)",
                  }}
                >
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "hsl(38,12%,88%)", marginBottom: "0.25rem", letterSpacing: "-0.008em" }}>{p.name}</p>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "hsl(210,5%,44%)", letterSpacing: "0.04em", marginBottom: "0.625rem", textTransform: "uppercase" }}>{p.domain}</p>
                  <p style={{ fontSize: "12px", lineHeight: 1.6, color: "hsl(210,5%,50%)" }}>{p.note}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "3rem 0", borderTop: "1px solid hsla(0,0%,100%,0.04)" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "1.25rem" }}>
                  The Founder
                </p>
                <m.div
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  style={{ padding: "1.5rem", borderRadius: "12px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}
                >
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "hsl(38,12%,90%)", letterSpacing: "-0.008em", marginBottom: "0.25rem" }}>Stephen Lutar</p>
                  <p style={{ fontSize: "11px", color: "hsl(210,5%,46%)", marginBottom: "0.875rem" }}>Founder & Chief Executive</p>
                  <p style={{ fontSize: "13px", lineHeight: 1.65, color: "hsl(210,5%,54%)", marginBottom: "1rem" }}>
                    Builder, operator, and systems architect. Designed and operates the full SZL ecosystem across six platforms. Background in workflow design, command systems, and multi-domain operational intelligence.
                  </p>
                  <a
                    href="/stephen-site/"
                    style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, color: "hsl(190,90%,55%)", textDecoration: "none" }}
                  >
                    Full Profile <ArrowRight size={11} strokeWidth={2.5} />
                  </a>
                </m.div>
              </div>

              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "1.25rem" }}>
                  Request Materials
                </p>
                {requestSent ? (
                  <div style={{ padding: "1.25rem", borderRadius: "10px", background: "hsla(190,90%,55%,0.07)", border: "1px solid hsla(190,90%,55%,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <CheckCircle size={16} style={{ color: "hsl(190,90%,55%)" }} />
                      <p style={{ fontSize: "13px", color: "hsl(38,12%,80%)", fontWeight: 500 }}>Request received. We'll follow up within 24 hours.</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleRequest}>
                    <div style={{ display: "flex", gap: "0.625rem" }}>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ email: e.target.value })}
                        placeholder="your@email.com"
                        required
                        style={{
                          flex: 1, padding: "0.625rem 0.875rem",
                          background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.09)",
                          borderRadius: "6px", color: "hsl(38,12%,88%)", fontSize: "13px", outline: "none",
                        }}
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        style={{
                          padding: "0.625rem 1rem", background: "hsla(0,0%,100%,0.08)",
                          border: "1px solid hsla(0,0%,100%,0.12)", borderRadius: "6px",
                          color: "hsl(38,12%,84%)", fontSize: "12px", fontWeight: 600,
                          cursor: submitting ? "not-allowed" : "pointer",
                          display: "flex", alignItems: "center", gap: "5px", flexShrink: 0,
                          transition: "all 0.18s",
                        }}
                      >
                        <Send size={12} />
                        {submitting ? "…" : "Request"}
                      </button>
                    </div>
                    {error && <p style={{ fontSize: "11.5px", color: "hsl(0,72%,65%)", marginTop: "0.4rem" }}>{error}</p>}
                    {!error && <p style={{ fontSize: "11px", color: "hsl(210,5%,40%)", marginTop: "0.5rem" }}>One-pager and architecture brief.</p>}
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
