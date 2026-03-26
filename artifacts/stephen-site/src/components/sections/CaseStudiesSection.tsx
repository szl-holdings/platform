import { motion } from "framer-motion";
import { ArrowRight, Clock, Building2 } from "lucide-react";
import { useListStephenPortfolioCaseStudies } from "@workspace/api-client-react";

export function CaseStudiesSection() {
  const { data: caseStudies } = useListStephenPortfolioCaseStudies();

  const fallbackStudies = [
    {
      id: 1,
      title: "Global Enterprise Transformation",
      slug: "global-enterprise-transformation",
      client: "Fortune 500 Fintech",
      duration: "12 Months",
      summary: "Completely rearchitected legacy monolithic infrastructure into scalable microservices, resulting in 40% reduction in server costs.",
      tags: ["Cloud Migration", "Microservices", "Fintech"],
    },
    {
      id: 2,
      title: "Scaling Data Pipelines",
      slug: "scaling-data-pipelines",
      client: "Healthcare Analytics",
      duration: "6 Months",
      summary: "Designed and implemented real-time event streaming pipelines handling 5B+ events daily with sub-second latency.",
      tags: ["Data Engineering", "Kafka", "Healthcare"],
    }
  ];

  const displayStudies = caseStudies?.length ? caseStudies : fallbackStudies;

  return (
    <section className="py-24 bg-background relative border-t border-white/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="mb-16">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">Deep Dives</h2>
          <h3 className="text-4xl font-serif font-bold text-foreground">Featured Case Studies</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {displayStudies.map((study, index) => (
            <motion.div
              key={study.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="group flex flex-col bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-colors"
            >
              {/* Image Placeholder */}
              <div className="h-64 bg-secondary relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                {/* Using unsplash luxury abstract architecture for placeholder */}
                {/* dark luxury modern architecture building */}
                <img 
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
                  alt={study.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60"
                />
              </div>

              <div className="p-8 flex-1 flex flex-col relative z-20 -mt-12 bg-background mx-6 rounded-t-2xl border border-b-0 border-border">
                <div className="flex flex-wrap gap-2 mb-4">
                  {study.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <h4 className="text-2xl font-serif font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                  {study.title}
                </h4>
                
                <p className="text-muted-foreground mb-8 flex-1">
                  {study.summary}
                </p>
                
                <div className="flex items-center justify-between border-t border-border pt-6 mt-auto">
                  <div className="flex flex-col gap-2">
                    {study.client && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Building2 size={14} className="mr-2" />
                        {study.client}
                      </div>
                    )}
                    {study.duration && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock size={14} className="mr-2" />
                        {study.duration}
                      </div>
                    )}
                  </div>
                  
                  <button className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-background group-hover:border-primary transition-all">
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
