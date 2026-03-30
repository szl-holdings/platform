import { motion } from "framer-motion";
import { BookOpen, Mic, Lightbulb, ArrowRight } from "lucide-react";

const insights = [
  {
    type: "Essay",
    icon: BookOpen,
    title: "Why Vertical Integration Wins in Enterprise AI",
    summary: "Horizontal AI platforms face a fundamental problem: they optimize for breadth, not depth. In regulated industries — defense, maritime, financial services — the companies that own the full stack from data ingestion to decision output will capture disproportionate value.",
    date: "March 2026",
    readTime: "8 min read",
  },
  {
    type: "Talk",
    icon: Mic,
    title: "Building for the Government: What Defense Tech Gets Wrong",
    summary: "Most defense tech startups fail because they build commercial software and try to sell it to the government. The winning approach is the opposite: understand the mission first, then engineer backwards from operational requirements.",
    date: "February 2026",
    readTime: "Keynote · 35 min",
  },
  {
    type: "Thesis",
    icon: Lightbulb,
    title: "The Compounding Intelligence Thesis",
    summary: "When six platforms share a unified data layer, every model trained in one vertical improves predictions across all others. This isn't a network effect — it's an intelligence effect, and it compounds faster than any traditional competitive moat.",
    date: "January 2026",
    readTime: "12 min read",
  },
];

export function ThoughtLeadershipSection() {
  return (
    <section id="insights" className="py-32 bg-secondary/20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-20 gap-6">
          <div>
            <h2 className="text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-4">Thought Leadership</h2>
            <h3 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
              Ideas & Perspectives
            </h3>
            <p className="text-foreground/50 mt-4 max-w-xl">
              Essays, talks, and investment theses on technology strategy, enterprise architecture, and building companies.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {insights.map((insight, i) => {
            const Icon = insight.icon;
            return (
              <motion.article
                key={insight.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group glass-panel rounded-2xl p-8 md:p-10 hover:border-primary/20 transition-all duration-500 cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80 bg-primary/8 px-2.5 py-1 rounded-full">
                        {insight.type}
                      </span>
                      <span className="text-xs text-foreground/30">{insight.date}</span>
                      <span className="text-xs text-foreground/30">{insight.readTime}</span>
                    </div>

                    <h4 className="text-xl md:text-2xl font-serif font-bold text-foreground mb-3 group-hover:text-primary transition-colors leading-snug">
                      {insight.title}
                    </h4>

                    <p className="text-foreground/50 leading-relaxed text-sm md:text-base max-w-3xl">
                      {insight.summary}
                    </p>
                  </div>

                  <div className="hidden md:flex w-10 h-10 rounded-full border border-white/10 items-center justify-center text-foreground/30 group-hover:bg-primary group-hover:text-background group-hover:border-primary transition-all shrink-0 mt-1">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
