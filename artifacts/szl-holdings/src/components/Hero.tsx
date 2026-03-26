import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import siteData from "@/data/site.json";

export function Hero() {
  const { hero } = siteData;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(99,102,241,0.08)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(167,139,250,0.06)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,rgba(34,211,238,0.04)_0%,transparent_50%)]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-szl-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-szl-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)`,
        backgroundSize: "60px 60px"
      }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-szl-border bg-szl-surface text-szl-text-secondary text-sm">
            <span className="w-2 h-2 rounded-full bg-szl-emerald animate-pulse" />
            {hero.badge}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="font-[var(--font-display)] text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6"
        >
          <span className="text-szl-text">{hero.headline}</span>
          <br />
          <span className="bg-gradient-to-r from-szl-primary via-szl-accent to-szl-cyan bg-clip-text text-transparent">
            {hero.headlineAccent}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-szl-text-secondary text-lg sm:text-xl max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          {hero.subheadline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#ecosystem"
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-szl-primary to-szl-accent text-white font-semibold text-base hover:opacity-90 transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]"
          >
            {hero.cta}
          </a>
          <a
            href="#contact"
            className="px-8 py-3.5 rounded-xl border border-szl-border text-szl-text-secondary font-semibold text-base hover:text-szl-text hover:border-szl-border-hover hover:bg-szl-surface transition-all"
          >
            {hero.ctaSecondary}
          </a>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <a href="#ecosystem" className="text-szl-text-muted hover:text-szl-text-secondary transition-colors">
          <ArrowDown size={20} className="animate-bounce" />
        </a>
      </motion.div>
    </section>
  );
}
