import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";

const ventures = [
  { name: "Vessels", domain: "Maritime Intelligence" },
  { name: "Firestorm", domain: "Adversarial Security" },
  { name: "Dreamscape", domain: "AI Creative Production" },
  { name: "INCA", domain: "Research Intelligence" },
  { name: "Terra", domain: "Real Estate Analytics" },
  { name: "Alloy", domain: "Unified AI Platform" },
];

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-szl-bg pt-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{ background: "radial-gradient(ellipse at center, rgba(201,169,110,0.04) 0%, transparent 65%)" }}
        />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px]"
          style={{ background: "radial-gradient(ellipse at bottom right, rgba(201,169,110,0.03) 0%, transparent 60%)" }}
        />
        <div className="absolute inset-0"
          style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize: "48px 48px" }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-10"
          >
            <span className="inline-flex items-center gap-2.5 px-4 py-1.5 border border-szl-border text-szl-text-muted text-[10px] font-medium tracking-[0.25em] uppercase">
              <span className="w-1 h-1 rounded-full bg-szl-accent inline-block" />
              Est. 2021 · Washington, D.C. · London · Singapore
            </span>
          </m.div>

          <m.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl sm:text-6xl lg:text-[4.5rem] xl:text-[5.25rem] leading-[1.0] font-[var(--font-display)] mb-8 tracking-tight text-szl-text"
          >
            A portfolio built for modern
            <br />
            <span style={{ color: "var(--color-szl-accent)" }}>
              systems, operations,
            </span>
            <br />
            and premium execution
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.38 }}
            className="text-szl-text-secondary text-base sm:text-lg max-w-xl mx-auto mb-12 leading-relaxed font-light"
          >
            SZL Holdings deploys capital and operational infrastructure across six frontier technology ventures — each commanding a distinct vertical within a unified intelligence ecosystem.
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="#portfolio"
              className="group px-8 py-3.5 bg-szl-accent text-szl-bg font-semibold text-sm hover:bg-szl-accent-light transition-colors duration-200 flex items-center gap-2.5"
            >
              Explore the portfolio
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="#leadership"
              className="group px-8 py-3.5 border border-szl-border text-szl-text-secondary font-medium text-sm hover:text-szl-text hover:border-szl-border-hover transition-all duration-200 flex items-center gap-2.5"
            >
              View the ventures
              <ArrowRight size={15} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </a>
          </m.div>
        </div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="border-t border-szl-border pt-12"
        >
          <p className="text-szl-text-muted text-[10px] font-medium tracking-[0.25em] uppercase text-center mb-8">
            Active ventures
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-szl-border">
            {ventures.map((v) => (
              <div
                key={v.name}
                className="bg-szl-bg px-5 py-6 text-center hover:bg-szl-bg-secondary transition-colors duration-200"
              >
                <p className="text-szl-text font-[var(--font-display)] text-base mb-1">{v.name}</p>
                <p className="text-szl-text-muted text-[10px] tracking-wide leading-tight">{v.domain}</p>
              </div>
            ))}
          </div>
        </m.div>
      </div>
    </section>
  );
}
