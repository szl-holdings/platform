import { useState } from "react";
import { m } from "framer-motion";
import { CheckCircle, ArrowRight, Send } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const WHAT_YOU_GET = [
  {
    heading: "Instrument one painful workflow",
    body: "We start with the workflow where your team loses the most time, trust, or revenue — not a demo environment, not synthetic data. We instrument what's actually broken.",
  },
  {
    heading: "Prove measurable improvement",
    body: "Before any broader commitment, you'll see a measurable change in the metric that matters — latency reduced, ownership gaps closed, follow-through verified. The outcome is specific and observable.",
  },
  {
    heading: "Direct founder access",
    body: "Design partners work directly with the founder, not a sales process. You shape the roadmap. Your workflow problems become the product's next capabilities.",
  },
  {
    heading: "No enterprise procurement required",
    body: "This is a focused, time-bound engagement. Low friction to start, designed to prove value before you make any larger decision.",
  },
];

const WHO_IT_IS_FOR = [
  "Teams where work stalls between systems and no one can see why",
  "Operators who know their biggest risk is invisible — until it's too late",
  "Leaders who want workflow accountability without adding more dashboards",
  "Organizations where the gap between decision and execution is costing money",
];

export default function DesignPartnersPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  usePageMeta({
    title: "Design Partners — SZL Holdings",
    description: "Work directly with the Lyte + Alloy team. Instrument one painful workflow, prove measurable improvement, and shape the roadmap with direct founder access.",
    canonical: "https://szlholdings.com/design-partners",
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (!form.message.trim() || form.message.trim().length < 10) e.message = "Tell us about the workflow problem (at least 10 characters)";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const response = await fetch(`${BASE}/api/holdings/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          company: form.company.trim() || undefined,
          subject: "Design Partner Inquiry",
          message: `[Design Partner Request]\n\n${form.message.trim()}`,
        }),
      });
      if (response.status === 201 || response.ok) {
        setSent(true);
      } else {
        setErrors({ general: "Submission failed. Email hello@szlholdings.com directly." });
      }
    } catch {
      setErrors({ general: "Network error. Please check your connection." });
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "0.625rem 0.875rem",
    background: "hsla(0,0%,100%,0.04)",
    border: `1px solid ${hasError ? "hsla(0,72%,55%,0.5)" : "hsla(0,0%,100%,0.09)"}`,
    borderRadius: "6px",
    color: "hsl(38,12%,88%)",
    fontSize: "13.5px",
    outline: "none",
    transition: "border-color 0.18s",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        <section style={{
          paddingTop: "clamp(7rem,12vw,10rem)",
          paddingBottom: "clamp(4rem,7vw,5rem)",
          borderBottom: "1px solid hsla(0,0%,100%,0.05)",
        }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
            >
              <span style={{
                display: "inline-block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "1.5rem",
              }}>
                Design Partners
              </span>
              <h1 style={{
                fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 700, letterSpacing: "-0.025em",
                lineHeight: 1.08, color: "hsl(38,12%,94%)", marginBottom: "1.25rem", maxWidth: "34rem",
              }}>
                Work with us on the workflow that's costing you the most.
              </h1>
              <p style={{
                fontSize: "1.0625rem", color: "hsl(210,5%,60%)", lineHeight: 1.65,
                maxWidth: "38rem",
              }}>
                The design partner program is how Lyte + Alloy gets built — in direct collaboration with the teams whose workflows are actually broken. We instrument one painful process, prove measurable improvement, and let the results decide what happens next.
              </p>
            </m.div>
          </div>
        </section>

        <section style={{ padding: "clamp(4rem,7vw,6rem) 0", borderBottom: "1px solid hsla(0,0%,100%,0.04)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
              <div>
                <m.p
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "1.75rem" }}
                >
                  What design partners get
                </m.p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {WHAT_YOU_GET.map((item, i) => (
                    <m.div
                      key={item.heading}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        padding: "1.375rem 1.5rem",
                        borderRadius: "8px",
                        background: "hsla(0,0%,100%,0.025)",
                        border: "1px solid hsla(0,0%,100%,0.06)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                        <CheckCircle size={16} style={{ color: "hsl(190,90%,55%)", flexShrink: 0, marginTop: "2px", opacity: 0.85 }} />
                        <div>
                          <p style={{ fontSize: "14px", fontWeight: 600, color: "hsl(38,12%,90%)", marginBottom: "0.375rem", letterSpacing: "-0.008em" }}>{item.heading}</p>
                          <p style={{ fontSize: "13px", lineHeight: 1.65, color: "hsl(210,5%,55%)" }}>{item.body}</p>
                        </div>
                      </div>
                    </m.div>
                  ))}
                </div>

                <m.div
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.32 }}
                  style={{ marginTop: "2rem" }}
                >
                  <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "1rem" }}>
                    Who this is for
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    {WHO_IT_IS_FOR.map((item) => (
                      <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                        <ArrowRight size={12} style={{ color: "hsl(210,5%,40%)", flexShrink: 0, marginTop: "3px" }} />
                        <span style={{ fontSize: "13px", lineHeight: 1.6, color: "hsl(210,5%,55%)" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </m.div>
              </div>

              <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "1.5rem" }}>
                  Start the conversation
                </p>

                {sent ? (
                  <div style={{
                    padding: "2rem", borderRadius: "12px",
                    background: "hsla(190,90%,55%,0.06)", border: "1px solid hsla(190,90%,55%,0.2)",
                  }}>
                    <CheckCircle size={28} style={{ color: "hsl(190,90%,55%)", marginBottom: "0.875rem" }} />
                    <p style={{ fontSize: "15px", fontWeight: 700, color: "hsl(38,12%,92%)", marginBottom: "0.5rem" }}>Message received.</p>
                    <p style={{ fontSize: "13.5px", color: "hsl(210,5%,56%)", lineHeight: 1.65 }}>
                      You'll hear back within 24 hours. We'll set up a short call to understand the workflow before any engagement begins.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: 500, color: "hsl(210,5%,52%)", marginBottom: "0.375rem" }}>Name *</label>
                        <input
                          type="text"
                          placeholder="Your name"
                          value={form.name}
                          onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); if (errors.name) setErrors(p => { const n = { ...p }; delete n.name; return n; }); }}
                          style={inputStyle(!!errors.name)}
                        />
                        {errors.name && <p style={{ fontSize: "11px", color: "hsl(0,72%,65%)", marginTop: "0.25rem" }}>{errors.name}</p>}
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: 500, color: "hsl(210,5%,52%)", marginBottom: "0.375rem" }}>Email *</label>
                        <input
                          type="email"
                          placeholder="you@company.com"
                          value={form.email}
                          onChange={(e) => { setForm(f => ({ ...f, email: e.target.value })); if (errors.email) setErrors(p => { const n = { ...p }; delete n.email; return n; }); }}
                          style={inputStyle(!!errors.email)}
                        />
                        {errors.email && <p style={{ fontSize: "11px", color: "hsl(0,72%,65%)", marginTop: "0.25rem" }}>{errors.email}</p>}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 500, color: "hsl(210,5%,52%)", marginBottom: "0.375rem" }}>Company</label>
                      <input
                        type="text"
                        placeholder="Organization (optional)"
                        value={form.company}
                        onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))}
                        style={inputStyle()}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 500, color: "hsl(210,5%,52%)", marginBottom: "0.375rem" }}>
                        What's the workflow that's costing you the most? *
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Describe the workflow: what breaks, where it breaks, and roughly what it costs your team."
                        value={form.message}
                        onChange={(e) => { setForm(f => ({ ...f, message: e.target.value })); if (errors.message) setErrors(p => { const n = { ...p }; delete n.message; return n; }); }}
                        style={{ ...inputStyle(!!errors.message), resize: "vertical" as const, lineHeight: 1.6, minHeight: "110px" }}
                      />
                      {errors.message && <p style={{ fontSize: "11px", color: "hsl(0,72%,65%)", marginTop: "0.25rem" }}>{errors.message}</p>}
                    </div>
                    {errors.general && <p style={{ fontSize: "12px", color: "hsl(0,72%,65%)" }}>{errors.general}</p>}
                    <div>
                      <button
                        type="submit"
                        disabled={submitting}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "6px",
                          padding: "0.75rem 1.5rem", background: "hsl(210,8%,86%)",
                          color: "hsl(210,12%,6%)", border: "none", borderRadius: "6px",
                          fontSize: "13.5px", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
                          opacity: submitting ? 0.7 : 1, transition: "all 0.18s", fontFamily: "inherit",
                        }}
                        onMouseEnter={(e) => { if (!submitting) (e.currentTarget as HTMLElement).style.background = "hsl(38,15%,95%)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(210,8%,86%)"; }}
                      >
                        <Send size={14} />
                        {submitting ? "Sending…" : "Request a conversation"}
                      </button>
                      <p style={{ fontSize: "11px", color: "hsl(210,5%,38%)", marginTop: "0.625rem", lineHeight: 1.5 }}>
                        We'll follow up within 24 hours. Or email <a href="mailto:hello@szlholdings.com" style={{ color: "hsl(190,90%,55%)", textDecoration: "none" }}>hello@szlholdings.com</a> directly.
                      </p>
                    </div>
                  </form>
                )}
              </m.div>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
