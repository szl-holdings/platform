/**
 * Client-side CSRF helpers for SPA / browser applications.
 *
 * Reads the CSRF token from the `csrf_token` cookie (set by the server on any
 * GET request) and exposes it for inclusion in the `X-CSRF-Token` header on
 * mutating requests.
 */

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "../types.js";

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };

/**
 * Reads the CSRF token from the browser cookie jar.
 *
 * Returns `null` when no token is present (e.g. the user has not yet made a
 * GET request to the API).
 */
export function readCsrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(CSRF_COOKIE_NAME.length + 1));
}

/**
 * Returns the headers object that must be merged into every mutating fetch
 * call (`POST`, `PUT`, `PATCH`, `DELETE`).
 *
 * If no token is available the header is omitted — the server will respond
 * with 403 CSRF_TOKEN_MISSING, which the caller should handle by first making
 * a GET to `/api/csrf-token`.
 */
export function csrfHeaders(): Record<string, string> {
  const token = readCsrfTokenFromCookie();
  if (!token) return {};
  return { [CSRF_HEADER_NAME]: token };
}

/**
 * Fetches a fresh CSRF token from the server and stores it in the cookie.
 *
 * Call this once on app mount (or after any 403 CSRF_TOKEN_MISSING error)
 * to prime the token before the first mutating request.
 */
export async function fetchAndStoreCsrfToken(
  baseUrl = "/api",
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<string | null> {
  try {
    const res = await fetchFn(`${baseUrl}/csrf-token`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { csrfToken?: string };
    return data.csrfToken ?? null;
  } catch {
    return null;
  }
}
