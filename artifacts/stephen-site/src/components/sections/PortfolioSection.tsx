import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Github } from "lucide-react";
import { useListProjects } from "@workspace/api-client-react";

export function PortfolioSection() {
  const { data: projects, isLoading } = useListProjects();
  const [filter, setFilter] = useState<string>("all");

  const fallbackProjects = [
    { id: 1, name: "Vessels App", description: "Universal integration platform.", status: "active" },
    { id: 2, name: "Firestorm", description: "Real-time data analytics engine.", status: "completed" },
    { id: 3, name: "Lyte UI", description: "Next-gen design system.", status: "active" },
    { id: 4, name: "Dreamscape", description: "AI-driven virtual environments.", status: "on-hold" },
  ];

  const displayProjects = projects?.length ? projects : fallbackProjects;
  
  const filteredProjects = filter === "all" 
    ? displayProjects 
    : displayProjects.filter(p => p.status === filter);

  return (
    <section id="portfolio" className="py-24 bg-secondary/20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">Selected Work</h2>
            <h3 className="text-4xl font-serif font-bold text-foreground">Portfolio Showcase</h3>
          </div>
          
          <div className="flex bg-background rounded-full p-1 border border-border">
            {["all", "active", "completed", "on-hold"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                  filter === status 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-80 rounded-2xl bg-card/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="group relative overflow-hidden rounded-2xl glass-panel aspect-[4/3] flex flex-col justify-end p-8"
              >
                {/* Abstract placeholder background per project */}
                <div className="absolute inset-0 bg-gradient-to-br from-secondary via-background to-card z-0 transition-transform duration-700 group-hover:scale-105" />
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />

                <div className="relative z-20 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      project.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                      project.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {project.status}
                    </span>
                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-primary hover:text-background flex items-center justify-center backdrop-blur-md transition-colors text-white">
                        <Github size={18} />
                      </button>
                      <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-primary hover:text-background flex items-center justify-center backdrop-blur-md transition-colors text-white">
                        <ExternalLink size={18} />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-3xl font-serif font-bold text-white mb-2">{project.name}</h4>
                  <p className="text-white/70 line-clamp-2">{project.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
