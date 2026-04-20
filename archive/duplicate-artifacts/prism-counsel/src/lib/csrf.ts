import { setCsrfTokenGetter } from '@szl-holdings/api-client-react';

const CSRF_COOKIE = 'csrf_token';

function readCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

let inflight: Promise<string | null> | null = null;

async function fetchToken(): Promise<string | null> {
  if (!inflight) {
    inflight = fetch('/api/csrf-token', { credentials: 'include' })
      .then(() => readCookie())
      .catch(() => null)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function installCsrfTokenGetter(): void {
  setCsrfTokenGetter(async () => {
    const existing = readCookie();
    if (existing) return existing;
    return await fetchToken();
  });
}
