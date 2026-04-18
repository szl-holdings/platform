import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "../utils";

export type PolicyState = "allowed" | "requires-approval" | "blocked";

export interface PolicyStateChipProps {
  state: PolicyState;
  reason?: string;
  className?: string;
  /** compact = icon + label only, full = with reason tooltip badge */
  variant?: "compact" | "full";
}

const config: Record<
  PolicyState,
  { label: string; icon: React.ReactNode; styles: string }
> = {
  allowed: {
    label: "Allowed",
    icon: <CheckCircle2 className="h-3 w-3" />,
    styles: "border-[#00e878]/30 text-[#00e878] bg-[#00e878]/8",
  },
  "requires-approval": {
    label: "Requires Approval",
    icon: <Clock className="h-3 w-3" />,
    styles: "border-[#ffb700]/30 text-[#ffb700] bg-[#ffb700]/8",
  },
  blocked: {
    label: "Blocked",
    icon: <XCircle className="h-3 w-3" />,
    styles: "border-[#ff4455]/30 text-[#ff4455] bg-[#ff4455]/8",
  },
};

export function PolicyStateChip({ state, reason, className, variant = "compact" }: PolicyStateChipProps) {
  const { label, icon, styles } = config[state];

  return (
    <span
      title={reason}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        styles,
        className
      )}
    >
      {icon}
      {label}
      {variant === "full" && reason && (
        <span className="ml-1 rounded bg-black/20 px-1 text-[10px] opacity-70">
          {reason}
        </span>
      )}
    </span>
  );
}
