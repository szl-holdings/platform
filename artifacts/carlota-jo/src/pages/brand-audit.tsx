import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Search, AlertTriangle, CheckCircle, XCircle, Eye, Globe, Instagram, Twitter, Linkedin } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const auditSections = [
  {
    category: "Visual Identity",
    score: 72,
    status: "Needs Work",
    items: [
      { label: "Logo Consistency Across Channels", status: "pass", note: "Consistent across web, print, and social" },
      { label: "Color Palette Compliance", status: "warn", note: "3 off-brand color usages found on product pages" },
      { label: "Typography System", status: "fail", note: "4 different font families used — no hierarchy" },
      { label: "Iconography Style", status: "warn", note: "Mix of filled and outlined icons detected" },
      { label: "Photography Art Direction", status: "pass", note: "Coherent aesthetic across hero images" },
    ],
  },
  {
    category: "Brand Messaging",
    score: 58,
    status: "Critical",
    items: [
      { label: "Value Proposition Clarity", status: "fail", note: "Different hero copy on 6 landing pages" },
      { label: "Tone of Voice Consistency", status: "fail", note: "Formal in B2B, casual in B2C — no bridge" },
      { label: "Tagline Usage", status: "warn", note: "Tagline absent on Instagram bio and LinkedIn" },
      { label: "Brand Story Alignment", status: "pass", note: "About page aligns with founder narrative" },
      { label: "CTA Language", status: "warn", note: "12 variants of primary CTA detected" },
    ],
  },
  {
    category: "Digital Presence",
    score: 85,
    status: "Good",
    items: [
      { label: "SEO Brand Term Ownership", status: "pass", note: "Ranking #1 for all branded queries" },
      { label: "Social Bio Consistency", status: "warn", note: "LinkedIn description out of date" },
      { label: "Website Load Performance", status: "pass", note: "Core Web Vitals: Good across all pages" },
      { label: "Mobile Brand Experience", status: "pass", note: "Mobile NPS 91 — exceeds desktop" },
      { label: "Review Sentiment (G2/Trustpilot)", status: "pass", note: "4.6/5.0 aggregate, 312 reviews" },
    ],
  },
  {
    category: "Competitive Positioning",
    score: 64,
    status: "Needs Work",
    items: [
      { label: "Category Differentiation", status: "warn", note: "Value props overlap 60% with Competitor A" },
      { label: "Pricing Clarity", status: "fail", note: "No pricing visible — causes 34% drop-off" },
      { label: "Social Proof Placement", status: "warn", note: "Testimonials buried below fold on 5 pages" },
      { label: "Thought Leadership Content", status: "pass", note: "Publishing 2x/week — above industry avg" },
      { label: "Awards & Certifications", status: "pass", note: "3 industry awards prominently displayed" },
    ],
  },
];

const channels = [
  { name: "Website", icon: Globe, health: 82, followers: null, lastPost: null },
  { name: "Instagram", icon: Instagram, health: 91, followers: "14.2K", lastPost: "2 days ago" },
  { name: "LinkedIn", icon: Linkedin, health: 63, followers: "3.8K", lastPost: "11 days ago" },
  { name: "Twitter/X", icon: Twitter, health: 47, followers: "1.2K", lastPost: "23 days ago" },
];

const statusConfig = {
  pass: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  warn: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
  fail: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
};

const sectionStatusColor: Record<string, string> = {
  "Critical": "text-red-400 bg-red-500/10 border-red-500/20",
  "Needs Work": "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "Good": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export default function BrandAudit() {
  usePageMeta({
    title: "Brand Audit | Carlota Jo Consulting – Brand Health Assessment",
    description: "Comprehensive brand audit tools from Carlota Jo Consulting. Assess visual identity, messaging consistency, digital presence, and competitive positioning.",
    canonical: "https://szlholdings.com/carlota-jo/brand-audit",
  });
  const [active, setActive] = useState(auditSections[0]);
  const overallScore = Math.round(auditSections.reduce((a, s) => a + s.score, 0) / auditSections.length);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3">
            <Eye className="w-7 h-7 text-primary" />
            Brand Audit Report
          </h1>
          <p className="text-muted-foreground mt-2">360° brand health assessment across identity, messaging, digital presence, and competitive positioning.</p>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <Card className="col-span-1 flex flex-col items-center justify-center p-6 border-primary/20 bg-primary/5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Overall Brand Score</p>
            <p className={`text-5xl font-bold ${overallScore >= 80 ? "text-emerald-400" : overallScore >= 65 ? "text-amber-400" : "text-red-400"}`}>{overallScore}</p>
            <p className="text-xs text-muted-foreground mt-1">out of 100</p>
          </Card>
          {channels.map(ch => {
            const Icon = ch.icon;
            return (
              <Card key={ch.name} className="col-span-1">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium">{ch.name}</p>
                  </div>
                  <p className={`text-2xl font-bold ${ch.health >= 80 ? "text-emerald-400" : ch.health >= 60 ? "text-amber-400" : "text-red-400"}`}>{ch.health}<span className="text-xs text-muted-foreground font-normal">/100</span></p>
                  {ch.followers && <p className="text-[10px] text-muted-foreground mt-1">{ch.followers} · {ch.lastPost}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-4 gap-2 mb-2">
          {auditSections.map(s => (
            <button
              key={s.category}
              onClick={() => setActive(s)}
              className={`p-3 rounded-xl border text-left transition-all ${active.category === s.category ? "border-primary/50 bg-primary/5" : "border-border bg-card hover:border-border/80"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium">{s.category}</p>
                <Badge variant="outline" className={`text-[9px] ${sectionStatusColor[s.status]}`}>{s.status}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${s.score >= 80 ? "bg-emerald-400" : s.score >= 65 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${s.score}%` }} />
                </div>
                <span className="text-xs font-bold">{s.score}</span>
              </div>
            </button>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>{active.category} — Detailed Findings</span>
              <span className={`text-2xl font-bold ${active.score >= 80 ? "text-emerald-400" : active.score >= 65 ? "text-amber-400" : "text-red-400"}`}>{active.score}/100</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {active.items.map(item => {
                const cfg = statusConfig[item.status as keyof typeof statusConfig];
                const Icon = cfg.icon;
                return (
                  <div key={item.label} className={`flex items-start gap-3 p-3 rounded-lg ${cfg.bg}`}>
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
