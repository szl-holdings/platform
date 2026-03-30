import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Script = {
  id: number;
  campaignId: number;
  title: string;
  content: string;
  version: number;
  status: "draft" | "review" | "approved" | "final";
  updatedAt?: string;
  notes?: string;
};

export type StoryboardScene = {
  id: number;
  campaignId: number;
  sceneNumber: number;
  title?: string;
  visualDescription?: string;
  visual?: string;
  dialogue?: string;
  duration?: string;
  thumbnailUrl?: string;
  metadata?: Record<string, unknown>;
  shotType?: string;
  cameraMovement?: string;
  lighting?: string;
  talentNotes?: string;
};

export type Voiceover = {
  id: number;
  campaignId: number;
  name: string;
  provider: string;
  text?: string;
  status: string;
  audioUrl?: string;
  duration?: string;
};

export type Asset = {
  id: number;
  campaignId: number;
  name: string;
  type: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  fileSize?: number;
  mimeType?: string;
  tags?: string[];
  category?: string;
  size?: string;
  url?: string;
  codec?: string;
  resolution?: string;
};

export type Review = {
  id: number;
  campaignId: number;
  reviewerName: string;
  reviewerRole?: string;
  comment: string;
  status: "pending" | "approved" | "changes_requested" | "rejected";
  section?: string;
  createdAt?: string;
  round?: number;
  department?: string;
  reviewer?: string;
  role?: string;
  date?: string;
};

export function useScripts(campaignId: string) {
  return useQuery({
    queryKey: ['scripts', campaignId],
    queryFn: async () => {
      const numId = parseInt(campaignId, 10);
      if (isNaN(numId)) return [];
      return await api.scripts.listForCampaign(numId) as Script[];
    }
  });
}

export function useUpdateScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Script> & { id: number; campaignId?: number | string }) => {
      const { id, ...rest } = data;
      return await api.scripts.update(id, rest);
    },
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ['scripts', String(variables.campaignId)] })
  });
}

export function useStoryboards(campaignId: string) {
  return useQuery({
    queryKey: ['storyboards', campaignId],
    queryFn: async () => {
      const numId = parseInt(campaignId, 10);
      if (isNaN(numId)) return [];
      return await api.storyboards.listForCampaign(numId) as StoryboardScene[];
    }
  });
}

export function useCreateStoryboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<StoryboardScene>) => {
      return await api.storyboards.create({
        campaignId: data.campaignId,
        title: data.title || `Scene ${data.sceneNumber || 1}`,
        sceneNumber: data.sceneNumber || 1,
        visualDescription: data.visualDescription || data.visual || "",
        dialogue: data.dialogue || "",
        duration: data.duration || "0s",
        thumbnailUrl: data.thumbnailUrl || "",
      });
    },
    onSuccess: (_, v) => queryClient.invalidateQueries({ queryKey: ['storyboards', String(v.campaignId)] })
  });
}

export function useVoiceovers(campaignId: string) {
  return useQuery({
    queryKey: ['voiceovers', campaignId],
    queryFn: async () => {
      const numId = parseInt(campaignId, 10);
      if (isNaN(numId)) return [];
      return await api.voiceAssets.listForCampaign(numId) as Voiceover[];
    }
  });
}

export function useCreateVoiceover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Voiceover>) => {
      return await api.voiceAssets.create({
        campaignId: data.campaignId,
        name: data.name || "New Voiceover",
        provider: data.provider || "placeholder",
        text: data.text || "",
        status: data.provider === "elevenlabs" ? "generating" : "pending",
      });
    },
    onSuccess: (_, v) => queryClient.invalidateQueries({ queryKey: ['voiceovers', String(v.campaignId)] })
  });
}

export function useAssets(campaignId: string) {
  return useQuery({
    queryKey: ['assets', campaignId],
    queryFn: async () => {
      const numId = parseInt(campaignId, 10);
      if (isNaN(numId)) return [];
      return await api.campaignAssets.listForCampaign(numId) as Asset[];
    }
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, campaignId }: { id: number; campaignId: string }) => {
      return await api.campaignAssets.delete(id);
    },
    onSuccess: (_, v) => queryClient.invalidateQueries({ queryKey: ['assets', v.campaignId] })
  });
}

export function useReviews(campaignId: string) {
  return useQuery({
    queryKey: ['reviews', campaignId],
    queryFn: async () => {
      const numId = parseInt(campaignId, 10);
      if (isNaN(numId)) return [];
      return await api.reviews.listForCampaign(numId) as Review[];
    }
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, campaignId }: { id: number; status: Review["status"]; campaignId: string }) => {
      return await api.reviews.update(id, { status });
    },
    onSuccess: (_, v) => queryClient.invalidateQueries({ queryKey: ['reviews', v.campaignId] })
  });
}
