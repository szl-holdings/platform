import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  ChevronRight, ChevronDown, Clock, RefreshCw, Activity, BarChart3,
  Server, Database, Shield, Zap,
} from "lucide-react";

const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.07)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };
const GOLD = "#d4a054";

type Sentiment = "positive" | "negative" | "neutral" | "warning";

interface DataPoint {
  label: string;
  raw: string;
  context: string;
}

interface OperationalStory {
  id: string;
  service: string;
  serviceIcon: React.ElementType;
  serviceColor: string;
  headline: string;
  narrative: string;
  sentiment: Sentiment;
  urgency: "immediate" | "soon" | "watch" | "ok";
  period: string;
  dataPoints: DataPoint[];
  rootCause?: string;
  recommendation?: string;
  estimatedFixTime?: string;
}

const sentimentConfig: Record<Sentiment, { color: string; bg: string; icon: React.ElementType }> = {
  positive: { color: "#34d399", bg: "rgba(52,211,153,0.08)", icon: TrendingUp },
  negative: { color: "#f87171", bg: "rgba(248,113,113,0.08)", icon: TrendingDown },
  warning: { color: GOLD, bg: "rgba(212,160,84,0.08)", icon: AlertTriangle },
  neutral: { color: TEXT.secondary as string, bg: "rgba(255,255,255,0.04)", icon: Activity },
};

const urgencyConfig = {
  immediate: { label: "Act Now", color: "#f87171" },
  soon: { label: "This Week", color: GOLD },
  watch: { label: "Monitoring", color: "#60a5fa" },
  ok: { label: "Healthy", color: "#34d399" },
};

const STORIES: OperationalStory[] = [
  {
    id: "n1",
    service: "Terra Search API",
    serviceIcon: Activity,
    serviceColor: "#34d399",
    headline: "API response times have degraded 23% this week, primarily driven by the Terra property search endpoint.",
    narrative: "The Terra property search service has been showing consistent latency degradation since Tuesday's 09:14 deploy. What looked like a modest P95 increase (180ms → 220ms) on Tuesday afternoon has compounded into a 450ms P95 by this morning — a 150% increase over baseline. The degradation is non-linear, suggesting a structural issue rather than load-driven slowdown. Three downstream consumers (terra-app, szl-ops, mobile-search) are all showing increased timeout rates as a result. Left unaddressed, this pattern is likely to cause user-visible errors under peak load within 48 hours.",
    sentiment: "negative",
    urgency: "immediate",
    period: "Apr 7–12, 2026",
    dataPoints: [
      { label: "P95 Latency", raw: "450ms", context: "+150% vs 180ms baseline" },
      { label: "Error rate", raw: "0.8%", context: "+3,900% vs 0.02% baseline" },
      { label: "Affected consumers", raw: "3 services", context: "terra-app, szl-ops, mobile-search" },
      { label: "Deployment correlation", raw: "terra-search v2.3.1", context: "Deployed Tue Apr 8, 09:14" },
    ],
    rootCause: "N+1 query pattern introduced in terra-search v2.3.1. Property search now fetches listing metadata in a loop rather than a single JOIN — adding ~180ms overhead per request.",
    recommendation: "Apply eager-load patch to terra-search (prepared, ready to deploy). Estimated 2-hour engineering effort including testing.",
    estimatedFixTime: "2 hours",
  },
  {
    id: "n2",
    service: "Aegis API Gateway",
    serviceIcon: Shield,
    serviceColor: "#f87171",
    headline: "TLS certificate expiry in under 6 hours. Manual renewal is in progress and on track to resolve before impact.",
    narrative: "The Aegis API Gateway certificate expired at 18:42 UTC today — or rather, it will. Auto-renewal failed 18 hours ago when the ACME DNS challenge timed out, likely due to a Cloudflare propagation delay in the ap-southeast-1 region. This would have been a complete API outage affecting all Aegis clients at exactly 18:42. The on-call team identified the failure during routine monitoring at 14:08 — approximately 4.5 hours before expiry — and immediately initiated manual renewal. The new certificate is being validated via Cloudflare DNS as of this writing. The story here isn't the problem — it's the catch. The monitoring system identified this with enough runway to resolve cleanly.",
    sentiment: "warning",
    urgency: "immediate",
    period: "Apr 12, 2026",
    dataPoints: [
      { label: "Time to expiry", raw: "5h 42m", context: "Certificate expires 18:42 UTC" },
      { label: "Auto-renewal status", raw: "Failed (3 attempts)", context: "ACME DNS challenge timeout" },
      { label: "Manual renewal", raw: "In progress", context: "Cloudflare DNS validation active" },
      { label: "ETA to resolve", raw: "~45 minutes", context: "Well ahead of expiry" },
    ],
    recommendation: "Renewal is on track. Post-fix action: audit ACME DNS challenge configuration in ap-southeast-1. Add 30-day pre-expiry Slack alert as secondary warning.",
    estimatedFixTime: "45 minutes (in progress)",
  },
  {
    id: "n3",
    service: "Lyte Ingest Pipeline",
    serviceIcon: Zap,
    serviceColor: GOLD,
    headline: "Ingest throughput has grown 42% month-over-month. Current infrastructure is approaching saturation by end of quarter.",
    narrative: "Lyte's ingest pipeline is the platform's fastest-growing component by volume — and that's the good news. The challenging news is that the infrastructure provisioned three months ago is approaching its designed ceiling. At current trajectory (42% MoM growth, consistent for 3 months), the ingest pipeline will saturate its current instance class around late May. Unlike a failure scenario, this is a planning opportunity: there's time to upgrade ahead of the ceiling rather than react to it. The current setup will handle April and likely most of May without issue, but the window to act without disruption is the next 3–4 weeks.",
    sentiment: "warning",
    urgency: "soon",
    period: "Feb–Apr 2026",
    dataPoints: [
      { label: "Current throughput", raw: "6,800 events/min", context: "+42% MoM for 3 consecutive months" },
      { label: "Instance utilization", raw: "68%", context: "Ceiling: ~75-80% before degradation" },
      { label: "Projected saturation", raw: "Late May 2026", context: "At current growth rate" },
      { label: "Cost trend", raw: "+42% MoM", context: "Driven by volume, not inefficiency" },
    ],
    recommendation: "Upgrade ingest instance class before May 1. Estimated cost increase: $320/month — justified by volume growth and avoids emergency scaling during a high-traffic moment.",
    estimatedFixTime: "4 hours (infra change, needs staging validation)",
  },
  {
    id: "n4",
    service: "PRISM Counsel API",
    serviceIcon: Database,
    serviceColor: "#a78bfa",
    headline: "PRISM Counsel is performing at its best-ever levels. Latency trending down, error rate near zero, no action needed.",
    narrative: "This is the operational story that doesn't need to be told — but deserves to be. PRISM Counsel's API has been consistently improving over the past 30 days: P95 latency down 18%, error rate holding at 0.04%, and throughput up 12% with no cost increase. The optimization work from the March release is paying off. The query cache added in v1.8.2 is absorbing ~35% of document-retrieval requests. No incidents, no anomalies, no flags. The only action worth noting is the impending throughput ceiling: at current growth, the cache will need to be expanded around Q3 — a comfortable planning horizon.",
    sentiment: "positive",
    urgency: "ok",
    period: "Mar 15–Apr 12, 2026",
    dataPoints: [
      { label: "P95 Latency", raw: "92ms", context: "-18% vs 112ms 30 days ago" },
      { label: "Error rate", raw: "0.04%", context: "Near zero — well within SLO" },
      { label: "Cache hit rate", raw: "34.8%", context: "v1.8.2 query cache performing well" },
      { label: "Cost trend", raw: "-5% MoM", context: "Efficiency gains from caching" },
    ],
  },
];

