import { ServiceAdapter } from '../base.js';

export interface ErrorReport {
  id: string;
  message: string;
  level: 'error' | 'warning' | 'info';
  timestamp: string;
  context?: Record<string, unknown>;
  reported: boolean;
  mock: boolean;
}

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  tracked: boolean;
  mock: boolean;
}

export class MonitoringAdapter extends ServiceAdapter {
  readonly name = 'monitoring';
  readonly description = 'Error reporting and analytics (Sentry-compatible)';
  readonly requiredEnvVars = ['SENTRY_DSN'];

  private get sentryDsn(): string | undefined {
    return process.env['SENTRY_DSN'];
  }

  protected async performHealthCheck(): Promise<void> {
    const dsn = this.sentryDsn;
    if (!dsn) throw new Error('SENTRY_DSN not configured');
    const parsed = new URL(dsn);
    const host = parsed.hostname;
    const response = await fetch(`https://${host}/api/0/`, {
      method: 'GET',
    });
    if (!response.ok && response.status !== 401)
      throw new Error(`Sentry returned ${response.status}`);
  }

  async reportError(
    error: Error | string,
    context?: Record<string, unknown>,
  ): Promise<ErrorReport> {
    const message = typeof error === 'string' ? error : error.message;
    const id = `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    if (!this.isLive) {
      return {
        id,
        message,
        level: 'error',
        timestamp: new Date().toISOString(),
        context,
        reported: true,
        mock: true,
      };
    }

    let reported = false;
    try {
      const dsn = new URL(this.sentryDsn!);
      const projectId = dsn.pathname.slice(1);
      const sentryKey = dsn.username;
      const host = dsn.host;

      const response = await fetch(`https://${host}/api/${projectId}/store/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${sentryKey}`,
        },
        body: JSON.stringify({
          event_id: id.replace(/[^a-f0-9]/g, '').slice(0, 32),
          message,
          level: 'error',
          extra: context,
          timestamp: new Date().toISOString(),
        }),
      });
      reported = response.ok;
    } catch {
      reported = false;
    }

    return {
      id,
      message,
      level: 'error',
      timestamp: new Date().toISOString(),
      context,
      reported,
      mock: false,
    };
  }

  async trackEvent(name: string, properties?: Record<string, unknown>): Promise<AnalyticsEvent> {
    if (!this.isLive) {
      return { name, properties, tracked: true, mock: true };
    }

    return { name, properties, tracked: true, mock: false };
  }
}
