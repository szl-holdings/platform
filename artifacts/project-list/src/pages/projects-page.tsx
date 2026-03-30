import { useListProjects, Project } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ExternalLink, Loader2, ArrowRight, Search, Grid3X3, List } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";
import { usePageMeta } from "@/hooks/usePageMeta";

const projectAppUrls: Record<string, string> = {
  "Vessels Maritime Intelligence": "/vessels/",
  "Firestorm Security Operations": "/firestorm/",
  "Lyte Command Center": "/lyte-command-center/",
  "Dreamscape Creative Engine": "/alloy/",
  "Alloy Predictive Intelligence": "/alloy/",
  "Alloy": "/alloy/",
  "AlloyScape": "/alloy/",
  "Readiness Report": "/readiness-report/",
  "Aegis": "/readiness-report/",
  "Admin Control Plane": "/admin/",
  "Service Integration Layer": "/admin/",
  "Stephen L. Portfolio": "/stephen/",
  "Terra Real Estate Intelligence": "/terra/",
  "Beacon": "/terra/",
  "MSP Command Center": "/msp/",
  "Rosie": "/msp/",
  "Evolve MSP Command Center": "/msp/",
  "INCA AI Research Command Center": "/inca/",
  "INCA AI Research": "/inca/",
  "INCA": "/inca/",
  "SZL Holdings": "/szl-holdings/",
  "Carlota Jo Consulting": "/carlota-jo/",
};

const projectCategories: Record<string, string> = {
  "Vessels Maritime Intelligence": "Intelligence",
  "Firestorm Security Operations": "Security",
  "Lyte Command Center": "Platform",
  "Dreamscape Creative Engine": "Creative",
  "Readiness Report": "Analytics",
  "Admin Control Plane": "Admin",
  "Service Integration Layer": "Platform",
  "Stephen L. Portfolio": "Portfolio",
  "Terra Real Estate Intelligence": "Intelligence",
  "MSP Command Center": "Platform",
  "Evolve MSP Command Center": "Platform",
  "INCA AI Research Command Center": "Research",
  "INCA AI Research": "Research",
  "INCA": "Research",
  "SZL Holdings": "Holdings",
  "Carlota Jo Consulting": "Consulting",
};

const projectIcons: Record<string, string> = {
  "Vessels Maritime Intelligence": "⚓",
  "Firestorm Security Operations": "🛡️",
  "Lyte Command Center": "⚡",
  "Dreamscape Creative Engine": "✨",
  "Readiness Report": "📊",
  "Admin Control Plane": "⚙️",
  "Terra Real Estate Intelligence": "🏢",
  "MSP Command Center": "🖥️",
  "Evolve MSP Command Center": "🖥️",
  "INCA AI Research Command Center": "🧠",
  "INCA AI Research": "🧠",
  "INCA": "🧠",
  "SZL Holdings": "🏛️",
  "Carlota Jo Consulting": "💼",
  "Stephen L. Portfolio": "👤",
};

const categoryColors: Record<string, string> = {
  "Intelligence": "bg-blue-500/10 text-blue-400",
  "Security": "bg-red-500/10 text-red-400",
  "Platform": "bg-violet-500/10 text-violet-400",
  "Creative": "bg-pink-500/10 text-pink-400",
  "Analytics": "bg-emerald-500/10 text-emerald-400",
  "Admin": "bg-zinc-500/10 text-zinc-400",
  "Portfolio": "bg-amber-500/10 text-amber-400",
  "Research": "bg-cyan-500/10 text-cyan-400",
  "Holdings": "bg-indigo-500/10 text-indigo-400",
  "Consulting": "bg-teal-500/10 text-teal-400",
};

const statusDots: Record<string, string> = {
  active: "bg-emerald-400",
  completed: "bg-blue-400",
  "on-hold": "bg-amber-400",
  archived: "bg-zinc-500",
};

const HIDDEN_FROM_PUBLIC = new Set([
  "Firestorm Security Operations",
  "INCA AI Research Command Center",
  "INCA AI Research",
  "INCA",
  "MSP Command Center",
  "Rosie",
  "Evolve MSP Command Center",
  "Dreamscape Creative Engine",
  "Terra Real Estate Intelligence",
  "Beacon",
  "Readiness Report",
  "Aegis",
  "Admin Control Plane",
  "Service Integration Layer",
]);

