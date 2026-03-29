import { motion } from "framer-motion";
import { Check } from "lucide-react";
import tiersData from "@/data/tiers.json";

export default function Pricing() {
  return (
    <section id="pricing" className="py-28 lg:py-36 bg-navy-900/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6"
        >
          <p className="text-[11px] font-medium tracking-[0.4em] uppercase text-gold-400/70 mb-4">
            Engagement Models
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-cream-50">
            Structured for Impact
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-sm text-cream-200/35 font-light max-w-xl mx-auto text-center leading-relaxed mb-20"
        >
          Three engagement models calibrated to the scope and cadence of your strategic needs.
        </motion.p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-gold-500/5">
          {tiersData.map((tier, idx) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className={`relative p-10 lg:p-12 flex flex-col ${
                tier.highlighted
                  ? "bg-navy-900/50"
                  : "bg-navy-950"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
              )}

              {tier.highlighted && (
                <span className="absolute top-6 right-8 text-[10px] tracking-[0.2em] uppercase text-gold-400/60 font-medium">
                  Most Selected
                </span>
              )}

              <div className="mb-8">
                <span className="text-[11px] font-medium tracking-[0.2em] uppercase text-gold-400/50">
                  {tier.type}
                </span>
                <h3 className="font-serif text-2xl font-medium text-cream-50 mt-3">
                  {tier.name}
                </h3>
              </div>

              <div className="mb-8">
                <span className="font-serif text-4xl font-light text-cream-50">
                  {tier.price}
                </span>
                <span className="text-sm text-cream-300/35 ml-2 font-light">
                  {tier.priceNote}
                </span>
              </div>

              <p className="text-sm text-cream-200/35 leading-relaxed mb-10 font-light">
                {tier.description}
              </p>

              <ul className="space-y-3.5 mb-12 flex-1">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-cream-300/50 font-light"
                  >
                    <Check
                      size={14}
                      className="text-gold-500/50 mt-0.5 shrink-0"
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/book?tier=${tier.id}`}
                className={`w-full py-4 text-center text-xs font-medium tracking-[0.2em] uppercase transition-all duration-300 block ${
                  tier.highlighted
                    ? "bg-gold-500/90 text-navy-950 hover:bg-gold-400"
                    : "border border-gold-500/20 text-gold-400/80 hover:bg-gold-500/5 hover:border-gold-500/30"
                }`}
              >
                {tier.cta}
              </a>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center text-xs text-cream-300/25 mt-10 font-light tracking-wide"
        >
          All engagements are scoped during an initial confidential consultation. Pricing reflects typical engagement structures and may be tailored to specific requirements.
        </motion.p>
      </div>
    </section>
  );
}
