const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

async function postEvent(event: string, properties: Record<string, unknown> = {}): Promise<void> {
  try {
    await fetch(`${BASE}/api/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        event,
        platform: 'lyte',
        timestamp: new Date().toISOString(),
        properties,
      }),
    });
  } catch {}
}

export const analytics = {
  userLoggedIn(method = 'oidc') {
    return postEvent('user_logged_in', { method, platform: 'lyte' });
  },
  userSignedUp(method = 'oidc', role = 'viewer') {
    return postEvent('user_signed_up', { method, role, platform: 'lyte' });
  },
  dashboardViewed(dashboardId = 'main', loadTimeMs?: number) {
    return postEvent('dashboard_viewed', { platform: 'lyte', dashboardId, loadTimeMs });
  },
  signalViewed(signalId: string | number, signalType: string, severity: string) {
    return postEvent('signal_viewed', { platform: 'lyte', signalId, signalType, severity });
  },
  signalDismissed(signalId: string | number, reason?: string) {
    return postEvent('signal_dismissed', { platform: 'lyte', signalId, reason });
  },
  alertAcknowledged(alertId: string | number, latencyMs?: number) {
    return postEvent('alert_acknowledged', { platform: 'lyte', alertId, latencyMs });
  },
  actionCreated(actionType: string, source: 'agent' | 'human') {
    return postEvent('action_created', { actionType, domain: 'lyte', source });
  },
  actionApproved(actionId: string | number, actionType: string, latencyMs?: number) {
    return postEvent('action_approved', { actionId, actionType, approvalLatencyMs: latencyMs });
  },
  actionRejected(actionId: string | number, actionType: string, reason?: string) {
    return postEvent('action_rejected', { actionId, actionType, reason });
  },
  approvalDecision(
    actionId: string | number,
    decision: 'approved' | 'rejected',
    latencyMs?: number,
  ) {
    return postEvent('approval_decision', { actionId, decision, approver: 'user', latencyMs });
  },
  contactFormSubmitted(source: string, type?: string) {
    return postEvent('contact_form_submitted', { source, type });
  },
  demoRequested(platform: string, source?: string) {
    return postEvent('demo_requested', { platform, source });
  },
  pageViewed(page: string, referrer?: string) {
    return postEvent('page_viewed', { platform: 'lyte', page, referrer });
  },
  searchExecuted(query: string, resultCount?: number) {
    return postEvent('search_executed', {
      platform: 'lyte',
      query: query.slice(0, 50),
      resultCount,
    });
  },
  subscriptionStarted(planId: string, planName: string, amount: number, currency: string) {
    return postEvent('subscription_started', { planId, planName, amount, currency });
  },
  paymentSucceeded(amount: number, currency: string, planId?: string) {
    return postEvent('payment_succeeded', { amount, currency, planId });
  },
  paymentFailed(amount: number, errorCode?: string) {
    return postEvent('payment_failed', { amount, errorCode });
  },
};
