import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Target, TrendingUp, TrendingDown, Minus, CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

type Outcome = "Validated" | "Evolving" | "Early" | "Disproved";

interface ThesisEntry {
  id: string;
  title: string;
  stated: string;
  domain: string;
  outcome: Outcome;
  confidence: number;
  position: string;
  evolution: string[];
  marketSignals: string[];
  portfolioBet?: string;
}

const THESES: ThesisEntry[] = [
  {
    id: "t1",
    title: "Enterprise AI Adoption Follows an Operations-First Pattern",
    stated: "Q1 2022",
    domain: "AI Strategy",
    outcome: "Validated",
    confidence: 96,
    position: "Contrary to the chatbot-first narrative, enterprise AI deployment creates durable value only when it augments operational workflows — not when it sits in a chat interface. The highest ROI AI investments in 2022-2025 will be in process intelligence, anomaly detection, and operational co-pilots, not general assistants.",
    evolution: [
      "Q1 2022: Initial thesis stated — AIOps, not chat AI, will dominate enterprise value creation",
      "Q3 2022: Early validation from Lyte deployments showing 3-4x faster incident resolution with AIOps vs. manual",
      "Q2 2023: Gartner report corroborates; operations-first AI deployment showing 60% higher ROI than chat-first",
      "Q1 2024: Industry-wide consensus shifts; major vendors reposition around operational AI",
      "Q4 2025: Fully validated — Lyte AIOps platform revenue 8x since thesis stated",
    ],
    marketSignals: ["ServiceNow AIOps 400% growth YoY", "Datadog AI observability becomes #1 feature request", "AWS, Azure, GCP all launch ops-native AI toolkits"],
    portfolioBet: "Lyte — AIOps Command Platform",
  },
  {
    id: "t2",
    title: "Maritime Is the Last Major Industry Without Real-Time Intelligence Infrastructure",
    stated: "Q3 2021",
    domain: "Maritime",
    outcome: "Validated",
    confidence: 94,
    position: "The $4T global maritime industry operates on data infrastructure that would be considered primitive in any other sector. AIS data is not truly real-time. Sanctions screening is batch-processed. P&L is calculated in spreadsheets. The platform that brings institutional-grade intelligence to fleet operations will capture enormous value.",
    evolution: [
      "Q3 2021: Thesis stated after observing operational gaps across SZL's early maritime exposure",
      "Q1 2022: Vessels MVP confirmed — ops teams running 40-60% manual processes",
      "Q4 2022: Geopolitical volatility (Ukraine war, sanctions) accelerates demand for real-time fleet intelligence",
      "Q2 2024: Dark vessel activity detection becomes a regulatory requirement for most jurisdictions",
      "Q2 2025: Vessels platform processes $2.1B in voyage fixture decisions annually",
    ],
    marketSignals: ["OFAC sanctions enforcement on maritime up 340%", "IMO 2023 digital reporting requirements", "Lloyd's of London mandates AIS-based underwriting"],
    portfolioBet: "Vessels — Fleet Command Platform",
  },
  {
    id: "t3",
    title: "The Portfolio Company Model Is Dead — Ecosystems Win",
    stated: "Q4 2020",
    domain: "Venture Building",
    outcome: "Validated",
    confidence: 92,
    position: "Traditional portfolio construction treats each investment as an independent bet. The next generation of holding companies will build platforms of interconnected companies that compound each other's intelligence, share infrastructure, and create network effects across their combined user base. SZL Holdings is structured on this thesis.",
    evolution: [
      "Q4 2020: Founding thesis of SZL Holdings — ecosystem investing as a structural advantage",
      "Q2 2021: First cross-portfolio intelligence sharing (Vessels + Aegis threat feeds)",
      "Q3 2022: Shared infrastructure saves estimated $2.1M vs. standalone build paths",
      "Q1 2024: Nuro Mesh multi-agent AI system routes intelligence across all 8 platforms",
      "Q4 2025: Cross-portfolio customer relationships generating 23% of new deal flow",
    ],
    marketSignals: ["Constellation Software (cross-portfolio playbook) outperforms S&P by 3x", "a16z ecosystem fund raises $900M", "PE firms building 'platform company' structures globally"],
    portfolioBet: "SZL Holdings — Full Ecosystem",
  },
  {
    id: "t4",
    title: "Cybersecurity Shifts from Perimeter Defense to Behavioral Intelligence",
    stated: "Q2 2022",
    domain: "Cybersecurity",
    outcome: "Evolving",
    confidence: 78,
    position: "The firewall-first security model is architecturally broken for a cloud-native, zero-trust world. Durable security posture comes from behavioral baselining, anomaly detection across user and system behavior, and AI-driven threat correlation — not from patching perimeter defenses. The platforms that win will be those that treat every action as a data signal.",
    evolution: [
      "Q2 2022: Thesis stated — behavioral AI will displace signature-based detection within 3 years",
      "Q1 2023: Aegis platform built entirely on behavioral intelligence architecture",
      "Q3 2023: Partial validation — SIEM vendors racing to add behavioral ML layers",
      "Q2 2024: Nuance emerging — LLM-based social engineering attacks create new attack surface not covered by behavioral models",
      "Q4 2025: Thesis evolving — behavioral intelligence correct but insufficient alone; requires intent modeling layer",
    ],
    marketSignals: ["CrowdStrike behavioral AI adoption up 280%", "MITRE ATT&CK behavioral focus becomes industry standard", "New attack surfaces (AI prompt injection) challenge pure behavioral models"],
    portfolioBet: "Aegis — Unified Defense & Intelligence",
  },
  {
    id: "t5",
    title: "Real Estate Due Diligence Is Systematically Undervalued by AI",
    stated: "Q1 2023",
    domain: "Real Estate",
    outcome: "Early",
    confidence: 68,
    position: "The commercial real estate sector applies AI to surface-level market data (comps, listings) while leaving the highest-alpha intelligence untouched: title chain risk, zoning flag pattern recognition, distress signal aggregation across public records, and predictive occupancy modeling. The platform that mines this layer will consistently underwrite better deals than peers.",
    evolution: [
      "Q1 2023: Thesis stated based on observation of CRE due diligence workflows",
      "Q3 2023: Terra platform MVP — distress scoring engine processes 200K+ property signals",
      "Q2 2024: Early validation — Terra flagged 3 Henderson deals that later showed title defects not caught by traditional DD",
      "Q1 2025: Thesis still early stage — product-market fit strong in underwriting, less clear in brokerage layer",
    ],
    marketSignals: ["CoStar and Zillow AI feature adoption accelerating", "Alternative data providers (tax lien, zoning) seeing 3x growth in institutional clients", "CBRE and JLL both acquire AI-DD startups"],
    portfolioBet: "Terra — Real Estate Intelligence",
  },
  {
    id: "t6",
    title: "Vertical AI Agents Will Outperform General Assistants in Enterprise",
    stated: "Q3 2023",
    domain: "AI Strategy",
    outcome: "Evolving",
    confidence: 82,
    position: "General-purpose AI assistants (ChatGPT, Copilot) deliver breadth at the cost of depth. Enterprise operators in regulated, high-stakes domains need AI that understands maritime sanctions, not just text; financial risk models, not just numbers; legal privilege structures, not just documents. Domain-native AI agents with specialized context will command 10x the retention and monetization of general tools.",
    evolution: [
      "Q3 2023: Thesis stated — domain-specialized agents will win in enterprise",
      "Q1 2024: Nuro Mesh multi-agent system built on this thesis — Helmsman, Lexis, Atlas, etc.",
      "Q3 2024: Early validation — domain agents showing 94% task completion vs. 61% for general AI on maritime/legal tasks",
      "Q2 2025: Complexity emerging — agent orchestration overhead becoming a real cost; general models improving fast",
    ],
    marketSignals: ["Salesforce Einstein domain AI 40% better NPS than general copilots", "Bloomberg GPT showing domain edge in finance", "OpenAI launching vertical products — validating and competing with thesis"],
    portfolioBet: "Nuro Mesh — Cross-Portfolio AI",
  },
];

