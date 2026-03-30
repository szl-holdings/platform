import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-end pb-24 lg:pb-32 overflow-hidden bg-cream-warm">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-stone-200" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 w-full py-32 lg:py-40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-start">
          <div className="lg:col-span-7">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="cj-eyebrow mb-8"
            >
              Carlota Jo Consulting
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="font-serif text-5xl md:text-6xl lg:text-[4.5rem] font-light text-ink-900 leading-[1.08] mb-6"
            >
              Discreet operational
              <br />
              and residence support
              <br />
              <span className="italic">for demanding principals.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.38 }}
              className="text-sm text-ink-500 font-light max-w-sm leading-relaxed mb-14"
            >
              One trusted operator. Absolute discretion. Every engagement executed to a single standard.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <button
                onClick={() => document.querySelector("#inquire")?.scrollIntoView({ behavior: "smooth" })}
                className="cj-btn-primary"
              >
                Inquire privately
                <ArrowRight size={13} />
              </button>
              <button
                onClick={() => document.querySelector("#services")?.scrollIntoView({ behavior: "smooth" })}
                className="cj-btn-secondary"
              >
                Our services
              </button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="lg:col-span-5 lg:pt-12"
          >
            <div className="cj-feature-block p-8 lg:p-10">
              <p className="cj-eyebrow mb-6">Scope of practice</p>
              <div className="space-y-2.5">
                {["Estate & Residence Management", "Household Staff Coordination", "Bespoke Travel Architecture", "Vendor Relationship Management", "Discreet Project Execution"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-[12px] text-ink-600 font-light">
                    <span className="text-gold">—</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-px grid grid-cols-3 gap-px bg-stone-200">
              {[
                { value: "100%", label: "Retention" },
                { value: "8", label: "Pilot clients" },
                { value: "<2hr", label: "Response SLA" },
              ].map((stat) => (
                <div key={stat.label} className="bg-stone-50 px-4 py-5 text-center">
                  <p className="font-serif text-2xl font-light text-ink-900 mb-1">{stat.value}</p>
                  <p className="text-[9px] tracking-wider uppercase text-stone-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
