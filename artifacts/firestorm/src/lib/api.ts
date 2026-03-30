import { apiFetch } from "@workspace/shared-ui";

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
  incidents: {
    list: () => apiFetch<any[]>("/firestorm/incidents"),
    get: (id: number) => apiFetch<any>(`/firestorm/incidents/${id}`),
    create: (data: any) => apiFetch<any>("/firestorm/incidents", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch<any>(`/firestorm/incidents/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<void>(`/firestorm/incidents/${id}`, { method: "DELETE" }),
  },
  compliance: {
    list: (framework?: string) => apiFetch<any[]>(`/firestorm/compliance${framework ? `?framework=${framework}` : ""}`),
  },
  alerts: {
    list: (status?: string) => apiFetch<any[]>(`/firestorm/alerts${status ? `?status=${status}` : ""}`),
    create: (data: any) => apiFetch<any>("/firestorm/alerts", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch<any>(`/firestorm/alerts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },
  socDashboard: {
    get: () => apiFetch<any>("/firestorm/soc-dashboard"),
  },
  cves: {
    list: (keyword?: string) => apiFetch<any[]>(`/firestorm/cves${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ""}`),
  },
  live: {
    nvdCves: (severity?: string, keyword?: string, limit?: number) => {
      const params = new URLSearchParams();
      if (severity) params.set("severity", severity);
      if (keyword) params.set("keyword", keyword);
      if (limit) params.set("limit", String(limit));
      return apiFetch<any>(`/firestorm/live/nvd-cves${params.toString() ? `?${params}` : ""}`);
    },
    cisaKev: (ransomwareOnly?: boolean, limit?: number) => {
      const params = new URLSearchParams();
      if (ransomwareOnly) params.set("ransomware", "true");
      if (limit) params.set("limit", String(limit));
      return apiFetch<any>(`/firestorm/live/cisa-kev${params.toString() ? `?${params}` : ""}`);
    },
    mitreAttack: (tactic?: string) =>
      apiFetch<any>(`/firestorm/live/mitre-attack${tactic ? `?tactic=${encodeURIComponent(tactic)}` : ""}`),
    threatNews: () => apiFetch<any>("/firestorm/live/threat-news"),
    threatIndicators: (type?: string) =>
      apiFetch<any>(`/firestorm/live/threat-indicators${type ? `?type=${type}` : ""}`),
  },
};
