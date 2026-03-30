import { useState } from "react";
import { Wand2, Image, FileText, Presentation, Users, Play, Settings, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const generators = [
  {
    id: "GEN-BANNER", name: "Banner Generator", icon: Image,
    description: "Create social media banners for LinkedIn, X, Instagram, and YouTube with automatic sizing and brand compliance",
    options: ["LinkedIn Company (1128×191)", "LinkedIn Personal (1584×396)", "X Header (1500×500)", "Instagram Post (1080×1080)", "YouTube Art (2560×1440)"],
    inputFields: [
      { name: "title", label: "Banner Title", placeholder: "Enter headline text..." },
      { name: "subtitle", label: "Subtitle", placeholder: "Enter subtitle..." },
    ],
  },
  {
    id: "GEN-CAROUSEL", name: "Carousel Generator", icon: Presentation,
    description: "Build LinkedIn carousel slides with consistent branding, auto-generated from content briefs or outlines",
    options: ["Product Showcase (5 slides)", "Technical Deep Dive (8 slides)", "Case Study (6 slides)", "Team Spotlight (4 slides)"],
    inputFields: [
      { name: "topic", label: "Carousel Topic", placeholder: "What's the carousel about?" },
      { name: "slides", label: "Number of Slides", placeholder: "5-10" },
    ],
  },
  {
    id: "GEN-PLAYBOOK", name: "Playbook Generator", icon: FileText,
    description: "Generate marketing playbooks with strategy frameworks, audience analysis, and content calendars",
    options: ["Campaign Playbook", "Content Strategy", "Launch Plan", "Quarterly Review"],
    inputFields: [
      { name: "campaign", label: "Campaign Name", placeholder: "Enter campaign name..." },
      { name: "goals", label: "Key Goals", placeholder: "What are the campaign goals?" },
    ],
  },
  {
    id: "GEN-PROFILE", name: "Profile Kit Generator", icon: Users,
    description: "Create professional profile kits with bio variations, headshot specs, speaking topics, and media materials",
    options: ["Executive Profile", "Speaker Kit", "Media Kit", "Team Profile"],
    inputFields: [
      { name: "name", label: "Full Name", placeholder: "Enter name..." },
      { name: "role", label: "Role / Title", placeholder: "Enter role..." },
    ],
  },
];

export function GeneratorTools() {
  const [selectedGen, setSelectedGen] = useState(generators[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const active = generators.find(g => g.id === selectedGen)!;

  const handleGenerate = () => {
    setIsGenerating(true);
    setGenerated(false);
    setTimeout(() => {
      setIsGenerating(false);
      setGenerated(true);
    }, 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Wand2 className="w-6 h-6 text-primary" />
          Generator Tools
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Create banners, carousels, playbooks, and profile kits with automated generation</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {generators.map(gen => {
          const GenIcon = gen.icon;
          return (
            <button key={gen.id} onClick={() => { setSelectedGen(gen.id); setGenerated(false); }}
              className={cn("bg-card/60 border rounded-xl p-4 text-left transition-all",
                selectedGen === gen.id ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/20"
              )}>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <GenIcon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{gen.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{gen.description}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card/60 border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" /> Configuration
          </h3>
          <div className="space-y-4">
            {active.inputFields.map(field => (
              <div key={field.name}>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">{field.label}</label>
                <input
                  placeholder={field.placeholder}
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Template</label>
              <div className="space-y-1">
                {active.options.map(opt => (
                  <label key={opt} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 cursor-pointer">
                    <input type="radio" name="template" className="accent-primary" />
                    <span className="text-sm text-foreground">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <button onClick={handleGenerate} disabled={isGenerating}
              className={cn("w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                isGenerating ? "bg-primary/50 text-primary-foreground/50" : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}>
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Play className="w-4 h-4" /> Generate</>
              )}
            </button>
          </div>
        </div>

        <div className="bg-card/60 border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Preview</h3>
          {generated ? (
            <div className="space-y-4">
              <div className="aspect-video bg-gradient-to-br from-primary/20 via-muted/30 to-cyan-500/20 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-foreground font-medium">Generation Complete</p>
                  <p className="text-xs text-muted-foreground mt-1">Asset ready for download</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                  Download Asset
                </button>
                <button className="flex-1 px-3 py-2 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors">
                  Edit & Customize
                </button>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-muted/20 rounded-lg flex items-center justify-center border border-dashed border-border">
              <div className="text-center">
                <Wand2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Configure and generate to see preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
