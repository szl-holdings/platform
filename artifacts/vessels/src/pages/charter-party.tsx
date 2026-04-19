import { useState } from "react";
import { FileText, Plus, Clock, CheckCircle2, AlertTriangle, DollarSign, Calendar, Ship, ChevronDown, ChevronUp, Sparkles, Brain, Filter } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { EmptyState } from "@szl-holdings/shared-ui/EmptyState";

type FixtureStatus = "draft" | "negotiated" | "fixed" | "performing" | "completed";

const STATUS_CONFIG: Record<FixtureStatus, { label: string; color: string; step: number }> = {
  draft:       { label: "Draft",      color: "text-sky-400/50 bg-sky-500/5 border-sky-500/10",       step: 1 },
  negotiated:  { label: "Negotiated", color: "text-amber-400 bg-amber-500/10 border-amber-500/20",   step: 2 },
  fixed:       { label: "Fixed",      color: "text-sky-400 bg-sky-500/10 border-sky-500/20",         step: 3 },
  performing:  { label: "Performing", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", step: 4 },
  completed:   { label: "Completed",  color: "text-sky-300 bg-sky-500/5 border-sky-500/10",          step: 5 },
};

interface Fixture {
  id: string;
  ref: string;
  type: "voyage" | "time";
  vessel: string;
  imo: string;
  charterer: string;
  owner: string;
  status: FixtureStatus;
  cargo: string;
  loadPort: string;
  dischargePort: string;
  laycanFrom: string;
  laycanTo: string;
  freightRate: number;
  freightUnit: string;
  quantity: number;
  demurrageRate: number;
  despatchRate: number;
  aiRiskScore: number;
  aiFlags: string[];
  clauses: { clause: string; risk: "low" | "medium" | "high"; note: string }[];
}

const FIXTURES: Fixture[] = [
  {
    id: "CP-001", ref: "SZL-VOY-2026-0142", type: "voyage",
    vessel: "Pacific Navigator", imo: "9234567",
    charterer: "Trafigura Pte Ltd", owner: "SZL Maritime Holdings",
    status: "performing",
    cargo: "Iron Ore (65,000 MT ±10%)", loadPort: "Port Hedland, AUS", dischargePort: "Zhoushan, CHN",
    laycanFrom: "2026-04-18", laycanTo: "2026-04-22",
    freightRate: 12.4, freightUnit: "USD/MT", quantity: 65000,
    demurrageRate: 18500, despatchRate: 9250,
    aiRiskScore: 28,
    aiFlags: ["Laycan window tight — 4 days", "Demurrage clause favours charterer"],
    clauses: [
      { clause: "ASBATANKVOY demurrage clause", risk: "medium", note: "Rate $18,500/day — slightly above Baltic C5 benchmark" },
      { clause: "Force majeure — weather", risk: "low", note: "Standard wording, no unusual carve-outs" },
      { clause: "BIMCO ISPS clause", risk: "low", note: "Compliant with standard ISPS wording" },
    ],
  },
  {
    id: "CP-002", ref: "SZL-TC-2026-0089", type: "time",
    vessel: "Arctic Breeze", imo: "9876543",
    charterer: "Vitol Group", owner: "SZL Maritime Holdings",
    status: "fixed",
    cargo: "N/A — Time Charter", loadPort: "Rotterdam, NL", dischargePort: "Various",
    laycanFrom: "2026-05-01", laycanTo: "2026-05-05",
    freightRate: 32500, freightUnit: "USD/day", quantity: 0,
    demurrageRate: 0, despatchRate: 0,
    aiRiskScore: 14,
    aiFlags: ["Hire rate 4.2% above VLCC benchmark — favourable"],
    clauses: [
      { clause: "NYPE 2015 — Maintenance obligations", risk: "low", note: "Owner maintains class — standard" },
      { clause: "Off-hire clause — extended drydock", risk: "high", note: "Charterer can off-hire if drydock exceeds 30 days — unusual" },
      { clause: "Trading limit clause", risk: "low", note: "Worldwide trading excluding sanctioned zones" },
    ],
  },
  {
    id: "CP-003", ref: "SZL-VOY-2026-0161", type: "voyage",
    vessel: "Cape Resolute", imo: "9123456",
    charterer: "Cargill Ocean Transportation", owner: "SZL Maritime Holdings",
    status: "negotiated",
    cargo: "Wheat (45,000 MT)", loadPort: "Novorossiysk, RU", dischargePort: "Alexandria, EG",
    laycanFrom: "2026-05-10", laycanTo: "2026-05-17",
    freightRate: 28.5, freightUnit: "USD/MT", quantity: 45000,
    demurrageRate: 14000, despatchRate: 7000,
    aiRiskScore: 67,
    aiFlags: ["Russian port — sanctions risk elevated", "Black Sea war risk clause required", "Cargo insurance verification outstanding"],
    clauses: [
      { clause: "War risk / Black Sea additional premium", risk: "high", note: "Current Novorossiysk war risk premium: ~0.85% — not yet agreed" },
      { clause: "Sanctions compliance clause", risk: "high", note: "BIMCO SANCTCL24 clause recommended — not included in draft" },
      { clause: "NOR tendering", risk: "medium", note: "NOR tendering WIBON WIFPON — standard for Black Sea" },
    ],
  },
  {
    id: "CP-004", ref: "SZL-VOY-2026-0098", type: "voyage",
    vessel: "Meridian Bulk", imo: "9456789",
    charterer: "Louis Dreyfus Company", owner: "SZL Maritime Holdings",
    status: "completed",
    cargo: "Soybean (55,000 MT ±5%)", loadPort: "Santos, BRA", dischargePort: "Ningbo, CHN",
    laycanFrom: "2026-02-14", laycanTo: "2026-02-18",
    freightRate: 31.2, freightUnit: "USD/MT", quantity: 55000,
    demurrageRate: 15500, despatchRate: 7750,
    aiRiskScore: 11,
    aiFlags: [],
    clauses: [
      { clause: "Laytime calculation — SHINC", risk: "low", note: "Sundays & holidays included — standard for Brazil" },
      { clause: "Draft restrictions Santos", risk: "low", note: "11.8m draft limit agreed — vessel compliant" },
    ],
  },
];

const clauseRiskColor: Record<string, string> = {
  high: "text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

function LifecyclePipeline({ status }: { status: FixtureStatus }) {
  const steps: FixtureStatus[] = ["draft", "negotiated", "fixed", "performing", "completed"];
  const currentStep = STATUS_CONFIG[status].step;
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => {
        const cfg = STATUS_CONFIG[s];
        const active = cfg.step <= currentStep;
        const isCurrent = s === status;
        return (
          <div key={s} className="flex items-center">
            <div className={cn("px-2 py-0.5 text-[9px] font-medium rounded transition-all",
              isCurrent ? "bg-sky-500/20 text-sky-300 border border-sky-500/30" :
              active ? "text-sky-400/60 border border-sky-500/10 bg-sky-500/5" :
              "text-sky-400/20 border border-sky-500/5")}>
              {cfg.label}
            </div>
            {i < steps.length - 1 && (
              <div className={cn("w-3 h-px mx-0.5", active ? "bg-sky-500/30" : "bg-sky-500/10")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FixtureCard({ fixture }: { fixture: Fixture }) {
  const [expanded, setExpanded] = useState(false);
  const totalValue = fixture.type === "voyage"
    ? fixture.freightRate * fixture.quantity
    : fixture.freightRate * 30;

  return (
    <div className={cn("bg-[#0a1628]/80 border rounded-xl overflow-hidden transition-all",
      fixture.aiRiskScore >= 60 ? "border-red-500/20" :
      fixture.aiRiskScore >= 30 ? "border-amber-500/20" :
      "border-sky-500/10")}>
      <button className="w-full text-left px-4 py-4" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-sm font-bold text-sky-100">{fixture.ref}</span>
              <Badge variant="outline" className={cn("text-[9px]", STATUS_CONFIG[fixture.status].color)}>
                {STATUS_CONFIG[fixture.status].label}
              </Badge>
              <Badge variant="outline" className="text-[9px] text-sky-400/50 border-sky-500/10">
                {fixture.type === "voyage" ? "Voyage Charter" : "Time Charter"}
              </Badge>
            </div>
            <p className="text-xs text-sky-300 font-medium">{fixture.vessel}</p>
            <p className="text-[10px] text-sky-400/50 mt-0.5">{fixture.charterer} · {fixture.loadPort} → {fixture.dischargePort}</p>
            <div className="mt-2">
              <LifecyclePipeline status={fixture.status} />
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold font-mono text-emerald-400">
              ${(totalValue / 1000).toFixed(0)}K
            </p>
            <p className="text-[9px] text-sky-400/40">est. value</p>
            <div className={cn("text-[10px] font-mono mt-1",
              fixture.aiRiskScore >= 60 ? "text-red-400" :
              fixture.aiRiskScore >= 30 ? "text-amber-400" :
              "text-emerald-400")}>
              AI Risk: {fixture.aiRiskScore}
            </div>
            {expanded
              ? <ChevronUp className="w-3.5 h-3.5 text-sky-400/30 mt-1 ml-auto" />
              : <ChevronDown className="w-3.5 h-3.5 text-sky-400/30 mt-1 ml-auto" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-sky-500/10 pt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Laycan Open", value: fixture.laycanFrom, icon: Calendar, color: "text-sky-300" },
              { label: "Laycan Close", value: fixture.laycanTo, icon: Calendar, color: "text-sky-300" },
              { label: fixture.type === "voyage" ? "Freight Rate" : "Hire Rate",
                value: `$${fixture.freightRate.toLocaleString()} ${fixture.freightUnit}`,
                icon: DollarSign, color: "text-emerald-400" },
              { label: "Demurrage Rate", value: fixture.demurrageRate > 0 ? `$${fixture.demurrageRate.toLocaleString()}/day` : "N/A (TC)", icon: Clock, color: "text-orange-400" },
            ].map(f => (
              <div key={f.label} className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10">
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">{f.label}</p>
                <p className={cn("text-xs font-mono font-bold mt-0.5", f.color)}>{f.value}</p>
              </div>
            ))}
          </div>

          {fixture.aiFlags.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">AI Clause Intelligence</span>
              </div>
              <div className="space-y-1">
                {fixture.aiFlags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-300/80">{flag}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-2">Clause Risk Analysis</p>
            <div className="space-y-2">
              {fixture.clauses.map((c, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-sky-500/3 rounded-lg border border-sky-500/8">
                  <Badge variant="outline" className={cn("text-[9px] shrink-0 mt-0.5", clauseRiskColor[c.risk])}>
                    {c.risk}
                  </Badge>
                  <div>
                    <p className="text-xs font-medium text-sky-200">{c.clause}</p>
                    <p className="text-[10px] text-sky-400/50 mt-0.5">{c.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CharterPartyPage() {
  const [statusFilter, setStatusFilter] = useState<FixtureStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "voyage" | "time">("all");

  const filtered = FIXTURES.filter(f =>
    (statusFilter === "all" || f.status === statusFilter) &&
    (typeFilter === "all" || f.type === typeFilter)
  );

  const stats = {
    total: FIXTURES.length,
    active: FIXTURES.filter(f => ["fixed", "performing"].includes(f.status)).length,
    highRisk: FIXTURES.filter(f => f.aiRiskScore >= 50).length,
    totalValue: FIXTURES.reduce((a, f) => a + (f.type === "voyage" ? f.freightRate * f.quantity : f.freightRate * 30), 0),
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-sky-50 flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            Charter Party Manager
          </h1>
          <p className="text-xs text-sky-400/50 mt-0.5">Create, negotiate and track charter fixtures with Governed clause risk analysis</p>
        </div>
        <button className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 hover:bg-sky-500/15 transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Fixture
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Fixtures", value: stats.total, color: "text-sky-300", icon: FileText },
          { label: "Active (Fixed/Performing)", value: stats.active, color: "text-emerald-400", icon: CheckCircle2 },
          { label: "High AI Risk", value: stats.highRisk, color: "text-red-400", icon: AlertTriangle },
          { label: "Portfolio Value", value: `$${(stats.totalValue / 1e6).toFixed(1)}M`, color: "text-emerald-400", icon: DollarSign },
        ].map(s => (
          <div key={s.label} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={cn("w-3.5 h-3.5", s.color)} />
              <p className="text-[10px] text-sky-400/40 uppercase tracking-wider">{s.label}</p>
            </div>
            <p className={cn("text-xl font-bold font-display", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          {(["all", "draft", "negotiated", "fixed", "performing", "completed"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn("text-[10px] px-2.5 py-1.5 rounded-lg border capitalize transition-all",
                statusFilter === s ? "bg-sky-500/10 border-sky-500/30 text-sky-300" : "border-sky-500/10 text-sky-400/40 hover:text-sky-300")}>
              {s === "all" ? `All (${stats.total})` : STATUS_CONFIG[s as FixtureStatus]?.label ?? s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          {(["all", "voyage", "time"] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={cn("text-[10px] px-2.5 py-1.5 rounded-lg border capitalize transition-all",
                typeFilter === t ? "bg-sky-500/10 border-sky-500/30 text-sky-300" : "border-sky-500/10 text-sky-400/40 hover:text-sky-300")}>
              {t === "all" ? "All Types" : t === "voyage" ? "Voyage" : "Time Charter"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          stats.total === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              headline="No charter fixtures on the books"
              description="The fixture book is clear — start a new fixture to begin negotiations."
              accentColor="#10b981"
            />
          ) : (
            <EmptyState
              icon={Filter}
              headline="No fixtures match these filters"
              description="Adjust the status or charter-type filters to expand the fixture list."
              accentColor="#38bdf8"
              action={{ label: "Reset filters", onClick: () => { setStatusFilter("all"); setTypeFilter("all"); } }}
            />
          )
        ) : filtered.map(f => <FixtureCard key={f.id} fixture={f} />)}
      </div>
    </div>
  );
}
