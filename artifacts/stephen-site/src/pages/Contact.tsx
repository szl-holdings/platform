import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API_BASE = BASE_URL.replace(/\/stephen$/, "") + "/api";

const inquiryTypes = [
  { value: "investment", label: "Investment" },
  { value: "partnership", label: "Partnership" },
  { value: "consultation", label: "Advisory / Consulting" },
  { value: "speaking", label: "Media / Speaking" },
  { value: "project", label: "Project engagement" },
  { value: "other", label: "Other" },
];

export function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", company: "", email: "", type: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        company: form.company || undefined,
        type: form.type || "other",
        message: form.message,
      };
      const res = await fetch(`${API_BASE}/stephen/booking-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to send message");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 lg:px-12 pt-28 pb-24">
        <div className="grid md:grid-cols-12 gap-14">
          <div className="md:col-span-5">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-primary/60 mb-3">Contact</p>
            <h1 className="text-3xl font-bold text-foreground mb-4">Get in touch</h1>
            <p className="text-muted-foreground text-[14px] leading-relaxed mb-8">
              I'm open to conversations about enterprise software partnerships, investment, advisory roles, and strategic engagements within the SZL portfolio.
            </p>
            <div className="space-y-3 mb-10">
              {inquiryTypes.map((type) => (
                <div key={type.value} className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-primary/40 mt-2 shrink-0" />
                  <span className="text-muted-foreground text-[13px]">{type.label}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/5 pt-6">
              <p className="text-[12px] text-muted-foreground/40">contact@stephenl.dev</p>
              <p className="text-[12px] text-muted-foreground/40 mt-1">London, UK</p>
            </div>
          </div>

          <div className="md:col-span-7">
            {submitted ? (
              <div className="border border-white/8 rounded-xl p-10 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold text-primary text-lg">SL</span>
                </div>
                <h3 className="text-[18px] font-bold text-foreground mb-2">Message received</h3>
                <p className="text-muted-foreground text-[13px]">I'll be in touch within two business days.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {[
                  { label: "Name", key: "name", type: "text", placeholder: "Your full name" },
                  { label: "Company", key: "company", type: "text", placeholder: "Organisation or firm" },
                  { label: "Email", key: "email", type: "email", placeholder: "you@company.com" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-[11px] font-medium tracking-[0.12em] uppercase text-muted-foreground/50 mb-1.5">{field.label}</label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={form[field.key as keyof typeof form]}
                      onChange={(e) => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                      required={field.key !== "company"}
                      className="w-full bg-white/3 border border-white/8 rounded-lg px-4 py-3 text-[13px] text-foreground placeholder-muted-foreground/30 focus:outline-none focus:border-primary/30 transition-colors"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-[11px] font-medium tracking-[0.12em] uppercase text-muted-foreground/50 mb-1.5">Purpose</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}
                    required
                    className="w-full bg-white/3 border border-white/8 rounded-lg px-4 py-3 text-[13px] text-foreground focus:outline-none focus:border-primary/30 transition-colors"
                  >
                    <option value="">Select purpose</option>
                    {inquiryTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium tracking-[0.12em] uppercase text-muted-foreground/50 mb-1.5">Message</label>
                  <textarea
                    placeholder="What would you like to discuss?"
                    value={form.message}
                    onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
                    rows={5}
                    required
                    className="w-full bg-white/3 border border-white/8 rounded-lg px-4 py-3 text-[13px] text-foreground placeholder-muted-foreground/30 focus:outline-none focus:border-primary/30 transition-colors resize-none"
                  />
                </div>
                {error && (
                  <p className="text-[12px] text-red-400/80">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-lg text-[13px] font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Contact;
