import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@workspace/shared-ui/ui/button";
import { useRef } from "react";

const stats = [
  { value: "15+", label: "Years in Enterprise Tech" },
  { value: "$2B+", label: "Systems Architected" },
  { value: "6", label: "Live Products" },
];

export function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section id="hero" ref={ref} className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/6 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-yellow-600/5 rounded-full blur-[150px]" />
      </div>

      <motion.div style={{ y, opacity }} className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass-panel border-primary/20 mb-10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-medium text-foreground/60 tracking-wide">Founder & CEO — SZL Holdings</span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-5xl sm:text-7xl md:text-[5rem] font-serif font-bold text-foreground leading-[1.05] mb-5 tracking-tight"
            >
              Stephen Lutar
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="text-base sm:text-lg text-foreground/55 max-w-xl mb-10 leading-relaxed font-light"
            >
              I build the systems that power enterprises — from fintech platforms processing millions in transactions to maritime intelligence tracking global fleets.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center gap-4"
            >
              <a href="#case-studies">
                <Button size="lg" className="rounded-full px-8 py-6 text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:scale-105 transition-all duration-300 group">
                  Explore My Work
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
              <a
                href="#contact"
                className="text-sm font-medium text-foreground/60 hover:text-primary transition-colors duration-300 flex items-center gap-2 group"
              >
                Request a Briefing
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex items-center gap-8 mt-14 pt-8 border-t border-white/5"
            >
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-primary">{stat.value}</span>
                  <span className="text-[10px] text-foreground/35 uppercase tracking-widest mt-1">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-5 hidden lg:flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-yellow-600/10 rounded-2xl blur-2xl scale-95" />
              <div className="relative w-80 h-96 rounded-2xl overflow-hidden border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=640&q=80&auto=format&fit=crop"
                  alt="Stephen Lutar"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <span className="text-[9px] uppercase tracking-[0.2em] text-foreground/25 font-medium">Scroll</span>
        <ChevronDown className="w-3.5 h-3.5 text-primary/40 animate-bounce" />
      </motion.div>
    </section>
  );
}
