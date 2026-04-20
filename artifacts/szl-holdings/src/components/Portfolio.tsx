import { m } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import portfolioData from '@/data/portfolio.json';

export function Portfolio() {
  return (
    <section id="portfolio" className="py-24 lg:py-36 bg-szl-bg border-t border-szl-border">
      <div className="max-w-6xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <p className="text-szl-text-muted text-[10px] font-medium uppercase tracking-[0.25em] mb-6">
            Portfolio
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 max-w-4xl">
            <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl text-szl-text leading-[1.05]">
              Six operating companies.
              <br />
              <span style={{ color: 'var(--color-szl-accent)' }}>One intelligence fabric.</span>
            </h2>
            <p className="text-szl-text-secondary text-sm max-w-xs leading-relaxed font-light flex-shrink-0">
              Each platform commands its vertical. Shared infrastructure compounds the advantage
              across all of them.
            </p>
          </div>
        </m.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-szl-border">
          {portfolioData.map((company, index) => (
            <m.div
              key={company.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              {company.link !== '#' ? (
                <a
                  href={company.link}
                  className="group block bg-szl-bg hover:bg-szl-bg-secondary transition-colors duration-300 p-8 h-full"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div
                      className="w-10 h-10 flex items-center justify-center border border-szl-border"
                      style={{ color: company.color }}
                    >
                      <span className="font-[var(--font-display)] text-base">
                        {company.name[0]}
                      </span>
                    </div>
                    <ArrowUpRight
                      size={14}
                      className="text-szl-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  <h3 className="font-[var(--font-display)] text-xl text-szl-text mb-2 group-hover:text-szl-accent transition-colors duration-200">
                    {company.name}
                  </h3>
                  <p className="text-szl-text-muted text-[10px] font-medium uppercase tracking-[0.2em] mb-4">
                    {company.category}
                  </p>
                  {company.description && (
                    <p className="text-szl-text-secondary text-sm leading-relaxed font-light">
                      {company.description}
                    </p>
                  )}
                </a>
              ) : (
                <div className="block bg-szl-bg p-8 h-full opacity-50">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-10 h-10 flex items-center justify-center border border-szl-border">
                      <span className="font-[var(--font-display)] text-base text-szl-text-muted">
                        {company.name[0]}
                      </span>
                    </div>
                    <span className="text-[10px] text-szl-text-muted tracking-wider uppercase border border-szl-border px-2 py-0.5">
                      Soon
                    </span>
                  </div>
                  <h3 className="font-[var(--font-display)] text-xl text-szl-text-secondary mb-2">
                    {company.name}
                  </h3>
                  <p className="text-szl-text-muted text-[10px] font-medium uppercase tracking-[0.2em]">
                    {company.category}
                  </p>
                </div>
              )}
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
