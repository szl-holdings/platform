import { useState } from "react";
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
import { Plus, FolderKanban, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const { data: projects, isLoading, isError } = useListProjects();
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Mutations
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

  // Handlers
  const handleOpenCreate = () => {
    setSelectedProject(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setSelectedProject(project);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = (data: any) => {
    if (selectedProject) {
      updateMutation.mutate({ id: selectedProject.id, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedProject) {
      deleteMutation.mutate({ id: selectedProject.id });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <FolderKanban className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">Projects</h1>
          </div>
          <Button onClick={handleOpenCreate} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Project</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
        ) : projects && projects.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {projects.map((project) => (
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
            <img 
              src={`${import.meta.env.BASE_URL}images/empty-state.png`} 
              alt="No projects found" 
              className="w-64 h-64 object-contain mb-8 opacity-90 drop-shadow-xl"
            />
            <h2 className="text-3xl font-display font-bold mb-3 text-foreground">No projects yet</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Get started by creating your first project. Keep track of your tasks, milestones, and progress all in one place.
            </p>
            <Button size="lg" onClick={handleOpenCreate} className="gap-2">
              <Plus className="w-5 h-5" />
              Create First Project
            </Button>
          </motion.div>
        )}
      </main>

      {/* Modals */}
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
