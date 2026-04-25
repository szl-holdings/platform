import { useState, useRef, useCallback } from "react";
import { m } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  TrendingUp, Users, Mail, MousePointerClick, MessageSquare,
  Upload, AlertCircle, CheckCircle2, ArrowUpRight, ArrowDownRight,
  Minus, ChevronDown, ChevronUp, RefreshCw,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const GOLD = "hsl(38,52%,58%)";
const GOLD_MUTED = "hsla(38,52%,58%,0.12)";
const BG = "hsl(214,16%,4%)";
const SURFACE = "hsla(214,12%,10%,0.75)";
const ELEVATED = "hsla(214,10%,13%,0.88)";
const BORDER = "hsla(0,0%,100%,0.055)";
const BORDER_HOVER = "hsla(0,0%,100%,0.10)";
const TEXT = "hsl(38,8%,95%)";
const TEXT_SEC = "hsl(214,7%,64%)";
const TEXT_MUTED = "hsl(214,6%,42%)";

const PILLAR_COLORS: Record<string, string> = {
  "Defense & Intelligence": "#3B82F6",
  "Maritime": "#1D90D1",
  "Real Estate Intelligence": "#40856A",
  "AI Platform Engineering": "#0FB3D4",
  "Founder Journey": "#D4A054",
  "Portfolio Deep-Dives": "#3A63E0",
};

const PILLARS = Object.keys(PILLAR_COLORS);

const TARGETS = {
  month1:  { free: 1500,  paid: 40 },
  month3:  { free: 5000,  paid: 250 },
  month6:  { free: 12000, paid: 700 },
  month12: { free: 30000, paid: 2000 },
};

type TrackingRow = {
  post_id: string;
  publish_date: string;
  pillar: string;
  title: string;
  substack_opens: number;
  substack_open_rate: number;
  substack_clicks: number;
  substack_new_subs: number;
  medium_views_7d: number;
  medium_views_30d: number;
  medium_reads: number;
  medium_fans: number;
  medium_read_ratio: number;
  linkedin_impressions: number;
  linkedin_clicks: number;
  linkedin_comments: number;
  x_impressions: number;
  x_clicks: number;
  x_replies: number;
  paid_conversions: number;
  inbound_replies: number;
  qualified_conversations: number;
};

