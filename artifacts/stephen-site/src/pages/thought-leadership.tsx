import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { BookOpen, Eye, Heart, MessageSquare, TrendingUp, Calendar, ExternalLink, Linkedin } from "lucide-react";

const articles = [
  { title: "The AI-Native Company: Why 2026 Separates the Winners from Everyone Else", publication: "Forbes", date: "Mar 15, 2026", reads: "47,200", likes: 1840, comments: 312, tags: ["AI Strategy", "Enterprise", "Leadership"], excerpt: "The next 24 months will draw the sharpest line in modern business history — between companies that built with AI at their core versus those who bolted it on as an afterthought...", featured: true },
  { title: "Maritime Intelligence in the Age of Geopolitical Volatility", publication: "Lloyd's List", date: "Feb 28, 2026", reads: "12,400", likes: 540, comments: 87, tags: ["Maritime", "Geopolitics", "AI"], excerpt: "Dark vessel activity has increased 340% since 2022. The fleets that survive will be those that can see what others cannot..." },
  { title: "Why I Bet Everything on the AIOps Revolution — And What I Learned", publication: "LinkedIn (350K+ views)", date: "Jan 12, 2026", reads: "350,000", likes: 9200, comments: 1840, tags: ["AIOps", "Entrepreneurship", "Story"], excerpt: "Three years ago, I made a call that most of my advisors thought was premature. Today, it's the thesis every major VC is chasing..." },
  { title: "Building in Public: The SZL Holdings Playbook for Ecosystem Investing", publication: "Substack", date: "Dec 5, 2025", reads: "28,900", likes: 1120, comments: 234, tags: ["Venture Building", "Portfolio", "Strategy"], excerpt: "We don't acquire companies. We build ecosystems. Here's the full playbook — the wins, the near-misses, and what I'd do differently..." },
];

const metrics = [
  { label: "Total Content Views (YTD)", value: "847K" },
  { label: "LinkedIn Followers", value: "284K" },
  { label: "Newsletter Subscribers", value: "41K" },
  { label: "Average Engagement Rate", value: "6.8%" },
];

export default function ThoughtLeadership() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          Thought Leadership
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Published articles, essays, and perspectives — building the SZL narrative in public</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(({ label, value }) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold text-primary">{value}</p></CardContent></Card>
        ))}
      </div>

      <div className="space-y-4">
        {articles.map((a) => (
          <Card key={a.title} className={a.featured ? "border-primary/40 bg-primary/5" : "hover:border-primary/20 transition-colors"}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {a.featured && <Badge className="text-[10px] mb-2 bg-primary/20 text-primary border-primary/30">Featured</Badge>}
                  <h3 className="text-base font-bold leading-tight">{a.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="text-primary font-medium">{a.publication}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{a.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 italic">"{a.excerpt}"</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {a.tags.map(t => <span key={t} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{t}</span>)}
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{a.reads}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{a.likes.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{a.comments.toLocaleString()}</span>
                  </div>
                </div>
                <button className="text-xs px-3 py-2 bg-muted border border-border rounded-lg hover:bg-muted/80 transition-colors flex items-center gap-1.5 shrink-0">
                  <ExternalLink className="w-3 h-3" /> Read
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
