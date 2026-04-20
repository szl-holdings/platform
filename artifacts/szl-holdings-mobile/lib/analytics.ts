import { Platform } from 'react-native';

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
const AMPLITUDE_KEY = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY;

let posthogDistinctId: string | null = null;
let amplitudeDeviceId = `cortex-${Math.random().toString(36).slice(2)}`;
let analyticsUserId: string | null = null;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreateDistinctId(): string {
  if (posthogDistinctId) return posthogDistinctId;
  posthogDistinctId = generateId();
  return posthogDistinctId;
}

async function postToPostHog(batch: object[]): Promise<void> {
  if (!POSTHOG_KEY) return;
  try {
    await fetch(`${POSTHOG_HOST}/batch/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: POSTHOG_KEY, batch }),
    });
  } catch {
    /* noop — analytics failures must not affect UX */
  }
}

async function postToAmplitude(events: object[]): Promise<void> {
  if (!AMPLITUDE_KEY) return;
  try {
    await fetch('https://api2.amplitude.com/2/httpapi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: AMPLITUDE_KEY, events }),
    });
  } catch {
    /* noop */
  }
}

export function identifyUser(user: {
  id: string;
  email?: string;
  name?: string;
  plan?: string;
}): void {
  analyticsUserId = user.id;
  posthogDistinctId = user.id;

  const now = new Date().toISOString();

  postToPostHog([
    {
      type: 'identify',
      distinct_id: user.id,
      timestamp: now,
      properties: {
        $set: {
          email: user.email,
          name: user.name,
          plan: user.plan,
          $os: Platform.OS,
        },
      },
    },
  ]);

  if (AMPLITUDE_KEY) {
    postToAmplitude([
      {
        event_type: '$identify',
        user_id: user.id,
        device_id: amplitudeDeviceId,
        user_properties: {
          $set: { email: user.email, name: user.name, plan: user.plan },
        },
        os_name: Platform.OS,
        time: Date.now(),
      },
    ]);
  }
}

export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  const distinctId = analyticsUserId ?? getOrCreateDistinctId();
  const now = new Date().toISOString();

  postToPostHog([
    {
      type: 'capture',
      event,
      distinct_id: distinctId,
      timestamp: now,
      properties: {
        ...properties,
        app: 'cortex-mobile',
        platform: Platform.OS,
        $os: Platform.OS,
      },
    },
  ]);

  if (AMPLITUDE_KEY) {
    postToAmplitude([
      {
        event_type: event,
        user_id: analyticsUserId ?? undefined,
        device_id: amplitudeDeviceId,
        event_properties: {
          ...properties,
          app: 'cortex-mobile',
          platform: Platform.OS,
        },
        os_name: Platform.OS,
        time: Date.now(),
      },
    ]);
  }

  if (__DEV__) {
    console.debug(`[analytics] ${event}`, properties);
  }
}

export function resetUser(): void {
  analyticsUserId = null;
  posthogDistinctId = null;
  amplitudeDeviceId = generateId();
}

export function isAnalyticsEnabled(): boolean {
  return !!(POSTHOG_KEY || AMPLITUDE_KEY);
}
