import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
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
      summary: "Real-time vessel tracking and predictive maintenance across 200+ container ships. Reduced unplanned downtime by 34% and delivered $12M in annual fuel savings through route optimization.",
      outcome: "34% downtime reduction · $12M fuel savings annually",
      tags: ["Maritime", "IoT", "Predictive ML"],
    },
    {
      id: 2,
      title: "Federal Cybersecurity Simulation Engine",
      slug: "federal-cybersecurity-simulation",
      client: "DoD Contractor",
      duration: "18 months",
      summary: "Adversarial red team / blue team simulation platform deployed across three DoD facilities. Achieved CMMC Level 3 certification and reduced incident response time by 52%.",
      outcome: "52% faster incident response · CMMC Level 3",
      tags: ["Defense", "Cybersecurity", "Simulation"],
    },
    {
      id: 3,
      title: "Fintech Payment Infrastructure Migration",
      slug: "fintech-payment-migration",
      client: "Series C Payments Company",
      duration: "9 months",
      summary: "Rearchitected a monolithic payment processor serving 2.4M daily transactions — moved to event-driven microservices on AWS, achieving 86% latency reduction at 41% lower cost.",
      outcome: "86% latency reduction · 41% cost savings",
      tags: ["Fintech", "AWS", "Microservices"],
    },
    {
      id: 4,
      title: "Enterprise SaaS Scaling Engagement",
      slug: "enterprise-saas-scaling",
      client: "Pre-IPO Analytics Platform",
      duration: "12 months",
      summary: "Fractional CTO engagement through Series C. Scaled from 200 to 1,400 enterprise accounts — rebuilt deployment pipeline to achieve 15x release velocity.",
      outcome: "7x customer growth · 15x deploy frequency",
      tags: ["SaaS", "DevOps", "Fractional CTO"],
    },
  ];

  const displayStudies = caseStudies?.length ? caseStudies : fallbackStudies;

  return (
    <section id="case-studies" className="py-32 bg-background relative border-t border-white/5">
      <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
        <div className="mb-20">
          <p className="text-[10px] font-semibold text-primary uppercase tracking-[0.25em] mb-5">Impact in practice</p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 max-w-5xl">
            <h2 className="text-4xl sm:text-5xl font-serif text-foreground leading-tight">
              Selected work
            </h2>
            <p className="text-foreground/45 text-base max-w-sm font-light leading-relaxed flex-shrink-0">
              Outcomes from engagements across defense, fintech, maritime, and enterprise SaaS. Client details anonymized under NDA.
            </p>
          </div>
        </div>

        <div className="space-y-px bg-white/5">
          {displayStudies.map((study, index) => (
            <motion.div
              key={study.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group bg-background hover:bg-secondary/30 transition-colors duration-300"
            >
              <div className="p-8 lg:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                  <div className="lg:col-span-7">
                    <div className="flex flex-wrap gap-2 mb-5">
                      {(study.tags || []).map(tag => (
                        <span key={tag} className="text-[10px] font-medium uppercase tracking-wider text-primary/70 border border-primary/15 px-2.5 py-1">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-serif text-foreground mb-4 leading-snug group-hover:text-primary transition-colors duration-200">
                      {study.title}
                    </h3>

                    <p className="text-foreground/50 text-sm leading-relaxed font-light mb-6 max-w-xl">
                      {study.summary}
                    </p>

                    <div className="flex items-center gap-6 text-xs text-foreground/30 font-light">
                      {study.client && <span>{study.client}</span>}
                      {study.client && study.duration && <span className="w-px h-3 bg-white/10" />}
                      {study.duration && <span>{study.duration}</span>}
                    </div>
                  </div>

                  <div className="lg:col-span-5 lg:flex lg:items-end lg:justify-end">
                    <div className="flex flex-col gap-1">
                      {study.outcome && (
                        <div className="text-sm font-medium text-primary leading-relaxed">
                          {study.outcome.split(' · ').map((line, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="w-1 h-1 rounded-full bg-primary/50 shrink-0" />
                              {line}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-foreground/25 text-xs mt-3 group-hover:text-primary/50 transition-colors">
                        <span className="text-[10px] tracking-wider uppercase">Case study</span>
                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
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
