import { describe, expect, it } from 'vitest';
import { buildAlertFiredEmail } from '../email';

describe('buildAlertFiredEmail', () => {
  const baseOpts = {
    ruleName: 'High Error Rate',
    severity: 'critical',
    metricName: 'api.error_rate',
    metricValue: 7.4,
    condition: 'gt' as const,
    threshold: 5,
    alertsUrl: 'https://szlholdings.com/command/ops/alerts',
  };

  it('includes the unsubscribe link in HTML when notificationUnsubscribeUrl is provided', () => {
    const unsubUrl = 'https://szlholdings.com/api/notifications/unsubscribe?e=test%40example.com&t=abc123';
    const { html } = buildAlertFiredEmail({ ...baseOpts, notificationUnsubscribeUrl: unsubUrl });

    expect(html).toContain('Unsubscribe from alert emails');
    expect(html).toContain(unsubUrl);
  });

  it('includes the unsubscribe link in text when notificationUnsubscribeUrl is provided', () => {
    const unsubUrl = 'https://szlholdings.com/api/notifications/unsubscribe?e=test%40example.com&t=abc123';
    const { text } = buildAlertFiredEmail({ ...baseOpts, notificationUnsubscribeUrl: unsubUrl });

    expect(text).toContain('Unsubscribe from alert emails');
    expect(text).toContain(unsubUrl);
  });

  it('does not include unsubscribe link when notificationUnsubscribeUrl is omitted', () => {
    const { html, text } = buildAlertFiredEmail(baseOpts);

    expect(html).not.toContain('Unsubscribe from alert emails');
    expect(text).not.toContain('Unsubscribe from alert emails');
  });

  it('still includes the alert details in the email', () => {
    const unsubUrl = 'https://szlholdings.com/api/notifications/unsubscribe?e=test%40example.com&t=abc123';
    const { subject, html, text } = buildAlertFiredEmail({ ...baseOpts, notificationUnsubscribeUrl: unsubUrl });

    expect(subject).toContain('CRITICAL');
    expect(subject).toContain('High Error Rate');
    expect(html).toContain('api.error_rate');
    expect(html).toContain('7.4');
    expect(text).toContain('api.error_rate');
    expect(text).toContain('7.4');
  });
});
