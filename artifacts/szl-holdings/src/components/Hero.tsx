import { m } from "framer-motion";
import { ChevronRight } from "lucide-react";
import siteData from "@/data/site.json";

export function Hero() {
  const { hero } = siteData;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 bg-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.04)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_bottom_right,rgba(15,23,42,0.03)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-szl-border bg-szl-bg-secondary text-szl-text-secondary text-xs font-medium tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            {hero.badge}
          </span>
        </m.div>

        <m.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="font-[var(--font-display)] text-5xl sm:text-6xl lg:text-7xl xl:text-[5rem] font-extrabold leading-[1.0] mb-6 tracking-tight text-szl-text"
        >
          {hero.headline}
          <br />
          <span className="text-szl-accent">
            {hero.headlineAccent}
          </span>
        </m.h1>

        <m.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="text-szl-text-secondary text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          A vertically-integrated technology holding company deploying capital across six frontier platforms — from maritime intelligence to AI-native creative production.
        </m.p>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-20"
        >
          <a
            href="#portfolio"
            className="group px-7 py-3.5 rounded-lg bg-szl-primary text-white font-semibold text-sm hover:bg-szl-primary-light transition-colors flex items-center gap-2 shadow-sm"
          >
            {hero.cta}
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
          <a
            href="/insights"
            className="group px-7 py-3.5 rounded-lg border border-szl-border text-szl-text-secondary font-semibold text-sm hover:text-szl-text hover:border-szl-border-hover hover:bg-szl-bg-secondary transition-all flex items-center gap-2"
          >
            Read Our Insights
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-szl-border rounded-2xl overflow-hidden border border-szl-border max-w-2xl mx-auto"
        >
          {hero.stats.map((stat: { value: string; label: string }) => (
            <div
              key={stat.label}
              className="bg-white px-6 py-5 text-center"
            >
              <p className="text-szl-text font-[var(--font-display)] font-bold text-xl sm:text-2xl mb-1">
                {stat.value}
              </p>
              <p className="text-szl-text-muted text-[11px] font-medium uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </m.div>
      </div>
    </section>
  );
}
