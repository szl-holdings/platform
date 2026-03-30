import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingUp, ImageIcon, FileText, Calendar, Loader2, Lightbulb, Palette, Globe, Zap, Sliders, Video, Music, Type, Wand2, Camera, Layers, MonitorPlay, Mic, RefreshCw, Check, Copy, MessageSquare, BarChart3 } from "lucide-react";
import { Button, Card, Badge, Input } from "@/components/ui";
import { ShimmerReveal, TypewriterText } from "@workspace/shared-ui/ai-components";

const demoContentIdeas = {
  ideas: [
    { title: "Behind the Lens: AI in Film Production", format: "Documentary", audience: "Tech Creatives", trendAlignment: 94, estimatedEngagement: "High" },
    { title: "The Future of Brand Storytelling", format: "Long-form Video", audience: "Marketing Leaders", trendAlignment: 88, estimatedEngagement: "Very High" },
    { title: "Gen Z Visual Language: A Creative Guide", format: "Social Series", audience: "Gen Z Consumers", trendAlignment: 91, estimatedEngagement: "High" },
    { title: "Sustainable Fashion Campaign Blueprint", format: "Multi-platform", audience: "Eco-Conscious", trendAlignment: 85, estimatedEngagement: "Medium" },
  ],
  trendingTopics: ["AI Cinema", "Spatial Computing", "Neo-Brutalism Design", "Haptic Storytelling", "Ambient Computing"],
};
const demoTechTrends = [
  { name: "Spatial Video", category: "Emerging", momentum: 92, direction: "Accelerating", relevance: "critical" },
  { name: "Neural Radiance Fields", category: "VFX", momentum: 87, direction: "Growing", relevance: "high" },
  { name: "Volumetric Capture", category: "Production", momentum: 78, direction: "Steady", relevance: "high" },
  { name: "Real-time Ray Tracing", category: "Rendering", momentum: 95, direction: "Accelerating", relevance: "critical" },
  { name: "AI Motion Capture", category: "Animation", momentum: 84, direction: "Growing", relevance: "high" },
  { name: "Procedural Audio", category: "Sound", momentum: 71, direction: "Emerging", relevance: "medium" },
  { name: "LED Virtual Production", category: "Production", momentum: 89, direction: "Mainstream", relevance: "critical" },
  { name: "Generative Music", category: "Audio", momentum: 76, direction: "Growing", relevance: "medium" },
];
const demoCalendar = [
  { event: "Cannes Lions Festival", date: "Jun 16-20", relevance: "Major creative showcase, deadline for entries", region: "Global" },
  { event: "World Environment Day", date: "Jun 5", relevance: "Sustainability campaign launch window", region: "Global" },
  { event: "Apple WWDC", date: "Jun 9", relevance: "Spatial computing content opportunities", region: "Tech" },
  { event: "Pride Month", date: "June", relevance: "Inclusive storytelling campaigns", region: "Global" },
];

