import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import * as React from 'react';
import { cn } from '../utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export interface OnboardingChecklistItem {
  id: string;
  label: string;
  description?: string;
  href?: string;
  completed?: boolean;
}

export interface OnboardingConfig {
  appId: string;
  appName: string;
  accentColor?: string;
  steps: OnboardingStep[];
  checklist?: OnboardingChecklistItem[];
}

// ─── Persistence ──────────────────────────────────────────────────────────────

function getOnboardingKey(appId: string) {
  return `szl_onboarding_${appId}`;
}

function getChecklistKey(appId: string) {
  return `szl_checklist_${appId}`;
}

export function useOnboardingState(appId: string) {
  const key = getOnboardingKey(appId);

  const [state, setState] = React.useState<{
    completed: boolean;
    currentStep: number;
    active: boolean;
  }>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        const completed = parsed.completed ?? false;
        return { completed, currentStep: 0, active: !completed };
      }
    } catch {}
    // First-time visitor (whether demo or signed-in) — start the guided tour.
    return { completed: false, currentStep: 0, active: true };
  });

  const markCompleted = React.useCallback(() => {
    try {
      localStorage.setItem(key, JSON.stringify({ completed: true }));
    } catch {}
    setState((s) => ({ ...s, completed: true, active: false }));
  }, [key]);

  const replay = React.useCallback(() => {
    try {
      localStorage.setItem(key, JSON.stringify({ completed: false }));
    } catch {}
    setState({ completed: false, currentStep: 0, active: true });
  }, [key]);

  const dismiss = React.useCallback(() => {
    try {
      localStorage.setItem(key, JSON.stringify({ completed: true }));
    } catch {}
    setState((s) => ({ ...s, completed: true, active: false }));
  }, [key]);

  const setStep = React.useCallback((step: number) => {
    setState((s) => ({ ...s, currentStep: step }));
  }, []);

  return { ...state, markCompleted, replay, dismiss, setStep };
}

