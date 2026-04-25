import { Card, CardContent, } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Lightbulb, ArrowRight, CheckCircle, } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const thesis = [
  {
    pillar: "Vertical AI Infrastructure",
    description: "SZL invests in AI-native platforms that solve domain-specific problems at enterprise scale — not general AI wrappers.",
    examples: ["APEX: AI research infrastructure", "KORA: AIOps & observability"],
    rationale: "Vertical AI compounds moat through proprietary data, domain expertise, and switching costs. We target markets where AI creates 5-10x operational leverage.",
    stage: "Series A priority",
    color: "#8b5cf6",
  },
  {
    pillar: "Intelligence-as-a-Service",
    description: "Platforms that transform raw data streams into actionable intelligence for operators and executives.",
    examples: ["DOMAINE: Real estate market intelligence", "SEXTANT: Maritime analytics"],
    rationale: "IaaS companies have durable ARR with high NRR. The data moat builds over time, creating barriers that pure-software competitors cannot replicate.",
    stage: "Growth focus",
    color: "#10b981",
  },
  {
    pillar: "Security & Trust Infrastructure",
    description: "Cybersecurity and compliance platforms that become mission-critical in an AI-accelerated threat landscape.",
    examples: ["PARAGON: Red team / security simulation"],
    rationale: "Security spend is non-discretionary. Regulatory tailwinds (NIS2, DORA, SEC rules) are forcing enterprises to validate resilience continuously.",
    stage: "Seed to Series A",
    color: "#ef4444",
  },
  {
    pillar: "Operational Command Centers",
    description: "Next-generation operations platforms that consolidate fragmented toolchains into unified intelligence hubs.",
    examples: ["MSP: Managed service operations"],
    rationale: "Operational platforms achieve high stickiness through workflow integration. Best-in-class command centers displace 4-8 point solutions.",
    stage: "Growth focus",
    color: "#f59e0b",
  },
];

const investmentCriteria = [
  { criterion: "AI-Native Architecture", description: "AI is core to the product, not a feature layer" },
  { criterion: "Vertical Data Moat", description: "Proprietary data compounds defensibility over time" },
  { criterion: "Enterprise POC Velocity", description: "Time from pilot to paid contract < 90 days" },
  { criterion: "NRR > 115%", description: "Net Revenue Retention demonstrating product-led expansion" },
  { criterion: "Founder-Market Fit", description: "Founders with 5+ years domain expertise" },
  { criterion: "Scalable GTM", description: "Clear path to $10M ARR with current team & capital" },
];

const stages = [
  { stage: "Pre-Seed / Seed", ticket: "$250K – $1M", focus: "Founder conviction + thesis alignment", checkSize: "First check" },
  { stage: "Series A", ticket: "$2M – $8M", focus: "Proven PMF + early ARR momentum", checkSize: "Lead or co-lead" },
  { stage: "Growth", ticket: "$5M – $20M", focus: "Accelerating ARR + GTM repeatability", checkSize: "Follow-on" },
];

export default function VenturesThesis() {
  const __pageMeta = usePageMeta({
    title: "Investment Thesis | SZL Holdings – Ventures & Capital Strategy",
    description: "SZL Holdings investment thesis: six frontier technology pillars, capital deployment strategy, and the frameworks guiding our portfolio construction.",
    canonical: "https://szlholdings.com/thesis",
  });
  return (
    <>
      {__pageMeta}
      <div className="min-h-screen bg-szl-bg text-szl-text p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-szl-text flex items-center gap-3">
              <Lightbulb className="w-7 h-7 text-szl-accent" />
              Investment Thesis
            </h1>
            <p className="text-szl-text-secondary mt-2">SZL Holdings invests in vertical AI, intelligence infrastructure, and security platforms that become critical operating systems for their industries.</p>
          </div>
  
          <Card className="bg-szl-surface border-szl-accent/30">
            <CardContent className="p-6">
              <p className="text-lg font-medium text-szl-text leading-relaxed">
                "We back founders building the <span className="text-szl-accent">intelligence layer</span> of enterprise operations — AI-native platforms that make complex industries faster, safer, and more competitive. Our portfolio companies don't improve workflows. They replace them."
              </p>
              <p className="text-xs text-szl-text-secondary mt-3">— SZL Holdings Investment Committee</p>
            </CardContent>
          </Card>
  
          <div>
            <p className="text-xs font-medium text-szl-text-secondary uppercase tracking-wider mb-4">Investment Pillars</p>
            <div className="grid grid-cols-2 gap-4">
              {thesis.map(t => (
                <Card key={t.pillar} className="bg-szl-surface border-szl-border">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-bold text-szl-text">{t.pillar}</h3>
                      <Badge variant="outline" className="text-[10px] text-szl-text-secondary">{t.stage}</Badge>
                    </div>
                    <p className="text-sm text-szl-text-secondary mb-3">{t.description}</p>
                    <div className="space-y-1 mb-3">
                      {t.examples.map(e => (
                        <div key={e} className="flex items-center gap-2 text-xs">
                          <ArrowRight className="w-3 h-3 shrink-0" style={{ color: t.color }} />
                          <span className="text-szl-text-secondary">{e}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-szl-border pt-3">
                      <p className="text-xs text-szl-text-secondary italic">{t.rationale}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
  
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium text-szl-text-secondary uppercase tracking-wider mb-3">Investment Criteria</p>
              <Card className="bg-szl-surface border-szl-border">
                <CardContent className="p-4 space-y-3">
                  {investmentCriteria.map(ic => (
                    <div key={ic.criterion} className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-szl-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-szl-text">{ic.criterion}</p>
                        <p className="text-xs text-szl-text-secondary">{ic.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
  
            <div>
              <p className="text-xs font-medium text-szl-text-secondary uppercase tracking-wider mb-3">Check Sizes by Stage</p>
              <div className="space-y-3">
                {stages.map(s => (
                  <Card key={s.stage} className="bg-szl-surface border-szl-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-szl-text">{s.stage}</p>
                        <p className="text-sm font-bold text-szl-accent">{s.ticket}</p>
                      </div>
                      <p className="text-xs text-szl-text-secondary">{s.focus}</p>
                      <p className="text-[10px] text-szl-text-secondary mt-1 opacity-60">{s.checkSize}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
        </>
  );
}
