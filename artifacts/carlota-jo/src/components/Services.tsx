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
    <section id="services" className="py-24 lg:py-32 bg-navy-950 border-t border-cream-200/5">
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
              Capabilities
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-cream-50 leading-tight">
              Six integrated
              <br />
              practice areas
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
              Each practice draws on proven strategic frameworks, proprietary
              methodologies, and decades of senior advisory experience. We work
              across industries and geographies, bringing cross-sector insight
              to every engagement.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-cream-200/5">
          {servicesData.map((service, idx) => {
            const Icon = iconMap[service.icon] || Compass;

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="group bg-navy-950 hover:bg-navy-900/50 transition-all duration-500 p-8 lg:p-10"
              >
                <div className="w-10 h-10 flex items-center justify-center border border-cream-200/8 text-gold-400/70 group-hover:border-gold-500/25 group-hover:text-gold-400 transition-all duration-500 mb-7">
                  <Icon size={20} strokeWidth={1.2} />
                </div>

                <h3 className="font-serif text-xl font-medium text-cream-50 mb-3">
                  {service.title}
                </h3>
                <p className="text-[13px] text-cream-200/35 leading-relaxed mb-5 font-light">
                  {service.summary}
                </p>

                <ul className="space-y-2 mb-6">
                  {service.capabilities.slice(0, 3).map((cap) => (
                    <li
                      key={cap}
                      className="text-xs text-cream-300/30 flex items-start gap-2 font-light"
                    >
                      <span className="text-gold-500/40 mt-0.5">—</span>
                      {cap}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() =>
                    document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] uppercase text-gold-400/50 hover:text-gold-400 group-hover:text-gold-400/70 transition-colors"
                >
                  Discuss this capability
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
