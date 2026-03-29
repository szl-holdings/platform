import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import testimonialsData from "@/data/testimonials.json";

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-28 lg:py-36 bg-navy-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6"
        >
          <p className="text-[11px] font-medium tracking-[0.4em] uppercase text-gold-400/70 mb-4">
            Client Perspectives
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-cream-50">
            In Their Words
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-sm text-cream-200/35 font-light max-w-xl mx-auto text-center leading-relaxed mb-20"
        >
          Senior leaders from organizations we've had the privilege of advising.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gold-500/5">
          {testimonialsData.slice(0, 3).map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="bg-navy-950 p-10 flex flex-col"
            >
              <Quote
                size={28}
                className="text-gold-500/15 mb-8"
                strokeWidth={1}
              />
              <p className="text-sm text-cream-200/45 leading-[1.8] flex-1 italic font-light">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-10 pt-6 border-t border-gold-500/8">
                <p className="text-sm font-medium text-cream-100 tracking-wide">{t.name}</p>
                <p className="text-xs text-cream-300/40 mt-1.5 leading-relaxed">{t.title}</p>
                <p className="text-xs text-gold-400/45 mt-0.5">{t.company}</p>
                <p className="text-[10px] text-cream-300/25 mt-1 tracking-wider uppercase">{t.context}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-px grid grid-cols-1 md:grid-cols-2 gap-px bg-gold-500/5 max-w-4xl lg:max-w-none lg:grid-cols-2 mx-auto">
          {testimonialsData.slice(3).map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: (idx + 3) * 0.15 }}
              className="bg-navy-950 p-10 flex flex-col"
            >
              <Quote
                size={28}
                className="text-gold-500/15 mb-8"
                strokeWidth={1}
              />
              <p className="text-sm text-cream-200/45 leading-[1.8] flex-1 italic font-light">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-10 pt-6 border-t border-gold-500/8">
                <p className="text-sm font-medium text-cream-100 tracking-wide">{t.name}</p>
                <p className="text-xs text-cream-300/40 mt-1.5 leading-relaxed">{t.title}</p>
                <p className="text-xs text-gold-400/45 mt-0.5">{t.company}</p>
                <p className="text-[10px] text-cream-300/25 mt-1 tracking-wider uppercase">{t.context}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
