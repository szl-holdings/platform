import { motion } from "framer-motion";
import { Check } from "lucide-react";
import tiersData from "@/data/tiers.json";

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 lg:py-32 bg-navy-950 border-t border-cream-200/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5"
          >
            <p className="text-[11px] font-medium tracking-[0.35em] uppercase text-gold-400 mb-5">
              Engagement Models
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-cream-50 leading-tight">
              Structured
              <br />
              for impact
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-7 flex items-end"
          >
            <p className="text-sm text-cream-200/40 font-light leading-relaxed max-w-xl">
              Three engagement models calibrated to the scope and cadence of
              your strategic needs. All engagements are scoped during an initial
              confidential consultation.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-cream-200/5">
          {tiersData.map((tier, idx) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`relative p-8 lg:p-10 flex flex-col ${
                tier.highlighted ? "bg-navy-900/40" : "bg-navy-950"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-px left-0 right-0 h-px bg-gold-400" />
              )}

              {tier.highlighted && (
                <span className="absolute top-5 right-6 text-[10px] tracking-[0.15em] uppercase text-gold-400/60 font-medium">
                  Most Selected
                </span>
              )}

              <div className="mb-6">
                <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-cream-300/30">
                  {tier.type}
                </span>
                <h3 className="font-serif text-xl font-medium text-cream-50 mt-2">
                  {tier.name}
                </h3>
              </div>

              <div className="mb-6">
                <span className="font-serif text-3xl font-light text-cream-50">
                  {tier.price}
                </span>
                <span className="text-sm text-cream-300/30 ml-2 font-light">
                  {tier.priceNote}
                </span>
              </div>

              <p className="text-[13px] text-cream-200/30 leading-relaxed mb-8 font-light">
                {tier.description}
              </p>

              <ul className="space-y-3 mb-10 flex-1">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm text-cream-300/40 font-light"
                  >
                    <Check
                      size={13}
                      className="text-gold-500/40 mt-0.5 shrink-0"
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/book?tier=${tier.id}`}
                className={`w-full py-3.5 text-center text-xs font-medium tracking-[0.15em] uppercase transition-all duration-300 block ${
                  tier.highlighted
                    ? "bg-gold-500 text-navy-950 hover:bg-gold-400"
                    : "border border-cream-200/10 text-cream-200/50 hover:border-cream-200/20 hover:text-cream-50"
                }`}
              >
                {tier.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
