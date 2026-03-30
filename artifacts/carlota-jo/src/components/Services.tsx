import { motion } from "framer-motion";
import {
  Compass,
  BarChart3,
  Shield,
  TrendingUp,
  Handshake,
  ArrowRight,
} from "lucide-react";
import servicesData from "@/data/services.json";

const iconMap: Record<string, React.ElementType> = {
  Compass,
  BarChart3,
  Shield,
  TrendingUp,
  Handshake,
};

export default function Services() {
  return (
    <section id="services" className="py-24 lg:py-32 bg-[#07090d] border-t border-[#f5f0e8]/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <p className="text-[11px] font-medium tracking-[0.35em] uppercase text-warm-gold mb-6">
              Services
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-ink-900 leading-tight">
              Four practice areas.
              <br />
              <span className="italic opacity-80">One clear standard.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 flex items-end"
          >
            <p className="text-sm text-ink-600 font-light leading-relaxed max-w-xl">
              Each service area draws on a proprietary operational framework and a network built over years of high-trust engagement. We bring cross-domain precision to every mandate — and we measure ourselves only on outcomes that matter to the principal.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-stone-200">
          {servicesData.map((service, idx) => {
            const Icon = iconMap[service.icon] || Compass;

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="group bg-stone-50 hover:bg-stone-100 transition-all duration-500 p-8 lg:p-10"
              >
                <div className="w-9 h-9 flex items-center justify-center border border-stone-200 text-warm-gold group-hover:border-warm-gold/30 transition-all duration-500 mb-7">
                  <Icon size={18} strokeWidth={1.2} />
                </div>

                <h3 className="font-serif text-xl font-medium text-ink-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-[13px] text-ink-600 leading-relaxed mb-5 font-light">
                  {service.summary}
                </p>
                <p className="text-xs text-ink-500 font-light leading-relaxed mb-5">
                  {service.description}
                </p>

                <ul className="space-y-2 mb-6">
                  {service.capabilities.slice(0, 3).map((cap) => (
                    <li key={cap} className="text-xs text-ink-500 flex items-start gap-2 font-light">
                      <span className="text-warm-gold mt-0.5">—</span>
                      {cap}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}
                  className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] uppercase text-warm-gold/70 hover:text-warm-gold transition-colors"
                >
                  Start a Conversation
                  <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