const SEED_POSTS: TrackingRow[] = [
  {
    post_id: "szl-001",
    publish_date: "2025-03-04",
    pillar: "Founder Journey",
    title: "Why I'm Building SZL Holdings in Public",
    substack_opens: 612, substack_open_rate: 51.2, substack_clicks: 78, substack_new_subs: 312,
    medium_views_7d: 1840, medium_views_30d: 2210, medium_reads: 930, medium_fans: 64, medium_read_ratio: 0.51,
    linkedin_impressions: 14200, linkedin_clicks: 420, linkedin_comments: 31,
    x_impressions: 22800, x_clicks: 310, x_replies: 48,
    paid_conversions: 8, inbound_replies: 42, qualified_conversations: 7,
  },
  {
    post_id: "szl-002",
    publish_date: "2025-03-07",
    pillar: "Founder Journey",
    title: "The Case for Vertical Command Platforms",
    substack_opens: 584, substack_open_rate: 48.9, substack_clicks: 69, substack_new_subs: 148,
    medium_views_7d: 1620, medium_views_30d: 1980, medium_reads: 810, medium_fans: 57, medium_read_ratio: 0.50,
    linkedin_impressions: 11600, linkedin_clicks: 330, linkedin_comments: 24,
    x_impressions: 18400, x_clicks: 258, x_replies: 39,
    paid_conversions: 6, inbound_replies: 28, qualified_conversations: 4,
  },
  {
    post_id: "szl-003",
    publish_date: "2025-03-11",
    pillar: "Defense & Intelligence",
    title: "Inside Aegis: Building a Command Surface for Modern Defense",
    substack_opens: 539, substack_open_rate: 45.2, substack_clicks: 61, substack_new_subs: 98,
    medium_views_7d: 1340, medium_views_30d: 1710, medium_reads: 680, medium_fans: 44, medium_read_ratio: 0.51,
    linkedin_impressions: 9200, linkedin_clicks: 270, linkedin_comments: 18,
    x_impressions: 14900, x_clicks: 204, x_replies: 29,
    paid_conversions: 4, inbound_replies: 19, qualified_conversations: 3,
  },
  {
    post_id: "szl-004",
    publish_date: "2025-03-14",
    pillar: "AI Platform Engineering",
    title: "Eval Loops at Scale: How We Prevent AI Drift in Production",
    substack_opens: 561, substack_open_rate: 47.0, substack_clicks: 74, substack_new_subs: 87,
    medium_views_7d: 2140, medium_views_30d: 2680, medium_reads: 1120, medium_fans: 81, medium_read_ratio: 0.52,
    linkedin_impressions: 13400, linkedin_clicks: 390, linkedin_comments: 27,
    x_impressions: 20800, x_clicks: 294, x_replies: 42,
    paid_conversions: 5, inbound_replies: 22, qualified_conversations: 4,
  },
  {
    post_id: "szl-005",
    publish_date: "2025-03-18",
    pillar: "Maritime",
    title: "Port-Call Intelligence: What Charterers Can See That Brokers Can't",
    substack_opens: 498, substack_open_rate: 41.7, substack_clicks: 52, substack_new_subs: 61,
    medium_views_7d: 1090, medium_views_30d: 1340, medium_reads: 530, medium_fans: 33, medium_read_ratio: 0.49,
    linkedin_impressions: 7800, linkedin_clicks: 210, linkedin_comments: 14,
    x_impressions: 11200, x_clicks: 148, x_replies: 21,
    paid_conversions: 3, inbound_replies: 14, qualified_conversations: 2,
  },
  {
    post_id: "szl-006",
    publish_date: "2025-03-21",
    pillar: "Real Estate Intelligence",
    title: "Climate Migration and the Underwriting Gap in Residential RE",
    substack_opens: 479, substack_open_rate: 40.1, substack_clicks: 48, substack_new_subs: 54,
    medium_views_7d: 980, medium_views_30d: 1210, medium_reads: 480, medium_fans: 28, medium_read_ratio: 0.49,
    linkedin_impressions: 6900, linkedin_clicks: 190, linkedin_comments: 11,
    x_impressions: 9800, x_clicks: 128, x_replies: 17,
    paid_conversions: 2, inbound_replies: 11, qualified_conversations: 1,
  },
  {
    post_id: "szl-007",
    publish_date: "2025-03-25",
    pillar: "Portfolio Deep-Dives",
    title: "Vessels Deep-Dive: The Intelligence Layer No One Talks About",
    substack_opens: 491, substack_open_rate: 41.1, substack_clicks: 55, substack_new_subs: 72,
    medium_views_7d: 1230, medium_views_30d: 1540, medium_reads: 620, medium_fans: 40, medium_read_ratio: 0.50,
    linkedin_impressions: 8400, linkedin_clicks: 230, linkedin_comments: 16,
    x_impressions: 12100, x_clicks: 163, x_replies: 23,
    paid_conversions: 3, inbound_replies: 17, qualified_conversations: 3,
  },
  {
    post_id: "szl-008",
    publish_date: "2025-03-28",
    pillar: "AI Platform Engineering",
    title: "Guardrails vs Evals: When Each One Fires and Why It Matters",
    substack_opens: 523, substack_open_rate: 43.8, substack_clicks: 67, substack_new_subs: 65,
    medium_views_7d: 1940, medium_views_30d: 2350, medium_reads: 980, medium_fans: 73, medium_read_ratio: 0.51,
    linkedin_impressions: 12100, linkedin_clicks: 355, linkedin_comments: 23,
    x_impressions: 18200, x_clicks: 251, x_replies: 36,
    paid_conversions: 4, inbound_replies: 18, qualified_conversations: 3,
  },
];

const SUBSCRIBER_GROWTH = [
  { week: "W1",  free: 312, paid: 8,  freeTarget: 375, paidTarget: 10 },
  { week: "W2",  free: 460, paid: 14, freeTarget: 750, paidTarget: 20 },
  { week: "W3",  free: 621, paid: 18, freeTarget: 1125, paidTarget: 30 },
  { week: "W4",  free: 784, paid: 24, freeTarget: 1500, paidTarget: 40 },
  { week: "W5",  free: 902, paid: 28, freeTarget: 1875, paidTarget: 50 },
  { week: "W6",  free: 1040, paid: 32, freeTarget: 2250, paidTarget: 63 },
  { week: "W7",  free: 1148, paid: 36, freeTarget: 2625, paidTarget: 75 },
  { week: "W8",  free: 1241, paid: 39, freeTarget: 3000, paidTarget: 88 },
];

