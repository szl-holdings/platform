import { motion } from "framer-motion";
import { ArrowRight, BookOpen } from "lucide-react";

const articles = [
  {
    title: "Why business observability matters beyond dashboards",
    type: "Framework",
  },
  {
    title: "Workflow clarity as a leadership advantage",
    type: "Essay",
  },
  {
    title: "The cost of low-visibility execution",
    type: "Thesis",
  },
  {
    title: "Building systems that reduce operational drift",
    type: "Framework",
  },
];

const credentialPoints = [
  "Cross-functional delivery and program support",
  "Systems and workflow visibility thinking",
  "Interest in modern AI and cyber-adjacent operating models",
  "Framework-driven approach to execution and alignment",
];

export function WritingSection() {
  return (
    <>
      <section className="py-24 lg:py-32 border-t border-border/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-14"
          >
            <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-4">Writing & Thesis</p>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight">
                Ideas, frameworks, and practical thinking.
              </h2>
              <p className="text-foreground/50 text-sm max-w-sm leading-relaxed">
                This site is a place to document operating ideas, selected work, and frameworks around visibility, execution, and modern systems leadership.
              </p>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            {articles.map((article, i) => (
              <motion.div
                key={article.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group flex items-start gap-4 p-6 rounded-xl border border-border/40 hover:border-primary/20 bg-card/30 hover:bg-card/60 transition-all duration-300 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors mt-0.5">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary/60 mb-2 block">{article.type}</span>
                  <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                </div>
                <ArrowRight className="w-4 h-4 text-foreground/20 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-32 border-t border-border/30 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-4">Background</p>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight mb-6">
                Grounded in execution.
              </h2>
              <ul className="space-y-4">
                {credentialPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground/60 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="p-8 rounded-2xl border border-border/40 bg-card/50"
            >
              <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-4">Start a conversation</p>
              <h3 className="text-2xl font-serif font-bold text-foreground mb-4">
                If you are building around visibility, workflow clarity, observability, or modern operating systems, let's connect.
              </h3>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <a
                  href="#contact"
                  className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors text-center"
                >
                  Start a conversation
                </a>
                <a
                  href="/thought-leadership"
                  className="px-5 py-2.5 rounded-lg border border-border text-foreground/70 font-semibold text-sm hover:border-primary/40 hover:text-foreground transition-colors text-center"
                >
                  Read the thesis
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
