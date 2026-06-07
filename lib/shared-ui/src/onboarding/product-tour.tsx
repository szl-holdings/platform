import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import * as React from 'react';
import { cn } from '../utils';

export interface ProductTourStep {
  id: string;
  target?: string;
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  accentColor?: string;
  tip?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export interface ProductTourProps {
  tourId: string;
  steps: ProductTourStep[];
  onComplete?: () => void;
  onDismiss?: () => void;
  onStepChange?: (stepIndex: number, step: ProductTourStep) => void;
  accentColor?: string;
  open?: boolean;
}

function getTargetRect(selector: string | undefined): DOMRect | null {
  if (!selector) return null;
  try {
    const el = document.querySelector(selector);
    if (!el) return null;
    return el.getBoundingClientRect();
  } catch {
    return null;
  }
}

function computeTooltipPosition(
  targetRect: DOMRect | null,
  placement: ProductTourStep['placement'],
) {
  if (!targetRect || placement === 'center') {
    return {
      position: 'fixed' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }

  const gap = 12;
  const style: React.CSSProperties = { position: 'fixed' };

  switch (placement) {
    case 'bottom':
      style.top = targetRect.bottom + gap;
      style.left = targetRect.left + targetRect.width / 2;
      style.transform = 'translateX(-50%)';
      break;
    case 'top':
      style.bottom = window.innerHeight - targetRect.top + gap;
      style.left = targetRect.left + targetRect.width / 2;
      style.transform = 'translateX(-50%)';
      break;
    case 'left':
      style.top = targetRect.top + targetRect.height / 2;
      style.right = window.innerWidth - targetRect.left + gap;
      style.transform = 'translateY(-50%)';
      break;
    case 'right':
      style.top = targetRect.top + targetRect.height / 2;
      style.left = targetRect.right + gap;
      style.transform = 'translateY(-50%)';
      break;
    default:
      style.top = targetRect.bottom + gap;
      style.left = targetRect.left + targetRect.width / 2;
      style.transform = 'translateX(-50%)';
  }

  return style;
}

export function ProductTour({
  tourId,
  steps,
  onComplete,
  onDismiss,
  onStepChange,
  accentColor: defaultAccent = '#8b7ac8',
  open = true,
}: ProductTourProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [visible, setVisible] = React.useState(false);
  const [targetRect, setTargetRect] = React.useState<DOMRect | null>(null);

  React.useEffect(() => {
    if (open) {
      const t = setTimeout(() => setVisible(true), 300);
      return () => clearTimeout(t);
    }
    setVisible(false);
    return undefined;
  }, [open]);

  const step = steps[currentStep];

  React.useEffect(() => {
    if (!step?.target || !visible) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const rect = getTargetRect(step.target);
      setTargetRect(rect);
      if (rect) {
        const el = document.querySelector(step.target!);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [step?.target, visible]);

  React.useEffect(() => {
    if (visible && step) onStepChange?.(currentStep, step);
  }, [currentStep, visible, step, onStepChange]);

  const handleDismiss = React.useCallback(() => {
    setVisible(false);
    setTimeout(() => onDismiss?.(), 200);
  }, [onDismiss]);

  const handleComplete = React.useCallback(() => {
    setVisible(false);
    setTimeout(() => onComplete?.(), 200);
  }, [onComplete]);

  const handleNext = React.useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length, handleComplete]);

  const handlePrev = React.useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    if (visible) {
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }
    return undefined;
  }, [visible, handleDismiss, handleNext, handlePrev]);

  if (!open || !visible || !step) return null;

  const accent = step.accentColor || defaultAccent;
  const Icon = step.icon;
  const isLast = currentStep === steps.length - 1;
  const tooltipStyle = computeTooltipPosition(targetRect, step.placement || 'bottom');
  const spotlightPad = 8;

  return (
    <>
      <svg
        className="fixed inset-0 z-[9998] pointer-events-auto"
        width="100%"
        height="100%"
        style={{ transition: 'opacity 0.3s' }}
        onClick={handleDismiss}
      >
        <defs>
          <mask id={`tour-mask-${tourId}`}>
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - spotlightPad}
                y={targetRect.top - spotlightPad}
                width={targetRect.width + spotlightPad * 2}
                height={targetRect.height + spotlightPad * 2}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask={`url(#tour-mask-${tourId})`}
        />
      </svg>

      {targetRect && (
        <div
          className="fixed z-[9999] pointer-events-none rounded-lg"
          style={{
            top: targetRect.top - spotlightPad,
            left: targetRect.left - spotlightPad,
            width: targetRect.width + spotlightPad * 2,
            height: targetRect.height + spotlightPad * 2,
            boxShadow: `0 0 0 3px ${accent}50, 0 0 20px ${accent}30`,
            transition: 'all 0.3s ease',
          }}
        />
      )}

      <div
        className={cn(
          'z-[10000] w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden pointer-events-auto',
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        )}
        style={{
          ...tooltipStyle,
          transition: 'opacity 0.3s, transform 0.3s',
          boxShadow: `0 0 40px ${accent}15, 0 20px 40px rgba(0,0,0,0.4)`,
          maxWidth: '380px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="h-0.5 transition-all duration-300"
          style={{
            background: `linear-gradient(90deg, ${accent}, ${accent}60)`,
            width: `${((currentStep + 1) / steps.length) * 100}%`,
          }}
        />

        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${accent}15` }}
              >
                {Icon ? (
                  <Icon className="w-3.5 h-3.5" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" style={{ color: accent }} />
                )}
              </div>
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                {currentStep + 1} / {steps.length}
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
                backgroundColor: `${accent}08`,
                borderColor: `${accent}20`,
                color: accent,
              }}
            >
              <span className="font-semibold">Tip: </span>
              {step.tip}
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
                    width: i === currentStep ? '16px' : '6px',
                    height: '6px',
                    backgroundColor: i === currentStep ? accent : `${accent}30`,
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
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                }}
              >
                {isLast ? 'Finish' : 'Next'} {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
