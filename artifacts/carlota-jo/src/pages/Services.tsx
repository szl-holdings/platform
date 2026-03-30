import { motion } from "framer-motion";
import { Home, Building, Settings, Users, Briefcase, Compass, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import servicesData from "@/data/services.json";

const iconMap: Record<string, React.ElementType> = {
  Home,
  Building,
  Settings,
  Users,
  Briefcase,
  Compass,
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream-warm)" }}>
      <Header />
      <div className="pt-24">
        <section className="py-16 lg:py-24" style={{ borderBottom: "1px solid var(--color-stone-200)" }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-2xl"
            >
              <p className="text-[11px] font-medium tracking-[0.35em] uppercase mb-6" style={{ color: "var(--color-gold)" }}>
                Services
              </p>
              <h1 className="font-serif font-light leading-[1.1] mb-6" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--color-ink-900)" }}>
                Six practice areas.
                <br />
                <span style={{ fontStyle: "italic" }}>One uncompromising standard.</span>
              </h1>
              <p className="text-base font-light leading-relaxed mb-4" style={{ color: "var(--color-ink-600)" }}>
                Every engagement is conducted through Rosa directly. There are no associates, no handoffs, and no templated service models. What you get is one trusted operator with deep expertise across every area she works in.
              </p>
              <p className="text-sm font-light leading-relaxed" style={{ color: "var(--color-ink-500)" }}>
                Rosa works with a deliberately small number of clients. This is what makes the level of service possible.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-16 lg:py-20" style={{ borderBottom: "1px solid var(--color-stone-200)" }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <div className="space-y-px" style={{ borderTop: "1px solid var(--color-stone-200)" }}>
              {servicesData.map((service, idx) => {
                const Icon = iconMap[service.icon] || Compass;
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: idx * 0.06 }}
                    className="py-10 grid grid-cols-1 md:grid-cols-12 gap-8"
                    style={{ borderBottom: "1px solid var(--color-stone-200)" }}
                  >
                    <div className="md:col-span-5">
                      <div
                        className="w-8 h-8 flex items-center justify-center mb-5"
                        style={{ border: "1px solid var(--color-stone-200)", color: "var(--color-gold)" }}
                      >
                        <Icon size={16} strokeWidth={1.2} />
                      </div>
                      <h2 className="font-serif text-xl font-light mb-2" style={{ color: "var(--color-ink-900)" }}>
                        {service.title}
                      </h2>
                      <p className="text-[13px] font-light leading-relaxed mb-4" style={{ color: "var(--color-ink-600)" }}>
                        {service.summary}
                      </p>
                      <p className="text-[12px] font-light leading-relaxed" style={{ color: "var(--color-ink-500)" }}>
                        {service.description}
                      </p>
                    </div>
                    <div className="md:col-span-7 md:pl-8">
                      <p className="text-[10px] font-medium tracking-[0.2em] uppercase mb-4" style={{ color: "var(--color-stone-400)" }}>
                        Scope of support
                      </p>
                      <ul className="space-y-3 mb-6">
                        {service.capabilities.map((cap) => (
                          <li key={cap} className="flex items-start gap-3">
                            <span style={{ color: "var(--color-gold)", marginTop: "0.1rem" }}>—</span>
                            <span className="text-[13px] font-light leading-relaxed" style={{ color: "var(--color-ink-600)" }}>{cap}</span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] uppercase transition-colors"
                        style={{ color: "var(--color-gold)", opacity: 0.8 }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
                      >
                        Discuss this service
                        <ArrowRight size={11} />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-14 lg:py-18">
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <h3 className="font-serif text-2xl font-light mb-4" style={{ color: "var(--color-ink-900)" }}>
                Request a confidential consultation
              </h3>
              <p className="text-sm font-light mb-6 leading-relaxed" style={{ color: "var(--color-ink-500)" }}>
                Rosa responds to substantive enquiries within two business days. All conversations are conducted with complete discretion.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 text-[13px] font-medium tracking-[0.08em] transition-colors"
                style={{ color: "var(--color-cream)", background: "var(--color-gold)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold-light)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold)"; }}
              >
                Request a Confidential Consultation
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
