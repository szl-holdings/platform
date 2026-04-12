import { useState } from "react";
import { m } from "framer-motion";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Sparkles, TrendingUp, Target, Building2, DollarSign,
  ChevronRight, Globe, BarChart3, CheckCircle2, ArrowUpRight,
  Users, Star,
} from "lucide-react";

const ACC = "hsl(191,92%,44%)";
const SURFACE = "hsla(0,0%,100%,0.025)";
const BORDER = "hsla(0,0%,100%,0.06)";
const TEXT_PRIMARY = "hsl(38,8%,92%)";
const TEXT_SEC = "hsl(214,7%,55%)";
const TEXT_MUT = "hsl(214,7%,38%)";

type InvestorFit = "strong" | "good" | "possible";

interface Investor {
  id: string;
    name: string;
  firm: string;
  focus: string;
  recentDeals: string[];
  checkSize: string;
  stage: string;
  fitScore: number;
  fitLevel: InvestorFit;
  thesisMatch: string[];
  suggestedAngle: string;
  color: string;
  geography: string;
  portfolio: string[];
}

const fitConfig: Record<InvestorFit, { color: string; bg: string; label: string }> = {
  strong: { color: "#4ade80", bg: "rgba(74,222,128,0.08)", label: "Strong Fit" },
  good: { color: ACC, bg: `${ACC}12`, label: "Good Fit" },
  possible: { color: "hsl(214,7%,55%)", bg: "hsla(0,0%,100%,0.04)", label: "Possible Fit" },
};

const INVESTORS: Investor[] = [
  {
    id: "i1",
    name: "Maria Chen",
    firm: "Thrive Capital",
    focus: "B2B SaaS, AI/ML, Vertical Software",
    recentDeals: ["Glean", "Perplexity", "Vercel"],
    checkSize: "$5M–$25M",
    stage: "Series A/B",
    fitScore: 94,
    fitLevel: "strong",
    thesisMatch: [
      "Vertical AI platforms with embedded workflow intelligence",
      "Platform companies with cross-product data flywheels",
      "Enterprise-grade AI with provable ROI",
    ],
    suggestedAngle: "Lead with the Alloy orchestration layer and the cross-vertical data flywheel. Maria's portfolio shows a pattern of backing platforms where AI learns from cross-product behavior — SZL is a textbook match. Reference Glean's cross-tool intelligence as a parallel.",
    color: "#4ade80",
    geography: "New York, NY",
    portfolio: ["Glean", "Perplexity", "Notion", "Figma"],
  },
  {
    id: "i2",
    name: "James Fitzgerald",
    firm: "Coatue Management",
    focus: "Enterprise Tech, AI Infrastructure, Vertical SaaS",
    recentDeals: ["Scale AI", "Palantir follow-on", "Datadog"],
    checkSize: "$15M–$60M",
    stage: "Series B/C",
    fitScore: 88,
    fitLevel: "strong",
    thesisMatch: [
      "AI-native infrastructure with observability and control planes",
      "Multi-vertical enterprise platforms",
      "Data-dense industries requiring specialized AI (maritime, legal, real estate)",
    ],
    suggestedAngle: "The Lyte observability angle is particularly relevant — Coatue backed Datadog at scale and understands the value of AIOps platforms. Position the Lyte + Alloy combination as the ops intelligence layer for specialized verticals that Datadog doesn't serve.",
    color: "#60a5fa",
    geography: "Menlo Park, CA",
    portfolio: ["Datadog", "Snowflake", "Bytedance"],
  },
  {
    id: "i3",
    name: "Sarah Al-Rashid",
    firm: "Andreessen Horowitz (a16z)",
    focus: "AI x Enterprise, Defense Tech, Legal Tech",
    recentDeals: ["Palantir follow-on", "Harvey (legal AI)", "Anduril"],
    checkSize: "$10M–$50M",
    stage: "Series A/B",
    fitScore: 82,
    fitLevel: "strong",
    thesisMatch: [
      "Legal AI with workflow intelligence (Harvey parallel)",
      "Defense intelligence platforms",
      "Enterprise AI with proprietary training loops",
    ],
    suggestedAngle: "PRISM Counsel is the opening play — Harvey's legal AI trajectory maps directly. Follow with Aegis as the defense angle Sarah's thesis covers. The Trust Architecture and proof chain are the enterprise moat story a16z gravitates toward.",
    color: "#a78bfa",
    geography: "San Francisco, CA",
    portfolio: ["Harvey", "Anduril", "Replit", "Character.ai"],
  },
  {
    id: "i4",
    name: "David Wasserman",
    firm: "General Atlantic",
    focus: "Growth equity, PropTech, Maritime, B2B SaaS",
    recentDeals: ["Compass (real estate)", "Windward (maritime AI)"],
    checkSize: "$25M–$100M",
    stage: "Series B/C growth",
    fitScore: 76,
    fitLevel: "good",
    thesisMatch: [
      "Maritime intelligence with AI routing and risk management",
      "Real estate technology with data-driven market intelligence",
    ],
    suggestedAngle: "Windward is a direct comparable for Vessels — position SZL's maritime AI as the next-generation platform with cross-vertical intelligence. Terra's distress property analytics maps to their Compass investment thesis.",
    color: "#fbbf24",
    geography: "New York, NY",
    portfolio: ["Compass", "Windward", "Buildout"],
  },
  {
    id: "i5",
    name: "Priya Nair",
    firm: "Tiger Global",
    focus: "B2B SaaS, Fintech, AI Infrastructure",
    recentDeals: ["Stripe follow-on", "Rippling", "Anthropic"],
    checkSize: "$20M–$80M",
    stage: "Series B+",
    fitScore: 71,
    fitLevel: "good",
    thesisMatch: [
      "AI-native platforms with multi-product expansion potential",
      "Enterprise with high NRR and expansion revenue",
    ],
    suggestedAngle: "Tiger focuses heavily on unit economics and expansion revenue. Lead with the platform's cross-sell mechanics — a Vessels client naturally becomes an Aegis client. Show the expansion ARR model and NRR data.",
    color: "#f87171",
    geography: "New York, NY",
    portfolio: ["Stripe", "Rippling", "Monday.com"],
  },
  {
    id: "i6",
    name: "Anton Mercer",
    firm: "Accel",
    focus: "Early/growth enterprise SaaS, Security, AI",
    recentDeals: ["CrowdStrike follow-on", "Abnormal Security"],
    checkSize: "$8M–$30M",
    stage: "Series A/B",
    fitScore: 64,
    fitLevel: "possible",
    thesisMatch: [
      "Security and intelligence platforms",
      "Enterprise AI with compliance and governance",
    ],
    suggestedAngle: "The Aegis and Trust Architecture are the strongest angle here. Accel's security portfolio is interested in AI-native threat intelligence with auditability.",
    color: "#34d399",
    geography: "London, UK",
    portfolio: ["CrowdStrike", "Abnormal", "UiPath"],
  },
];

