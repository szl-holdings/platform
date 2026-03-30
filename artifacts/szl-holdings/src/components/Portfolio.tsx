import { m } from "framer-motion";
import {
  Ship, Sparkles, Shield, Zap, BarChart3, Palette,
  ExternalLink, ArrowRight,
} from "lucide-react";
import portfolioData from "@/data/portfolio.json";
import siteData from "@/data/site.json";

const iconMap: Record<string, React.ElementType> = {
  Ship, Sparkles, Shield, Zap, BarChart3, Palette,
};

export function Portfolio() {
  const { portfolio } = siteData;

  return (
    <section id="portfolio" className="py-24 lg:py-32 bg-white border-t border-szl-border">
      <div className="max-w-6xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="text-szl-text-muted text-xs font-semibold uppercase tracking-widest mb-4">Portfolio</p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-szl-text leading-tight">
              {portfolio.title}
            </h2>
            <p className="text-szl-text-secondary text-sm max-w-sm leading-relaxed">
              {portfolio.subtitle}
            </p>
          </div>
        </m.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolioData.map((company, index) => {
            const Icon = iconMap[company.icon] || Sparkles;
            return (
              <m.div
                key={company.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.07 }}
              >
                {company.link !== "#" ? (
                  <a
                    href={company.link}
                    className="group flex items-center gap-3 p-4 rounded-xl border border-szl-border hover:border-szl-border-hover hover:bg-szl-bg-secondary transition-all duration-200 block"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${company.color}15` }}
                    >
                      <Icon size={18} style={{ color: company.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-[var(--font-display)] text-sm font-semibold text-szl-text truncate mb-0.5">
                        {company.name}
                      </h3>
                      <p className="text-szl-text-muted text-[10px] font-medium uppercase tracking-widest">
                        {company.category}
                      </p>
                    </div>
                    <ExternalLink size={12} className="text-szl-text-muted group-hover:text-szl-text-secondary shrink-0 transition-colors" />
                  </a>
                ) : (
                  <div className="group flex items-center gap-3 p-4 rounded-xl border border-szl-border transition-all duration-200">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${company.color}15` }}
                    >
                      <Icon size={18} style={{ color: company.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-[var(--font-display)] text-sm font-semibold text-szl-text truncate mb-0.5">
                        {company.name}
                      </h3>
                      <p className="text-szl-text-muted text-[10px] font-medium uppercase tracking-widest">
                        {company.category}
                      </p>
                    </div>
                  </div>
                )}
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
