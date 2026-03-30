import { motion } from "framer-motion";
import { Server, Layout, ShieldCheck, Zap, Database, Search, TrendingUp, Code2 } from "lucide-react";
import { useListStephenContentBlocks } from "@workspace/api-client-react";

const fallbackServices = [
  { 
    id: 1, 
    title: "Enterprise Architecture", 
    content: "End-to-end platform design for organizations scaling past their first architecture — monolith to microservices, built for 10x growth.", 
    icon: "Server" 
  },
  { 
    id: 2, 
    title: "Technical Due Diligence", 
    content: "Deep technical assessment for PE and VC acquirers — code quality, infrastructure risk, and scalability scoring.", 
    icon: "Search" 
  },
  { 
    id: 3, 
    title: "Cybersecurity Architecture", 
    content: "Zero-trust network design and NIST/CMMC compliance for defense, fintech, and regulated industries.", 
    icon: "ShieldCheck" 
  },
  { 
    id: 4, 
    title: "Fractional CTO", 
    content: "Senior engineering leadership for Series A–C companies — team structure, tech stack, delivery process.", 
    icon: "Code2" 
  },
  { 
    id: 5, 
    title: "Data & Intelligence Systems", 
    content: "Real-time data pipelines and ML-ops infrastructure built for throughput and reliability at scale.", 
    icon: "Database" 
  },
  { 
    id: 6, 
    title: "Product Strategy", 
    content: "Translating technical capability into market positioning — PMF analysis, competitive benchmarking, go-to-market.", 
    icon: "TrendingUp" 
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
          className="mt-12 flex items-center justify-between border-t border-white/5 pt-10"
        >
          <p className="text-foreground/40 text-sm">Accepting 2–3 engagements per quarter.</p>
          <a href="#contact">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/35 transition-all duration-300"
            >
              Request a Briefing
            </motion.button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
