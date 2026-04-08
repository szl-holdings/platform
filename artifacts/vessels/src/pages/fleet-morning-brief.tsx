import { useState } from "react";
import { Sun, AlertTriangle, CheckCircle2, DollarSign, Anchor, Ship, Zap, RefreshCw, ChevronRight } from "lucide-react";

const ACCENT = "hsl(205 70% 50%)";

type BriefItemPriority = "critical" | "high" | "watch" | "opportunity";

interface BriefItem {
  id: string;
  priority: BriefItemPriority;
  headline: string;
  vessel: string;
  what: string;
  evidence: string;
  action: string;
  valueAtRisk: number | null;
  opportunity: boolean;
  category: "exception" | "voyage" | "maintenance" | "commercial" | "compliance";
  confidence: number;
}

const PRIORITY_CONFIG: Record<BriefItemPriority, { color: string; bg: string; border: string; label: string }> = {
  critical: { color: "#ef4444", bg: "#ef444410", border: "#ef444430", label: "Act now" },
  high: { color: "#f97316", bg: "#f9731610", border: "#f9731630", label: "Act today" },
  watch: { color: "#f59e0b", bg: "#f59e0b10", border: "#f59e0b30", label: "Monitor" },
  opportunity: { color: "#22c55e", bg: "#22c55e10", border: "#22c55e30", label: "Opportunity" },
};

const CATEGORY_ICON: Record<string, React.ElementType> = {
  exception: AlertTriangle,
  voyage: Ship,
  maintenance: Anchor,
  commercial: DollarSign,
  compliance: CheckCircle2,
};

const TODAY_DATE = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const BRIEF_ITEMS: BriefItem[] = [
  {
    id: "mb-001",
    priority: "critical",
    headline: "NOVA ATLAS engine inspection overdue — class cert expires in 48h",
    vessel: "MV NOVA ATLAS",
    category: "maintenance",
    what: "Main engine 500h inspection is 180h past window. Class certificate valid to 2026-04-10.",
    evidence: "Last inspection 2026-01-18. Class cert Lloyd's Register expires 2026-04-10. Singapore ETA 3 days.",
    action: "Schedule emergency inspection at Singapore — confirm slot with Lloyd's Register and notify charterer of possible 12h delay.",
    valueAtRisk: 1_240_000,
    opportunity: false,
    confidence: 96,
  },
  {
    id: "mb-002",
    priority: "critical",
    headline: "STELLARIS approaching Singapore — berths at 95% with 16-vessel queue",
    vessel: "CV STELLARIS",
    category: "exception",
    what: "Port of Singapore at 95% occupancy. ETA 14h. Queue at 60% above baseline.",
    evidence: "Port friction memory: avg 9.2h delay. Tides favorable 06:00–09:00 local for anchorage entry.",
    action: "Advise captain to arrive 05:30 local. Pre-file all customs documents immediately via single window.",
    valueAtRisk: 560_000,
    opportunity: false,
    confidence: 82,
  },
  {
    id: "mb-003",
    priority: "high",
    headline: "BOREAL SEA sulphur cert expired — ECA Dover entry in 6h",
    vessel: "MT BOREAL SEA",
    category: "compliance",
    what: "Sulphur compliance certificate expired 2026-04-06. North Sea ECA entry in ~6h.",
    evidence: "MARPOL Annex VI applies Dover Strait. Rotterdam PA can issue emergency cert in 2h.",
    action: "Contact Rotterdam Port Authority for emergency cert. If not achievable, delay ECA entry.",
    valueAtRisk: 380_000,
    opportunity: false,
    confidence: 91,
  },
  {
    id: "mb-004",
    priority: "watch",
    headline: "LNG ARTEMIS — spot rate +18% above TC, opportunity window open",
    vessel: "LNG ARTEMIS",
    category: "commercial",
    what: "LNG spot at $42,000/day vs TC equivalent $35,600/day. ARTEMIS completes voyage April 14.",
    evidence: "Baltic Exchange LNG 5TC: $42,100/day (07 April). Gap: $6,500/day.",
    action: "Evaluate early re-charter release. Ballast to Singapore for spot tender — break-even at ≥14 days re-charter.",
    valueAtRisk: null,
    opportunity: true,
    confidence: 74,
  },
  {
    id: "mb-005",
    priority: "watch",
    headline: "CAPE MERIDIAN BWTS fault — USCG inspection risk at LA in 2 days",
    vessel: "MV CAPE MERIDIAN",
    category: "maintenance",
    what: "BWTS UV lamp failure — bypass mode. LA arrival in 2 days. USCG inspection probability: 68%.",
    evidence: "Chief engineer log 2026-04-04. USCG BWTS inspections up 40% this quarter.",
    action: "Repair UV lamp from spares (18h ETA). File USCG exemption request as backup.",
    valueAtRisk: 220_000,
    opportunity: false,
    confidence: 88,
  },
];

