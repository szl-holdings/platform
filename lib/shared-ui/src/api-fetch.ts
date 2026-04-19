import {
  detectSessionRevocationCode,
  extractServerMessage,
  notifySessionRevoked,
} from "./session-revocation";

const API_BASE = "/api";

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

export interface ApiFetchOptions extends RequestInit {
  retries?: number;
  retryDelayMs?: number;
  signal?: AbortSignal;
}

export async function apiFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
  const { retries = 2, retryDelayMs = 500, ...fetchOptions } = options ?? {};

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      const backoff = retryDelayMs * Math.pow(2, attempt - 1);
      await sleep(backoff);
    }
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        ...fetchOptions,
        headers: {
          "Content-Type": "application/json",
          ...fetchOptions?.headers,
        },
        credentials: "include",
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: "Request failed" }));
        if (res.status === 401) {
          const code = detectSessionRevocationCode(errBody);
          if (code) {
            const message = extractServerMessage(errBody) ?? undefined;
            notifySessionRevoked(code, { message });
          }
        }
        const apiErr = new ApiError(
          (errBody as { error?: string }).error || `HTTP ${res.status}`,
          res.status,
        );
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
      const res = await fetch(`${API_BASE}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ query, variables }),
        signal,
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
