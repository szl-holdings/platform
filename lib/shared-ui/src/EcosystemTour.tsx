import * as React from "react";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { cn } from "./utils";

export interface TourStep {
  id: string;
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  accentColor?: string;
  tip?: string;
}

export interface EcosystemTourProps {
  steps: TourStep[];
  onComplete?: () => void;
  onDismiss?: () => void;
  storageKey?: string;
}

function useTourState(storageKey: string) {
  const key = `szl_tour_dismissed_${storageKey}`;
  const [dismissed, setDismissed] = React.useState(() => {
    try {
      return localStorage.getItem(key) === "true";
    } catch {
      return false;
    }
  });

  const dismiss = React.useCallback(() => {
    try {
      localStorage.setItem(key, "true");
    } catch {}
    setDismissed(true);
  }, [key]);

  return { dismissed, dismiss };
}

export function EcosystemTour({
  steps,
  onComplete,
  onDismiss,
  storageKey = "ecosystem",
}: EcosystemTourProps) {
  const { dismissed, dismiss } = useTourState(storageKey);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (!dismissed) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [dismissed]);

  const handleDismiss = React.useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      dismiss();
      onDismiss?.();
    }, 200);
  }, [dismiss, onDismiss]);

  const handleComplete = React.useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      dismiss();
      onComplete?.();
    }, 200);
  }, [dismiss, onComplete]);

  const handleNext = React.useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length, handleComplete]);

  const handlePrev = React.useCallback(() => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  }, [currentStep]);

  if (dismissed || !visible) return null;

  const step = steps[currentStep];
  const Icon = step.icon;
  const accentColor = step.accentColor || "#8b7ac8";
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 pointer-events-none">
      <div
        className={cn(
          "pointer-events-auto w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden transition-all duration-300",
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
        style={{ boxShadow: `0 0 40px ${accentColor}15, 0 20px 40px rgba(0,0,0,0.4)` }}
      >
        <div
          className="h-0.5 transition-all duration-300"
          style={{
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}60)`,
            width: `${((currentStep + 1) / steps.length) * 100}%`,
          }}
        />

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                {Icon ? (
                  (Icon as any)({ className: "w-3.5 h-3.5", style: { color: accentColor } })
                ) : (
                  (Sparkles as any)({ className: "w-3.5 h-3.5", style: { color: accentColor } })
                )}
              </div>
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            <button
              onClick={handleDismiss}
              aria-label="Close tour"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <h3 className="text-base font-display font-bold text-foreground mb-1.5">{step.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>

          {step.tip && (
            <div
              className="mt-3 px-3 py-2 rounded-lg text-xs border"
              style={{
                backgroundColor: `${accentColor}08`,
                borderColor: `${accentColor}20`,
                color: accentColor,
              }}
            >
              <span className="font-semibold">Tip: </span>{step.tip}
            </div>
          )}

          <div className="flex items-center justify-between mt-5">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className="transition-all rounded-full"
                  style={{
                    width: i === currentStep ? "16px" : "6px",
                    height: "6px",
                    backgroundColor: i === currentStep ? accentColor : `${accentColor}30`,
                  }}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1 py-2 px-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
              >
                {isLast ? "Finish" : "Next"} {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { useTourState };
