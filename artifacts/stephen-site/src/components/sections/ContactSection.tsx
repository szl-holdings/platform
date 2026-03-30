import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", context: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const basePath = import.meta.env.BASE_URL || "/";
      const apiBase = basePath.replace(/\/$/, "") + "/api";
      await fetch(`${apiBase}/cms/contact-submissions`, {
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
    } catch {
    }
    setSubmitted(true);
  };

  return (
    <section id="contact" className="py-24 lg:py-32 bg-[#0a0e14] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <p className="text-[11px] font-medium tracking-[0.3em] uppercase text-[#7ba3d4]/60 mb-6">
              Contact
            </p>
            <h2 className="text-4xl md:text-5xl font-semibold text-white leading-tight tracking-tight mb-8">
              Start a conversation.
            </h2>
            <p className="text-white/50 text-base font-light leading-relaxed mb-10">
              If you are building around visibility, workflow clarity, observability, or modern operating systems, let's connect.
            </p>
            <div className="space-y-4">
              {[
                ["Response time", "Within 48 hours on all enquiries."],
                ["Engagements", "Select fractional work only — limited slots."],
                ["Format", "Introductory call, then we go from there."],
              ].map(([label, text]) => (
                <div key={label} className="flex gap-4">
                  <div className="w-4 h-[1px] bg-[#7ba3d4]/30 shrink-0 mt-[0.65rem]" />
                  <div>
                    <p className="text-[12px] font-medium text-[#7ba3d4]/60 mb-0.5">{label}</p>
                    <p className="text-[13px] text-white/35 font-light">{text}</p>
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
              <div className="py-12">
                <div className="w-8 h-[1px] bg-[#7ba3d4] mb-7" />
                <h3 className="text-2xl font-semibold text-white mb-3 tracking-tight">Request received</h3>
                <p className="text-white/45 text-base font-light leading-relaxed max-w-sm">
                  I'll be in touch within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] tracking-[0.2em] uppercase text-white/28 font-medium mb-2">
                      Your name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-transparent border border-white/10 text-white/80 text-[14px] font-light px-4 py-3 placeholder-white/18 focus:outline-none focus:border-[#7ba3d4]/40 transition-colors duration-200"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] tracking-[0.2em] uppercase text-white/28 font-medium mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-transparent border border-white/10 text-white/80 text-[14px] font-light px-4 py-3 placeholder-white/18 focus:outline-none focus:border-[#7ba3d4]/40 transition-colors duration-200"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] tracking-[0.2em] uppercase text-white/28 font-medium mb-2">
                    What you're working on
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.context}
                    onChange={(e) => setForm({ ...form, context: e.target.value })}
                    className="w-full bg-transparent border border-white/10 text-white/80 text-[14px] font-light px-4 py-3 placeholder-white/18 focus:outline-none focus:border-[#7ba3d4]/40 transition-colors duration-200 resize-none"
                    placeholder="Brief context on the challenge or opportunity..."
                  />
                </div>
                <button
                  type="submit"
                  className="group inline-flex items-center gap-2.5 px-8 py-3.5 text-[13px] font-medium tracking-[0.07em] text-white bg-[#4a6fa5] hover:bg-[#5a80b8] transition-colors duration-300"
                >
                  Send request
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
