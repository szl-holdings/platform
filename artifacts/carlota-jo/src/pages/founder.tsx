import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "wouter";

const QUALITIES = [
  {
    title: "Warm and approachable",
    desc: "Rosa builds relationships with principals and household teams alike. Her presence creates calm, not complexity.",
  },
  {
    title: "Detail-oriented by nature",
    desc: "The operational precision that defines Carlota Jo comes naturally — not from systems alone, but from how Rosa thinks about every engagement.",
  },
  {
    title: "Discreet above all",
    desc: "Confidentiality is not a feature Rosa offers — it's the foundation on which every client relationship is built.",
  },
  {
    title: "Capable across every domain",
    desc: "From estate management to cross-border logistics, Rosa's range of operational capability is what allows her to serve as a genuine single point of contact.",
  },
  {
    title: "Understated confidence",
    desc: "Rosa doesn't announce what she can do. She demonstrates it — through delivery, consistency, and the quiet confidence of someone who has handled far more complex situations than the one in front of her.",
  },
];

const EXPERIENCE = [
  {
    area: "Residence Operations",
    detail: "Full lifecycle management across primary and secondary residences for high-net-worth families, including multi-country coordination and seasonal transitions.",
  },
  {
    area: "Household Systems & Staff",
    detail: "Designed and documented household operating systems for principals with exacting standards, including staff vetting, performance protocols, and coverage planning.",
  },
  {
    area: "Vendor & Service Management",
    detail: "Built and maintained principal-facing vendor networks across 40+ service categories, managing relationships with discretion and precision.",
  },
  {
    area: "Estate Transitions",
    detail: "Managed complex estate activations, cross-border relocations, and large-scale renovation projects — coordinating up to 20 vendors simultaneously without principal involvement.",
  },
  {
    area: "Administrative & Lifestyle Support",
    detail: "Provided comprehensive administrative and lifestyle coordination for principals with demanding schedules and high standards across personal and professional domains.",
  },
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
                  Rosa Lutar
                </p>
                <h1 className="font-serif font-light leading-[1.1] mb-6" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--color-ink-900)" }}>
                  Fractional Director of Properties
                  <br />
                  <span style={{ fontStyle: "italic", opacity: 0.75 }}>and Residence</span>
                </h1>
                <p className="text-base font-light leading-relaxed mb-5" style={{ color: "var(--color-ink-600)" }}>
                  Rosa Lutar founded Carlota Jo Consulting to bring a level of operational capability to private residential environments that simply wasn't available through traditional property management or household staffing channels.
                </p>
                <p className="text-sm font-light leading-relaxed mb-5" style={{ color: "var(--color-ink-500)" }}>
                  The principals Rosa works with share a common challenge: their environments are complex, their standards are non-negotiable, and they need someone they can trust absolutely — not a company, not a team, but one person who holds the whole picture and keeps it moving.
                </p>
                <p className="text-sm font-light leading-relaxed mb-10" style={{ color: "var(--color-ink-500)" }}>
                  Rosa built her career at the intersection of estate management, operational design, and high-trust client service. She operates with the warmth that builds long-term relationships, the discretion that principals require, and the operational precision that makes everything look effortless from the outside.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 text-[13px] font-medium tracking-[0.08em] transition-colors"
                  style={{ color: "var(--color-cream)", background: "var(--color-gold)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold-light)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold)"; }}
                >
                  Request a Confidential Consultation
                </Link>
              </div>

              <div className="lg:col-span-5">
                <div className="p-8" style={{ background: "var(--color-stone-50)", border: "1px solid var(--color-stone-200)" }}>
                  <p className="text-[10px] font-medium tracking-[0.3em] uppercase mb-6" style={{ color: "var(--color-gold)" }}>
                    How Rosa works
                  </p>
                  <div className="space-y-5">
                    {[
                      "Single point of contact across every engagement",
                      "Deep immersion in the client's environment before advising",
                      "Absolute confidentiality — always, without exception",
                      "Proactive, not reactive — she anticipates before she responds",
                      "Long-term relationships over transactional engagements",
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
                    <h3 className="font-serif text-base font-light mb-3" style={{ color: "var(--color-ink-900)" }}>{q.title}</h3>
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
                All enquiries are handled with complete confidentiality.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2.5 px-8 py-4 text-[13px] font-medium tracking-[0.08em] transition-colors"
                style={{ color: "var(--color-cream)", background: "var(--color-gold)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold-light)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold)"; }}
              >
                Request a Confidential Consultation
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
