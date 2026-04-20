const VITE_APP_MODE = (import.meta.env.VITE_APP_MODE ?? '').toLowerCase();
const VITE_SANDBOX_API_BASE = (import.meta.env.VITE_SANDBOX_API_BASE ?? '').replace(/\/$/, '');

const BASE =
  VITE_APP_MODE === 'sandbox' && VITE_SANDBOX_API_BASE
    ? VITE_SANDBOX_API_BASE
    : (import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '');

function getCsrfTokenFromCookie(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]!) : '';
}

type ProductionConfirmFn = (opts: {
  action: string;
  confirmText?: string;
  description?: string;
  title?: string;
}) => Promise<boolean>;

let _productionConfirmFn: ProductionConfirmFn | null = null;

/**
 * Register a production confirmation handler.
 * Called once by <ProductionConfirmRegistrar /> inside the provider tree.
 * apiRequest automatically invokes this for DELETE requests to /api/admin/
 * when APP_MODE is production — enforcing the double-confirmation invariant
 * at the API call level rather than requiring each caller to opt in.
 */
export function registerProductionConfirmFn(fn: ProductionConfirmFn | null): void {
  _productionConfirmFn = fn;
}

const PRODUCTION_CONFIRM_PATHS = ['/api/admin/'];

export async function apiRequest<T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  if (
    method === 'DELETE' &&
    VITE_APP_MODE === 'production' &&
    PRODUCTION_CONFIRM_PATHS.some((p) => path.startsWith(p)) &&
    _productionConfirmFn
  ) {
    const confirmed = await _productionConfirmFn({
      action: 'Destructive operation',
      confirmText: 'CONFIRM',
      description: `This will permanently execute: DELETE ${path}. This action cannot be undone.`,
    });
    if (!confirmed) throw new Error('Operation cancelled');
  }

  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  let csrfToken = needsCsrf ? getCsrfTokenFromCookie() : '';
  if (needsCsrf && !csrfToken) {
    try {
      await fetch(`${BASE}/api/csrf-token`, { credentials: 'include' });
      csrfToken = getCsrfTokenFromCookie();
    } catch {
      // ignore — request may still succeed for exempt endpoints
    }
  }
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-requested-with': 'XMLHttpRequest',
      ...(needsCsrf && csrfToken ? { 'x-csrf-token': csrfToken } : {}),
    },
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
