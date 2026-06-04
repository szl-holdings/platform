import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  ExternalLink,
  Loader2,
  Rocket,
  X,
} from 'lucide-react';
import * as React from 'react';
import { cn } from '../utils';

export type OnboardingLifecycleEvent =
  | 'signup_completed'
  | 'workspace_created'
  | 'first_data_connected'
  | 'first_recommendation_seen'
  | 'first_approval_submitted'
  | 'first_outcome_verified'
  | 'onboarding_completed';

export type OnboardingVariant = 'standard' | 'forge' | 'azure_tenant';

export type UserRole = 'admin' | 'member' | 'viewer';

export interface GuidedStep {
  id: string;
  lifecycleEvent: OnboardingLifecycleEvent;
  label: string;
  description: string;
  href?: string;
  completed: boolean;
  applicableRoles: UserRole[];
}

export interface GuidedSetupChecklistProps {
  orgSlug: string;
  workspaceId?: string;
  userId?: string;
  userRole?: UserRole;
  variant?: OnboardingVariant;
  domainPack?: string;
  apiBaseUrl?: string;
  accentColor?: string;
  onStepComplete?: (step: GuidedStep, event: OnboardingLifecycleEvent) => void;
  onChecklistComplete?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const DEFAULT_STEPS: Omit<GuidedStep, 'completed'>[] = [
  {
    id: 'signup_completed',
    lifecycleEvent: 'signup_completed',
    label: 'Create your account',
    description: 'Set up your organization profile and confirm your email.',
    applicableRoles: ['admin', 'member', 'viewer'],
  },
  {
    id: 'workspace_created',
    lifecycleEvent: 'workspace_created',
    label: 'Set up your workspace',
    description: 'Choose your domain pack and configure your workspace.',
    href: '/onboarding',
    applicableRoles: ['admin'],
  },
  {
    id: 'first_data_connected',
    lifecycleEvent: 'first_data_connected',
    label: 'Connect a data source',
    description: 'Link an integration or load sample data to generate your first intelligence.',
    href: '/settings/integrations',
    applicableRoles: ['admin'],
  },
  {
    id: 'first_recommendation_seen',
    lifecycleEvent: 'first_recommendation_seen',
    label: 'Review your first recommendation',
    description: 'See what the platform has found in your data.',
    href: '/signals',
    applicableRoles: ['admin', 'member'],
  },
  {
    id: 'first_approval_submitted',
    lifecycleEvent: 'first_approval_submitted',
    label: 'Submit your first decision',
    description: 'Approve, escalate, or dismiss a recommendation to record your first governed action.',
    href: '/approvals',
    applicableRoles: ['admin', 'member'],
  },
  {
    id: 'first_outcome_verified',
    lifecycleEvent: 'first_outcome_verified',
    label: 'Verify your first outcome',
    description: 'Your decision is now in the proof chain — auditable and immutable.',
    href: '/proof-chain',
    applicableRoles: ['admin', 'member', 'viewer'],
  },
];

const VIEWER_STEPS: Omit<GuidedStep, 'completed'>[] = [
  {
    id: 'signup_completed',
    lifecycleEvent: 'signup_completed',
    label: 'Create your account',
    description: 'Set up your profile and confirm your email.',
    applicableRoles: ['viewer'],
  },
  {
    id: 'first_recommendation_seen',
    lifecycleEvent: 'first_recommendation_seen',
    label: 'View your first briefing',
    description: 'Open the executive briefing to see platform intelligence for your portfolio.',
    href: '/pulse',
    applicableRoles: ['viewer'],
  },
  {
    id: 'first_outcome_verified',
    lifecycleEvent: 'first_outcome_verified',
    label: 'Review the proof chain',
    description: 'Explore the immutable audit trail of decisions made on your behalf.',
    href: '/proof-chain',
    applicableRoles: ['viewer'],
  },
];

async function fetchActivationState(
  apiBaseUrl: string,
  orgSlug: string,
): Promise<Record<string, boolean>> {
  try {
    const res = await fetch(`${apiBaseUrl}/onboarding/activation-state/${orgSlug}`, {
      credentials: 'include',
    });
    if (!res.ok) return {};
    const json = await res.json();
    return (json?.data ?? json) as Record<string, boolean>;
  } catch {
    return {};
  }
}

const LIFECYCLE_EVENT_TYPES: Record<OnboardingLifecycleEvent, string> = {
  signup_completed: 'onboarding.signup.completed',
  workspace_created: 'onboarding.workspace.created',
  first_data_connected: 'onboarding.data.first_connected',
  first_recommendation_seen: 'onboarding.recommendation.first_seen',
  first_approval_submitted: 'onboarding.approval.first_submitted',
  first_outcome_verified: 'onboarding.outcome.first_verified',
  onboarding_completed: 'onboarding.completed',
} as const;

async function emitLifecycleEvent(
  apiBaseUrl: string,
  event: OnboardingLifecycleEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  const eventType = LIFECYCLE_EVENT_TYPES[event];
  if (!eventType) return;
  try {
    await fetch(`${apiBaseUrl}/telemetry/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        event_type: eventType,
        event_category: 'business',
        domain: 'system',
        occurred_at: new Date().toISOString(),
        payload,
      }),
    });
  } catch {}
}

async function persistChecklistCompletion(
  apiBaseUrl: string,
  orgSlug: string,
): Promise<void> {
  try {
    await fetch(`${apiBaseUrl}/onboarding/wizard/${orgSlug}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ completedAt: new Date().toISOString() }),
    });
  } catch {}
}

