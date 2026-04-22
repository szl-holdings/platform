import { useCallback, useRef } from 'react';

export type FunnelEventName =
  | 'funnel_started'
  | 'funnel_step_completed'
  | 'funnel_abandoned'
  | 'funnel_completed'
  | 'role_tab_switched'
  | 'proof_component_engaged'
  | 'demo_request_submitted'
  | 'diagnostic_result_viewed';

export interface FunnelEvent {
  event: FunnelEventName;
  site: string;
  funnel_id: string;
  step?: number;
  step_label?: string;
  role?: string;
  score?: number;
  score_label?: string;
  [key: string]: string | number | boolean | undefined;
}

function emit(data: FunnelEvent): void {
  if (typeof window === 'undefined') return;
  const { event, ...props } = data;
  if (
    typeof (window as typeof window & { gtag?: (...args: unknown[]) => void }).gtag === 'function'
  ) {
    (window as typeof window & { gtag: (...args: unknown[]) => void }).gtag('event', event, props);
  }
  try {
    const ph = (
      window as typeof window & {
        posthog?: { capture: (e: string, p: Record<string, unknown>) => void };
      }
    ).posthog;
    if (ph?.capture) ph.capture(event, props);
  } catch (_) {}
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  }
}

export function useLeadQualification(site: string, funnelId: string) {
  const startedRef = useRef(false);

  const trackFunnelStart = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    emit({ event: 'funnel_started', site, funnel_id: funnelId });
  }, [site, funnelId]);

  const trackStepCompleted = useCallback(
    (step: number, stepLabel: string, extra?: Record<string, string | number | boolean>) => {
      emit({
        event: 'funnel_step_completed',
        site,
        funnel_id: funnelId,
        step,
        step_label: stepLabel,
        ...extra,
      });
    },
    [site, funnelId],
  );

  const trackAbandoned = useCallback(
    (step: number) => {
      emit({ event: 'funnel_abandoned', site, funnel_id: funnelId, step });
    },
    [site, funnelId],
  );

  const trackCompleted = useCallback(
    (score: number, scoreLabel: string, role?: string) => {
      emit({
        event: 'funnel_completed',
        site,
        funnel_id: funnelId,
        score,
        score_label: scoreLabel,
        role,
      });
    },
    [site, funnelId],
  );

  const trackRoleSwitch = useCallback(
    (role: string) => {
      emit({ event: 'role_tab_switched', site, funnel_id: funnelId, role });
    },
    [site, funnelId],
  );

  const trackProofEngaged = useCallback(
    (componentId: string) => {
      emit({
        event: 'proof_component_engaged',
        site,
        funnel_id: funnelId,
        component_id: componentId,
      });
    },
    [site, funnelId],
  );

  const trackDemoRequest = useCallback(
    (source: string, role?: string, score?: number) => {
      emit({ event: 'demo_request_submitted', site, funnel_id: funnelId, source, role, score });
    },
    [site, funnelId],
  );

  const trackResultViewed = useCallback(
    (score: number, scoreLabel: string) => {
      emit({
        event: 'diagnostic_result_viewed',
        site,
        funnel_id: funnelId,
        score,
        score_label: scoreLabel,
      });
    },
    [site, funnelId],
  );

  return {
    trackFunnelStart,
    trackStepCompleted,
    trackAbandoned,
    trackCompleted,
    trackRoleSwitch,
    trackProofEngaged,
    trackDemoRequest,
    trackResultViewed,
  };
}
