import { motion } from "framer-motion";
import { Award, Briefcase, GraduationCap, Star } from "lucide-react";
import { useListStephenContentBlocks } from "@workspace/api-client-react";
import { format } from "date-fns";

const iconMap: Record<string, React.ElementType> = {
  award: Award,
  briefcase: Briefcase,
  education: GraduationCap,
  star: Star,
};

export function AchievementsSection() {
  const { data: achievements } = useListStephenContentBlocks({ type: "achievement" });

  const defaultAchievements = [
    { id: 1, title: "Founded SZL Holdings", content: "Established the overarching corporate entity to house multiple tech ventures.", date: "2023-01-01", icon: "briefcase" },
    { id: 2, title: "Launched Vessels", content: "Successfully deployed the flagship integration platform to 10k+ users.", date: "2022-06-15", icon: "star" },
    { id: 3, title: "Enterprise Excellence Award", content: "Recognized for outstanding architectural design in SaaS.", date: "2021-11-20", icon: "award" },
  ];

  const items = achievements?.length ? achievements : defaultAchievements;
  
  // Sort descending by date if date exists
  const sortedItems = [...items].sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <section id="timeline" className="py-24 bg-secondary/20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">Milestones</h2>
          <h3 className="text-4xl font-serif font-bold text-foreground">Career Achievements</h3>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[1px] bg-border -translate-x-1/2" />

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
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-4 md:left-1/2 w-10 h-10 rounded-full bg-background border-2 border-primary flex items-center justify-center -translate-x-1/2 z-10 shadow-lg shadow-primary/20">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>

                  {/* Content Panel */}
                  <div className="ml-12 md:ml-0 md:w-1/2 flex flex-col">
                    <div className={`glass-panel p-6 rounded-2xl ${isEven ? "md:ml-8" : "md:mr-8"} hover:border-primary/30 transition-colors`}>
                      <span className="text-xs font-bold text-primary mb-2 block tracking-wider">
                        {item.date ? format(new Date(item.date), "MMMM yyyy") : "Present"}
                      </span>
                      <h4 className="text-xl font-bold text-foreground mb-2">{item.title}</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.content}</p>
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
