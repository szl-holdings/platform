import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import testimonialsData from "@/data/testimonials.json";

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 lg:py-32 bg-navy-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-gold-400/80 mb-4">
            Client Perspectives
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-cream-50">
            What Leaders Say
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonialsData.slice(0, 3).map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="border border-gold-500/10 bg-navy-900/20 p-8 flex flex-col"
            >
              <Quote
                size={24}
                className="text-gold-500/20 mb-6"
                strokeWidth={1}
              />
              <p className="text-sm text-cream-200/50 leading-relaxed flex-1 italic font-light">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-8 pt-6 border-t border-gold-500/5">
                <p className="text-sm font-medium text-cream-100">{t.name}</p>
                <p className="text-xs text-cream-300/40 mt-1">{t.title}</p>
                <p className="text-xs text-gold-400/50 mt-0.5">{t.company}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {testimonialsData.slice(3).map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: (idx + 3) * 0.15 }}
              className="border border-gold-500/10 bg-navy-900/20 p-8 flex flex-col"
            >
              <Quote
                size={24}
                className="text-gold-500/20 mb-6"
                strokeWidth={1}
              />
              <p className="text-sm text-cream-200/50 leading-relaxed flex-1 italic font-light">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-8 pt-6 border-t border-gold-500/5">
                <p className="text-sm font-medium text-cream-100">{t.name}</p>
                <p className="text-xs text-cream-300/40 mt-1">{t.title}</p>
                <p className="text-xs text-gold-400/50 mt-0.5">{t.company}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