const outcomeConfig: Record<Outcome, { icon: React.ReactNode; color: string; label: string }> = {
  Validated: { icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10", label: "Validated by Market" },
  Evolving: { icon: <TrendingUp className="w-4 h-4" />, color: "text-amber-400 border-amber-500/20 bg-amber-500/10", label: "Evolving" },
  Early: { icon: <Clock className="w-4 h-4" />, color: "text-sky-400 border-sky-500/20 bg-sky-500/10", label: "Early Stage" },
  Disproved: { icon: <XCircle className="w-4 h-4" />, color: "text-red-400 border-red-500/20 bg-red-500/10", label: "Disproved" },
};

const DOMAINS = ["All", "AI Strategy", "Maritime", "Venture Building", "Cybersecurity", "Real Estate"];

export default function ThesisTracker() {
  usePageMeta({
    title: "Thesis Tracker | Stephen Lutar",
    description: "An interactive visualization of investment theses and intellectual positions — tracking evolution and market validation over time.",
    canonical: "https://szlholdings.com/stephen/thesis-tracker",
  });

  const [expandedId, setExpandedId] = useState<string | null>("t1");
  const [selectedDomain, setSelectedDomain] = useState("All");
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome | "All">("All");

  const filtered = THESES.filter(t =>
    (selectedDomain === "All" || t.domain === selectedDomain) &&
    (selectedOutcome === "All" || t.outcome === selectedOutcome),
  );

  const outcomeCounts = (["Validated", "Evolving", "Early", "Disproved"] as Outcome[]).map(o => ({
    outcome: o,
    count: THESES.filter(t => t.outcome === o).length,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Thesis Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Investment positions and intellectual bets — their evolution and market validation track record</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {outcomeCounts.map(({ outcome, count }) => {
          const cfg = outcomeConfig[outcome];
          return (
            <button
              key={outcome}
              onClick={() => setSelectedOutcome(selectedOutcome === outcome ? "All" : outcome)}
              className={`p-4 rounded-xl border text-left transition-all ${selectedOutcome === outcome ? cfg.color : "bg-muted/10 border-border hover:border-muted-foreground/20"}`}
            >
              <div className={`flex items-center gap-1.5 mb-1 ${selectedOutcome === outcome ? "" : "text-muted-foreground"}`}>
                {cfg.icon}
                <span className="text-xs font-semibold">{cfg.label}</span>
              </div>
              <p className="text-3xl font-bold">{count}</p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground">Domain:</span>
        {DOMAINS.map(domain => (
          <button
            key={domain}
            onClick={() => setSelectedDomain(domain)}
            className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${selectedDomain === domain ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"}`}
          >
            {domain}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(thesis => {
          const cfg = outcomeConfig[thesis.outcome];
          const isExpanded = expandedId === thesis.id;
          return (
            <Card key={thesis.id} className={isExpanded ? "border-primary/30" : ""}>
              <button
                className="w-full text-left"
                onClick={() => setExpandedId(isExpanded ? null : thesis.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>
                          <span className="flex items-center gap-1">{cfg.icon}{cfg.label}</span>
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">{thesis.domain}</Badge>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Calendar className="w-3 h-3" /> Stated {thesis.stated}
                        </span>
                      </div>
                      <CardTitle className="text-base leading-snug">{thesis.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">Confidence</p>
                        <p className={`text-lg font-bold ${thesis.confidence >= 85 ? "text-emerald-400" : thesis.confidence >= 65 ? "text-amber-400" : "text-red-400"}`}>
                          {thesis.confidence}%
                        </p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${thesis.confidence >= 85 ? "bg-emerald-500/60" : thesis.confidence >= 65 ? "bg-amber-500/60" : "bg-red-500/60"}`}
                      style={{ width: `${thesis.confidence}%` }}
                    />
                  </div>
                </CardHeader>
              </button>

              {isExpanded && (
                <CardContent className="pt-0 space-y-5">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Original Position</p>
                    <p className="text-sm text-muted-foreground leading-relaxed italic">"{thesis.position}"</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Evolution Timeline</p>
                    <div className="space-y-2 relative">
                      <div className="absolute left-[5px] top-1 bottom-1 w-px bg-border" />
                      {thesis.evolution.map((step, i) => {
                        const isLast = i === thesis.evolution.length - 1;
                        const dateMatch = step.match(/^(Q\d \d{4}):/);
                        const text = dateMatch ? step.slice(dateMatch[0].length).trim() : step;
                        return (
                          <div key={i} className="flex gap-3 pl-4 relative">
                            <div className={`absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full border-2 ${isLast ? "border-primary bg-primary/40" : "border-muted-foreground/30 bg-background"}`} />
                            <div className="pb-1">
                              {dateMatch && <span className="text-[10px] font-bold text-primary">{dateMatch[1]}</span>}
                              <p className={`text-xs ${isLast ? "text-foreground" : "text-muted-foreground"} leading-snug`}>{text}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Market Signals</p>
                      <div className="space-y-1.5">
                        {thesis.marketSignals.map(signal => (
                          <div key={signal} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                            {signal}
                          </div>
                        ))}
                      </div>
                    </div>
                    {thesis.portfolioBet && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Portfolio Bet</p>
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <p className="text-xs font-semibold text-primary">{thesis.portfolioBet}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">SZL Holdings portfolio company built on this thesis</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