function EvidenceBar({ confidence }: { confidence: number }) {
  const color = confidence >= 90 ? "#22c55e" : confidence >= 75 ? "#f59e0b" : "#f97316";
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-px">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-sm" style={{ background: i < Math.round(confidence / 10) ? color : "rgba(255,255,255,0.06)" }} />
        ))}
      </div>
      <span className="text-[10px] font-mono" style={{ color }}>{confidence}%</span>
    </div>
  );
}

function BriefRow({ item, number, active, onSelect, acknowledged, onAck }: {
  item: BriefItem;
  number: number;
  active: boolean;
  onSelect: () => void;
  acknowledged: boolean;
  onAck: (e: React.MouseEvent) => void;
}) {
  const pc = PRIORITY_CONFIG[item.priority];
  const Icon = CATEGORY_ICON[item.category] ?? AlertTriangle;

  return (
    <button
      onClick={onSelect}
      className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all"
      style={{
        background: active ? `${pc.color}08` : acknowledged ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.02)",
        borderColor: active ? pc.border : "rgba(255,255,255,0.06)",
        opacity: acknowledged && !active ? 0.5 : 1,
      }}
    >
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0" style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.border}` }}>
        {number}
      </div>
      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
        <Icon size={12} style={{ color: item.opportunity ? "#22c55e" : pc.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate" style={{ color: "rgba(255,255,255,0.9)" }}>{item.headline}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>{item.vessel}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.border}` }}>{item.opportunity ? "opportunity" : pc.label}</span>
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-3">
        {item.valueAtRisk && (
          <div className="text-right">
            <div className="text-xs font-bold font-mono" style={{ color: item.opportunity ? "#22c55e" : "#ef4444" }}>
              {item.opportunity ? "+" : "−"}${(item.valueAtRisk / 1000).toFixed(0)}K
            </div>
          </div>
        )}
        <EvidenceBar confidence={item.confidence} />
        {acknowledged ? (
          <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
        ) : (
          <ChevronRight size={13} style={{ color: "rgba(255,255,255,0.2)" }} />
        )}
      </div>
    </button>
  );
}

function DetailPanel({ item, number, acknowledged, onAck }: {
  item: BriefItem;
  number: number;
  acknowledged: boolean;
  onAck: () => void;
}) {
  const pc = PRIORITY_CONFIG[item.priority];
  const Icon = CATEGORY_ICON[item.category] ?? AlertTriangle;

  return (
    <div className="rounded-xl border h-full flex flex-col" style={{ borderColor: pc.border, background: `${pc.color}04` }}>
      <div className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: pc.bg, border: `1px solid ${pc.border}` }}>
            <Icon size={18} style={{ color: item.opportunity ? "#22c55e" : pc.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold" style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.border}` }}>
                {item.opportunity ? "Opportunity" : pc.label}
              </span>
              <span className="text-[9px] capitalize" style={{ color: "rgba(255,255,255,0.3)" }}>{item.category}</span>
            </div>
            <h3 className="text-sm font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.95)" }}>{item.headline}</h3>
            <div className="text-[10px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{item.vessel}</div>
          </div>
          {item.valueAtRisk && (
            <div className="text-right shrink-0">
              <div className="text-base font-bold font-mono" style={{ color: item.opportunity ? "#22c55e" : "#ef4444" }}>
                {item.opportunity ? "+" : "−"}${(item.valueAtRisk / 1000).toFixed(0)}K
              </div>
              <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{item.opportunity ? "upside" : "at risk"}</div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3 flex-1">
        {[
          { label: "What", content: item.what, highlight: false },
          { label: "Evidence", content: item.evidence, highlight: false },
          { label: item.opportunity ? "Action to capture" : "Recommended action", content: item.action, highlight: true },
        ].map(s => (
          <div key={s.label} className="rounded-lg p-3" style={{ background: s.highlight ? (item.opportunity ? "#22c55e08" : "rgba(14,165,233,0.05)") : "rgba(255,255,255,0.03)", border: `1px solid ${s.highlight ? (item.opportunity ? "#22c55e20" : "rgba(14,165,233,0.12)") : "rgba(255,255,255,0.05)"}` }}>
            <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: s.highlight ? (item.opportunity ? "#22c55e60" : "rgba(14,165,233,0.5)") : "rgba(255,255,255,0.25)" }}>{s.label}</div>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{s.content}</p>
          </div>
        ))}
      </div>

      <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <EvidenceBar confidence={item.confidence} />
        {!acknowledged ? (
          <button
            onClick={onAck}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
            style={{ background: pc.bg, color: pc.color, border: `1px solid ${pc.border}` }}
          >
            <CheckCircle2 size={12} />
            Acknowledge
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "#22c55e" }}>
            <CheckCircle2 size={12} />
            Acknowledged
          </div>
        )}
      </div>
    </div>
  );
}

