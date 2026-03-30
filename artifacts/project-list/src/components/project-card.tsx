import { Project } from "@workspace/api-client-react";
import { cn, formatDate } from "@workspace/shared-ui/utils";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Calendar, Clock, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

const statusColors = {
  active: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  "on-hold": "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  archived: "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-400 dark:border-zinc-700",
};

const statusLabels = {
  active: "Active",
  completed: "Completed",
  "on-hold": "On Hold",
  archived: "Archived",
};

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col bg-card rounded-2xl border border-border/60 p-6 shadow-sm shadow-black/5 hover:shadow-xl hover:shadow-black/5 hover:border-border transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-4 gap-4">
        <div className={cn(
          "px-3 py-1 text-xs font-semibold rounded-full border",
          statusColors[project.status]
        )}>
          {statusLabels[project.status]}
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 -mr-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          <AnimatePresence>
            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsMenuOpen(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-card rounded-xl border border-border shadow-lg overflow-hidden z-20 py-1"
                >
                  <button
                    onClick={() => { setIsMenuOpen(false); onEdit(project); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <Edit2 className="w-4 h-4 text-primary" />
                    Edit Project
                  </button>
                  <button
                    onClick={() => { setIsMenuOpen(false); onDelete(project); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors text-left"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Project
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <h3 className="text-xl font-display font-bold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
        {project.name}
      </h3>
      
      <p className="text-muted-foreground text-sm line-clamp-2 mb-6 flex-grow">
        {project.description || "No description provided."}
      </p>

      <div className="mt-auto pt-4 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          Created {formatDate(project.createdAt)}
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
        </div>
      </div>
    </motion.div>
  );
}
