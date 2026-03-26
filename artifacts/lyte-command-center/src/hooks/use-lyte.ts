import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as mockDb from "../lib/mock-data";

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- SIGNALS ---
export function useSignals() {
  return useQuery({
    queryKey: ["signals"],
    queryFn: async () => {
      await delay(400);
      return [...mockDb.signals].sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
    },
  });
}

export function useUpdateSignal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await delay(300);
      const index = mockDb.signals.findIndex((s) => s.id === id);
      if (index !== -1) mockDb.signals[index].status = status;
      return mockDb.signals[index];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["signals"] }),
  });
}

// --- INCIDENTS ---
export function useIncidents() {
  return useQuery({
    queryKey: ["incidents"],
    queryFn: async () => {
      await delay(400);
      return [...mockDb.incidents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      await delay(500);
      const newInc = {
        id: Math.floor(Math.random() * 10000),
        status: "open",
        createdAt: new Date().toISOString(),
        ...data,
      };
      mockDb.incidents.push(newInc);
      return newInc;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incidents"] }),
  });
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & any) => {
      await delay(400);
      const index = mockDb.incidents.findIndex((i) => i.id === id);
      if (index !== -1) {
        mockDb.incidents[index] = { ...mockDb.incidents[index], ...data };
      }
      return mockDb.incidents[index];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incidents"] }),
  });
}

// --- RECOMMENDATIONS ---
export function useRecommendations() {
  return useQuery({
    queryKey: ["recommendations"],
    queryFn: async () => {
      await delay(350);
      return [...mockDb.recommendations];
    },
  });
}

export function useUpdateRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await delay(300);
      const index = mockDb.recommendations.findIndex((r) => r.id === id);
      if (index !== -1) mockDb.recommendations[index].status = status;
      return mockDb.recommendations[index];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recommendations"] }),
  });
}

// --- PLAYBOOKS ---
export function usePlaybooks() {
  return useQuery({
    queryKey: ["playbooks"],
    queryFn: async () => {
      await delay(200);
      return [...mockDb.playbooks];
    },
  });
}

// --- COMMAND CARDS ---
export function useCommandCards() {
  return useQuery({
    queryKey: ["commandCards"],
    queryFn: async () => {
      await delay(250);
      return [...mockDb.commandCards];
    },
  });
}

// --- EXECUTIVE SUMMARY ---
export function useExecutiveSummary() {
  return useQuery({
    queryKey: ["executiveSummary"],
    queryFn: async () => {
      await delay(600);
      const openIncidents = mockDb.incidents.filter((i) => !["resolved", "closed"].includes(i.status));
      const criticalSignals = mockDb.signals.filter((s) => s.severity === "critical" && s.status === "new");
      const pendingRecs = mockDb.recommendations.filter((r) => r.status === "suggested");
      
      return {
        totalSignals: mockDb.signals.length,
        criticalSignalCount: criticalSignals.length,
        openIncidentCount: openIncidents.length,
        pendingRecommendationCount: pendingRecs.length,
        recentSignals: [...mockDb.signals].sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()).slice(0, 5),
        recentIncidents: [...mockDb.incidents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
        chartData: Array.from({ length: 7 }).map((_, i) => ({
          name: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
          signals: Math.floor(Math.random() * 50) + 10,
          incidents: Math.floor(Math.random() * 5)
        }))
      };
    },
  });
}
