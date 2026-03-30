import { Project, CreateProject, UpdateProject } from "@workspace/api-client-react";
import { Modal, Input, Textarea, Button } from "./shared";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { cn } from "@workspace/shared-ui/utils";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Name is too long"),
  description: z.string().optional().nullable(),
  status: z.enum(["active", "completed", "on-hold", "archived"]),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isPending: boolean;
  project?: Project | null;
}

export function ProjectFormModal({ isOpen, onClose, onSubmit, isPending, project }: ProjectFormModalProps) {
  const isEditing = !!project;
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "active",
    },
  });

  const currentStatus = watch("status");

  useEffect(() => {
    if (isOpen) {
      if (project) {
        reset({
          name: project.name,
          description: project.description || "",
          status: project.status as any,
        });
      } else {
        reset({
          name: "",
          description: "",
          status: "active",
        });
      }
    }
  }, [isOpen, project, reset]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Project" : "Create New Project"}
      description={isEditing ? "Update your project details below." : "Fill in the details to start a new project."}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Project Name"
          placeholder="e.g. Website Redesign Q3"
          error={errors.name?.message}
          {...register("name")}
        />
        
        <Textarea
          label="Description"
          placeholder="Briefly describe what this project is about..."
          error={errors.description?.message}
          {...register("description")}
        />

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/90 ml-1">Status</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["active", "completed", "on-hold", "archived"] as const).map((status) => (
              <button
                type="button"
                key={status}
                onClick={() => setValue("status", status)}
                className={cn(
                  "px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all capitalize",
                  currentStatus === status 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted"
                )}
              >
                {status.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-border/50">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" isLoading={isPending}>
            {isEditing ? "Save Changes" : "Create Project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  projectName?: string;
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, isPending, projectName }: DeleteConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Project"
    >
      <div className="space-y-6">
        <p className="text-foreground text-base">
          Are you sure you want to delete <span className="font-bold">"{projectName}"</span>? 
          This action cannot be undone and all data associated with this project will be permanently removed.
        </p>
        <div className="flex gap-3 pt-4 border-t border-border/50">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Keep Project
          </Button>
          <Button type="button" variant="destructive" className="flex-1" onClick={onConfirm} isLoading={isPending}>
            Yes, Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
