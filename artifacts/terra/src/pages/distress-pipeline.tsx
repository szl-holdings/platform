import { useState } from "react";
import { TrendingDown, Search, CheckCircle } from "lucide-react";

const ACCENT = "#c8a060";
const BG = { page: "#060a07", surface: "#0a0e08", elevated: "#0e1209" } as const;
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.08)" } as const;
const TEXT = {
  primary: "rgba(255,255,255,0.88)",
  secondary: "rgba(255,255,255,0.55)",
  tertiary: "rgba(255,255,255,0.28)",
  muted: "rgba(255,255,255,0.14)",
} as const;

type DistressCategory = "foreclosure" | "delinquent" | "vacant" | "tax_lien" | "pre_market";
type PropertyClass = "A" | "B" | "C" | "D";
type PipelineStage = "identified" | "screening" | "diligence" | "offer" | "under_contract" | "closed";

interface DistressedProperty {
  id: string;
  address: string;
  borough: string;
  class: PropertyClass;
  distressCategory: DistressCategory;
  stage: PipelineStage;
  distressScore: number;
  estimatedValue: number;
  distressDiscount: number;
  debtBalance: number;
  occupancy: number;
  units: number;
  daysInDistress: number;
  owner: string;
  nextAction: string;
  actionDue: string;
  assignedTo: string;
  notes: string;
}

