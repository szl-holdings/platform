import { useState } from "react";
import { ChevronRight, Ship, AlertCircle } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API_BASE = `${BASE}/api`;

export default function MarketingDemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", company: "", email: "", fleet: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/demo-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          company: form.company,
          email: form.email,
          fleetSize: form.fleet,
          message: form.message,
          product: "vessels",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Submission failed");
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060e1a] text-sky-50">
      <MarketingNav />

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        <div className="grid md:grid-cols-2 gap-14">
          <div>
            <p className="text-[11px] font-semibold text-sky-400/60 tracking-[0.15em] uppercase mb-3">Request a Demo</p>
            <h1 className="text-3xl font-bold text-sky-50 mb-4">See Vessels built around your fleet</h1>
            <p className="text-sky-300/40 text-[14px] leading-relaxed mb-8">
              Every demo is configured to your fleet size, operational profile, and primary use case. We don't run generic product tours.
            </p>
            <div className="space-y-4">
              {[
                "Live session with the Vessels product team",
                "Fleet-specific configuration and data walkthrough",
                "Q&A on integration, security, and onboarding",
                "Pricing discussion based on your fleet profile",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400/60 mt-2 shrink-0" />
                  <span className="text-sky-300/50 text-[13.5px]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-2xl p-7">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto mb-4">
                  <Ship className="w-6 h-6 text-sky-400" />
                </div>
                <h3 className="text-[17px] font-bold text-sky-100 mb-2">Request received</h3>
                <p className="text-sky-300/40 text-[13px]">We'll be in touch within one business day to schedule your private demo.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-[15px] font-semibold text-sky-100 mb-1">Request a private demo</h3>
                {[
                  { label: "Name", key: "name", type: "text", placeholder: "Your full name" },
                  { label: "Company", key: "company", type: "text", placeholder: "Fleet operator or organisation" },
                  { label: "Work email", key: "email", type: "email", placeholder: "you@company.com" },
                  { label: "Fleet size", key: "fleet", type: "text", placeholder: "e.g. 12 vessels" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-[11px] font-medium text-sky-400/50 mb-1.5 uppercase tracking-[0.08em]">{field.label}</label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={form[field.key as keyof typeof form]}
                      onChange={(e) => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                      required
                      className="w-full bg-[#060e1a] border border-sky-500/15 rounded-lg px-3.5 py-2.5 text-[13px] text-sky-100 placeholder-sky-400/25 focus:outline-none focus:border-sky-500/40 transition-colors"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-[11px] font-medium text-sky-400/50 mb-1.5 uppercase tracking-[0.08em]">Tell us about your operation</label>
                  <textarea
                    placeholder="Primary pain points, current tooling, specific use cases..."
                    value={form.message}
                    onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
                    rows={3}
                    className="w-full bg-[#060e1a] border border-sky-500/15 rounded-lg px-3.5 py-2.5 text-[13px] text-sky-100 placeholder-sky-400/25 focus:outline-none focus:border-sky-500/40 transition-colors resize-none"
                  />
                </div>
                {submitError && (
                  <div className="flex items-center gap-2 text-sm text-red-400/80">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-sky-400 hover:bg-sky-300 text-[#060e1a] font-bold rounded-xl transition-all text-[14px] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Sending..." : <>Submit request <ChevronRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
