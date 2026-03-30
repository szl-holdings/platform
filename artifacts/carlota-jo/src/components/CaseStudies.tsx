import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import caseStudiesData from "@/data/case-studies.json";

export default function CaseStudies() {
  return (
    <section id="case-studies" className="py-24 lg:py-40 bg-taupe-50 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-20 lg:mb-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5"
          >
            <p className="text-[11px] font-medium tracking-[0.35em] uppercase text-warm-gold mb-6">
              Selected Engagements
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-ink-900 leading-tight">
              Results that
              <br />
              <span className="italic">speak for themselves</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-7 flex items-end"
          >
            <p className="text-sm text-ink-600 font-light leading-relaxed max-w-xl">
              Representative outcomes from recent advisory engagements. Client details are anonymized to protect confidentiality — the outcomes are real.
            </p>
          </motion.div>
        </div>

        <div className="space-y-px bg-stone-200">
          {caseStudiesData.map((study, idx) => (
            <motion.div
              key={study.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group bg-taupe-50 hover:bg-stone-100 transition-all duration-500"
            >
              <div className="p-8 lg:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                  <div className="lg:col-span-7">
                    <div className="flex items-center gap-4 mb-5">
                      <span className="text-[11px] font-medium tracking-[0.2em] uppercase text-warm-gold">
                        {study.industry}
                      </span>
                      <span className="w-px h-3 bg-stone-300" />
                      <span className="text-[11px] text-stone-400 tracking-wider font-light">
                        {study.duration}
                      </span>
                    </div>

                    <p className="text-xs text-stone-400 mb-2 font-light tracking-wide">
                      {study.client}
                    </p>

                    <h3 className="font-serif text-xl lg:text-2xl font-light text-ink-900 leading-snug mb-5 group-hover:text-ink-700 transition-colors duration-300">
                      {study.headline}
                    </h3>

                    <p className="text-[13px] text-ink-600 leading-relaxed font-light mb-5 max-w-lg">
                      {study.approach}
                    </p>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] tracking-[0.15em] uppercase text-stone-400 border border-stone-200 px-3 py-1 font-light">
                        {study.service}
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <div className="grid grid-cols-3 gap-px bg-stone-200 h-full">
                      {study.metrics.map((m, i) => (
                        <div
                          key={i}
                          className="bg-taupe-50 group-hover:bg-stone-100 transition-colors duration-500 flex flex-col items-center justify-center p-5 lg:p-6 text-center"
                        >
                          <p className="font-serif text-2xl lg:text-3xl font-light text-warm-gold mb-2">
                            {m.value}
                          </p>
                          <p className="text-[10px] text-stone-400 leading-tight tracking-wide uppercase font-light">
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
            onClick={() => document.querySelector("#inquire")?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.15em] uppercase text-warm-gold hover:text-warm-gold-light transition-colors"
          >
            Discuss a similar engagement
            <ArrowRight size={12} />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
