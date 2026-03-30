const API_BASE = "/api";

export async function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("szl_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...headers, ...(options?.headers as Record<string, string> || {}) } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || res.statusText);
  }
  return res.json();
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem("szl_token");
}

export async function login(username: string, password: string): Promise<string> {
  const data = await apiFetch<{ token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  localStorage.setItem("szl_token", data.token);
  return data.token;
}

export function logout(): void {
  localStorage.removeItem("szl_token");
}
