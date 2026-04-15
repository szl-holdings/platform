import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { CalendarDays, Sparkles, Clock, Linkedin, Twitter, Mail, FileText, Mic } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKS = 4;

type ContentItem = {
  id: string;
  title: string;
  platform: "linkedin" | "twitter" | "newsletter" | "article" | "podcast";
  day: number;
  week: number;
  status: "published" | "scheduled" | "draft" | "idea";
  predictedReach: string;
  optimalTime: string;
  topic: string;
  confidence: number;
};

const contentItems: ContentItem[] = [
  { id: "c1", title: "AI-Native Company Blueprint", platform: "linkedin", day: 0, week: 0, status: "published", predictedReach: "280K", optimalTime: "8:30 AM", topic: "AI Strategy", confidence: 94 },
  { id: "c2", title: "Maritime Dark Ship Thread", platform: "twitter", day: 2, week: 0, status: "published", predictedReach: "28K", optimalTime: "7:15 AM", topic: "Maritime AI", confidence: 88 },
  { id: "c3", title: "Q1 Ecosystem Update", platform: "newsletter", day: 3, week: 0, status: "published", predictedReach: "41K", optimalTime: "6:00 AM", topic: "SZL Ecosystem", confidence: 96 },
  { id: "c4", title: "The 6 Lenses of Observability", platform: "article", day: 1, week: 1, status: "published", predictedReach: "90K", optimalTime: "9:00 AM", topic: "Observability", confidence: 92 },
  { id: "c5", title: "AIOps vs. Traditional Ops", platform: "linkedin", day: 3, week: 1, status: "scheduled", predictedReach: "240K", optimalTime: "8:00 AM", topic: "AIOps", confidence: 91 },
  { id: "c6", title: "Real Estate AI Thread", platform: "twitter", day: 5, week: 1, status: "scheduled", predictedReach: "22K", optimalTime: "7:00 AM", topic: "PropTech", confidence: 82 },
  { id: "c7", title: "Ecosystem Investing Deep Dive", platform: "newsletter", day: 3, week: 2, status: "draft", predictedReach: "41K", optimalTime: "6:00 AM", topic: "Investing", confidence: 89 },
  { id: "c8", title: "Cybersecurity AI Keynote Recap", platform: "linkedin", day: 0, week: 2, status: "draft", predictedReach: "190K", optimalTime: "9:30 AM", topic: "Cybersecurity", confidence: 86 },
  { id: "c9", title: "Solo Founder Playbook Pt. 1", platform: "article", day: 2, week: 2, status: "idea", predictedReach: "65K", optimalTime: "8:00 AM", topic: "Founder Journey", confidence: 93 },
  { id: "c10", title: "Q2 Market Intelligence Roundup", platform: "newsletter", day: 3, week: 3, status: "idea", predictedReach: "41K", optimalTime: "6:00 AM", topic: "SZL Ecosystem", confidence: 88 },
  { id: "c11", title: "Why AIOps Matters for CISOs", platform: "linkedin", day: 1, week: 3, status: "idea", predictedReach: "230K", optimalTime: "8:30 AM", topic: "Cybersecurity", confidence: 90 },
  { id: "c12", title: "Vessels Case Study Thread", platform: "twitter", day: 4, week: 3, status: "idea", predictedReach: "18K", optimalTime: "7:30 AM", topic: "Maritime AI", confidence: 84 },
];

const aiSuggestions = [
  { title: "The hidden cost of monolithic observability stacks", topic: "AIOps", platform: "linkedin", predictedReach: "310K", trend: "↑ Trending in enterprise tech", confidence: 96 },
  { title: "3 signals that predict supply chain disruption 14 days out", topic: "Maritime AI", platform: "twitter", predictedReach: "38K", trend: "↑ High engagement topic", confidence: 92 },
  { title: "Why I turned down a $2M acquisition offer", topic: "Founder Journey", platform: "newsletter", predictedReach: "41K", trend: "↑ Personal narrative performing well", confidence: 94 },
  { title: "AI SOC vs. traditional SOC: a real-world comparison", topic: "Cybersecurity", platform: "article", predictedReach: "78K", trend: "↑ Gap in market coverage", confidence: 89 },
  { title: "Ecosystem moat: the startup metric nobody measures", topic: "Investing", platform: "linkedin", predictedReach: "265K", trend: "↑ Contrarian view opportunity", confidence: 91 },
];