const aiTools = [
  {
    id: "gen-imagery",
    name: "Generative Imagery",
    description: "Create concept art, mood boards, and visual explorations using Stable Diffusion XL and DALL-E 3. Train custom LoRA models on brand assets for consistent style transfer.",
    icon: ImageIcon,
    tech: "SDXL / DALL-E 3",
    color: "text-purple-400",
    bgColor: "from-purple-500/20 to-violet-500/10",
    capabilities: ["Concept Art Generation", "Brand-Trained LoRA Models", "Style Transfer", "Mood Board Assembly"],
  },
  {
    id: "ai-voiceover",
    name: "AI Voiceover Studio",
    description: "Ultra-realistic voice synthesis powered by ElevenLabs. Clone talent voices for pre-production scratch tracks, or select from 200+ premium voices across 29 languages.",
    icon: Music,
    tech: "ElevenLabs V2",
    color: "text-amber-400",
    bgColor: "from-amber-500/20 to-orange-500/10",
    capabilities: ["Voice Cloning", "Multi-language Synthesis", "Emotion Control", "Scratch Track Generation"],
  },
  {
    id: "video-gen",
    name: "Motion Generation",
    description: "Generate video from text prompts or extend existing footage using RunwayML Gen-3 Alpha. Create camera movements, transitions, and B-roll directly from storyboard descriptions.",
    icon: Video,
    tech: "RunwayML Gen-3",
    color: "text-cyan-400",
    bgColor: "from-cyan-500/20 to-blue-500/10",
    capabilities: ["Text-to-Video", "Image-to-Video", "Camera Motion Control", "B-Roll Generation"],
  },
  {
    id: "color-grade",
    name: "AI Color Grading",
    description: "Automated color grading with DaVinci Resolve neural engine integration. Match look-up tables across multi-camera shoots and apply cinematic film emulation in real-time.",
    icon: Palette,
    tech: "DaVinci Neural",
    color: "text-rose-400",
    bgColor: "from-rose-500/20 to-pink-500/10",
    capabilities: ["Auto Color Match", "LUT Generation", "Film Emulation", "Scene-to-Scene Consistency"],
  },
  {
    id: "copy-gen",
    name: "Campaign Copy Engine",
    description: "Generate headlines, body copy, CTAs, and full campaign messaging frameworks. Tone-matched to brand voice with A/B variant generation for performance optimization.",
    icon: Type,
    tech: "GPT-4o / Claude",
    color: "text-emerald-400",
    bgColor: "from-emerald-500/20 to-green-500/10",
    capabilities: ["Headline Generation", "A/B Copy Variants", "Brand Voice Matching", "Multi-Format Adaptation"],
  },
  {
    id: "vfx-comp",
    name: "VFX Compositing",
    description: "AI-assisted rotoscoping, background replacement, and object removal. Integrate with Nuke and After Effects pipelines for seamless post-production workflows.",
    icon: Layers,
    tech: "Nuke AI / AE",
    color: "text-indigo-400",
    bgColor: "from-indigo-500/20 to-blue-500/10",
    capabilities: ["AI Rotoscoping", "Background Replacement", "Object Removal", "Sky Replacement"],
  },
];

