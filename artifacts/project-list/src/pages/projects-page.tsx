import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListProjects, 
  useCreateProject, 
  useUpdateProject, 
  useDeleteProject,
  getListProjectsQueryKey,
  Project
} from "@workspace/api-client-react";
import { Button } from "@/components/shared";
import { ProjectCard } from "@/components/project-card";
import { ProjectFormModal, DeleteConfirmModal } from "@/components/project-modals";
import { Plus, FolderKanban, Loader2, Briefcase, CheckCircle2, PauseCircle, Archive, TrendingUp, Mail, Linkedin, Globe, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type FilterStatus = "all" | "active" | "completed" | "on-hold" | "archived";

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const { data: projects, isLoading, isError } = useListProjects();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const createMutation = useCreateProject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        setIsFormOpen(false);
      }
    }
  });

  const updateMutation = useUpdateProject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        setIsFormOpen(false);
        setSelectedProject(null);
      }
    }
  });

  const deleteMutation = useDeleteProject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        setIsDeleteOpen(false);
        setSelectedProject(null);
      }
    }
  });

  const stats = useMemo(() => {
    if (!projects) return { total: 0, active: 0, completed: 0, onHold: 0, archived: 0 };
    return {
      total: projects.length,
      active: projects.filter(p => p.status === "active").length,
      completed: projects.filter(p => p.status === "completed").length,
      onHold: projects.filter(p => p.status === "on-hold").length,
      archived: projects.filter(p => p.status === "archived").length,
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (activeFilter === "all") return projects;
    return projects.filter(p => p.status === activeFilter);
  }, [projects, activeFilter]);

  const handleOpenCreate = () => { setSelectedProject(null); setIsFormOpen(true); };
  const handleOpenEdit = (project: Project) => { setSelectedProject(project); setIsFormOpen(true); };
  const handleOpenDelete = (project: Project) => { setSelectedProject(project); setIsDeleteOpen(true); };
  const handleFormSubmit = (data: any) => {
    if (selectedProject) {
      updateMutation.mutate({ id: selectedProject.id, data });
    } else {
      createMutation.mutate({ data });
    }
  };
  const handleDeleteConfirm = () => {
    if (selectedProject) deleteMutation.mutate({ id: selectedProject.id });
  };

  const filterTabs: { label: string; value: FilterStatus; count: number }[] = [
    { label: "All", value: "all", count: stats.total },
    { label: "Active", value: "active", count: stats.active },
    { label: "Completed", value: "completed", count: stats.completed },
    { label: "On Hold", value: "on-hold", count: stats.onHold },
    { label: "Archived", value: "archived", count: stats.archived },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/10 border-b border-border/40">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-2xl font-display font-bold text-primary">SL</span>
                  </div>
                  <div className="h-8 w-px bg-border/60" />
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Consulting Portfolio</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-3">
                  Stephen L
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                  Full-stack consulting &amp; development. Turning ideas into polished, production-ready products — from architecture to launch.
                </p>
                <div className="flex items-center gap-4 mt-6">
                  <a href="mailto:contact@stephenl.dev" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="w-4 h-4" />
                    <span className="hidden sm:inline">contact@stephenl.dev</span>
                  </a>
                  <a href="#" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    <Linkedin className="w-4 h-4" />
                    <span className="hidden sm:inline">LinkedIn</span>
                  </a>
                  <a href="#" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline">stephenl.dev</span>
                  </a>
                </div>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button onClick={handleOpenCreate} size="lg" className="gap-2 shadow-lg shadow-primary/20">
                <Plus className="w-5 h-5" />
                New Project
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            { label: "Active Projects", value: stats.active, icon: Briefcase, color: "text-blue-600 bg-blue-50 border-blue-100", accent: "text-blue-600" },
            { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-100", accent: "text-emerald-600" },
            { label: "On Hold", value: stats.onHold, icon: PauseCircle, color: "text-amber-600 bg-amber-50 border-amber-100", accent: "text-amber-600" },
            { label: "Total Delivered", value: stats.total, icon: TrendingUp, color: "text-violet-600 bg-violet-50 border-violet-100", accent: "text-violet-600" },
          ].map((stat, i) => (
            <div key={stat.label} className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", stat.color)}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <p className={cn("text-3xl font-display font-bold", stat.accent)}>{stat.value}</p>
              <p className="text-sm text-muted-foreground font-medium mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Project Portfolio</h2>
            <p className="text-muted-foreground text-sm mt-1">All consulting &amp; development work</p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border/50">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveFilter(tab.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  activeFilter === tab.value
                    ? "bg-card text-foreground shadow-sm border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                <span className={cn(
                  "ml-1.5 text-xs",
                  activeFilter === tab.value ? "text-primary" : "text-muted-foreground/60"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="font-medium">Loading your projects...</p>
          </div>
        ) : isError ? (
          <div className="bg-destructive/10 border-2 border-destructive/20 text-destructive rounded-2xl p-6 text-center max-w-md mx-auto">
            <p className="font-semibold text-lg mb-2">Failed to load projects</p>
            <p className="text-sm opacity-90">Please check your connection and try again.</p>
          </div>
        ) : filteredProjects.length > 0 ? (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center max-w-lg mx-auto mt-12 p-8"
          >
            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
              <FolderKanban className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-3 text-foreground">
              {activeFilter === "all" ? "No projects yet" : `No ${activeFilter} projects`}
            </h2>
            <p className="text-muted-foreground text-base mb-8">
              {activeFilter === "all" 
                ? "Get started by creating your first project."
                : "Try selecting a different filter or create a new project."}
            </p>
            {activeFilter === "all" && (
              <Button size="lg" onClick={handleOpenCreate} className="gap-2">
                <Plus className="w-5 h-5" />
                Create First Project
              </Button>
            )}
          </motion.div>
        )}
      </main>

      <footer className="border-t border-border/40 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-display font-bold text-primary">SL</span>
              </div>
              <span className="text-sm text-muted-foreground">Stephen L — Consulting &amp; Development</span>
            </div>
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Stephen L. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <ProjectFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
        project={selectedProject}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
        projectName={selectedProject?.name}
      />
    </div>
  );
}
