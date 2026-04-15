import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Sparkles, TrendingUp, DollarSign, Zap, ArrowUpRight, Star, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

type Priority = "critical" | "high" | "medium";
type Status = "pending" | "in-progress" | "implemented";

type Recommendation = {
  id: string;
  title: string;
  category: "pricing" | "product" | "partnership" | "sponsorship" | "expansion";
  impact: string;
  impactValue: number;
  confidence: number;
  timeToImplement: string;
  priority: Priority;
  status: Status;
  insight: string;
  signals: string[];
  action: string;
};

const recommendations: Recommendation[] = [
  {
    id: "r1",
    title: "Raise keynote fee from $29K to $35K",
    category: "pricing",
    impact: "+$48K/yr",
    impactValue: 48000,
    confidence: 94,
    timeToImplement: "Immediate",
    priority: "critical",
    status: "pending",
    insight: "Demand signals show 3 inbound speaking requests in 30 days with avg waitlist of 6 weeks. Comparable speakers in enterprise AI command $32–45K. You're priced below market by 20%.",
    signals: ["3 inbound requests in 30 days", "6-week average waitlist", "Peer benchmarking: $32–45K range", "8.4x audience engagement vs. speaker average"],
    action: "Update speaker kit and rate card immediately.",
  },
  {
    id: "r2",
    title: "Launch $997 AIOps Masterclass — Tier 2",
    category: "product",
    impact: "+$180K launch",
    impactValue: 180000,
    confidence: 91,
    timeToImplement: "6 weeks",
    priority: "critical",
    status: "in-progress",
    insight: "Newsletter engagement (42% open rate) and HBR article traction (94.7K reads) validate strong demand. A follow-on advanced course targeting practitioners would convert at 3–5% of your audience.",
    signals: ["42% newsletter open rate (2x industry)", "94.7K HBR reads on observability topic", "412 enrolled in existing AIOps course", "24 direct requests for advanced content"],
    action: "Activate AI course builder to generate curriculum in 48 hours.",
  },
  {
    id: "r3",
    title: "Introduce $12K/month advisory retainer",
    category: "pricing",
    impact: "+$288K ARR",
    impactValue: 288000,
    confidence: 85,
    timeToImplement: "2 weeks",
    priority: "critical",
    status: "pending",
    insight: "3 consulting inquiries this month were for ongoing access, not project work. A structured retainer at $12K/month with 4 seats would lock in $576K ARR vs. ad-hoc consulting at lower total value.",
    signals: ["3 retainer-seeking inquiries in 30 days", "Avg consulting deal currently $18K one-time", "Retainer LTV 3.2x vs. project work", "Capacity for 4 retainer clients without burnout"],
    action: "Create retainer proposal template and add to outbound pipeline.",
  },
  {
    id: "r4",
    title: "Negotiate sponsorship floor to $18K/quarter",
    category: "sponsorship",
    impact: "+$28K H2",
    impactValue: 28000,
    confidence: 89,
    timeToImplement: "Next renewal cycle",
    priority: "high",
    status: "pending",
    insight: "Your engagement rate (6.8%) is 3.2x the B2B newsletter industry benchmark (2.1%). Current sponsorship deals are priced on reach, not engagement quality. Renegotiate at next renewal with engagement data.",
    signals: ["6.8% engagement rate (3.2x industry)", "41K subscribers (high-quality B2B)", "Sponsor retention rate: 83%", "2 new sponsor inquiries this quarter"],
    action: "Prepare engagement data deck before next renewal conversation.",
  },
  {
    id: "r5",
    title: "Partner with Salesforce for co-branded research",
    category: "partnership",
    impact: "+$85K deal",
    impactValue: 85000,
    confidence: 76,
    timeToImplement: "3 months",
    priority: "high",
    status: "pending",
    insight: "Salesforce is investing heavily in AIOps narrative. Your audience (55% enterprise, 38% C-suite) aligns perfectly with their ICP. A co-branded state-of-AIOps report would command $75–100K in sponsorship.",
    signals: ["Salesforce marketing team viewed your content 4x this month", "Overlap with Salesforce ICP: 91%", "Comparable co-branded research: $60–120K", "Existing Lyte × Salesforce integration"],
    action: "Warm introduction via Elena G. at Microsoft Azure → Salesforce Ventures connection.",
  },
  {
    id: "r6",
    title: "Bundle speaking + post-event workshop",
    category: "pricing",
    impact: "+$127K/yr",
    impactValue: 127000,
    confidence: 82,
    timeToImplement: "Immediate",
    priority: "high",
    status: "pending",
    insight: "Post-event consulting conversion runs at 31% for events where you do a follow-on session. A 1-day workshop bundled with keynote ($85K total vs. $29K keynote) would double deal value for qualified events.",
    signals: ["31% post-event consulting conversion", "4 events with repeat engagement in 2025", "Workshop format works for audiences >200", "3 confirmed events in 2026 pipeline"],
    action: "Add workshop bundle option to speaker kit at next outreach cycle.",
  },
  {
    id: "r7",
    title: "Launch maritime intelligence subscription ($499/mo)",
    category: "product",
    impact: "+$240K ARR",
    impactValue: 240000,
    confidence: 79,
    timeToImplement: "8 weeks",
    priority: "medium",
    status: "pending",
    insight: "Maritime AI Toolkit has 341 buyers at $297 one-time. A subscription including monthly intelligence reports, signal analysis, and Vessels data access would command $499/month from logistics executives.",
    signals: ["341 toolkit buyers (high repeat purchase intent)", "Vessels platform proprietary data", "Maritime exec avg budget: $2K+/month for intelligence", "0 direct competitors in this format"],
    action: "Package Vessels data exports + monthly commentary as subscription tier.",
  },
];

