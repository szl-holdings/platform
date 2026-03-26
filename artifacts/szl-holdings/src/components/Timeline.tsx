import { motion } from "framer-motion";
import milestonesData from "@/data/milestones.json";
import siteData from "@/data/site.json";

export function Timeline() {
  const { timeline } = siteData;

  return (
    <section id="timeline" className="py-20 lg:py-28">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-szl-text mb-4">
            {timeline.title}
          </h2>
          <p className="text-szl-text-secondary text-lg max-w-2xl mx-auto">
            {timeline.subtitle}
          </p>
        </motion.div>

        <div className="relative">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-szl-primary/40 via-szl-accent/30 to-szl-border" />

          {milestonesData.map((milestone, index) => {
            const isLeft = index % 2 === 0;
            return (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative flex items-start mb-12 last:mb-0 ${
                  isLeft ? "md:flex-row" : "md:flex-row-reverse"
                } flex-row`}
              >
                <div className="hidden md:block md:w-1/2" />

                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-szl-primary border-2 border-szl-bg z-10 mt-6" />

                <div className={`ml-10 md:ml-0 md:w-1/2 ${isLeft ? "md:pr-12" : "md:pl-12"}`}>
                  <div className="group rounded-xl border border-szl-border bg-szl-surface p-6 hover:border-szl-border-hover hover:bg-szl-surface-hover transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-szl-primary font-[var(--font-display)] font-bold text-2xl">
                        {milestone.year}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-szl-primary/10 text-szl-primary-light text-xs font-medium">
                        {milestone.highlight}
                      </span>
                    </div>
                    <h3 className="font-[var(--font-display)] text-lg font-bold text-szl-text mb-2">
                      {milestone.title}
                    </h3>
                    <p className="text-szl-text-secondary text-sm leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
