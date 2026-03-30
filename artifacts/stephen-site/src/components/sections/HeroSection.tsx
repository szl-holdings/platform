import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const stats = [
  { value: "15+", label: "Years building enterprise systems" },
  { value: "£2B+", label: "Infrastructure value designed" },
  { value: "5", label: "Live ventures in production" },
];

export function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-end pb-24 lg:pb-32 overflow-hidden bg-[#0a0e14]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-[20%] w-[600px] h-[500px] bg-[#4a6fa5]/4 rounded-full blur-[160px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12 w-full">
        <div className="grid lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7 }}
              className="flex items-center gap-3 mb-10"
            >
              <div className="w-1.5 h-1.5 bg-emerald-400/70 rounded-full" />
              <span className="text-[11px] font-medium tracking-[0.28em] uppercase text-white/35">
                Founder & CEO — SZL Holdings
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl md:text-6xl lg:text-[4.75rem] font-semibold text-white leading-[1.06] tracking-tight mb-7"
            >
              Stephen Lutar
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="text-base md:text-[1.1rem] text-white/55 font-light max-w-lg leading-relaxed mb-10"
            >
              I build enterprise-grade systems and founding teams — from maritime intelligence
              platforms tracking global fleets to fintech infrastructure processing millions in
              daily transactions.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <a
                href="#work"
                className="group flex items-center gap-2.5 px-7 py-3.5 text-[13px] font-medium tracking-[0.07em] text-white bg-[#4a6fa5] hover:bg-[#5a80b8] transition-colors duration-300"
              >
                Selected work
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform duration-300" />
              </a>
              <a
                href="#contact"
                className="px-7 py-3.5 text-[13px] font-medium tracking-[0.07em] text-white/50 border border-white/12 hover:border-white/25 hover:text-white/75 transition-all duration-300"
              >
                Request a briefing
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.8 }}
              className="mt-16 pt-8 border-t border-white/6 flex flex-wrap gap-x-10 gap-y-5"
            >
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-semibold text-[#7ba3d4] mb-1">{stat.value}</p>
                  <p className="text-[11px] tracking-widest uppercase text-white/28 font-light">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.45 }}
            className="lg:col-span-4 hidden lg:block"
          >
            <div className="border border-white/8 p-6 hover:border-white/14 transition-colors duration-400">
              <p className="text-[10px] font-medium tracking-[0.3em] uppercase text-[#7ba3d4]/60 mb-3">
                Current focus
              </p>
              <p className="text-white/60 text-sm font-light leading-relaxed mb-5">
                Scaling Vessels Maritime Intelligence and INCA AI Research across enterprise clients in Europe and North America.
              </p>
              <div className="space-y-2">
                {["Vessels — Maritime AI", "INCA — Research Cortex", "Carlota Jo — Advisory"].map((v) => (
                  <div key={v} className="flex items-center gap-2.5">
                    <div className="w-1 h-1 bg-[#7ba3d4]/50 rounded-full shrink-0" />
                    <span className="text-[12px] text-white/35 font-light">{v}</span>
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
