import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Sparkles, Linkedin, Twitter, Mail, FileText, ArrowRight, Copy, Check, RefreshCw, Lightbulb, ChevronRight, Clock } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const PLATFORM_CONFIGS = [
  {
    id: "linkedin",
    label: "LinkedIn Post",
    icon: Linkedin,
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
    maxChars: 3000,
    hint: "Professional narrative · hooks first · data-backed · 5–10 paragraphs",
  },
  {
    id: "twitter",
    label: "Twitter Thread",
    icon: Twitter,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    maxChars: 280,
    hint: "12–15 tweets · punchy opening · numbered insights · strong close",
  },
  {
    id: "newsletter",
    label: "Newsletter Edition",
    icon: Mail,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    maxChars: 5000,
    hint: "Subject line · opening hook · 3 key insights · CTA · signature",
  },
  {
    id: "article",
    label: "Long-form Article",
    icon: FileText,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    maxChars: 12000,
    hint: "Thesis · narrative arc · framework · examples · takeaways",
  },
];

const TOPIC_SPARKS = [
  "The overlooked reason enterprise AI projects fail in year two",
  "What maritime shipping patterns reveal about global supply chains in 2026",
  "Why most observability platforms measure the wrong things",
  "The compounding advantage of ecosystem investing over single-bet VC",
  "How I evaluate AI tools for actual enterprise deployment vs. demos",
  "The 6 Lenses framework: why every business needs a proprietary way of seeing",
];

const OUTPUT_TEMPLATES: Record<string, (input: string) => string[]> = {
  linkedin: (input) => [
    `I've been sitting on this for a while. Here's what I've learned building SZL Holdings across 8 portfolio companies:\n\n${input.slice(0, 120)}${input.length > 120 ? "..." : ""}\n\nThe conventional wisdom is wrong. Let me show you why.`,
    `Three years ago I made a call that most advisors thought was premature.\n\nHere's the full story — including what I got wrong.\n\n${input.slice(0, 200)}`,
    `The data doesn't lie.\n\n${input.slice(0, 150)}\n\nAnd yet most leaders are still operating with 2019 playbooks.\n\nHere's the framework we use across the SZL portfolio to stay ahead of this curve.`,
  ],
  twitter: (input) => [
    `1/ ${input.slice(0, 220)}\n\nThread 🧵`,
    `2/ Here's what most people miss: the problem isn't the technology.\n\nIt's the mental model.`,
    `3/ After deploying this across 8 enterprise platforms, we found 3 consistent patterns:\n\n• Pattern one emerges\n• Pattern two appears\n• Pattern three compounds`,
    `4/ The conventional playbook says X.\n\nWe tried that. It broke at scale.\n\nHere's what actually works:`,
    `5/ Bottom line: ${input.slice(0, 180)}\n\nSave this. You'll need it in Q3.`,
  ],
  newsletter: (input) => [
    `Subject: The thing nobody is saying about [topic]\n\n---\n\nThis week I want to talk about something I've been turning over for months.\n\n${input.slice(0, 300)}\n\nHere's the framework:\n\n**1. First principle**\n[Key insight]\n\n**2. Second principle**\n[Key insight]\n\n**3. Third principle**\n[Key insight]\n\nThe implication for you: If you're operating in this space, the next 18 months will separate those who see this clearly from those who don't.\n\nUntil next week,\nStephen`,
  ],
  article: (input) => [
    `# [Working Title]\n\nThe accepted narrative around [topic] needs revision. Here's why — and what the data actually shows.\n\n## The Conventional Wisdom\n\n${input.slice(0, 200)}\n\nThis sounds reasonable. Most practitioners accept it without question. It's also incomplete.\n\n## What We Observed\n\nBuilding [SZL portfolio company] across [N] enterprise deployments gave us a unique vantage point. The pattern that emerged contradicts the dominant model in three ways...\n\n## The Framework\n\nAfter working through this systematically, we developed a framework with three components:\n\n**Component 1:** [Name]\n[Explanation]\n\n**Component 2:** [Name]\n[Explanation]\n\n**Component 3:** [Name]\n[Explanation]\n\n## Implications\n\nIf this analysis is correct, several things follow for practitioners in this space...\n\n## Conclusion\n\nThe question isn't whether this shift is happening. It's whether your organization will lead it or react to it.`,
  ],
};

const recentPieces = [
  { title: "The 6 Lenses of Business Observability", platform: "linkedin", date: "Mar 20", reach: "94.7K", engagement: "4.2%" },
  { title: "Why AIOps Wins in 2026", platform: "newsletter", date: "Mar 15", reach: "41K", engagement: "6.8%" },
  { title: "Maritime AI Thread", platform: "twitter", date: "Mar 12", reach: "28.3K", engagement: "7.1%" },
  { title: "Ecosystem Investing Playbook", platform: "article", date: "Mar 1", reach: "12.4K", engagement: "5.9%" },
];

const platformIcon: Record<string, string> = {
  linkedin: "in",
  twitter: "𝕏",
  newsletter: "✉",
  article: "📄",
};

