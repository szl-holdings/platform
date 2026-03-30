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
      duration: "14 Months",
      summary: "Designed and deployed a real-time vessel tracking and cargo optimization platform across 200+ container ships. Reduced fleet downtime by 34%, cut fuel consumption by $12M annually through route optimization algorithms, and delivered predictive maintenance alerts that prevented 47 critical engine failures in the first year.",
      outcome: "34% downtime reduction, $12M annual fuel savings",
      tags: ["Maritime", "IoT", "Predictive Analytics", "Real-Time Systems"],
    },
    {
      id: 2,
      title: "Federal Cybersecurity Simulation Engine",
      slug: "federal-cybersecurity-simulation",
      client: "U.S. Department of Defense (Contractor)",
      duration: "18 Months",
      summary: "Built a red team/blue team simulation environment for training federal cybersecurity analysts. The platform generates realistic attack scenarios across network, application, and social engineering vectors. Deployed to 3 DoD training facilities, reduced mean incident response time by 52% across participating units, and earned CMMC Level 3 compliance certification.",
      outcome: "52% faster incident response, 3 DoD facilities deployed",
      tags: ["Cybersecurity", "Defense", "CMMC", "Simulation"],
    },
    {
      id: 3,
      title: "Fintech Payment Processing Migration",
      slug: "fintech-payment-migration",
      client: "Series C Payments Company",
      duration: "9 Months",
      summary: "Led the complete rearchitecture of a legacy payment processing monolith serving 2.4M daily transactions. Migrated to an event-driven microservices architecture on AWS, achieving 99.999% uptime. Reduced transaction processing latency from 340ms to 47ms and cut infrastructure costs by 41% while handling 3x previous peak throughput.",
      outcome: "99.999% uptime, 86% latency reduction, 41% cost savings",
      tags: ["Fintech", "Payments", "AWS", "Microservices"],
    },
    {
      id: 4,
      title: "Enterprise SaaS Platform Scaling",
      slug: "enterprise-saas-scaling",
      client: "B2B Analytics Platform (Pre-IPO)",
      duration: "12 Months",
      summary: "Served as fractional CTO for a pre-IPO analytics company, restructuring the engineering organization from 12 to 45 engineers across 6 squads. Implemented CI/CD pipeline that reduced deployment frequency from bi-weekly to 15x daily. Platform scaled from 200 to 1,400 enterprise accounts while maintaining sub-200ms p95 response times.",
      outcome: "7x customer growth, 15x deployment frequency",
      tags: ["SaaS", "Scaling", "Team Building", "DevOps"],
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
