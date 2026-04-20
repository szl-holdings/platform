import { useCallback, useRef } from 'react';

interface OnboardingAnalyticsOptions {
  platform: string;
  tourId?: string;
}

function trackEvent(event: string, properties: Record<string, unknown>) {
  try {
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        platform: properties.platform ?? 'szl',
        timestamp: new Date().toISOString(),
        properties,
      }),
    }).catch(() => {});
  } catch {}
}

export function useOnboardingAnalytics({ platform, tourId }: OnboardingAnalyticsOptions) {
  const trackedRef = useRef<Set<string>>(new Set());

  const trackTourStarted = useCallback(() => {
    if (trackedRef.current.has('tour_started')) return;
    trackedRef.current.add('tour_started');
    trackEvent('tour_started', { platform, tourId });
  }, [platform, tourId]);

  const trackTourCompleted = useCallback(() => {
    trackEvent('tour_completed', { platform, tourId });
  }, [platform, tourId]);

  const trackTourSkipped = useCallback(
    (atStep?: number) => {
      trackEvent('tour_skipped', { platform, tourId, atStep });
    },
    [platform, tourId],
  );

  const trackTourStepViewed = useCallback(
    (stepIndex: number, stepId: string) => {
      trackEvent('tour_step_viewed', { platform, tourId, stepIndex, stepId });
    },
    [platform, tourId],
  );

  const trackChecklistItemCompleted = useCallback(
    (itemId: string) => {
      trackEvent('checklist_item_completed', { platform, itemId });
    },
    [platform],
  );

  const trackChecklistDismissed = useCallback(() => {
    trackEvent('checklist_dismissed', { platform });
  }, [platform]);

  const trackChecklistViewed = useCallback(() => {
    if (trackedRef.current.has('checklist_viewed')) return;
    trackedRef.current.add('checklist_viewed');
    trackEvent('checklist_viewed', { platform });
  }, [platform]);

  const trackHelpTipOpened = useCallback(
    (tipId: string) => {
      trackEvent('help_tip_opened', { platform, tipId });
    },
    [platform],
  );

  const trackChangelogViewed = useCallback(() => {
    trackEvent('changelog_viewed', { platform });
  }, [platform]);

  return {
    trackTourStarted,
    trackTourCompleted,
    trackTourSkipped,
    trackTourStepViewed,
    trackChecklistItemCompleted,
    trackChecklistDismissed,
    trackChecklistViewed,
    trackHelpTipOpened,
    trackChangelogViewed,
  };
}
