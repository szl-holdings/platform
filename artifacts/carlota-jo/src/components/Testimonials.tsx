import { motion } from "framer-motion";
import testimonialsData from "@/data/testimonials.json";

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 lg:py-32 bg-navy-900/20 border-t border-cream-200/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-20"
        >
          <p className="text-[11px] font-medium tracking-[0.35em] uppercase text-gold-400 mb-5">
            Client Perspectives
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-cream-50">
            In their words
          </h2>
        </motion.div>

        <div className="space-y-px">
          {testimonialsData.slice(0, 3).map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 py-10 border-b border-cream-200/5 last:border-b-0"
            >
              <div className="lg:col-span-8">
                <p className="font-serif text-xl lg:text-2xl font-light text-cream-100 leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>
              <div className="lg:col-span-4 flex items-end">
                <div>
                  <p className="text-sm font-medium text-cream-50 tracking-wide">
                    {t.name}
                  </p>
                  <p className="text-xs text-cream-300/40 mt-1">
                    {t.title}
                  </p>
                  <p className="text-xs text-cream-300/30 mt-0.5">
                    {t.company}
                  </p>
                  <p className="text-[10px] text-gold-400/40 mt-1.5 tracking-wider uppercase">
                    {t.context}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
