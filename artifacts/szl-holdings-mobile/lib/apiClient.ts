import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { AUTH_TOKEN_KEY } from "@/context/AuthContext";

const APP_MODE = (process.env.EXPO_PUBLIC_APP_MODE ?? "sandbox").toLowerCase() as "demo" | "sandbox" | "production";
const SANDBOX_API_BASE = (process.env.EXPO_PUBLIC_SANDBOX_API_BASE ?? "").replace(/\/$/, "");

export function getApiBase(): string {
  if (APP_MODE === "sandbox" && SANDBOX_API_BASE) return SANDBOX_API_BASE;
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
}

const DEMO_WRITE_WHITELIST = ["/api/auth", "/api/oidc", "/api/admin/seed/reset-demo"];
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const MOBILE_DEMO_FIXTURES: Record<string, unknown> = {
  "/api/vessels": {
    vessels: [
      { id: "V001", name: "MSC Horizon", status: "underway", flag: "Panama", type: "Container", lat: 25.77, lng: -80.19, speed: 14.2, heading: 320, eta: "2025-05-02T08:00:00Z" },
      { id: "V002", name: "Atlantic Guardian", status: "anchored", flag: "Liberia", type: "Tanker", lat: 36.14, lng: -5.35, speed: 0, heading: 0, eta: "2025-04-30T14:00:00Z" },
      { id: "V003", name: "Nordic Star", status: "docked", flag: "Norway", type: "Bulk Carrier", lat: 59.91, lng: 10.73, speed: 0, heading: 180, eta: null },
    ],
    total: 3,
  },
  "/api/aegis/alerts": {
    alerts: [
      { id: "A001", severity: "high", title: "Geo-fence breach", description: "MSC Horizon entered exclusion zone", createdAt: "2025-04-18T06:30:00Z", resolved: false },
      { id: "A002", severity: "medium", title: "AIS signal lost", description: "Nordic Star AIS transponder offline for 3h", createdAt: "2025-04-17T22:15:00Z", resolved: false },
    ],
    total: 2,
  },
  "/api/notifications": {
    notifications: [
      { id: "N001", type: "alert", title: "System demo mode active", read: false, createdAt: "2025-04-18T00:00:00Z" },
      { id: "N002", type: "info", title: "Vessel ETA updated", read: true, createdAt: "2025-04-17T18:00:00Z" },
    ],
    unread: 1,
  },
  "/api/dashboard/metrics": {
    vessels: { total: 3, underway: 1, anchored: 1, docked: 1 },
    alerts: { total: 2, high: 1, medium: 1, low: 0 },
    period: "last_24h",
  },
  "/api/healthz": { status: "ok", mode: "demo", timestamp: new Date().toISOString() },
};

function getDemoFixture(path: string): unknown | null {
  const key = Object.keys(MOBILE_DEMO_FIXTURES).find((k) => path === k || path.startsWith(k + "/") || path.startsWith(k + "?"));
  return key ? MOBILE_DEMO_FIXTURES[key] : null;
}

let _cachedToken: string | null = null;

export function getCachedAuthToken(): string | null {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return _cachedToken;
}

export async function getAuthToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    const t = typeof window !== "undefined"
      ? window.localStorage.getItem(AUTH_TOKEN_KEY)
      : null;
    _cachedToken = t;
    return t;
  }
  const t = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  _cachedToken = t;
  return t;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const method = ((init?.method ?? "GET") as string).toUpperCase();
  const isApiPath = path.startsWith("/api/");

  if (APP_MODE === "demo" && isApiPath) {
    if (method === "GET") {
      const fixture = getDemoFixture(path);
      if (fixture !== null) return fixture as T;
      return { demo: true, data: [], items: [], total: 0, message: "No demo data configured for this endpoint." } as unknown as T;
    }
    if (MUTATING_METHODS.has(method) && !DEMO_WRITE_WHITELIST.some((p) => path.startsWith(p))) {
      return { ok: true, demo: true, message: "This is a demo environment. No data was written." } as unknown as T;
    }
  }

  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${getApiBase()}${path}`, { ...init, headers });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

export async function apiFetchRaw(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${getApiBase()}${path}`, { ...init, headers });
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: "GET" });
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: "DELETE" });
}

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const result = await apiFetch<{ data?: T; errors?: unknown[] }>("/api/graphql", {
    method: "POST",
    body: JSON.stringify({ query, variables }),
  });
  if (result.errors?.length) {
    throw new Error(`GraphQL error: ${JSON.stringify(result.errors[0])}`);
  }
  return result.data as T;
}
