import { Card, CardContent } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { BookOpen, Eye, Heart, MessageSquare, Calendar, ExternalLink, ArrowRight } from "lucide-react";

const LENS_ICONS: Record<string, string> = {
  signal: "◎",
  impact: "$",
  anticipation: "◈",
  topology: "⬡",
  posture: "◆",
  velocity: "▲",
};

const articles = [
  {
    title: "The 6 Lenses of Business Observability: Why Every Company Needs a Proprietary Way of Seeing",
    publication: "Harvard Business Review",
    date: "Mar 20, 2026",
    reads: "94,700",
    likes: 3820,
    comments: 640,
    tags: ["Observability", "Strategy", "AI Leadership"],
    excerpt: "For the past decade, 'observability' was an engineering term. We instrumented systems, tracked metrics, and built dashboards. But the next generation of observability isn't about systems — it's about seeing your entire business through a framework that gives every stakeholder a shared language for what's working, what's at risk, and how fast you're improving...",
    featured: true,
    lenses: ["signal", "posture", "velocity"],
  },
  {
    title: "The AI-Native Company: Why 2026 Separates the Winners from Everyone Else",
    publication: "Forbes",
    date: "Mar 15, 2026",
    reads: "47,200",
    likes: 1840,
    comments: 312,
    tags: ["AI Strategy", "Enterprise", "Leadership"],
    excerpt: "The next 24 months will draw the sharpest line in modern business history — between companies that built with AI at their core versus those who bolted it on as an afterthought...",
    lenses: ["anticipation", "velocity"],
  },
  {
    title: "Maritime Intelligence in the Age of Geopolitical Volatility",
    publication: "Lloyd's List",
    date: "Feb 28, 2026",
    reads: "12,400",
    likes: 540,
    comments: 87,
    tags: ["Maritime", "Geopolitics", "AI"],
    excerpt: "Dark vessel activity has increased 340% since 2022. The fleets that survive will be those that can see what others cannot — and translate every operational signal into a dollar sign...",
    lenses: ["signal", "impact"],
  },
  {
    title: "Why I Bet Everything on the AIOps Revolution — And What I Learned",
    publication: "LinkedIn (350K+ views)",
    date: "Jan 12, 2026",
    reads: "350,000",
    likes: 9200,
    comments: 1840,
    tags: ["AIOps", "Entrepreneurship", "Story"],
    excerpt: "Three years ago, I made a call that most of my advisors thought was premature. Today, it's the thesis every major VC is chasing...",
    lenses: ["anticipation", "velocity"],
  },
  {
    title: "Building in Public: The SZL Holdings Playbook for Ecosystem Investing",
    publication: "Substack",
    date: "Dec 5, 2025",
    reads: "28,900",
    likes: 1120,
    comments: 234,
    tags: ["Venture Building", "Portfolio", "Strategy"],
    excerpt: "We don't acquire companies. We build ecosystems. Here's the full playbook — the wins, the near-misses, and what I'd do differently...",
    lenses: ["topology", "posture"],
  },
];

const metrics = [
  { label: "Total Content Views (YTD)", value: "1.1M" },
  { label: "LinkedIn Followers", value: "284K" },
  { label: "Newsletter Subscribers", value: "41K" },
  { label: "Average Engagement Rate", value: "6.8%" },
];

const sixLensesContext = {
  title: "The 6 Lenses — A Core Thesis",
  description: "My most referenced framework — developed from 3 years building SZL Holdings' portfolio intelligence infrastructure. The 6 Lenses gives any business a proprietary way to observe, decide, and act.",
  lenses: [
    { id: "signal", label: "Signal", context: "See what matters — rank alerts by business impact, not system noise" },
    { id: "impact", label: "Impact", context: "Every technical event has a dollar sign — connect ops to outcomes" },
    { id: "anticipation", label: "Anticipation", context: "Know before it happens — predictive over reactive" },
    { id: "topology", label: "Topology", context: "Everything is connected — the relationship graph changes everything" },
    { id: "posture", label: "Posture", context: "One authoritative number — distill complexity into clarity" },
    { id: "velocity", label: "Velocity", context: "Measure how fast you're getting better — not just whether you are" },
  ],
};

const szlInsights = [
  {
    title: "State of the Ecosystem: 2026 Annual Letter",
    category: "Annual Letter",
    readTime: 18,
    href: "/szl-holdings/insights/state-of-the-ecosystem-2026",
  },
  {
    title: "Dark Vessel Activity Is Up 340% — Here's What AI Can See That Humans Can't",
    category: "Maritime Intelligence",
    readTime: 9,
    href: "/szl-holdings/insights/dark-vessel-activity-maritime-ai",
  },
  {
    title: "LLM Evaluation Is the Missing Infrastructure Layer of the AI Era",
    category: "AI/ML",
    readTime: 11,
    href: "/szl-holdings/insights/llm-evaluation-the-missing-infrastructure",
  },
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

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">SZL Holdings Insights</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Research and perspectives published on szlholdings.com/insights</p>
          </div>
          <a
            href="/szl-holdings/insights"
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
          >
            View All <ArrowRight className="w-3 h-3" />
          </a>
        </div>
        <div className="space-y-3">
          {szlInsights.map((insight) => (
            <a
              key={insight.title}
              href={insight.href}
              className="group flex items-start justify-between gap-4 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-primary/70 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                    {insight.category}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{insight.readTime} min read</span>
                </div>
                <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors leading-snug">
                  {insight.title}
                </p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors mt-1 shrink-0" />
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(({ label, value }) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold text-primary">{value}</p></CardContent></Card>
        ))}
      </div>

      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center font-black text-sm text-indigo-300">6</span>
          <div>
            <h3 className="text-sm font-semibold">{sixLensesContext.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{sixLensesContext.description}</p>
          </div>
          <Badge className="ml-auto text-[10px] bg-indigo-500/20 text-indigo-300 border-indigo-500/30">SZL Proprietary</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {sixLensesContext.lenses.map(lens => (
            <div key={lens.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
              <span className="text-base font-bold text-indigo-300 flex-shrink-0 mt-0.5">{LENS_ICONS[lens.id]}</span>
              <div>
                <div className="text-xs font-semibold">{lens.label} Lens</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{lens.context}</div>
              </div>
            </div>
          ))}
        </div>
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
                  <p className="text-sm text-muted-foreground mt-2 italic line-clamp-2">"{a.excerpt}"</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {a.tags.map(t => <span key={t} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{t}</span>)}
                    {a.lenses.map(l => (
                      <span key={l} className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded capitalize">
                        {LENS_ICONS[l]} {l}
                      </span>
                    ))}
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
