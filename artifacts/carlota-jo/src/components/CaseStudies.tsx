import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import caseStudiesData from "@/data/case-studies.json";

export default function CaseStudies() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <section id="case-studies" className="py-28 lg:py-36 bg-navy-900/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6"
        >
          <p className="text-[11px] font-medium tracking-[0.4em] uppercase text-gold-400/70 mb-4">
            Selected Engagements
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-cream-50">
            Proven Impact
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-sm text-cream-200/35 font-light max-w-2xl mx-auto text-center leading-relaxed mb-20"
        >
          Representative outcomes from recent advisory engagements. Client details anonymized to protect confidentiality.
        </motion.p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {caseStudiesData.map((study, idx) => {
            const isExpanded = expandedId === study.id;

            return (
              <motion.div
                key={study.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="border border-gold-500/8 bg-navy-950/60 p-8 lg:p-10 hover:border-gold-500/15 transition-all duration-500"
              >
                <div className="flex items-center gap-4 mb-5">
                  <span className="text-[11px] font-medium tracking-[0.2em] uppercase text-gold-400/70">
                    {study.industry}
                  </span>
                  <span className="w-px h-4 bg-gold-500/15" />
                  <span className="text-[11px] text-cream-300/35 tracking-wider">
                    {study.duration} engagement
                  </span>
                </div>

                <p className="text-xs text-cream-200/35 mb-3 italic font-light">
                  {study.client}
                </p>

                <h3 className="font-serif text-lg text-cream-50 mb-6 leading-snug">
                  {study.headline}
                </h3>

                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                  {study.metrics.map((m, i) => (
                    <div key={i} className="text-center py-4 border border-gold-500/5 bg-navy-900/20">
                      <p className="font-serif text-xl sm:text-2xl font-light text-gold-400">
                        {m.value}
                      </p>
                      <p className="text-[10px] sm:text-xs text-cream-300/40 mt-1.5 leading-tight tracking-wide">
                        {m.label}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setExpandedId(isExpanded ? null : study.id)}
                  className="flex items-center gap-2 text-[11px] font-medium tracking-[0.2em] uppercase text-gold-400/60 hover:text-gold-400 transition-colors mb-4"
                >
                  {isExpanded ? "Hide Details" : "View Approach"}
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 border-t border-gold-500/8 space-y-3">
                        <div>
                          <p className="text-[11px] tracking-wider uppercase text-gold-400/50 mb-1.5">Challenge</p>
                          <p className="text-sm text-cream-200/35 leading-relaxed font-light">{study.challenge}</p>
                        </div>
                        <div>
                          <p className="text-[11px] tracking-wider uppercase text-gold-400/50 mb-1.5">Our Approach</p>
                          <p className="text-sm text-cream-200/35 leading-relaxed font-light">{study.approach}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-5 border-t border-gold-500/5">
                  <span className="inline-block px-3 py-1.5 text-[11px] tracking-[0.15em] uppercase text-gold-400/50 border border-gold-500/10">
                    {study.service}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
