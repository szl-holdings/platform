import { m } from "framer-motion";
import { CheckCircle } from "lucide-react";

const milestones = [
  "Portfolio foundation established",
  "Core ventures defined",
  "Product and advisory lanes activated",
  "Unified ecosystem experience in development",
  "Next-stage operational and commercial scaling ahead",
];

const developments = [
  "Advancing core product architecture",
  "Standardizing the shared design system",
  "Expanding premium client and partner pathways",
  "Strengthening observability, analytics, and commercial readiness",
];

const capabilities = [
  "Premium digital product direction",
  "Secure platform architecture",
  "Advisory-grade service design",
  "Ecosystem-wide brand consistency",
  "Commercial and operational readiness",
];

export function StrategicThesis() {
  return (
    <>
      <section className="py-24 lg:py-32 bg-szl-bg-secondary border-t border-szl-border">
        <div className="max-w-6xl mx-auto px-6">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-20"
          >
            <p className="text-szl-text-muted text-xs font-semibold uppercase tracking-widest mb-4">Strategic Thesis</p>
            <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-szl-text leading-tight mb-6">
              Why this portfolio exists.
            </h2>
            <p className="text-szl-text-secondary text-base leading-relaxed">
              The most valuable organizations are not built on noise. They are built on structure, visibility, trust, and execution. SZL Holdings exists to develop ventures and service models that reflect that standard, whether through platforms, advisory work, or operating frameworks designed for real-world use.
            </p>
          </m.div>

          <div className="grid md:grid-cols-2 gap-12">
            <m.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <p className="text-szl-text-muted text-xs font-semibold uppercase tracking-widest mb-5">Built in phases.</p>
              <h3 className="font-[var(--font-display)] text-xl font-bold text-szl-text mb-6">Positioned for longevity.</h3>
              <ul className="space-y-3">
                {milestones.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-szl-text-secondary">
                    <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </m.div>

            <m.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <p className="text-szl-text-muted text-xs font-semibold uppercase tracking-widest mb-5">Current priorities.</p>
              <h3 className="font-[var(--font-display)] text-xl font-bold text-szl-text mb-6">Across the ecosystem.</h3>
              <ul className="space-y-3">
                {developments.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-szl-text-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-szl-accent mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </m.div>
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-32 bg-white border-t border-szl-border">
        <div className="max-w-6xl mx-auto px-6">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-szl-text-muted text-xs font-semibold uppercase tracking-widest mb-4">Capabilities</p>
            <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-szl-text leading-tight">
              A portfolio grounded in execution.
            </h2>
          </m.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {capabilities.map((cap, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="p-5 rounded-xl border border-szl-border bg-szl-bg-secondary"
              >
                <p className="text-szl-text text-sm font-medium leading-snug">{cap}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-32 bg-szl-text border-t border-szl-text">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-white leading-tight mb-6">
              Explore what is being built.
            </h2>
            <p className="text-white/60 text-base max-w-2xl mx-auto mb-10 leading-relaxed">
              SZL Holdings is shaping a connected portfolio of platforms, services, and operating systems. Review the ventures, follow the roadmap, or start a strategic conversation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#portfolio"
                className="px-7 py-3.5 rounded-lg bg-white text-szl-text font-semibold text-sm hover:bg-white/90 transition-colors"
              >
                Explore the portfolio
              </a>
              <a
                href="#contact"
                className="px-7 py-3.5 rounded-lg border border-white/20 text-white font-semibold text-sm hover:border-white/40 hover:bg-white/5 transition-all"
              >
                Start a strategic conversation
              </a>
            </div>
          </m.div>
        </div>
      </section>
    </>
  );
}
