import { useStandardQuery } from "@szl-holdings/api-client-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSubmittedDeals, loadSubmittedDeals, subscribeSubmittedDeals, updateDeal, type SubmittedDeal, type DealAttachmentRef } from "@/lib/dealSubmissions";

import { m, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Brain, ArrowLeft, Star,
  ChevronRight, Upload, AlertCircle, CheckCircle2,
  Zap, FileText, Target, Paperclip, Download, ExternalLink,
  Mail, MessageSquare, Save, Loader2, Eye, X, Image as ImageIcon,
  Presentation, ShieldCheck, ShieldAlert, Clock,
} from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    credentials: "include",
    headers: { "x-requested-with": "XMLHttpRequest" },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const body = await res.json();
  return body.data as T;
}

type Deal = {
  id: string;
  company: string;
  sector: string;
  stage: string;
  askSize: string;
  valuation: string;
  convictionScore: number;
  scores: { team: number; market: number; product: number; traction: number; competitive: number; financials: number };
  status: "screening" | "active" | "passed" | "invested";
  founder: string;
  founderEmail?: string | null;
  summary: string;
  risks: string[];
  strengths: string[];
  date: string;
  deckUrl?: string | null;
  attachments?: DealAttachmentRef[];
  notes?: string | null;
  isInbound?: boolean;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdf(contentType: string) {
  return contentType === "application/pdf";
}
function isImage(contentType: string) {
  return contentType.startsWith("image/");
}
function previewUrl(downloadUrl: string) {
  return `${downloadUrl}?preview=1`;
}

function AttachmentIcon({ contentType, kind }: { contentType: string; kind: string }) {
  if (isPdf(contentType)) return <FileText className="h-3 w-3 flex-shrink-0 text-[#d4a054]" />;
  if (isImage(contentType)) return <ImageIcon className="h-3 w-3 flex-shrink-0 text-[#6aaa72]" />;
  if (kind === "deck") return <Presentation className="h-3 w-3 flex-shrink-0 text-[#8b7ac8]" />;
  return <FileText className="h-3 w-3 flex-shrink-0 text-[#4a90b8]" />;
}

function AttachmentThumbnail({ attachment }: { attachment: DealAttachmentRef }) {
  const { contentType, name, downloadUrl: dl } = attachment;
  if (isImage(contentType)) {
    return (
      <img
        src={previewUrl(dl)}
        alt={name}
        className="w-full h-full object-cover rounded"
        loading="lazy"
      />
    );
  }
  const bg = isPdf(contentType) ? "#d4a054" : attachment.kind === "deck" ? "#8b7ac8" : "#4a90b8";
  const Icon = isPdf(contentType) ? FileText : attachment.kind === "deck" ? Presentation : FileText;
  const label = isPdf(contentType) ? "PDF" : attachment.kind === "deck" ? "DECK" : "FILE";
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1 rounded"
      style={{ background: `${bg}18`, border: `1px solid ${bg}30` }}>
      <Icon className="h-6 w-6" style={{ color: bg }} />
      <span className="text-[8px] font-bold tracking-widest" style={{ color: bg }}>{label}</span>
    </div>
  );
}

