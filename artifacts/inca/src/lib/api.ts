const API_BASE = "/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  projects: {
    list: () => apiFetch<any>("/inca/projects"),
    get: (id: string) => apiFetch<any>(`/inca/projects/${id}`),
  },
  experiments: {
    list: () => apiFetch<any>("/inca/experiments"),
    getForProject: (projectId: string) => apiFetch<any>(`/inca/projects/${projectId}/experiments`),
  },
  models: {
    list: () => apiFetch<any>("/inca/models"),
    getForProject: (projectId: string) => apiFetch<any>(`/inca/projects/${projectId}/models`),
  },
  insights: {
    list: () => apiFetch<any>("/inca/insights"),
  },
  dashboard: {
    summary: () => apiFetch<any>("/inca/dashboard"),
  },
};
