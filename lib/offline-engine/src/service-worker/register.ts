export interface ServiceWorkerRegistrationOptions {
  swUrl?: string;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export function registerServiceWorker(options: ServiceWorkerRegistrationOptions = {}): void {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  const swUrl = options.swUrl ?? '/sw.js';

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        registration.onupdatefound = () => {
          const installing = registration.installing;
          if (!installing) return;

          installing.onstatechange = () => {
            if (installing.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                options.onUpdate?.(registration);
              } else {
                options.onSuccess?.(registration);
              }
            }
          };
        };
        options.onSuccess?.(registration);
      })
      .catch((error: Error) => {
        options.onError?.(error);
      });
  });
}

export function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (!('serviceWorker' in navigator)) return Promise.resolve(false);

  return navigator.serviceWorker.ready.then((registration) => registration.unregister());
}

export function skipWaiting(): void {
  if (typeof navigator === 'undefined') return;
  navigator.serviceWorker.ready.then((registration) => {
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
  });
}
