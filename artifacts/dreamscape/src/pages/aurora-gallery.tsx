import { Sparkles, Palette, Wand2, Eye, Download, Star, Layers, Image, Zap } from "lucide-react";
import { useState } from "react";

const creativeEffects = [
  { id: 1, name: "Nebula Gradient", category: "Background", style: "bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500", description: "Deep space nebula effect with vivid gradients", popularity: 94 },
  { id: 2, name: "Aurora Borealis", category: "Background", style: "bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500", description: "Northern lights inspired flowing gradient", popularity: 98 },
  { id: 3, name: "Sunset Blaze", category: "Background", style: "bg-gradient-to-br from-orange-500 via-red-500 to-rose-600", description: "Warm sunset color cascade", popularity: 87 },
  { id: 4, name: "Midnight Storm", category: "Background", style: "bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900", description: "Dark dramatic storm palette", popularity: 91 },
  { id: 5, name: "Crystal Ice", category: "Overlay", style: "bg-gradient-to-br from-sky-200 via-blue-100 to-white", description: "Cool frosted ice crystal texture", popularity: 76 },
  { id: 6, name: "Golden Hour", category: "Lighting", style: "bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-300", description: "Warm golden hour photography lighting", popularity: 89 },
  { id: 7, name: "Cyber Neon", category: "Effect", style: "bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600", description: "Cyberpunk neon glow effect", popularity: 95 },
  { id: 8, name: "Forest Mist", category: "Background", style: "bg-gradient-to-br from-green-800 via-emerald-700 to-teal-600", description: "Misty forest canopy atmosphere", popularity: 82 },
];

const storyboardTemplates = [
  { name: "Brand Story Arc", scenes: 5, duration: "60s", mood: "Inspirational", assets: 12 },
  { name: "Product Launch", scenes: 8, duration: "90s", mood: "Exciting", assets: 18 },
  { name: "Case Study Narrative", scenes: 6, duration: "120s", mood: "Professional", assets: 15 },
  { name: "Social Media Hook", scenes: 3, duration: "15s", mood: "Bold", assets: 6 },
];

const pipelineStages = [
  { stage: "Concept", status: "complete", items: 24, description: "Initial creative concepts and mood boards" },
  { stage: "Generation", status: "active", items: 12, description: "AI-assisted asset generation in progress" },
  { stage: "Refinement", status: "pending", items: 8, description: "Human review and style adjustments" },
  { stage: "Production", status: "pending", items: 0, description: "Final render and format optimization" },
  { stage: "Distribution", status: "pending", items: 0, description: "Multi-channel asset delivery" },
];

export default function AuroraGallery() {
  const [category, setCategory] = useState("all");
  const filtered = category === "all" ? creativeEffects : creativeEffects.filter(e => e.category.toLowerCase() === category);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" /> Aurora Creative Engine
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Visual storytelling tools, generative effects, and creative pipeline</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-400" /> Creative Pipeline
        </h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {pipelineStages.map((stage, i) => (
            <div key={stage.stage} className="flex items-center gap-2 shrink-0">
              <div className={`rounded-lg border p-4 min-w-[180px] ${
                stage.status === "complete" ? "border-emerald-500/30 bg-emerald-500/5" :
                stage.status === "active" ? "border-primary/30 bg-primary/5" :
                "border-border"
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase text-muted-foreground">{stage.stage}</span>
                  <span className={`w-2 h-2 rounded-full ${stage.status === "complete" ? "bg-emerald-400" : stage.status === "active" ? "bg-primary animate-pulse" : "bg-muted-foreground/30"}`} />
                </div>
                <div className="text-lg font-bold">{stage.items}</div>
                <div className="text-[10px] text-muted-foreground">{stage.description}</div>
              </div>
              {i < pipelineStages.length - 1 && <Zap className="w-4 h-4 text-muted-foreground/30 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <Palette className="w-4 h-4 text-pink-400" /> Generative Effects Gallery
          </h2>
          <div className="flex items-center gap-2">
            {["all", "background", "overlay", "effect", "lighting"].map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${category === c ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((effect) => (
            <div key={effect.id} className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors cursor-pointer group">
              <div className={`h-32 ${effect.style}`} />
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold">{effect.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-amber-400">
                    <Star className="w-3 h-3" /> {effect.popularity}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{effect.description}</p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{effect.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-blue-400" /> Visual Storytelling Templates
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {storyboardTemplates.map((tmpl) => (
            <div key={tmpl.name} className="rounded-lg border border-border p-4 hover:border-primary/30 transition-colors cursor-pointer">
              <h3 className="text-sm font-semibold mb-2">{tmpl.name}</h3>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>{tmpl.scenes} scenes · {tmpl.duration}</div>
                <div>Mood: {tmpl.mood}</div>
                <div>{tmpl.assets} assets included</div>
              </div>
              <button className="mt-3 w-full py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                Use Template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
