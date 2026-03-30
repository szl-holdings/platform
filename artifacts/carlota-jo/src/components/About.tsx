import { motion } from "framer-motion";

export default function About() {
  return (
    <section id="about" className="py-24 lg:py-32 bg-[#07090d] border-t border-[#f5f0e8]/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-20 items-start">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5"
          >
            <p className="text-[11px] font-medium tracking-[0.35em] uppercase text-[#c8a96a]/70 mb-6">
              The practice
            </p>
            <h2
              className="text-4xl md:text-5xl font-light text-[#f5f0e8] leading-tight mb-8"
              style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
            >
              Founder-led.
              <br />
              <em>Principal-advised.</em>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-7"
          >
            <p className="text-[#f5f0e8]/60 text-base font-light leading-relaxed mb-6">
              Carlota Jo Consulting is a principal advisory practice. Every engagement is led by
              the founding advisor from intake through execution — not delegated to associates
              or junior consultants.
            </p>
            <p className="text-[#f5f0e8]/55 text-base font-light leading-relaxed mb-8">
              We work with boards, leadership teams, and investors navigating complex
              strategic decisions: capital allocation, governance reform, market entry,
              operational transformation, and sensitive stakeholder situations.
            </p>

            <div className="border-t border-[#f5f0e8]/8 pt-8 space-y-5">
              {[
                "Board and governance advisory",
                "Capital strategy and allocation",
                "Operational transformation",
                "M&A and transaction support",
                "Senior stakeholder engagement",
              ].map((item) => (
                <div key={item} className="flex items-center gap-4">
                  <div className="w-4 h-[1px] bg-[#c8a96a]/40 shrink-0" />
                  <p className="text-[#f5f0e8]/50 text-[13.5px] font-light">{item}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
