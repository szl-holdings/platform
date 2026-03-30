import { m } from "framer-motion";
import { Quote } from "lucide-react";
import siteData from "@/data/site.json";

export function Leadership() {
  const { leadership } = siteData;

  return (
    <section id="leadership" className="py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl lg:text-5xl font-bold text-szl-text mb-4">
            {leadership.title}
          </h2>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-2xl border border-szl-border bg-szl-surface p-8 sm:p-12 mb-12 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,102,241,0.06)_0%,transparent_60%)]" />
          <div className="relative">
            <Quote size={48} className="text-szl-primary/15 mb-6" />
            <blockquote className="font-[var(--font-display)] text-xl sm:text-2xl lg:text-[1.75rem] text-szl-text leading-relaxed mb-8">
              {leadership.quote}
            </blockquote>
            <p className="text-szl-text-secondary text-sm font-semibold tracking-wide uppercase">
              — {leadership.attribution}
            </p>
          </div>
          <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-szl-primary/40 to-transparent" />
          <div className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-szl-accent/20 to-transparent" />
        </m.div>

        <m.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-szl-text-secondary text-lg text-center max-w-4xl mx-auto mb-14 leading-relaxed"
        >
          {leadership.vision}
        </m.p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {leadership.values.map((value, index) => (
            <m.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group rounded-xl border border-szl-border bg-szl-surface p-5 hover:border-szl-border-hover hover:bg-szl-surface-hover transition-all duration-300"
            >
              <div className="w-9 h-9 rounded-lg bg-szl-primary/10 flex items-center justify-center mb-4 group-hover:bg-szl-primary/15 transition-colors">
                <span className="text-szl-primary-light font-bold text-sm font-[var(--font-display)]">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="font-[var(--font-display)] text-base font-bold text-szl-text mb-2">
                {value.title}
              </h3>
              <p className="text-szl-text-secondary text-sm leading-relaxed">
                {value.description}
              </p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