const OPEN_RATE_TREND = SEED_POSTS.map(p => ({
  date: p.publish_date,
  label: p.post_id.replace("szl-", "#"),
  rate: p.substack_open_rate,
  pillar: p.pillar,
}));

function pillarsRollup(posts: TrackingRow[]) {
  const map: Record<string, { opens: number; clicks: number; views: number; conversions: number; replies: number; count: number }> = {};
  for (const p of posts) {
    if (!map[p.pillar]) map[p.pillar] = { opens: 0, clicks: 0, views: 0, conversions: 0, replies: 0, count: 0 };
    map[p.pillar].opens += p.substack_opens;
    map[p.pillar].clicks += p.substack_clicks;
    map[p.pillar].views += p.medium_views_30d;
    map[p.pillar].conversions += p.paid_conversions;
    map[p.pillar].replies += p.inbound_replies;
    map[p.pillar].count++;
  }
  return Object.entries(map).map(([pillar, v]) => ({
    pillar: pillar.length > 20 ? `${pillar.slice(0, 18)}…` : pillar,
    fullPillar: pillar,
    avgOpenRate: v.count ? Math.round(v.opens / v.count / 12) : 0,
    totalClicks: v.clicks,
    totalViews: v.views,
    totalConversions: v.conversions,
    totalReplies: v.replies,
    postCount: v.count,
    color: PILLAR_COLORS[pillar] ?? GOLD,
  }));
}

function sum(posts: TrackingRow[], key: keyof TrackingRow): number {
  return posts.reduce((s, p) => s + (p[key] as number), 0);
}

function avg(posts: TrackingRow[], key: keyof TrackingRow): number {
  return posts.length ? sum(posts, key) / posts.length : 0;
}

function parseCsvRows(text: string): Partial<TrackingRow>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim().replace(/"/g, ""));
    const row: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      const val = values[i] ?? "";
      const num = parseFloat(val);
      row[h] = Number.isNaN(num) ? val : num;
    });
    return row as Partial<TrackingRow>;
  });
}

function StatCard({
  label, value, sub, accent, icon: Icon, delta, deltaDir, delay = 0,
}: {
  label: string; value: string; sub: string; accent: string; icon: React.ElementType;
  delta?: string; deltaDir?: "up" | "down" | "flat"; delay?: number;
}) {
  const DeltaIcon = deltaDir === "up" ? ArrowUpRight : deltaDir === "down" ? ArrowDownRight : Minus;
  const deltaColor = deltaDir === "up" ? "#34d399" : deltaDir === "down" ? "#f87171" : TEXT_MUTED;
  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        padding: "1.375rem 1.5rem",
        borderRadius: "14px",
        background: `radial-gradient(ellipse at top left, ${accent}08 0%, ${SURFACE} 70%)`,
        border: `1px solid ${accent}22`,
        display: "flex", flexDirection: "column", gap: "0.5rem",
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: "0.6875rem", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_MUTED }}>
          {label}
        </span>
        <Icon size={14} color={accent} style={{ opacity: 0.7 }} />
      </div>
      <div style={{ fontSize: "2rem", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: TEXT, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
        <span style={{ fontSize: "0.75rem", color: TEXT_SEC }}>{sub}</span>
        {delta && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontSize: "0.6875rem", fontFamily: "'JetBrains Mono',monospace", color: deltaColor }}>
            <DeltaIcon size={11} />
            {delta}
          </span>
        )}
      </div>
    </m.div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "0.5rem",
      fontSize: "0.6875rem", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase",
      letterSpacing: "0.1em", color: GOLD, marginBottom: "1rem",
    }}>
      <span style={{ width: "16px", height: "1px", background: GOLD, display: "inline-block" }} />
      {children}
    </div>
  );
}

