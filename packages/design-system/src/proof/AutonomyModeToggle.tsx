import { Eye, Lightbulb, FileEdit, MessageSquare, Zap } from "lucide-react";
import React from "react";
import { cn } from "../utils.js";
import { color } from "../tokens/index.js";

export type AutonomyMode =
  | "observe"
  | "recommend"
  | "draft"
  | "ask-to-act"
  | "approved-act";

export interface AutonomyModeToggleProps {
  value: AutonomyMode;
  onChange?: (mode: AutonomyMode) => void;
  readOnly?: boolean;
  className?: string;
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
    color: color.text.muted,
  },
  {
    id: "recommend",
    label: "Recommend",
    short: "REC",
    icon: <Lightbulb className="h-3.5 w-3.5" />,
    description: "Surfaces recommendations, requires human action",
    color: color.text.secondary,
  },
  {
    id: "draft",
    label: "Draft",
    short: "DFT",
    icon: <FileEdit className="h-3.5 w-3.5" />,
    description: "Prepares drafts for human review before send",
    color: color.accent.blue,
  },
  {
    id: "ask-to-act",
    label: "Ask to Act",
    short: "ASK",
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    description: "Requests approval before every consequential action",
    color: color.accent.amber,
  },
  {
    id: "approved-act",
    label: "Approved Act",
    short: "ACT",
    icon: <Zap className="h-3.5 w-3.5" />,
    description: "Executes within policy without per-action approval",
    color: color.accent.green,
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
      className={cn("inline-flex rounded-lg p-0.5 gap-0.5", className)}
      style={{ border: `1px solid ${color.border.subtle}`, background: color.bg.surface }}
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
              "text-xs font-medium focus:outline-none",
              readOnly && !active && "cursor-default opacity-40",
              !readOnly && !active && "cursor-pointer",
            )}
            style={
              active
                ? { backgroundColor: mode.color, color: color.text.inverse }
                : { color: color.text.muted, background: "transparent" }
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
