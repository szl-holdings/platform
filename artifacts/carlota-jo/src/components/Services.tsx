import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  BarChart3,
  Cpu,
  Shield,
  TrendingUp,
  Handshake,
  ChevronDown,
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
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section id="services" className="py-28 lg:py-36 bg-navy-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6"
        >
          <p className="text-[11px] font-medium tracking-[0.4em] uppercase text-gold-400/70 mb-4">
            Capabilities
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-cream-50">
            How We Deliver
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-sm text-cream-200/35 font-light max-w-2xl mx-auto text-center leading-relaxed mb-20"
        >
          Six integrated practice areas built on proven strategic frameworks, proprietary methodologies, and decades of senior advisory experience.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gold-500/5">
          {servicesData.map((service, idx) => {
            const Icon = iconMap[service.icon] || Compass;
            const isExpanded = expanded === service.id;

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="group bg-navy-950 hover:bg-navy-900/40 transition-all duration-500 p-10"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="w-12 h-12 flex items-center justify-center border border-gold-500/15 text-gold-400/80 group-hover:border-gold-500/30 group-hover:text-gold-400 transition-all duration-500">
                    <Icon size={22} strokeWidth={1.2} />
                  </div>
                </div>

                <h3 className="font-serif text-xl font-medium text-cream-50 mb-3">
                  {service.title}
                </h3>
                <p className="text-sm text-cream-300/40 leading-relaxed mb-5 font-light italic">
                  {service.summary}
                </p>

                <button
                  onClick={() => setExpanded(isExpanded ? null : service.id)}
                  className="flex items-center gap-2 text-[11px] font-medium tracking-[0.2em] uppercase text-gold-400/60 hover:text-gold-400 transition-colors"
                >
                  {isExpanded ? "Show Less" : "Learn More"}
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-6 mt-6 border-t border-gold-500/8">
                        <p className="text-sm text-cream-200/35 leading-relaxed mb-5 font-light">
                          {service.description}
                        </p>
                        <ul className="space-y-2.5">
                          {service.capabilities.map((cap) => (
                            <li
                              key={cap}
                              className="text-xs text-cream-300/45 flex items-start gap-2.5 font-light"
                            >
                              <span className="text-gold-500/50 mt-0.5">&mdash;</span>
                              {cap}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
