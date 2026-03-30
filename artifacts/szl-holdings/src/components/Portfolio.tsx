import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Ship, Sparkles, Shield, Zap, BarChart3, Palette,
  ExternalLink, ArrowRight, TrendingUp,
} from "lucide-react";
import portfolioData from "@/data/portfolio.json";
import siteData from "@/data/site.json";

const iconMap: Record<string, React.ElementType> = {
  Ship, Sparkles, Shield, Zap, BarChart3, Palette,
};

const categories = [siteData.portfolio.filterAllLabel, ...Array.from(new Set(portfolioData.map((p) => p.category)))];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Live: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    Beta: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    "In Development": "bg-gray-500/15 text-gray-400 border-gray-500/25",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles["In Development"]}`}>
      {status}
    </span>
  );
}

export function Portfolio() {
  const [filter, setFilter] = useState(siteData.portfolio.filterAllLabel);
  const { portfolio } = siteData;

  const filtered = filter === portfolio.filterAllLabel
    ? portfolioData
    : portfolioData.filter((p) => p.category === filter);

  return (
    <section id="portfolio" className="py-20 lg:py-28 bg-szl-bg-secondary">
      <div className="max-w-7xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl lg:text-5xl font-bold text-szl-text mb-4">
            {portfolio.title}
          </h2>
          <p className="text-szl-text-secondary text-lg max-w-2xl mx-auto">
            {portfolio.subtitle}
          </p>
        </m.div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                filter === cat
                  ? "bg-szl-primary text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                  : "border border-szl-border text-szl-text-secondary hover:text-szl-text hover:border-szl-border-hover"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <m.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((company) => {
              const Icon = iconMap[company.icon] || Sparkles;
              return (
                <m.div
                  key={company.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="group relative rounded-xl border border-szl-border bg-szl-surface hover:border-szl-border-hover hover:bg-szl-surface-hover transition-all duration-300"
                >
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(ellipse at 50% 0%, ${company.color}0a 0%, transparent 70%)`,
                    }}
                  />
                  <div className="relative p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${company.color}18` }}
                      >
                        <Icon size={22} style={{ color: company.color }} />
                      </div>
                      <StatusBadge status={company.status} />
                    </div>

                    <h3 className="font-[var(--font-display)] text-xl font-bold text-szl-text mb-1">
                      {company.name}
                    </h3>
                    <p className="text-szl-text-muted text-xs font-semibold uppercase tracking-widest mb-3">
                      {company.tagline}
                    </p>
                    <p className="text-szl-text-secondary text-sm leading-relaxed mb-5">
                      {company.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {company.metrics.slice(0, 4).map((metric: { label: string; value: string }) => (
                        <div key={metric.label} className="rounded-lg bg-szl-bg/60 px-3 py-2">
                          <p className="text-szl-text font-bold text-sm">{metric.value}</p>
                          <p className="text-szl-text-muted text-[10px] font-medium uppercase tracking-wider">{metric.label}</p>
                        </div>
                      ))}
                    </div>

                    {company.marketContext && (
                      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-szl-primary/5 border border-szl-primary/10 mb-4">
                        <TrendingUp size={12} className="text-szl-primary-light mt-0.5 shrink-0" />
                        <p className="text-szl-text-muted text-[10px] leading-tight">{company.marketContext}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-end pt-3 border-t border-szl-border">
                      {company.link !== "#" ? (
                        <a
                          href={company.link}
                          className="flex items-center gap-1.5 text-szl-primary-light text-sm font-semibold hover:text-szl-primary transition-colors group/link"
                        >
                          {portfolio.visitLabel} <ExternalLink size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
                        </a>
                      ) : (
                        <span className="flex items-center gap-1.5 text-szl-text-muted text-sm font-medium">
                          {portfolio.comingSoonLabel} <ArrowRight size={14} />
                        </span>
                      )}
                    </div>
                  </div>
                </m.div>
              );
            })}
          </AnimatePresence>
        </m.div>
      </div>
    </section>
  );
}