const CATEGORY_CONFIG: Record<DistressCategory, { label: string; color: string; bg: string }> = {
  foreclosure: { label: "Foreclosure", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  delinquent: { label: "Delinquent", color: "#f97316", bg: "rgba(249,115,22,0.1)" },
  vacant: { label: "Vacant", color: "#eab308", bg: "rgba(234,179,8,0.1)" },
  tax_lien: { label: "Tax Lien", color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  pre_market: { label: "Pre-Market", color: ACCENT, bg: `${ACCENT}18` },
};

const STAGE_CONFIG: Record<PipelineStage, { label: string; color: string; step: number }> = {
  identified: { label: "Identified", color: TEXT.tertiary, step: 1 },
  screening: { label: "Screening", color: "#7ba3d4", step: 2 },
  diligence: { label: "Diligence", color: ACCENT, step: 3 },
  offer: { label: "Offer Sent", color: "#a78bfa", step: 4 },
  under_contract: { label: "Under Contract", color: "#22c55e", step: 5 },
  closed: { label: "Closed", color: "#22c55e", step: 6 },
};

const PIPELINE_PROPERTIES: DistressedProperty[] = [
  {
    id: "dp-001", address: "247 W 116th St", borough: "Manhattan", class: "B", distressCategory: "foreclosure",
    stage: "diligence", distressScore: 91, estimatedValue: 4200000, distressDiscount: 32, debtBalance: 3100000,
    occupancy: 42, units: 18, daysInDistress: 284, owner: "116th Realty LLC",
    nextAction: "Review title search and foreclosure filing", actionDue: "Apr 8", assignedTo: "R. Martinez",
    notes: "Lis pendens filed Oct 2024. Owner unresponsive. Strong candidate for pre-foreclosure outreach.",
  },
  {
    id: "dp-002", address: "854 Lincoln Ave", borough: "Bronx", class: "C", distressCategory: "tax_lien",
    stage: "offer", distressScore: 78, estimatedValue: 1800000, distressDiscount: 24, debtBalance: 980000,
    occupancy: 58, units: 12, daysInDistress: 142, owner: "Lincoln Holdings Trust",
    nextAction: "Counter-offer response due from owner", actionDue: "Apr 7", assignedTo: "K. Patel",
    notes: "Tax arrears of $180k. Owner open to discussion. Offer submitted at 71% of AVM.",
  },
  {
    id: "dp-003", address: "1920 Flatbush Ave", borough: "Brooklyn", class: "B", distressCategory: "delinquent",
    stage: "screening", distressScore: 67, estimatedValue: 5600000, distressDiscount: 18, debtBalance: 4100000,
    occupancy: 71, units: 24, daysInDistress: 89, owner: "Flatbush Partners LLC",
    nextAction: "Order third-party appraisal", actionDue: "Apr 12", assignedTo: "R. Martinez",
    notes: "3 months delinquent on note. Lender has not accelerated yet. Good entry point.",
  },
  {
    id: "dp-004", address: "73 Macon St", borough: "Brooklyn", class: "D", distressCategory: "vacant",
    stage: "identified", distressScore: 83, estimatedValue: 890000, distressDiscount: 38, debtBalance: 0,
    occupancy: 0, units: 6, daysInDistress: 387, owner: "Estate of R. Johnson",
    nextAction: "Locate heir/administrator contact", actionDue: "Apr 15", assignedTo: "S. Osei",
    notes: "Probate matter. Vacant 13 months. HPD violations outstanding. Significant value recovery possible.",
  },
  {
    id: "dp-005", address: "412 Junction Blvd", borough: "Queens", class: "B", distressCategory: "pre_market",
    stage: "under_contract", distressScore: 54, estimatedValue: 3100000, distressDiscount: 14, debtBalance: 2200000,
    occupancy: 82, units: 20, daysInDistress: 58, owner: "Junction Capital Group",
    nextAction: "Final walk-through scheduled", actionDue: "Apr 6", assignedTo: "K. Patel",
    notes: "Owner motivated by partnership dispute. Off-market exclusive. Closing set Apr 22.",
  },
];

type SortField = "distressScore" | "distressDiscount" | "estimatedValue" | "daysInDistress";

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function PropertyRow({ property, selected, onClick }: { property: DistressedProperty; selected: boolean; onClick: () => void }) {
  const cat = CATEGORY_CONFIG[property.distressCategory];
  const stage = STAGE_CONFIG[property.stage];
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 transition-all hover:bg-white/[0.02]"
      style={{
        borderBottom: `1px solid ${BORDER.subtle}`,
        background: selected ? `${ACCENT}08` : undefined,
        borderLeft: selected ? `2px solid ${ACCENT}` : "2px solid transparent",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold truncate mb-0.5" style={{ color: TEXT.primary }}>{property.address}</p>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px]" style={{ color: TEXT.tertiary }}>{property.borough} · Class {property.class} · {property.units}u</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full px-1.5 py-0.5 text-[9px] font-medium" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
            <span className="text-[10px]" style={{ color: stage.color }}>{stage.label}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[13px] font-bold font-mono mb-0.5" style={{ color: ACCENT }}>{property.distressScore}</p>
          <p className="text-[9px]" style={{ color: TEXT.muted }}>distress score</p>
          <p className="text-[10px] font-mono mt-1" style={{ color: "#22c55e" }}>-{property.distressDiscount}%</p>
        </div>
      </div>
    </button>
  );
}

interface PropertyDetailProps { property: DistressedProperty }

function PropertyDetail({ property }: PropertyDetailProps) {
  const cat = CATEGORY_CONFIG[property.distressCategory];
  const stage = STAGE_CONFIG[property.stage];
  const stages = Object.values(STAGE_CONFIG).sort((a, b) => a.step - b.step);

  return (
    <div className="h-full overflow-y-auto" style={{ background: BG.surface }}>
      <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
              <span className="text-[10px]" style={{ color: stage.color }}>{stage.label}</span>
            </div>
            <p className="text-[14px] font-semibold mb-0.5" style={{ color: TEXT.primary }}>{property.address}</p>
            <p className="text-[11px]" style={{ color: TEXT.tertiary }}>{property.borough} · Class {property.class} · {property.units} units · {property.owner}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[22px] font-bold font-mono" style={{ color: property.distressScore > 75 ? "#ef4444" : property.distressScore > 50 ? "#f97316" : ACCENT }}>{property.distressScore}</p>
            <p className="text-[10px]" style={{ color: TEXT.muted }}>distress score</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {stages.slice(0, 5).map((s, i) => (
            <div key={s.label} className="flex-1 flex items-center gap-1">
              <div className="flex-1 h-1 rounded-full" style={{ background: STAGE_CONFIG[property.stage].step >= s.step ? ACCENT : BORDER.muted }} />
              {i < 4 && <div className="w-1 h-1 rounded-full" style={{ background: STAGE_CONFIG[property.stage].step >= s.step ? ACCENT : BORDER.muted }} />}
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: "Estimated Value", value: formatCurrency(property.estimatedValue), color: TEXT.secondary },
            { label: "Distress Discount", value: `-${property.distressDiscount}%`, color: "#22c55e" },
            { label: "Debt Balance", value: formatCurrency(property.debtBalance), color: TEXT.secondary },
            { label: "Occupancy", value: `${property.occupancy}%`, color: property.occupancy < 50 ? "#ef4444" : TEXT.secondary },
            { label: "Days in Distress", value: String(property.daysInDistress), color: property.daysInDistress > 180 ? "#ef4444" : TEXT.secondary },
            { label: "Units", value: String(property.units), color: TEXT.secondary },
          ].map((m) => (
            <div key={m.label} className="rounded-md px-3 py-2.5" style={{ background: BG.elevated }}>
              <p className="text-[10px] mb-1" style={{ color: TEXT.muted }}>{m.label}</p>
              <p className="text-[13px] font-semibold font-mono" style={{ color: m.color }}>{m.value}</p>
            </div>
          ))}
        </div>

        <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: TEXT.muted }}>Next Action</p>
        <div className="rounded-md px-4 py-3 mb-4" style={{ background: `${ACCENT}08`, border: `1px solid ${ACCENT}20` }}>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: ACCENT }} />
            <div>
              <p className="text-[12px] font-medium mb-0.5" style={{ color: TEXT.primary }}>{property.nextAction}</p>
              <p className="text-[10px]" style={{ color: TEXT.tertiary }}>Due: {property.actionDue} · Assigned: {property.assignedTo}</p>
            </div>
          </div>
        </div>

        <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: TEXT.muted }}>Intelligence Notes</p>
        <div className="rounded-md px-4 py-3" style={{ background: BG.elevated }}>
          <p className="text-[11px] leading-relaxed" style={{ color: TEXT.secondary }}>{property.notes}</p>
        </div>
      </div>
    </div>
  );
}

