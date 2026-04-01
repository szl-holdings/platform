import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Github } from "lucide-react";
import { useListProjects } from "@workspace/api-client-react";

export function PortfolioSection() {
  const { data: projects, isLoading } = useListProjects();
  const [filter, setFilter] = useState<string>("all");

  const fallbackProjects = [
    { id: 1, name: "Alloy", description: "Execution fabric and predictive intelligence engine powering Lyte and Vessels. Scenario modeling, confidence scoring, and agent coordination at the platform layer.", status: "active" },
    { id: 2, name: "Lyte", description: "Business observability and orchestration platform interpreting signals, routing decisions, and managing escalations across the ecosystem.", status: "active" },
    { id: 3, name: "Vessels", description: "Maritime fleet intelligence and cargo optimization platform. Real-time tracking across 200+ vessels with predictive maintenance and route optimization.", status: "active" },
    { id: 4, name: "Terra", description: "Continuous business telemetry platform detecting KPI movement, value leakage, and market anomalies across enterprise verticals.", status: "active" },
    { id: 5, name: "Carlota Jo", description: "Principal advisory practice serving boards, leadership teams, and investors across regulated and high-growth sectors.", status: "active" },
  ];

  const displayProjects = projects?.length ? projects : fallbackProjects;
  
  const filteredProjects = filter === "all" 
    ? displayProjects 
    : displayProjects.filter(p => p.status === filter);

  return (
    <section id="portfolio" className="py-32 bg-secondary/20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-4">The Portfolio</h2>
            <h3 className="text-4xl md:text-5xl font-serif font-bold text-foreground">Products I've Built</h3>
            <p className="text-foreground/50 mt-3 max-w-xl">Every product in the SZL ecosystem was designed, engineered, and shipped by my team. These aren't mockups — they're live, operational systems.</p>
          </div>
          
          <div className="flex bg-background rounded-full p-1 border border-white/5">
            {["all", "active", "completed", "on-hold"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                  filter === status 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-foreground/40 hover:text-foreground"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-72 rounded-2xl bg-card/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                whileHover={{ y: -6, scale: 1.01 }}
                className="group relative overflow-hidden rounded-2xl glass-panel flex flex-col justify-end p-8 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 min-h-[280px]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-transparent z-0 transition-opacity duration-700 opacity-0 group-hover:opacity-100" />
                
                <div className="relative z-20">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      project.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      project.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {project.status === 'active' ? 'Live' : project.status}
                    </span>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-primary hover:text-background flex items-center justify-center transition-colors text-foreground/40">
                        <Github size={14} />
                      </button>
                      <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-primary hover:text-background flex items-center justify-center transition-colors text-foreground/40">
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-2xl font-serif font-bold text-foreground mb-3 group-hover:text-primary transition-colors">{project.name}</h4>
                  <p className="text-foreground/40 text-sm leading-relaxed line-clamp-3">{project.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
