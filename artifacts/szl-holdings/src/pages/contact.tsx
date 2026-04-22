import { useState, useRef, useEffect } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Shield } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useUtm } from "@/hooks/useUtm";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";
import { analytics } from "@/lib/analytics";

const API = "/api";

type InquiryType = "demo" | "design-partner" | "general" | "security" | "partner" | "media";

interface FormState {
  name: string;
  email: string;
  org: string;
  type: InquiryType;
  message: string;
}

const INQUIRY_TYPES: { value: InquiryType; label: string; desc: string }[] = [
  { value: "demo", label: "Demo request", desc: "See KORA + FORGE on a staged workflow" },
  { value: "design-partner", label: "Design partner", desc: "Work directly with the founder to instrument one real workflow" },
  { value: "general", label: "General inquiry", desc: "Investors, partnerships, or other conversations" },
  { value: "partner", label: "Partner / integration", desc: "Technical or commercial partnership discussions" },
  { value: "media", label: "Media / press", desc: "Press inquiries, media requests, or editorial conversations" },
  { value: "security", label: "Security disclosure", desc: "Report a vulnerability or security concern responsibly" },
];

const WHAT_HAPPENS = [
  { step: "01", body: "Your message lands directly with the founder — not a sales queue or ticketing system." },
  { step: "02", body: "We respond within one business day with next steps or qualifying questions." },
  { step: "03", body: "If there's a fit, we schedule a focused call tailored to your situation." },
];

