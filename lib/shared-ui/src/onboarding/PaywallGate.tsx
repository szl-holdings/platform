import * as React from "react";
import { Lock, ArrowRight, Sparkles, Shield, X } from "lucide-react";
import { cn } from "../utils";

export interface PaywallGateProps {
  featureName: string;
  featureDescription?: string;
  requiredPlan?: "starter" | "professional" | "enterprise" | "command";
  packName?: string;
  upgradeUrl?: string;
  onUpgrade?: () => void;
  onNavigate?: (href: string) => void;
  accentColor?: string;
  className?: string;
  compact?: boolean;
  children?: React.ReactNode;
}

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
  command: "Command",
};

export function PaywallGate({
  featureName,
  featureDescription,
  requiredPlan = "professional",
  packName,
  upgradeUrl = "/settings/billing/upgrade",
  onUpgrade,
  onNavigate,
  accentColor = "#8b7ac8",
  className,
  compact = false,
  children,
}: PaywallGateProps) {
  const planLabel = PLAN_LABELS[requiredPlan] ?? requiredPlan;

  const handleUpgrade = React.useCallback(() => {
    if (onUpgrade) {
      onUpgrade();
    } else if (onNavigate && upgradeUrl) {
      onNavigate(upgradeUrl);
    } else if (upgradeUrl) {
      window.location.href = upgradeUrl;
    }
  }, [onUpgrade, onNavigate, upgradeUrl]);

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl border",
          className
        )}
        style={{
          backgroundColor: `${accentColor}08`,
          borderColor: `${accentColor}20`,
        }}
      >
        <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
        <p className="flex-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{featureName}</span>
          {packName
            ? ` requires the ${packName} pack.`
            : ` is available on ${planLabel} and above.`}
        </p>
        <button
          onClick={handleUpgrade}
          className="text-xs font-semibold shrink-0 px-2.5 py-1 rounded-lg text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
          }}
        >
          Upgrade
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6 rounded-2xl border relative overflow-hidden",
        className
      )}
      style={{
        backgroundColor: `${accentColor}05`,
        borderColor: `${accentColor}20`,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${accentColor}12, transparent 70%)`,
        }}
      />

      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 relative"
        style={{ backgroundColor: `${accentColor}15` }}
      >
        {packName ? (
          <Shield className="w-7 h-7" style={{ color: accentColor }} />
        ) : (
          <Sparkles className="w-7 h-7" style={{ color: accentColor }} />
        )}
        <div
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: accentColor }}
        >
          <Lock className="w-2.5 h-2.5 text-white" />
        </div>
      </div>

      <h3 className="text-base font-display font-semibold text-foreground mb-1">
        {featureName}
      </h3>

      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-1">
        {featureDescription ??
          (packName
            ? `Activate the ${packName} domain pack to unlock this capability.`
            : `Available on ${planLabel} and above.`)}
      </p>

      {!packName && (
        <p className="text-xs text-muted-foreground/60 mb-5">
          Upgrade to {planLabel} to access this feature.
        </p>
      )}

      {packName && (
        <p className="text-xs text-muted-foreground/60 mb-5">
          The {packName} pack adds domain-specific intelligence to your platform.
        </p>
      )}

      <button
        onClick={handleUpgrade}
        className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
          boxShadow: `0 4px 20px ${accentColor}40`,
        }}
      >
        {packName ? `Activate ${packName}` : `Upgrade to ${planLabel}`}
        <ArrowRight className="w-4 h-4" />
      </button>

      {children && <div className="mt-4 w-full">{children}</div>}
    </div>
  );
}

export interface TrialBannerProps {
  daysRemaining: number;
  upgradeUrl?: string;
  onUpgrade?: () => void;
  onNavigate?: (href: string) => void;
  accentColor?: string;
  className?: string;
}

export function TrialBanner({
  daysRemaining,
  upgradeUrl = "/settings/billing/upgrade",
  onUpgrade,
  onNavigate,
  accentColor = "#8b7ac8",
  className,
}: TrialBannerProps) {
  const [dismissed, setDismissed] = React.useState(() => {
    try {
      return localStorage.getItem("szl_trial_banner_dismissed") === "true";
    } catch {
      return false;
    }
  });

  const handleUpgrade = React.useCallback(() => {
    if (onUpgrade) {
      onUpgrade();
    } else if (onNavigate && upgradeUrl) {
      onNavigate(upgradeUrl);
    } else if (upgradeUrl) {
      window.location.href = upgradeUrl;
    }
  }, [onUpgrade, onNavigate, upgradeUrl]);

  if (dismissed || daysRemaining > 10) return null;

  const urgent = daysRemaining <= 3;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-xl border",
        className
      )}
      style={{
        backgroundColor: urgent ? "rgba(239,68,68,0.08)" : `${accentColor}08`,
        borderColor: urgent ? "rgba(239,68,68,0.25)" : `${accentColor}25`,
      }}
    >
      <Sparkles
        className="w-4 h-4 shrink-0"
        style={{ color: urgent ? "#dc2626" : accentColor }}
      />
      <p className="flex-1 text-sm text-foreground">
        <span className="font-semibold">
          {daysRemaining === 0
            ? "Your trial ends today."
            : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left in your trial.`}
        </span>{" "}
        <span className="text-muted-foreground">
          Add a payment method to continue after your trial.
        </span>
      </p>
      <button
        onClick={handleUpgrade}
        className="text-xs font-semibold shrink-0 px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90 active:scale-[0.98]"
        style={{
          background: urgent
            ? "linear-gradient(135deg, #c45a4a, #dc2626)"
            : `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
        }}
      >
        Upgrade now
      </button>
      <button
        onClick={() => {
          try {
            localStorage.setItem("szl_trial_banner_dismissed", "true");
          } catch {}
          setDismissed(true);
        }}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors shrink-0"
        aria-label="Dismiss trial banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
