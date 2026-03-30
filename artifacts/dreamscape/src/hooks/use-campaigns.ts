import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

const demoCampaigns: Campaign[] = [
  { id: 1, name: "Vertex AI Brand Film", client: "Vertex Technologies", category: "brand_campaign", status: "production", deadline: new Date(Date.now() + 30 * 86400000).toISOString(), progress: 65, budget: "$120K", director: "Marcus Chen", kpis: [{ label: "Views", value: "2.4M", trend: "+18%" }, { label: "Engagement", value: "12.8%", trend: "+3.2%" }], createdAt: new Date(Date.now() - 45 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 2, name: "Nova Product Launch", client: "Nova Dynamics", category: "product_launch", status: "review", deadline: new Date(Date.now() + 14 * 86400000).toISOString(), progress: 82, budget: "$85K", director: "Sarah Kim", kpis: [{ label: "Reach", value: "890K", trend: "+24%" }, { label: "CTR", value: "4.2%", trend: "+1.1%" }], createdAt: new Date(Date.now() - 30 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 3, name: "Meridian Social Campaign", client: "Meridian Group", category: "social_media", status: "concept", deadline: new Date(Date.now() + 60 * 86400000).toISOString(), progress: 15, budget: "$45K", director: "James Park", kpis: [{ label: "Impressions", value: "1.2M", trend: "+8%" }, { label: "Shares", value: "34K", trend: "+12%" }], createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 4, name: "Atlas Documentary Series", client: "Atlas Foundation", category: "video_production", status: "post_production", deadline: new Date(Date.now() + 21 * 86400000).toISOString(), progress: 90, budget: "$200K", director: "Elena Vasquez", kpis: [{ label: "Episodes", value: "6/8", trend: "+2" }, { label: "Runtime", value: "48min", trend: "avg" }], createdAt: new Date(Date.now() - 90 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 5, name: "Pinnacle Commercial Ads", client: "Pinnacle Financial", category: "commercial", status: "published", deadline: new Date(Date.now() - 5 * 86400000).toISOString(), progress: 100, budget: "$65K", director: "David Torres", kpis: [{ label: "Conversions", value: "2.8K", trend: "+32%" }, { label: "ROAS", value: "4.2x", trend: "+0.8x" }], createdAt: new Date(Date.now() - 60 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 6, name: "Summit Event Marketing", client: "Summit Events", category: "event_marketing", status: "production", deadline: new Date(Date.now() + 45 * 86400000).toISOString(), progress: 40, budget: "$95K", director: "Rachel Wong", kpis: [{ label: "Registrations", value: "1.4K", trend: "+22%" }, { label: "Sponsors", value: "18", trend: "+4" }], createdAt: new Date(Date.now() - 20 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 7, name: "Luminary Brand Story", client: "Luminary Labs", category: "brand_story", status: "review", deadline: new Date(Date.now() + 10 * 86400000).toISOString(), progress: 75, budget: "$110K", director: "Ana Petrov", kpis: [{ label: "Storyboards", value: "12/14", trend: "+3" }, { label: "Approval", value: "86%", trend: "+5%" }], createdAt: new Date(Date.now() - 35 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 8, name: "Zenith Product Teaser", client: "Zenith Corp", category: "product_launch", status: "production", deadline: new Date(Date.now() + 18 * 86400000).toISOString(), progress: 55, budget: "$72K", director: "Leo Zhang", kpis: [{ label: "Pre-orders", value: "4.1K", trend: "+45%" }, { label: "Buzz Score", value: "92", trend: "+11" }], createdAt: new Date(Date.now() - 14 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 9, name: "Horizon Annual Gala", client: "Horizon Foundation", category: "event_marketing", status: "concept", deadline: new Date(Date.now() + 90 * 86400000).toISOString(), progress: 8, budget: "$150K", director: "Priya Sharma", kpis: [{ label: "RSVPs", value: "320", trend: "+15%" }, { label: "Sponsors", value: "6", trend: "+2" }], createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), updatedAt: new Date().toISOString() },
];

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => demoCampaigns,
    staleTime: Infinity,
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const numId = parseInt(id, 10);
      return demoCampaigns.find(c => c.id === numId) || demoCampaigns[0];
    },
    staleTime: Infinity,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Campaign>) => {
      const newCampaign: Campaign = {
        id: Date.now(),
        name: data.name || "Untitled",
        client: data.client || data.clientName || "Unknown",
        category: data.category || "commercial",
        status: data.status || "concept",
        deadline: data.deadline || new Date(Date.now() + 30 * 86400000).toISOString(),
        progress: 0,
        budget: "$0",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newCampaign;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] })
  });
}
