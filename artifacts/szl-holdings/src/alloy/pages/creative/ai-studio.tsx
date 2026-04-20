import { useStandardMutation } from '@szl-holdings/api-client-react';
import { ShimmerReveal, TypewriterText } from '@szl-holdings/shared-ui/ai-components';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  Globe,
  ImageIcon,
  Layers,
  Lightbulb,
  Loader2,
  Music,
  Palette,
  Sparkles,
  TrendingUp,
  Type,
  Video,
  Wand2,
  Zap,
} from 'lucide-react';
import * as React from 'react';

const demoContentIdeas = {
  ideas: [
    {
      title: 'Behind the Lens: AI in Film Production',
      format: 'Documentary',
      audience: 'Tech Creatives',
      trendAlignment: 94,
      estimatedEngagement: 'High',
    },
    {
      title: 'The Future of Brand Storytelling',
      format: 'Long-form Video',
      audience: 'Marketing Leaders',
      trendAlignment: 88,
      estimatedEngagement: 'Very High',
    },
    {
      title: 'Gen Z Visual Language: A Creative Guide',
      format: 'Social Series',
      audience: 'Gen Z Consumers',
      trendAlignment: 91,
      estimatedEngagement: 'High',
    },
    {
      title: 'Sustainable Fashion Campaign Blueprint',
      format: 'Multi-platform',
      audience: 'Eco-Conscious',
      trendAlignment: 85,
      estimatedEngagement: 'Medium',
    },
  ],
  trendingTopics: [
    'AI Cinema',
    'Spatial Computing',
    'Neo-Brutalism Design',
    'Haptic Storytelling',
    'Ambient Computing',
  ],
};

const demoTechTrends = [
  {
    name: 'Spatial Video',
    category: 'Emerging',
    momentum: 92,
    direction: 'Accelerating',
    relevance: 'critical',
  },
  {
    name: 'Neural Radiance Fields',
    category: 'VFX',
    momentum: 87,
    direction: 'Growing',
    relevance: 'high',
  },
  {
    name: 'Volumetric Capture',
    category: 'Production',
    momentum: 78,
    direction: 'Steady',
    relevance: 'high',
  },
  {
    name: 'Real-time Ray Tracing',
    category: 'Rendering',
    momentum: 95,
    direction: 'Accelerating',
    relevance: 'critical',
  },
  {
    name: 'AI Motion Capture',
    category: 'Animation',
    momentum: 84,
    direction: 'Growing',
    relevance: 'high',
  },
  {
    name: 'Procedural Audio',
    category: 'Sound',
    momentum: 71,
    direction: 'Emerging',
    relevance: 'medium',
  },
  {
    name: 'LED Virtual Production',
    category: 'Production',
    momentum: 89,
    direction: 'Mainstream',
    relevance: 'critical',
  },
  {
    name: 'Generative Music',
    category: 'Audio',
    momentum: 76,
    direction: 'Growing',
    relevance: 'medium',
  },
];

const demoCalendar = [
  {
    event: 'Cannes Lions Festival',
    date: 'Jun 16-20',
    relevance: 'Major creative showcase, deadline for entries',
    region: 'Global',
  },
  {
    event: 'World Environment Day',
    date: 'Jun 5',
    relevance: 'Sustainability campaign launch window',
    region: 'Global',
  },
  {
    event: 'Apple WWDC',
    date: 'Jun 9',
    relevance: 'Spatial computing content opportunities',
    region: 'Tech',
  },
  {
    event: 'Pride Month',
    date: 'June',
    relevance: 'Inclusive storytelling campaigns',
    region: 'Global',
  },
];

