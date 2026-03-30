import { apiFetch } from "@workspace/shared-ui";

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