const ALL_CATEGORIES = "All";

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const appUrl = projectAppUrls[project.name];
  const category = projectCategories[project.name] || "App";
  const icon = projectIcons[project.name] || "📦";
  const statusDot = statusDots[project.status] || "bg-zinc-500";
  const catColor = categoryColors[category] || "bg-zinc-500/10 text-zinc-400";

  const Wrapper = appUrl
    ? ({ children }: { children: React.ReactNode }) => (
        <a href={appUrl} target="_blank" rel="noopener noreferrer" className="group block">
          {children}
        </a>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <div className="group block">{children}</div>
      );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <Wrapper>
        <div className={cn(
          "flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-card/30 transition-all duration-200",
          appUrl
            ? "hover:border-border hover:bg-card/60 hover:shadow-sm cursor-pointer"
            : "cursor-default"
        )}>
          <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-lg shrink-0 mt-0.5">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-200">
                    {project.name}
                  </h3>
                  <span className={cn("shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-md", catColor)}>
                    {category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {project.description || "A platform built for real-world scale."}
                </p>
              </div>
              {appUrl && (
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary shrink-0 transition-colors duration-200 mt-0.5" />
              )}
            </div>
          </div>
        </div>
      </Wrapper>
    </motion.div>
  );
}

function ProjectCardLarge({ project, index }: { project: Project; index: number }) {
  const appUrl = projectAppUrls[project.name];
  const category = projectCategories[project.name] || "App";
  const icon = projectIcons[project.name] || "📦";
  const statusDot = statusDots[project.status] || "bg-zinc-500";
  const catColor = categoryColors[category] || "bg-zinc-500/10 text-zinc-400";

  const Wrapper = appUrl
    ? ({ children }: { children: React.ReactNode }) => (
        <a href={appUrl} target="_blank" rel="noopener noreferrer" className="group block h-full">
          {children}
        </a>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <div className="group block h-full">{children}</div>
      );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="h-full"
    >
      <Wrapper>
        <div className={cn(
          "flex flex-col gap-3 p-5 rounded-xl border border-border/60 bg-card/30 transition-all duration-200 h-full",
          appUrl
            ? "hover:border-border hover:bg-card/60 hover:shadow-sm cursor-pointer"
            : "cursor-default"
        )}>
          <div className="flex items-start justify-between gap-2">
            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-xl shrink-0">
              {icon}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusDot)} />
              {appUrl && (
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors duration-200" />
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-200 mb-1">
              {project.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {project.description || "A platform built for real-world scale."}
            </p>
          </div>
          <div className="mt-auto">
            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-md", catColor)}>
              {category}
            </span>
          </div>
        </div>
      </Wrapper>
    </motion.div>
  );
}

export default function ProjectsPage() {
  usePageMeta({
    title: "SZL Holdings | Project Portfolio",
    description: "Browse the full SZL Holdings project portfolio. Enterprise-grade applications across AI/ML, cybersecurity, maritime intelligence, real estate analytics, and creative technology.",
    canonical: "https://szlholdings.com/projects",
  });
  const { data: projects, isLoading, isError } = useListProjects();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const allCategories = projects
    ? [ALL_CATEGORIES, ...Array.from(new Set(projects.map(p => projectCategories[p.name] || "App"))).slice(0, 3)]
    : [ALL_CATEGORIES];

  const filtered = projects?.filter(p => {
    if (HIDDEN_FROM_PUBLIC.has(p.name)) return false;
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === ALL_CATEGORIES || (projectCategories[p.name] || "App") === activeCategory;
    return matchesSearch && matchesCategory;
  }) ?? [];

  const activeCount = projects?.filter(p => p.status === "active" && !HIDDEN_FROM_PUBLIC.has(p.name)).length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">S</span>
            </div>
            <span className="font-display font-semibold text-sm text-foreground">SZL Projects</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {activeCount} active
            </span>
            <div className="flex items-center gap-0.5 border border-border/60 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("p-1.5 rounded-md transition-colors", viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
                aria-label="Grid view"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("p-1.5 rounded-md transition-colors", viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
                aria-label="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-1">
            App Directory
          </h1>
          <p className="text-sm text-muted-foreground">
            Live products across the SZL Holdings portfolio.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6 flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border/60 bg-card/50 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {allCategories.slice(0, 6).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "border border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-3" />
            <span className="text-sm">Loading projects...</span>
          </div>
        ) : isError ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">Unable to load projects. Please try again later.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">No projects found{search ? ` for "${search}"` : ""}.</p>
            {(search || activeCategory !== ALL_CATEGORIES) && (
              <button
                onClick={() => { setSearch(""); setActiveCategory(ALL_CATEGORIES); }}
                className="mt-3 text-xs text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory + search}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            >
              {filtered.map((project, i) => (
                <ProjectCardLarge key={project.id} project={project} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory + search + "list"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-2"
            >
              {filtered.map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {filtered.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-xs text-muted-foreground text-center"
          >
            {filtered.length} {filtered.length === 1 ? "project" : "projects"}
            {activeCategory !== ALL_CATEGORIES ? ` in ${activeCategory}` : ""}
            {search ? ` matching "${search}"` : ""}
          </motion.p>
        )}
      </main>
    </div>
  );
}
