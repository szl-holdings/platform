import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Newspaper, Search, Sparkles, Send, FileText, Radio, Clock, Check, AlertCircle } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const journalists = [
  { id: "aw", name: "Amanda Weber", outlet: "Financial Times", beat: "Enterprise Technology & AI", relevance: 97, lastCoverage: "Mar 12, 2026", tier: "Tier 1", email: "a.weber@ft.com", followers: "84K", pitchStatus: "relationship", recentPiece: "The AI-Native Enterprise: Who's Actually Winning" },
  { id: "mc", name: "Marcus Chen", outlet: "Wired", beat: "Startup Ecosystem & Venture", relevance: 94, lastCoverage: "Feb 8, 2026", tier: "Tier 1", email: "m.chen@wired.com", followers: "142K", pitchStatus: "warm", recentPiece: "Ecosystem Investing Is the New Venture Capital" },
  { id: "sr", name: "Sarah Reeves", outlet: "Forbes", beat: "AI Leadership & Future of Work", relevance: 92, lastCoverage: "Jan 29, 2026", tier: "Tier 1", email: "s.reeves@forbes.com", followers: "98K", pitchStatus: "relationship", recentPiece: "50 AI Leaders Reshaping the Enterprise in 2026" },
  { id: "jt", name: "James Thornton", outlet: "TechCrunch", beat: "Maritime & Industrial Tech", relevance: 89, lastCoverage: "Dec 14, 2025", tier: "Tier 1", email: "j.thornton@techcrunch.com", followers: "211K", pitchStatus: "warm", recentPiece: "The Ocean Data Gold Rush" },
  { id: "np", name: "Nadia Patel", outlet: "Harvard Business Review", beat: "Strategy & Organizational Design", relevance: 91, lastCoverage: "Mar 19, 2026", tier: "Tier 1", email: "n.patel@hbr.org", followers: "67K", pitchStatus: "published", recentPiece: "The 6 Lenses of Business Observability" },
  { id: "rk", name: "Ryan Kowalski", outlet: "Bloomberg Technology", beat: "Cybersecurity & Enterprise Risk", relevance: 86, lastCoverage: "Nov 22, 2025", tier: "Tier 2", email: "r.kowalski@bloomberg.com", followers: "156K", pitchStatus: "cold", recentPiece: "Inside the AI-Powered SOC" },
  { id: "el", name: "Elena Lindqvist", outlet: "The Economist", beat: "Global Supply Chain & Trade", relevance: 83, lastCoverage: "Oct 5, 2025", tier: "Tier 2", email: "e.lindqvist@economist.com", followers: "89K", pitchStatus: "cold", recentPiece: "Dark Ships and Invisible Trade" },
  { id: "bt", name: "Brian Torres", outlet: "Axios Pro Rata", beat: "VC, PE & Capital Markets", relevance: 88, lastCoverage: "Feb 19, 2026", tier: "Tier 2", email: "b.torres@axios.com", followers: "73K", pitchStatus: "warm", recentPiece: "The Portfolio Builder's Guide to AI Infrastructure" },
];

const coverageLog = [
  { outlet: "Harvard Business Review", headline: "The 6 Lenses of Business Observability", date: "Mar 19, 2026", type: "Feature", sentiment: 98, reads: "94.7K", author: "Nadia Patel" },
  { outlet: "Forbes", headline: "50 AI Leaders Reshaping Enterprise in 2026", date: "Mar 15, 2026", type: "Listicle", sentiment: 94, reads: "47.2K", author: "Sarah Reeves" },
  { outlet: "Financial Times", headline: "AIOps Challenger Ecosystem Takes Shape", date: "Mar 12, 2026", type: "Profile", sentiment: 96, reads: "38.4K", author: "Amanda Weber" },
  { outlet: "Axios", headline: "SZL Holdings: The One-Man Ecosystem Play", date: "Feb 19, 2026", type: "Profile", sentiment: 91, reads: "22.1K", author: "Brian Torres" },
  { outlet: "Wired", headline: "Ecosystem Investing Is the New Venture Capital", date: "Feb 8, 2026", type: "Feature", sentiment: 93, reads: "61.4K", author: "Marcus Chen" },
  { outlet: "Forbes", headline: "Best AI Observability Tools for CIOs in 2026", date: "Jan 29, 2026", type: "Roundup", sentiment: 88, reads: "29.3K", author: "Sarah Reeves" },
];

