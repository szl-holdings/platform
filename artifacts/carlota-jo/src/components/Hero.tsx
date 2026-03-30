import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24" style={{ background: "var(--color-cream-warm)", minHeight: "min(85vh, 740px)" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: "linear-gradient(to right, transparent, rgba(154,125,82,0.12), transparent)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 80% 20%, rgba(154,125,82,0.04) 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-[11px] font-medium tracking-[0.35em] uppercase mb-6"
              style={{ color: "var(--color-gold)" }}
            >
              Private Advisory
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="font-serif leading-[1.08] mb-6"
              style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)", fontWeight: 300, color: "var(--color-ink-900)" }}
            >
              Quietly structured.
              <br />
              <span style={{ fontStyle: "italic" }}>Precisely executed.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-base font-light leading-relaxed mb-8 max-w-md"
              style={{ color: "var(--color-ink-600)" }}
            >
              Estate management and residential operations for high-net-worth families — through one trusted operator.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="flex flex-col sm:flex-row items-start gap-3"
            >
              <Link
                href="/contact"
                className="group flex items-center gap-2.5 px-7 py-3.5 text-[13px] font-medium tracking-[0.06em] transition-colors duration-300"
                style={{ color: "var(--color-cream)", background: "var(--color-gold)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold-light)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-gold)"; }}
              >
                Begin a Conversation
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/services"
                className="px-6 py-3.5 text-xs font-medium tracking-[0.15em] uppercase transition-all duration-300"
                style={{ color: "var(--color-ink-600)", border: "1px solid var(--color-stone-300)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-ink-500)";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-ink-900)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-stone-300)";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-ink-600)";
                }}
              >
                Services
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
          >
            <div className="grid grid-cols-3 gap-px" style={{ background: "var(--color-stone-300)" }}>
              {[
                { value: "100%", label: "Retention" },
                { value: "< 2hr", label: "Response" },
                { value: "Discreet", label: "By Design" },
              ].map((stat) => (
                <div key={stat.label} className="px-5 py-7 text-center" style={{ background: "var(--color-stone-50)" }}>
                  <p className="font-serif text-2xl font-light mb-1.5" style={{ color: "var(--color-ink-800)" }}>{stat.value}</p>
                  <p className="text-[9px] tracking-[0.2em] uppercase font-medium" style={{ color: "var(--color-ink-400)" }}>{stat.label}</p>
                </div>
              ))}
            </div>

            <div
              className="mt-px p-7 lg:p-8"
              style={{ background: "var(--color-stone-50)", border: "1px solid var(--color-stone-300)", borderTop: "none" }}
            >
              <p className="text-[10px] font-semibold tracking-[0.3em] uppercase mb-5" style={{ color: "var(--color-gold)" }}>
                Core Practice Areas
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                {[
                  "Residence Operations",
                  "Property Coordination",
                  "Household Systems",
                  "Vendor Management",
                  "Lifestyle & Admin",
                  "Special Projects",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-[12px] font-light" style={{ color: "var(--color-ink-700)" }}>
                    <span style={{ color: "var(--color-gold)" }}>—</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
