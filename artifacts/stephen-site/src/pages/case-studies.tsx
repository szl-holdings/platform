import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { BookOpen, TrendingUp, ArrowRight, Target, DollarSign } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const studies = [
  {
    id: 1,
    title: "Scaling INCA's AI Infrastructure from Zero to $1.8M ARR",
    role: "Founding Advisor / Technical Strategy",
    period: "2024 – Present",
    industry: "AI / ML Research",
    category: "Product Strategy",
    summary: "Led product-market fit validation and go-to-market architecture for INCA, an AI model lifecycle platform. Defined the LLM evaluation and GPU monitoring product strategy that became the primary growth driver.",
    challenge: "INCA had strong engineering talent and early adopters but lacked a coherent product narrative or enterprise sales motion. The founding team was selling on feature specs rather than business outcomes.",
    approach: [
      "Repositioned INCA from 'ML experiment tracker' to 'AI Research Command Center' — a narrative that resonated at CTO level",
      "Designed a land-and-expand motion: free GPU monitoring tier → paid LLM evaluation → enterprise model governance",
      "Built the competitive battlecards and objection-handling playbooks that enabled the first 12 enterprise closes",
      "Structured the Series A narrative that led to a $14M close at $22M valuation",
    ],
    outcomes: [
      { metric: "ARR Growth", value: "$0 → $1.8M", period: "18 months" },
      { metric: "Enterprise Customers", value: "0 → 24", period: "18 months" },
      { metric: "Series A Raised", value: "$14M", period: "Q1 2026" },
      { metric: "NRR", value: "131%", period: "Current" },
    ],
    color: "#8b5cf6",
  },
  {
    id: 2,
    title: "Terra's Market Intelligence Relaunch: 61% ARR Growth in 12 Months",
    role: "Product Strategy Consultant",
    period: "2023 – 2024",
    industry: "PropTech / Real Estate",
    category: "Product Repositioning",
    summary: "Redesigned Terra's core product positioning and feature roadmap, adding portfolio performance analytics and climate risk overlay that unlocked the enterprise CRE market segment.",
    challenge: "Terra was growing but plateauing at $1.9M ARR. The product was feature-rich but lacked a cohesive narrative for CRE investment firms. Average deal size was $8K — a $25K ACV was needed for efficient growth.",
    approach: [
      "Conducted 40+ customer interviews to identify the 'aha moment' in Terra's workflow — portfolio-level NOI and IRR tracking",
      "Scoped and prioritized the portfolio performance module as the primary Q2 investment",
      "Introduced climate risk overlay after identifying regulatory tailwinds in major pension fund requirements",
      "Repositioned pricing to annual contracts with seat-based expansion — raised ACV from $8K to $22K",
    ],
    outcomes: [
      { metric: "ARR", value: "$1.9M → $3.1M", period: "12 months" },
      { metric: "Average ACV", value: "$8K → $22K", period: "Current" },
      { metric: "Enterprise Segment", value: "+18 clients", period: "12 months" },
      { metric: "NPS", value: "72 → 88", period: "12 months" },
    ],
    color: "#10b981",
  },
  {
    id: 3,
    title: "Firestorm: Building the Red Team Simulation Market Category",
    role: "Go-to-Market Strategy Lead",
    period: "2023",
    industry: "Cybersecurity",
    category: "Category Creation",
    summary: "Helped Firestorm define and own the 'continuous security validation' category before enterprise security budget cycles in Q3-Q4, enabling 3 Fortune 500 pilots within 6 months of launch.",
    challenge: "Firestorm's product was technically superior to incumbent red team automation tools, but it was being sold into procurement cycles designed for traditional pen-testing vendors — not SaaS platforms.",
    approach: [
      "Reframed the sales motion from 'pen-test replacement' to 'continuous security validation' — creating budget in the SOC rather than IT procurement",
      "Built the CISO pitch deck with a MITRE ATT&CK coverage heat map as the primary proof of value",
      "Designed a 30-day pilot → paid conversion motion at $120K ACV",
      "Placed thought leadership content in 3 Tier 1 security publications during RSA Conference season",
    ],
    outcomes: [
      { metric: "Fortune 500 Pilots", value: "0 → 3", period: "6 months" },
      { metric: "ACV", value: "$120K", period: "Enterprise tier" },
      { metric: "ARR Run Rate", value: "$2.4M", period: "12 months post-launch" },
      { metric: "Media Placements", value: "11 articles", period: "Q3-Q4 2023" },
    ],
    color: "#ef4444",
  },
];

export default function CaseStudies() {
  usePageMeta({
    title: "Case Studies | Stephen Lutar – Enterprise Technology Projects",
    description: "Deep-dive case studies from Stephen Lutar's portfolio: AI infrastructure at scale, maritime intelligence platforms, fintech systems, and enterprise transformations.",
    canonical: "https://szlholdings.com/stephen/case-studies",
  });
  const [selected, setSelected] = useState(studies[0]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-8 py-16 space-y-12">
        <div>
          <p className="text-xs font-medium text-primary uppercase tracking-widest mb-3">Case Studies</p>
          <h1 className="text-4xl font-serif font-bold text-foreground">Selected Work</h1>
          <p className="text-muted-foreground mt-3 text-lg max-w-2xl">Deep dives into product strategy, market positioning, and venture building work across the SZL Holdings portfolio.</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          {studies.map(s => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selected.id === s.id ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground border border-border hover:border-border/80 hover:text-foreground"}`}
            >
              {s.title.split(":")[0]}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2 className="text-2xl font-serif font-bold text-foreground">{selected.title}</h2>
              <Badge variant="outline" className="shrink-0 text-xs">{selected.category}</Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{selected.role}</span>
              <span>·</span>
              <span>{selected.period}</span>
              <span>·</span>
              <span>{selected.industry}</span>
            </div>
          </div>

          <p className="text-muted-foreground leading-relaxed">{selected.summary}</p>

          <div className="grid grid-cols-4 gap-4">
            {selected.outcomes.map(o => (
              <Card key={o.metric} className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{o.metric}</p>
                  <p className="text-xl font-bold text-foreground">{o.value}</p>
                  <p className="text-[10px] text-muted-foreground">{o.period}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">The Challenge</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{selected.challenge}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">The Approach</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {selected.approach.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ArrowRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                      {step}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