const platformColors: Record<string, string> = {
  linkedin: "bg-sky-500/20 border-sky-500/30 text-sky-400",
  twitter: "bg-blue-500/20 border-blue-500/30 text-blue-400",
  newsletter: "bg-amber-500/20 border-amber-500/30 text-amber-400",
  article: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400",
  podcast: "bg-violet-500/20 border-violet-500/30 text-violet-400",
};

const statusColors: Record<string, string> = {
  published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  scheduled: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  draft: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  idea: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
};

const PlatformIcon = ({ platform, className = "w-3.5 h-3.5" }: { platform: string; className?: string }) => {
  switch (platform) {
    case "linkedin": return <Linkedin className={className} />;
    case "twitter": return <Twitter className={className} />;
    case "newsletter": return <Mail className={className} />;
    case "article": return <FileText className={className} />;
    case "podcast": return <Mic className={className} />;
    default: return null;
  }
};

export default function ContentCalendar() {
  usePageMeta({
    title: "Content Calendar | Stephen Lutar — Editorial Intelligence",
    description: "AI-powered content calendar with trending topic intelligence, performance prediction, and optimal posting time recommendations.",
    canonical: "https://szlholdings.com/stephen/content-calendar",
  });

  const [activeTab, setActiveTab] = useState<"calendar" | "suggestions" | "performance" | "schedule">("calendar");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const selectedContent = contentItems.find(c => c.id === selectedItem);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary" />
            Content Calendar & Editorial Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-1">AI-powered planning with trending topics, performance prediction, and optimal timing</p>
        </div>
        <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">
          <Sparkles className="w-3 h-3 mr-1" />
          5 AI Suggestions Ready
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Posts This Month", value: "18", color: "text-primary", sub: "Across all platforms" },
          { label: "Avg Predicted Reach", value: "82K", color: "text-sky-400", sub: "Per piece of content" },
          { label: "Content Streak", value: "47 days", color: "text-emerald-400", sub: "Consistent publishing" },
          { label: "Pieces Scheduled", value: "7", color: "text-amber-400", sub: "Next 4 weeks" },
        ].map(({ label, value, color, sub }) => (
          <Card key={label} className="bg-card/50 border-border/40">
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
              <div className="text-xs text-muted-foreground/60 mt-1">{sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 border-b border-border/40">
        {(["calendar", "suggestions", "performance", "schedule"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "calendar" && (
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-1 text-xs text-center text-muted-foreground font-medium mb-1">
            {DAYS.map(d => <div key={d}>{d}</div>)}
          </div>
          {Array.from({ length: WEEKS }, (_, week) => (
            <div key={week} className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }, (_, day) => {
                const items = contentItems.filter(c => c.day === day && c.week === week);
                return (
                  <div key={day} className="min-h-[80px] p-1 bg-muted/10 border border-border/20 rounded-lg">
                    <div className="text-[10px] text-muted-foreground/40 mb-1 text-right pr-1">
                      {week * 7 + day + 1}
                    </div>
                    <div className="space-y-1">
                      {items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                          className={`w-full text-left p-1.5 rounded border text-[10px] font-medium leading-tight transition-all ${platformColors[item.platform]} ${selectedItem === item.id ? "ring-1 ring-primary" : ""}`}
                        >
                          <div className="flex items-center gap-1">
                            <PlatformIcon platform={item.platform} className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{item.title}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {selectedContent && (
            <Card className="bg-primary/5 border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{selectedContent.title}</span>
                      <Badge variant="outline" className={`text-xs ${statusColors[selectedContent.status]}`}>{selectedContent.status}</Badge>
                      <Badge variant="outline" className={`text-xs ${platformColors[selectedContent.platform]}`}>{selectedContent.platform}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Topic: <span className="text-foreground">{selectedContent.topic}</span></span>
                      <span>Optimal time: <span className="text-foreground">{selectedContent.optimalTime}</span></span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-primary">{selectedContent.predictedReach}</div>
                    <div className="text-xs text-muted-foreground">predicted reach</div>
                    <div className="text-xs text-emerald-400">{selectedContent.confidence}% confidence</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "suggestions" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">AI-generated topic suggestions based on trending signals, audience engagement patterns, and competitive content gaps.</p>
          </div>
          <div className="space-y-3">
            {aiSuggestions.map((s, i) => (
              <Card key={i} className="bg-card/50 border-border/40 hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">"{s.title}"</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <Badge variant="outline" className={`text-xs ${platformColors[s.platform]}`}>{s.platform}</Badge>
                        <span className="text-amber-400">{s.trend}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-primary">{s.predictedReach}</div>
                      <div className="text-xs text-muted-foreground">predicted reach</div>
                      <div className="text-xs text-emerald-400">{s.confidence}% confidence</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded text-xs text-primary transition-colors">
                      <CalendarDays className="w-3 h-3" />
                      Schedule
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/30 border border-border/40 rounded text-xs transition-colors hover:bg-muted/50">
                      <Sparkles className="w-3 h-3" />
                      Draft with AI
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "performance" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { platform: "LinkedIn", posts: 18, avgReach: "284K", topReach: "350K", engRate: "6.8%", color: "text-sky-400" },
              { platform: "Newsletter", posts: 12, avgReach: "41K", topReach: "41K", engRate: "42% open", color: "text-amber-400" },
              { platform: "Twitter", posts: 24, avgReach: "22K", topReach: "28K", engRate: "4.1%", color: "text-blue-400" },
            ].map(p => (
              <Card key={p.platform} className="bg-card/50 border-border/40">
                <CardContent className="p-4 space-y-3">
                  <div className={`text-sm font-bold ${p.color}`}>{p.platform}</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Posts published</span><span className="font-medium">{p.posts}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Avg reach</span><span className={`font-medium ${p.color}`}>{p.avgReach}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Best piece</span><span className="font-medium">{p.topReach}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Engagement</span><span className="font-medium text-emerald-400">{p.engRate}</span></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-card/50 border-border/40">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Top Performing Content (30 Days)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {contentItems.filter(c => c.status === "published").slice(0, 4).map((item, i) => (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                  <span className="text-xs text-muted-foreground/60 w-4">{i + 1}</span>
                  <div className={`p-1 rounded border ${platformColors[item.platform]}`}>
                    <PlatformIcon platform={item.platform} />
                  </div>
                  <div className="flex-1 text-xs font-medium">{item.title}</div>
                  <div className="text-xs text-primary font-bold">{item.predictedReach}</div>
                  <div className="text-xs text-emerald-400">{item.confidence}% conf</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "schedule" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Optimal posting schedule based on audience activity patterns.</p>
          {[
            { platform: "linkedin", label: "LinkedIn", times: ["Mon 8:30 AM", "Wed 9:00 AM", "Fri 8:00 AM"], reason: "Peak C-suite and VP engagement window (EST)" },
            { platform: "twitter", label: "Twitter / X", times: ["Tue 7:15 AM", "Thu 7:00 AM", "Sat 10:00 AM"], reason: "Highest retweet velocity during morning commute" },
            { platform: "newsletter", label: "Newsletter", times: ["Thu 6:00 AM"], reason: "Highest open rate for B2B newsletters (42% vs. 22% industry avg)" },
            { platform: "article", label: "Long-form Articles", times: ["Tue 9:00 AM"], reason: "HBR and Forbes publishing window maximizes editorial algorithm visibility" },
          ].map(s => (
            <Card key={s.platform} className="bg-card/50 border-border/40">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg border ${platformColors[s.platform]}`}>
                    <PlatformIcon platform={s.platform} className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{s.label}</div>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {s.times.map(t => (
                        <Badge key={t} variant="outline" className="text-xs text-primary border-primary/30">
                          <Clock className="w-2.5 h-2.5 mr-1" />{t}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1.5">{s.reason}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
