import { motion } from "framer-motion";
import { Server, Layout, ShieldCheck, Zap, Database, Search, TrendingUp, Code2 } from "lucide-react";
import { useListStephenContentBlocks } from "@workspace/api-client-react";

const fallbackServices = [
  { 
    id: 1, 
    title: "Enterprise Architecture & Platform Design", 
    content: "End-to-end system design for organizations scaling past their first architecture. From monolith decomposition to event-driven microservices, I design platforms built to handle 10x growth without 10x cost. Typical engagement: $45K - $120K.", 
    icon: "Server" 
  },
  { 
    id: 2, 
    title: "Technical Due Diligence & M&A Advisory", 
    content: "Deep technical assessment for PE firms, VCs, and corporate acquirers evaluating technology assets. Code quality audits, infrastructure risk analysis, and scalability scoring. Comparable to McKinsey Digital or Bain tech assessments. Typical engagement: $35K - $85K.", 
    icon: "Search" 
  },
  { 
    id: 3, 
    title: "Cybersecurity & Threat Architecture", 
    content: "Security-first infrastructure design for defense, fintech, and regulated industries. NIST/CMMC compliance frameworks, zero-trust network architecture, and red team simulation design. Typical engagement: $50K - $150K.", 
    icon: "ShieldCheck" 
  },
  { 
    id: 4, 
    title: "Product & Growth Strategy", 
    content: "Translating technical capability into market positioning. Product-market fit analysis, competitive technical benchmarking, and go-to-market engineering. Informed by building six products across four verticals. Typical engagement: $25K - $60K.", 
    icon: "TrendingUp" 
  },
  { 
    id: 5, 
    title: "Full-Stack Engineering Leadership", 
    content: "Fractional CTO and engineering leadership for Series A-C companies needing senior technical direction without a full-time hire. Team structuring, tech stack evaluation, and delivery process optimization. Retainer: $15K - $30K/month.", 
    icon: "Code2" 
  },
  { 
    id: 6, 
    title: "Data Infrastructure & Intelligence Systems", 
    content: "Real-time data pipeline architecture, analytics platform design, and ML-ops infrastructure. From maritime vessel tracking to financial transaction monitoring — built for throughput and reliability. Typical engagement: $40K - $100K.", 
    icon: "Database" 
  },
];

const iconMap: Record<string, React.ElementType> = {
  Server, Layout, ShieldCheck, Zap, Database, Search, TrendingUp, Code2
};

export function ServicesSection() {
  const { data: services } = useListStephenContentBlocks({ type: "service" });
  
  const displayServices = services?.length ? services : fallbackServices;

  return (
    <section id="services" className="py-32 bg-background relative border-t border-white/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="max-w-3xl mb-20">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-4">Engagement Models</h2>
          <h3 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">Strategic Advisory & Technical Leadership</h3>
          <p className="text-foreground/50 text-lg leading-relaxed">
            I partner with a select number of organizations each quarter. Engagements are scoped for impact, 
            priced at parity with top-tier strategy firms, and delivered with the hands-on depth that only a 
            builder-operator can provide.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayServices.map((service, index) => {
            const Icon = service.icon && iconMap[service.icon] ? iconMap[service.icon] : Zap;
            
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ y: -6, scale: 1.01 }}
                className="group p-8 rounded-2xl glass-panel hover:bg-white/[0.02] hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 flex flex-col"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-lg font-bold text-foreground mb-3 leading-snug">{service.title}</h4>
                <p className="text-foreground/50 leading-relaxed text-sm flex-1">
                  {service.content}
                </p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 glass-panel rounded-2xl p-8 md:p-12 border-primary/10 text-center"
        >
          <p className="text-foreground/40 text-sm uppercase tracking-[0.15em] mb-3">Engagement starts with a conversation</p>
          <h4 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-4">
            Initial consultations are complimentary and confidential.
          </h4>
          <p className="text-foreground/50 max-w-2xl mx-auto mb-8">
            All engagements begin with a 30-minute strategic briefing to assess fit and scope. 
            NDA available upon request. Limited availability — currently accepting 2-3 new engagements per quarter.
          </p>
          <a href="#contact">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-10 py-4 rounded-full bg-primary text-primary-foreground font-semibold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
            >
              Request a Briefing
            </motion.button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
