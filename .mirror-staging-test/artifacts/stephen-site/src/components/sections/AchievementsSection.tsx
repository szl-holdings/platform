import { motion } from "framer-motion";
import { Award, Briefcase, GraduationCap, Star, Rocket, Shield, Globe } from "lucide-react";
import { useListStephenContentBlocks } from "@workspace/api-client-react";
import { format } from "date-fns";

const iconMap: Record<string, React.ElementType> = {
  award: Award,
  briefcase: Briefcase,
  education: GraduationCap,
  star: Star,
  rocket: Rocket,
  shield: Shield,
  globe: Globe,
};

export function AchievementsSection() {
  const { data: achievements } = useListStephenContentBlocks({ type: "achievement" });

  const defaultAchievements = [
    { id: 1, title: "Founded SZL Holdings", content: "Established a vertically integrated technology holding company with six product lines spanning maritime intelligence, cybersecurity, commerce, and creative production.", date: "2022-03-01", icon: "rocket" },
    { id: 2, title: "Led $180M Payment Platform Migration", content: "Architected the migration of a legacy payment processing system to event-driven microservices, handling 2.4M daily transactions with 99.999% uptime.", date: "2020-09-15", icon: "star" },
    { id: 3, title: "CMMC Level 3 Certification — Firestorm", content: "Achieved Cybersecurity Maturity Model Certification for the Firestorm simulation platform, enabling deployment to U.S. Department of Defense training facilities.", date: "2021-06-01", icon: "shield" },
    { id: 4, title: "Scaled Engineering Org from 12 to 45", content: "Built and structured a high-performing engineering organization across 6 product squads, reducing deployment cycle from bi-weekly to continuous delivery (15x/day).", date: "2019-01-15", icon: "briefcase" },
    { id: 5, title: "Maritime Intelligence Platform Launch", content: "Deployed vessel tracking and cargo optimization system across 200+ container ships, delivering $12M in annual fuel savings for a global shipping consortium.", date: "2023-08-01", icon: "globe" },
    { id: 6, title: "Enterprise Architecture Excellence Award", content: "Recognized by the Enterprise Architecture Forum for innovative system design in financial services infrastructure.", date: "2018-11-20", icon: "award" },
  ];

  const items = achievements?.length ? achievements : defaultAchievements;
  
  const sortedItems = [...items].sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <section id="timeline" className="py-32 bg-secondary/20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="text-center mb-20">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-4">Track Record</h2>
          <h3 className="text-4xl md:text-5xl font-serif font-bold text-foreground">Key Milestones</h3>
          <p className="text-foreground/50 mt-4 max-w-xl mx-auto">A timeline of defining moments across enterprise engineering, defense technology, and company building.</p>
        </div>

        <div className="relative">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-primary/30 via-border to-transparent -translate-x-1/2" />

          <div className="space-y-12">
            {sortedItems.map((item, index) => {
              const Icon = item.icon && iconMap[item.icon as keyof typeof iconMap] ? iconMap[item.icon as keyof typeof iconMap] : Star;
              const isEven = index % 2 === 0;

              return (
                <motion.div 
                  key={item.id} 
                  className={`relative flex flex-col md:flex-row items-start ${isEven ? "md:flex-row-reverse" : ""} gap-8 md:gap-16`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                >
                  <div className="absolute left-4 md:left-1/2 w-10 h-10 rounded-full bg-background border-2 border-primary/50 flex items-center justify-center -translate-x-1/2 z-10 shadow-lg shadow-primary/10">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>

                  <div className="ml-12 md:ml-0 md:w-1/2 flex flex-col">
                    <div className={`glass-panel p-6 rounded-2xl ${isEven ? "md:ml-8" : "md:mr-8"} hover:border-primary/20 transition-colors group`}>
                      <span className="text-[10px] font-bold text-primary/70 mb-2 block tracking-[0.15em] uppercase">
                        {item.date ? format(new Date(item.date), "MMMM yyyy") : "Present"}
                      </span>
                      <h4 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{item.title}</h4>
                      <p className="text-foreground/50 text-sm leading-relaxed">{item.content}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