const aiTools = [
  {
    id: 'gen-imagery',
    name: 'Generative Imagery',
    description:
      'Create concept art, mood boards, and visual explorations using Stable Diffusion XL and DALL-E 3. Train custom LoRA models on brand assets.',
    icon: ImageIcon,
    tech: 'SDXL / DALL-E 3',
    color: 'text-purple-400',
    bgColor: 'from-purple-500/20 to-violet-500/10',
    capabilities: [
      'Concept Art Generation',
      'Brand-Trained LoRA Models',
      'Style Transfer',
      'Mood Board Assembly',
    ],
  },
  {
    id: 'ai-voiceover',
    name: 'AI Voiceover Studio',
    description:
      'Ultra-realistic voice synthesis powered by ElevenLabs. Clone talent voices for pre-production scratch tracks.',
    icon: Music,
    tech: 'ElevenLabs V2',
    color: 'text-amber-400',
    bgColor: 'from-amber-500/20 to-orange-500/10',
    capabilities: [
      'Voice Cloning',
      'Multi-language Synthesis',
      'Emotion Control',
      'Scratch Track Generation',
    ],
  },
  {
    id: 'video-gen',
    name: 'Motion Generation',
    description:
      'Generate video from text prompts or extend existing footage using RunwayML Gen-3 Alpha.',
    icon: Video,
    tech: 'RunwayML Gen-3',
    color: 'text-blue-400',
    bgColor: 'from-cyan-500/20 to-blue-500/10',
    capabilities: ['Text-to-Video', 'Image-to-Video', 'Camera Motion Control', 'B-Roll Generation'],
  },
  {
    id: 'color-grade',
    name: 'AI Color Grading',
    description: 'Automated color grading with DaVinci Resolve neural engine integration.',
    icon: Palette,
    tech: 'DaVinci Neural',
    color: 'text-rose-400',
    bgColor: 'from-rose-500/20 to-pink-500/10',
    capabilities: [
      'Auto Color Match',
      'LUT Generation',
      'Film Emulation',
      'Scene-to-Scene Consistency',
    ],
  },
  {
    id: 'copy-gen',
    name: 'Campaign Copy Engine',
    description: 'Generate headlines, body copy, CTAs, and full campaign messaging frameworks.',
    icon: Type,
    tech: 'GPT-4o / Claude',
    color: 'text-emerald-400',
    bgColor: 'from-emerald-500/20 to-green-500/10',
    capabilities: [
      'Headline Generation',
      'A/B Copy Variants',
      'Brand Voice Matching',
      'Multi-Format Adaptation',
    ],
  },
  {
    id: 'vfx-comp',
    name: 'VFX Compositing',
    description: 'AI-assisted rotoscoping, background replacement, and object removal.',
    icon: Layers,
    tech: 'Nuke AI / AE',
    color: 'text-indigo-400',
    bgColor: 'from-indigo-500/20 to-blue-500/10',
    capabilities: ['AI Rotoscoping', 'Background Replacement', 'Object Removal', 'Sky Replacement'],
  },
];

