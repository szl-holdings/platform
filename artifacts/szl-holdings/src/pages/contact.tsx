import { useState } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { toast } from "sonner";

const API = "/api";

type InquiryType = "design-partner" | "pilot" | "advisory" | "investor" | "general";

interface FormState {
  name: string;
  email: string;
  org: string;
  type: InquiryType;
  message: string;
}

const INQUIRY_TYPES: { value: InquiryType; label: string; desc: string }[] = [
  { value: "design-partner", label: "Design Partner Session", desc: "Work directly with the founder to instrument one workflow" },
  { value: "pilot", label: "Pilot Readiness", desc: "Discuss a paid pilot engagement for Lyte + Alloy" },
  { value: "advisory", label: "Advisory Inquiry", desc: "Engage Carlota Jo for executive advisory support" },
  { value: "investor", label: "Investor Inquiry", desc: "Capital, strategic partnership, or syndicate interest" },
  { value: "general", label: "General Inquiry", desc: "Something else — press, partnerships, or other" },
];

const WHAT_HAPPENS = [
  { step: "01", body: "Your message lands directly with the founder — not a sales queue." },
  { step: "02", body: "We respond within one business day with next steps or qualifying questions." },
  { step: "03", body: "If there's a fit, we schedule a call tailored to your situation." },
];

