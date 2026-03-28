import { motion } from "framer-motion";
import { Check } from "lucide-react";
import tiersData from "@/data/tiers.json";

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 lg:py-32 bg-navy-900/40">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-gold-400/80 mb-4">
            Pricing
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-cream-50">
            Engagement Tiers
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {tiersData.map((tier, idx) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className={`relative border p-8 lg:p-10 flex flex-col ${
                tier.highlighted
                  ? "border-gold-500/30 bg-navy-900/60 ring-1 ring-gold-500/10"
                  : "border-gold-500/10 bg-navy-950/60"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
              )}

              <div className="mb-6">
                <span className="text-xs font-medium tracking-widest uppercase text-gold-400/60">
                  {tier.type}
                </span>
                <h3 className="font-serif text-2xl font-medium text-cream-50 mt-2">
                  {tier.name}
                </h3>
              </div>

              <div className="mb-6">
                <span className="font-serif text-4xl font-light text-cream-50">
                  {tier.price}
                </span>
                <span className="text-sm text-cream-300/40 ml-2">
                  {tier.priceNote}
                </span>
              </div>

              <p className="text-sm text-cream-200/40 leading-relaxed mb-8">
                {tier.description}
              </p>

              <ul className="space-y-3 mb-10 flex-1">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-cream-300/60"
                  >
                    <Check
                      size={14}
                      className="text-gold-500/60 mt-0.5 shrink-0"
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/book?tier=${tier.id}`}
                className={`w-full py-3.5 text-center text-sm font-medium tracking-widest uppercase transition-all duration-300 block ${
                  tier.highlighted
                    ? "bg-gold-500/90 text-navy-950 hover:bg-gold-400"
                    : "border border-gold-500/30 text-gold-400 hover:bg-gold-500/10"
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
