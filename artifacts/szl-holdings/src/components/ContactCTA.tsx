import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

export function ContactCTA() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contact" className="py-20 lg:py-28 bg-neutral-50 border-b border-neutral-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-start">
          <m.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-neutral-400 mb-4">Enquiries</p>
            <h2 className="text-[1.875rem] sm:text-[2.5rem] font-bold tracking-tight text-neutral-900 leading-[1.1] mb-5">
              Start a strategic conversation
            </h2>
            <p className="text-neutral-500 text-base leading-relaxed mb-8 max-w-sm">
              For investor relations, strategic partnerships, and portfolio enquiries.
              We respond within 24 hours.
            </p>
            <div className="space-y-3 text-[13px] text-neutral-400">
              <div>
                <p className="font-medium text-neutral-600 mb-0.5">General inquiries</p>
                <p>inquiries@szlholdings.com</p>
              </div>
              <div>
                <p className="font-medium text-neutral-600 mb-0.5">Headquarters</p>
                <p>Washington, D.C. · London · Singapore</p>
              </div>
            </div>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {submitted ? (
              <div className="p-8 rounded-xl border border-neutral-100 bg-white text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-emerald-500 text-lg">✓</span>
                </div>
                <p className="text-neutral-900 font-semibold mb-1.5">Message received</p>
                <p className="text-neutral-500 text-[13.5px]">Our team will respond within 24 business hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 rounded-xl border border-neutral-100 bg-white space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1.5 tracking-wide">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 text-[13.5px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[hsl(215,45%,40%)] transition-colors bg-white"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1.5 tracking-wide">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 text-[13.5px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[hsl(215,45%,40%)] transition-colors bg-white"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 mb-1.5 tracking-wide">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 text-[13.5px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[hsl(215,45%,40%)] transition-colors bg-white resize-none"
                    placeholder="Investor inquiry, strategic partnership, or portfolio enquiry"
                  />
                </div>
                <button
                  type="submit"
                  className="group flex items-center gap-2 w-full justify-center px-6 py-3 rounded-lg text-[13.5px] font-semibold text-white bg-[hsl(215,45%,32%)] hover:bg-[hsl(215,45%,38%)] transition-colors duration-200"
                >
                  Send enquiry
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                </button>
              </form>
            )}
          </m.div>
        </div>
      </div>
    </section>
  );
}
