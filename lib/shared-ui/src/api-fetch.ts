import {
  detectSessionRevocationCode,
  extractServerMessage,
  notifySessionRevoked,
  recordSessionReturnPath,
  withReturnToQuery,
} from "./session-revocation";

const API_BASE = "/api";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

function readCsrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(CSRF_COOKIE_NAME.length + 1));
}

function csrfHeaders(): Record<string, string> {
  const token = readCsrfTokenFromCookie();
  if (!token) return {};
  return { [CSRF_HEADER_NAME]: token };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isAuthError(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 401 || err.status === 403);
}

function isTransientError(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.status === 429 || err.status === 502 || err.status === 503 || err.status === 504;
  }
  if (err instanceof TypeError) {
    const msg = err.message.toLowerCase();
    return msg.includes("failed to fetch") || msg.includes("network") || msg.includes("load failed");
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Token store + silent refresh against POST /auth/refresh (rotating, single-use).

const STORAGE_KEY = "szl_auth_tokens";
const REFRESH_LEAD_MS = 5 * 60 * 1000;

export interface AuthTokens {
  token: string;
  refreshToken: string;
  expiresAt: string;
  refreshTokenExpiresAt: string;
}

let memoryTokens: AuthTokens | null = null;
let inFlightRefresh: Promise<AuthTokens | null> | null = null;

const authClearedHandlers = new Set<(reason: AuthClearedReason) => void>();

export type AuthClearedReason =
  | "manual"
  | "refresh_replay"
  | "refresh_invalid"
  | "no_refresh_token";

interface SecureStorageAdapter {
  read: () => Promise<AuthTokens | null> | AuthTokens | null;
  write: (tokens: AuthTokens) => Promise<void> | void;
  clear: () => Promise<void> | void;
}

let secureStorage: SecureStorageAdapter | null = null;

export function registerSecureTokenStorage(adapter: SecureStorageAdapter | null): void {
  secureStorage = adapter;
}

function readFromLocalStorage(): AuthTokens | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    console.warn("[auth] localStorage read failed:", err);
    return null;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthTokens;
    if (parsed && typeof parsed.token === "string" && typeof parsed.refreshToken === "string") {
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn("[auth] corrupt token blob in localStorage; discarding:", err);
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* nothing more we can do */ }
    return null;
  }
}

function writeToLocalStorage(tokens: AuthTokens): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch (err) {
    console.warn("[auth] localStorage write failed:", err);
  }
}

function removeFromLocalStorage(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("[auth] localStorage remove failed:", err);
  }
}

export function setAuthTokens(tokens: AuthTokens): void {
  memoryTokens = tokens;
  writeToLocalStorage(tokens);
  if (secureStorage) {
    Promise.resolve(secureStorage.write(tokens)).catch((err) => {
      console.warn("[auth] secure storage write failed:", err);
    });
  }
}

export function getAuthTokens(): AuthTokens | null {
  if (memoryTokens) return memoryTokens;
  const fromLs = readFromLocalStorage();
  if (fromLs) {
    memoryTokens = fromLs;
    return fromLs;
  }
  return null;
}

export function getAccessToken(): string | null {
  return getAuthTokens()?.token ?? null;
}

export async function hydrateAuthTokensFromSecureStorage(): Promise<AuthTokens | null> {
  if (!secureStorage) return getAuthTokens();
  try {
    const stored = await Promise.resolve(secureStorage.read());
    if (stored && stored.token && stored.refreshToken) {
      memoryTokens = stored;
      return stored;
    }
  } catch (err) {
    console.warn("[auth] secure storage read failed:", err);
  }
  return memoryTokens;
}

export function clearAuthTokens(reason: AuthClearedReason = "manual"): void {
  memoryTokens = null;
  removeFromLocalStorage();
  if (secureStorage) {
    Promise.resolve(secureStorage.clear()).catch((err) => {
      console.warn("[auth] secure storage clear failed:", err);
    });
  }
  for (const handler of authClearedHandlers) {
    try {
      handler(reason);
    } catch (err) {
      console.error("[auth] onAuthCleared handler threw:", err);
    }
  }
}

export function onAuthCleared(handler: (reason: AuthClearedReason) => void): () => void {
  authClearedHandlers.add(handler);
  return () => authClearedHandlers.delete(handler);
}

/**
 * Install a redirect on forced sign-out so REFRESH_TOKEN_REPLAY (and other
 * non-manual auth wipes) deterministically navigates the user to a sign-in
 * surface. Designed to be called once from each web app's entrypoint.
 */
export function installAuthClearedRedirect(loginUrl = "/api/login"): () => void {
  return onAuthCleared((reason) => {
    if (reason === "manual") return;
    if (typeof window === "undefined") return;
    try {
      // Stash the page the user was on so the OIDC callback can deep-link
      // them back after a successful sign-in instead of dumping them at /.
      recordSessionReturnPath();
      window.location.assign(withReturnToQuery(loginUrl));
    } catch (err) {
      console.error("[auth] redirect to login failed:", err);
    }
  });
}

function tokenIsNearExpiry(tokens: AuthTokens, now = Date.now()): boolean {
  const expiresAt = Date.parse(tokens.expiresAt);
  if (Number.isNaN(expiresAt)) return false;
  return expiresAt - now <= REFRESH_LEAD_MS;
}

/**
 * Rotate the refresh token. Concurrent callers share the in-flight promise
 * so we only spend one rotation per window.
 */
