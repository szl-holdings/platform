import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";

const ecosystem = [
  { name: "Vessels", category: "Maritime Intelligence", status: "live" },
  { name: "INCA", category: "Intelligence Platform", status: "live" },
  { name: "Carlota Jo", category: "Strategic Advisory", status: "live" },
  { name: "Firestorm", category: "Security Simulation", status: "live" },
  { name: "Dreamscape", category: "Creative Engine", status: "beta" },
  { name: "Terra", category: "Real Estate Intelligence", status: "beta" },
];

const statusColors: Record<string, string> = {
  live: "bg-emerald-500",
  beta: "bg-amber-400",
  dev: "bg-neutral-300",
};

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-[60px] bg-white">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(40,80,160,0.03)_0%,transparent_65%)]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-7"
        >
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neutral-200 bg-neutral-50 text-neutral-500 text-[11px] font-medium tracking-[0.08em] uppercase">
            Strategic Technology Portfolio
          </span>
        </m.div>

        <m.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-[2.75rem] sm:text-[3.5rem] lg:text-[4.25rem] font-bold leading-[1.06] tracking-[-0.025em] text-neutral-900 mb-6"
        >
          One holding company.
          <br />
          <span className="text-[hsl(215,45%,36%)]">Six frontier platforms.</span>
        </m.h1>

        <m.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-neutral-500 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed"
        >
          SZL Holdings builds and scales technology companies at the intersection
          of maritime intelligence, AI, and enterprise operations.
        </m.p>

        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.48 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
        >
          <a
            href="#portfolio"
            className="group flex items-center gap-2 px-6 py-3 rounded text-[13.5px] font-semibold text-white bg-[hsl(215,45%,32%)] hover:bg-[hsl(215,45%,38%)] transition-colors duration-200 shadow-sm"
          >
            Explore the portfolio
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
          </a>
          <a
            href="#contact"
            className="flex items-center gap-2 px-6 py-3 rounded text-[13.5px] font-semibold text-neutral-600 border border-neutral-200 hover:border-neutral-300 hover:text-neutral-900 transition-all duration-200"
          >
            Start a strategic conversation
          </a>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-2xl mx-auto"
        >
          {ecosystem.map((venture) => (
            <div
              key={venture.name}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-neutral-100 bg-neutral-50/70 text-left group"
            >
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColors[venture.status]}`} />
              <div>
                <p className="text-neutral-800 text-[12px] font-semibold leading-tight">{venture.name}</p>
                <p className="text-neutral-400 text-[10px] leading-tight mt-0.5">{venture.category}</p>
              </div>
            </div>
          ))}
        </m.div>
      </div>
    </section>
  );
}
