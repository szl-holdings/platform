import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Briefcase, Mic, Radio, ChevronRight, Star, Copy, Check, Mail, MessageSquare, Filter } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

type Stage = "Inquiry" | "Qualified" | "Proposal" | "Confirmed" | "Declined";
type Category = "speaking" | "advisory" | "media";

interface Opportunity {
  id: string;
  stage: Stage;
  category: Category;
  org: string;
  title: string;
  value?: string;
  aiScore: number;
  date: string;
  notes: string;
  contact?: string;
}

const PIPELINE: Opportunity[] = [
  { id: "opp-1", stage: "Confirmed", category: "speaking", org: "SaaStr Annual 2026", title: "AIOps at Enterprise Scale: Lessons from 50+ Platform Integrations", value: "$45K", aiScore: 98, date: "May 12", notes: "Keynote slot. 18K+ audience. Green room confirmed.", contact: "events@saastr.com" },
  { id: "opp-2", stage: "Confirmed", category: "speaking", org: "Gartner IT Symposium/Xpo", title: "The AI-Native Enterprise: A Blueprint for CIOs in 2026-2027", value: "$60K", aiScore: 99, date: "Oct 21", notes: "Main stage. 10K+ CIOs in the room. Premier slot.", contact: "speaker-relations@gartner.com" },
  { id: "opp-3", stage: "Proposal", category: "advisory", org: "Blackrock Alternatives", title: "AI & Technology Advisory Board", value: "$120K/yr", aiScore: 94, date: "Apr 20", notes: "Quarterly board input on AIOps and AI deployment strategy.", contact: "advisory@blackrock.com" },
  { id: "opp-4", stage: "Proposal", category: "speaking", org: "Web Summit 2026", title: "Ecosystem Investing: How to Build 8 Companies Simultaneously", value: "$28K", aiScore: 88, date: "Nov 3", notes: "Panel + standalone session. 45K attendees.", contact: "events@websummit.com" },
  { id: "opp-5", stage: "Qualified", category: "media", org: "Bloomberg Technology", title: "Deep Dive: The AIOps Revolution in Enterprise", value: "—", aiScore: 85, date: "Apr 18", notes: "30-min segment. Global broadcast.", contact: "tech@bloomberg.net" },
  { id: "opp-6", stage: "Qualified", category: "advisory", org: "Andreessen Horowitz", title: "Portfolio AI Readiness — Expert Network", value: "$8K/session", aiScore: 92, date: "Apr 25", notes: "Deep expertise sessions for a16z portfolio CIOs and CTOs.", contact: "talent@a16z.com" },
  { id: "opp-7", stage: "Inquiry", category: "speaking", org: "MIT Sloan CDO Summit", title: "Data-Driven Leadership in the AI Age", value: "TBD", aiScore: 76, date: "May 5", notes: "Academic audience. CDOs from Fortune 500.", contact: "cdo-summit@mit.edu" },
  { id: "opp-8", stage: "Inquiry", category: "media", org: "Financial Times", title: "Op-Ed: The Next Phase of Enterprise AI Adoption", value: "—", aiScore: 82, date: "Apr 16", notes: "FT technology editor reached out for perspective piece.", contact: "tech@ft.com" },
  { id: "opp-9", stage: "Inquiry", category: "advisory", org: "DP World", title: "Maritime AI Strategy Advisory", value: "$180K/yr", aiScore: 96, date: "Apr 30", notes: "Direct ask from CEO office. High signal. SZL Vessels connection.", contact: "strategy@dpworld.ae" },
  { id: "opp-10", stage: "Declined", category: "speaking", org: "Generic Tech Conf 2026", title: "AI Trends Panel", value: "$2K", aiScore: 22, date: "Mar 1", notes: "Low-signal audience. Declined — not worth calendar cost.", contact: "" },
];

const STAGES: Stage[] = ["Inquiry", "Qualified", "Proposal", "Confirmed"];

const stageColors: Record<Stage, string> = {
  Inquiry: "text-muted-foreground border-border bg-muted/20",
  Qualified: "text-sky-400 border-sky-500/20 bg-sky-500/10",
  Proposal: "text-amber-400 border-amber-500/20 bg-amber-500/10",
  Confirmed: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  Declined: "text-red-400 border-red-500/20 bg-red-500/10",
};

