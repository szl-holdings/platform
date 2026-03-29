import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockDb, delay, type Script, type StoryboardScene, type Voiceover, type Asset, type Review } from "@/lib/mock-db";

// -- SCRIPTS --
export function useScripts(campaignId: string) {
  return useQuery({
    queryKey: ['scripts', campaignId],
    queryFn: async () => {
      await delay(400);
      return mockDb.scripts.filter(s => s.campaignId === campaignId);
    }
  });
}

export function useUpdateScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Script> & { id: string }) => {
      await delay();
      const idx = mockDb.scripts.findIndex(s => s.id === data.id);
      if (idx !== -1) {
        mockDb.scripts[idx] = { ...mockDb.scripts[idx], ...data, updatedAt: new Date().toISOString() };
      }
      return mockDb.scripts[idx];
    },
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ['scripts', variables.campaignId] })
  });
}

// -- STORYBOARDS --
export function useStoryboards(campaignId: string) {
  return useQuery({
    queryKey: ['storyboards', campaignId],
    queryFn: async () => {
      await delay(400);
      return mockDb.storyboards.filter(s => s.campaignId === campaignId).sort((a, b) => a.sceneNumber - b.sceneNumber);
    }
  });
}

export function useCreateStoryboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<StoryboardScene>) => {
      await delay();
      const newScene: StoryboardScene = {
        id: `sb${Date.now()}`,
        campaignId: data.campaignId!,
        sceneNumber: data.sceneNumber || 1,
        shotType: data.shotType || "MS — Medium Shot",
        cameraMovement: data.cameraMovement || "Static",
        visual: data.visual || "",
        dialogue: data.dialogue || "",
        duration: data.duration || "0s",
        thumbnailUrl: data.thumbnailUrl || "",
        talentNotes: data.talentNotes || "",
        lighting: data.lighting || "",
      };
      mockDb.storyboards.push(newScene);
      return newScene;
    },
    onSuccess: (_, v) => queryClient.invalidateQueries({ queryKey: ['storyboards', v.campaignId] })
  });
}

// -- VOICEOVERS --
export function useVoiceovers(campaignId: string) {
  return useQuery({
    queryKey: ['voiceovers', campaignId],
    queryFn: async () => {
      await delay(300);
      return mockDb.voiceovers.filter(v => v.campaignId === campaignId);
    }
  });
}

export function useCreateVoiceover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Voiceover>) => {
      await delay();
      const newVo: Voiceover = {
        id: `v${Date.now()}`,
        campaignId: data.campaignId!,
        name: data.name || "New Voiceover",
        provider: data.provider || "placeholder",
        text: data.text || "",
        status: data.provider === "elevenlabs" ? "generating" : "pending",
      };
      mockDb.voiceovers.push(newVo);
      return newVo;
    },
    onSuccess: (_, v) => queryClient.invalidateQueries({ queryKey: ['voiceovers', v.campaignId] })
  });
}

// -- ASSETS --
export function useAssets(campaignId: string) {
  return useQuery({
    queryKey: ['assets', campaignId],
    queryFn: async () => {
      await delay(500);
      return mockDb.assets.filter(a => a.campaignId === campaignId);
    }
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, campaignId }: { id: string, campaignId: string }) => {
      await delay();
      const idx = mockDb.assets.findIndex(a => a.id === id);
      if (idx !== -1) mockDb.assets.splice(idx, 1);
    },
    onSuccess: (_, v) => queryClient.invalidateQueries({ queryKey: ['assets', v.campaignId] })
  });
}

// -- REVIEWS --
export function useReviews(campaignId: string) {
  return useQuery({
    queryKey: ['reviews', campaignId],
    queryFn: async () => {
      await delay(300);
      return mockDb.reviews.filter(r => r.campaignId === campaignId);
    }
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Review["status"]; campaignId: string }) => {
      await delay();
      const idx = mockDb.reviews.findIndex(r => r.id === id);
      if (idx !== -1) mockDb.reviews[idx].status = status;
    },
    onSuccess: (_, v) => queryClient.invalidateQueries({ queryKey: ['reviews', v.campaignId] })
  });
}
