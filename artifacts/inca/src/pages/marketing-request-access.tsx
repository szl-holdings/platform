import { useState } from "react";
import { ChevronRight, Brain } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { MarketingFooter } from "@/components/MarketingFooter";

export default function RequestAccessPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", useCase: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#060410] text-violet-50">
      <MarketingNav />

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        <div className="grid md:grid-cols-2 gap-14">
          <div>
            <p className="text-[11px] font-semibold text-violet-400/60 tracking-[0.15em] uppercase mb-3">Request Access</p>
            <h1 className="text-3xl font-bold text-violet-50 mb-4">Schedule a private walkthrough</h1>
            <p className="text-violet-300/40 text-[14px] leading-relaxed mb-8">
              INCA is available to qualified enterprise teams. Every walkthrough is configured for your specific intelligence operation and use case.
            </p>
            <div className="space-y-4">
              {[
                "Private session with the INCA product team",
                "Tailored demo for your intelligence workflow",
                "Discussion of explainability and compliance requirements",
                "Security architecture and data handling walkthrough",
                "Access considerations and integration pathway",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400/60 mt-2 shrink-0" />
                  <span className="text-violet-300/50 text-[13.5px]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0d0a1a]/80 border border-violet-500/10 rounded-2xl p-7">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="text-[17px] font-bold text-violet-100 mb-2">Request received</h3>
                <p className="text-violet-300/40 text-[13px]">We'll be in touch within two business days to schedule your private walkthrough.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-[15px] font-semibold text-violet-100 mb-1">Request access to INCA</h3>
                {[
                  { label: "Name", key: "name", type: "text", placeholder: "Your full name" },
                  { label: "Organisation", key: "company", type: "text", placeholder: "Enterprise or agency name" },
                  { label: "Work email", key: "email", type: "email", placeholder: "you@organisation.com" },
                  { label: "Primary use case", key: "useCase", type: "text", placeholder: "e.g. Security operations, AI research" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-[11px] font-medium text-violet-400/50 mb-1.5 uppercase tracking-[0.08em]">{field.label}</label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={form[field.key as keyof typeof form]}
                      onChange={(e) => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                      required
                      className="w-full bg-[#060410] border border-violet-500/15 rounded-lg px-3.5 py-2.5 text-[13px] text-violet-100 placeholder-violet-400/25 focus:outline-none focus:border-violet-500/40 transition-colors"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-[11px] font-medium text-violet-400/50 mb-1.5 uppercase tracking-[0.08em]">Describe your intelligence requirements</label>
                  <textarea
                    placeholder="Volume of signals, current tooling, key pain points..."
                    value={form.message}
                    onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
                    rows={3}
                    className="w-full bg-[#060410] border border-violet-500/15 rounded-lg px-3.5 py-2.5 text-[13px] text-violet-100 placeholder-violet-400/25 focus:outline-none focus:border-violet-500/40 transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded text-[14px] font-bold text-violet-50 bg-violet-600 hover:bg-violet-500 transition-colors"
                >
                  Submit request <ChevronRight className="w-4 h-4" />
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