export default function DistressPipelinePage() {
  const [selected, setSelected] = useState<string>("dp-001");
  const [search, setSearch] = useState("");
  const [sortBy] = useState<SortField>("distressScore");

  const selectedProperty = PIPELINE_PROPERTIES.find((p) => p.id === selected);
  const filtered = PIPELINE_PROPERTIES
    .filter((p) => search === "" || p.address.toLowerCase().includes(search.toLowerCase()) || p.borough.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const totalValue = PIPELINE_PROPERTIES.reduce((s, p) => s + p.estimatedValue, 0);
  const avgDiscount = Math.round(PIPELINE_PROPERTIES.reduce((s, p) => s + p.distressDiscount, 0) / PIPELINE_PROPERTIES.length);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: BG.page }}>
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-center gap-2.5">
          <TrendingDown className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="text-[13px] font-semibold" style={{ color: TEXT.primary }}>Distress Pipeline</span>
          <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: `${ACCENT}18`, color: ACCENT }}>
            {PIPELINE_PROPERTIES.length} active
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: TEXT.muted }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties…"
            className="rounded-lg pl-8 pr-3 py-1.5 text-[11px] outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER.muted}`, color: TEXT.primary, width: 160 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-px shrink-0" style={{ background: BORDER.subtle }}>
        {[
          { label: "Pipeline value", value: formatCurrency(totalValue), color: ACCENT },
          { label: "Avg. discount", value: `-${avgDiscount}%`, color: "#22c55e" },
          { label: "In diligence+", value: String(PIPELINE_PROPERTIES.filter((p) => ["diligence", "offer", "under_contract"].includes(p.stage)).length), color: "#7ba3d4" },
          { label: "High-risk (score > 75)", value: String(PIPELINE_PROPERTIES.filter((p) => p.distressScore > 75).length), color: "#ef4444" },
        ].map((s) => (
          <div key={s.label} className="px-4 py-3" style={{ background: BG.page }}>
            <p className="text-[10px] mb-1" style={{ color: TEXT.muted }}>{s.label}</p>
            <p className="text-[20px] font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-[300px_1fr] overflow-hidden">
        <div className="overflow-y-auto" style={{ borderRight: `1px solid ${BORDER.subtle}` }}>
          <div className="px-4 py-2" style={{ borderBottom: `1px solid ${BORDER.subtle}`, background: BG.elevated }}>
            <p className="text-[10px]" style={{ color: TEXT.muted }}>{filtered.length} properties · sorted by distress score</p>
          </div>
          {filtered.map((property) => (
            <PropertyRow
              key={property.id}
              property={property}
              selected={selected === property.id}
              onClick={() => setSelected(property.id)}
            />
          ))}
        </div>
        {selectedProperty && <PropertyDetail property={selectedProperty} />}
      </div>
    </div>
  );
}
