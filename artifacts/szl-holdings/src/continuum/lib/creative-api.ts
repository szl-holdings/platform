import { apiFetch, type PaginatedResponse } from '@szl-holdings/shared-ui/api-fetch';

async function apiFetchList<T>(path: string): Promise<T[]> {
  const json = await apiFetch<T[] | PaginatedResponse<T>>(path);
  if (json && typeof json === 'object' && 'data' in json && 'meta' in json) {
    return (json as PaginatedResponse<T>).data;
  }
  return json as T[];
}

export interface ContinuumCampaign {
  id: number;
  name: string;
  description?: string;
  clientName?: string;
  status: string;
  category: string;
  targetAudience?: string;
  deadline?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ContinuumScript {
  id: number;
  campaignId: number;
  title: string;
  content: string;
  version: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContinuumStoryboard {
  id: number;
  campaignId: number;
  scriptId?: number;
  title: string;
  description?: string;
  sceneNumber: number;
  visualDescription?: string;
  visual?: string;
  dialogue?: string;
  duration?: string;
  shotType?: string;
  thumbnailUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ContinuumVoiceAsset {
  id: number;
  campaignId: number;
  name: string;
  voiceId?: string;
  provider: string;
  text?: string;
  audioUrl?: string;
  duration?: string;
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ContinuumCampaignAsset {
  id: number;
  campaignId: number;
  name: string;
  type: string;
  category?: string;
  fileUrl?: string;
  url?: string;
  thumbnailUrl?: string;
  fileSize?: number;
  size?: string;
  resolution?: string;
  codec?: string;
  mimeType?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ContinuumReview {
  id: number;
  projectId?: number;
  campaignId?: number;
  assetId?: number;
  reviewerName: string;
  reviewer?: string;
  reviewerRole?: string;
  comment: string;
  status: string;
  department?: string;
  round?: number;
  date?: string;
  createdAt: string;
}

export const creativeApi = {
  campaigns: {
    list: () => apiFetchList<ContinuumCampaign>('/dreamscape/campaigns'),
    get: (id: number) => apiFetch<ContinuumCampaign>(`/dreamscape/campaigns/${id}`),
    create: (data: Partial<ContinuumCampaign>) =>
      apiFetch<ContinuumCampaign>('/dreamscape/campaigns', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<ContinuumCampaign>) =>
      apiFetch<ContinuumCampaign>(`/dreamscape/campaigns/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      apiFetch<{ deleted: boolean }>(`/dreamscape/campaigns/${id}`, { method: 'DELETE' }),
  },
  scripts: {
    listForCampaign: (campaignId: number) =>
      apiFetch<ContinuumScript[]>(`/dreamscape/campaigns/${campaignId}/scripts`),
    get: (id: number) => apiFetch<ContinuumScript>(`/dreamscape/scripts/${id}`),
    create: (data: Partial<ContinuumScript>) =>
      apiFetch<ContinuumScript>('/dreamscape/scripts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<ContinuumScript>) =>
      apiFetch<ContinuumScript>(`/dreamscape/scripts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      apiFetch<{ deleted: boolean }>(`/dreamscape/scripts/${id}`, { method: 'DELETE' }),
  },
  storyboards: {
    listForCampaign: (campaignId: number) =>
      apiFetch<ContinuumStoryboard[]>(`/dreamscape/campaigns/${campaignId}/storyboards`),
    create: (data: Partial<ContinuumStoryboard>) =>
      apiFetch<ContinuumStoryboard>('/dreamscape/storyboards', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<ContinuumStoryboard>) =>
      apiFetch<ContinuumStoryboard>(`/dreamscape/storyboards/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      apiFetch<{ deleted: boolean }>(`/dreamscape/storyboards/${id}`, { method: 'DELETE' }),
  },
  voiceAssets: {
    listForCampaign: (campaignId: number) =>
      apiFetch<ContinuumVoiceAsset[]>(`/dreamscape/campaigns/${campaignId}/voice-assets`),
    create: (data: Partial<ContinuumVoiceAsset>) =>
      apiFetch<ContinuumVoiceAsset>('/dreamscape/voice-assets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<ContinuumVoiceAsset>) =>
      apiFetch<ContinuumVoiceAsset>(`/dreamscape/voice-assets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      apiFetch<{ deleted: boolean }>(`/dreamscape/voice-assets/${id}`, { method: 'DELETE' }),
  },
  campaignAssets: {
    listForCampaign: (campaignId: number) =>
      apiFetch<ContinuumCampaignAsset[]>(`/dreamscape/campaigns/${campaignId}/assets`),
    create: (data: Partial<ContinuumCampaignAsset>) =>
      apiFetch<ContinuumCampaignAsset>('/dreamscape/campaign-assets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      apiFetch<{ deleted: boolean }>(`/dreamscape/campaign-assets/${id}`, { method: 'DELETE' }),
  },
  reviews: {
    listForCampaign: (campaignId: number) =>
      apiFetch<ContinuumReview[]>(`/dreamscape/campaigns/${campaignId}/reviews`),
    create: (data: Partial<ContinuumReview>) =>
      apiFetch<ContinuumReview>('/dreamscape/reviews', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<ContinuumReview>) =>
      apiFetch<ContinuumReview>(`/dreamscape/reviews/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      apiFetch<{ deleted: boolean }>(`/dreamscape/reviews/${id}`, { method: 'DELETE' }),
  },
};