export function useChecklistState(appId: string, initialItems: OnboardingChecklistItem[]) {
  const key = getChecklistKey(appId);

  const [completedIds, setCompletedIds] = React.useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  const toggleItem = React.useCallback(
    (id: string) => {
      setCompletedIds((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [key],
  );

  const items = initialItems.map((item) => ({
    ...item,
    completed: item.completed ?? completedIds.includes(item.id),
  }));

  const completedCount = items.filter((i) => i.completed).length;
  const allCompleted = completedCount === items.length;

  return { items, completedIds, toggleItem, completedCount, allCompleted };
}

// ─── Spotlight Overlay ────────────────────────────────────────────────────────

function SpotlightOverlay({
  targetSelector,
  children,
}: {
  targetSelector?: string;
  children: React.ReactNode;
}) {
  const [rect, setRect] = React.useState<DOMRect | null>(null);

  React.useEffect(() => {
    if (!targetSelector) {
      setRect(null);
      return;
    }
    const el = document.querySelector(targetSelector);
    if (el) {
      const r = el.getBoundingClientRect();
      setRect(r);
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      setRect(null);
    }
  }, [targetSelector]);

  return (
    <div className="fixed inset-0 z-[9998]" aria-hidden="true">
      {rect ? (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ mixBlendMode: 'multiply' }}
        >
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={rect.left - 6}
                y={rect.top - 6}
                width={rect.width + 12}
                height={rect.height + 12}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#spotlight-mask)" />
        </svg>
      ) : (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      )}
      {children}
    </div>
  );
}

// ─── Step Card Positioning ────────────────────────────────────────────────────

function StepCard({
  step,
  currentIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  accentColor,
}: {
  step: OnboardingStep;
  currentIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  accentColor: string;
}) {
  const [position, setPosition] = React.useState({
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  });
  const cardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!step.targetSelector || step.placement === 'center') {
      setPosition({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
      return;
    }
    const el = document.querySelector(step.targetSelector);
    if (!el) {
      setPosition({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
      return;
    }
    const rect = el.getBoundingClientRect();
    const cardWidth = 320;
    const cardHeight = 220;
    const padding = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top = '50%';
    let left = '50%';
    let transform = 'translate(-50%, -50%)';
    const placement = step.placement || 'bottom';
    if (placement === 'bottom') {
      const t = rect.bottom + padding;
      const l = Math.min(
        Math.max(rect.left + rect.width / 2 - cardWidth / 2, padding),
        vw - cardWidth - padding,
      );
      top = `${t}px`;
      left = `${l}px`;
      transform = 'none';
    } else if (placement === 'top') {
      const t = rect.top - cardHeight - padding;
      const l = Math.min(
        Math.max(rect.left + rect.width / 2 - cardWidth / 2, padding),
        vw - cardWidth - padding,
      );
      top = `${Math.max(t, padding)}px`;
      left = `${l}px`;
      transform = 'none';
    } else if (placement === 'right') {
      const t = Math.min(
        Math.max(rect.top + rect.height / 2 - cardHeight / 2, padding),
        vh - cardHeight - padding,
      );
      const l = rect.right + padding;
      top = `${t}px`;
      left = `${Math.min(l, vw - cardWidth - padding)}px`;
      transform = 'none';
    } else if (placement === 'left') {
      const t = Math.min(
        Math.max(rect.top + rect.height / 2 - cardHeight / 2, padding),
        vh - cardHeight - padding,
      );
      const l = rect.left - cardWidth - padding;
      top = `${t}px`;
      left = `${Math.max(l, padding)}px`;
      transform = 'none';
    }
    setPosition({ top, left, transform });
  }, [step.targetSelector, step.placement]);

  const StepIcon = step.icon;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalSteps - 1;

  return (
    <div
      ref={cardRef}
      className="fixed z-[9999] w-80 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200"
      style={{
        top: position.top,
        left: position.left,
        transform: position.transform,
        boxShadow: `0 0 40px ${accentColor}25, 0 20px 40px rgba(0,0,0,0.5)`,
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <div
        className="h-0.5 w-full"
        style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}60)` }}
      />

      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          {StepIcon && (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${accentColor}18` }}
            >
              <StepIcon className="w-4.5 h-4.5" style={{ color: accentColor }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-foreground leading-tight">{step.title}</h3>
              <button
                onClick={onSkip}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
                aria-label="Skip onboarding"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-foreground/70 mt-1 leading-relaxed">{step.description}</p>
          </div>
        </div>

        {step.action && (
          <div className="mb-3">
            {step.action.href ? (
              <a
                href={step.action.href}
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: accentColor, background: `${accentColor}15` }}
              >
                {step.action.label}
              </a>
            ) : (
              <button
                onClick={step.action.onClick}
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: accentColor, background: `${accentColor}15` }}
              >
                {step.action.label}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === currentIndex ? '16px' : '6px',
                  height: '6px',
                  background: i === currentIndex ? accentColor : `${accentColor}30`,
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={onPrev}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
            <button
              onClick={onNext}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
            >
              {isLast ? 'Finish' : 'Next'} {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Onboarding Wizard ────────────────────────────────────────────────────────

export interface OnboardingWizardProps {
  config: OnboardingConfig;
  onComplete?: () => void;
  onSkip?: (atStep?: number) => void;
}

export function OnboardingWizard({ config, onComplete, onSkip }: OnboardingWizardProps) {
  const { appId, accentColor = '#8b5cf6', steps } = config;
  const { active, currentStep, markCompleted, dismiss, setStep } = useOnboardingState(appId);

  const handleNext = React.useCallback(() => {
    if (currentStep >= steps.length - 1) {
      markCompleted();
      onComplete?.();
    } else {
      setStep(currentStep + 1);
    }
  }, [currentStep, steps.length, markCompleted, setStep, onComplete]);

  const handlePrev = React.useCallback(() => {
    if (currentStep > 0) setStep(currentStep - 1);
  }, [currentStep, setStep]);

  const handleSkip = React.useCallback(() => {
    dismiss();
    onSkip?.(currentStep);
  }, [dismiss, onSkip, currentStep]);

  if (!active || steps.length === 0) return null;

  const step = steps[currentStep]!;

  return (
    <SpotlightOverlay
      {...(step.targetSelector !== undefined ? { targetSelector: step.targetSelector } : {})}
    >
      <StepCard
        step={step}
        currentIndex={currentStep}
        totalSteps={steps.length}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={handleSkip}
        accentColor={accentColor}
      />
    </SpotlightOverlay>
  );
}

// ─── Getting Started Checklist ────────────────────────────────────────────────

export interface GettingStartedChecklistProps {
  appId: string;
  appName: string;
  items: OnboardingChecklistItem[];
  accentColor?: string;
  onReplayTour?: () => void;
  collapsed?: boolean;
}

export function GettingStartedChecklist({
  appId,
  appName,
  items,
  accentColor = '#8b5cf6',
  onReplayTour,
  collapsed: defaultCollapsed = false,
}: GettingStartedChecklistProps) {
  const {
    items: stateItems,
    toggleItem,
    completedCount,
    allCompleted,
  } = useChecklistState(appId, items);
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const [dismissed, setDismissed] = React.useState(() => {
    try {
      return localStorage.getItem(`szl_checklist_dismissed_${appId}`) === 'true';
    } catch {
      return false;
    }
  });

  const handleDismiss = React.useCallback(() => {
    try {
      localStorage.setItem(`szl_checklist_dismissed_${appId}`, 'true');
    } catch {}
    setDismissed(true);
  }, [appId]);

  if (dismissed) return null;

  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all duration-200"
      style={{
        borderColor: `${accentColor}20`,
        background: `linear-gradient(135deg, ${accentColor}06, transparent)`,
      }}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
      >
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
          style={{ background: `${accentColor}18` }}
        >
          {allCompleted ? (
            <Trophy className="w-3.5 h-3.5" style={{ color: accentColor } as any} />
          ) : (
            <Sparkles className="w-3.5 h-3.5" style={{ color: accentColor } as any} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-foreground/80 leading-none">
            Getting Started
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {allCompleted ? 'All done!' : `${completedCount} of ${items.length} complete`}
          </div>
        </div>
        <ChevronRight
          className={cn(
            'w-3.5 h-3.5 text-muted-foreground transition-transform',
            !collapsed && 'rotate-90',
          )}
        />
      </button>

      <div className="px-3 pb-0.5">
        <div
          className="h-0.5 rounded-full overflow-hidden"
          style={{ background: `${accentColor}18` }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: accentColor }}
          />
        </div>
      </div>

      {!collapsed && (
        <div className="px-3 pb-3 pt-2 space-y-1">
          {stateItems.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors text-left group"
            >
              <div className="shrink-0 mt-0.5">
                {item.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: accentColor } as any} />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                )}
              </div>
              <div className="min-w-0">
                <div
                  className={cn(
                    'text-[11px] font-medium leading-tight',
                    item.completed ? 'line-through text-muted-foreground/50' : 'text-foreground/80',
                  )}
                >
                  {item.label}
                </div>
                {item.description && !item.completed && (
                  <div className="text-[10px] text-muted-foreground/60 mt-0.5 leading-tight">
                    {item.description}
                  </div>
                )}
              </div>
            </button>
          ))}

          {allCompleted && (
            <div
              className="flex items-center gap-2 px-2 py-2 rounded-lg mt-1"
              style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}20` }}
            >
              <Trophy className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor } as any} />
              <span className="text-[11px] font-semibold" style={{ color: accentColor }}>
                You're all set!
              </span>
            </div>
          )}

          <div className="flex items-center gap-1 pt-1">
            {onReplayTour && (
              <button
                onClick={onReplayTour}
                className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors px-1"
              >
                <RotateCcw className="w-3 h-3" /> Replay tour
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="ml-auto text-[10px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Onboarding Trigger Button ────────────────────────────────────────────────

export function OnboardingReplayButton({
  onClick,
  accentColor = '#8b5cf6',
}: {
  onClick: () => void;
  accentColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors border border-border/50"
    >
      <RotateCcw className="w-3.5 h-3.5" />
      Replay Tour
    </button>
  );
}
