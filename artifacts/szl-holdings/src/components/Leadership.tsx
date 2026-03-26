import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import siteData from "@/data/site.json";

export function Leadership() {
  const { leadership } = siteData;

  return (
    <section id="leadership" className="py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-szl-text mb-4">
            {leadership.title}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-2xl border border-szl-border bg-szl-surface p-8 sm:p-12 mb-12"
        >
          <Quote size={40} className="text-szl-primary/20 mb-4" />
          <blockquote className="font-[var(--font-display)] text-xl sm:text-2xl text-szl-text leading-relaxed mb-6">
            {leadership.quote}
          </blockquote>
          <p className="text-szl-text-secondary text-sm font-medium">
            — {leadership.attribution}
          </p>

          <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-szl-primary/40 to-transparent" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-szl-text-secondary text-lg text-center max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          {leadership.vision}
        </motion.p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {leadership.values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="rounded-xl border border-szl-border bg-szl-surface p-5 hover:border-szl-border-hover transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-szl-primary/10 flex items-center justify-center mb-3">
                <span className="text-szl-primary-light font-bold text-sm">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="font-[var(--font-display)] text-base font-bold text-szl-text mb-2">
                {value.title}
              </h3>
              <p className="text-szl-text-secondary text-sm leading-relaxed">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
