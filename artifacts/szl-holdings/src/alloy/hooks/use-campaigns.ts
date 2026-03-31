import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { creativeApi, type DreamscapeCampaign } from "@/alloy/lib/creative-api";

export type Campaign = {
  id: number;
  name: string;
  clientName?: string;
  client?: string;
  category: string;
  status: string;
  deadline?: string;
  description?: string;
  targetAudience?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  progress?: number;
  budget?: string;
  director?: string;
  kpis?: { label: string; value: string; trend?: string }[];
};

function toCampaign(c: DreamscapeCampaign): Campaign {
  const meta = (c.metadata || {}) as Record<string, unknown>;
  return {
    id: c.id,
    name: c.name,
    clientName: c.clientName,
    client: (meta.client as string) ?? c.clientName,
    category: c.category,
    status: c.status,
    deadline: c.deadline,
    description: c.description,
    targetAudience: c.targetAudience,
    metadata: c.metadata,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    progress: (meta.progress as number) ?? 0,
    budget: (meta.budget as string) ?? undefined,
    director: (meta.director as string) ?? undefined,
    kpis: (meta.kpis as Campaign["kpis"]) ?? [],
  };
}

export function useCampaigns() {
  return useQuery({
    queryKey: ["creative-campaigns"],
    queryFn: async () => {
      const rows = await creativeApi.campaigns.list();
      return rows.map(toCampaign);
    },
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ["creative-campaign", id],
    queryFn: async () => {
      const numId = parseInt(id, 10);
      if (isNaN(numId)) throw new Error("Invalid campaign ID");
      const row = await creativeApi.campaigns.get(numId);
      return toCampaign(row);
    },
    enabled: !!id && !isNaN(parseInt(id, 10)),
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Campaign>) => {
      const row = await creativeApi.campaigns.create({
        name: data.name || "Untitled",
        clientName: data.client || data.clientName || "Unknown",
        category: data.category || "commercial",
        status: data.status || "concept",
        deadline: data.deadline || new Date(Date.now() + 30 * 86400000).toISOString(),
        metadata: {
          progress: 0,
          budget: data.budget || "$0",
          director: data.director || "",
          kpis: data.kpis || [],
          client: data.client || data.clientName || "Unknown",
        },
      });
      return toCampaign(row);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["creative-campaigns"] }),
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Campaign> & { id: number }) => {
      const { id, ...rest } = data;
      const existing = await creativeApi.campaigns.get(id);
      const existingMeta = (existing.metadata || {}) as Record<string, unknown>;
      const updatedMeta = {
        ...existingMeta,
        ...(rest.progress !== undefined ? { progress: rest.progress } : {}),
        ...(rest.budget !== undefined ? { budget: rest.budget } : {}),
        ...(rest.director !== undefined ? { director: rest.director } : {}),
        ...(rest.kpis !== undefined ? { kpis: rest.kpis } : {}),
        ...(rest.client !== undefined ? { client: rest.client } : {}),
      };
      const row = await creativeApi.campaigns.update(id, {
        name: rest.name,
        clientName: rest.clientName || rest.client,
        category: rest.category,
        status: rest.status,
        deadline: rest.deadline,
        description: rest.description,
        metadata: updatedMeta,
      });
      return toCampaign(row);
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ["creative-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["creative-campaign", String(v.id)] });
    },
  });
}
