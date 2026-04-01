import { Card, CardContent } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Newspaper, ExternalLink, Calendar, Tag } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const pressItems = [
  {
    type: "Press Release", date: "March 18, 2026",
    headline: "SZL Holdings Announces $85M Growth Fund to Accelerate Vertical AI Portfolio",
    summary: "SZL Holdings today announced the final close of its third fund at $85M, focused on Series A investments in AI-native enterprise platforms. The fund will make 8-10 investments in the SZL portfolio verticals: AIOps, security infrastructure, and domain intelligence.",
    tags: ["Funding", "Fund III", "AI"],
    source: "PR Newswire",
  },
  {
    type: "Media Coverage", date: "March 5, 2026",
    headline: "How Lyte Is Winning the AIOps Market by Combining Observability with AI-Driven Remediation",
    summary: "The Information profiles Lyte Command Center's rapid rise to $4.2M ARR and 93% YoY growth, citing its unique approach to blending real-time signal detection with autonomous incident response.",
    tags: ["Portfolio", "Lyte", "AIOps"],
    source: "The Information",
  },
  {
    type: "Press Release", date: "February 22, 2026",
    headline: "INCA AI Research Platform Secures $14M Series A Led by SZL Holdings",
    summary: "INCA, the AI model lifecycle platform, closed a $14M Series A to expand its LLM evaluation suite and GPU monitoring infrastructure. The round enables INCA to grow its enterprise sales team and launch three new research workflow modules.",
    tags: ["INCA", "Series A", "Funding"],
    source: "Business Wire",
  },
  {
    type: "Media Coverage", date: "February 8, 2026",
    headline: "Firestorm's Red Team Simulation Platform Becomes the Security Industry's Open Secret",
    summary: "Forbes Technology covers Firestorm's meteoric rise in the enterprise security simulation market, highlighting its MITRE ATT&CK integration and client roster that includes three Fortune 500 companies.",
    tags: ["Portfolio", "Firestorm", "Security"],
    source: "Forbes Technology",
  },
  {
    type: "Thought Leadership", date: "January 31, 2026",
    headline: "The Vertical AI Thesis: Why Sector-Specific Intelligence Platforms Will Dominate the 2026-2030 Cycle",
    summary: "SZL Holdings Investment Committee publishes its annual thesis update, arguing that the next generation of enterprise software winners will be built on proprietary vertical data moats rather than horizontal LLM wrappers.",
    tags: ["Thesis", "AI", "Strategy"],
    source: "SZL Holdings Blog",
  },
  {
    type: "Media Coverage", date: "January 15, 2026",
    headline: "Terra: The Intelligence Platform Changing How Enterprise Teams Make Decisions",
    summary: "Commercial Observer profiles Terra's growth to $3.1M ARR with 34 enterprise clients, noting its continuous KPI telemetry and anomaly detection as key differentiators.",
    tags: ["Portfolio", "Terra", "Business Telemetry"],
    source: "Commercial Observer",
  },
];

const typeColor: Record<string, string> = {
  "Press Release": "text-violet-400 bg-violet-500/10 border-violet-500/20",
  "Media Coverage": "text-sky-400 bg-sky-500/10 border-sky-500/20",
  "Thought Leadership": "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

export default function Newsroom() {
  usePageMeta({
    title: "Newsroom | SZL Holdings – Press Releases & Media Coverage",
    description: "Latest news from SZL Holdings: press releases, media coverage, product launches, and strategic announcements. Follow the story of a technology holding company.",
    canonical: "https://szlholdings.com/newsroom",
  });
  const featured = pressItems[0];
  const rest = pressItems.slice(1);

  return (
    <div className="min-h-screen bg-szl-bg text-szl-text p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-szl-text flex items-center gap-3">
            <Newspaper className="w-7 h-7 text-szl-accent" />
            Newsroom
          </h1>
          <p className="text-szl-text-secondary mt-2">Press releases, media coverage, and thought leadership from SZL Holdings and portfolio companies.</p>
        </div>

        <Card className="bg-szl-surface border-szl-accent/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className={`text-[10px] ${typeColor[featured.type]}`}>{featured.type}</Badge>
              <span className="text-[11px] text-szl-text-secondary flex items-center gap-1"><Calendar className="w-3 h-3" /> {featured.date}</span>
              <span className="text-[11px] text-szl-text-secondary">· {featured.source}</span>
            </div>
            <h2 className="text-xl font-bold text-szl-text mb-2">{featured.headline}</h2>
            <p className="text-sm text-szl-text-secondary leading-relaxed mb-4">{featured.summary}</p>
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1.5">
                {featured.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-szl-border text-szl-text-secondary flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" /> {tag}
                  </span>
                ))}
              </div>
              <button className="text-xs text-szl-accent flex items-center gap-1 hover:opacity-80 transition-opacity">
                Read Full Release <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {rest.map(item => (
            <Card key={item.headline} className="bg-szl-surface border-szl-border hover:border-szl-accent/30 transition-colors group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={`text-[10px] ${typeColor[item.type]}`}>{item.type}</Badge>
                      <span className="text-[11px] text-szl-text-secondary">{item.date}</span>
                      <span className="text-[11px] text-szl-text-secondary">· {item.source}</span>
                    </div>
                    <h3 className="text-base font-semibold text-szl-text mb-1.5 group-hover:text-szl-accent transition-colors">{item.headline}</h3>
                    <p className="text-xs text-szl-text-secondary leading-relaxed">{item.summary}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-szl-border text-szl-text-secondary flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" /> {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="shrink-0 text-xs text-szl-text-secondary hover:text-szl-accent transition-colors mt-1">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
