import { m } from "framer-motion";
import { Brain, ShieldCheck, Anchor, Lightbulb, Target } from "lucide-react";
import pillarsData from "@/data/pillars.json";
import siteData from "@/data/site.json";

const iconMap: Record<string, React.ElementType> = {
  Brain, ShieldCheck, Anchor, Lightbulb, Target,
};

export function Pillars() {
  const { pillars } = siteData;

  return (
    <section id="pillars" className="py-20 lg:py-28 bg-szl-bg-secondary">
      <div className="max-w-7xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl lg:text-5xl font-bold text-szl-text mb-4">
            {pillars.title}
          </h2>
          <p className="text-szl-text-secondary text-lg max-w-2xl mx-auto">
            {pillars.subtitle}
          </p>
        </m.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillarsData.map((pillar, index) => {
            const Icon = iconMap[pillar.icon] || Brain;
            return (
              <m.div
                key={pillar.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`group relative rounded-xl border border-szl-border bg-szl-surface p-6 hover:border-szl-border-hover hover:bg-szl-surface-hover transition-all duration-300 ${
                  index === 4 ? "md:col-start-1 lg:col-start-2" : ""
                }`}
              >
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(ellipse at 50% 0%, ${pillar.color}0a 0%, transparent 70%)`,
                  }}
                />

                <div className="relative">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${pillar.color}15` }}
                  >
                    <Icon size={24} style={{ color: pillar.color }} />
                  </div>

                  <h3 className="font-[var(--font-display)] text-lg font-bold text-szl-text mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-szl-text-secondary text-sm leading-relaxed mb-5">
                    {pillar.description}
                  </p>

                  <div className="space-y-3 pt-4 border-t border-szl-border">
                    {pillar.metrics.map((metric: { label: string; value: string }) => (
                      <div key={metric.label} className="flex items-center justify-between">
                        <span className="text-szl-text-muted text-xs font-medium">{metric.label}</span>
                        <span className="text-szl-text font-bold text-sm">{metric.value}</span>
                      </div>
                    ))}
                  </div>

                  {pillar.source && (
                    <p className="mt-3 text-szl-text-muted/60 text-[10px] italic">
                      Source: {pillar.source}
                    </p>
                  )}
                </div>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
