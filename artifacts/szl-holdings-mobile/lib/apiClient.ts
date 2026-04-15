import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { AUTH_TOKEN_KEY } from "@/context/AuthContext";

export function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
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
