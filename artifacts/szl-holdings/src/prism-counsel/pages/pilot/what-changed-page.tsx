import { useState } from "react";
import { useWhatChanged, useMarkRead } from "../../hooks/use-prism-pilot";
import { Link } from "wouter";
import { Activity, Mail, FileText, Clock, TrendingUp, AlertTriangle, AlertCircle, CheckCircle, XCircle, Download, Eye, Filter } from "lucide-react";

const ICON_MAP: Record<string, any> = {
  mail: Mail, file: FileText, clock: Clock, "trending-up": TrendingUp,
  activity: Activity, "alert-triangle": AlertTriangle, "alert-circle": AlertCircle,
  "check-circle": CheckCircle, "x-circle": XCircle, download: Download,
};

const DEMO_DATA = {
  since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  totalChanges: 14,
  categories: [
    { key: "new_communication", label: "New Communications", icon: "mail", count: 5 },
    { key: "new_file", label: "New Files", icon: "file", count: 3 },
    { key: "deadline_updated", label: "Updated Deadlines", icon: "clock", count: 2 },
    { key: "forecast_shift", label: "Forecast Shifts", icon: "trending-up", count: 2 },
    { key: "pressure_change", label: "Pressure Changes", icon: "activity", count: 1 },
    { key: "missing_evidence", label: "New Missing Evidence", icon: "alert-triangle", count: 1 },
  ],
  byType: {
    new_communication: [
      { matterId: 1, title: "Reserve increase notification — National General", summary: "Carrier raised reserves from $15K to $28K. Adjuster Lisa Park indicated reassessment of exposure based on updated medical records.", severity: "info", sourceType: "email", isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString(), id: 1 },
      { matterId: 2, title: "IME scheduling confirmation — Allstate", summary: "Independent medical examination confirmed with Dr. Whitmore for April 15. Orthopedic evaluation.", severity: "info", sourceType: "email", isRead: false, createdAt: new Date(Date.now() - 7200000).toISOString(), id: 2 },
      { matterId: 3, title: "Discovery extension granted — Vasquez", summary: "Court granted 30-day extension for discovery. New deadline: May 15, 2024.", severity: "info", sourceType: "email", isRead: true, createdAt: new Date(Date.now() - 14400000).toISOString(), id: 3 },
      { matterId: 1, title: "Adjuster follow-up — settlement discussion", summary: "Lisa Park requesting updated demand package with revised special damages. Indicates willingness to negotiate.", severity: "info", sourceType: "email", isRead: false, createdAt: new Date(Date.now() - 18000000).toISOString(), id: 4 },
      { matterId: 3, title: "Carrier silence broken — GEICO response", summary: "First response from GEICO in 14 days. Requesting additional documentation for claim review.", severity: "info", sourceType: "email", isRead: false, createdAt: new Date(Date.now() - 21600000).toISOString(), id: 5 },
    ],
    new_file: [
      { matterId: 2, title: "IME Report — Dr. Whitmore, orthopedic", summary: "12-page orthopedic evaluation consistent with treating physician findings. No pre-existing conditions identified.", severity: "info", sourceType: "email_attachment", isRead: false, createdAt: new Date(Date.now() - 7200000).toISOString(), id: 6 },
      { matterId: 1, title: "Updated medical records — Queens Medical Center", summary: "Treatment records from Jan-Mar 2024. Physical therapy progress notes and diagnostic imaging.", severity: "info", sourceType: "matter_files", isRead: false, createdAt: new Date(Date.now() - 43200000).toISOString(), id: 7 },
      { matterId: 3, title: "Police report addendum", summary: "Supplemental police report with witness statement from bystander. Supports plaintiff's account.", severity: "info", sourceType: "matter_files", isRead: true, createdAt: new Date(Date.now() - 64800000).toISOString(), id: 8 },
    ],
    deadline_updated: [
      { matterId: 3, title: "Discovery deadline extended to May 15", summary: "30-day extension granted. New cutoff for all discovery requests and responses.", severity: "info", sourceType: "court_order", isRead: false, createdAt: new Date(Date.now() - 14400000).toISOString(), id: 9 },
      { matterId: 1, title: "Expert disclosure moved to April 18", summary: "Expert disclosure deadline advanced by 5 days per stipulation. Affects expert report preparation timeline.", severity: "warning", sourceType: "stipulation", isRead: false, createdAt: new Date(Date.now() - 36000000).toISOString(), id: 10 },
    ],
    forecast_shift: [
      { matterId: 1, title: "Settlement probability increased", summary: "Settlement probability improved from 62% to 68% following reserve increase and consistent IME findings.", severity: "info", sourceType: "forecast_engine", isRead: false, createdAt: new Date(Date.now() - 10800000).toISOString(), id: 11 },
      { matterId: 2, title: "Demand readiness improved", summary: "Demand readiness score rose from 58% to 71% after IME report confirmed treating physician assessment.", severity: "info", sourceType: "forecast_engine", isRead: false, createdAt: new Date(Date.now() - 28800000).toISOString(), id: 12 },
    ],
    pressure_change: [
      { matterId: 1, title: "Insurer pressure increased +6%", summary: "Insurer pressure dimension rose from 0.52 to 0.58. Carrier response lag exceeds 21 days on secondary claims.", severity: "warning", sourceType: "pressure_graph", isRead: false, createdAt: new Date(Date.now() - 10800000).toISOString(), id: 13 },
    ],
    missing_evidence: [
      { matterId: 1, title: "Outstanding medical records — 2 providers", summary: "Records from Dr. Martinez (treating) and Queens Physical Therapy still outstanding. Follow-up requests needed.", severity: "warning", sourceType: "evidence_audit", isRead: false, createdAt: new Date(Date.now() - 50400000).toISOString(), id: 14 },
    ],
  },
};

