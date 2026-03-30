import { motion } from "framer-motion";
import { ArrowRight, Clock, Building2, TrendingUp } from "lucide-react";
import { useListStephenPortfolioCaseStudies } from "@workspace/api-client-react";

export function CaseStudiesSection() {
  const { data: caseStudies } = useListStephenPortfolioCaseStudies();

  const fallbackStudies = [
    {
      id: 1,
      title: "Maritime Fleet Intelligence Platform",
      slug: "maritime-fleet-intelligence",
      client: "Global Shipping Consortium",
      duration: "14 months",
      summary: "Real-time vessel tracking across 200+ container ships — 34% downtime reduction, $12M annual fuel savings.",
      outcome: "34% downtime reduction · $12M fuel savings",
      tags: ["Maritime", "IoT"],
    },
    {
      id: 2,
      title: "Federal Cybersecurity Simulation Engine",
      slug: "federal-cybersecurity-simulation",
      client: "DoD Contractor",
      duration: "18 months",
      summary: "Red team/blue team simulation platform deployed to 3 DoD facilities — 52% faster incident response.",
      outcome: "52% faster incident response · CMMC Level 3",
      tags: ["Defense", "Cybersecurity"],
    },
    {
      id: 3,
      title: "Fintech Payment Processing Migration",
      slug: "fintech-payment-migration",
      client: "Series C Payments Co.",
      duration: "9 months",
      summary: "Rearchitected a monolith serving 2.4M daily transactions — 86% latency reduction, 99.999% uptime.",
      outcome: "86% latency reduction · 41% cost savings",
      tags: ["Fintech", "AWS"],
    },
    {
      id: 4,
      title: "Enterprise SaaS Platform Scaling",
      slug: "enterprise-saas-scaling",
      client: "Pre-IPO Analytics Co.",
      duration: "12 months",
      summary: "Fractional CTO engagement — scaled from 200 to 1,400 enterprise accounts, 15x deployment frequency.",
      outcome: "7x customer growth · 15x deploy frequency",
      tags: ["SaaS", "DevOps"],
    },
  ];

  const displayStudies = caseStudies?.length ? caseStudies : fallbackStudies;

  return (
    <section id="case-studies" className="py-32 bg-background relative border-t border-white/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="mb-20">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-4">Impact in Practice</h2>
          <h3 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">Selected Case Studies</h3>
          <p className="text-foreground/50 text-lg max-w-2xl">Outcomes from engagements across defense, fintech, maritime, and enterprise SaaS. Client details anonymized where required by NDA.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {displayStudies.map((study, index) => (
            <motion.div
              key={study.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group flex flex-col glass-panel rounded-2xl overflow-hidden hover:border-primary/20 transition-all duration-500"
            >
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex flex-wrap gap-2 mb-5">
                  {(study.tags || []).map(tag => (
                    <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-primary/80 bg-primary/8 px-2.5 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <h4 className="text-2xl font-serif font-bold text-foreground mb-4 group-hover:text-primary transition-colors leading-snug">
                  {study.title}
                </h4>
                
                <p className="text-foreground/50 mb-6 flex-1 leading-relaxed text-sm">
                  {study.summary}
                </p>

                {study.outcome && (
                  <div className="flex items-start gap-2 mb-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <TrendingUp size={16} className="text-primary mt-0.5 shrink-0" />
                    <span className="text-sm font-semibold text-primary">{study.outcome}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between border-t border-white/5 pt-5 mt-auto">
                  <div className="flex items-center gap-6">
                    {study.client && (
                      <div className="flex items-center text-sm text-foreground/40">
                        <Building2 size={14} className="mr-2" />
                        {study.client}
                      </div>
                    )}
                    {study.duration && (
                      <div className="flex items-center text-sm text-foreground/40">
                        <Clock size={14} className="mr-2" />
                        {study.duration}
                      </div>
                    )}
                  </div>
                  
                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-foreground/40 group-hover:bg-primary group-hover:text-background group-hover:border-primary transition-all">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