const pitchTemplates = [
  { id: "ecosystem", label: "Ecosystem Investing Angle", hook: "Why building 6 companies simultaneously outperforms focused venture." },
  { id: "aiops", label: "AIOps Leadership Angle", hook: "The $47B AIOps market is winner-take-most — here's who's winning and why." },
  { id: "maritime", label: "Maritime Intelligence Angle", hook: "Dark vessel activity, AI, and the $4T shipping industry's digital reckoning." },
  { id: "personal", label: "Founder Journey Angle", hook: "Solo full-stack founder building 6 enterprise products. The AI-native company in 2026." },
];

function generatePitch(targetId: string, angleId: string): string {
  const j = journalists.find(j => j.id === targetId);
  const angle = pitchTemplates.find(t => t.id === angleId);
  if (!j || !angle) return "";
  const name = j.name.split(" ")[0];

  const pitches: Record<string, Record<string, string>> = {
    aw: {
      ecosystem: `Subject: Exclusive — How One Founder Is Building 6 Enterprise Companies Simultaneously\n\n${name},\n\nYour recent coverage of enterprise AI deployment gaps resonated deeply — particularly the fragmentation narrative. I wanted to share a counter-example: SZL Holdings is 5 years into an experiment building 6 enterprise products simultaneously, each generating proprietary data and distribution for the others.\n\nThe results challenge conventional wisdom on focused company-building. Revenue is compounding across all six because the data flywheel works in ways a single-bet portfolio can't replicate. I'd love to share our architectural blueprint and internal metrics under embargo.\n\nWorth a 20-minute call?\n\nStephen`,
      aiops: `Subject: Exclusive Data — AIOps Platform Adoption Gap (Q1 2026 Findings)\n\n${name},\n\nYour March 12th piece on enterprise AI deployment gaps was spot-on — particularly the observation about tooling fragmentation. I have Q1 data from our Lyte platform that quantifies what you described: enterprise teams lose an average of 23 hours/week to context-switching between siloed monitoring tools.\n\nI'm the founder behind SZL Holdings — I've built 6 enterprise products simultaneously over the past 5 years, including Lyte (AIOps command center now used by teams across maritime, cybersecurity, and logistics). The data we're seeing on how enterprises actually adopt AI observability is counter-intuitive.\n\nHappy to share our proprietary dataset under embargo before we publish. Worth a 20-minute call?\n\nStephen`,
      maritime: `Subject: Dark Vessel Activity + AI — Exclusive Maritime Intelligence Data\n\n${name},\n\nI noticed your interest in supply chain tech. We're tracking something the broader tech press has missed: dark vessel activity is up 340% since 2022, and our Vessels platform is using AI to detect patterns traditional maritime monitoring can't see.\n\nThe $4T shipping industry is still running on fax machines and manual AIS tracking. I have proprietary data on how AI is fundamentally changing maritime intelligence — and a platform that's already deployed in production.\n\nWould love to walk you through the findings. 20 minutes?\n\nStephen`,
      personal: `Subject: The Solo Full-Stack Founder Building 6 Enterprise Products\n\n${name},\n\nI'm reaching out because I think there's a compelling story in what it looks like to build an AI-native company in 2026 — not as a concept, but in practice. I'm a solo full-stack founder running SZL Holdings: 6 live enterprise products across maritime AI, cybersecurity, real estate, and AIOps.\n\nNo co-founder, no VC (until recently). Just a thesis that one person with AI tools could build what used to require 6 separate teams. The results have been surprising. Happy to share the full inside story.\n\nStephen`,
    },
    mc: {
      ecosystem: `Subject: The Ecosystem Investing Thesis (Exclusive for Wired)\n\n${name},\n\nYour recent Wired piece on VC portfolio concentration was the best take I've seen in 2026. I've been stress-testing the inverse thesis in real-time: build multiple companies simultaneously, where each one creates proprietary data and distribution for the others.\n\nSZL Holdings is 5 years into this experiment — 6 live products across maritime AI, cybersecurity, real estate, and AIOps. Revenue is compounding across all six because the data flywheel works in ways a single-bet portfolio can't replicate.\n\nI'd love to give you exclusive access to our internal metrics and the architectural blueprint behind this. This is the story of what the next generation of founder-led ventures looks like.\n\nStephen`,
      aiops: `Subject: The $47B AIOps Market Has a Winner-Take-Most Problem\n\n${name},\n\nThe AIOps market is projected at $47B by 2028, but most coverage focuses on incumbent tools bolting on AI. The real disruption is coming from platforms built AI-native from day one.\n\nOur Lyte platform sits in this category — and the adoption data we're seeing challenges the enterprise playbook. Would make a strong follow-up to your recent enterprise tech coverage.\n\nExclusive data available. 20 minutes?\n\nStephen`,
      maritime: `Subject: The Ocean Data Gold Rush — A $4T Industry's Digital Reckoning\n\n${name},\n\nMaritime shipping is the world's largest industry still running on fax machines. Our Vessels platform is using AI to detect dark vessel patterns and supply chain signals that traditional monitoring misses entirely.\n\nThis is the kind of "hidden infrastructure" story that Wired does best. I have proprietary data and production deployments to back it up.\n\nStephen`,
      personal: `Subject: One Founder, Six Enterprise Products — The AI-Native Company Experiment\n\n${name},\n\nI've been running an experiment in building what I call the "AI-native company" — a single founder using AI tools to build and operate 6 enterprise products across different industries simultaneously. No co-founder, no VC (until recently).\n\nThe story of how this works in practice — the tooling, the decision-making, the compounding effects — feels like something Wired's audience would find compelling.\n\nStephen`,
    },
  };

  const targetPitches = pitches[targetId];
  if (targetPitches && targetPitches[angleId]) return targetPitches[angleId];

  return `Subject: ${angle.hook}\n\n${name},\n\nI wanted to reach out regarding ${angle.hook.toLowerCase()} I'm Stephen Lutar, founder of SZL Holdings — a portfolio of 6 enterprise products spanning maritime AI, cybersecurity, real estate, and AIOps.\n\nGiven your coverage of ${j.beat.toLowerCase()}, I think this angle would resonate with your audience. I have proprietary data and real production deployments to back up the thesis.\n\nHappy to share more details. Worth a 20-minute call?\n\nStephen`;
}

