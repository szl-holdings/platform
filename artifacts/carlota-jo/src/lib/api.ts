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

async function apiFetch(path: string, init?: RequestInit): Promise<unknown> {
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
  return res.json();
}

/**
 * Make an API call and unwrap the standard `{ data: … }` envelope.
 * Use for most endpoints that return a single object or array.
 */
export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const body = await apiFetch(path, init);
  return ((body as Record<string, unknown>)?.data ?? body) as T;
}

/**
 * Make an API call and return the raw response body (envelope included).
 * Use for paginated endpoints that need both `data` and `meta` fields.
 */
export async function apiJsonFull<T>(path: string, init?: RequestInit): Promise<T> {
  return apiFetch(path, init) as Promise<T>;
}
