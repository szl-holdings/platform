import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Linkedin, Github, Mail } from "lucide-react";

export function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", context: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/cms/contact-submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: 5,
          formKey: "stephen_contact",
          fullName: form.name,
          email: form.email,
          message: form.context,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      setSubmitError("Something went wrong. Please email me directly at stephenlutar2@gmail.com");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 lg:py-32 bg-[#080b12] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12" ref={ref}>
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-[2px]" style={{ background: "linear-gradient(90deg, #D4A054, transparent)" }} />
              <span className="text-[11px] font-bold tracking-[0.25em] uppercase" style={{ color: "rgba(212,160,84,0.6)" }}>
                Contact
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight mb-6" style={{ color: "rgba(255,255,255,0.95)" }}>
              Start a<br />
              <span style={{ color: "rgba(255,255,255,0.3)" }}>conversation.</span>
            </h2>
            <p className="text-base font-light leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.4)" }}>
              Open to design partner conversations, enterprise evaluation, consulting engagements, and investment introductions.
            </p>

            <div className="space-y-4 mb-10">
              {[
                { label: "Response time", value: "Within 48 hours" },
                { label: "Engagements", value: "Select fractional work — limited slots" },
                { label: "Format", value: "Introductory call, then we go from there" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start gap-3 p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: "#D4A054" }} />
                  <div>
                    <p className="text-[11px] font-bold tracking-[0.15em] uppercase mb-0.5" style={{ color: "rgba(212,160,84,0.6)" }}>{label}</p>
                    <p className="text-[13px] font-light" style={{ color: "rgba(255,255,255,0.4)" }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-5">
              <a href="https://linkedin.com/in/stephenlutar" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[12px] font-medium transition-colors" style={{ color: "rgba(255,255,255,0.25)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.25)"; }}>
                <Linkedin size={14} /> LinkedIn
              </a>
              <a href="https://github.com/szl-holdings" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[12px] font-medium transition-colors" style={{ color: "rgba(255,255,255,0.25)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.25)"; }}>
                <Github size={14} /> GitHub
              </a>
              <a href="mailto:stephenlutar2@gmail.com" className="inline-flex items-center gap-2 text-[12px] font-medium transition-colors" style={{ color: "rgba(255,255,255,0.25)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.25)"; }}>
                <Mail size={14} /> Email
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.12 }}
            className="lg:col-span-7"
          >
            {submitted ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: "#22C55E", boxShadow: "0 0 12px rgba(34,197,94,0.5)" }} />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-3" style={{ color: "rgba(255,255,255,0.9)" }}>Request received</h3>
                <p className="text-base font-light" style={{ color: "rgba(255,255,255,0.4)" }}>
                  I'll be in touch within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 p-7 lg:p-8" style={{ background: "rgba(12,16,24,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-bold mb-2.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                      Your name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full text-[14px] font-light px-4 py-3.5 transition-all duration-200 outline-none"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.8)",
                      }}
                      onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.4)"; }}
                      onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-bold mb-2.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full text-[14px] font-light px-4 py-3.5 transition-all duration-200 outline-none"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.8)",
                      }}
                      onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.4)"; }}
                      onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase font-bold mb-2.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                    What you're working on
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.context}
                    onChange={(e) => setForm({ ...form, context: e.target.value })}
                    className="w-full text-[14px] font-light px-4 py-3.5 transition-all duration-200 resize-none outline-none"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.8)",
                    }}
                    onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "rgba(99,102,241,0.4)"; }}
                    onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
                    placeholder="Brief context on the challenge or opportunity..."
                  />
                </div>
                {submitError && (
                  <p className="text-[12px] font-light" style={{ color: "rgba(239,68,68,0.8)" }}>{submitError}</p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="group inline-flex items-center gap-3 px-8 py-4 text-[14px] font-bold tracking-wide transition-all duration-200 disabled:opacity-50"
                  style={{ background: "white", color: "#080b12" }}
                  onMouseEnter={(e) => { if (!submitting) (e.currentTarget as HTMLElement).style.background = "#E2E8F0"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "white"; }}
                >
                  {submitting ? "Sending..." : "Send request"}
                  {!submitting && <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