export function GuidedSetupChecklist({
  orgSlug,
  workspaceId,
  userId,
  userRole = 'admin',
  variant = 'standard',
  domainPack,
  apiBaseUrl = '/api',
  accentColor = '#8b7ac8',
  onStepComplete,
  onChecklistComplete,
  onDismiss,
  className,
}: GuidedSetupChecklistProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [completedEvents, setCompletedEvents] = React.useState<Set<string>>(new Set());
  const completedFiredRef = React.useRef(false);

  const stepTemplate = userRole === 'viewer' ? VIEWER_STEPS : DEFAULT_STEPS;
  const steps: GuidedStep[] = stepTemplate
    .filter((s) => s.applicableRoles.includes(userRole))
    .map((s) => ({ ...s, completed: completedEvents.has(s.lifecycleEvent) }));

  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allDone = completedCount === totalCount;

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchActivationState(apiBaseUrl, orgSlug).then((state) => {
      if (cancelled) return;
      const done = new Set<string>();
      for (const [key, val] of Object.entries(state)) {
        if (val) done.add(key);
      }
      setCompletedEvents(done);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, orgSlug]);

  React.useEffect(() => {
    const alreadyCompleted = completedEvents.has('onboarding_completed');
    if (allDone && !completedFiredRef.current && !loading && !alreadyCompleted) {
      completedFiredRef.current = true;
      persistChecklistCompletion(apiBaseUrl, orgSlug);
      emitLifecycleEvent(apiBaseUrl, 'onboarding_completed', {
        workspaceId,
        userId,
        orgSlug,
        onboardingVariant: variant,
        domainPacksActive: domainPack ? [domainPack] : [],
        completedAt: new Date().toISOString(),
      });
      onChecklistComplete?.();
    }
  }, [allDone, loading, completedEvents, apiBaseUrl, orgSlug, workspaceId, userId, variant, domainPack, onChecklistComplete]);

  const handleStepClick = React.useCallback(
    (step: GuidedStep) => {
      if (step.completed) return;
      onStepComplete?.(step, step.lifecycleEvent);
      if (step.href) {
        window.location.href = step.href;
      }
    },
    [onStepComplete],
  );

  const handleDismiss = React.useCallback(() => {
    setDismissed(true);
    onDismiss?.();
  }, [onDismiss]);

  if (dismissed) return null;

  return (
    <div
      className={cn(
        'w-72 rounded-2xl border border-border bg-card shadow-xl overflow-hidden',
        className,
      )}
      style={{
        boxShadow: `0 0 30px ${accentColor}10, 0 8px 32px rgba(0,0,0,0.2)`,
      }}
      role="complementary"
      aria-label="Getting started checklist"
    >
      <div
        className="h-1 transition-all duration-500"
        style={{
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}60)`,
          width: `${progress}%`,
        }}
      />

      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
            <h4 className="text-sm font-display font-bold text-foreground">Getting Started</h4>
          </div>
          <div className="flex items-center gap-1">
            {loading && <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label={collapsed ? 'Expand checklist' : 'Collapse checklist'}
            >
              {collapsed ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Dismiss checklist"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          {allDone
            ? "All set — your first governed decision is in the proof chain."
            : `${completedCount} of ${totalCount} complete`}
        </p>

        {!collapsed && (
          <div className="space-y-1">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => handleStepClick(step)}
                disabled={step.completed}
                className={cn(
                  'w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors group',
                  step.completed
                    ? 'opacity-60 cursor-default'
                    : 'hover:bg-muted/50 cursor-pointer',
                )}
                aria-label={step.completed ? `${step.label} (completed)` : step.label}
              >
                {step.completed ? (
                  <CheckCircle2
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: accentColor }}
                  />
                ) : (
                  <Circle className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span
                      className={cn(
                        'text-sm font-medium block',
                        step.completed
                          ? 'line-through text-muted-foreground'
                          : 'text-foreground',
                      )}
                    >
                      {step.label}
                    </span>
                    {!step.completed && step.href && (
                      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    )}
                  </div>
                  {!step.completed && step.description && (
                    <span className="text-xs text-muted-foreground leading-tight block mt-0.5">
                      {step.description}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {allDone && !collapsed && (
          <button
            onClick={() => {
              handleDismiss();
              window.location.href = '/proof-chain';
            }}
            className="w-full mt-3 py-2 px-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
            }}
          >
            View proof chain →
          </button>
        )}
      </div>
    </div>
  );
}
