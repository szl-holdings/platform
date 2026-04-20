const meta = import.meta as unknown as { env?: { BASE_URL?: string } };
const API_BASE = meta.env?.BASE_URL ? `${meta.env.BASE_URL}api` : '/api';

export interface WebPushRegistrationOptions {
  appId: string;
  onPermissionDenied?: () => void;
  onSuccess?: (subscription: PushSubscription) => void;
  onError?: (err: Error) => void;
}

export async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/web-push/vapid-public-key`);
    if (!res.ok) return null;
    const data = (await res.json()) as { data?: { publicKey?: string } };
    return data?.data?.publicKey ?? null;
  } catch {
    return null;
  }
}

export async function registerWebPush(
  options: WebPushRegistrationOptions,
): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    options.onPermissionDenied?.();
    return null;
  }

  try {
    const vapidPublicKey = await getVapidPublicKey();
    if (!vapidPublicKey) {
      throw new Error('Web push not configured on server');
    }

    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await sendSubscriptionToServer(existing, options.appId);
      options.onSuccess?.(existing);
      return existing;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource,
    });

    await sendSubscriptionToServer(subscription, options.appId);
    options.onSuccess?.(subscription);
    return subscription;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    options.onError?.(error);
    return null;
  }
}

export async function unregisterWebPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready.catch(() => null);
  if (!registration) return;
  const subscription = await registration.pushManager.getSubscription().catch(() => null);
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe().catch(() => null);

  try {
    await fetch(`${API_BASE}/web-push/subscriptions`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    });
  } catch {
    // non-fatal
  }
}

export async function checkWebPushSupport(): Promise<{
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
}> {
  if (
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  ) {
    return { supported: false, permission: 'unsupported' };
  }
  return { supported: true, permission: Notification.permission };
}

async function sendSubscriptionToServer(
  subscription: PushSubscription,
  appId: string,
): Promise<void> {
  const json = subscription.toJSON();
  await fetch(`${API_BASE}/web-push/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      },
      appId,
    }),
  });
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker(
  swPath: string = '/sw.js',
): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register(swPath, { scope: '/' });
    return registration;
  } catch (err) {
    console.warn('[web-push] Service worker registration failed:', err);
    return null;
  }
}