const categoryIcon: Record<Category, React.ReactNode> = {
  speaking: <Mic className="w-3 h-3" />,
  advisory: <Briefcase className="w-3 h-3" />,
  media: <Radio className="w-3 h-3" />,
};

const categoryColor: Record<Category, string> = {
  speaking: "text-primary",
  advisory: "text-emerald-400",
  media: "text-amber-400",
};

const RESPONSE_TEMPLATES: Record<Category, Record<string, string>> = {
  speaking: {
    accept: `Hi [Name],\n\nThank you for the invitation to speak at [Event] — I'd be delighted to participate.\n\nMy proposed topic: "[Topic]"\n\nI can confirm availability for [Date]. Could you share:\n• Technical requirements and AV setup\n• Audience profile and expected attendance\n• Any content restrictions or focus areas\n\nLooking forward to working together.\n\nBest,\nStephen Lutar\nFounder & CEO, SZL Holdings`,
    decline: `Hi [Name],\n\nThank you for thinking of me for [Event]. After reviewing my schedule and the program, I'm not able to participate this time — my calendar through [Date] is committed to existing obligations.\n\nI'd welcome the opportunity to stay connected for future programming.\n\nBest,\nStephen Lutar`,
  },
  advisory: {
    accept: `Hi [Name],\n\nThank you for reaching out regarding the [Role] at [Org]. I'm genuinely interested in exploring this — the intersection of [Topic] and [Domain] maps directly to what we're building at SZL Holdings.\n\nTo understand fit, could we schedule a 30-minute call to discuss scope, engagement model, and expectations?\n\nBest,\nStephen Lutar\nFounder & CEO, SZL Holdings`,
    decline: `Hi [Name],\n\nThank you for the [Role] invitation at [Org]. After careful consideration, I'm unable to take on additional advisory commitments at this time — my current board obligations leave insufficient bandwidth to contribute meaningfully.\n\nI'd be happy to suggest other contacts if that would help.\n\nBest,\nStephen Lutar`,
  },
  media: {
    accept: `Hi [Name],\n\nThank you for the request — I'm happy to contribute to [Publication/Show].\n\nI can make myself available [Date Range]. For context on my perspective:\n• Focus area: [Topic]\n• Relevant experience: Building SZL Holdings across 8 portfolio companies in maritime, security, AIOps, and real estate\n• Preferred angle: [Angle]\n\nPlease send briefing materials ahead of time.\n\nBest,\nStephen Lutar`,
    decline: `Hi [Name],\n\nThank you for reaching out. I'm unable to participate in [Piece] at this time due to scheduling and existing media commitments.\n\nBest,\nStephen Lutar`,
  },
};