const categoryColors: Record<string, string> = {
  pricing: "bg-primary/15 text-primary border-primary/20",
  product: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  partnership: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  sponsorship: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  expansion: "bg-violet-500/15 text-violet-400 border-violet-500/20",
};

const priorityColors: Record<Priority, string> = {
  critical: "text-red-400 border-red-500/20",
  high: "text-amber-400 border-amber-500/20",
  medium: "text-sky-400 border-sky-500/20",
};

const statusIcons: Record<Status, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5 text-zinc-400" />,
  "in-progress": <AlertCircle className="w-3.5 h-3.5 text-amber-400" />,
  implemented: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
};

export default function MonetizationAI() {
  usePageMeta({
    title: "Monetization AI | Stephen Lutar — Revenue Optimization Engine",
    description: "AI-powered monetization optimization: pricing recommendations, new product opportunities, partnership suggestions, and rate optimization.",
    canonical: "https://szlholdings.com/stephen/monetization",
  });

  const [activeTab, setActiveTab] = useState<"recommendations" | "pipeline" | "benchmarks">("recommendations");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedRec, setExpandedRec] = useState<string | null>(null);

  const categories = ["all", "pricing", "product", "partnership", "sponsorship"];
  const filtered = selectedCategory === "all" ? recommendations : recommendations.filter(r => r.category === selectedCategory);
  const totalUpside = recommendations.reduce((s, r) => s + r.impactValue, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Monetization Optimization AI
          </h1>
          <p className="text-sm text-muted-foreground mt-1">AI-driven pricing, product, and partnership recommendations to maximize creator revenue</p>
        </div>
        <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">
          <TrendingUp className="w-3 h-3 mr-1" />
          ${(totalUpside / 1000).toFixed(0)}K Total Upside Identified
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Upside Identified", value: `$${(totalUpside / 1000).toFixed(0)}K`, color: "text-emerald-400", sub: "7 recommendations" },
          { label: "Critical Actions", value: "3", color: "text-red-400", sub: "Implement immediately" },
          { label: "Avg AI Confidence", value: `${Math.round(recommendations.reduce((s, r) => s + r.confidence, 0) / recommendations.length)}%`, color: "text-primary", sub: "Based on signal analysis" },
          { label: "In Progress", value: "1", color: "text-amber-400", sub: "AIOps Masterclass Tier 2" },
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
        {(["recommendations", "pipeline", "benchmarks"] as const).map(tab => (
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

      {activeTab === "recommendations" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">AI analyzes your revenue data, audience engagement, market demand signals, and competitor pricing to surface revenue opportunities ranked by impact and confidence.</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1.5 text-xs rounded-full border capitalize transition-colors ${selectedCategory === c ? "bg-primary/10 border-primary/40 text-primary" : "bg-muted/20 border-border/30 text-muted-foreground hover:text-foreground"}`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.map(rec => (
              <Card
                key={rec.id}
                className={`bg-card/50 border-border/40 cursor-pointer transition-all hover:border-primary/20 ${expandedRec === rec.id ? "border-primary/40 bg-primary/3" : ""}`}
                onClick={() => setExpandedRec(expandedRec === rec.id ? null : rec.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      {rec.category === "pricing" ? <TrendingUp className="w-4 h-4 text-primary" /> :
                       rec.category === "product" ? <Zap className="w-4 h-4 text-primary" /> :
                       rec.category === "partnership" ? <Star className="w-4 h-4 text-primary" /> :
                       <DollarSign className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{rec.title}</span>
                        <Badge variant="outline" className={`text-xs ${priorityColors[rec.priority]}`}>{rec.priority}</Badge>
                        <Badge variant="outline" className={`text-xs ${categoryColors[rec.category]}`}>{rec.category}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="text-emerald-400 font-bold">{rec.impact}</span>
                        <span>Confidence: <span className={rec.confidence >= 90 ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"}>{rec.confidence}%</span></span>
                        <span>Timeline: {rec.timeToImplement}</span>
                        <span className="flex items-center gap-1">{statusIcons[rec.status]} {rec.status}</span>
                      </div>

                      {expandedRec === rec.id && (
                        <div className="mt-4 pt-4 border-t border-border/20 space-y-4">
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">AI Insight</div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{rec.insight}</p>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Signals Detected</div>
                            <div className="space-y-1">
                              {rec.signals.map((signal, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <div className="w-1 h-1 rounded-full bg-primary shrink-0" />
                                  {signal}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
                            <ArrowUpRight className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="text-xs font-medium text-primary">{rec.action}</span>
                          </div>
                          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Mark as Implemented
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "pipeline" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { stage: "Identified", count: recommendations.filter(r => r.status === "pending").length, value: recommendations.filter(r => r.status === "pending").reduce((s, r) => s + r.impactValue, 0), color: "text-zinc-400" },
              { stage: "In Progress", count: recommendations.filter(r => r.status === "in-progress").length, value: recommendations.filter(r => r.status === "in-progress").reduce((s, r) => s + r.impactValue, 0), color: "text-amber-400" },
              { stage: "Implemented", count: recommendations.filter(r => r.status === "implemented").length, value: recommendations.filter(r => r.status === "implemented").reduce((s, r) => s + r.impactValue, 0), color: "text-emerald-400" },
            ].map(s => (
              <Card key={s.stage} className="bg-card/50 border-border/40">
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.stage}</div>
                  <div className="text-sm font-semibold text-primary mt-1">${(s.value / 1000).toFixed(0)}K</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-card/50 border-border/40">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Revenue Upside by Category</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {["pricing", "product", "partnership", "sponsorship"].map(cat => {
                const catRecs = recommendations.filter(r => r.category === cat);
                const catValue = catRecs.reduce((s, r) => s + r.impactValue, 0);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="capitalize font-medium">{cat}</span>
                      <span className="text-primary font-bold">${(catValue / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
                      <div className="h-full bg-primary/60 rounded-full" style={{ width: `${(catValue / totalUpside) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "benchmarks" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Market benchmarks for comparable thought leaders and creator economy participants.</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { category: "Speaking Fees", yourRate: "$29K", market: "$32–45K", benchmark: "Below market", color: "text-amber-400", rec: "Raise to $35K immediately" },
              { category: "Newsletter Sponsorships (CPM)", yourRate: "$42 CPM", market: "$35–55 CPM", benchmark: "At market", color: "text-emerald-400", rec: "Negotiate on engagement quality, not reach" },
              { category: "Consulting Day Rate", yourRate: "$8.5K/day", market: "$7–15K/day", benchmark: "Mid-market", color: "text-primary", rec: "Move toward $12K for AI-specific work" },
              { category: "Online Course Average Revenue", yourRate: "$997", market: "$297–2,500", benchmark: "Optimal", color: "text-emerald-400", rec: "Launch $2,500 advanced tier" },
              { category: "Advisory Retainers", yourRate: "Ad hoc", market: "$8–18K/month", benchmark: "Missing stream", color: "text-red-400", rec: "Launch retainer offering immediately" },
              { category: "Co-branded Research", yourRate: "None", market: "$40–150K", benchmark: "Untapped", color: "text-amber-400", rec: "Explore Salesforce partnership" },
            ].map(b => (
              <Card key={b.category} className="bg-card/50 border-border/40">
                <CardContent className="p-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{b.category}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div><span className="text-muted-foreground">Your rate:</span><br /><span className="font-bold text-foreground">{b.yourRate}</span></div>
                    <div><span className="text-muted-foreground">Market:</span><br /><span className="font-medium text-muted-foreground">{b.market}</span></div>
                  </div>
                  <Badge variant="outline" className={`text-xs ${b.color} mb-2`}>{b.benchmark}</Badge>
                  <p className="text-xs text-muted-foreground">{b.rec}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
