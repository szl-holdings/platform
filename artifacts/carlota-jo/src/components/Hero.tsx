import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-end pb-24 lg:pb-32 overflow-hidden bg-[#07090d]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#c8a96a]/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#c8a96a]/5" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 w-full py-32 lg:py-40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-start">
          <div className="lg:col-span-7">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-[11px] font-medium tracking-[0.35em] uppercase text-[#c8a96a]/80 mb-8"
            >
              Carlota Jo Consulting
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="text-5xl md:text-6xl lg:text-[4.5rem] font-light text-[#f5f0e8] leading-[1.08] mb-8"
              style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
            >
              Counsel for
              <br />
              <em>consequential</em>
              <br />
              decisions
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-base md:text-lg text-[#f5f0e8]/70 font-light max-w-lg leading-relaxed mb-10"
            >
              A founder-led advisory practice serving boards, leadership teams,
              and investors on their most critical strategic challenges.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <button
                onClick={() => document.querySelector("#inquire")?.scrollIntoView({ behavior: "smooth" })}
                className="group flex items-center gap-2.5 px-7 py-3.5 text-[13px] font-medium tracking-[0.08em] text-[#07090d] bg-[#c8a96a] hover:bg-[#d4b87a] transition-colors duration-300"
              >
                Inquire privately
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform duration-300" />
              </button>
              <button
                onClick={() => document.querySelector("#services")?.scrollIntoView({ behavior: "smooth" })}
                className="px-7 py-3.5 text-[13px] font-medium tracking-[0.08em] text-[#f5f0e8]/60 border border-[#f5f0e8]/15 hover:border-[#f5f0e8]/30 hover:text-[#f5f0e8]/90 transition-all duration-300"
              >
                Explore our practice
              </button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="lg:col-span-5 lg:pt-12"
          >
            <div
              className="border border-[#f5f0e8]/10 p-8 lg:p-10 hover:border-[#f5f0e8]/18 transition-colors duration-500 group cursor-pointer"
              onClick={() => document.querySelector("#services")?.scrollIntoView({ behavior: "smooth" })}
            >
              <p className="text-[10px] font-medium tracking-[0.3em] uppercase text-[#c8a96a]/70 mb-4">
                Principal Advisory
              </p>
              <p className="text-[11px] tracking-wider uppercase text-[#f5f0e8]/35 mb-3">
                Engagement Type
              </p>
              <h3
                className="text-xl md:text-2xl font-light text-[#f5f0e8] leading-snug mb-6 group-hover:text-[#c8a96a]/90 transition-colors duration-300"
                style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
              >
                Board-level governance and capital allocation advisory — discreet, direct, and deeply engaged.
              </h3>
              <span className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.15em] uppercase text-[#c8a96a]/60 group-hover:text-[#c8a96a] transition-colors">
                View practice areas
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </div>

            <div className="mt-px grid grid-cols-3 gap-px bg-stone-200">
              {[
                { value: "95%", label: "Retention rate" },
                { value: "140+", label: "Engagements" },
                { value: "12", label: "Industries" },
              ].map((stat) => (
                <div key={stat.label} className="bg-stone-50 px-4 py-5 text-center">
                  <p className="font-serif text-2xl font-light text-ink-900 mb-1">{stat.value}</p>
                  <p className="text-[9px] tracking-wider uppercase text-stone-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-20 pt-8 border-t border-[#f5f0e8]/5 flex flex-wrap items-center gap-x-10 gap-y-3"
        >
          <p className="text-[10px] tracking-[0.25em] uppercase text-[#f5f0e8]/25">
            Clients include
          </p>
          {["FTSE 250 Boards", "Global Private Equity", "Family Offices", "Sovereign Wealth Funds"].map((name) => (
            <span key={name} className="text-[11px] tracking-wider text-[#f5f0e8]/22 font-light">
              {name}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
