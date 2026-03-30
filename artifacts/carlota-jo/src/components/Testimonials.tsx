import { motion } from "framer-motion";
import testimonialsData from "@/data/testimonials.json";

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 lg:py-40 bg-stone-50 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-20 lg:mb-28"
        >
          <p className="text-[11px] font-medium tracking-[0.35em] uppercase text-warm-gold mb-6">
            Client Perspectives
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-ink-900">
            In their words
          </h2>
        </motion.div>

        <div className="space-y-px bg-stone-200">
          {testimonialsData.slice(0, 3).map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-stone-50 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16 px-8 lg:px-12 py-12"
            >
              <div className="lg:col-span-8">
                <p className="font-serif text-xl lg:text-2xl font-light text-ink-900 leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>
              <div className="lg:col-span-4 flex items-end">
                <div>
                  <p className="text-sm font-medium text-ink-900 tracking-wide mb-1">
                    {t.name}
                  </p>
                  <p className="text-xs text-ink-500 mb-0.5 font-light">{t.title}</p>
                  <p className="text-xs text-stone-400 font-light">{t.company}</p>
                  {t.context && (
                    <p className="text-[10px] text-warm-gold/70 mt-2 tracking-wider uppercase font-medium">{t.context}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
