import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function InquiryForm() {
  const [form, setForm] = useState({
    name: "",
    organisation: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="inquire" className="py-24 lg:py-32 bg-[#06080c] border-t border-[#f5f0e8]/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <p className="text-[11px] font-medium tracking-[0.35em] uppercase text-[#c8a96a]/70 mb-6">
              Enquiries
            </p>
            <h2
              className="text-4xl md:text-5xl font-light text-[#f5f0e8] leading-tight mb-8"
              style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
            >
              Begin a
              <br />
              <em>private conversation</em>
            </h2>
            <p className="text-[#f5f0e8]/50 text-base font-light leading-relaxed mb-10">
              We work with a small number of clients at any time. If you are facing
              a consequential decision and want a candid second opinion, we would
              like to hear from you.
            </p>
            <div className="space-y-5">
              {[
                ["Confidentiality", "All enquiries are treated in strict confidence."],
                ["Response time", "We respond to all enquiries within 48 hours."],
                ["No obligation", "An initial conversation carries no commitment."],
              ].map(([label, text]) => (
                <div key={label} className="flex gap-4">
                  <div className="w-4 h-[1px] bg-[#c8a96a]/30 shrink-0 mt-[0.65rem]" />
                  <div>
                    <p className="text-[12px] font-medium text-[#c8a96a]/70 mb-0.5">{label}</p>
                    <p className="text-[13px] text-[#f5f0e8]/40 font-light">{text}</p>
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
                <div className="w-8 h-[1px] bg-[#c8a96a] mb-8" />
                <h3
                  className="text-3xl font-light text-[#f5f0e8] mb-4"
                  style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
                >
                  Enquiry received
                </h3>
                <p className="text-[#f5f0e8]/50 text-base font-light leading-relaxed max-w-sm">
                  Thank you. We will be in touch within 48 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] tracking-[0.2em] uppercase text-[#f5f0e8]/30 font-medium mb-2">
                      Full name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-transparent border border-[#f5f0e8]/10 text-[#f5f0e8]/80 text-[14px] font-light px-4 py-3 placeholder-[#f5f0e8]/20 focus:outline-none focus:border-[#c8a96a]/40 transition-colors duration-200"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] tracking-[0.2em] uppercase text-[#f5f0e8]/30 font-medium mb-2">
                      Organisation
                    </label>
                    <input
                      type="text"
                      value={form.organisation}
                      onChange={(e) => setForm({ ...form, organisation: e.target.value })}
                      className="w-full bg-transparent border border-[#f5f0e8]/10 text-[#f5f0e8]/80 text-[14px] font-light px-4 py-3 placeholder-[#f5f0e8]/20 focus:outline-none focus:border-[#c8a96a]/40 transition-colors duration-200"
                      placeholder="Company or institution"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] tracking-[0.2em] uppercase text-[#f5f0e8]/30 font-medium mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-transparent border border-[#f5f0e8]/10 text-[#f5f0e8]/80 text-[14px] font-light px-4 py-3 placeholder-[#f5f0e8]/20 focus:outline-none focus:border-[#c8a96a]/40 transition-colors duration-200"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] tracking-[0.2em] uppercase text-[#f5f0e8]/30 font-medium mb-2">
                    Nature of enquiry
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full bg-transparent border border-[#f5f0e8]/10 text-[#f5f0e8]/80 text-[14px] font-light px-4 py-3 placeholder-[#f5f0e8]/20 focus:outline-none focus:border-[#c8a96a]/40 transition-colors duration-200 resize-none"
                    placeholder="Briefly describe the challenge or decision you are navigating..."
                  />
                </div>
                <button
                  type="submit"
                  className="group inline-flex items-center gap-2.5 px-8 py-3.5 text-[13px] font-medium tracking-[0.08em] text-[#07090d] bg-[#c8a96a] hover:bg-[#d4b87a] transition-colors duration-300"
                >
                  Submit enquiry privately
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                </button>
                <p className="text-[11px] text-[#f5f0e8]/20 font-light">
                  Your enquiry is encrypted in transit and treated in strict confidence.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
