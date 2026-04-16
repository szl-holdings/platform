import * as React from "react";
import { X, ChevronRight, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "../utils";

export interface ActivationStep {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  href?: string;
  action?: () => void;
}

export interface ActivationBannerProps {
  steps: ActivationStep[];
  title?: string;
  accentColor?: string;
  onDismiss?: () => void;
  onNavigate?: (href: string) => void;
  storageKey?: string;
  className?: string;
  variant?: "banner" | "card";
}

export function ActivationBanner({
  steps,
  title = "Complete your setup",
  accentColor = "#8b7ac8",
  onDismiss,
  onNavigate,
  storageKey = "activation_banner",
  className,
  variant = "banner",
}: ActivationBannerProps) {
  const [dismissed, setDismissed] = React.useState(() => {
    try {
      return localStorage.getItem(`szl_${storageKey}_dismissed`) === "true";
    } catch {
      return false;
    }
  });

  const pending = steps.filter((s) => !s.completed);
  const nextStep = pending[0];
  const completedCount = steps.length - pending.length;
  const progress = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  const handleDismiss = React.useCallback(() => {
    try {
      localStorage.setItem(`szl_${storageKey}_dismissed`, "true");
    } catch {}
    setDismissed(true);
    onDismiss?.();
  }, [storageKey, onDismiss]);

  const handleNavigate = React.useCallback(
    (step: ActivationStep) => {
      step.action?.();
      if (step.href) {
        if (onNavigate) {
          onNavigate(step.href);
        } else {
          window.location.href = step.href;
        }
      }
    },
    [onNavigate],
  );

  if (dismissed || pending.length === 0) return null;

  if (variant === "card") {
    return (
      <div
        className={cn(
          "w-72 rounded-2xl border border-border bg-card p-4 shadow-sm",
          className
        )}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${accentColor}18` }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: accentColor }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">
                {completedCount} of {steps.length} complete
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Dismiss setup banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div
          className="h-1 rounded-full mb-3 overflow-hidden"
          style={{ backgroundColor: `${accentColor}18` }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${accentColor}, ${accentColor}bb)`,
            }}
          />
        </div>

        {nextStep && (
          <button
            onClick={() => handleNavigate(nextStep)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
          >
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">
                {nextStep.label}
              </p>
              {nextStep.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {nextStep.description}
                </p>
              )}
            </div>
            <ChevronRight
              className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0"
            />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-xl border",
        className
      )}
      style={{
        backgroundColor: `${accentColor}08`,
        borderColor: `${accentColor}25`,
      }}
    >
      <Sparkles className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
      <div className="flex-1 min-w-0">
        <span className="text-sm text-foreground font-medium">
          {nextStep?.label}
        </span>
        {nextStep?.description && (
          <span className="text-sm text-muted-foreground ml-2">
            — {nextStep.description}
          </span>
        )}
      </div>
      {nextStep && (
        <button
          onClick={() => handleNavigate(nextStep)}
          className="text-xs font-semibold shrink-0 px-3 py-1.5 rounded-lg transition-all hover:opacity-90 active:scale-[0.98] text-white"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
          }}
        >
          {nextStep.label.startsWith("Connect") ? "Connect" : "Set up"}
        </button>
      )}
      <button
        onClick={handleDismiss}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export interface SetupAlertProps {
  message: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    onNavigate?: (href: string) => void;
  };
  onDismiss?: () => void;
  severity?: "info" | "warning" | "error";
  className?: string;
}

export function SetupAlert({
  message,
  action,
  onDismiss,
  severity = "warning",
  className,
}: SetupAlertProps) {
  const [dismissed, setDismissed] = React.useState(false);
  if (dismissed) return null;

  const colors = {
    info: { bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.25)", icon: "#6366f1" },
    warning: { bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.25)", icon: "#ca8a04" },
    error: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", icon: "#dc2626" },
  }[severity];

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-xl border",
        className
      )}
      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
    >
      <AlertCircle className="w-4 h-4 shrink-0" style={{ color: colors.icon }} />
      <p className="flex-1 text-sm text-foreground">{message}</p>
      {action && (
        <button
          onClick={() => {
            action.onClick?.();
            if (action.href) {
              if (action.onNavigate) {
                action.onNavigate(action.href);
              } else {
                window.location.href = action.href;
              }
            }
          }}
          className="text-xs font-semibold shrink-0 px-2.5 py-1 rounded-lg border border-border hover:bg-muted/50 transition-colors text-foreground"
        >
          {action.label}
        </button>
      )}
      {onDismiss && (
        <button
          onClick={() => {
            setDismissed(true);
            onDismiss();
          }}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