function NarrativeCard({ story }: { story: OperationalStory }) {
  const [expanded, setExpanded] = useState(false);
  const sen = sentimentConfig[story.sentiment];
  const urg = urgencyConfig[story.urgency];
  const Icon = story.serviceIcon;
  const SentIcon = sen.icon;

  return (
    <div style={{
      background: BG.surface, border: `1px solid ${BORDER.subtle}`,
      borderRadius: 10, overflow: "hidden",
    }}>
      <div style={{ height: 2, background: sen.color }} />
      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: `${story.serviceColor}12`, border: `1px solid ${story.serviceColor}25`,
            display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2,
          }}>
            <Icon size={14} style={{ color: story.serviceColor }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: TEXT.secondary }}>{story.service}</span>
              <span style={{
                fontSize: 9, fontWeight: 700, color: urg.color, padding: "2px 7px",
                borderRadius: 20, border: `1px solid ${urg.color}30`,
                letterSpacing: "0.06em", textTransform: "uppercase",
              }}>{urg.label}</span>
              <span style={{ fontSize: 10, color: TEXT.muted, marginLeft: "auto" }}>{story.period}</span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 500, color: TEXT.primary, margin: 0, lineHeight: 1.55 }}>
              {story.headline}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {story.dataPoints.map((dp, i) => (
            <div key={i} style={{
              padding: "6px 10px", background: BG.elevated,
              borderRadius: 6, border: `1px solid ${BORDER.subtle}`,
            }}>
              <p style={{ fontSize: 10, color: TEXT.muted, margin: "0 0 2px" }}>{dp.label}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: TEXT.primary, margin: "0 0 1px", letterSpacing: "-0.02em" }}>{dp.raw}</p>
              <p style={{ fontSize: 10, color: TEXT.tertiary, margin: 0 }}>{dp.context}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            color: TEXT.secondary, fontSize: 12, padding: 0,
          }}
        >
          <BookOpen size={12} style={{ color: sen.color }} />
          <span style={{ color: sen.color }}>Read full narrative</span>
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ borderTop: `1px solid ${BORDER.subtle}`, padding: "16px 18px" }}>
              <p style={{ fontSize: 13, color: TEXT.secondary, lineHeight: 1.75, margin: "0 0 16px" }}>
                {story.narrative}
              </p>
              {story.rootCause && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: TEXT.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 6px" }}>Root Cause</p>
                  <p style={{ fontSize: 12, color: TEXT.secondary, margin: 0, padding: "10px 12px", background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 7 }}>{story.rootCause}</p>
                </div>
              )}
              {story.recommendation && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: TEXT.muted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 6px" }}>Recommended Action</p>
                  <p style={{ fontSize: 12, color: TEXT.secondary, margin: 0, padding: "10px 12px", background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: 7 }}>
                    {story.recommendation}
                    {story.estimatedFixTime && <span style={{ display: "block", marginTop: 4, fontWeight: 600, color: "#34d399" }}>Est. fix effort: {story.estimatedFixTime}</span>}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OperationalNarrative() {
  return (
    <div style={{ padding: "20px 20px 60px", background: BG.page, minHeight: "100%", color: TEXT.primary }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <BookOpen size={14} style={{ color: GOLD }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Operational Narrative Engine
            </span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: TEXT.primary, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Platform Operational Stories
          </h1>
          <p style={{ fontSize: 12, color: TEXT.secondary, margin: 0 }}>
            Dry metrics transformed into readable narratives — context, cause, and recommended action in plain language.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {STORIES.map(s => <NarrativeCard key={s.id} story={s} />)}
        </div>
      </div>
    </div>
  );
}
