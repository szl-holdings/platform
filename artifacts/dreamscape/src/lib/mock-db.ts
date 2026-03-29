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
  budget: string;
  director: string;
  description: string;
  kpis: { label: string; value: string; trend: string }[];
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
  format: string;
}

export interface StoryboardScene {
  id: string;
  campaignId: string;
  sceneNumber: number;
  shotType: string;
  cameraMovement: string;
  visual: string;
  dialogue: string;
  duration: string;
  thumbnailUrl: string;
  talentNotes: string;
  lighting: string;
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
  type: "image" | "video" | "audio" | "document" | "font" | "template" | "raw_footage" | "color_graded" | "motion_graphics" | "audio_stem";
  size: string;
  url: string;
  tags: string[];
  category: string;
  resolution?: string;
  codec?: string;
}

export interface Review {
  id: string;
  campaignId: string;
  reviewer: string;
  role: string;
  status: "pending" | "approved" | "changes_requested";
  comment: string;
  date: string;
  round: number;
  department: string;
}

const today = new Date();

export const mockDb = {
  campaigns: [
    {
      id: "c1",
      name: "\"UNCHARTED\" — Global Brand Film",
      client: "Meridian Automotive",
      category: "brand_campaign",
      status: "production" as CampaignStatus,
      deadline: addDays(today, 18).toISOString(),
      progress: 62,
      budget: "$2.4M",
      director: "Marcus Chen",
      description: "Cinematic 90-second brand anthem for Meridian's all-electric SUV launch. Shot across Iceland, Patagonia, and Dubai. Hero spot for Super Bowl LVIII pre-game + global digital rollout.",
      kpis: [
        { label: "Projected Reach", value: "142M", trend: "+18%" },
        { label: "Target ROAS", value: "4.2x", trend: "+0.6x" },
        { label: "Brand Lift", value: "12pts", trend: "+3pts" },
        { label: "Engagement Rate", value: "6.8%", trend: "+1.2%" },
      ],
    },
    {
      id: "c2",
      name: "NOVA — Product Launch Campaign",
      client: "Helios Wearables",
      category: "product_launch",
      status: "pre_production" as CampaignStatus,
      deadline: addDays(today, 35).toISOString(),
      progress: 28,
      budget: "$1.1M",
      director: "Yuki Tanaka",
      description: "Multi-platform product reveal for the NOVA smartwatch. Includes hero film (60s + 30s cutdowns), AR try-on experience, influencer seeding kit with unboxing content, and Times Square OOH takeover.",
      kpis: [
        { label: "Pre-orders Target", value: "50K", trend: "New" },
        { label: "Social Impressions", value: "85M", trend: "+22%" },
        { label: "CPM Target", value: "$8.40", trend: "-12%" },
        { label: "Share of Voice", value: "34%", trend: "+8%" },
      ],
    },
    {
      id: "c3",
      name: "\"PULSE\" — Social Content Engine",
      client: "Vantage Energy Drinks",
      category: "social_media",
      status: "review" as CampaignStatus,
      deadline: addDays(today, 3).toISOString(),
      progress: 88,
      budget: "$340K",
      director: "Priya Kapoor",
      description: "Always-on social content system for TikTok, Instagram Reels, and YouTube Shorts. 45 assets per month across athlete partnerships, UGC amplification, and reactive cultural moments.",
      kpis: [
        { label: "Engagement Rate", value: "9.2%", trend: "+3.1%" },
        { label: "Avg. Views/Reel", value: "2.8M", trend: "+540K" },
        { label: "Follower Growth", value: "+180K/mo", trend: "+45K" },
        { label: "CTR to Shop", value: "3.4%", trend: "+0.8%" },
      ],
    },
    {
      id: "c4",
      name: "ARCHITECT — Experiential Activation",
      client: "Stratos Architecture",
      category: "event_marketing",
      status: "concept" as CampaignStatus,
      deadline: addDays(today, 60).toISOString(),
      progress: 12,
      budget: "$780K",
      director: "Elena Vasquez",
      description: "Immersive projection-mapped installation for Milan Design Week. 360° experience blending physical architecture with generative AI visuals, featuring real-time audience interaction via mobile devices.",
      kpis: [
        { label: "Footfall Target", value: "25K", trend: "New" },
        { label: "Earned Media", value: "$2.1M", trend: "Projected" },
        { label: "Dwell Time", value: "8min", trend: "Target" },
        { label: "NPS Score", value: "72+", trend: "Target" },
      ],
    },
    {
      id: "c5",
      name: "\"ORIGIN\" — Documentary Series",
      client: "SZL Holdings",
      category: "video_production",
      status: "post_production" as CampaignStatus,
      deadline: addDays(today, 10).toISOString(),
      progress: 75,
      budget: "$1.8M",
      director: "James Okafor",
      description: "Four-part documentary series exploring SZL's maritime heritage and future vision. Episodic format for YouTube/Vimeo premiere with festival submission strategy. 4K HDR finish with Dolby Atmos audio.",
      kpis: [
        { label: "View Completion", value: "68%", trend: "+15%" },
        { label: "Subscriber Lift", value: "+12K", trend: "+4K" },
        { label: "Press Mentions", value: "45+", trend: "Target" },
        { label: "Brand Sentiment", value: "+18pts", trend: "+6pts" },
      ],
    },
    {
      id: "c6",
      name: "CATALYST — Performance Campaign",
      client: "Lyte Technologies",
      category: "commercial",
      status: "published" as CampaignStatus,
      deadline: subDays(today, 5).toISOString(),
      progress: 100,
      budget: "$520K",
      director: "Sarah Jenkins",
      description: "Performance-driven video ad suite for Lyte's SaaS platform. 15s/30s/60s variants optimized for Meta, Google, and LinkedIn. A/B tested creative with dynamic end cards.",
      kpis: [
        { label: "ROAS", value: "5.8x", trend: "+1.4x" },
        { label: "CPA", value: "$24.60", trend: "-18%" },
        { label: "Conv. Rate", value: "4.2%", trend: "+1.1%" },
        { label: "Quality Score", value: "9/10", trend: "+2" },
      ],
    },
  ] as Campaign[],

  scripts: [
    {
      id: "s1",
      campaignId: "c1",
      title: "UNCHARTED — Hero :90 Director's Cut",
      content: `FADE IN:

EXT. VOLCANIC LANDSCAPE — ICELAND — GOLDEN HOUR

WIDE SHOT — Steam rises from black volcanic earth. An impossibly vast landscape stretches to the horizon. Silence except for the wind.

A single headlight pierces through the mist.

                    V.O. (NARRATOR — deep, measured)
          The roads we know lead to places we've already been.

The Meridian ATLAS emerges from the mist — matte obsidian finish catching the amber light. It moves through frame with quiet authority.

MATCH CUT TO:

EXT. PATAGONIA — TORRES DEL PAINE — DAWN

TRACKING SHOT — The ATLAS navigates a gravel path along a glacial lake. Mountains reflected perfectly in still water.

                    V.O.
          But what if the road itself was the destination?

INT. MERIDIAN ATLAS — CONTINUOUS

CU on driver's hands — relaxed grip, wedding band catching light. The instrument cluster projects a holographic HUD onto the windshield. Range: 487 miles.

                    V.O.
          Meridian ATLAS. 487 miles of range. Zero compromises.

EXT. DUBAI — DESERT HIGHWAY — MAGIC HOUR

AERIAL DRONE SHOT — The ATLAS carves through golden dunes, a single dark line against infinite sand.

                    V.O.
          Go further. Stay longer. Return changed.

SUPER: MERIDIAN ATLAS — ALL-ELECTRIC
SUPER: UNCHARTED STARTS HERE

FADE TO BLACK.`,
      version: 4,
      status: "approved" as const,
      updatedAt: subDays(today, 1).toISOString(),
      notes: "Client approved V4 with minor revision: change 'Return different' to 'Return changed' per brand guidelines. DP confirms Iceland unit ready for shoot day 3. Patagonia permits secured through local fixer.",
      format: "Screenplay — Industry Standard",
    },
    {
      id: "s2",
      campaignId: "c1",
      title: "UNCHARTED — Social Cutdown :30",
      content: `OPEN ON:

EXT. ICELAND — VOLCANIC ROAD — GOLDEN HOUR

TRACKING SHOT — Meridian ATLAS emerges from volcanic mist.

                    V.O.
          The roads we know lead to places we've already been.

QUICK CUT MONTAGE:
- CU: Tires gripping volcanic gravel
- AERIAL: ATLAS crossing Patagonian bridge
- INT: Holographic HUD — 487 miles range

                    V.O.
          Meridian ATLAS. Go further.

SUPER: MERIDIAN ATLAS — ALL-ELECTRIC
SUPER: UNCHARTED STARTS HERE`,
      version: 2,
      status: "review" as const,
      updatedAt: subDays(today, 0).toISOString(),
      notes: "Needs pacing review — currently running :33. Trim Patagonia bridge shot by 2s. Social team wants vertical safe-zone confirmation.",
      format: "Screenplay — Social Cut",
    },
    {
      id: "s3",
      campaignId: "c5",
      title: "ORIGIN Ep.1 — \"The Deep\" Interview Segments",
      content: `COLD OPEN:

EXT. NORTH SEA — PRE-DAWN

WIDE ESTABLISHING — A massive container vessel cuts through iron-gray waves. The SZL logo catches the first light of dawn.

                    CAPTAIN ERIKSSON (V.O.)
          People see the ships. They don't see the ocean.

INT. BRIDGE — CONTINUOUS

INTERVIEW SETUP — Captain Eriksson, 30 years at sea, weathered hands resting on the console. Natural light from the bridge windows. 

                    CAPTAIN ERIKSSON
          When I started, we navigated by stars and intuition.
          Now the ship thinks for itself. But the sea...
          the sea hasn't changed.

B-ROLL: ARCHIVAL — 1990s footage of early SZL fleet. Grain and warmth.

                    NARRATOR (V.O.)
          For forty years, SZL Holdings has moved the world's
          goods across six oceans. This is the story of the
          people who made it possible.

TITLE CARD: ORIGIN — EPISODE ONE — "THE DEEP"`,
      version: 3,
      status: "final" as const,
      updatedAt: subDays(today, 3).toISOString(),
      notes: "Final lock. Archival footage rights cleared through Episode 4. Captain Eriksson's interview is the emotional anchor — editor should let moments breathe. Color grade reference: Emmanuel Lubezki / The Revenant.",
      format: "Documentary — Interview/Narration Hybrid",
    },
  ] as Script[],

  storyboards: [
    {
      id: "sb1",
      campaignId: "c1",
      sceneNumber: 1,
      shotType: "EWS — Extreme Wide Shot",
      cameraMovement: "Static → Slow Push (50mm → 85mm)",
      visual: "Volcanic landscape, steam rising from black earth. Single headlight pierces through mist in the far distance. Golden hour backlight creates silhouettes of steam columns.",
      dialogue: "(Silence — atmospheric wind, distant rumble)",
      duration: "4s",
      thumbnailUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=600&auto=format&fit=crop",
      talentNotes: "No talent visible. Vehicle is the subject.",
      lighting: "Natural golden hour + practical headlights. Haze machine for enhanced atmosphere.",
    },
    {
      id: "sb2",
      campaignId: "c1",
      sceneNumber: 2,
      shotType: "MS — Medium Shot, 3/4 Angle",
      cameraMovement: "Dolly alongside at 25mph, Arri Alexa Mini LF",
      visual: "Meridian ATLAS emerges from volcanic mist. Obsidian finish catches amber light. Vehicle moves left-to-right through frame with quiet authority.",
      dialogue: "V.O: \"The roads we know lead to places we've already been.\"",
      duration: "5s",
      thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
      talentNotes: "Driver silhouette visible but not featured. Male, mid-30s.",
      lighting: "Golden hour key light, camera-side. Fill from volcanic steam diffusion.",
    },
    {
      id: "sb3",
      campaignId: "c1",
      sceneNumber: 3,
      shotType: "WS — Wide Shot, Low Angle",
      cameraMovement: "Tracking shot on Steadicam, following vehicle",
      visual: "ATLAS navigates gravel path along glacial lake. Torres del Paine mountains reflected in perfectly still water. Vehicle creates subtle wake in shallow puddle.",
      dialogue: "V.O: \"But what if the road itself was the destination?\"",
      duration: "6s",
      thumbnailUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop",
      talentNotes: "No talent visible in exterior. Insert: hands on steering wheel for intercut.",
      lighting: "Dawn light, soft and blue. Practical reflections from water surface.",
    },
    {
      id: "sb4",
      campaignId: "c1",
      sceneNumber: 4,
      shotType: "ECU — Extreme Close-Up",
      cameraMovement: "Static with focus pull, Macro lens (100mm)",
      visual: "Driver's hands on steering wheel — relaxed grip, wedding band catching ambient light. Pull focus to holographic HUD projected on windshield showing 487mi range.",
      dialogue: "V.O: \"487 miles of range. Zero compromises.\"",
      duration: "4s",
      thumbnailUrl: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=600&auto=format&fit=crop",
      talentNotes: "Hand model — male, clean nails, silver wedding band. Natural skin tone.",
      lighting: "Interior ambient LED + practical dashboard glow. Soft top light for hand detail.",
    },
    {
      id: "sb5",
      campaignId: "c1",
      sceneNumber: 5,
      shotType: "AERIAL — Bird's Eye",
      cameraMovement: "DJI Inspire 3, orbit pull-back from 50ft to 400ft AGL",
      visual: "ATLAS carves through golden desert dunes outside Dubai. Single dark line against infinite sand. Long shadow from setting sun creates dramatic depth.",
      dialogue: "V.O: \"Go further. Stay longer. Return changed.\"",
      duration: "6s",
      thumbnailUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop",
      talentNotes: "N/A — aerial only. Coordinate with ground unit for timing.",
      lighting: "Magic hour — sun 15° above horizon. Natural shadow play on dunes.",
    },
    {
      id: "sb6",
      campaignId: "c1",
      sceneNumber: 6,
      shotType: "SUPER — Title Card",
      cameraMovement: "Static — motion graphics overlay",
      visual: "Black screen with subtle particle effect. MERIDIAN ATLAS logo materializes with light-streak animation. Tagline fades in below: UNCHARTED STARTS HERE.",
      dialogue: "(Score crescendo — orchestral resolve)",
      duration: "5s",
      thumbnailUrl: "",
      talentNotes: "N/A — post-production only.",
      lighting: "N/A — CG elements only. Match warm amber of brand palette.",
    },
  ] as StoryboardScene[],

  voiceovers: [
    {
      id: "v1",
      campaignId: "c1",
      name: "UNCHARTED Hero :90 — Marcus Keane",
      provider: "elevenlabs" as const,
      text: "The roads we know lead to places we've already been. But what if the road itself was the destination? Meridian ATLAS. 487 miles of range. Zero compromises. Go further. Stay longer. Return changed.",
      status: "ready" as const,
    },
    {
      id: "v2",
      campaignId: "c1",
      name: "UNCHARTED :30 Cutdown — Marcus Keane",
      provider: "elevenlabs" as const,
      text: "The roads we know lead to places we've already been. Meridian ATLAS. Go further.",
      status: "ready" as const,
    },
    {
      id: "v3",
      campaignId: "c1",
      name: "UNCHARTED :15 Bumper — Female Alt",
      provider: "elevenlabs" as const,
      text: "Meridian ATLAS. 487 miles. Zero compromises.",
      status: "generating" as const,
    },
    {
      id: "v4",
      campaignId: "c5",
      name: "ORIGIN Ep.1 Narrator — David Oyelowo Reference",
      provider: "manual" as const,
      text: "For forty years, SZL Holdings has moved the world's goods across six oceans. This is the story of the people who made it possible.",
      status: "ready" as const,
    },
    {
      id: "v5",
      campaignId: "c3",
      name: "PULSE — Athlete Intro Tag",
      provider: "placeholder" as const,
      text: "This is my pulse. What's yours?",
      status: "pending" as const,
    },
  ] as Voiceover[],

  assets: [
    {
      id: "a1",
      campaignId: "c1",
      name: "ATLAS_Hero_Iceland_R3_ACES.exr",
      type: "raw_footage" as const,
      size: "48.2 GB",
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=600&auto=format&fit=crop",
      tags: ["RAW", "Iceland", "Scene 1-2", "ARRI Alexa"],
      category: "RAW Footage",
      resolution: "6.5K Open Gate",
      codec: "ARRIRAW",
    },
    {
      id: "a2",
      campaignId: "c1",
      name: "ATLAS_Patagonia_Graded_v4.mov",
      type: "color_graded" as const,
      size: "12.8 GB",
      url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop",
      tags: ["Graded", "Patagonia", "DaVinci", "Approved"],
      category: "Color-Graded Masters",
      resolution: "4K DCI (4096×2160)",
      codec: "ProRes 4444 XQ",
    },
    {
      id: "a3",
      campaignId: "c1",
      name: "UNCHARTED_Score_Stems_Full.wav",
      type: "audio_stem" as const,
      size: "2.1 GB",
      url: "",
      tags: ["Score", "Orchestral", "Stems", "48kHz/24bit"],
      category: "Audio Stems",
    },
    {
      id: "a4",
      campaignId: "c1",
      name: "UNCHARTED_Score_Percussion.wav",
      type: "audio_stem" as const,
      size: "340 MB",
      url: "",
      tags: ["Score", "Percussion", "Stem", "48kHz/24bit"],
      category: "Audio Stems",
    },
    {
      id: "a5",
      campaignId: "c1",
      name: "Meridian_LogoAnim_4K.mogrt",
      type: "motion_graphics" as const,
      size: "85 MB",
      url: "",
      tags: ["Logo", "Animation", "After Effects", "Final"],
      category: "Motion Graphics Templates",
    },
    {
      id: "a6",
      campaignId: "c1",
      name: "ATLAS_Product_3D_Render_Hero.png",
      type: "image" as const,
      size: "62 MB",
      url: "https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=600&auto=format&fit=crop",
      tags: ["3D Render", "Hero", "CGI", "Approved"],
      category: "CGI & Renders",
      resolution: "8K (7680×4320)",
    },
    {
      id: "a7",
      campaignId: "c1",
      name: "Meridian_BrandGuide_2026.pdf",
      type: "document" as const,
      size: "24 MB",
      url: "",
      tags: ["Brand", "Guidelines", "Typography", "Color"],
      category: "Brand Documents",
    },
    {
      id: "a8",
      campaignId: "c1",
      name: "GT_Walsheim_Pro_Complete.zip",
      type: "font" as const,
      size: "4.2 MB",
      url: "",
      tags: ["Typeface", "Licensed", "Brand Font"],
      category: "Typography",
    },
    {
      id: "a9",
      campaignId: "c1",
      name: "ATLAS_Dubai_Aerial_Plate_v2.mov",
      type: "raw_footage" as const,
      size: "18.4 GB",
      url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop",
      tags: ["RAW", "Dubai", "Aerial", "DJI Inspire 3"],
      category: "RAW Footage",
      resolution: "5.2K",
      codec: "CinemaDNG RAW",
    },
    {
      id: "a10",
      campaignId: "c1",
      name: "UNCHARTED_VFX_DuneTrack_comp_v7.exr",
      type: "image" as const,
      size: "890 MB",
      url: "",
      tags: ["VFX", "Composite", "Nuke", "Review"],
      category: "VFX Composites",
      resolution: "4K DCI",
    },
    {
      id: "a11",
      campaignId: "c5",
      name: "ORIGIN_Ep1_Interview_Eriksson_RAW.mxf",
      type: "raw_footage" as const,
      size: "64 GB",
      url: "",
      tags: ["RAW", "Interview", "RED", "Ep.1"],
      category: "RAW Footage",
      resolution: "8K",
      codec: "REDCODE RAW",
    },
    {
      id: "a12",
      campaignId: "c3",
      name: "PULSE_Template_9x16_AE.aep",
      type: "template" as const,
      size: "120 MB",
      url: "",
      tags: ["Template", "Vertical", "Social", "After Effects"],
      category: "Motion Graphics Templates",
    },
  ] as Asset[],

  reviews: [
    {
      id: "r1",
      campaignId: "c1",
      reviewer: "Sarah Jenkins",
      role: "Executive Creative Director",
      status: "approved" as const,
      comment: "The Iceland footage is breathtaking. Pacing in V4 is exactly right — the silence in the opening builds tension beautifully. Approve for client presentation.",
      date: subDays(today, 3).toISOString(),
      round: 2,
      department: "Creative",
    },
    {
      id: "r2",
      campaignId: "c1",
      reviewer: "Thomas Richter",
      role: "VP Brand Marketing — Meridian",
      status: "approved" as const,
      comment: "This captures the ATLAS brand perfectly. One note: can we ensure the 487-mile range callout is on screen for a full 2 seconds? Legal needs readable duration. Otherwise, approved to proceed.",
      date: subDays(today, 2).toISOString(),
      round: 2,
      department: "Client",
    },
    {
      id: "r3",
      campaignId: "c1",
      reviewer: "Diana Walsh",
      role: "Legal & Compliance, Meridian",
      status: "changes_requested" as const,
      comment: "Range claim '487 miles' needs EPA disclaimer footnote in all consumer-facing executions. Super must read: '*EPA estimated range. Actual range varies.' Minimum 12pt on broadcast, 8pt on digital.",
      date: subDays(today, 1).toISOString(),
      round: 2,
      department: "Legal",
    },
    {
      id: "r4",
      campaignId: "c1",
      reviewer: "Marcus Chen",
      role: "Director",
      status: "approved" as const,
      comment: "Cut is locked from a directorial perspective. DP confirmed the Patagonia reshoot is unnecessary — existing plates work with the revised grade. Sound mix session booked for Tuesday.",
      date: subDays(today, 1).toISOString(),
      round: 2,
      department: "Production",
    },
    {
      id: "r5",
      campaignId: "c1",
      reviewer: "Kenji Matsuda",
      role: "Head of Media Buying",
      status: "pending" as const,
      comment: "Reviewing broadcast specs and trafficking requirements. Need confirmation on 5.1 vs stereo deliverables for linear TV buys.",
      date: subDays(today, 0).toISOString(),
      round: 2,
      department: "Media",
    },
    {
      id: "r6",
      campaignId: "c3",
      reviewer: "Priya Kapoor",
      role: "Creative Director — Social",
      status: "approved" as const,
      comment: "Batch 12 is the strongest yet. The reactive content for the NBA Finals moment was perfectly timed. Approve all 15 assets for scheduling.",
      date: subDays(today, 1).toISOString(),
      round: 4,
      department: "Creative",
    },
    {
      id: "r7",
      campaignId: "c3",
      reviewer: "Alex Kim",
      role: "Brand Manager — Vantage",
      status: "changes_requested" as const,
      comment: "Love the energy but need to pull back on the 'heart rate' visual metaphor in assets #7 and #12 — too close to a competitor's recent campaign. Rest of the batch is approved.",
      date: subDays(today, 0).toISOString(),
      round: 4,
      department: "Client",
    },
    {
      id: "r8",
      campaignId: "c5",
      reviewer: "James Okafor",
      role: "Director / Showrunner",
      status: "approved" as const,
      comment: "Rough cut of Ep.1 is in excellent shape. Captain Eriksson's interview is the emotional anchor we needed. Recommend adding 10s of archival footage from the '98 typhoon for context.",
      date: subDays(today, 4).toISOString(),
      round: 1,
      department: "Production",
    },
  ] as Review[],
};
