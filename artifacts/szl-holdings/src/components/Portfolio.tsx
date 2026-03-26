import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ship, Sparkles, Shield, Zap, BarChart3, Palette,
  ExternalLink, ArrowRight,
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-szl-text mb-4">
            {portfolio.title}
          </h2>
          <p className="text-szl-text-secondary text-lg max-w-2xl mx-auto">
            {portfolio.subtitle}
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === cat
                  ? "bg-szl-primary text-white"
                  : "border border-szl-border text-szl-text-secondary hover:text-szl-text hover:border-szl-border-hover"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((company) => {
              const Icon = iconMap[company.icon] || Sparkles;
              return (
                <motion.div
                  key={company.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="group relative rounded-xl border border-szl-border bg-szl-surface hover:border-szl-border-hover hover:bg-szl-surface-hover transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${company.color}20` }}
                      >
                        <Icon size={20} style={{ color: company.color }} />
                      </div>
                      <StatusBadge status={company.status} />
                    </div>

                    <h3 className="font-[var(--font-display)] text-lg font-bold text-szl-text mb-1">
                      {company.name}
                    </h3>
                    <p className="text-szl-text-muted text-xs font-medium uppercase tracking-wider mb-3">
                      {company.tagline}
                    </p>
                    <p className="text-szl-text-secondary text-sm leading-relaxed mb-4">
                      {company.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-szl-border">
                      <div>
                        <p className="text-szl-text-muted text-xs">{company.metrics.label}</p>
                        <p className="text-szl-text font-semibold text-sm">{company.metrics.value}</p>
                      </div>
                      {company.link !== "#" ? (
                        <a
                          href={company.link}
                          className="flex items-center gap-1 text-szl-primary-light text-sm font-medium hover:text-szl-primary transition-colors"
                        >
                          {portfolio.visitLabel} <ExternalLink size={14} />
                        </a>
                      ) : (
                        <span className="flex items-center gap-1 text-szl-text-muted text-sm">
                          {portfolio.comingSoonLabel} <ArrowRight size={14} />
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