export function AIStudio() {
  const contentIdeas = demoContentIdeas;
  const techTrends = demoTechTrends;
  const calendar = demoCalendar;

  const [imagePrompt, setImagePrompt] = React.useState("");
  const [briefTopic, setBriefTopic] = React.useState("");
  const [tone, setTone] = React.useState(50);
  const [copyResult, setCopyResult] = React.useState("");
  const [copyDone, setCopyDone] = React.useState(false);
  const [selectedTool, setSelectedTool] = React.useState<string | null>(null);

  const imageMutation = useMutation({
    mutationFn: async (_prompt: string) => ({ imageBase64: "", mimeType: "image/png", model: "SDXL", tier: "premium" }),
  });

  const briefMutation = useMutation({
    mutationFn: async (_topic: string) => ({ content: "Brief generated." }),
  });

  const toneLabel = tone < 25 ? "Corporate" : tone < 50 ? "Professional" : tone < 75 ? "Conversational" : "Bold & Provocative";

  const generateCampaignCopy = async () => {
    if (!briefTopic.trim()) return;
    setCopyResult("");
    setCopyDone(false);
    await new Promise(r => setTimeout(r, 800));
    setCopyResult(`Campaign: ${briefTopic}\n\nHeadline: Beyond What You Know\nSubheadline: Where vision meets velocity\nBody: Every breakthrough starts with a single question — what if? We build the answers that move industries forward, one bold idea at a time.\nCTA: See What's Next \u2192`);
    setCopyDone(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-amber-500/20 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-primary" />
            </div>
            AI Creative Studio
          </h1>
          <p className="text-muted-foreground mt-1">Production-grade AI tools for ideation, generation, and post-production.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {aiTools.map((tool, i) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              className={`p-5 border-border/50 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 ${selectedTool === tool.id ? 'border-primary/50 ring-1 ring-primary/20' : 'hover:border-primary/30'}`}
              onClick={() => setSelectedTool(selectedTool === tool.id ? null : tool.id)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.bgColor} flex items-center justify-center shrink-0`}>
                  <tool.icon className={`w-6 h-6 ${tool.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm text-foreground">{tool.name}</h3>
                    <Badge variant="outline" className="text-[9px] py-0 h-4 bg-muted/50 shrink-0">{tool.tech}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{tool.description}</p>
                </div>
              </div>

              <AnimatePresence>
                {selectedTool === tool.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-border/30"
                  >
                    <p className="text-xs text-muted-foreground mb-3">{tool.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tool.capabilities.map(cap => (
                        <Badge key={cap} variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">{cap}</Badge>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
          <Card className="p-6 border-border/50">
            <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" /> AI Content Ideas
            </h3>
            {contentIdeas?.ideas ? (
              <div className="space-y-3">
                {contentIdeas.ideas.map((idea: any, i: number) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-all cursor-pointer group bg-gradient-to-r from-background to-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{idea.title}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{idea.format}</Badge>
                          <Badge variant="outline" className="bg-primary/5">{idea.audience}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-primary">
                          <TrendingUp className="w-3 h-3" /> {idea.trendAlignment}%
                        </div>
                        <span className="text-[10px] text-muted-foreground">{idea.estimatedEngagement} engagement</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
            )}
            {contentIdeas?.trendingTopics && (
              <div className="mt-4 pt-4 border-t border-border/30">
                <p className="text-xs text-muted-foreground mb-2">Trending Topics</p>
                <div className="flex flex-wrap gap-2">
                  {contentIdeas.trendingTopics.map((t: string, i: number) => (
                    <Badge key={i} variant="outline" className="bg-primary/5 text-primary">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-6 border-border/50 h-full">
            <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" /> Cultural Calendar
            </h3>
            <div className="space-y-3">
              {calendar.map((event: any, i: number) => (
                <div key={i} className="p-3 rounded-lg border border-border/30 bg-background/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{event.event}</span>
                    <span className="text-[10px] text-muted-foreground">{event.date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{event.relevance}</p>
                  <Badge variant="outline" className="text-[10px] mt-1">{event.region}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-6 border-border/50">
            <h3 className="text-lg font-display font-bold text-foreground mb-2 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-400" /> Generative Imagery
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Generate concept art, mood boards, and visual explorations with SDXL + DALL-E 3.</p>
            <div className="flex gap-2 mb-4">
              <Input placeholder="Describe your creative vision..." value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && imagePrompt && imageMutation.mutate(imagePrompt)} />
              <Button onClick={() => imagePrompt && imageMutation.mutate(imagePrompt)} disabled={imageMutation.isPending || !imagePrompt}>
                {imageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              </Button>
            </div>
            <ShimmerReveal isLoading={imageMutation.isPending} className="h-[200px] w-full">
              {imageMutation.data && (
                <div className="rounded-xl overflow-hidden border border-border/30">
                  <img src={`data:${imageMutation.data.mimeType || "image/png"};base64,${imageMutation.data.imageBase64}`} alt="AI Generated" className="w-full" />
                  <div className="p-3 bg-background/50">
                    <p className="text-xs text-muted-foreground">Model: {imageMutation.data.model} | Tier: {imageMutation.data.tier}</p>
                  </div>
                </div>
              )}
            </ShimmerReveal>
            {imageMutation.isError && (
              <p className="text-sm text-destructive mt-2">Failed to generate image. Try again.</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {["cinematic car reveal, volumetric fog, golden hour", "luxury product flatlay, marble surface, dramatic lighting", "aerial landscape, Patagonian mountains, dawn mist", "abstract brand identity, geometric, amber and obsidian"].map(p => (
                <button key={p} onClick={() => { setImagePrompt(p); imageMutation.mutate(p); }} className="text-xs px-3 py-1.5 rounded-full border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground">{p.split(',')[0]}</button>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-6 border-border/50">
            <h3 className="text-lg font-display font-bold text-foreground mb-2 flex items-center gap-2">
              <Type className="w-5 h-5 text-emerald-400" /> Campaign Copy Engine
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Generate brand-matched campaign copy with tone control and A/B variants.</p>
            <div className="flex gap-2 mb-4">
              <Input placeholder="Campaign theme (e.g., electric vehicle launch)..." value={briefTopic} onChange={e => setBriefTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && generateCampaignCopy()} />
              <Button onClick={generateCampaignCopy} disabled={!briefTopic}>
                <Zap className="w-4 h-4" />
              </Button>
            </div>
            <div className="mb-4 p-3 rounded-xl border border-border/30 bg-background/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Brand Voice Tone</span>
                <span className="text-xs font-medium text-primary">{toneLabel}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={tone}
                onChange={(e) => setTone(Number(e.target.value))}
                className="w-full h-1.5 bg-border/30 rounded-full appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Corporate</span>
                <span>Professional</span>
                <span>Conversational</span>
                <span>Bold</span>
              </div>
            </div>
            {copyResult && (
              <div className="p-4 rounded-xl border border-border/30 bg-background/50">
                {copyDone ? (
                  <TypewriterText text={copyResult} speed={15} className="text-sm whitespace-pre-wrap" />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating copy...
                  </div>
                )}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <BrandVoiceSection />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="p-6 border-border/50">
          <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" /> Technology Trend Radar
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {techTrends.map((trend: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className={`p-4 rounded-xl border transition-all cursor-pointer hover:-translate-y-0.5 ${trend.relevance === "critical" ? "border-primary/30 bg-primary/5" : "border-border/30 bg-background/50"}`}>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-[10px]">{trend.category}</Badge>
                  <span className="text-xs text-primary font-bold">{trend.momentum}%</span>
                </div>
                <p className="text-sm font-semibold">{trend.name}</p>
                <div className="mt-2 h-1.5 bg-border/30 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${trend.momentum}%` }} />
                </div>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                  <TrendingUp className="w-3 h-3" /> {trend.direction}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

// ─── Brand Voice Engine ────────────────────────────────────────────────────
const brandVoiceProfiles = [
  { name: "Bold & Direct", tone: "Assertive", formality: 3, personality: ["Bold", "Direct", "Energetic"], color: "from-orange-500 to-red-500" },
  { name: "Warm & Friendly", tone: "Conversational", formality: 2, personality: ["Friendly", "Approachable"], color: "from-amber-400 to-yellow-500" },
  { name: "Expert Authority", tone: "Authoritative", formality: 4, personality: ["Expert", "Precise"], color: "from-blue-500 to-indigo-500" },
  { name: "Creative & Playful", tone: "Playful", formality: 1, personality: ["Fun", "Unexpected"], color: "from-violet-500 to-pink-500" },
];

const channelPreviews: Record<string, { icon: string; caption: string; maxChars: number }> = {
  "Instagram": { icon: "📸", caption: "The future of storytelling is here 🎬 We're rewriting what's possible when ambitious creative teams meet cutting-edge AI. Ready to level up?\n\n#Creative #AI #Innovation", maxChars: 150 },
  "LinkedIn": { icon: "💼", caption: "We've spent 18 months rethinking how high-performance creative teams collaborate. Today, we're sharing what we learned — and why the biggest gains came from the smallest process changes.", maxChars: 300 },
  "Email": { icon: "📧", caption: "Subject: The creative tool your team didn't know they needed\n\nHi {first_name},\n\nThe biggest bottleneck in creative teams isn't talent — it's tooling. That's why we built Dreamscape.\n\nI'd love 15 minutes to walk you through it personally.", maxChars: 500 },
  "Twitter/X": { icon: "𝕏", caption: "The creative teams crushing it in 2026 have one thing in common: they stopped waiting for the \"right tools.\"\n\nHere's what they're using instead 🧵", maxChars: 280 },
};

const performanceInsights = [
  { asset: "Q1 Product Launch Video", views: 284000, ctr: 8.4, conversion: 3.2, topChannel: "LinkedIn", trend: "+42%" },
  { asset: "Brand Story Carousel", views: 127000, ctr: 12.1, conversion: 4.8, topChannel: "Instagram", trend: "+28%" },
  { asset: "Thought Leadership Series", views: 89000, ctr: 6.7, conversion: 2.1, topChannel: "LinkedIn", trend: "+15%" },
];

const abTests = [
  { name: "Holiday Campaign CTA", variantA: '"Shop Now" → 2.4% CTR', variantB: '"Claim Your Offer" → 3.8% CTR', winner: "B", confidence: 97 },
  { name: "Email Subject Line", variantA: '"Big news..." → 24% open rate', variantB: '"We\'ve been building..." → 31% open', winner: "B", confidence: 94 },
];

function BrandVoiceSection() {
  const [selected, setSelected] = React.useState(0);
  const [prompt, setPrompt] = React.useState("Write a campaign launch post");
  const [generated, setGenerated] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [channel, setChannel] = React.useState("LinkedIn");

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerated(false);
    await new Promise(r => setTimeout(r, 1100));
    setGenerating(false);
    setGenerated(true);
  };

  const voice = brandVoiceProfiles[selected];
  const preview = channelPreviews[channel];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6 border-border/50">
        <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
          <Mic className="w-5 h-5 text-violet-400" /> Brand Voice Engine
          <Badge variant="outline" className="ml-auto text-[10px] bg-violet-500/10 text-violet-400 border-violet-500/20">Jasper-style</Badge>
        </h3>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {brandVoiceProfiles.map((v, i) => (
            <button key={v.name} onClick={() => setSelected(i)} className={`relative p-3 rounded-xl border text-left transition-all ${selected === i ? "border-primary/50 bg-primary/5" : "border-border/50 hover:border-border"}`}>
              <div className={`w-4 h-1.5 rounded-full bg-gradient-to-r ${v.color} mb-1.5`} />
              <p className="text-xs font-semibold text-foreground">{v.name}</p>
              <p className="text-[10px] text-muted-foreground">{v.tone} · Formality {v.formality}/5</p>
              {selected === i && <Check className="w-3 h-3 text-primary absolute top-2.5 right-2.5" />}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {voice.personality.map(p => <Badge key={p} variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">{p}</Badge>)}
        </div>
        <div className="flex gap-2 mb-3">
          <input className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary" placeholder="Campaign brief..." value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && handleGenerate()} />
          <Button onClick={handleGenerate} disabled={generating} size="sm">
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          </Button>
        </div>
        {generated && (
          <div className="bg-muted/20 border border-border/50 rounded-xl p-4">
            <p className="text-[11px] font-bold text-primary mb-2">{voice.name} voice applied:</p>
            <p className="text-xs text-foreground leading-relaxed">Your {prompt} — reimagined with {voice.personality.join(" & ")} energy. The kind of content that makes people stop scrolling and take action. Because bold ideas deserve bold execution.</p>
            <div className="flex items-center justify-end mt-2">
              <button className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"><Copy className="w-3 h-3" /></button>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 border-border/50">
        <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" /> Multi-Channel Preview
        </h3>
        <div className="flex gap-2 flex-wrap mb-4">
          {Object.entries(channelPreviews).map(([ch, { icon }]) => (
            <button key={ch} onClick={() => setChannel(ch)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors border ${channel === ch ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" : "border-border/50 text-muted-foreground hover:text-foreground"}`}>
              <span>{icon}</span>{ch}
            </button>
          ))}
        </div>
        <div className="bg-muted/20 border border-border/50 rounded-xl p-4">
          <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">{preview.caption}</p>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30 text-[10px] text-muted-foreground">
            <span>{preview.caption.length}/{preview.maxChars} chars</span>
            <span className={preview.caption.length > preview.maxChars ? "text-red-400" : "text-emerald-400"}>{preview.caption.length <= preview.maxChars ? "✓ Within limit" : "⚠ Over limit"}</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-2 font-mono text-center">Mock Data · Format-adaptive preview</p>
      </Card>

      <Card className="p-6 border-border/50">
        <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" /> Content Performance Analytics
        </h3>
        <div className="space-y-3">
          {performanceInsights.map(p => (
            <div key={p.asset} className="p-3 rounded-lg border border-border/50 hover:border-border transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-foreground">{p.asset}</p>
                <span className="text-[10px] font-bold text-emerald-400">{p.trend}</span>
              </div>
              <div className="flex gap-4 text-[11px]">
                <span className="text-muted-foreground">Views: <span className="text-foreground">{p.views.toLocaleString()}</span></span>
                <span className="text-muted-foreground">CTR: <span className="text-cyan-400 font-bold">{p.ctr}%</span></span>
                <span className="text-muted-foreground">Conv: <span className="text-violet-400 font-bold">{p.conversion}%</span></span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 border-border/50">
        <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-amber-400" /> A/B Content Testing
        </h3>
        <div className="space-y-3">
          {abTests.map(t => (
            <div key={t.name} className="p-3 rounded-lg border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold">{t.name}</p>
                <span className="text-[10px] text-emerald-400 font-mono">Variant {t.winner} won · {t.confidence}% conf.</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className={`p-2 rounded-lg border text-[10px] ${t.winner === "A" ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/30"}`}><span className="text-muted-foreground block mb-0.5">A</span>{t.variantA}</div>
                <div className={`p-2 rounded-lg border text-[10px] ${t.winner === "B" ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/30"}`}><span className="text-muted-foreground block mb-0.5">B</span>{t.variantB}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default AIStudio;