export default function FleetMorningBriefPage() {
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string>(BRIEF_ITEMS[0].id);
  const generated = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const selectedItem = BRIEF_ITEMS.find(i => i.id === selectedId) ?? BRIEF_ITEMS[0];
  const selectedIndex = BRIEF_ITEMS.findIndex(i => i.id === selectedId);

  return (
    <div className="p-5 max-w-6xl mx-auto h-full flex flex-col gap-4">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Sun size={18} style={{ color: "#f59e0b" }} />
          <div>
            <h1 className="text-base font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>Fleet Morning Brief</h1>
            <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{TODAY_DATE} · Generated {generated}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-mono px-3 py-1.5 rounded-full flex items-center gap-1.5" style={{ background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.12)", color: "rgba(14,165,233,0.6)" }}>
            <Zap size={10} />
            {BRIEF_ITEMS.length} items
          </div>
          <div className="text-[10px] font-mono px-2 py-1.5 rounded-lg flex items-center gap-1.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
            <RefreshCw size={10} />
            Refreshes 05:00 UTC
          </div>
        </div>
      </div>

      <div className="rounded-xl border px-4 py-3 flex items-start gap-3 shrink-0" style={{ background: "rgba(14,165,233,0.04)", borderColor: "rgba(14,165,233,0.12)" }}>
        <Zap size={14} style={{ color: "rgba(14,165,233,0.8)", flexShrink: 0, marginTop: 1 }} />
        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
          <strong style={{ color: "rgba(255,255,255,0.9)" }}>Today: </strong>
          Two critical compliance exposures (NOVA ATLAS engine cert + BOREAL SEA sulphur) require action before 14:00 UTC or risk vessel detention.
          STELLARIS approaches Singapore into congestion — recoverable with 06:00 tide window.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
        <div className="col-span-5 flex flex-col gap-2 overflow-y-auto">
          {BRIEF_ITEMS.map((item, i) => (
            <BriefRow
              key={item.id}
              item={item}
              number={i + 1}
              active={selectedId === item.id}
              onSelect={() => setSelectedId(item.id)}
              acknowledged={acknowledged.has(item.id)}
              onAck={(e) => { e.stopPropagation(); setAcknowledged(prev => new Set([...prev, item.id])); }}
            />
          ))}

          {acknowledged.size === BRIEF_ITEMS.length && (
            <div className="rounded-xl border p-4 text-center" style={{ background: "#22c55e08", borderColor: "#22c55e30" }}>
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2" style={{ color: "#22c55e" }} />
              <p className="text-xs font-semibold" style={{ color: "#22c55e" }}>All items acknowledged</p>
              <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Next brief at 05:00 UTC tomorrow.</p>
            </div>
          )}
        </div>

        <div className="col-span-7">
          <DetailPanel
            item={selectedItem}
            number={selectedIndex + 1}
            acknowledged={acknowledged.has(selectedItem.id)}
            onAck={() => setAcknowledged(prev => new Set([...prev, selectedItem.id]))}
          />
        </div>
      </div>
    </div>
  );
}
