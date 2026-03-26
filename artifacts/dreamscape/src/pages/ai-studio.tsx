import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, ImageIcon, FileText, Calendar, Loader2, Lightbulb, Palette, Globe, Zap } from "lucide-react";
import { Button, Card, Badge, Input } from "@/components/ui";

const API_BASE = "/api";
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { "Content-Type": "application/json", ...options?.headers }, credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function AIStudio() {
  const { data: contentIdeas } = useQuery({ queryKey: ["intel-content-ideas"], queryFn: () => apiFetch<any>("/intelligence/ai/content-ideas", { method: "POST", body: JSON.stringify({ topic: "technology innovation" }) }), retry: 1 });
  const { data: techTrends = [] } = useQuery({ queryKey: ["intel-tech-trends"], queryFn: () => apiFetch<any[]>("/intelligence/tech-trends") });
  const { data: calendar = [] } = useQuery({ queryKey: ["intel-cultural-calendar"], queryFn: () => apiFetch<any[]>("/intelligence/cultural-calendar") });

  const [imagePrompt, setImagePrompt] = React.useState("");
  const [briefTopic, setBriefTopic] = React.useState("");

  const imageMutation = useMutation({
    mutationFn: (prompt: string) => apiFetch<any>("/intelligence/ai/generate-image", { method: "POST", body: JSON.stringify({ prompt }) }),
  });

  const briefMutation = useMutation({
    mutationFn: (topic: string) => apiFetch<any>("/intelligence/ai/chat", { method: "POST", body: JSON.stringify({ messages: [{ role: "system", content: "You are a creative director. Generate a concise content brief." }, { role: "user", content: `Create a content brief for: ${topic}` }] }) }),
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" /> AI Creative Studio
          </h1>
          <p className="text-muted-foreground mt-1">AI-powered content ideation, image generation, and creative tools.</p>
        </div>
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
            <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-400" /> AI Image Generation
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Generate concept art and mood boards using Stable Diffusion.</p>
            <div className="flex gap-2 mb-4">
              <Input placeholder="Describe your vision..." value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && imagePrompt && imageMutation.mutate(imagePrompt)} />
              <Button onClick={() => imagePrompt && imageMutation.mutate(imagePrompt)} disabled={imageMutation.isPending || !imagePrompt}>
                {imageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Palette className="w-4 h-4" />}
              </Button>
            </div>
            {imageMutation.data && (
              <div className="rounded-xl overflow-hidden border border-border/30">
                <img src={`data:${imageMutation.data.mimeType || "image/png"};base64,${imageMutation.data.imageBase64}`} alt="AI Generated" className="w-full" />
                <div className="p-3 bg-background/50">
                  <p className="text-xs text-muted-foreground">Model: {imageMutation.data.model}</p>
                </div>
              </div>
            )}
            {imageMutation.isError && (
              <p className="text-sm text-destructive">Failed to generate image. Try again.</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {["futuristic tech dashboard", "cybersecurity abstract art", "maritime sunset concept", "modern brand identity"].map(p => (
                <button key={p} onClick={() => { setImagePrompt(p); imageMutation.mutate(p); }} className="text-xs px-3 py-1.5 rounded-full border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground">{p}</button>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-6 border-border/50">
            <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" /> AI Content Brief Generator
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Generate comprehensive content briefs powered by AI.</p>
            <div className="flex gap-2 mb-4">
              <Input placeholder="Enter topic or campaign theme..." value={briefTopic} onChange={e => setBriefTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && briefTopic && briefMutation.mutate(briefTopic)} />
              <Button onClick={() => briefTopic && briefMutation.mutate(briefTopic)} disabled={briefMutation.isPending || !briefTopic}>
                {briefMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              </Button>
            </div>
            {briefMutation.data && (
              <div className="p-4 rounded-xl border border-border/30 bg-background/50">
                <p className="text-xs text-muted-foreground mb-2">AI Generated Brief</p>
                <p className="text-sm whitespace-pre-wrap">{briefMutation.data.content}</p>
                <p className="text-[10px] text-muted-foreground mt-3">Provider: {briefMutation.data.provider} | Model: {briefMutation.data.model}</p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

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