export default function WhatChangedPage() {
  const [hours, setHours] = useState(24);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const { data } = useWhatChanged({ hours });
  const markRead = useMarkRead();

  const changes = data ?? DEMO_DATA;
  const isDemo = !data;
  const categories = changes.categories?.filter((c: any) => c.count > 0) ?? [];
  const allItems = activeFilter
    ? (changes.byType?.[activeFilter] ?? [])
    : Object.values(changes.byType ?? {}).flat().sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
            <Activity className="w-6 h-6 text-[#4a90b8]" /> What Changed
          </h1>
          <p className="text-sm text-slate-400 mt-1">Plain-English log of everything that changed — {changes.totalChanges} updates in the last {hours} hours</p>
        </div>
        <div className="flex items-center gap-3">
          {isDemo && <span className="px-2 py-0.5 text-xs font-mono bg-amber-900/30 text-amber-400 rounded">DEMO</span>}
          <div className="flex gap-1 bg-slate-800/50 rounded p-0.5">
            {[12, 24, 48, 72].map(h => (
              <button key={h} onClick={() => setHours(h)}
                className={`px-2 py-1 text-xs rounded ${hours === h ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"}`}>
                {h}h
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActiveFilter(null)}
          className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 border transition-colors ${!activeFilter ? "bg-[#4a90b8]/10 border-[#4a90b8]/30 text-[#4a90b8]" : "border-slate-700/50 text-slate-400 hover:text-slate-300"}`}>
          <Filter className="w-3 h-3" /> All ({changes.totalChanges})
        </button>
        {categories.map((cat: any) => {
          const Icon = ICON_MAP[cat.icon] ?? Activity;
          return (
            <button key={cat.key} onClick={() => setActiveFilter(activeFilter === cat.key ? null : cat.key)}
              className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 border transition-colors ${activeFilter === cat.key ? "bg-[#4a90b8]/10 border-[#4a90b8]/30 text-[#4a90b8]" : "border-slate-700/50 text-slate-400 hover:text-slate-300"}`}>
              <Icon className="w-3 h-3" /> {cat.label} ({cat.count})
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {allItems.map((item: any, i: number) => (
          <div key={item.id ?? i} className={`p-4 rounded-lg border transition-colors ${item.isRead ? "bg-slate-800/30 border-slate-700/30" : "bg-slate-800/50 border-slate-700/50"}`}>
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${item.severity === "warning" ? "bg-amber-400" : item.isRead ? "bg-slate-600" : "bg-[#4a90b8]"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-medium ${item.isRead ? "text-slate-400" : "text-white"}`}>{item.title}</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-700/50 text-slate-400">{item.sourceType?.replace(/_/g, " ")}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{item.summary}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-slate-600">{timeAgo(item.createdAt)}</span>
                  <Link href={`/prism-counsel/matter-desk/${item.matterId}`}>
                    <span className="text-[10px] text-[#d4a054] cursor-pointer hover:underline">Open matter →</span>
                  </Link>
                  {!item.isRead && (
                    <button onClick={() => markRead.mutate([item.id])} className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