export default function MediaRelations() {
  usePageMeta({
    title: "Media Relations | Stephen Lutar — Press & Journalist Intelligence",
    description: "Media relations command center: journalist database, AI pitch generation, coverage tracking, and press kit management for Stephen Lutar.",
    canonical: "https://szlholdings.com/stephen/media",
  });

  const [activeTab, setActiveTab] = useState<"journalists" | "coverage" | "pitches" | "presskit">("journalists");
  const [selectedJournalist, setSelectedJournalist] = useState<string | null>(null);
  const [activePitch, setActivePitch] = useState("ecosystem");
  const [pitchTarget, setPitchTarget] = useState("aw");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredJournalists = journalists.filter(j =>
    j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.outlet.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.beat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColor: Record<string, string> = {
    relationship: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    warm: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    published: "bg-sky-500/15 text-sky-400 border-sky-500/20",
    cold: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  };

  const statusLabel: Record<string, string> = {
    relationship: "Active Relationship",
    warm: "Warm Contact",
    published: "Published Together",
    cold: "Not Yet Contacted",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-primary" />
            Media Relations Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Journalist database, AI pitch generation, coverage tracking & press kit automation</p>
        </div>
        <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse" />
          94.7K Reads This Month
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Media Placements YTD", value: "6", color: "text-emerald-400", sub: "+3 vs. Q1 2025" },
          { label: "Total Reach (2026)", value: "293K", color: "text-sky-400", sub: "Across all outlets" },
          { label: "Avg Sentiment Score", value: "93/100", color: "text-amber-400", sub: "All coverage" },
          { label: "Active Relationships", value: "3", color: "text-primary", sub: "Tier 1 journalists" },
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

      <div className="flex gap-2 border-b border-border/40 pb-0">
        {(["journalists", "coverage", "pitches", "presskit"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "presskit" ? "Press Kit" : tab.replace("-", " ")}
          </button>
        ))}
      </div>

      {activeTab === "journalists" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search journalists, outlets, or beats..."
                className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border/40 rounded-lg text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredJournalists.map(j => (
              <Card
                key={j.id}
                className={`bg-card/50 border-border/40 cursor-pointer transition-all hover:border-primary/30 ${selectedJournalist === j.id ? "border-primary/50 bg-primary/5" : ""}`}
                onClick={() => setSelectedJournalist(selectedJournalist === j.id ? null : j.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{j.name}</span>
                        <Badge variant="outline" className={`text-xs ${statusColor[j.pitchStatus]}`}>{statusLabel[j.pitchStatus]}</Badge>
                        <Badge variant="outline" className="text-xs text-muted-foreground">{j.tier}</Badge>
                      </div>
                      <div className="text-xs text-sky-400 font-medium mt-0.5">{j.outlet}</div>
                      <div className="text-xs text-muted-foreground mt-1">{j.beat}</div>
                      <div className="text-xs text-muted-foreground/60 mt-2 italic">Recent: "{j.recentPiece}"</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-primary">{j.relevance}</div>
                      <div className="text-[10px] text-muted-foreground">relevance</div>
                    </div>
                  </div>

                  {selectedJournalist === j.id && (
                    <div className="mt-4 pt-4 border-t border-border/30 space-y-3">
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div><span className="text-muted-foreground">Followers:</span><br /><span className="font-medium">{j.followers}</span></div>
                        <div><span className="text-muted-foreground">Last Coverage:</span><br /><span className="font-medium">{j.lastCoverage}</span></div>
                        <div><span className="text-muted-foreground">Contact:</span><br /><span className="font-medium text-primary">{j.email}</span></div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setPitchTarget(j.id); setActiveTab("pitches"); }}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-xs font-medium text-primary transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate AI Pitch for {j.name}
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "coverage" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {coverageLog.map((item, i) => (
              <Card key={i} className="bg-card/50 border-border/40">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Newspaper className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">"{item.headline}"</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="text-sky-400 font-medium">{item.outlet}</span>
                        <span>by {item.author}</span>
                        <span>{item.date}</span>
                        <Badge variant="outline" className="text-xs">{item.type}</Badge>
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <div className="text-sm font-bold text-emerald-400">{item.reads} reads</div>
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-xs text-muted-foreground">Sentiment</span>
                        <span className={`text-xs font-bold ${item.sentiment >= 95 ? "text-emerald-400" : item.sentiment >= 88 ? "text-amber-400" : "text-red-400"}`}>{item.sentiment}/100</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-card/50 border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Coverage Velocity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1 h-20">
                {[2, 4, 3, 5, 8, 6, 9, 7, 11, 9, 12, 6].map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end">
                    <div
                      className="bg-primary/40 hover:bg-primary/70 rounded-sm transition-colors"
                      style={{ height: `${(v / 12) * 100}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground/60 mt-1">
                <span>Apr 2025</span><span>Mar 2026</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "pitches" && (
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pitch Angle</div>
            {pitchTemplates.map(t => (
              <Card
                key={t.id}
                onClick={() => setActivePitch(t.id)}
                className={`cursor-pointer bg-card/50 border-border/40 transition-all hover:border-primary/30 ${activePitch === t.id ? "border-primary/50 bg-primary/5" : ""}`}
              >
                <CardContent className="p-3">
                  <div className="text-xs font-semibold">{t.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t.hook}</div>
                </CardContent>
              </Card>
            ))}

            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Target Journalist</div>
            {journalists.filter(j => j.tier === "Tier 1").map(j => (
              <Card
                key={j.id}
                onClick={() => setPitchTarget(j.id)}
                className={`cursor-pointer bg-card/50 border-border/40 transition-all hover:border-primary/30 ${pitchTarget === j.id ? "border-primary/50 bg-primary/5" : ""}`}
              >
                <CardContent className="p-3">
                  <div className="text-xs font-semibold">{j.name}</div>
                  <div className="text-xs text-muted-foreground">{j.outlet}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="col-span-2">
            <Card className="bg-card/50 border-border/40 h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    AI-Generated Pitch
                  </CardTitle>
                  <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">
                    Personalized for {journalists.find(j => j.id === pitchTarget)?.name}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/20 rounded-lg p-4 text-sm font-mono leading-relaxed whitespace-pre-wrap text-muted-foreground border border-border/30">
                  {generatePitch(pitchTarget, activePitch)}
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
                    <Send className="w-3.5 h-3.5" />
                    Send Pitch
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-muted/30 border border-border/40 rounded-lg text-xs font-medium hover:bg-muted/50 transition-colors">
                    <Sparkles className="w-3.5 h-3.5" />
                    Regenerate
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "presskit" && (
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card className="bg-card/50 border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Press Kit Assets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "Official Bio (Long-form)", size: "2,400 words", updated: "Mar 2026", status: "current" },
                  { name: "Official Bio (Short — 150 words)", size: "150 words", updated: "Mar 2026", status: "current" },
                  { name: "Headshots (High-res, 4 variants)", size: "28 MB", updated: "Jan 2026", status: "current" },
                  { name: "Speaker One-Sheet", size: "PDF, 2 pages", updated: "Mar 2026", status: "current" },
                  { name: "Company Fact Sheet — SZL Holdings", size: "PDF, 1 page", updated: "Feb 2026", status: "current" },
                  { name: "Logo Pack (All Products)", size: "SVG + PNG", updated: "Dec 2025", status: "needs-update" },
                ].map(asset => (
                  <div key={asset.name} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                    <div>
                      <div className="text-xs font-medium">{asset.name}</div>
                      <div className="text-xs text-muted-foreground">{asset.size} · Updated {asset.updated}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {asset.status === "current" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <button className="text-xs text-primary hover:underline">Download</button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="bg-card/50 border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Radio className="w-4 h-4 text-primary" />
                  Media Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Brand Mentions (30d)", value: "284", delta: "+41%" },
                    { label: "Avg Sentiment", value: "93/100", delta: "+4 pts" },
                    { label: "Share of Voice", value: "9.1%", delta: "+1.4pp" },
                    { label: "New Outlet Coverage", value: "3", delta: "This month" },
                  ].map(m => (
                    <div key={m.label} className="bg-muted/20 rounded-lg p-3 border border-border/30">
                      <div className="text-xs text-muted-foreground">{m.label}</div>
                      <div className="text-lg font-bold text-primary mt-1">{m.value}</div>
                      <div className="text-xs text-emerald-400">{m.delta}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Alerts</div>
                  {[
                    { text: "FT mentioned Lyte in AI observability roundup", time: "2h ago", type: "positive" },
                    { text: "New LinkedIn post hit 12K impressions in 4 hours", time: "6h ago", type: "positive" },
                    { text: "Wired journalist researching 'ecosystem investing' topic", time: "1d ago", type: "opportunity" },
                  ].map((alert, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-muted/10 rounded-lg border border-border/20">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${alert.type === "positive" ? "bg-emerald-400" : "bg-amber-400"}`} />
                      <div className="flex-1">
                        <div className="text-xs">{alert.text}</div>
                        <div className="text-xs text-muted-foreground/60">{alert.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
