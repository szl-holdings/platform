import { m } from "framer-motion";
import { Radio, DollarSign, Brain, Network, Shield, Rocket } from "lucide-react";
import pillarsData from "@/data/pillars.json";
import siteData from "@/data/site.json";

const iconMap: Record<string, React.ElementType> = {
  Radio, DollarSign, Brain, Network, Shield, Rocket,
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
          className="text-center mb-5"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-5">
            <span className="w-4 h-4 rounded bg-indigo-500/30 flex items-center justify-center font-black text-[10px]">6</span>
            SZL Proprietary Framework
          </div>
          <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl lg:text-5xl font-bold text-szl-text mb-4">
            {pillars.title}
          </h2>
          <p className="text-szl-text-secondary text-lg max-w-2xl mx-auto">
            {pillars.subtitle}
          </p>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mb-10 rounded-2xl border border-indigo-500/15 bg-indigo-500/5 p-6 max-w-3xl mx-auto text-center"
        >
          <p className="text-szl-text-secondary text-sm leading-relaxed italic">
            "Every business domain viewed through six proprietary lenses. The Signal Lens cuts through noise. The Impact Lens connects every event to a dollar sign. The Anticipation Lens knows before it happens. The Topology Lens reveals how everything connects. The Posture Lens distills complexity into one score. The Velocity Lens measures how fast we're getting better."
          </p>
          <p className="text-szl-text-muted text-xs mt-3">— SZL Holdings Operating Philosophy</p>
        </m.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillarsData.map((pillar, index) => {
            const Icon = iconMap[pillar.icon] || Shield;
            return (
              <m.div
                key={pillar.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="group relative rounded-xl border border-szl-border bg-szl-surface p-6 hover:border-szl-border-hover hover:bg-szl-surface-hover transition-all duration-300"
              >
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(ellipse at 50% 0%, ${pillar.color}0a 0%, transparent 70%)`,
                  }}
                />

                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${pillar.color}15` }}
                    >
                      <Icon size={22} style={{ color: pillar.color }} />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                      style={{ color: pillar.color, borderColor: `${pillar.color}30`, backgroundColor: `${pillar.color}10` }}>
                      {pillar.id} lens
                    </span>
                  </div>

                  <h3 className="font-[var(--font-display)] text-lg font-bold text-szl-text mb-1">
                    {pillar.title}
                  </h3>
                  <p className="text-xs italic mb-3" style={{ color: pillar.color }}>
                    {(pillar as { tagline?: string }).tagline || ""}
                  </p>
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
                </div>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
