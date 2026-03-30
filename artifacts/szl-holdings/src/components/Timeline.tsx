import { m } from "framer-motion";
import milestonesData from "@/data/milestones.json";
import siteData from "@/data/site.json";

export function Timeline() {
  const { timeline } = siteData;

  return (
    <section id="timeline" className="py-24 lg:py-32 bg-white border-t border-szl-border">
      <div className="max-w-6xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="text-szl-text-muted text-xs font-semibold uppercase tracking-widest mb-4">History</p>
          <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-szl-text leading-tight">
            {timeline.title}
          </h2>
        </m.div>

        <div className="space-y-0 divide-y divide-szl-border">
          {milestonesData.map((milestone, index) => (
            <m.div
              key={`${milestone.year}-${milestone.quarter}`}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="group py-6 flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8 hover:bg-szl-bg-secondary/50 px-2 -mx-2 rounded-lg transition-colors duration-200"
            >
              <div className="shrink-0 sm:w-32">
                <span className="text-szl-accent font-[var(--font-display)] font-bold text-sm">
                  {milestone.year}
                </span>
                <span className="text-szl-text-muted text-xs ml-1.5">{milestone.quarter}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-[var(--font-display)] text-base font-bold text-szl-text">
                    {milestone.title}
                  </h3>
                  <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-szl-bg-tertiary text-szl-text-muted text-[11px] font-medium">
                    {milestone.highlight}
                  </span>
                </div>
                <p className="text-szl-text-secondary text-sm leading-relaxed">
                  {milestone.description}
                </p>
                {milestone.metric && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-szl-bg-secondary border border-szl-border mt-3">
                    <span className="text-szl-text-muted text-xs">{milestone.metric.label}:</span>
                    <span className="text-szl-text font-semibold text-sm">{milestone.metric.value}</span>
                  </div>
                )}
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
