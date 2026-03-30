import { motion } from "framer-motion";
import { Home, Building, Settings, Users, Briefcase, Compass, ArrowRight } from "lucide-react";
import servicesData from "@/data/services.json";
import { Link } from "wouter";

const iconMap: Record<string, React.ElementType> = {
  Home,
  Building,
  Settings,
  Users,
  Briefcase,
  Compass,
};

export default function Services() {
  return (
    <section id="services" className="py-24 lg:py-32 border-t" style={{ background: "var(--color-cream-warm)", borderColor: "var(--color-stone-200)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-6" style={{ color: "var(--color-gold)" }}>
              Services
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-light leading-tight" style={{ color: "var(--color-ink-900)" }}>
              Six practice areas.
              <br />
              <span style={{ fontStyle: "italic", opacity: 0.8 }}>One clear standard.</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 flex items-end"
          >
            <p className="text-sm font-light leading-relaxed max-w-xl" style={{ color: "var(--color-ink-600)" }}>
              Cross-domain precision and absolute discretion across every engagement.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: "var(--color-stone-200)" }}>
          {servicesData.map((service, idx) => {
            const Icon = iconMap[service.icon] || Compass;

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.06 }}
                className="group p-8 lg:p-10 transition-all duration-500"
                style={{ background: "var(--color-stone-50)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-stone-100)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-stone-50)"; }}
              >
                <div
                  className="w-9 h-9 flex items-center justify-center mb-7 transition-all duration-500"
                  style={{ border: "1px solid var(--color-stone-200)", color: "var(--color-gold)" }}
                >
                  <Icon size={18} strokeWidth={1.2} />
                </div>

                <h3 className="font-serif text-xl font-medium mb-3" style={{ color: "var(--color-ink-900)", fontWeight: 400 }}>
                  {service.title}
                </h3>
                <p className="text-[13px] font-light leading-relaxed mb-5" style={{ color: "var(--color-ink-600)" }}>
                  {service.summary}
                </p>

                <ul className="space-y-2 mb-6">
                  {service.capabilities.map((cap) => (
                    <li key={cap} className="text-xs flex items-start gap-2 font-light" style={{ color: "var(--color-ink-500)" }}>
                      <span style={{ color: "var(--color-gold)", marginTop: "0.1rem" }}>—</span>
                      {cap}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] uppercase transition-colors"
                  style={{ color: "rgba(154,125,82,0.7)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-gold)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(154,125,82,0.7)"; }}
                >
                  Inquire
                  <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