function FitBadge({ level, score }: { level: InvestorFit; score: number }) {
  const cfg = fitConfig[level];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, background: cfg.bg, border: `1px solid ${cfg.color}25`, borderRadius: 20, padding: "3px 8px" }}>
        <Star size={9} style={{ color: cfg.color }} />
        <span style={{ fontSize: 9, fontWeight: 700, color: cfg.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>{cfg.label}</span>
      </div>
      <span style={{ fontSize: 18, fontWeight: 800, color: cfg.color, letterSpacing: "-0.04em" }}>{score}</span>
    </div>
  );
}

function InvestorCard({ investor, index }: { investor: Investor; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <m.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: SURFACE, border: `1px solid ${BORDER}`,
        borderRadius: 12, overflow: "hidden",
      }}
    >
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, margin: "0 0 2px" }}>{investor.name}</p>
            <p style={{ fontSize: 12, color: TEXT_SEC, margin: "0 0 6px" }}>{investor.firm}</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, color: TEXT_MUT }}>{investor.geography}</span>
              <span style={{ fontSize: 10, color: TEXT_MUT }}>·</span>
              <span style={{ fontSize: 10, color: TEXT_MUT }}>{investor.checkSize}</span>
              <span style={{ fontSize: 10, color: TEXT_MUT }}>·</span>
              <span style={{ fontSize: 10, color: TEXT_MUT }}>{investor.stage}</span>
            </div>
          </div>
          <FitBadge level={investor.fitLevel} score={investor.fitScore} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: TEXT_MUT, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 6px" }}>Thesis Matches</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {investor.thesisMatch.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                <CheckCircle2 size={11} style={{ color: investor.color, flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11, color: TEXT_SEC }}>{m}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            color: ACC, fontSize: 12, padding: 0,
          }}
        >
          <Sparkles size={11} />
          {expanded ? "Hide approach angle" : "View AI-suggested approach angle"}
          <ChevronRight size={11} style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "0.15s" }} />
        </button>

        {expanded && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            style={{
              marginTop: 12, padding: "12px 14px",
              background: `${ACC}08`, border: `1px solid ${ACC}20`,
              borderRadius: 8, overflow: "hidden",
            }}
          >
            <p style={{ fontSize: 12, color: TEXT_SEC, margin: 0, lineHeight: 1.65 }}>{investor.suggestedAngle}</p>
          </m.div>
        )}
      </div>
    </m.div>
  );
}

export default function InvestorIntelligence() {
  const [filterFit, setFilterFit] = useState<InvestorFit | "all">("all");

  const filtered = filterFit === "all" ? INVESTORS : INVESTORS.filter(i => i.fitLevel === filterFit);

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)" }}>
      <SiteNav />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Sparkles size={16} style={{ color: ACC }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: ACC, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Investor Intelligence Engine
            </span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 300, color: TEXT_PRIMARY, margin: "0 0 10px", letterSpacing: "-0.03em" }}>
            AI-Powered Investor Matching
          </h1>
          <p style={{ fontSize: 14, color: TEXT_SEC, margin: 0 }}>
            Portfolio analyzed against investor thesis patterns, recent deals, and sector focus. Confidence-scored with personalized approach recommendations.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
          {[
            { label: "Investors Analyzed", value: "247", color: ACC },
            { label: "Strong Fit (80+)", value: INVESTORS.filter(i => i.fitLevel === "strong").length, color: "#4ade80" },
            { label: "Avg Fit Score (top tier)", value: "88", color: ACC },
          ].map(stat => (
            <div key={stat.label} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 16px" }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: stat.color, margin: "0 0 2px", letterSpacing: "-0.04em" }}>{stat.value}</p>
              <p style={{ fontSize: 10, color: TEXT_MUT, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {(["all", "strong", "good", "possible"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterFit(f)}
              style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                border: `1px solid ${filterFit === f ? ACC : BORDER}`,
                background: filterFit === f ? `${ACC}15` : "transparent",
                color: filterFit === f ? ACC : TEXT_MUT, cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {f === "all" ? "All Investors" : fitConfig[f]?.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((investor, i) => (
            <InvestorCard key={investor.id} investor={investor} index={i} />
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
