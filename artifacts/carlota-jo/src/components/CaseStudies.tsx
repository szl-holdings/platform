import { motion } from "framer-motion";
import caseStudiesData from "@/data/case-studies.json";

export default function CaseStudies() {
  return (
    <section id="case-studies" className="py-24 lg:py-32 bg-navy-900/40">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-gold-400/80 mb-4">
            Results
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-cream-50">
            Proven Impact
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {caseStudiesData.map((study, idx) => (
            <motion.div
              key={study.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="border border-gold-500/10 bg-navy-950/60 p-8 lg:p-10 hover:border-gold-500/20 transition-all duration-500"
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="text-xs font-medium tracking-widest uppercase text-gold-400/80">
                  {study.industry}
                </span>
                <span className="w-px h-4 bg-gold-500/20" />
                <span className="text-xs text-cream-300/40">
                  {study.duration}
                </span>
              </div>

              <p className="text-sm text-cream-200/40 mb-2 italic">
                {study.client}
              </p>

              <h3 className="font-serif text-lg text-cream-50 mb-6">
                {study.headline}
              </h3>

              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                {study.metrics.map((m, i) => (
                  <div key={i} className="text-center">
                    <p className="font-serif text-xl sm:text-2xl font-light text-gold-400">
                      {m.value}
                    </p>
                    <p className="text-[10px] sm:text-xs text-cream-300/50 mt-1 leading-tight">
                      {m.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gold-500/5">
                <span className="inline-block px-3 py-1 text-xs tracking-wider uppercase text-gold-400/60 border border-gold-500/15">
                  {study.service}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
