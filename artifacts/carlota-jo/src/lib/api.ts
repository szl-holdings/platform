/**
 * Shared API helper for Carlota Jo.
 *
 * Every page that talks to the backend should import `apiJson` from here
 * instead of defining its own fetch wrapper.
 *
 * Features:
 *  - Automatically attaches Content-Type: application/json
 *  - Fetches and caches the CSRF token for mutating requests (POST/PUT/PATCH/DELETE)
 *  - Invalidates the cached token on 403 so the next write re-fetches it
 *  - Unwraps the standard `{ data: … }` envelope returned by the API server
 */

const API_BASE = '/api';

let csrfTokenCache: string | null = null;

async function getCsrfToken(): Promise<string> {
  if (csrfTokenCache) return csrfTokenCache;
  const res = await fetch(`${API_BASE}/csrf-token`, { credentials: 'include' });
  const body = await res.json();
  csrfTokenCache = String(body.csrfToken ?? '');
  return csrfTokenCache;
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  if (method !== 'GET' && method !== 'HEAD') {
    headers['X-CSRF-Token'] = await getCsrfToken();
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    if (res.status === 403) csrfTokenCache = null;
    throw new Error(`HTTP ${res.status}`);
  }
  const body = await res.json();
  return (body?.data ?? body) as T;
}
