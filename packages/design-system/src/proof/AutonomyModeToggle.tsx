import { Eye, Lightbulb, FileEdit, MessageSquare, Zap } from "lucide-react";
import { cn } from "../utils";

export type AutonomyMode =
  | "observe"
  | "recommend"
  | "draft"
  | "ask-to-act"
  | "approved-act";

export interface AutonomyModeToggleProps {
  value: AutonomyMode;
  onChange?: (mode: AutonomyMode) => void;
  /** When true, all modes are disabled (display-only) */
  readOnly?: boolean;
  className?: string;
  /** compact = icon tabs only, full = with labels */
  variant?: "compact" | "full";
}

const modes: Array<{
  id: AutonomyMode;
  label: string;
  short: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}> = [
  {
    id: "observe",
    label: "Observe",
    short: "OBS",
    icon: <Eye className="h-3.5 w-3.5" />,
    description: "Monitors and logs — no output",
    color: "#4a6070",
  },
  {
    id: "recommend",
    label: "Recommend",
    short: "REC",
    icon: <Lightbulb className="h-3.5 w-3.5" />,
    description: "Surfaces recommendations, requires human action",
    color: "#7a99b8",
  },
  {
    id: "draft",
    label: "Draft",
    short: "DFT",
    icon: <FileEdit className="h-3.5 w-3.5" />,
    description: "Prepares drafts for human review before send",
    color: "#00d4ff",
  },
  {
    id: "ask-to-act",
    label: "Ask to Act",
    short: "ASK",
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    description: "Requests approval before every consequential action",
    color: "#ffb700",
  },
  {
    id: "approved-act",
    label: "Approved Act",
    short: "ACT",
    icon: <Zap className="h-3.5 w-3.5" />,
    description: "Executes within policy without per-action approval",
    color: "#00e878",
  },
];

export function AutonomyModeToggle({
  value,
  onChange,
  readOnly = false,
  className,
  variant = "full",
}: AutonomyModeToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Autonomy mode"
      className={cn(
        "inline-flex rounded-lg border border-[#1a2535] bg-[#0d1520] p-0.5 gap-0.5",
        className
      )}
    >
      {modes.map((mode) => {
        const active = mode.id === value;
        return (
          <button
            key={mode.id}
            role="radio"
            aria-checked={active}
            aria-label={`${mode.label}: ${mode.description}`}
            title={`${mode.label} — ${mode.description}`}
            disabled={readOnly && !active}
            onClick={() => !readOnly && onChange?.(mode.id)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-all duration-150",
              "text-[11px] font-medium focus:outline-none focus-visible:ring-1 focus-visible:ring-[#00d4ff]/60",
              active
                ? "text-[#060b12] shadow-sm"
                : "text-[#4a6070] hover:text-[#c8d8e8]",
              readOnly && !active && "cursor-default opacity-40",
              !readOnly && !active && "cursor-pointer"
            )}
            style={
              active
                ? { backgroundColor: mode.color, color: "#060b12" }
                : {}
            }
          >
            {mode.icon}
            {variant === "full" && <span>{mode.label}</span>}
            {variant === "compact" && <span className="sr-only">{mode.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
