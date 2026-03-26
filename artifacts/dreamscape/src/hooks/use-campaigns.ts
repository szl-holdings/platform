import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockDb, delay, type Campaign } from "@/lib/mock-db";

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      await delay(600);
      return [...mockDb.campaigns];
    }
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      await delay(300);
      const campaign = mockDb.campaigns.find(c => c.id === id);
      if (!campaign) throw new Error("Campaign not found");
      return campaign;
    }
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Campaign>) => {
      await delay(500);
      const newCampaign: Campaign = {
        id: `c${Date.now()}`,
        name: data.name || "Untitled",
        client: data.client || "Unknown",
        category: data.category || "commercial",
        status: data.status || "concept",
        deadline: data.deadline || new Date().toISOString(),
        progress: 0,
      };
      mockDb.campaigns.push(newCampaign);
      return newCampaign;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] })
  });
}
