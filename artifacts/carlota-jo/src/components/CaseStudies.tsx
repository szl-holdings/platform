import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import caseStudiesData from "@/data/case-studies.json";

export default function CaseStudies() {
  return (
    <section id="case-studies" className="py-24 lg:py-32 bg-navy-900/20 border-t border-cream-200/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5"
          >
            <p className="text-[11px] font-medium tracking-[0.35em] uppercase text-gold-400 mb-5">
              Selected Engagements
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-cream-50 leading-tight">
              Results that
              <br />
              speak clearly
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-7 flex items-end"
          >
            <p className="text-sm text-cream-200/65 font-light leading-relaxed max-w-xl">
              Representative outcomes from recent advisory engagements. Client
              details are anonymized to protect confidentiality.
            </p>
          </motion.div>
        </div>

        <div className="space-y-px">
          {caseStudiesData.map((study, idx) => (
            <motion.div
              key={study.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group bg-navy-950 hover:bg-navy-900/40 transition-all duration-500 border-b border-cream-200/5 last:border-b-0"
            >
              <div className="p-8 lg:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-7">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-[11px] font-medium tracking-[0.2em] uppercase text-gold-400/70">
                        {study.industry}
                      </span>
                      <span className="w-px h-3 bg-cream-200/10" />
                      <span className="text-[11px] text-cream-300/30 tracking-wider">
                        {study.duration}
                      </span>
                    </div>

                    <p className="text-xs text-cream-200/30 mb-2 font-light">
                      {study.client}
                    </p>

                    <h3 className="font-serif text-xl lg:text-2xl font-light text-cream-50 leading-snug mb-4">
                      {study.headline}
                    </h3>

                    <p className="text-[13px] text-cream-200/65 leading-relaxed font-light mb-4 max-w-lg">
                      {study.approach}
                    </p>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] tracking-[0.15em] uppercase text-cream-300/25 border border-cream-200/8 px-3 py-1">
                        {study.service}
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <div className="grid grid-cols-3 gap-px bg-cream-200/5 h-full">
                      {study.metrics.map((m, i) => (
                        <div
                          key={i}
                          className="bg-navy-950 group-hover:bg-navy-900/40 transition-colors duration-500 flex flex-col items-center justify-center p-5 lg:p-6 text-center"
                        >
                          <p className="font-serif text-2xl lg:text-3xl font-light text-gold-400 mb-2">
                            {m.value}
                          </p>
                          <p className="text-[10px] text-cream-300/35 leading-tight tracking-wide uppercase">
                            {m.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <button
            onClick={() =>
              document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })
            }
            className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.15em] uppercase text-gold-400/60 hover:text-gold-400 transition-colors"
          >
            Discuss a similar engagement
            <ArrowRight size={13} />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
