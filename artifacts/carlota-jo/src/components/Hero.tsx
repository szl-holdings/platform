import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-end pb-24 lg:pb-32 overflow-hidden" style={{ background: "var(--color-cream-warm)" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: "linear-gradient(to right, transparent, rgba(154,125,82,0.12), transparent)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 80% 20%, rgba(154,125,82,0.04) 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 w-full py-32 lg:py-40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-start">
          <div className="lg:col-span-7">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-[11px] font-medium tracking-[0.35em] uppercase mb-8"
              style={{ color: "var(--color-gold)", opacity: 0.8 }}
            >
              Carlota Jo Consulting · Private Advisory
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="font-serif leading-[1.08] mb-6"
              style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)", fontWeight: 300, color: "var(--color-ink-900)" }}
            >
              Private advisory and
              <br />
              operational support for
              <br />
              <span style={{ fontStyle: "italic" }}>high-net-worth families</span>
              <br />
              and residences.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-base md:text-lg font-light leading-relaxed mb-3 max-w-md"
              style={{ color: "var(--color-ink-600)" }}
            >
              Quietly structured. Precisely executed.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.38 }}
              className="text-sm font-light leading-relaxed mb-14 max-w-sm"
              style={{ color: "var(--color-ink-500)" }}
            >
              One trusted operator. Absolute discretion. Every engagement executed to a single standard.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <Link
                href="/contact"
                className="group flex items-center gap-2.5 px-7 py-3.5 text-[13px] font-medium tracking-[0.08em] transition-colors duration-300"
                style={{ color: "var(--color-cream)", background: "var(--color-gold)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold-light)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold)"; }}
              >
                Request a Confidential Consultation
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/services"
                className="px-8 py-3.5 text-xs font-medium tracking-[0.15em] uppercase transition-all duration-300"
                style={{ color: "var(--color-ink-500)", border: "1px solid var(--color-stone-300)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-ink-500)";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-ink-900)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-stone-300)";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-ink-500)";
                }}
              >
                Explore Services
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="lg:col-span-5 lg:pt-12"
          >
            <div
              className="p-8 lg:p-10"
              style={{ border: "1px solid var(--color-stone-200)", background: "rgba(244,240,232,0.6)" }}
            >
              <p className="text-[10px] font-medium tracking-[0.3em] uppercase mb-6" style={{ color: "var(--color-gold)" }}>
                What Rosa provides
              </p>
              <p className="text-[11px] tracking-wider uppercase mb-3" style={{ color: "var(--color-stone-400)" }}>
                High-Trust Residential Support
              </p>
              <h3
                className="font-serif text-xl md:text-2xl font-light leading-snug mb-8"
                style={{ color: "var(--color-ink-900)" }}
              >
                Residence management, household operations, estate coordination, and discreet project execution — through one trusted operator.
              </h3>
              <div className="space-y-2">
                {[
                  "Residence Operations Support",
                  "Property Coordination",
                  "Household Systems Oversight",
                  "Vendor & Service Coordination",
                  "Lifestyle & Administrative Support",
                  "Transitional & Special Project Support",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-[11px] font-light" style={{ color: "var(--color-stone-500)" }}>
                    <span style={{ color: "var(--color-gold)" }}>—</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-px grid grid-cols-3 gap-px" style={{ background: "var(--color-stone-200)" }}>
              {[
                { value: "100%", label: "Client retention" },
                { value: "< 2hr", label: "Response SLA" },
                { value: "Discreet", label: "By design" },
              ].map((stat) => (
                <div key={stat.label} className="px-4 py-5 text-center" style={{ background: "var(--color-stone-50)" }}>
                  <p className="font-serif text-xl font-light mb-1" style={{ color: "var(--color-ink-900)" }}>{stat.value}</p>
                  <p className="text-[9px] tracking-wider uppercase" style={{ color: "var(--color-stone-400)" }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}