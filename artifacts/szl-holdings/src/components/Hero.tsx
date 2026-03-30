import { useEffect, useState, useRef } from "react";
import { m } from "framer-motion";
import { ArrowDown, ChevronRight } from "lucide-react";
import siteData from "@/data/site.json";

function AnimatedCounter({ target, suffix = "", duration = 2000 }: { target: string; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const numMatch = target.match(/[\d.]+/);
          if (!numMatch) {
            setDisplay(target);
            return;
          }
          const end = parseFloat(numMatch[0]);
          const prefix = target.slice(0, target.indexOf(numMatch[0]));
          const rest = target.slice(target.indexOf(numMatch[0]) + numMatch[0].length);
          const startTime = performance.now();

          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = end * eased;
            const isInteger = Number.isInteger(end);
            const formatted = isInteger ? Math.round(current).toLocaleString() : current.toFixed(1);
            setDisplay(`${prefix}${formatted}${rest}${suffix}`);
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, suffix, duration]);

  return <span ref={ref}>{display}</span>;
}

export function Hero() {
  const { hero } = siteData;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_40%,rgba(99,102,241,0.12)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(167,139,250,0.08)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_90%,rgba(34,211,238,0.06)_0%,transparent_50%)]" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-szl-primary/[0.07] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/5 w-[400px] h-[400px] bg-szl-accent/[0.05] rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-szl-cyan/[0.04] rounded-full blur-[80px]" />
      </div>

      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: `linear-gradient(rgba(99,102,241,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.4) 1px, transparent 1px)`,
        backgroundSize: "80px 80px"
      }} />

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-szl-primary/20 to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-szl-border/60 bg-szl-surface/80 backdrop-blur-sm text-szl-text-secondary text-sm font-medium tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-szl-emerald opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-szl-emerald" />
            </span>
            {hero.badge}
          </span>
        </m.div>

        <m.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="font-[var(--font-display)] text-6xl sm:text-7xl lg:text-8xl xl:text-[6.5rem] font-extrabold leading-[0.95] mb-8 tracking-tight"
        >
          <span className="text-szl-text">{hero.headline}</span>
          <br />
          <span className="bg-gradient-to-r from-szl-primary via-szl-accent to-szl-cyan bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
            {hero.headlineAccent}
          </span>
        </m.h1>

        <m.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-szl-text-secondary text-lg sm:text-xl max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          {hero.subheadline}
        </m.p>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <a
            href="#ecosystem"
            className="group px-8 py-4 rounded-xl bg-gradient-to-r from-szl-primary to-szl-accent text-white font-semibold text-base hover:opacity-90 transition-all hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] flex items-center gap-2"
          >
            {hero.cta}
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#contact"
            className="px-8 py-4 rounded-xl border border-szl-border text-szl-text-secondary font-semibold text-base hover:text-szl-text hover:border-szl-border-hover hover:bg-szl-surface transition-all"
          >
            {hero.ctaSecondary}
          </a>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-szl-border/30 rounded-2xl overflow-hidden border border-szl-border/40 max-w-3xl mx-auto"
        >
          {hero.stats.map((stat: { value: string; label: string }, i: number) => (
            <div
              key={stat.label}
              className="bg-szl-bg/80 backdrop-blur-sm px-6 py-5 text-center"
            >
              <p className="text-szl-text font-[var(--font-display)] font-bold text-2xl sm:text-3xl mb-1">
                <AnimatedCounter target={stat.value} duration={2000 + i * 200} />
              </p>
              <p className="text-szl-text-muted text-xs font-medium uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </m.div>
      </div>

      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <a href="#ecosystem" className="text-szl-text-muted hover:text-szl-text-secondary transition-colors">
          <ArrowDown size={20} className="animate-bounce" />
        </a>
      </m.div>
    </section>
  );
}
