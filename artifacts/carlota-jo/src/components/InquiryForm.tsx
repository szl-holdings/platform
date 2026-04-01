import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, AlertCircle } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API_BASE = `${BASE}/api`;

export default function InquiryForm() {
  const [form, setForm] = useState({
    name: "",
    organisation: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/cms/contact-submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: 4,
          formKey: "carlota_inquiry",
          fullName: form.name,
          email: form.email,
          message: form.message,
          metadataJson: { organisation: form.organisation },
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      setSubmitError("Something went wrong. Please email us at inquiries@carlotajo.com");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="inquire" className="py-24 lg:py-32 bg-cream-deep border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <p className="cj-eyebrow mb-6">Enquiries</p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-ink-900 leading-tight mb-8">
              Begin a
              <br />
              <em>private conversation</em>
            </h2>
            <p className="text-ink-500 text-sm font-light leading-relaxed mb-10">
              We work with a small number of clients at a time. If you are facing a consequential decision and want a candid second opinion, we'd like to hear from you.
            </p>
            <div className="space-y-5">
              {[
                ["Confidentiality", "All enquiries are treated in strict confidence."],
                ["Response", "We respond within 48 hours."],
                ["No commitment", "An initial conversation carries no obligation."],
              ].map(([label, text]) => (
                <div key={label} className="flex gap-4">
                  <div className="w-4 h-[1px] bg-gold/30 shrink-0 mt-[0.65rem]" />
                  <div>
                    <p className="text-[12px] font-medium text-gold mb-0.5">{label}</p>
                    <p className="text-[13px] text-ink-500 font-light">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7"
          >
            {submitted ? (
              <div className="h-full flex flex-col justify-center py-12">
                <div className="w-8 h-[1px] bg-gold mb-8" />
                <h3 className="font-serif text-3xl font-light text-ink-900 mb-4">
                  Enquiry received
                </h3>
                <p className="text-ink-500 text-base font-light leading-relaxed max-w-sm">
                  Thank you. We will be in touch within 48 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] tracking-[0.2em] uppercase text-ink-400 font-medium mb-2">
                      Full name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="cj-input"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] tracking-[0.2em] uppercase text-ink-400 font-medium mb-2">
                      Organisation
                    </label>
                    <input
                      type="text"
                      value={form.organisation}
                      onChange={(e) => setForm({ ...form, organisation: e.target.value })}
                      className="cj-input"
                      placeholder="Company or institution"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] tracking-[0.2em] uppercase text-ink-400 font-medium mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="cj-input"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] tracking-[0.2em] uppercase text-ink-400 font-medium mb-2">
                    Nature of enquiry
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="cj-input resize-none"
                    placeholder="Briefly describe the challenge or decision you are navigating..."
                  />
                </div>
                {submitError && (
                  <div className="flex items-center gap-2 text-[12px] text-red-500/70">
                    <AlertCircle size={13} />
                    <span>{submitError}</span>
                  </div>
                )}
                <button type="submit" disabled={submitting} className="cj-btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
                  {submitting ? "Submitting..." : <>Submit enquiry <ArrowRight size={13} /></>}
                </button>
                <p className="text-[11px] text-ink-400/60 font-light">
                  Treated in strict confidence.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
