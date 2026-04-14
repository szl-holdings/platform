import { useState, useEffect } from "react";
import { motion as m } from "framer-motion";
import { Pen, BookOpen, Users, TrendingUp, BarChart3, Share2, Heart, Eye, Activity, Globe, Rss, Award } from "lucide-react";
import { ParticleField, PulseMetricCard, PulseThroughputChart, PulseHeader, PulseHealthGrid, PulseEventFeed, PulseFlowDiagram, PulseTechStack } from "@szl-holdings/shared-ui";

const AGENTS = [
  { name: "Content Engine", domain: "publishing" },
  { name: "Audience Intel", domain: "analytics" },
  { name: "Distribution Bot", domain: "distribution" },
  { name: "SEO Optimizer", domain: "seo" },
  { name: "Brand Monitor", domain: "brand" },
];

const EVENT_TYPES = [
  { type: "content_published", messages: ["New essay published: 'On Observability'", "Medium article: 1.2K views in 4 hours", "Substack issue: 340 opens"] },
  { type: "audience_growth", messages: ["X followers: +47 this week", "LinkedIn impressions: 12K today", "Newsletter subscribers: +23"] },
  { type: "engagement_spike", messages: ["Thread went viral: 89 reposts", "Article shared by industry leader", "Comment thread: 34 replies"] },
  { type: "seo_insight", messages: ["'business observability' ranking: #3", "Backlink acquired: TechCrunch mention", "Domain authority: +2 points"] },
  { type: "distribution_update", messages: ["Cross-posted to 4 channels", "PDF carousel: 128 downloads", "Linktree clicks: 87 today"] },
];

function ContentCalendar() {
  const channels = [
    { name: "X / Twitter", posts: 12, color: "#94a3b8", trend: "+4 this week" },
    { name: "Medium", posts: 3, color: "#10b981", trend: "1 pending review" },
    { name: "Substack", posts: 2, color: "#f59e0b", trend: "Next: April 18" },
    { name: "LinkedIn", posts: 5, color: "#3b82f6", trend: "+2 scheduled" },
    { name: "PDF Carousel", posts: 4, color: "#8b5cf6", trend: "128 downloads" },
  ];
  return (
    <div className="space-y-2">
      {channels.map(ch => (
        <div key={ch.name} className="flex items-center gap-3 px-3 py-2 rounded-md"
          style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.035)" }}>
          <div className="w-2 h-2 rounded-full" style={{ background: ch.color }} />
          <span className="text-[11px] font-medium w-24" style={{ color: "rgba(255,255,255,0.5)" }}>{ch.name}</span>
          <span className="text-[11px] font-bold tabular-nums" style={{ color: ch.color }}>{ch.posts}</span>
          <span className="text-[9px] ml-auto" style={{ color: "rgba(255,255,255,0.2)" }}>{ch.trend}</span>
        </div>
      ))}
    </div>
  );
}

export default function StephenPulse() {
  const [totalReach, setTotalReach] = useState(24700);
  useEffect(() => { const t = setInterval(() => setTotalReach(p => p + Math.floor(Math.random() * 12)), 3000); return () => clearInterval(t); }, []);
  return (
    <div className="min-h-screen relative" style={{ background: "#070a10" }}>
      <ParticleField accentColor="#94a3b8" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <PulseHeader title="Creator Pulse" subtitle={`Content intelligence — ${totalReach.toLocaleString()} total reach · 5 content agents`} accentColor="#94a3b8" />
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg overflow-hidden mb-5 p-3"
          style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5" style={{ color: "#94a3b8" }} />
              <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>Audience Reach</span></div>
            <span className="text-[10px] tabular-nums font-medium" style={{ color: "#94a3b8" }}>{totalReach.toLocaleString()} impressions</span>
          </div>
          <PulseThroughputChart color="#94a3b8" />
        </m.div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <PulseMetricCard label="Total Reach" value={totalReach} icon={Globe} color="#94a3b8" trend="+18% this month" delay={0} />
          <PulseMetricCard label="Articles" value={47} icon={BookOpen} color="#10b981" trend="3 published this mo" delay={80} />
          <PulseMetricCard label="Subscribers" value={2847} icon={Users} color="#3b82f6" trend="+127 this month" delay={160} />
          <PulseMetricCard label="Engagement" value={8} suffix=".7%" icon={Heart} color="#ec4899" trend="Above benchmark" delay={240} />
          <PulseMetricCard label="Channels" value={5} icon={Share2} color="#f59e0b" trend="All active" delay={320} />
          <PulseMetricCard label="SEO Rank" value={3} suffix="rd" icon={Award} color="#d4a054" trend="'Observability'" delay={400} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <Rss className="w-4 h-4" style={{ color: "#94a3b8" }} /> Publishing Channels</h2>
            <ContentCalendar />
          </m.div>
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="lg:col-span-2 rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <Pen className="w-4 h-4" style={{ color: "#94a3b8" }} /> Content Stream</h2>
            <PulseEventFeed agents={AGENTS} eventTypes={EVENT_TYPES} />
          </m.div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <Share2 className="w-4 h-4" style={{ color: "#94a3b8" }} /> Distribution Flow</h2>
            <PulseFlowDiagram flows={[
              { from: "Write", to: "Edit", type: "Draft → Review", color: "#94a3b8", intensity: 4 },
              { from: "Publish", to: "Channels", type: "Cross-Post Syndication", color: "#10b981", intensity: 5 },
              { from: "Promote", to: "Social", type: "Amplification", color: "#3b82f6", intensity: 3 },
              { from: "Analyze", to: "Optimize", type: "Performance → SEO", color: "#f59e0b", intensity: 3 },
              { from: "Engage", to: "Grow", type: "Community Building", color: "#ec4899", intensity: 4 },
            ]} />
          </m.div>
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
              <Activity className="w-4 h-4" style={{ color: "#10b981" }} /> Channel Health</h2>
            <PulseHealthGrid items={[
              { name: "X / Twitter", load: 72, color: "#94a3b8" },
              { name: "Medium", load: 58, color: "#10b981" },
              { name: "Substack", load: 45, color: "#f59e0b" },
              { name: "LinkedIn", load: 67, color: "#3b82f6" },
              { name: "PDF Engine", load: 33, color: "#8b5cf6" },
              { name: "Linktree", load: 51, color: "#ec4899" },
              { name: "SEO", load: 78, color: "#d4a054" },
              { name: "Analytics", load: 29, color: "#06b6d4" },
            ]} />
          </m.div>
        </div>
        <div className="mt-5"><PulseTechStack items={[
          { label: "Articles", value: "47", color: "#94a3b8" },
          { label: "Subscribers", value: "2.8K", color: "#3b82f6" },
          { label: "Reach", value: "24.7K", color: "#10b981" },
          { label: "Engagement", value: "8.7%", color: "#ec4899" },
          { label: "SEO", value: "#3", color: "#d4a054" },
          { label: "Channels", value: "5", color: "#f59e0b" },
          { label: "Downloads", value: "128", color: "#8b5cf6" },
          { label: "Publishing", value: "Auto", color: "#64748b" },
        ]} title="Creator Architecture" /></div>
        <div className="text-center py-4 mt-4">
          <p className="text-[9px] uppercase tracking-[0.25em]" style={{ color: "rgba(255,255,255,0.08)" }}>Stephen Lutar — Creator Pulse</p>
        </div>
      </div>
    </div>
  );
}
