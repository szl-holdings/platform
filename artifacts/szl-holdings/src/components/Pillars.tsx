import { m } from 'framer-motion';
import { Brain, DollarSign, Network, Radio, Rocket, Shield } from 'lucide-react';
import pillarsData from '@/data/pillars.json';
import siteData from '@/data/site.json';

const iconMap: Record<string, React.ElementType> = {
  Radio,
  DollarSign,
  Brain,
  Network,
  Shield,
  Rocket,
};

export function Pillars() {
  const { pillars } = siteData;

  return (
    <section id="pillars" className="py-24 lg:py-32 bg-szl-bg-secondary border-t border-szl-border">
      <div className="max-w-6xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="text-szl-text-muted text-xs font-semibold uppercase tracking-widest mb-4">
            Innovation
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-szl-text leading-tight">
              {pillars.title}
            </h2>
            <p className="text-szl-text-secondary text-sm max-w-sm leading-relaxed">
              {pillars.subtitle}
            </p>
          </div>
        </m.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pillarsData.map((pillar, index) => {
            const Icon = iconMap[pillar.icon] || Shield;
            return (
              <m.div
                key={pillar.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="group rounded-xl border border-szl-border bg-white p-6 hover:border-szl-border-hover hover:bg-white hover:shadow-sm transition-all duration-200"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${pillar.color}12` }}
                >
                  <Icon size={20} style={{ color: pillar.color }} />
                </div>

                <h3 className="font-[var(--font-display)] text-base font-bold text-szl-text mb-2">
                  {pillar.title}
                </h3>
                <p className="text-szl-text-secondary text-sm leading-relaxed mb-5">
                  {pillar.description}
                </p>

                <div className="space-y-2.5 pt-4 border-t border-szl-border">
                  {pillar.metrics.slice(0, 2).map((metric: { label: string; value: string }) => (
                    <div key={metric.label} className="flex items-center justify-between">
                      <span className="text-szl-text-muted text-xs">{metric.label}</span>
                      <span className="text-szl-text font-semibold text-sm">{metric.value}</span>
                    </div>
                  ))}
                </div>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
