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
  assets: {
    list: (params?: { type?: string; owner?: string; exposureLevel?: string }) => {
      const q = new URLSearchParams();
      if (params?.type) q.set("type", params.type);
      if (params?.owner) q.set("owner", params.owner);
      if (params?.exposureLevel) q.set("exposureLevel", params.exposureLevel);
      return apiFetch<any[]>(`/firestorm/assets${q.toString() ? `?${q}` : ""}`);
    },
    get: (id: number) => apiFetch<any>(`/firestorm/assets/${id}`),
    create: (data: any) => apiFetch<any>("/firestorm/assets", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch<any>(`/firestorm/assets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },
  vulnerabilities: {
    list: (params?: { severity?: string; status?: string; asset?: string }) => {
      const q = new URLSearchParams();
      if (params?.severity) q.set("severity", params.severity);
      if (params?.status) q.set("status", params.status);
      if (params?.asset) q.set("asset", params.asset);
      return apiFetch<any[]>(`/firestorm/vulnerabilities${q.toString() ? `?${q}` : ""}`);
    },
    get: (id: number) => apiFetch<any>(`/firestorm/vulnerabilities/${id}`),
    update: (id: number, data: any) => apiFetch<any>(`/firestorm/vulnerabilities/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },
  workflowActions: {
    list: (entityType?: string, entityId?: number) => {
      const q = new URLSearchParams();
      if (entityType) q.set("entityType", entityType);
      if (entityId) q.set("entityId", String(entityId));
      return apiFetch<any[]>(`/firestorm/workflow-actions${q.toString() ? `?${q}` : ""}`);
    },
    create: (data: any) => apiFetch<any>("/firestorm/workflow-actions", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch<any>(`/firestorm/workflow-actions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  },
  cases: {
    list: (params?: { status?: string; priority?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set("status", params.status);
      if (params?.priority) q.set("priority", params.priority);
      return apiFetch<any[]>(`/firestorm/cases${q.toString() ? `?${q}` : ""}`);
    },
    get: (id: number) => apiFetch<any>(`/firestorm/cases/${id}`),
    create: (data: any) => apiFetch<any>("/firestorm/cases", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch<any>(`/firestorm/cases/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  },
  mitreDetections: {
    list: () => apiFetch<any[]>("/firestorm/mitre-detections"),
    get: (techniqueId: string) => apiFetch<any>(`/firestorm/mitre-detections/${techniqueId}`),
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
    certAdvisories: (certId?: string) =>
      apiFetch<any>(`/firestorm/live/cert-advisories${certId ? `?cert=${certId}` : ""}`),
    feedStatus: () => apiFetch<any>("/firestorm/live/feed-status"),
  },
  hardeningControls: {
    list: (params?: { category?: string; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.category) q.set("category", params.category);
      if (params?.status) q.set("status", params.status);
      return apiFetch<any[]>(`/firestorm/hardening-controls${q.toString() ? `?${q}` : ""}`);
    },
    get: (id: number) => apiFetch<any>(`/firestorm/hardening-controls/${id}`),
    update: (id: number, data: any) => apiFetch<any>(`/firestorm/hardening-controls/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    summary: () => apiFetch<any>("/firestorm/hardening-summary"),
  },
  reportsList: {
    list: () => apiFetch<any[]>("/firestorm/reports"),
  },
  ingest: {
    webhook: (payload: any) => apiFetch<any>("/firestorm/ingest/webhook", { method: "POST", body: JSON.stringify(payload) }),
    syslog: (payload: any) => apiFetch<any>("/firestorm/ingest/syslog", { method: "POST", body: JSON.stringify(payload) }),
  },
};