export default function ContentStudio() {
  usePageMeta({
    title: "Content Intelligence Studio | Stephen Lutar",
    description: "AI-powered content transformation — from raw ideas to platform-optimized articles, LinkedIn posts, Twitter threads, and newsletter editions.",
    canonical: "https://szlholdings.com/stephen/content-studio",
  });

  const [rawInput, setRawInput] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["linkedin"]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputs, setOutputs] = useState<Record<string, string[]>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function togglePlatform(id: string) {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id],
    );
  }

  function injectSpark(spark: string) {
    setRawInput(spark);
    textareaRef.current?.focus();
  }

  async function handleGenerate() {
    if (!rawInput.trim() || selectedPlatforms.length === 0) return;
    setIsGenerating(true);
    setOutputs({});
    await new Promise(r => setTimeout(r, 1800));
    const result: Record<string, string[]> = {};
    for (const p of selectedPlatforms) {
      const fn = OUTPUT_TEMPLATES[p];
      result[p] = fn ? fn(rawInput) : [`[${p} output for: ${rawInput.slice(0, 80)}...]`];
    }
    setOutputs(result);
    setIsGenerating(false);
  }

  function copyText(key: string, text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Content Intelligence Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Transform raw ideas into platform-optimized content — articles, posts, threads, newsletters</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">AI-Powered</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" /> Raw Idea / Research Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                ref={textareaRef}
                value={rawInput}
                onChange={e => setRawInput(e.target.value)}
                placeholder="Drop in a rough idea, research note, observation, or voice memo transcript. The studio will transform it into polished, platform-specific content..."
                className="w-full min-h-[160px] bg-muted/30 border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground/50 resize-y focus:outline-none focus:border-primary/40 transition-colors"
              />

              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Topic Sparks</p>
                <div className="flex flex-wrap gap-2">
                  {TOPIC_SPARKS.map(spark => (
                    <button
                      key={spark}
                      onClick={() => injectSpark(spark)}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-muted/50 border border-border hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {spark.length > 48 ? spark.slice(0, 48) + "…" : spark}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Target Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {PLATFORM_CONFIGS.map(p => {
                  const Icon = p.icon;
                  const selected = selectedPlatforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${selected ? p.bg + " border-opacity-60" : "bg-muted/20 border-border hover:border-muted-foreground/20"}`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 ${selected ? p.color : "text-muted-foreground"}`} />
                      <div>
                        <div className={`text-xs font-semibold ${selected ? "" : "text-muted-foreground"}`}>{p.label}</div>
                        <div className="text-[10px] text-muted-foreground/70 mt-0.5 leading-snug">{p.hint}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <button
            onClick={handleGenerate}
            disabled={!rawInput.trim() || selectedPlatforms.length === 0 || isGenerating}
            className="w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating content…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Transform to Platform Content
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>

          {Object.keys(outputs).length > 0 && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Generated Outputs</p>
              {PLATFORM_CONFIGS.filter(p => outputs[p.id]).map(p => {
                const Icon = p.icon;
                const content = outputs[p.id]!;
                const fullText = content.join("\n\n");
                const copyKey = `output-${p.id}`;
                return (
                  <Card key={p.id} className={`border ${p.bg.split(" ")[1]}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs flex items-center justify-between">
                        <span className={`flex items-center gap-1.5 ${p.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {p.label}
                        </span>
                        <button
                          onClick={() => copyText(copyKey, fullText)}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded bg-muted/40"
                        >
                          {copiedKey === copyKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedKey === copyKey ? "Copied" : "Copy all"}
                        </button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {content.map((block, i) => (
                        <div key={i} className="group relative">
                          <pre className="text-xs text-foreground/85 whitespace-pre-wrap leading-relaxed font-sans bg-black/20 rounded-lg p-3 border border-white/5">
                            {p.id === "twitter" && <span className="text-muted-foreground/50 mr-1">{i + 1}/{content.length}</span>}
                            {block}
                          </pre>
                          <button
                            onClick={() => copyText(`${copyKey}-${i}`, block)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] bg-muted/80 px-2 py-0.5 rounded text-muted-foreground hover:text-foreground"
                          >
                            {copiedKey === `${copyKey}-${i}` ? "✓" : "Copy"}
                          </button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                Recent Pieces
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentPieces.map(piece => (
                <div key={piece.title} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/20 border border-border">
                  <span className="text-[11px] w-6 h-6 rounded flex items-center justify-center bg-muted font-bold shrink-0">
                    {platformIcon[piece.platform]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-snug truncate">{piece.title}</p>
                    <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                      <span>{piece.date}</span>
                      <span className="text-primary">{piece.reach}</span>
                      <span className="text-emerald-400">{piece.engagement}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Content Cadence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { day: "Mon", type: "LinkedIn", color: "bg-sky-500" },
                  { day: "Wed", type: "Thread", color: "bg-blue-500" },
                  { day: "Thu", type: "Newsletter", color: "bg-amber-500" },
                  { day: "Fri", type: "Article", color: "bg-emerald-500" },
                ].map(item => (
                  <div key={item.day} className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-muted-foreground w-7">{item.day}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} opacity-60 rounded-full`} style={{ width: "100%" }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{item.type}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-[10px] text-muted-foreground">Next scheduled:</p>
                <p className="text-xs font-semibold mt-0.5">LinkedIn Post <span className="text-primary">Mon Apr 15</span></p>
                <button className="mt-2 text-[10px] text-primary flex items-center gap-1 hover:opacity-80 transition-opacity">
                  Edit calendar <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Content Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {[
                  { platform: "LinkedIn", posts: 18, avgReach: "42K", color: "bg-sky-500" },
                  { platform: "Newsletter", posts: 12, avgReach: "38K", color: "bg-amber-500" },
                  { platform: "Twitter", posts: 24, avgReach: "8.4K", color: "bg-blue-500" },
                  { platform: "Articles", posts: 6, avgReach: "21K", color: "bg-emerald-500" },
                ].map(p => (
                  <div key={p.platform}>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>{p.platform}</span>
                      <span>{p.posts} pieces · <span className="text-foreground/70">{p.avgReach} avg reach</span></span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${p.color} opacity-50 rounded-full`}
                        style={{ width: `${Math.min(100, (parseInt(p.avgReach) / 42) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
