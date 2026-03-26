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
    <section id="services" className="py-24 lg:py-32 bg-navy-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-gold-400/80 mb-4">
            What We Do
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-cream-50">
            Service Portfolio
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                className="group border border-gold-500/10 bg-navy-900/30 hover:bg-navy-900/50 hover:border-gold-500/20 transition-all duration-500 p-8"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 flex items-center justify-center border border-gold-500/20 text-gold-400">
                    <Icon size={22} strokeWidth={1.5} />
                  </div>
                </div>

                <h3 className="font-serif text-xl font-medium text-cream-50 mb-3">
                  {service.title}
                </h3>
                <p className="text-sm text-cream-300/50 leading-relaxed mb-4">
                  {service.summary}
                </p>

                <button
                  onClick={() => setExpanded(isExpanded ? null : service.id)}
                  className="flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-gold-400/70 hover:text-gold-400 transition-colors"
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
                      <div className="pt-6 mt-6 border-t border-gold-500/10">
                        <p className="text-sm text-cream-200/40 leading-relaxed mb-4">
                          {service.description}
                        </p>
                        <ul className="space-y-2">
                          {service.capabilities.map((cap) => (
                            <li
                              key={cap}
                              className="text-xs text-cream-300/50 flex items-start gap-2"
                            >
                              <span className="text-gold-500/60 mt-0.5">—</span>
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