function AttachmentPreviewModal({ attachment, onClose }: { attachment: DealAttachmentRef; onClose: () => void }) {
  const { contentType, name, downloadUrl: dl, size } = attachment;
  const pUrl = previewUrl(dl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl border border-white/[0.1] bg-[#0c1018] flex flex-col overflow-hidden"
        style={{ maxHeight: "90vh" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07] flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <AttachmentIcon contentType={contentType} kind={attachment.kind} />
            <span className="text-sm font-medium text-white truncate">{name}</span>
            <span className="text-[10px] text-white/35 flex-shrink-0">{formatBytes(size)}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <a
              href={dl}
              download={name}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] px-3 py-1.5 text-[11px] font-semibold text-white/70 hover:bg-white/[0.06] transition-colors"
            >
              <Download className="h-3 w-3" /> Download
            </a>
            <button
              onClick={onClose}
              className="flex items-center justify-center h-7 w-7 rounded-lg border border-white/[0.1] text-white/50 hover:bg-white/[0.06] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto min-h-0 bg-[#080b10]" style={{ minHeight: 400 }}>
          {isPdf(contentType) ? (
            <iframe
              src={pUrl}
              title={name}
              className="w-full h-full border-0"
              style={{ minHeight: 560 }}
            />
          ) : isImage(contentType) ? (
            <div className="flex items-center justify-center p-6 h-full">
              <img
                src={pUrl}
                alt={name}
                className="max-w-full max-h-full object-contain rounded-lg"
                style={{ maxHeight: "70vh" }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
              <AttachmentIcon contentType={contentType} kind={attachment.kind} />
              <div>
                <p className="text-sm text-white/60 mb-1">Inline preview is not available for this file type.</p>
                <p className="text-[11px] text-white/35">{contentType}</p>
              </div>
              <a
                href={dl}
                download={name}
                className="flex items-center gap-1.5 rounded-xl bg-[#d4a054] px-4 py-2 text-xs font-semibold text-black hover:bg-[#d4a054]/90"
              >
                <Download className="h-3 w-3" /> Download to view
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const DEALS: Deal[] = [
  {
    id: "d1", company: "NovaStar AI", sector: "Enterprise AI", stage: "Series A", askSize: "$8M", valuation: "$42M",
    convictionScore: 81, founder: "Priya Sharma (ex-Palantir)", date: "Apr 10, 2026",
    scores: { team: 88, market: 85, product: 79, traction: 76, competitive: 72, financials: 68 },
    status: "active",
    summary: "AI-native data infrastructure platform with proprietary embedding pipeline. $1.2M ARR growing 18% MoM. 6 enterprise pilots closing Q2.",
    strengths: ["Founder has 2 prior exits", "Category-defining timing", "Strong NPS (72)"],
    risks: ["Crowded infra market", "Low DPI for lead investors", "Key-man dependency"],
  },
  {
    id: "d2", company: "Meridian Health AI", sector: "HealthTech", stage: "Seed", askSize: "$3M", valuation: "$14M",
    convictionScore: 67, founder: "Dr. James Okon (Stanford MD/MBA)", date: "Apr 3, 2026",
    scores: { team: 82, market: 90, product: 65, traction: 52, competitive: 58, financials: 44 },
    status: "screening",
    summary: "Governed clinical decision support. Pre-revenue with 3 hospital LOIs. HIPAA-compliant architecture with FDA pathway scoped.",
    strengths: ["Massive TAM ($40B)", "Credentialed medical team", "Clear regulatory path"],
    risks: ["Pre-revenue risk", "Long sales cycles", "Regulatory uncertainty"],
  },
  {
    id: "d3", company: "PortLogix", sector: "Maritime Tech", stage: "Series A", askSize: "$12M", valuation: "$58M",
    convictionScore: 74, founder: "Andrei Petrov (ex-Maersk CTO)", date: "Mar 28, 2026",
    scores: { team: 80, market: 72, product: 78, traction: 74, competitive: 70, financials: 66 },
    status: "active",
    summary: "Port operations intelligence SaaS. $3.4M ARR, 11 port customers across 4 continents. Strategic overlap with SEXTANT portfolio.",
    strengths: ["Strong domain moat", "Global customer base", "High switching costs"],
    risks: ["Geopolitical exposure", "Concentrated customers", "Integration complexity"],
  },
  {
    id: "d4", company: "RegulaAI", sector: "LegalTech / RegTech", stage: "Seed+", askSize: "$4M", valuation: "$18M",
    convictionScore: 89, founder: "Sofia Mendez (ex-SEC, Georgetown Law)", date: "Mar 14, 2026",
    scores: { team: 92, market: 88, product: 86, traction: 82, competitive: 84, financials: 76 },
    status: "invested",
    summary: "AI-native regulatory compliance platform. $850K ARR, 22% MoM growth. Won SEC Innovation Lab grant. Complements Counsel vertical.",
    strengths: ["Regulatory network moat", "Gov't validation", "Cross-sell into PRAXIS"],
    risks: ["Niche market initially", "Gov't procurement cycles"],
  },
  {
    id: "d5", company: "SkyBridge Drone Logistics", sector: "Autonomous Logistics", stage: "Series A", askSize: "$15M", valuation: "$72M",
    convictionScore: 51, founder: "Marcus Chen (hardware background)", date: "Feb 20, 2026",
    scores: { team: 62, market: 75, product: 58, traction: 46, competitive: 44, financials: 40 },
    status: "passed",
    summary: "Autonomous drone delivery network targeting last-mile logistics. Regulatory still uncertain, $420K ARR from pilots.",
    strengths: ["Interesting category", "Large market potential"],
    risks: ["Regulatory risk is existential", "Capital intensive", "Low traction relative to ask"],
  },
];

const STATUS_COLORS: Record<string, string> = {
  screening: "#d4a054",
  active: "#4a90b8",
  invested: "#6aaa72",
  passed: "#c45a4a",
};

const STATUS_OPTIONS: { value: Deal["status"]; label: string }[] = [
  { value: "screening", label: "Screening" },
  { value: "active", label: "Active" },
  { value: "passed", label: "Passed" },
  { value: "invested", label: "Invested" },
];

function ScanBadge({ status }: { status: DealAttachmentRef["scanStatus"] }) {
  if (status === "clean") {
    return (
      <span className="flex items-center gap-0.5 rounded-full bg-[#6aaa72]/10 border border-[#6aaa72]/25 px-1.5 py-0.5 text-[9px] font-semibold text-[#6aaa72] flex-shrink-0">
        <ShieldCheck className="h-2.5 w-2.5" /> Scanned clean
      </span>
    );
  }
  if (status === "infected") {
    return (
      <span className="flex items-center gap-0.5 rounded-full bg-[#c45a4a]/10 border border-[#c45a4a]/25 px-1.5 py-0.5 text-[9px] font-semibold text-[#c45a4a] flex-shrink-0">
        <ShieldAlert className="h-2.5 w-2.5" /> Quarantined
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 rounded-full bg-white/[0.05] border border-white/[0.1] px-1.5 py-0.5 text-[9px] font-semibold text-white/40 flex-shrink-0">
      <Clock className="h-2.5 w-2.5" /> Pending scan
    </span>
  );
}

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? "#6aaa72" : score >= 65 ? "#d4a054" : "#c45a4a";
  return (
    <div className="text-center">
      <div className="relative inline-flex items-center justify-center">
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="21" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <circle cx="26" cy="26" r="21" fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${(score / 100) * 131.9} 131.9`}
            strokeLinecap="round" transform="rotate(-90 26 26)" />
        </svg>
        <span className="absolute text-[13px] font-bold text-white">{score}</span>
      </div>
      <div className="text-[9px] text-white/40 mt-1">{label}</div>
    </div>
  );
}

function DealCard({ deal, selected, onClick }: { deal: Deal; selected: boolean; onClick: () => void }) {
  const color = STATUS_COLORS[deal.status];
  const scoreColor = deal.convictionScore >= 80 ? "#6aaa72" : deal.convictionScore >= 65 ? "#d4a054" : "#c45a4a";
  return (
    <button onClick={onClick} className={`w-full text-left rounded-2xl border p-4 transition-all ${selected ? "border-[#d4a054]/40 bg-[#d4a054]/[0.05]" : "border-white/[0.07] bg-white/[0.025] hover:border-white/[0.12]"}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-sm font-semibold text-white">{deal.company}</div>
          <div className="text-[10px] text-white/40">{deal.sector} · {deal.stage}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold" style={{ color: scoreColor }}>{deal.convictionScore}</div>
          <div className="text-[9px] text-white/35">Conviction</div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold" style={{ color }}>{deal.status.toUpperCase()}</div>
        <div className="text-[10px] text-white/30">{deal.askSize} @ {deal.valuation}</div>
      </div>
    </button>
  );
}

function toDeal(s: SubmittedDeal): Deal {
  return {
    id: s.id,
    company: s.company,
    sector: s.sector,
    stage: s.stage,
    askSize: s.askSize,
    valuation: s.valuation,
    convictionScore: s.convictionScore,
    scores: s.scores,
    status: s.status,
    founder: s.founder,
    founderEmail: s.founderEmail ?? null,
    summary: s.summary,
    risks: s.risks.length ? s.risks : ["Awaiting analyst review"],
    strengths: s.strengths.length ? s.strengths : ["Inbound submission via founder portal"],
    date: s.date,
    deckUrl: s.deckUrl,
    attachments: s.attachments,
    notes: s.notes ?? null,
    isInbound: true,
  };
}

function PartnerActions({ deal, onUpdated }: { deal: Deal; onUpdated: (patch: { status?: Deal["status"]; notes?: string | null }) => void }) {
  const [pendingStatus, setPendingStatus] = useState<Deal["status"]>(deal.status);
  const [notes, setNotes] = useState<string>(deal.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPendingStatus(deal.status);
    setNotes(deal.notes ?? "");
    setSaveError(null);
  }, [deal.id, deal.status, deal.notes]);

  const isDirty = pendingStatus !== deal.status || notes !== (deal.notes ?? "");

  async function handleSave() {
    if (!isDirty || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const patch: { status?: Deal["status"]; notes?: string | null } = {};
      if (pendingStatus !== deal.status) patch.status = pendingStatus;
      if (notes !== (deal.notes ?? "")) patch.notes = notes.trim() || null;
      await updateDeal(deal.id, patch);
      onUpdated(patch);
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed — please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-5 rounded-xl border border-white/[0.08] bg-black/20 p-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare className="h-3.5 w-3.5 text-[#d4a054]" />
        <span className="text-xs font-semibold text-white">Partner Actions</span>
        <span className="text-[10px] text-white/35 ml-auto">Inbound deal — authenticated partners only</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[11px] text-white/50 w-14 flex-shrink-0">Status</span>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPendingStatus(opt.value)}
              className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] transition-all border ${
                pendingStatus === opt.value
                  ? "border-transparent text-black"
                  : "border-white/[0.08] text-white/40 hover:border-white/20"
              }`}
              style={pendingStatus === opt.value ? { background: STATUS_COLORS[opt.value] } : {}}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="text-[11px] text-white/50 block mb-1.5">Internal Notes</span>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Add partner notes, action items, or next steps…"
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white/80 placeholder:text-white/25 focus:border-[#d4a054]/40 focus:outline-none resize-none"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="flex items-center gap-1.5 rounded-xl bg-[#d4a054] px-4 py-2 text-xs font-semibold text-black hover:bg-[#d4a054]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {saving
            ? <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</>
            : saved
            ? <><CheckCircle2 className="h-3 w-3" /> Saved</>
            : <><Save className="h-3 w-3" /> Save Changes</>
          }
        </button>
        {saveError ? (
          <span className="flex items-center gap-1 text-[10px] text-[#c45a4a]">
            <AlertCircle className="h-3 w-3 flex-shrink-0" /> {saveError}
          </span>
        ) : isDirty && !saving ? (
          <span className="text-[10px] text-white/35">Unsaved changes</span>
        ) : null}
      </div>
    </div>
  );
}

export default function DealScoringPage() {
  const __pageMeta = usePageMeta({ title: "AI Deal Scoring — SZL Fund Intelligence", description: "Autonomous deal screening and conviction scoring engine." });
  const [filter, setFilter] = useState<string>("all");
  const [submissions, setSubmissions] = useState<SubmittedDeal[]>(() => getSubmittedDeals());

  const { data: inboundDeals } = useStandardQuery({
    queryKey: ["fund-inbound-deals"],
    queryFn: () => apiFetch<Array<{ status: string; convictionScore: number }>>("/fund-inbound-deals"),
    staleTime: 60_000,
  });

  useEffect(() => {
    void loadSubmittedDeals().then(list => setSubmissions(list));
    return subscribeSubmittedDeals(() => setSubmissions(getSubmittedDeals()));
  }, []);

  const allDeals = useMemo<Deal[]>(() => [...submissions.map(toDeal), ...DEALS], [submissions]);
  const [selectedId, setSelectedId] = useState<string>(allDeals[0]?.id ?? "d1");
  const [localPatch, setLocalPatch] = useState<Record<string, Partial<Deal>>>({});
  const [previewAttachment, setPreviewAttachment] = useState<DealAttachmentRef | null>(null);

  const deal: Deal = useMemo(() => {
    const base = allDeals.find(d => d.id === selectedId) ?? allDeals[0];
    const patch = localPatch[base?.id ?? ""] ?? {};
    return { ...base, ...patch };
  }, [allDeals, selectedId, localPatch]);

  const filtered = filter === "all" ? allDeals : allDeals.filter(d => d.status === filter);
  const radarData = [
    { subject: "Team", score: deal.scores.team },
    { subject: "Market", score: deal.scores.market },
    { subject: "Product", score: deal.scores.product },
    { subject: "Traction", score: deal.scores.traction },
    { subject: "Competitive", score: deal.scores.competitive },
    { subject: "Financials", score: deal.scores.financials },
  ];

  function handlePartnerUpdate(patch: { status?: Deal["status"]; notes?: string | null }) {
    setLocalPatch(prev => ({
      ...prev,
      [deal.id]: { ...prev[deal.id], ...patch },
    }));
  }

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen bg-[#080b10] text-white">
        <SiteNav />
        <main className="mx-auto max-w-7xl px-6 pt-28 pb-24">
          <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-6">
              <Link href="/fund"><button className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 transition-colors"><ArrowLeft className="h-3.5 w-3.5" /> Fund Intelligence</button></Link>
              <ChevronRight className="h-3 w-3 text-white/20" />
              <span className="text-[11px] text-white/60">AI Deal Scoring</span>
            </div>
  
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d4a054]/15">
                <Brain className="h-4.5 w-4.5 text-[#d4a054]" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">AI Deal Flow Scoring Engine</h1>
                <p className="text-xs text-white/40">Autonomous screening · team evaluation · conviction memos</p>
              </div>
            </div>
  
            <div className="grid grid-cols-4 gap-3 mt-6 mb-8">
              {(() => {
                const source = inboundDeals ?? allDeals;
                const totalScored = source.length;
                const activeCount = source.filter(d => d.status === "active").length;
                const avg = source.length
                  ? (source.reduce((s, d) => s + (d.convictionScore ?? 0), 0) / source.length).toFixed(1)
                  : "0.0";
                const investedCount = source.filter(d => d.status === "invested").length;
                return [
                  { label: "Deals Scored", value: String(totalScored), icon: FileText, color: "#d4a054" },
                  { label: "Active Pipeline", value: String(activeCount), icon: Target, color: "#4a90b8" },
                  { label: "Avg Conviction", value: avg, icon: Star, color: "#6aaa72" },
                  { label: "Portfolio Cos.", value: String(investedCount), icon: CheckCircle2, color: "#8b7ac8" },
                ];
              })().map(m => (
                <div key={m.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <m.icon className="h-4 w-4" style={{ color: m.color }} />
                    <span className="text-xs text-white/40">{m.label}</span>
                  </div>
                  <div className="text-2xl font-semibold text-white">{m.value}</div>
                </div>
              ))}
            </div>
  
            <div className="flex gap-2 mb-4">
              {["all", "screening", "active", "invested", "passed"].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] transition-all ${filter === f ? "bg-[#d4a054] text-black" : "bg-white/[0.04] text-white/40 hover:bg-white/[0.07]"}`}>
                  {f}
                </button>
              ))}
              <Link href="/fund/deal-scoring/submit">
                <button className="ml-auto flex items-center gap-1.5 rounded-full border border-[#d4a054]/30 bg-[#d4a054]/10 px-3 py-1 text-[10px] font-semibold text-[#d4a054] hover:bg-[#d4a054]/20">
                  <Upload className="h-3 w-3" /> Inbound Submission Portal
                </button>
              </Link>
            </div>
  
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-4 space-y-2">
                {filtered.map(d => (
                  <DealCard key={d.id} deal={d} selected={selectedId === d.id} onClick={() => setSelectedId(d.id)} />
                ))}
              </div>
  
              <AnimatePresence mode="wait">
                <m.div key={deal.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  className="col-span-8 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-semibold text-white">{deal.company}</h2>
                        <span className="rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase"
                          style={{ color: STATUS_COLORS[deal.status], borderColor: `${STATUS_COLORS[deal.status]}30`, background: `${STATUS_COLORS[deal.status]}12` }}>
                          {deal.status}
                        </span>
                      </div>
                      <div className="text-xs text-white/40">{deal.sector} · {deal.stage} · {deal.founder}</div>
                      <div className="text-xs text-white/30 mt-0.5">Received {deal.date} · {deal.askSize} ask @ {deal.valuation}</div>
                      {deal.founderEmail ? (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Mail className="h-3 w-3 text-[#4a90b8]" />
                          <a
                            href={`mailto:${deal.founderEmail}`}
                            className="text-[11px] text-[#4a90b8] hover:underline"
                          >
                            {deal.founderEmail}
                          </a>
                        </div>
                      ) : null}
                    </div>
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${deal.convictionScore >= 80 ? "text-[#6aaa72]" : deal.convictionScore >= 65 ? "text-[#d4a054]" : "text-[#c45a4a]"}`}>
                        {deal.convictionScore}
                      </div>
                      <div className="text-[10px] text-white/40">Conviction Score</div>
                    </div>
                  </div>
  
                  <p className="text-sm text-white/60 mb-6 leading-relaxed border-l-2 border-[#d4a054]/30 pl-4">{deal.summary}</p>
  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="rgba(255,255,255,0.06)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                            <Radar name="Score" dataKey="score" stroke="#d4a054" fill="#d4a054" fillOpacity={0.15} strokeWidth={1.5} />
                            <Tooltip contentStyle={{ background: "#0c1018", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 content-start">
                      <ScoreGauge score={deal.scores.team} label="Team" />
                      <ScoreGauge score={deal.scores.market} label="Market" />
                      <ScoreGauge score={deal.scores.product} label="Product" />
                      <ScoreGauge score={deal.scores.traction} label="Traction" />
                      <ScoreGauge score={deal.scores.competitive} label="Moat" />
                      <ScoreGauge score={deal.scores.financials} label="Financials" />
                    </div>
                  </div>
  
                  {(deal.attachments && deal.attachments.length > 0) || deal.deckUrl ? (
                    <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Paperclip className="h-3.5 w-3.5 text-[#d4a054]" />
                        <span className="text-xs font-semibold text-white">Founder Materials</span>
                        <span className="text-[10px] text-white/35">
                          {(deal.attachments?.length ?? 0)} file{(deal.attachments?.length ?? 0) === 1 ? "" : "s"}
                          {deal.deckUrl ? " · 1 link" : ""}
                        </span>
                      </div>

                      {/* Thumbnail row — deck and image attachments */}
                      {(deal.attachments ?? []).filter(a => a.kind === "deck" || isImage(a.contentType)).length > 0 ? (
                        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                          {(deal.attachments ?? [])
                            .map((a, i) => ({ a, i }))
                            .filter(({ a }) => a.kind === "deck" || isImage(a.contentType))
                            .map(({ a, i }) => (
                              <button
                                key={`thumb-${i}`}
                                onClick={() => setPreviewAttachment(a)}
                                className="relative flex-shrink-0 h-20 w-28 rounded-lg overflow-hidden border border-white/[0.08] hover:border-[#d4a054]/40 transition-colors group"
                                title={`Preview: ${a.name}`}
                              >
                                <AttachmentThumbnail attachment={a} />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ background: "rgba(0,0,0,0.5)" }}>
                                  <Eye className="h-4 w-4 text-white" />
                                </div>
                              </button>
                            ))}
                        </div>
                      ) : null}

                      {/* File list */}
                      <div className="space-y-1.5">
                        {deal.deckUrl ? (
                          <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[11px] text-white/80">
                            <div className="flex items-center gap-2 min-w-0">
                              <ExternalLink className="h-3 w-3 text-[#4a90b8] flex-shrink-0" />
                              <span className="truncate">Founder-supplied deck link</span>
                            </div>
                            <a
                              href={deal.deckUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 flex-shrink-0 ml-2 rounded-md border border-white/[0.1] px-2 py-0.5 text-[10px] text-white/50 hover:bg-white/[0.05]"
                            >
                              <ExternalLink className="h-2.5 w-2.5" /> Open
                            </a>
                          </div>
                        ) : null}
                        {(deal.attachments ?? []).map((a, i) => {
                          const isClean = a.scanStatus === "clean";
                          const isInfected = a.scanStatus === "infected";
                          return isInfected ? (
                            <div
                              key={`${a.downloadUrl}-${i}`}
                              className="flex flex-col gap-1.5 rounded-lg border border-[#c45a4a]/25 bg-[#c45a4a]/[0.04] px-3 py-2 text-[11px] text-white/50 cursor-not-allowed"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <ShieldAlert className="h-3 w-3 text-[#c45a4a] flex-shrink-0" />
                                <span className="truncate line-through">{a.name}</span>
                              </div>
                              <ScanBadge status={a.scanStatus} />
                            </div>
                          ) : (
                            <div
                              key={`${a.downloadUrl}-${i}`}
                              className={`flex flex-col gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[11px] text-white/80 ${!isClean ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                              <div className="flex items-center justify-between min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                  <AttachmentIcon contentType={a.contentType} kind={a.kind} />
                                  <span className="truncate">{a.name}</span>
                                  <span className="text-[10px] text-white/30 flex-shrink-0">{formatBytes(a.size)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                  {isClean && (
                                    <button
                                      onClick={() => setPreviewAttachment(a)}
                                      className="flex items-center gap-1 rounded-md border border-white/[0.1] px-2 py-0.5 text-[10px] text-white/50 hover:bg-white/[0.05] transition-colors"
                                      title="Preview inline"
                                    >
                                      <Eye className="h-2.5 w-2.5" /> Preview
                                    </button>
                                  )}
                                  {isClean && (
                                    <a
                                      href={a.downloadUrl}
                                      download={a.name}
                                      className="flex items-center gap-1 rounded-md border border-white/[0.1] px-2 py-0.5 text-[10px] text-white/50 hover:bg-white/[0.05] transition-colors"
                                      title="Download"
                                    >
                                      <Download className="h-2.5 w-2.5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                              <ScanBadge status={a.scanStatus} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-[#6aaa72]/20 bg-[#6aaa72]/[0.04] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#6aaa72]" />
                        <span className="text-xs font-semibold text-white">Strengths</span>
                      </div>
                      {deal.strengths.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 py-1 text-xs text-white/60">
                          <div className="mt-1.5 h-1 w-1 rounded-full bg-[#6aaa72] flex-shrink-0" />
                          {s}
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-[#c45a4a]/20 bg-[#c45a4a]/[0.04] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-3.5 w-3.5 text-[#c45a4a]" />
                        <span className="text-xs font-semibold text-white">Risk Factors</span>
                      </div>
                      {deal.risks.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 py-1 text-xs text-white/60">
                          <div className="mt-1.5 h-1 w-1 rounded-full bg-[#c45a4a] flex-shrink-0" />
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>

                  {deal.isInbound ? (
                    <PartnerActions deal={deal} onUpdated={handlePartnerUpdate} />
                  ) : (
                    <div className="mt-4 flex gap-2">
                      <button className="rounded-xl bg-[#d4a054] px-4 py-2 text-xs font-semibold text-black hover:bg-[#d4a054]/90 flex items-center gap-1.5">
                        <Zap className="h-3 w-3" /> Generate Full Memo
                      </button>
                      <button className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-semibold text-white/60 hover:bg-white/[0.04]">
                        Schedule Partner Call
                      </button>
                      <button className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-semibold text-white/60 hover:bg-white/[0.04]">
                        Pass Deal
                      </button>
                    </div>
                  )}
                </m.div>
              </AnimatePresence>
            </div>
          </m.div>
        </main>
        <SiteFooter />
      </div>
      {previewAttachment ? (
        <AttachmentPreviewModal
          attachment={previewAttachment}
          onClose={() => setPreviewAttachment(null)}
        />
      ) : null}
    </>
  );
}
