import { useState } from "react";
import { m } from "framer-motion";
import { CheckCircle, Send } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const INQUIRY_TYPES = [
  { value: "demo", label: "Demo Request", description: "See a platform in action. Alloy, Lyte, Vessels, Aegis, or Terra." },
  { value: "investor", label: "Investor Inquiry", description: "Strategic capital conversations, partnership opportunities." },
  { value: "partnership", label: "Partnership", description: "Integration, co-development, or strategic alliance proposals." },
  { value: "carlota-jo", label: "Carlota Jo", description: "Discreet private advisory and estate management services." },
  { value: "recruiting", label: "Executive Recruiting", description: "Executive roles, advisory engagements, strategic positions." },
  { value: "general", label: "General", description: "Press, research, and general ecosystem inquiries." },
];

const SUBJECT_MAP: Record<string, string> = {
  demo: "Platform Demo Request",
  investor: "Investor Inquiry",
  partnership: "Partnership Inquiry",
  "carlota-jo": "Carlota Jo Service Inquiry",
  recruiting: "Executive Recruiting Inquiry",
  general: "General Inquiry",
};

export default function ContactPage() {
  const [inquiryType, setInquiryType] = useState("");
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  usePageMeta({
    title: "Contact — SZL Holdings",
    description: "Start the right conversation. Demo requests, investor inquiries, partnership proposals, and executive recruiting for SZL Holdings.",
    canonical: "https://szlholdings.com/contact",
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!inquiryType) e.inquiryType = "Select an inquiry type";
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (!form.message.trim() || form.message.trim().length < 10) e.message = "Message must be at least 10 characters";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const response = await fetch("/api/holdings/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          company: form.company.trim() || undefined,
          subject: SUBJECT_MAP[inquiryType] ?? "General Inquiry",
          message: `[${SUBJECT_MAP[inquiryType]}]\n\n${form.message.trim()}`,
        }),
      });
      if (response.status === 201 || response.ok) {
        setSent(true);
      } else {
        let data: { details?: string[]; error?: string } = {};
        try { data = await response.json(); } catch {}
        if (data.details && Array.isArray(data.details)) {
          const fieldErrs: Record<string, string> = {};
          data.details.forEach((d: string) => {
            if (d.toLowerCase().includes("name")) fieldErrs.name = d;
            else if (d.toLowerCase().includes("email")) fieldErrs.email = d;
            else if (d.toLowerCase().includes("message")) fieldErrs.message = d;
            else fieldErrs.general = d;
          });
          setErrors(fieldErrs);
        } else {
          setErrors({ general: data.error ?? "Submission failed. Please try again." });
        }
      }
    } catch {
      setErrors({ general: "Network error. Please check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const field = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [k]: e.target.value }));
      if (errors[k]) setErrors((prev) => { const n = { ...prev }; delete n[k]; return n; });
    },
  });

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
    boxSizing: "border-box",
    fontFamily: "inherit",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <SiteNav />
      <main className="pt-24">
        <section style={{ padding: "4rem 0 3rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
              <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.75rem" }}>
                Contact
              </p>
              <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "hsl(38,12%,94%)", lineHeight: 1.08, marginBottom: "1rem" }}>
                Start the right conversation.
              </h1>
              <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "hsl(210,5%,58%)", maxWidth: "32rem" }}>
                Choose what fits. Your message routes to the right person.
              </p>
            </m.div>
          </div>
        </section>

        <section style={{ padding: "1rem 0 6rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            {sent ? (
              <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ maxWidth: "500px" }}
              >
                <div style={{ padding: "2rem", borderRadius: "16px", background: "hsla(142,62%,46%,0.07)", border: "1px solid hsla(142,62%,46%,0.2)", textAlign: "center" }}>
                  <CheckCircle size={32} style={{ color: "hsl(142,62%,50%)", margin: "0 auto 1rem" }} />
                  <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "hsl(38,12%,90%)", marginBottom: "0.5rem" }}>Message received.</h2>
                  <p style={{ fontSize: "13.5px", color: "hsl(210,5%,56%)", lineHeight: 1.65 }}>
                    We will respond within 24 hours. Check your email for a confirmation.
                  </p>
                </div>
              </m.div>
            ) : (
              <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-5">
                  <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "0.875rem" }}>
                    Inquiry Type
                  </p>
                  <div className="space-y-1.5">
                    {INQUIRY_TYPES.map((type, i) => {
                      const isSelected = inquiryType === type.value;
                      return (
                        <m.button
                          key={type.value}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.35, delay: i * 0.05 }}
                          onClick={() => { setInquiryType(type.value); if (errors.inquiryType) setErrors((p) => { const n = { ...p }; delete n.inquiryType; return n; }); }}
                          style={{
                            width: "100%",
                            padding: "0.875rem 1rem",
                            borderRadius: "8px",
                            background: isSelected ? "hsla(190,90%,55%,0.07)" : "hsla(0,0%,100%,0.025)",
                            border: isSelected ? "1px solid hsla(190,90%,55%,0.28)" : "1px solid hsla(0,0%,100%,0.06)",
                            textAlign: "left",
                            cursor: "pointer",
                            transition: "all 0.18s ease",
                          }}
                          onMouseEnter={(e) => { if (!isSelected) { (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.04)"; (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.1)"; } }}
                          onMouseLeave={(e) => { if (!isSelected) { (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.025)"; (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.06)"; } }}
                        >
                          <p style={{ fontSize: "13px", fontWeight: 600, color: isSelected ? "hsl(190,90%,62%)" : "hsl(38,12%,80%)", letterSpacing: "-0.005em", marginBottom: "0.2rem" }}>{type.label}</p>
                          <p style={{ fontSize: "11.5px", color: "hsl(210,5%,46%)", lineHeight: 1.5 }}>{type.description}</p>
                        </m.button>
                      );
                    })}
                  </div>
                  {errors.inquiryType && <p style={{ fontSize: "11.5px", color: "hsl(0,72%,65%)", marginTop: "0.375rem" }}>{errors.inquiryType}</p>}
                </div>

                <m.div
                  className="lg:col-span-7"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: 500, color: "hsl(210,5%,52%)", marginBottom: "0.375rem", letterSpacing: "0.02em" }}>
                          Name *
                        </label>
                        <input type="text" placeholder="Stephen Lutar" {...field("name")} style={inputStyle(!!errors.name)} />
                        {errors.name && <p style={{ fontSize: "11px", color: "hsl(0,72%,65%)", marginTop: "0.25rem" }}>{errors.name}</p>}
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: 500, color: "hsl(210,5%,52%)", marginBottom: "0.375rem", letterSpacing: "0.02em" }}>
                          Email *
                        </label>
                        <input type="email" placeholder="you@company.com" {...field("email")} style={inputStyle(!!errors.email)} />
                        {errors.email && <p style={{ fontSize: "11px", color: "hsl(0,72%,65%)", marginTop: "0.25rem" }}>{errors.email}</p>}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 500, color: "hsl(210,5%,52%)", marginBottom: "0.375rem", letterSpacing: "0.02em" }}>
                        Company
                      </label>
                      <input type="text" placeholder="Organization (optional)" {...field("company")} style={inputStyle()} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 500, color: "hsl(210,5%,52%)", marginBottom: "0.375rem", letterSpacing: "0.02em" }}>
                        Message *
                      </label>
                      <textarea
                        rows={6}
                        placeholder={inquiryType === "demo" ? "Which platform interests you? What's your operational context?" : inquiryType === "investor" ? "Tell us about your thesis and what you're looking to discuss." : "Tell us what you'd like to explore."}
                        value={form.message}
                        onChange={(e) => { setForm((p) => ({ ...p, message: e.target.value })); if (errors.message) setErrors((p) => { const n = { ...p }; delete n.message; return n; }); }}
                        style={{ ...inputStyle(!!errors.message), resize: "vertical", lineHeight: 1.6, minHeight: "120px" }}
                      />
                      {errors.message && <p style={{ fontSize: "11px", color: "hsl(0,72%,65%)", marginTop: "0.25rem" }}>{errors.message}</p>}
                    </div>
                    {errors.general && <p style={{ fontSize: "12px", color: "hsl(0,72%,65%)" }}>{errors.general}</p>}
                    <div style={{ paddingTop: "0.25rem" }}>
                      <button
                        type="submit"
                        disabled={submitting}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "6px",
                          padding: "0.75rem 1.5rem", background: "hsl(210,8%,86%)",
                          color: "hsl(210,12%,6%)", border: "none", borderRadius: "6px",
                          fontSize: "13.5px", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
                          opacity: submitting ? 0.7 : 1, transition: "all 0.18s",
                          fontFamily: "inherit",
                        }}
                        onMouseEnter={(e) => { if (!submitting) (e.currentTarget as HTMLElement).style.background = "hsl(38,15%,95%)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(210,8%,86%)"; }}
                      >
                        <Send size={14} />
                        {submitting ? "Sending…" : "Send Message"}
                      </button>
                      <p style={{ fontSize: "11px", color: "hsl(210,5%,38%)", marginTop: "0.625rem", lineHeight: 1.5 }}>
                        Stored securely. You will receive an email confirmation. We respond within 24 hours.
                      </p>
                    </div>
                  </form>
                </m.div>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
