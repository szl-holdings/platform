import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiFetch,
  ApiError,
  clearAuthTokens,
  getAccessToken,
  getAuthTokens,
  installAuthClearedRedirect,
  onAuthCleared,
  refreshAccessToken,
  setAuthTokens,
} from "../../lib/shared-ui/src/api-fetch";

const FIVE_MIN = 5 * 60 * 1000;

function isoFromNow(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("api-fetch silent refresh", () => {
  beforeEach(() => {
    clearAuthTokens();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearAuthTokens();
    window.localStorage.clear();
  });

  it("attaches Authorization header when an access token is stored", async () => {
    setAuthTokens({
      token: "tok-1",
      refreshToken: "rt-1",
      expiresAt: isoFromNow(60 * 60 * 1000),
      refreshTokenExpiresAt: isoFromNow(7 * 24 * 60 * 60 * 1000),
    });

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonResponse({ ok: true }));

    await apiFetch("/lyte/dashboard");

    const init = fetchSpy.mock.calls[0]![1]!;
    expect((init.headers as Record<string, string>)["Authorization"]).toBe("Bearer tok-1");
  });

  it("preemptively refreshes when the token is within 5 minutes of expiry", async () => {
    setAuthTokens({
      token: "tok-old",
      refreshToken: "rt-old",
      expiresAt: isoFromNow(FIVE_MIN - 1_000),
      refreshTokenExpiresAt: isoFromNow(7 * 24 * 60 * 60 * 1000),
    });

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          token: "tok-new",
          refreshToken: "rt-new",
          expiresAt: isoFromNow(60 * 60 * 1000),
          refreshTokenExpiresAt: isoFromNow(7 * 24 * 60 * 60 * 1000),
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    await apiFetch("/lyte/dashboard");

    expect(fetchSpy.mock.calls[0]![0]).toBe("/api/auth/refresh");
    const headers = fetchSpy.mock.calls[1]![1]!.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer tok-new");
    expect(getAccessToken()).toBe("tok-new");
  });

  it("retries the original request once after a 401 + successful refresh", async () => {
    setAuthTokens({
      token: "tok-stale",
      refreshToken: "rt-1",
      expiresAt: isoFromNow(60 * 60 * 1000),
      refreshTokenExpiresAt: isoFromNow(7 * 24 * 60 * 60 * 1000),
    });

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ error: "expired", code: "TOKEN_EXPIRED" }, 401))
      .mockResolvedValueOnce(
        jsonResponse({
          token: "tok-fresh",
          refreshToken: "rt-2",
          expiresAt: isoFromNow(60 * 60 * 1000),
          refreshTokenExpiresAt: isoFromNow(7 * 24 * 60 * 60 * 1000),
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true, retried: true }));

    const result = await apiFetch<{ ok: boolean; retried: boolean }>("/lyte/dashboard");

    expect(result).toEqual({ ok: true, retried: true });
    expect(fetchSpy.mock.calls.length).toBe(3);
    expect(fetchSpy.mock.calls[1]![0]).toBe("/api/auth/refresh");
    const retryHeaders = fetchSpy.mock.calls[2]![1]!.headers as Record<string, string>;
    expect(retryHeaders["Authorization"]).toBe("Bearer tok-fresh");
    expect(getAuthTokens()?.refreshToken).toBe("rt-2");
  });

  it("wipes credentials and notifies subscribers on REFRESH_TOKEN_REPLAY", async () => {
    setAuthTokens({
      token: "tok-1",
      refreshToken: "rt-stolen",
      expiresAt: isoFromNow(60 * 60 * 1000),
      refreshTokenExpiresAt: isoFromNow(7 * 24 * 60 * 60 * 1000),
    });

    const reasons: string[] = [];
    const unsubscribe = onAuthCleared((reason) => reasons.push(reason));

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse(
        { code: "REFRESH_TOKEN_REPLAY", message: "Refresh token replay detected. All sessions revoked." },
        401,
      ),
    );

    await expect(refreshAccessToken()).rejects.toBeInstanceOf(ApiError);

    expect(getAccessToken()).toBeNull();
    expect(window.localStorage.getItem("szl_auth_tokens")).toBeNull();
    expect(reasons).toContain("refresh_replay");

    unsubscribe();
  });

  it("forces a redirect to login when installAuthClearedRedirect is registered", async () => {
    setAuthTokens({
      token: "tok-1",
      refreshToken: "rt-1",
      expiresAt: isoFromNow(60 * 60 * 1000),
      refreshTokenExpiresAt: isoFromNow(7 * 24 * 60 * 60 * 1000),
    });

    const assignSpy = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, assign: assignSpy },
    });

    const unsubscribe = installAuthClearedRedirect("/api/login");

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse({ code: "REFRESH_TOKEN_REPLAY", message: "replay" }, 401),
    );

    await expect(apiFetch("/lyte/dashboard")).rejects.toMatchObject({ code: "REFRESH_TOKEN_REPLAY" });
    expect(assignSpy).toHaveBeenCalledWith("/api/login");

    // Manual clears must NOT redirect — only forced sign-outs do.
    assignSpy.mockClear();
    setAuthTokens({
      token: "tok-2",
      refreshToken: "rt-2",
      expiresAt: isoFromNow(60 * 60 * 1000),
      refreshTokenExpiresAt: isoFromNow(7 * 24 * 60 * 60 * 1000),
    });
    clearAuthTokens("manual");
    expect(assignSpy).not.toHaveBeenCalled();

    unsubscribe();
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
  });

  it("treats REFRESH_TOKEN_REPLAY on any endpoint as a forced sign-out", async () => {
    setAuthTokens({
      token: "tok-1",
      refreshToken: "rt-1",
      expiresAt: isoFromNow(60 * 60 * 1000),
      refreshTokenExpiresAt: isoFromNow(7 * 24 * 60 * 60 * 1000),
    });

    const reasons: string[] = [];
    const unsubscribe = onAuthCleared((reason) => reasons.push(reason));

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse({ code: "REFRESH_TOKEN_REPLAY", error: "replay" }, 401),
    );

    await expect(apiFetch("/lyte/dashboard")).rejects.toMatchObject({ code: "REFRESH_TOKEN_REPLAY" });

    expect(getAccessToken()).toBeNull();
    expect(reasons).toContain("refresh_replay");
    unsubscribe();
  });
});