export default function ContactPage() {
  usePageMeta({
    title: "Contact — SZL Holdings",
    description: "Book a design partner session, discuss a pilot, advisory engagement, or investor conversation. Reach out directly.",
    canonical: "https://szlholdings.com/contact",
  });

  const [form, setForm] = useState<FormState>({ name: "", email: "", org: "", type: "design-partner", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/contact/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          name: form.name,
          email: form.email,
          company: form.org,
          message: form.message,
          app: "szl-holdings",
          metadata: { inquiryType: form.type, source: "szl-holdings-contact-page" },
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again or email us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.6875rem 0.875rem",
    background: "hsla(214,12%,8%,0.72)",
    border: "1px solid var(--color-szl-border-hover)",
    borderRadius: "0.4375rem",
    fontSize: "0.9375rem",
    color: "hsl(38,8%,90%)",
    outline: "none",
    fontFamily: "var(--font-body)",
    transition: "border-color 0.18s ease",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.8125rem",
    fontWeight: 500,
    color: "hsl(214,7%,64%)",
    marginBottom: "0.375rem",
    letterSpacing: "-0.01em",
  };

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        <section className="szl-grid-texture szl-depth-glow-gold" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)", fontWeight: 600, letterSpacing: "-0.028em", lineHeight: 1.08, maxWidth: "22ch", marginBottom: "1.25rem" }}>
                Start a conversation.
              </h1>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,62%)", maxWidth: "48ch" }}>
                Design partner sessions, pilot discussions, advisory engagements, and investor
                conversations — all land directly with the founder. No sales queue.
              </p>
            </m.div>
          </div>
        </section>

        <section style={{ padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gap: "clamp(3rem,6vw,5rem)", alignItems: "start" }} className="lg:grid-cols-[1.1fr_0.9fr]">

              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }}>
                {submitted ? (
                  <div className="szl-card" style={{ borderRadius: "0.875rem", padding: "clamp(2rem,4vw,3rem)", textAlign: "center" }}>
                    <div style={{ width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(145,62%,40%,0.10)", border: "1px solid hsla(145,62%,40%,0.22)", borderRadius: "50%", margin: "0 auto 1.25rem" }}>
                      <CheckCircle2 size={22} color="hsl(145,62%,46%)" />
                    </div>
                    <h2 style={{ fontSize: "1.375rem", fontWeight: 600, letterSpacing: "-0.018em", marginBottom: "0.75rem" }}>Message received.</h2>
                    <p style={{ fontSize: "0.9375rem", lineHeight: 1.68, color: "hsl(214,7%,60%)", marginBottom: "1.75rem" }}>
                      We'll be in touch within one business day. If your situation is time-sensitive, note it in your message.
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
                      <Link href="/platform" className="szl-btn-secondary">Explore the platform</Link>
                      <Link href="/trust" className="szl-btn-ghost">Trust Center</Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div className="szl-grid-2">
                      <div>
                        <label style={labelStyle}>Your name *</label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          style={inputStyle}
                          placeholder="Full name"
                          onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--color-lyte)"; }}
                          onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--color-szl-border-hover)"; }}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Email address *</label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          style={inputStyle}
                          placeholder="you@company.com"
                          onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--color-lyte)"; }}
                          onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--color-szl-border-hover)"; }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Organization</label>
                      <input
                        type="text"
                        value={form.org}
                        onChange={(e) => setForm({ ...form, org: e.target.value })}
                        style={inputStyle}
                        placeholder="Company or fund name"
                        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--color-lyte)"; }}
                        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--color-szl-border-hover)"; }}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>What brings you here? *</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {INQUIRY_TYPES.map((t) => (
                          <label
                            key={t.value}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "0.75rem",
                              padding: "0.75rem 0.875rem",
                              background: form.type === t.value ? "hsla(191,92%,44%,0.07)" : "hsla(214,12%,8%,0.50)",
                              border: `1px solid ${form.type === t.value ? "var(--color-lyte-border)" : "var(--color-szl-border)"}`,
                              borderRadius: "0.4375rem",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <input
                              type="radio"
                              name="type"
                              value={t.value}
                              checked={form.type === t.value}
                              onChange={() => setForm({ ...form, type: t.value })}
                              style={{ marginTop: "3px", accentColor: "var(--color-lyte)", flexShrink: 0 }}
                            />
                            <div>
                              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,88%)", letterSpacing: "-0.01em" }}>{t.label}</div>
                              <div style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)", marginTop: "2px" }}>{t.desc}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Tell us more *</label>
                      <textarea
                        required
                        rows={5}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        style={{ ...inputStyle, resize: "vertical", minHeight: "120px" }}
                        placeholder="What are you working on? What pain are you trying to solve? The more context, the better the conversation."
                        onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--color-lyte)"; }}
                        onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--color-szl-border-hover)"; }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="szl-btn-primary"
                      style={{ alignSelf: "flex-start", opacity: submitting ? 0.7 : 1, cursor: submitting ? "wait" : "pointer" }}
                    >
                      {submitting ? "Sending…" : "Send message"}
                      {!submitting && <ArrowRight size={15} />}
                    </button>
                  </form>
                )}
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
              >
                <div className="szl-card" style={{ borderRadius: "0.875rem", padding: "clamp(1.5rem,3vw,2rem)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1.25rem" }}>
                    What happens next
                  </p>
                  {WHAT_HAPPENS.map((step, i) => (
                    <div key={step.step} style={{ display: "flex", gap: "0.875rem", marginBottom: i < WHAT_HAPPENS.length - 1 ? "1rem" : 0 }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-lyte)", letterSpacing: "0.06em", flexShrink: 0, paddingTop: "2px", minWidth: "24px" }}>{step.step}</div>
                      <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "hsl(214,7%,64%)" }}>{step.body}</p>
                    </div>
                  ))}
                </div>

                <div className="szl-card" style={{ borderRadius: "0.875rem", padding: "clamp(1.5rem,3vw,2rem)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
                    Useful before the call
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {[
                      { label: "Platform overview", href: "/platform" },
                      { label: "Interactive demo", href: "/demo" },
                      { label: "Trust Center", href: "/trust" },
                      { label: "Investor story", href: "/investor-story" },
                    ].map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", fontWeight: 500, color: "hsl(214,7%,62%)", textDecoration: "none" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,88%)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(214,7%,62%)"; }}
                      >
                        <ArrowRight size={12} style={{ opacity: 0.5 }} />
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="szl-card" style={{ borderRadius: "0.875rem", padding: "clamp(1.5rem,3vw,2rem)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "0.875rem" }}>
                    Design partner criteria
                  </p>
                  {[
                    "Running critical workflows across multiple systems",
                    "Willing to be on the call with the founder",
                    "Open to measuring outcomes, not just opinions",
                    "Team has real execution pain worth solving now",
                  ].map((item) => (
                    <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <CheckCircle2 size={13} color="var(--color-lyte)" style={{ marginTop: "3px", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.875rem", lineHeight: 1.58, color: "hsl(214,7%,62%)" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </m.div>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