export default function ContactPage() {
  const __pageMeta = usePageMeta({
    title: "Contact — SZL Holdings",
    description: "Demo requests, design partner sessions, general inquiries, media, and security disclosures. All conversations go directly to the founder.",
    canonical: "https://szlholdings.com/contact",
    ogImage: "https://szlholdings.com/og/og-contact.jpg",
  });

  const utms = useUtm();
  const [form, setForm] = useState<FormState>({ name: "", email: "", org: "", type: "demo", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [referrerSource, setReferrerSource] = useState<string>("contact-page");
  const funnelStarted = useRef(false);

  useEffect(() => {
    // Acquisition funnel step 3: contact page viewed.
    // Session recording is started by PageViewTracker at the router level.
    analytics.contactView("/contact");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const t = params.get("type");
    const validTypes: InquiryType[] = ["demo", "design-partner", "general", "security", "partner", "media"];
    if (t && (validTypes as string[]).includes(t)) {
      setForm((f) => ({ ...f, type: t as InquiryType }));
    }
    const src = params.get("source");
    if (src) setReferrerSource(src);
  }, []);

  const trackFunnelStart = (inquiryType: string) => {
    if (!funnelStarted.current) {
      funnelStarted.current = true;
      analytics.contactFunnelStart(inquiryType);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;

    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();

    if (!name || !email || !message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (name.length < 2) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (message.length < 20) {
      toast.error("Please provide a bit more detail (at least 20 characters).");
      return;
    }

    setSubmitting(true);
    analytics.ctaClick("contact_form_submit", "contact", form.type);
    try {
      const res = await fetch(`${API}/contact/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          name,
          email,
          company: form.org.trim(),
          message,
          app: "szl-holdings",
          metadata: {
            inquiryType: form.type,
            source: "szl-holdings-contact-page",
            ...(utms.utm_source ? { utm_source: utms.utm_source } : {}),
            ...(utms.utm_medium ? { utm_medium: utms.utm_medium } : {}),
            ...(utms.utm_campaign ? { utm_campaign: utms.utm_campaign } : {}),
            ...(utms.utm_content ? { utm_content: utms.utm_content } : {}),
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Submission failed");
      }
      setSubmitted(true);
      analytics.contactFormSubmit(form.type);
      analytics.diligenceRequested(referrerSource, "/contact");
      if (form.type === "demo") analytics.demoRequest(referrerSource);
      if (form.type === "design-partner") analytics.designPartnerInterest(referrerSource, "/contact");

      fetch(`${API}/holdings/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company: form.org.trim() || undefined,
          subject: `Contact: ${INQUIRY_TYPES.find(t => t.value === form.type)?.label ?? form.type}`,
          message,
          source: "contact-page",
          ...(utms.utm_source ? { utm_source: utms.utm_source } : {}),
          ...(utms.utm_medium ? { utm_medium: utms.utm_medium } : {}),
          ...(utms.utm_campaign ? { utm_campaign: utms.utm_campaign } : {}),
          ...(utms.utm_content ? { utm_content: utms.utm_content } : {}),
        }),
      }).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(`${msg} Please try again or email hello@szlholdings.com directly.`);
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
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <SiteNav />
        <main id="main-content" >
  
          {/* Hero */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1.25rem" }}>
                  Contact
                </p>
                <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", fontWeight: 600, letterSpacing: "-0.026em", lineHeight: 1.1, maxWidth: "22ch", marginBottom: "1.25rem", color: "hsl(38,8%,96%)" }}>
                  Start a conversation.
                </h1>
                <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", maxWidth: "48ch" }}>
                  Demo requests, design partner sessions, investor conversations, media inquiries, and security disclosures — all land directly with the founder. No sales queue.
                </p>
              </m.div>
            </div>
          </section>
  
          {/* Main */}
          <section style={{ padding: "clamp(3.5rem,7vw,5.5rem) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <div style={{ display: "grid", gap: "clamp(3rem,6vw,5rem)", alignItems: "start" }} className="lg:grid-cols-[1.1fr_0.9fr]">
  
                {/* Form */}
                <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }}>
                  {submitted ? (
                    <div style={{
                      borderRadius: "0.875rem", padding: "clamp(2rem,4vw,3rem)", textAlign: "center",
                      background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.08)",
                    }}>
                      <div style={{
                        width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center",
                        background: "hsla(145,62%,40%,0.10)", border: "1px solid hsla(145,62%,40%,0.22)",
                        borderRadius: "50%", margin: "0 auto 1.25rem",
                      }}>
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
                      <input
                        type="text"
                        name="website"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                        tabIndex={-1}
                        aria-hidden="true"
                        style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }}
                        autoComplete="off"
                      />
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
                            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--color-lyte)"; trackFunnelStart(form.type); }}
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
  
                      {form.type === "security" && (
                        <div style={{
                          padding: "0.875rem 1rem",
                          borderRadius: "0.5rem",
                          background: "hsla(40,80%,50%,0.06)",
                          border: "1px solid hsla(40,80%,50%,0.18)",
                          display: "flex", alignItems: "flex-start", gap: "0.625rem",
                        }}>
                          <Shield size={14} style={{ color: "hsl(40,80%,58%)", marginTop: "2px", flexShrink: 0 }} />
                          <div>
                            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(40,80%,70%)", marginBottom: "0.25rem" }}>Security disclosure</p>
                            <p style={{ fontSize: "0.8125rem", lineHeight: 1.58, color: "hsl(214,7%,60%)" }}>
                              For verified security disclosures, we respond within 24 hours. Please include a description of the vulnerability, steps to reproduce, and your assessment of impact. We do not have a bug bounty program at this stage, but we do credit responsible disclosures.
                            </p>
                          </div>
                        </div>
                      )}
  
                      <div>
                        <label style={labelStyle}>Tell us more *</label>
                        <textarea
                          required
                          rows={5}
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          style={{ ...inputStyle, resize: "vertical", minHeight: "120px" }}
                          placeholder={
                            form.type === "security"
                              ? "Describe the vulnerability, steps to reproduce, and your impact assessment."
                              : form.type === "media"
                              ? "Please include your publication, angle, and deadline if applicable."
                              : "What are you working on? What pain are you trying to solve? The more context, the better the conversation."
                          }
                          onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--color-lyte)"; }}
                          onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "var(--color-szl-border-hover)"; }}
                        />
                      </div>
  
                      <p style={{ fontSize: "0.75rem", color: "hsl(214,7%,57%)", lineHeight: 1.55 }}>
                        By submitting this form you agree to our{" "}
                        <Link href="/legal/privacy" style={{ color: "hsl(214,7%,58%)", textDecoration: "underline" }}>Privacy Policy</Link>.
                        We don't sell your information or add you to marketing lists.
                      </p>
  
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
  
                {/* Sidebar */}
                <m.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
                >
                  <div style={{ borderRadius: "0.875rem", padding: "clamp(1.5rem,3vw,2rem)", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)" }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1.25rem" }}>
                      What happens next
                    </p>
                    {WHAT_HAPPENS.map((step, i) => (
                      <div key={step.step} style={{ display: "flex", gap: "0.875rem", marginBottom: i < WHAT_HAPPENS.length - 1 ? "1rem" : 0 }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-lyte)", letterSpacing: "0.06em", flexShrink: 0, paddingTop: "2px", minWidth: "24px" }}>{step.step}</div>
                        <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "hsl(214,7%,64%)" }}>{step.body}</p>
                      </div>
                    ))}
                  </div>
  
                  <div style={{ borderRadius: "0.875rem", padding: "clamp(1.5rem,3vw,2rem)", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)" }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
                      Useful before the call
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {[
                        { label: "Platform overview", href: "/platform" },
                        { label: "Request a demo", href: "/demo" },
                        { label: "Trust Center", href: "/trust" },
                        { label: "About the company", href: "/company" },
                        { label: "About the founder", href: "/founder" },
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
  
                  <div style={{ borderRadius: "0.875rem", padding: "clamp(1.5rem,3vw,2rem)", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)" }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "0.875rem" }}>
                      Design partner criteria
                    </p>
                    {[
                      "Running critical workflows across multiple systems",
                      "Willing to be on the call with the founder directly",
                      "Open to measuring outcomes, not just opinions",
                      "Team has real execution pain worth solving now",
                    ].map((item) => (
                      <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <CheckCircle2 size={13} color="var(--color-lyte)" style={{ marginTop: "3px", flexShrink: 0 }} />
                        <span style={{ fontSize: "0.875rem", lineHeight: 1.58, color: "hsl(214,7%,62%)" }}>{item}</span>
                      </div>
                    ))}
                  </div>
  
                  <div style={{ borderRadius: "0.875rem", padding: "clamp(1.5rem,3vw,2rem)", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)" }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "0.875rem" }}>
                      Direct contact
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "hsl(214,7%,62%)", marginBottom: "0.375rem" }}>
                      hello@szlholdings.com
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "hsl(214,7%,57%)", lineHeight: 1.55 }}>
                      Washington, D.C. · London · Singapore
                    </p>
                  </div>
                </m.div>
              </div>
            </div>
          </section>
  
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
