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
  scenarios: {
    list: () => apiFetch<any[]>("/firestorm/scenarios"),
    get: (id: number) => apiFetch<any>(`/firestorm/scenarios/${id}`),
    create: (data: any) => apiFetch<any>("/firestorm/scenarios", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch<any>(`/firestorm/scenarios/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<void>(`/firestorm/scenarios/${id}`, { method: "DELETE" }),
  },
  assessments: {
    list: () => apiFetch<any[]>("/firestorm/assessments"),
    get: (id: number) => apiFetch<any>(`/firestorm/assessments/${id}`),
    create: (data: any) => apiFetch<any>("/firestorm/assessments", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch<any>(`/firestorm/assessments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<void>(`/firestorm/assessments/${id}`, { method: "DELETE" }),
  },
  simulations: {
    list: () => apiFetch<any[]>("/firestorm/simulations"),
    get: (id: number) => apiFetch<any>(`/firestorm/simulations/${id}`),
    create: (data: any) => apiFetch<any>("/firestorm/simulations", { method: "POST", body: JSON.stringify(data) }),
  },
  findings: {
    list: (assessmentId?: number) => apiFetch<any[]>(`/firestorm/findings${assessmentId ? `?assessmentId=${assessmentId}` : ""}`),
    get: (id: number) => apiFetch<any>(`/firestorm/findings/${id}`),
    create: (data: any) => apiFetch<any>("/firestorm/findings", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch<any>(`/firestorm/findings/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },
  riskScores: {
    list: (assessmentId?: number) => apiFetch<any[]>(`/firestorm/risk-scores${assessmentId ? `?assessmentId=${assessmentId}` : ""}`),
    create: (data: any) => apiFetch<any>("/firestorm/risk-scores", { method: "POST", body: JSON.stringify(data) }),
  },
  reports: {
    get: (assessmentId: number) => apiFetch<any>(`/firestorm/reports/${assessmentId}`),
  },
};
