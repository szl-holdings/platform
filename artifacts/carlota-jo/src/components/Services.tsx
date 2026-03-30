import { motion } from "framer-motion";
import {
  Compass,
  BarChart3,
  Cpu,
  Shield,
  TrendingUp,
  Handshake,
  ArrowRight,
} from "lucide-react";
import servicesData from "@/data/services.json";

const iconMap: Record<string, React.ElementType> = {
  Compass,
  BarChart3,
  Cpu,
  Shield,
  TrendingUp,
  Handshake,
};

export default function Services() {
  return (
    <section id="services" className="py-24 lg:py-40 bg-stone-50 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-20 lg:mb-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5"
          >
            <p className="text-[11px] font-medium tracking-[0.35em] uppercase text-warm-gold mb-6">
              Capabilities
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-ink-900 leading-tight">
              Six practice areas.
              <br />
              <span className="italic text-ink-600">One clear standard.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-7 flex items-end"
          >
            <p className="text-sm text-ink-600 font-light leading-relaxed max-w-xl">
              Each practice draws on proprietary methodologies and decades of senior advisory experience. We bring cross-sector insight to every engagement — and we measure ourselves only on outcomes that matter to clients.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-stone-200">
          {servicesData.map((service, idx) => {
            const Icon = iconMap[service.icon] || Compass;

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="group bg-stone-50 hover:bg-taupe-50 transition-all duration-500 p-8 lg:p-10"
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
                  className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] uppercase text-warm-gold/70 hover:text-warm-gold group-hover:text-warm-gold/80 transition-colors"
                >
                  Discuss this capability
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
