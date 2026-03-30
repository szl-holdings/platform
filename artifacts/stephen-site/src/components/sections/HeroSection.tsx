import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";

export function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <section id="hero" ref={ref} className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
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
              Founder & CEO — SZL Holdings
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
            Systems operator. I build the infrastructure that powers enterprises — from defense platforms and fintech architectures to a six-company technology holding company.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.42 }}
            className="text-base text-foreground/35 max-w-xl mb-12 leading-relaxed font-light"
          >
            15 years. $2B+ in systems architected. Six live products in production.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.52 }}
            className="flex flex-wrap items-center gap-5"
          >
            <a
              href="#case-studies"
              className="group inline-flex items-center gap-2.5 px-8 py-3.5 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors duration-200"
            >
              View selected work
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="#about"
              className="group inline-flex items-center gap-2 text-sm font-medium text-foreground/50 hover:text-primary transition-colors duration-200"
            >
              Read the thesis
              <ArrowRight size={13} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.85 }}
            className="flex items-center gap-10 mt-16 pt-10 border-t border-white/6"
          >
            {[
              { value: "15+", label: "Years in enterprise tech" },
              { value: "$2B+", label: "Systems architected" },
              { value: "6", label: "Live products" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className="text-3xl font-serif text-primary">{stat.value}</span>
                <span className="text-[10px] text-foreground/30 uppercase tracking-[0.2em] mt-1">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
