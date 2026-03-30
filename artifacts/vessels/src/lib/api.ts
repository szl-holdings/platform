import { apiFetch } from "@workspace/shared-ui";

export const api = {
  fleets: {
    list: () => apiFetch<any[]>("/vessels/fleets"),
    get: (id: number) => apiFetch<any>(`/vessels/fleets/${id}`),
    create: (data: any) => apiFetch<any>("/vessels/fleets", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch<any>(`/vessels/fleets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<void>(`/vessels/fleets/${id}`, { method: "DELETE" }),
  },
  vessels: {
    list: () => apiFetch<any[]>("/vessels"),
    get: (id: number) => apiFetch<any>(`/vessels/${id}`),
    create: (data: any) => apiFetch<any>("/vessels", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch<any>(`/vessels/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<void>(`/vessels/${id}`, { method: "DELETE" }),
    positions: (id: number) => apiFetch<any[]>(`/vessels/${id}/positions`),
    cargo: (id: number) => apiFetch<any[]>(`/vessels/${id}/cargo`),
    routes: (id: number) => apiFetch<any[]>(`/vessels/${id}/routes`),
  },
  routes: {
    list: () => apiFetch<any[]>("/vessels/routes/all"),
    create: (data: any) => apiFetch<any>("/vessels/routes", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch<any>(`/vessels/routes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<void>(`/vessels/routes/${id}`, { method: "DELETE" }),
  },
  alertRules: {
    list: () => apiFetch<any[]>("/vessels/alert-rules/all"),
    create: (data: any) => apiFetch<any>("/vessels/alert-rules", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiFetch<any>(`/vessels/alert-rules/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<void>(`/vessels/alert-rules/${id}`, { method: "DELETE" }),
  },
  alerts: {
    list: () => apiFetch<any[]>("/vessels/alerts/all"),
  },
  weather: {
    snapshots: (routeId?: number) => apiFetch<any[]>(`/vessels/weather/snapshots${routeId ? `?routeId=${routeId}` : ""}`),
  },
  simulations: {
    list: () => apiFetch<any[]>("/vessels/simulations/all"),
    get: (id: number) => apiFetch<any>(`/vessels/simulations/${id}`),
    create: (data: any) => apiFetch<any>("/vessels/simulations", { method: "POST", body: JSON.stringify(data) }),
  },
  live: {
    chokepoints: () => apiFetch<any>("/vessels/live/chokepoints"),
    geopoliticalEvents: () => apiFetch<any>("/vessels/live/geopolitical-events"),
    portCongestion: () => apiFetch<any>("/vessels/live/port-congestion"),
    marineWeather: (lat?: number, lon?: number) =>
      apiFetch<any>(`/vessels/live/weather-marine${lat != null && lon != null ? `?lat=${lat}&lon=${lon}` : ""}`),
  },
};