export default function AdvisoryPipeline() {
  usePageMeta({
    title: "Speaking & Advisory Pipeline | Stephen Lutar",
    description: "CRM-style pipeline for tracking speaking engagements, advisory inquiries, and media requests — with AI lead scoring.",
    canonical: "https://szlholdings.com/stephen/pipeline",
  });

  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [templateType, setTemplateType] = useState<"accept" | "decline">("accept");
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const filtered = PIPELINE.filter(o =>
    o.stage !== "Declined" &&
    (activeCategory === "all" || o.category === activeCategory),
  );

  const pipelineByStage = STAGES.map(stage => ({
    stage,
    opps: filtered.filter(o => o.stage === stage),
  }));

  function copyTemplate() {
    if (!selectedOpp) return;
    const tmpl = RESPONSE_TEMPLATES[selectedOpp.category][templateType] || "";
    navigator.clipboard.writeText(tmpl).catch(() => {});
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" />
            Speaking & Advisory Pipeline
          </h1>
          <p className="text-sm text-muted-foreground mt-1">AI-scored opportunities tracked from first inquiry to confirmation</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          {(["all", "speaking", "advisory", "media"] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs px-2.5 py-1 rounded-lg capitalize transition-colors ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pipeline Value", value: "$433K+", color: "text-primary" },
          { label: "Confirmed YTD", value: "2", color: "text-emerald-400" },
          { label: "Avg AI Score (Active)", value: "89", color: "text-amber-400" },
          { label: "Media Requests (30d)", value: "4", color: "text-sky-400" },
        ].map(({ label, value, color }) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {pipelineByStage.map(({ stage, opps }) => (
          <div key={stage} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stage}</span>
              <Badge variant="outline" className="text-[10px]">{opps.length}</Badge>
            </div>
            <div className="space-y-2 min-h-[80px]">
              {opps.map(opp => (
                <button
                  key={opp.id}
                  onClick={() => setSelectedOpp(selectedOpp?.id === opp.id ? null : opp)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${selectedOpp?.id === opp.id ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20 hover:border-muted-foreground/30"}`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`flex items-center gap-1 text-[10px] font-semibold ${categoryColor[opp.category]}`}>
                      {categoryIcon[opp.category]}
                      {opp.category}
                    </span>
                    <span className={`text-[10px] font-bold ${opp.aiScore >= 90 ? "text-emerald-400" : opp.aiScore >= 70 ? "text-amber-400" : "text-muted-foreground"}`}>
                      ★ {opp.aiScore}
                    </span>
                  </div>
                  <p className="text-xs font-semibold leading-snug line-clamp-2">{opp.org}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{opp.date} {opp.value && opp.value !== "—" ? `· ${opp.value}` : ""}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedOpp && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="outline" className={`text-[10px] ${stageColors[selectedOpp.stage]}`}>{selectedOpp.stage}</Badge>
                  <Badge variant="outline" className={`text-[10px] ${categoryColor[selectedOpp.category]} border-current/20`}>
                    <span className="flex items-center gap-1">{categoryIcon[selectedOpp.category]}{selectedOpp.category}</span>
                  </Badge>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedOpp.aiScore >= 90 ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"}`}>
                    AI Score: {selectedOpp.aiScore}/100
                  </span>
                </div>
                <CardTitle className="text-base">{selectedOpp.org}</CardTitle>
                <p className="text-sm text-primary mt-0.5">"{selectedOpp.title}"</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Value</p>
                <p className="text-lg font-bold text-foreground">{selectedOpp.value || "—"}</p>
                <p className="text-[10px] text-muted-foreground">Target: {selectedOpp.date}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{selectedOpp.notes}</p>
            {selectedOpp.contact && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="w-3.5 h-3.5" />
                <span>{selectedOpp.contact}</span>
              </div>
            )}
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" /> Response Template
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setTemplateType("accept")}
                    className={`text-[10px] px-2.5 py-1 rounded-lg transition-colors ${templateType === "accept" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-muted/40 text-muted-foreground"}`}
                  >Accept</button>
                  <button
                    onClick={() => setTemplateType("decline")}
                    className={`text-[10px] px-2.5 py-1 rounded-lg transition-colors ${templateType === "decline" ? "bg-red-500/20 text-red-400 border border-red-500/20" : "bg-muted/40 text-muted-foreground"}`}
                  >Decline</button>
                </div>
              </div>
              <pre className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed font-sans bg-black/20 rounded-lg p-3 border border-white/5 max-h-48 overflow-y-auto">
                {RESPONSE_TEMPLATES[selectedOpp.category][templateType]}
              </pre>
              <button
                onClick={copyTemplate}
                className="mt-2 flex items-center gap-1.5 text-xs px-3 py-1.5 bg-muted/40 border border-border rounded-lg hover:bg-muted/60 transition-colors"
              >
                {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedTemplate ? "Copied!" : "Copy template"}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { cat: "speaking" as Category, label: "Speaking", total: PIPELINE.filter(o => o.category === "speaking" && o.stage !== "Declined").length, icon: Mic, color: "text-primary" },
          { cat: "advisory" as Category, label: "Advisory", total: PIPELINE.filter(o => o.category === "advisory" && o.stage !== "Declined").length, icon: Briefcase, color: "text-emerald-400" },
          { cat: "media" as Category, label: "Media", total: PIPELINE.filter(o => o.category === "media" && o.stage !== "Declined").length, icon: Radio, color: "text-amber-400" },
        ].map(({ cat, label, total, icon: Icon, color }) => {
          const confirmed = PIPELINE.filter(o => o.category === cat && o.stage === "Confirmed").length;
          const avgScore = Math.round(PIPELINE.filter(o => o.category === cat && o.stage !== "Declined").reduce((a, o) => a + o.aiScore, 0) / Math.max(1, total));
          return (
            <Card key={cat}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-sm font-semibold">{label}</span>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{total} active</span>
                  <span className="text-emerald-400">{confirmed} confirmed</span>
                  <span className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-amber-400" /> {avgScore} avg score
                  </span>
                </div>
                <button
                  onClick={() => setActiveCategory(cat)}
                  className="mt-2 text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  Filter to {label.toLowerCase()} <ChevronRight className="w-3 h-3" />
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
