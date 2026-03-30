import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "wouter";

const QUALITIES = [
  { title: "Warm & approachable", desc: "Builds lasting relationships with principals and household teams alike." },
  { title: "Detail-oriented", desc: "Operational precision that comes naturally, not just from systems." },
  { title: "Discreet above all", desc: "Confidentiality is the foundation, not a feature." },
  { title: "Cross-domain capability", desc: "Estate management to logistics — a genuine single point of contact." },
  { title: "Understated confidence", desc: "Demonstrated through delivery, consistency, and quiet resolve." },
];

const EXPERIENCE = [
  { area: "Residence Operations", detail: "Full lifecycle management across primary and secondary residences, including multi-country coordination." },
  { area: "Household Systems", detail: "Operating systems, staff vetting, performance protocols, and coverage planning." },
  { area: "Vendor Management", detail: "Principal-facing vendor networks across 40+ service categories." },
  { area: "Estate Transitions", detail: "Complex activations, cross-border relocations, and renovation oversight." },
  { area: "Lifestyle Support", detail: "Administrative and lifestyle coordination for demanding schedules." },
];

export default function FounderPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream-warm)" }}>
      <Header />
      <div className="pt-24">
        <section className="py-20 lg:py-28" style={{ borderBottom: "1px solid var(--color-stone-200)" }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-20"
            >
              <div className="lg:col-span-7">
                <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-6" style={{ color: "var(--color-gold)" }}>
                  Carlota Jo
                </p>
                <h1 className="font-serif font-light leading-[1.1] mb-6" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--color-ink-900)" }}>
                  Fractional Director of Properties
                  <br />
                  <span style={{ fontStyle: "italic", opacity: 0.75 }}>and Residence</span>
                </h1>
                <p className="text-base font-light leading-relaxed mb-5" style={{ color: "var(--color-ink-600)" }}>
                  Rosa founded Carlota Jo for principals who need one person they can trust absolutely to manage the operational layer of their residential life.
                </p>
                <p className="text-sm font-light leading-relaxed mb-10" style={{ color: "var(--color-ink-500)" }}>
                  She operates with warmth, discretion, and the operational precision that makes everything look effortless from the outside.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 text-[13px] font-medium tracking-[0.08em] transition-colors"
                  style={{ color: "var(--color-cream)", background: "var(--color-gold)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold-light)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold)"; }}
                >
                  Request a Consultation
                </Link>
              </div>

              <div className="lg:col-span-5">
                <div className="p-8" style={{ background: "var(--color-stone-50)", border: "1px solid var(--color-stone-200)" }}>
                  <p className="text-[10px] font-medium tracking-[0.3em] uppercase mb-6" style={{ color: "var(--color-gold)" }}>
                    How Rosa works
                  </p>
                  <div className="space-y-4">
                    {[
                      "Single point of contact — every engagement",
                      "Deep immersion before advising",
                      "Absolute confidentiality, without exception",
                      "Proactive — anticipates before she responds",
                      "Long-term relationships over transactions",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <span style={{ color: "var(--color-gold)", marginTop: "0.15rem" }}>—</span>
                        <p className="text-[13px] font-light leading-relaxed" style={{ color: "var(--color-ink-600)" }}>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 lg:py-24" style={{ background: "var(--color-stone-50)", borderBottom: "1px solid var(--color-stone-200)" }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-8" style={{ color: "var(--color-gold)" }}>
                Areas of expertise
              </p>
              <div className="space-y-px" style={{ borderTop: "1px solid var(--color-stone-200)" }}>
                {EXPERIENCE.map((item, i) => (
                  <motion.div
                    key={item.area}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6"
                    style={{ borderBottom: "1px solid var(--color-stone-200)" }}
                  >
                    <div>
                      <p className="text-[13px] font-medium" style={{ color: "var(--color-ink-900)" }}>{item.area}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-[13px] font-light leading-relaxed" style={{ color: "var(--color-ink-600)" }}>{item.detail}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 lg:py-24" style={{ borderBottom: "1px solid var(--color-stone-200)" }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-8" style={{ color: "var(--color-gold)" }}>
                How she operates
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: "var(--color-stone-200)" }}>
                {QUALITIES.map((q, i) => (
                  <motion.div
                    key={q.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.07 }}
                    className="p-7"
                    style={{ background: "var(--color-cream-warm)" }}
                  >
                    <h3 className="font-serif text-base font-light mb-2" style={{ color: "var(--color-ink-900)" }}>{q.title}</h3>
                    <p className="text-[13px] font-light leading-relaxed" style={{ color: "var(--color-ink-500)" }}>{q.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-sm font-light mb-2" style={{ color: "var(--color-ink-500)" }}>
                Rosa accepts a limited number of new clients each year.
              </p>
              <p className="text-xs tracking-wide mb-8" style={{ color: "var(--color-stone-400)" }}>
                All enquiries handled with complete confidentiality.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2.5 px-8 py-4 text-[13px] font-medium tracking-[0.08em] transition-colors"
                style={{ color: "var(--color-cream)", background: "var(--color-gold)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold-light)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold)"; }}
              >
                Begin a Conversation
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
