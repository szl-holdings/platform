import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

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
};

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      return await api.campaigns.list() as Campaign[];
    }
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const numId = parseInt(id, 10);
      if (isNaN(numId)) throw new Error("Invalid campaign ID");
      return await api.campaigns.get(numId) as Campaign;
    }
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Campaign>) => {
      return await api.campaigns.create({
        name: data.name || "Untitled",
        clientName: data.client || data.clientName || "Unknown",
        category: data.category || "commercial",
        status: data.status || "concept",
        deadline: data.deadline,
        description: data.description || "",
        metadata: data.metadata,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] })
  });
}
