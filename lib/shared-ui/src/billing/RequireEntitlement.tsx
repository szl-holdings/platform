import * as React from 'react';
import { useEntitlement } from './useEntitlement';
import { PaywallGate } from '../onboarding/PaywallGate';

export interface RequireEntitlementProps {
  featureKey: string;
  featureName: string;
  featureDescription?: string;
  requiredPlan?: 'starter' | 'professional' | 'enterprise' | 'command';
  upgradeUrl?: string;
  orgId?: number;
  adminBypass?: boolean;
  accentColor?: string;
  compact?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireEntitlement({
  featureKey,
  featureName,
  featureDescription,
  requiredPlan = 'professional',
  upgradeUrl,
  orgId,
  adminBypass = false,
  accentColor,
  compact = false,
  children,
  fallback,
}: RequireEntitlementProps) {
  const { granted, isLoading } = useEntitlement(featureKey, orgId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (adminBypass || granted) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  return (
    <PaywallGate
      featureName={featureName}
      featureDescription={featureDescription}
      requiredPlan={requiredPlan}
      upgradeUrl={upgradeUrl}
      accentColor={accentColor}
      compact={compact}
    />
  );
}
