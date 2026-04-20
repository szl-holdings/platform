import { ChevronRight, Sparkles, X } from 'lucide-react';
import * as React from 'react';
import { cn } from './utils';

export interface WelcomeFeature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

export interface WelcomeOverlayProps {
  appId: string;
  appName: string;
  subtitle?: string;
  description: string;
  features: WelcomeFeature[];
  accentColor?: string;
  icon?: React.ComponentType<{ className?: string }>;
  onDismiss?: () => void;
}

function useWelcomeState(appId: string) {
  const key = `szl_welcome_dismissed_${appId}`;
  const [dismissed, setDismissed] = React.useState(() => {
    try {
      return localStorage.getItem(key) === 'true';
    } catch {
      return false;
    }
  });

  const dismiss = React.useCallback(() => {
    try {
      localStorage.setItem(key, 'true');
    } catch {}
    setDismissed(true);
  }, [key]);

  return { dismissed, dismiss };
}

export function WelcomeOverlay({
  appId,
  appName,
  subtitle,
  description,
  features,
  accentColor = '#8b7ac8',
  icon: AppIcon,
  onDismiss,
}: WelcomeOverlayProps) {
  const { dismissed, dismiss } = useWelcomeState(appId);

  const handleDismiss = React.useCallback(() => {
    dismiss();
    onDismiss?.();
  }, [dismiss, onDismiss]);

  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        style={{ boxShadow: `0 0 60px ${accentColor}20, 0 25px 50px rgba(0,0,0,0.5)` }}
      >
        <div
          className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
          style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)` }}
        />

        <div className="p-6 pb-5">
          <button
            onClick={handleDismiss}
            aria-label="Close welcome overlay"
            className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            {AppIcon ? (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                {(AppIcon as any)({ className: 'w-6 h-6', style: { color: accentColor } })}
              </div>
            ) : (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                <Sparkles className="w-6 h-6" style={{ color: accentColor } as any} />
              </div>
            )}
            <div>
              <h2 className="text-lg font-display font-bold text-foreground leading-tight">
                Welcome to {appName}
              </h2>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5 font-medium uppercase tracking-wide">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-5">{description}</p>

          <div className="grid grid-cols-2 gap-2.5 mb-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${accentColor}15` }}
                  >
                    {(Icon as any)({ className: 'w-3.5 h-3.5', style: { color: accentColor } })}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground leading-tight">
                      {feature.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
            >
              Get Started <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleDismiss}
              className="py-2.5 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { useWelcomeState };
