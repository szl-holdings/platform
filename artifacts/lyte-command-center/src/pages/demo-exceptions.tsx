import { useState } from "react";
import { AlertOctagon, AlertTriangle, CheckCircle, Clock, Filter } from "lucide-react";
import { demoExceptions } from "@/lib/demo-seed";

const BG = { surface: "#0c1018", elevated: "#10141e" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.06)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };

const SEV: Record<string, { text: string; bg: string; border: string }> = {
  critical: { text: "#c45a4a", bg: "rgba(196,90,74,0.08)", border: "rgba(196,90,74,0.2)" },
  high: { text: "#c8953c", bg: "rgba(200,149,60,0.08)", border: "rgba(200,149,60,0.2)" },
  medium: { text: "#d4a054", bg: "rgba(212,160,84,0.08)", border: "rgba(212,160,84,0.2)" },
  low: { text: "#4a90b8", bg: "rgba(74,144,184,0.08)", border: "rgba(74,144,184,0.2)" },
};

const STATUS: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "#c45a4a" },
  acknowledged: { label: "Acknowledged", color: "#d4a054" },
  escalated: { label: "Escalated", color: "#c8953c" },
  resolved: { label: "Resolved", color: "#6b8f71" },
};

const CAT: Record<string, { label: string; color: string }> = {
  sla_breach: { label: "SLA Breach", color: "#c45a4a" },
  ownership_gap: { label: "Ownership Gap", color: "#c8953c" },
  data_quality: { label: "Data Quality", color: "#d4a054" },
  process_violation: { label: "Process Violation", color: "#8b7ac8" },
  capacity: { label: "Capacity", color: "#4a90b8" },
  compliance: { label: "Compliance", color: "#6b8f71" },
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return n === 0 ? "—" : `$${n}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) {
    const absDiff = -diff;
    const mins = Math.floor(absDiff / 60000);
    if (mins < 60) return `in ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `in ${hrs}h`;
    return `in ${Math.floor(hrs / 24)}d`;
  }
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DemoExceptionsPage() {
  const [sevFilter, setSevFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = demoExceptions.filter(e => {
    if (sevFilter !== "all" && e.severity !== sevFilter) return false;
    if (catFilter !== "all" && e.category !== catFilter) return false;
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    return true;
  });

  const open = demoExceptions.filter(e => e.status === "open").length;
  const escalated = demoExceptions.filter(e => e.status === "escalated").length;
  const totalVar = demoExceptions.reduce((a, e) => a + e.valueAtRisk, 0);

  return (
    <div className="p-4 max-w-[1100px] space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <AlertOctagon className="w-3.5 h-3.5" style={{ color: "#c45a4a" }} />
          <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "#c45a4a" }}>Lyte · Exceptions</span>
        </div>
        <h1 className="text-lg font-bold" style={{ color: TEXT.primary }}>Exception Queue</h1>
        <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>Categorized exceptions requiring review — SLA breaches, ownership gaps, compliance, and process violations</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Exceptions", value: demoExceptions.length, color: TEXT.secondary },
          { label: "Open", value: open, color: "#c45a4a" },
          { label: "Escalated", value: escalated, color: "#c8953c" },
          { label: "Value at Risk", value: fmt(totalVar), color: "#c45a4a" },
        ].map(c => (
          <div key={c.label} className="rounded-md p-3" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
            <div className="text-[8px] uppercase tracking-wider mb-1" style={{ color: TEXT.muted }}>{c.label}</div>
            <div className="text-xl font-bold font-mono" style={{ color: c.color as string }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1">
          <span className="text-[9px] uppercase tracking-wider mr-1" style={{ color: TEXT.muted }}>Severity:</span>
          {["all", "critical", "high", "medium"].map(f => {
            const sc = SEV[f];
            return (
              <button key={f} onClick={() => setSevFilter(f)}
                className="text-[9px] px-2.5 py-1 rounded border capitalize"
                style={{ color: sevFilter === f ? (sc?.text ?? "#d4a054") : TEXT.muted, background: sevFilter === f ? (sc?.bg ?? "rgba(212,160,84,0.08)") : "transparent", borderColor: sevFilter === f ? (sc?.border ?? "rgba(212,160,84,0.2)") : BORDER.subtle }}>
                {f}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] uppercase tracking-wider mr-1" style={{ color: TEXT.muted }}>Category:</span>
          {["all", "sla_breach", "ownership_gap", "data_quality", "compliance", "capacity"].map(f => {
            const cc = CAT[f];
            return (
              <button key={f} onClick={() => setCatFilter(f)}
                className="text-[9px] px-2.5 py-1 rounded border"
                style={{ color: catFilter === f ? (cc?.color ?? "#d4a054") : TEXT.muted, background: catFilter === f ? `${cc?.color ?? "#d4a054"}12` : "transparent", borderColor: catFilter === f ? `${cc?.color ?? "#d4a054"}25` : BORDER.subtle }}>
                {f === "all" ? "All" : cc.label}
              </button>
            );
          })}
        </div>
        <span className="ml-auto text-[9px] font-mono" style={{ color: TEXT.muted }}>{filtered.length} exceptions</span>
      </div>

      <div className="space-y-2">
        {filtered.map(exc => {
          const sc = SEV[exc.severity];
          const sta = STATUS[exc.status];
          const cat = CAT[exc.category];
          const isHighRisk = exc.status === "open" || exc.status === "escalated";
          return (
            <div key={exc.id} className="rounded-md overflow-hidden" style={{ background: BG.surface, border: `1px solid ${isHighRisk && exc.severity === "critical" ? "rgba(196,90,74,0.15)" : BORDER.subtle}` }}>
              <div className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1 flex-wrap">
                      <span className="text-[11px] font-semibold leading-snug" style={{ color: TEXT.primary }}>{exc.title}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[8px] px-1.5 py-px rounded uppercase font-mono" style={{ color: sc.text, background: sc.bg, border: `1px solid ${sc.border}` }}>{exc.severity}</span>
                      <span className="text-[8px] px-1.5 py-px rounded" style={{ color: cat.color, background: `${cat.color}10`, border: `1px solid ${cat.color}20` }}>{cat.label}</span>
                      <span className="text-[8px] px-1.5 py-px rounded" style={{ color: sta.color, background: `${sta.color}10`, border: `1px solid ${sta.color}20` }}>{sta.label}</span>
                      {exc.slaBreachAt && <span className="text-[8px] flex items-center gap-0.5" style={{ color: "#c45a4a" }}><Clock className="w-2.5 h-2.5" /> SLA breached {timeAgo(exc.slaBreachAt)}</span>}
                    </div>
                    <p className="text-[10px] leading-relaxed mb-2" style={{ color: TEXT.secondary }}>{exc.description}</p>
                    {exc.resolution && (
                      <div className="rounded px-2 py-1.5 text-[9px]" style={{ color: "#6b8f71", background: "rgba(107,143,113,0.06)", border: "1px solid rgba(107,143,113,0.12)" }}>
                        Resolution in progress: {exc.resolution}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[9px]" style={{ color: TEXT.muted }}>System: {exc.affectedSystem}</span>
                      <span className="text-[9px]" style={{ color: TEXT.muted }}>Owner: {exc.owner ?? "Unassigned"}</span>
                      <span className="text-[9px]" style={{ color: TEXT.muted }}>Detected: {timeAgo(exc.detectedAt)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {exc.valueAtRisk > 0 && (
                      <>
                        <div className="text-[10px] font-mono font-bold" style={{ color: "#c45a4a" }}>{fmt(exc.valueAtRisk)}</div>
                        <div className="text-[8px]" style={{ color: TEXT.muted }}>at risk</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
