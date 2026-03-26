import { addDays, subDays } from "date-fns";

export const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

export type CampaignStatus = "concept" | "pre_production" | "production" | "post_production" | "review" | "published" | "archived";

export interface Campaign {
  id: string;
  name: string;
  client: string;
  category: string;
  status: CampaignStatus;
  deadline: string;
  progress: number;
}

export interface Script {
  id: string;
  campaignId: string;
  title: string;
  content: string;
  version: number;
  status: "draft" | "review" | "approved" | "final";
  updatedAt: string;
  notes: string;
}

export interface StoryboardScene {
  id: string;
  campaignId: string;
  sceneNumber: number;
  visual: string;
  dialogue: string;
  duration: string;
  thumbnailUrl: string;
}

export interface Voiceover {
  id: string;
  campaignId: string;
  name: string;
  provider: "elevenlabs" | "manual" | "placeholder";
  text: string;
  status: "pending" | "generating" | "ready" | "failed";
}

export interface Asset {
  id: string;
  campaignId: string;
  name: string;
  type: "image" | "video" | "audio" | "document" | "font" | "template";
  size: string;
  url: string;
  tags: string[];
}

export interface Review {
  id: string;
  campaignId: string;
  reviewer: string;
  role: string;
  status: "pending" | "approved" | "changes_requested";
  comment: string;
  date: string;
}

const today = new Date();

export const mockDb = {
  campaigns: [
    {
      id: "c1",
      name: "Nebula Product Launch",
      client: "Aura Tech",
      category: "commercial",
      status: "production",
      deadline: addDays(today, 14).toISOString(),
      progress: 65,
    },
    {
      id: "c2",
      name: "Origin Brand Story",
      client: "SZL Holdings",
      category: "brand_story",
      status: "pre_production",
      deadline: addDays(today, 30).toISOString(),
      progress: 25,
    },
    {
      id: "c3",
      name: "Q4 Social Sprint",
      client: "Vertex",
      category: "social_media",
      status: "review",
      deadline: addDays(today, 2).toISOString(),
      progress: 90,
    }
  ] as Campaign[],

  scripts: [
    {
      id: "s1",
      campaignId: "c1",
      title: "Main Promo 60s",
      content: "INT. DARK ROOM - NIGHT\n\nA single beam of light cuts through the darkness. The NEBULA device floats in the center, spinning slowly.\n\nVOICEOVER\nThey told us to reach for the stars. We decided to bring them to you.\n\nQuick montage of people using the device in various creative setups.",
      version: 3,
      status: "approved",
      updatedAt: subDays(today, 1).toISOString(),
      notes: "Client loved the opening hook. Ensure lighting matches storyboard 2.",
    }
  ] as Script[],

  storyboards: [
    {
      id: "sb1",
      campaignId: "c1",
      sceneNumber: 1,
      visual: "Extreme close up of the device's polished edge, catching a flare of light.",
      dialogue: "(Silence, atmospheric drone begins)",
      duration: "3s",
      thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop"
    },
    {
      id: "sb2",
      campaignId: "c1",
      sceneNumber: 2,
      visual: "Device floating in void, spinning.",
      dialogue: "V.O: They told us to reach for the stars...",
      duration: "5s",
      thumbnailUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop"
    }
  ] as StoryboardScene[],

  voiceovers: [
    {
      id: "v1",
      campaignId: "c1",
      name: "Main Promo - Marcus",
      provider: "elevenlabs",
      text: "They told us to reach for the stars. We decided to bring them to you.",
      status: "ready",
    },
    {
      id: "v2",
      campaignId: "c1",
      name: "Social Snippet - Sarah",
      provider: "placeholder",
      text: "Experience the Nebula today.",
      status: "pending",
    }
  ] as Voiceover[],

  assets: [
    {
      id: "a1",
      campaignId: "c1",
      name: "Nebula_Render_V2.png",
      type: "image",
      size: "14 MB",
      url: "https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=600&auto=format&fit=crop",
      tags: ["3D", "Hero", "Approved"]
    },
    {
      id: "a2",
      campaignId: "c1",
      name: "Ambient_Drone_Bed.wav",
      type: "audio",
      size: "8 MB",
      url: "",
      tags: ["Music", "Draft"]
    }
  ] as Asset[],

  reviews: [
    {
      id: "r1",
      campaignId: "c1",
      reviewer: "Sarah Jenkins",
      role: "Creative Director",
      status: "approved",
      comment: "Lighting looks stunning. Move forward with final render.",
      date: subDays(today, 2).toISOString(),
    },
    {
      id: "r2",
      campaignId: "c1",
      reviewer: "Mark T.",
      role: "Client Rep",
      status: "changes_requested",
      comment: "Can we make the logo slightly larger in the final shot?",
      date: subDays(today, 1).toISOString(),
    }
  ] as Review[]
};
