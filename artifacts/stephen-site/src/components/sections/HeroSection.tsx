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

      <div className="container mx-auto px-6 lg:px-8 max-w-6xl relative z-10">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center gap-2.5 mb-10"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-medium text-foreground/50 tracking-[0.2em] uppercase">
              Founder — SZL Holdings
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl sm:text-7xl lg:text-[5.5rem] font-serif font-normal text-foreground leading-[1.0] mb-6 tracking-tight"
          >
            Stephen Lutar
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="text-lg sm:text-xl text-foreground/55 max-w-2xl mb-4 leading-relaxed font-light"
          >
            Systems, visibility, and execution for modern operations.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.42 }}
            className="text-base text-foreground/35 max-w-xl mb-12 leading-relaxed font-light"
          >
            Founder of SZL Holdings — building structured ventures across observability, maritime command, and high-trust services. Built to operate with clarity and compound over time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.52 }}
            className="flex flex-wrap items-center gap-5"
          >
            <a
              href="#contact"
              className="group inline-flex items-center gap-2.5 px-8 py-3.5 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors duration-200"
            >
              Start a conversation
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="#case-studies"
              className="group inline-flex items-center gap-2 text-sm font-medium text-foreground/50 hover:text-primary transition-colors duration-200"
            >
              View selected work
              <ArrowRight size={13} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.45 }}
            className="lg:col-span-4 hidden lg:block"
          >
            <div className="flex gap-12 mt-12">
            {[
              { value: "5+", label: "Years Operating" },
              { value: "4", label: "Platforms Live" },
              { value: "34 days", label: "Maritime Lead Time" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className="text-3xl font-serif text-primary">{stat.value}</span>
                <span className="text-[10px] text-foreground/30 uppercase tracking-[0.2em] mt-1">{stat.label}</span>
              </div>
            ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