export default function AIStudio() {
  const [imagePrompt, setImagePrompt] = React.useState('');
  const [briefTopic, setBriefTopic] = React.useState('');
  const [tone, setTone] = React.useState(50);
  const [copyResult, setCopyResult] = React.useState('');
  const [copyDone, setCopyDone] = React.useState(false);
  const [selectedTool, setSelectedTool] = React.useState<string | null>(null);

  const toneLabel =
    tone < 25
      ? 'Corporate'
      : tone < 50
        ? 'Professional'
        : tone < 75
          ? 'Conversational'
          : 'Bold & Provocative';

  const imageMutation = useStandardMutation({
    mutationFn: async (prompt: string) => {
      const res = await fetch('/api/alloy-chat/image-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt, provider: 'openai', size: '1024x1024' }),
      });
      if (!res.ok) throw new Error('Image generation failed');
      return res.json();
    },
  });

  const generateCampaignCopy = async () => {
    if (!briefTopic.trim()) return;
    setCopyResult('');
    setCopyDone(false);
    const toneStr =
      tone < 25 ? 'corporate' : tone < 50 ? 'professional' : tone < 75 ? 'conversational' : 'bold';
    try {
      const res = await fetch('/api/intelligence/ai/campaign-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ topic: briefTopic.trim(), tone: toneStr, format: 'full-campaign' }),
      });
      if (!res.ok || !res.body) throw new Error('Stream failed');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.done) {
              setCopyDone(true);
              break;
            }
            if (json.error) throw new Error(json.error);
            if (json.content) setCopyResult((prev) => prev + json.content);
          } catch {}
        }
      }
      setCopyDone(true);
    } catch (err) {
      setCopyResult(`Error: ${err instanceof Error ? err.message : 'Generation failed'}`);
      setCopyDone(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-blue-400" />
            </div>
            AI Creative Studio
          </h1>
          <p className="text-slate-400 mt-1">
            AI tools for ideation, generation, and post-production.
          </p>
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
            <div
              className={`p-5 border rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-400/5 ${selectedTool === tool.id ? 'border-blue-400/30 ring-1 ring-cyan-400/10' : 'border-white/8 bg-[#0d1117] hover:border-blue-400/15'}`}
              onClick={() => setSelectedTool(selectedTool === tool.id ? null : tool.id)}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.bgColor} flex items-center justify-center shrink-0`}
                >
                  <tool.icon className={`w-6 h-6 ${tool.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm text-white">{tool.name}</h3>
                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-white/10 text-slate-500 shrink-0">
                      {tool.tech}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {tool.description}
                  </p>
                </div>
              </div>
              <AnimatePresence>
                {selectedTool === tool.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-white/8"
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {tool.capabilities.map((cap) => (
                        <span
                          key={cap}
                          className="text-[10px] px-2 py-0.5 rounded border border-blue-500/20 bg-blue-500/5 text-blue-400"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <div className="p-6 border border-white/8 bg-[#0d1117] rounded-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" /> AI Content Ideas
            </h3>
            <div className="space-y-3">
              {demoContentIdeas.ideas.map((idea, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl border border-white/8 hover:border-blue-400/15 transition-all cursor-pointer group bg-white/2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {idea.title}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-slate-400">
                          {idea.format}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded border border-blue-500/20 text-blue-400">
                          {idea.audience}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-blue-400">
                        <TrendingUp className="w-3 h-3" /> {idea.trendAlignment}%
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {idea.estimatedEngagement} engagement
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/8">
              <p className="text-xs text-slate-500 mb-2">Trending Topics</p>
              <div className="flex flex-wrap gap-2">
                {demoContentIdeas.trendingTopics.map((t, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-1 rounded border border-blue-500/20 bg-blue-500/5 text-blue-400"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="p-6 border border-white/8 bg-[#0d1117] rounded-xl h-full">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" /> Cultural Calendar
            </h3>
            <div className="space-y-3">
              {demoCalendar.map((event, i) => (
                <div key={i} className="p-3 rounded-lg border border-white/8 bg-white/2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{event.event}</span>
                    <span className="text-[10px] text-slate-500">{event.date}</span>
                  </div>
                  <p className="text-xs text-slate-500">{event.relevance}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-slate-500 mt-1 inline-block">
                    {event.region}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-6 border border-white/8 bg-[#0d1117] rounded-xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-400" /> Generative Imagery
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Generate concept art, mood boards, and visual explorations.
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Describe your creative vision..."
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && imagePrompt && imageMutation.mutate(imagePrompt)
                }
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/30"
              />
              <button
                onClick={() => imagePrompt && imageMutation.mutate(imagePrompt)}
                disabled={imageMutation.isPending || !imagePrompt}
                className="px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {imageMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
              </button>
            </div>
            <ShimmerReveal isLoading={imageMutation.isPending} className="h-[200px] w-full">
              {imageMutation.data && (
                <div className="rounded-xl overflow-hidden border border-white/10">
                  <img
                    src={`data:${imageMutation.data.mimeType || 'image/png'};base64,${imageMutation.data.imageBase64}`}
                    alt="AI Generated"
                    className="w-full"
                  />
                  <div className="p-3 bg-white/3">
                    <p className="text-xs text-slate-500">
                      Model: {imageMutation.data.model} | Tier: {imageMutation.data.tier}
                    </p>
                  </div>
                </div>
              )}
            </ShimmerReveal>
            {imageMutation.isError && (
              <p className="text-sm text-red-400 mt-2">Failed to generate image. Try again.</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                'cinematic car reveal, volumetric fog, golden hour',
                'luxury product flatlay, marble surface, dramatic lighting',
                'aerial landscape, Patagonian mountains, dawn mist',
                'abstract brand identity, geometric, amber and obsidian',
              ].map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setImagePrompt(p);
                    imageMutation.mutate(p);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-white/10 hover:border-blue-400/20 hover:bg-blue-400/3 transition-all text-slate-500 hover:text-slate-300"
                >
                  {p.split(',')[0]}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="p-6 border border-white/8 bg-[#0d1117] rounded-xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Type className="w-5 h-5 text-emerald-400" /> Campaign Copy Engine
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Generate brand-matched campaign copy with tone control.
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Campaign theme (e.g., electric vehicle launch)..."
                value={briefTopic}
                onChange={(e) => setBriefTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateCampaignCopy()}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/30"
              />
              <button
                onClick={generateCampaignCopy}
                disabled={!briefTopic}
                className="px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Zap className="w-4 h-4" />
              </button>
            </div>
            <div className="mb-4 p-3 rounded-xl border border-white/8 bg-white/2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Brand Voice Tone</span>
                <span className="text-xs font-medium text-blue-400">{toneLabel}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={tone}
                onChange={(e) => setTone(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                <span>Corporate</span>
                <span>Professional</span>
                <span>Conversational</span>
                <span>Bold</span>
              </div>
            </div>
            {copyResult && (
              <div className="p-4 rounded-xl border border-white/8 bg-white/2">
                {copyDone ? (
                  <TypewriterText
                    text={copyResult}
                    speed={15}
                    className="text-sm text-slate-200 whitespace-pre-wrap"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating copy...
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="p-6 border border-white/8 bg-[#0d1117] rounded-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" /> Technology Trend Radar
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {demoTechTrends.map((trend, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`p-4 rounded-xl border transition-all cursor-pointer hover:-translate-y-0.5 ${trend.relevance === 'critical' ? 'border-blue-500/20 bg-blue-500/3' : 'border-white/8 bg-white/2'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-slate-500">
                    {trend.category}
                  </span>
                  <span className="text-xs text-blue-400 font-bold">{trend.momentum}%</span>
                </div>
                <p className="text-sm font-semibold text-white">{trend.name}</p>
                <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-400 rounded-full"
                    style={{ width: `${trend.momentum}%` }}
                  />
                </div>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500">
                  <TrendingUp className="w-3 h-3" /> {trend.direction}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