export async function refreshAccessToken(): Promise<AuthTokens | null> {
  if (inFlightRefresh) return inFlightRefresh;

  const current = getAuthTokens();
  if (!current?.refreshToken) {
    clearAuthTokens("no_refresh_token");
    return null;
  }

  inFlightRefresh = (async (): Promise<AuthTokens | null> => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          code?: string;
          error?: string;
          message?: string;
        };
        if (body.code === "REFRESH_TOKEN_REPLAY") {
          clearAuthTokens("refresh_replay");
          throw new ApiError(
            body.message ?? body.error ?? "Refresh token replay detected",
            res.status,
            body.code,
          );
        }
        if (res.status === 401) {
          clearAuthTokens("refresh_invalid");
        }
        throw new ApiError(
          body.message ?? body.error ?? `Refresh failed (${res.status})`,
          res.status,
          body.code,
        );
      }

      const json = (await res.json()) as { data?: AuthTokens } | AuthTokens;
      const tokens = (json as { data?: AuthTokens }).data ?? (json as AuthTokens);
      if (!tokens?.token || !tokens.refreshToken) {
        throw new ApiError("Malformed refresh response", 500);
      }
      setAuthTokens(tokens);
      return tokens;
    } finally {
      inFlightRefresh = null;
    }
  })();

  return inFlightRefresh;
}

export interface ApiFetchOptions extends RequestInit {
  retries?: number;
  retryDelayMs?: number;
  signal?: AbortSignal;
  /** Skip silent-refresh / bearer-token plumbing (used internally). */
  skipAuth?: boolean;
}

function isRefreshUrl(path: string): boolean {
  return path === "/auth/refresh" || path.endsWith("/auth/refresh");
}

export async function apiFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
  const { retries = 2, retryDelayMs = 500, skipAuth, ...fetchOptions } = options ?? {};

  // Pre-emptive refresh inside the lead window. Failures fall through and
  // the actual request will surface the real auth error.
  if (!skipAuth && !isRefreshUrl(path)) {
    const tokens = getAuthTokens();
    if (tokens && tokenIsNearExpiry(tokens)) {
      try {
        await refreshAccessToken();
      } catch (err) {
        if (err instanceof ApiError && err.code === "REFRESH_TOKEN_REPLAY") throw err;
        // any other refresh failure: continue with the existing token
      }
    }
  }

  let lastErr: unknown;
  let didRetryAfterRefresh = false;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      const backoff = retryDelayMs * Math.pow(2, attempt - 1);
      await sleep(backoff);
    }
    try {
      const tokens = skipAuth ? null : getAuthTokens();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(fetchOptions?.headers as Record<string, string> | undefined),
      };
      if (tokens?.token && !("Authorization" in headers) && !("authorization" in headers)) {
        headers["Authorization"] = `Bearer ${tokens.token}`;
      } else if (!tokens?.token && !skipAuth) {
        // Cookie-session fallback: no bearer token means the browser will send
        // the session cookie, which requires CSRF protection.
        Object.assign(headers, csrfHeaders());
      }

      const res = await fetch(`${API_BASE}${path}`, {
        ...fetchOptions,
        headers,
        credentials: "include",
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
          code?: string;
        };

        if (res.status === 401) {
          const code = detectSessionRevocationCode(errBody);
          if (code) {
            const message = extractServerMessage(errBody) ?? undefined;
            notifySessionRevoked(code, { ...(message !== undefined ? { message } : {}) });
          }
        }
        const apiErr = new ApiError(
          errBody.message || errBody.error || `HTTP ${res.status}`,
          res.status,
          errBody.code,
        );

        if (apiErr.code === "REFRESH_TOKEN_REPLAY") {
          clearAuthTokens("refresh_replay");
          throw apiErr;
        }

        if (
          !skipAuth &&
          !isRefreshUrl(path) &&
          res.status === 401 &&
          !didRetryAfterRefresh &&
          getAuthTokens()?.refreshToken
        ) {
          didRetryAfterRefresh = true;
          let refreshed: AuthTokens | null = null;
          try {
            refreshed = await refreshAccessToken();
          } catch (err) {
            if (err instanceof ApiError && err.code === "REFRESH_TOKEN_REPLAY") throw err;
            // fall through and surface the original 401 below
          }
          if (refreshed) continue;
        }

        if (attempt < retries && isTransientError(apiErr)) {
          lastErr = apiErr;
          continue;
        }
        throw apiErr;
      }
      if (res.status === 204) return undefined as T;
      return res.json() as Promise<T>;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (attempt < retries && isTransientError(err)) {
        lastErr = err;
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

export interface GraphQLRequestOptions {
  retries?: number;
  retryDelayMs?: number;
  signal?: AbortSignal;
}

export async function graphqlRequest<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
  options?: GraphQLRequestOptions,
): Promise<T> {
  const { retries = 2, retryDelayMs = 500, signal } = options ?? {};

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      const backoff = retryDelayMs * Math.pow(2, attempt - 1);
      await sleep(backoff);
    }
    try {
      const tokens = getAuthTokens();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (tokens?.token) headers["Authorization"] = `Bearer ${tokens.token}`;

      const res = await fetch(`${API_BASE}/graphql`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ query, variables }),
        signal: signal ?? null,
      });
      if (!res.ok) {
        const apiErr = new ApiError(`GraphQL HTTP ${res.status}`, res.status);
        if (attempt < retries && isTransientError(apiErr)) {
          lastErr = apiErr;
          continue;
        }
        throw apiErr;
      }
      const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
      if (json.errors && json.errors.length > 0) {
        throw new ApiError(json.errors.map(e => e.message).join("; "), 200);
      }
      return json.data as T;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (attempt < retries && isTransientError(err)) {
        lastErr = err;
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}