const TOOLTIP_STYLE = {
  backgroundColor: ELEVATED,
  border: `1px solid ${BORDER_HOVER}`,
  borderRadius: "8px",
  color: TEXT,
  fontFamily: "'Inter',sans-serif",
  fontSize: "0.75rem",
  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ ...TOOLTIP_STYLE, padding: "0.75rem 1rem", minWidth: "140px" }}>
      <div style={{ color: TEXT_SEC, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono',monospace", marginBottom: "0.5rem" }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", color: p.color }}>
          <span style={{ color: TEXT_SEC }}>{p.name}</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 500 }}>{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

type SortKey = "substack_opens" | "substack_open_rate" | "medium_views_30d" | "paid_conversions" | "inbound_replies";

export default function CommandNewsletterPage() {
  const __pageMeta = usePageMeta({ title: "Newsletter Analytics — SZL Command", description: "Live KPI dashboard for SZL Command newsletter performance across Substack, Medium, LinkedIn, and X." });

  const [posts, setPosts] = useState<TrackingRow[]>(SEED_POSTS);
  const [substackUploaded, setSubstackUploaded] = useState(false);
  const [mediumUploaded, setMediumUploaded] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("substack_opens");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const substackRef = useRef<HTMLInputElement>(null);
  const mediumRef = useRef<HTMLInputElement>(null);

  const handleCsvUpload = useCallback((source: "substack" | "medium") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const rows = parseCsvRows(text);
        if (!rows.length) { setUploadError("No data rows found in CSV."); return; }
        setPosts(prev => {
          const merged = [...prev];
          for (const row of rows) {
            const idx = merged.findIndex(p => p.post_id === row.post_id || p.title === row.title);
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...row } as TrackingRow;
            } else if (row.post_id && row.title && row.pillar) {
              merged.push(row as TrackingRow);
            }
          }
          return merged;
        });
        if (source === "substack") setSubstackUploaded(true);
        else setMediumUploaded(true);
      } catch {
        setUploadError("Failed to parse CSV. Please check the format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  const sortedPosts = [...posts].sort((a, b) => {
    const va = a[sortKey] as number;
    const vb = b[sortKey] as number;
    return sortAsc ? va - vb : vb - va;
  });

  const totalFree = 1241;
  const totalPaid = 39;
  const totalOpenRate = avg(posts, "substack_open_rate");
  const totalConversions = sum(posts, "paid_conversions");
  const totalInboundReplies = sum(posts, "inbound_replies");
  const totalQualified = sum(posts, "qualified_conversations");
  const conversionRate = totalFree > 0 ? ((totalPaid / totalFree) * 100) : 0;

  const pillarData = pillarsRollup(posts).sort((a, b) => b.totalViews - a.totalViews);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(false); }
  };

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "'Inter',sans-serif" }}>
        <SiteNav />
  
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "5.5rem 1.5rem 4rem" }}>
  
          {/* ── Header ── */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: "2.5rem" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.6875rem", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: GOLD }}>
                SZL Command
              </span>
              <span style={{ color: TEXT_MUTED, fontSize: "0.6875rem" }}>/</span>
              <span style={{ fontSize: "0.6875rem", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT_MUTED }}>
                Newsletter Analytics
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: TEXT, margin: 0, lineHeight: 1.15 }}>
              Newsletter Performance
            </h1>
            <p style={{ color: TEXT_SEC, marginTop: "0.5rem", fontSize: "0.9375rem", maxWidth: "560px" }}>
              Per-post and rolled-up KPIs across Substack, Medium, LinkedIn, and X — measured against launch targets.
            </p>
          </m.div>
  
          {/* ── Demo banner ── */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.75rem 1rem", borderRadius: "10px", marginBottom: "2rem",
              background: "hsla(38,52%,58%,0.06)", border: `1px solid ${GOLD_MUTED}`,
            }}
          >
            <AlertCircle size={14} color={GOLD} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: "0.8125rem", color: TEXT_SEC }}>
              Showing seed data. Upload your Substack or Medium CSV exports to replace with real figures.
            </span>
          </m.div>
  
          {/* ── CSV Upload ── */}
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1rem",
              marginBottom: "2.5rem",
            }}
          >
            {[
              { label: "Substack Export", hint: "Analytics CSV export (posts + emails)", key: "substack" as const, ref: substackRef, done: substackUploaded },
              { label: "Medium Export", hint: "Partner Program stats CSV", key: "medium" as const, ref: mediumRef, done: mediumUploaded },
            ].map(({ label, hint, key, ref, done }) => (
              <div
                key={key}
                onClick={() => ref.current?.click()}
                style={{
                  padding: "1rem 1.25rem", borderRadius: "12px", cursor: "pointer",
                  background: done ? "hsla(145,62%,40%,0.06)" : SURFACE,
                  border: `1px dashed ${done ? "#34d399" : BORDER_HOVER}`,
                  display: "flex", alignItems: "center", gap: "0.875rem",
                  transition: "border-color 0.2s",
                }}
              >
                {done ? <CheckCircle2 size={18} color="#34d399" /> : <Upload size={18} color={TEXT_MUTED} />}
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: done ? "#34d399" : TEXT }}>{label}</div>
                  <div style={{ fontSize: "0.75rem", color: TEXT_MUTED, marginTop: "2px" }}>{done ? "Uploaded — data merged" : hint}</div>
                </div>
                <input ref={ref} type="file" accept=".csv" style={{ display: "none" }} onChange={handleCsvUpload(key)} />
              </div>
            ))}
          </m.div>
  
          {uploadError && (
            <div style={{ color: "#f87171", fontSize: "0.8125rem", marginBottom: "1.5rem", padding: "0.75rem 1rem", background: "hsla(2,70%,50%,0.08)", borderRadius: "8px", border: "1px solid hsla(2,70%,50%,0.18)" }}>
              {uploadError}
            </div>
          )}
  
          {/* ── KPI Cards ── */}
          <div style={{ marginBottom: "2.5rem" }}>
            <SectionLabel>Rolled-Up KPIs</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "1rem" }}>
              <StatCard
                label="Free Subscribers"
                value={totalFree.toLocaleString()}
                sub={`Target: ${TARGETS.month1.free.toLocaleString()} (mo 1)`}
                accent={GOLD}
                icon={Users}
                delta={`${Math.round((totalFree / TARGETS.month1.free) * 100)}% of target`}
                deltaDir={totalFree >= TARGETS.month1.free ? "up" : "down"}
                delay={0.1}
              />
              <StatCard
                label="Paid Subscribers"
                value={totalPaid.toLocaleString()}
                sub={`Target: ${TARGETS.month1.paid} (mo 1)`}
                accent="#34d399"
                icon={TrendingUp}
                delta={`${Math.round((totalPaid / TARGETS.month1.paid) * 100)}% of target`}
                deltaDir={totalPaid >= TARGETS.month1.paid ? "up" : "down"}
                delay={0.15}
              />
              <StatCard
                label="Avg Open Rate"
                value={`${totalOpenRate.toFixed(1)}%`}
                sub="Target: 45% essays"
                accent="#0FB3D4"
                icon={Mail}
                delta={totalOpenRate >= 45 ? "above target" : `${(45 - totalOpenRate).toFixed(1)}pp below target`}
                deltaDir={totalOpenRate >= 45 ? "up" : "down"}
                delay={0.2}
              />
              <StatCard
                label="Free → Paid Conv."
                value={`${conversionRate.toFixed(1)}%`}
                sub="Target: 5–8%"
                accent="#3A63E0"
                icon={ArrowUpRight}
                delta={conversionRate >= 5 ? "on target" : "below target"}
                deltaDir={conversionRate >= 5 ? "up" : "flat"}
                delay={0.25}
              />
              <StatCard
                label="Inbound Replies"
                value={totalInboundReplies.toLocaleString()}
                sub={`${totalQualified} qualified convos`}
                accent="#D4A054"
                icon={MessageSquare}
                delta={`${totalQualified} qualified`}
                deltaDir="flat"
                delay={0.3}
              />
              <StatCard
                label="Paid Conversions"
                value={totalConversions.toLocaleString()}
                sub="Total from all posts"
                accent="#A78BFA"
                icon={MousePointerClick}
                delay={0.35}
              />
            </div>
          </div>
  
          {/* ── Subscriber Growth Chart ── */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ marginBottom: "2.5rem", padding: "1.5rem", borderRadius: "16px", background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <SectionLabel>Subscriber Growth vs Target</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              <div>
                <div style={{ fontSize: "0.8125rem", color: TEXT_SEC, marginBottom: "1rem", fontWeight: 500 }}>Free Subscribers</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={SUBSCRIBER_GROWTH} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="freeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={GOLD} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="freeTgtGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.08} />
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={BORDER} strokeDasharray="3 3" />
                    <XAxis dataKey="week" tick={{ fill: TEXT_MUTED, fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: TEXT_MUTED, fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="freeTarget" name="Target" stroke="#34d399" fill="url(#freeTgtGrad)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                    <Area type="monotone" dataKey="free" name="Actual" stroke={GOLD} fill="url(#freeGrad)" strokeWidth={2} dot={{ fill: GOLD, r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div style={{ fontSize: "0.8125rem", color: TEXT_SEC, marginBottom: "1rem", fontWeight: 500 }}>Paid Subscribers</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={SUBSCRIBER_GROWTH} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={BORDER} strokeDasharray="3 3" />
                    <XAxis dataKey="week" tick={{ fill: TEXT_MUTED, fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: TEXT_MUTED, fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="paidTarget" name="Target" stroke="#34d399" strokeDasharray="4 3" fill="none" strokeWidth={1.5} dot={false} />
                    <Area type="monotone" dataKey="paid" name="Actual" stroke="#A78BFA" fill="url(#paidGrad)" strokeWidth={2} dot={{ fill: "#A78BFA", r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
              {[
                { label: "Month 1 target", free: TARGETS.month1.free, paid: TARGETS.month1.paid },
                { label: "Month 3 target", free: TARGETS.month3.free, paid: TARGETS.month3.paid },
              ].map(t => (
                <div key={t.label} style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.6875rem", color: TEXT_MUTED, fontFamily: "'JetBrains Mono',monospace" }}>{t.label}:</span>
                  <span style={{ fontSize: "0.6875rem", color: GOLD, fontFamily: "'JetBrains Mono',monospace" }}>{t.free.toLocaleString()} free</span>
                  <span style={{ fontSize: "0.6875rem", color: "#A78BFA", fontFamily: "'JetBrains Mono',monospace" }}>{t.paid} paid</span>
                </div>
              ))}
            </div>
          </m.div>
  
          {/* ── Open Rate Trend ── */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            style={{ marginBottom: "2.5rem", padding: "1.5rem", borderRadius: "16px", background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <SectionLabel>Open Rate Trend (Substack)</SectionLabel>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={OPEN_RATE_TREND} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={BORDER} strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: TEXT_MUTED, fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }} axisLine={false} tickLine={false} />
                <YAxis domain={[30, 60]} tick={{ fill: TEXT_MUTED, fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const row = OPEN_RATE_TREND.find(r => r.label === label);
                    return (
                      <div style={{ ...TOOLTIP_STYLE, padding: "0.75rem 1rem" }}>
                        <div style={{ color: TEXT_SEC, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono',monospace", marginBottom: "4px" }}>{row?.date}</div>
                        <div style={{ color: "#0FB3D4", fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>{payload[0].value}% open rate</div>
                        <div style={{ color: TEXT_MUTED, fontSize: "0.6875rem", marginTop: "2px" }}>{row?.pillar}</div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine y={45} stroke={GOLD} strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "45% target", fill: GOLD, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", position: "insideTopRight" }} />
                <ReferenceLine y={35} stroke="#f87171" strokeDasharray="4 3" strokeWidth={1} label={{ value: "35% min", fill: "#f87171", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", position: "insideBottomRight" }} />
                <Line type="monotone" dataKey="rate" name="Open Rate" stroke="#0FB3D4" strokeWidth={2} dot={{ fill: "#0FB3D4", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </m.div>
  
          {/* ── Pillar Performance ── */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ marginBottom: "2.5rem", padding: "1.5rem", borderRadius: "16px", background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <SectionLabel>Top Posts by Pillar — Medium Views (30d)</SectionLabel>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pillarData} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={BORDER} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fill: TEXT_MUTED, fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="pillar" tick={{ fill: TEXT_SEC, fontSize: 10, fontFamily: "'Inter',sans-serif" }} axisLine={false} tickLine={false} width={130} />
                <Tooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const row = pillarData.find(r => r.pillar === label);
                  return (
                    <div style={{ ...TOOLTIP_STYLE, padding: "0.75rem 1rem" }}>
                      <div style={{ color: TEXT_SEC, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono',monospace", marginBottom: "4px" }}>{row?.fullPillar}</div>
                      <div style={{ color: row?.color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>{payload[0].value?.toLocaleString()} views</div>
                      <div style={{ color: TEXT_MUTED, fontSize: "0.6875rem", marginTop: "2px" }}>{row?.postCount} post{row?.postCount !== 1 ? "s" : ""}</div>
                    </div>
                  );
                }} />
                <Bar dataKey="totalViews" name="30d Views" radius={[0, 4, 4, 0]}>
                  {pillarData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1rem" }}>
              {PILLARS.map(p => (
                <div key={p} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: PILLAR_COLORS[p], flexShrink: 0 }} />
                  <span style={{ fontSize: "0.6875rem", color: TEXT_MUTED, fontFamily: "'Inter',sans-serif" }}>{p}</span>
                </div>
              ))}
            </div>
          </m.div>
  
          {/* ── Post Table ── */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            style={{ marginBottom: "3rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1rem" }}>
              <SectionLabel>Per-Post KPIs</SectionLabel>
              <span style={{ fontSize: "0.6875rem", color: TEXT_MUTED, fontFamily: "'JetBrains Mono',monospace" }}>{posts.length} posts</span>
            </div>
  
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "720px" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER_HOVER}` }}>
                    {[
                      { key: null, label: "Post" },
                      { key: "substack_opens" as SortKey, label: "Opens" },
                      { key: "substack_open_rate" as SortKey, label: "Open %" },
                      { key: "medium_views_30d" as SortKey, label: "Med Views" },
                      { key: "paid_conversions" as SortKey, label: "Paid Conv." },
                      { key: "inbound_replies" as SortKey, label: "Replies" },
                      { key: null, label: "" },
                    ].map(({ key, label }, i) => (
                      <th
                        key={i}
                        onClick={key ? () => toggleSort(key) : undefined}
                        style={{
                          padding: "0.625rem 0.75rem", textAlign: "left",
                          fontSize: "0.6875rem", fontFamily: "'JetBrains Mono',monospace",
                          textTransform: "uppercase", letterSpacing: "0.06em",
                          color: key && sortKey === key ? GOLD : TEXT_MUTED,
                          cursor: key ? "pointer" : "default",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          {label}
                          {key && sortKey === key && (sortAsc ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedPosts.map((post, _i) => {
                    const pillarColor = PILLAR_COLORS[post.pillar] ?? GOLD;
                    const isExpanded = expandedPost === post.post_id;
                    return (
                      <>
                        <tr
                          key={post.post_id}
                          onClick={() => setExpandedPost(isExpanded ? null : post.post_id)}
                          style={{
                            borderBottom: `1px solid ${BORDER}`,
                            background: isExpanded ? "hsla(214,12%,10%,0.5)" : "transparent",
                            cursor: "pointer",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "hsla(214,12%,10%,0.5)")}
                          onMouseLeave={e => (e.currentTarget.style.background = isExpanded ? "hsla(214,12%,10%,0.5)" : "transparent")}
                        >
                          <td style={{ padding: "0.875rem 0.75rem", maxWidth: "320px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{ width: "3px", height: "28px", borderRadius: "2px", background: pillarColor, flexShrink: 0 }} />
                              <div>
                                <div style={{ fontSize: "0.875rem", fontWeight: 500, color: TEXT, lineHeight: 1.3 }}>{post.title}</div>
                                <div style={{ fontSize: "0.6875rem", color: TEXT_MUTED, marginTop: "2px", fontFamily: "'JetBrains Mono',monospace" }}>
                                  {post.publish_date} · {post.pillar}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "0.875rem 0.75rem", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.875rem", color: TEXT }}>
                            {post.substack_opens.toLocaleString()}
                          </td>
                          <td style={{ padding: "0.875rem 0.75rem", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.875rem" }}>
                            <span style={{ color: post.substack_open_rate >= 45 ? "#34d399" : post.substack_open_rate >= 35 ? GOLD : "#f87171" }}>
                              {post.substack_open_rate.toFixed(1)}%
                            </span>
                          </td>
                          <td style={{ padding: "0.875rem 0.75rem", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.875rem", color: TEXT }}>
                            {post.medium_views_30d.toLocaleString()}
                          </td>
                          <td style={{ padding: "0.875rem 0.75rem", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.875rem", color: "#A78BFA" }}>
                            {post.paid_conversions}
                          </td>
                          <td style={{ padding: "0.875rem 0.75rem", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.875rem", color: GOLD }}>
                            {post.inbound_replies}
                          </td>
                          <td style={{ padding: "0.875rem 0.75rem", textAlign: "right" }}>
                            <ChevronDown size={14} color={TEXT_MUTED} style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${post.post_id}-detail`} style={{ background: "hsla(214,10%,8%,0.8)" }}>
                            <td colSpan={7} style={{ padding: "1rem 1.25rem 1.25rem" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "1rem" }}>
                                {[
                                  { group: "Substack", items: [
                                    { label: "Clicks", val: post.substack_clicks.toLocaleString() },
                                    { label: "New Subs", val: post.substack_new_subs.toLocaleString() },
                                  ]},
                                  { group: "Medium", items: [
                                    { label: "Views 7d", val: post.medium_views_7d.toLocaleString() },
                                    { label: "Reads", val: post.medium_reads.toLocaleString() },
                                    { label: "Fans", val: post.medium_fans.toLocaleString() },
                                    { label: "Read Ratio", val: `${(post.medium_read_ratio * 100).toFixed(0)}%` },
                                  ]},
                                  { group: "LinkedIn", items: [
                                    { label: "Impressions", val: post.linkedin_impressions.toLocaleString() },
                                    { label: "Clicks", val: post.linkedin_clicks.toLocaleString() },
                                    { label: "Comments", val: post.linkedin_comments.toString() },
                                  ]},
                                  { group: "X", items: [
                                    { label: "Impressions", val: post.x_impressions.toLocaleString() },
                                    { label: "Clicks", val: post.x_clicks.toLocaleString() },
                                    { label: "Replies", val: post.x_replies.toString() },
                                  ]},
                                  { group: "Outcomes", items: [
                                    { label: "Paid Conversions", val: post.paid_conversions.toString() },
                                    { label: "Inbound Replies", val: post.inbound_replies.toString() },
                                    { label: "Qualified Convos", val: post.qualified_conversations.toString() },
                                  ]},
                                ].map(({ group, items }) => (
                                  <div key={group}>
                                    <div style={{ fontSize: "0.6875rem", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT_MUTED, marginBottom: "0.5rem" }}>{group}</div>
                                    {items.map(({ label, val }) => (
                                      <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                        <span style={{ fontSize: "0.75rem", color: TEXT_SEC }}>{label}</span>
                                        <span style={{ fontSize: "0.75rem", fontFamily: "'JetBrains Mono',monospace", color: TEXT }}>{val}</span>
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </m.div>
  
          {/* ── Pillar Summary Cards ── */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ marginBottom: "3rem" }}
          >
            <SectionLabel>Pillar Summary</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "1rem" }}>
              {pillarData.map((p, i) => (
                <m.div
                  key={p.pillar}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  style={{
                    padding: "1.125rem 1.25rem", borderRadius: "12px",
                    background: `radial-gradient(ellipse at top left, ${p.color}08 0%, ${SURFACE} 70%)`,
                    border: `1px solid ${p.color}22`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: p.color }} />
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: TEXT }}>{p.fullPillar}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                    <span style={{ fontSize: "0.6875rem", color: TEXT_MUTED }}>Posts</span>
                    <span style={{ fontSize: "0.75rem", fontFamily: "'JetBrains Mono',monospace", color: TEXT }}>{p.postCount}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                    <span style={{ fontSize: "0.6875rem", color: TEXT_MUTED }}>Med Views</span>
                    <span style={{ fontSize: "0.75rem", fontFamily: "'JetBrains Mono',monospace", color: TEXT }}>{p.totalViews.toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                    <span style={{ fontSize: "0.6875rem", color: TEXT_MUTED }}>Conversions</span>
                    <span style={{ fontSize: "0.75rem", fontFamily: "'JetBrains Mono',monospace", color: p.color }}>{p.totalConversions}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.6875rem", color: TEXT_MUTED }}>Replies</span>
                    <span style={{ fontSize: "0.75rem", fontFamily: "'JetBrains Mono',monospace", color: GOLD }}>{p.totalReplies}</span>
                  </div>
                </m.div>
              ))}
            </div>
          </m.div>
  
          {/* ── Tracking cadence note ── */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            style={{
              display: "flex", alignItems: "flex-start", gap: "0.875rem",
              padding: "1rem 1.25rem", borderRadius: "10px",
              background: SURFACE, border: `1px solid ${BORDER}`,
            }}
          >
            <RefreshCw size={14} color={TEXT_MUTED} style={{ marginTop: "2px", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "0.8125rem", fontWeight: 500, color: TEXT_SEC, marginBottom: "2px" }}>Tracking cadence</div>
              <div style={{ fontSize: "0.75rem", color: TEXT_MUTED, lineHeight: 1.6 }}>
                Updated weekly, every Monday morning, from the four platform analytics dashboards. Quarterly roll-up feeds the public investor update.
                Upload Substack (Analytics → Posts export) and Medium (Partner Program → Earnings → Export) CSVs above to refresh figures.
              </div>
            </div>
          </m.div>
  
        </div>
  
        <SiteFooter />
      </div>
        </>
  );
}
