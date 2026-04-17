import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hammer, Calendar, DollarSign, AlertTriangle, CheckCircle, Clock, Camera,
  TrendingUp, Building2, ChevronRight, BarChart3, ArrowUpRight, Activity, X, Database
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@szl-holdings/shared-ui/utils";

interface TooltipPayloadEntry { name: string; value: number; color?: string; fill?: string; }
interface ChartTooltipProps { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string; }

const DS = {
  surface: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.05)",
  accent: { gold: "#b8943c", blue: "#3a7ad4", green: "#40856a", red: "#c0503a" },
  text: { primary: "rgba(255,255,255,0.85)", secondary: "rgba(255,255,255,0.5)", tertiary: "rgba(255,255,255,0.3)", muted: "rgba(255,255,255,0.18)" },
};

const fmt = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n.toLocaleString()}`;

interface Milestone {
  id: string;
  label: string;
  target: string;
  actual?: string;
  status: "complete" | "in-progress" | "upcoming" | "delayed";
  pctComplete: number;
  notes?: string;
}

interface BudgetLine {
  category: string;
  budget: number;
  spent: number;
  variance: number;
}

interface PhotoUpdate {
  date: string;
  caption: string;
  area: string;
  author: string;
}

interface Project {
  id: string;
  name: string;
  address: string;
  type: string;
  totalBudget: number;
  totalSpent: number;
  overallPct: number;
  startDate: string;
  projectedCompletion: string;
  revisedCompletion?: string;
  status: "on-track" | "behind" | "at-risk" | "complete";
  gc: string;
  architect: string;
  milestones: Milestone[];
  budgetLines: BudgetLine[];
  photos: PhotoUpdate[];
}

const PROJECTS: Project[] = [
  {
    id: "cm-001",
    name: "The Arbor — Tower A",
    address: "400 Congress Ave, Austin, TX 78701",
    type: "Mixed-Use Ground-Up",
    totalBudget: 48_600_000,
    totalSpent: 31_200_000,
    overallPct: 64,
    startDate: "2024-06-01",
    projectedCompletion: "2026-09-30",
    revisedCompletion: "2026-11-15",
    status: "at-risk",
    gc: "Turner Construction Co.",
    architect: "Gensler Austin",
    milestones: [
      { id: "m1", label: "Site Demolition & Preparation", target: "2024-08-01", actual: "2024-07-28", status: "complete", pctComplete: 100 },
      { id: "m2", label: "Foundation & Structural Steel (L1–L8)", target: "2025-01-15", actual: "2025-01-20", status: "complete", pctComplete: 100, notes: "5-day delay due to weather; recovered through extended shifts" },
      { id: "m3", label: "Concrete Deck (L9–L22)", target: "2025-06-01", actual: "2025-07-14", status: "complete", pctComplete: 100, notes: "Concrete supplier change added 43 days; cost impact $480K" },
      { id: "m4", label: "MEP Rough-In & Envelope Enclosure", target: "2025-10-01", status: "in-progress", pctComplete: 78, notes: "HVAC ductwork on L18–L22 awaiting delivery" },
      { id: "m5", label: "Interior Framing & Drywall", target: "2026-02-01", status: "in-progress", pctComplete: 22 },
      { id: "m6", label: "Fit-Out & Tenant Work", target: "2026-06-01", status: "upcoming", pctComplete: 0 },
      { id: "m7", label: "Certificate of Occupancy", target: "2026-09-30", status: "upcoming", pctComplete: 0 },
    ],
    budgetLines: [
      { category: "Hard Costs — Structural", budget: 14_200_000, spent: 14_700_000, variance: -500_000 },
      { category: "Hard Costs — MEP", budget: 9_800_000, spent: 7_200_000, variance: 2_600_000 },
      { category: "Hard Costs — Envelope", budget: 6_400_000, spent: 5_100_000, variance: 1_300_000 },
      { category: "Hard Costs — Interior", budget: 8_200_000, spent: 2_100_000, variance: 6_100_000 },
      { category: "Soft Costs", budget: 7_400_000, spent: 6_900_000, variance: 500_000 },
      { category: "Contingency", budget: 2_600_000, spent: 1_200_000, variance: 1_400_000 },
    ],
    photos: [
      { date: "2026-04-08", caption: "MEP rough-in progress on floors 18–22; HVAC main trunk installation 80% complete", area: "Floors 18–22", author: "Site Superintendent R. Castillo" },
      { date: "2026-03-22", caption: "Interior framing complete on floors 4–12; drywall hanging underway", area: "Floors 4–12", author: "QC Inspector T. Nakamura" },
      { date: "2026-02-14", caption: "Curtainwall glass installation complete floors 1–18; Level 19+ ongoing", area: "Building Exterior", author: "Project Manager A. Singh" },
    ],
  },
  {
    id: "cm-002",
    name: "Pacific Heights Renovation",
    address: "2850 Broadway, San Francisco, CA 94115",
    type: "Residential Renovation",
    totalBudget: 4_200_000,
    totalSpent: 3_780_000,
    overallPct: 90,
    startDate: "2025-07-01",
    projectedCompletion: "2026-06-30",
    status: "on-track",
    gc: "Bay Area Renovations Inc.",
    architect: "CCA Architecture",
    milestones: [
      { id: "m1", label: "Structural Assessment & Remediation", target: "2025-09-01", actual: "2025-08-28", status: "complete", pctComplete: 100 },
      { id: "m2", label: "Kitchen & Bath Renovation (Units 1–12)", target: "2025-12-01", actual: "2025-11-30", status: "complete", pctComplete: 100 },
      { id: "m3", label: "Common Area Upgrades", target: "2026-02-28", actual: "2026-03-05", status: "complete", pctComplete: 100 },
      { id: "m4", label: "Rooftop Deck & Amenity Install", target: "2026-05-01", status: "in-progress", pctComplete: 65 },
      { id: "m5", label: "Final Punchlist & CO", target: "2026-06-30", status: "upcoming", pctComplete: 0 },
    ],
    budgetLines: [
      { category: "Structural", budget: 820_000, spent: 808_000, variance: 12_000 },
      { category: "Kitchen & Bath", budget: 1_400_000, spent: 1_380_000, variance: 20_000 },
      { category: "Common Areas", budget: 680_000, spent: 695_000, variance: -15_000 },
      { category: "Rooftop & Amenities", budget: 900_000, spent: 680_000, variance: 220_000 },
      { category: "Soft Costs & FF&E", budget: 400_000, spent: 217_000, variance: 183_000 },
    ],
    photos: [
      { date: "2026-04-05", caption: "Rooftop deck framing 65% complete; steel pergola structure installed", area: "Rooftop Level", author: "Project Manager D. Chen" },
      { date: "2026-03-10", caption: "Lobby renovation complete — new concierge desk, lighting, flooring", area: "Lobby / Ground Floor", author: "Interior Designer K. Walsh" },
    ],
  },
];

const MILESTONE_COLORS = {
  complete: DS.accent.green,
  "in-progress": DS.accent.blue,
  upcoming: DS.text.muted,
  delayed: DS.accent.red,
};

const STATUS_CONFIG = {
  "on-track": { color: DS.accent.green, label: "On Track" },
  "behind": { color: DS.accent.gold, label: "Behind Schedule" },
  "at-risk": { color: DS.accent.red, label: "At Risk" },
  "complete": { color: DS.text.muted, label: "Complete" },
};

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-2 text-xs shadow-xl" style={{ background: "rgba(10,12,16,0.97)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <p className="font-semibold text-white/80 mb-1">{label}</p>
      {payload.map((p) => <div key={p.name} className="flex gap-2"><span style={{ color: p.fill ?? p.color }}>{p.name}:</span><span className="text-white/70">{fmt(p.value)}</span></div>)}
    </div>
  );
};

export default function ConstructionMonitorPage() {
  const queryClient = useQueryClient();

  const { data: apiData, isLoading, isError } = useQuery({
    queryKey: ["terra-construction-projects"],
    queryFn: () => api.construction.list(),
    staleTime: 30_000,
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      for (const p of PROJECTS) {
        await api.construction.create({
          name: p.name, address: p.address, type: p.type,
          totalBudget: p.totalBudget, totalSpent: p.totalSpent, overallPct: p.overallPct,
          startDate: p.startDate, projectedCompletion: p.projectedCompletion, revisedCompletion: p.revisedCompletion,
          status: p.status, gc: p.gc, architect: p.architect,
          milestones: p.milestones as Array<Record<string, unknown>>,
          budgetLines: p.budgetLines as Array<Record<string, unknown>>,
          photos: p.photos as Array<Record<string, unknown>>,
          isDemo: true,
        });
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["terra-construction-projects"] }); },
  });

  const isLive = !isLoading && !isError && apiData && apiData.dataMode === "live";
  const projects: Project[] = isLive ? (apiData.projects as unknown as Project[]) : PROJECTS;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [photoModal, setPhotoModal] = useState<PhotoUpdate | null>(null);

  const effectiveId = selectedId ?? projects[0]?.id;
  const proj = projects.find(p => p.id === effectiveId) ?? projects[0];
  if (!proj) return null;
  const statusCfg = STATUS_CONFIG[proj.status];
  const budgetVariance = proj.totalBudget - proj.totalSpent;
  const completeMilestones = proj.milestones.filter(m => (m as {status: string}).status === "complete").length;

  const budgetChartData = proj.budgetLines.map(b => {
    const bl = b as {category: string; budget: number; spent: number};
    return { name: bl.category.split(" — ")[1] || bl.category, Budget: bl.budget, Spent: bl.spent };
  });

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div>
        <div className="flex items-center gap-2.5 mb-0.5">
          <h1 className="text-base font-bold text-white tracking-tight font-display">Construction Progress Monitor</h1>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-bold" style={{ color: DS.accent.blue, background: `${DS.accent.blue}10`, border: `1px solid ${DS.accent.blue}20` }}>Active Developments</span>
          {isLive ? (
            <span className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: DS.accent.green, background: `${DS.accent.green}10`, border: `1px solid ${DS.accent.green}20` }}>
              <Database className="w-2.5 h-2.5" /> Live DB
            </span>
          ) : !isLoading && !isError && (
            <button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}
              className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded cursor-pointer"
              style={{ color: DS.text.muted, background: DS.surface, border: `1px solid ${DS.border}` }}>
              {seedMutation.isPending ? "Seeding…" : "Seed to DB"}
            </button>
          )}
        </div>
        <p className="text-[10px] font-mono" style={{ color: DS.text.muted }}>Milestone timelines · budget vs. actual · photo documentation · portfolio dashboard integration</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {projects.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            className="shrink-0 rounded-xl border px-4 py-3 text-left transition-all"
            style={{ borderColor: selectedId === p.id ? DS.accent.gold : DS.border, background: selectedId === p.id ? "rgba(184,148,60,0.04)" : DS.surface, minWidth: 240 }}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-semibold" style={{ color: DS.text.primary }}>{p.name}</p>
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ color: STATUS_CONFIG[p.status].color, background: `${STATUS_CONFIG[p.status].color}12` }}>{STATUS_CONFIG[p.status].label}</span>
            </div>
            <div className="w-full h-1 rounded-full mb-1" style={{ background: DS.border }}>
              <div className="h-1 rounded-full" style={{ width: `${p.overallPct}%`, background: p.status === "at-risk" ? DS.accent.red : p.status === "on-track" ? DS.accent.green : DS.accent.gold }} />
            </div>
            <p className="text-[9px]" style={{ color: DS.text.muted }}>{p.overallPct}% complete · {fmt(p.totalBudget)} budget</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Budget", value: fmt(proj.totalBudget), color: DS.text.primary },
          { label: "Spent to Date", value: fmt(proj.totalSpent), color: DS.accent.gold },
          { label: "Budget Remaining", value: fmt(budgetVariance), color: budgetVariance >= 0 ? DS.accent.green : DS.accent.red },
          { label: "Milestones", value: `${completeMilestones}/${proj.milestones.length}`, color: DS.accent.blue },
        ].map(m => (
          <div key={m.label} className="rounded-xl border p-3" style={{ borderColor: DS.border, background: DS.surface }}>
            <p className="text-[8px] uppercase tracking-wider" style={{ color: DS.text.muted }}>{m.label}</p>
            <p className="text-xl font-bold font-mono mt-1" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: DS.border, background: DS.surface }}>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: DS.border }}>
            <Calendar className="w-3.5 h-3.5" style={{ color: DS.accent.blue }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: `${DS.accent.blue}99` }}>Milestone Timeline</span>
            {proj.revisedCompletion && (
              <div className="ml-auto flex items-center gap-1 text-[9px]" style={{ color: DS.accent.red }}>
                <AlertTriangle className="w-3 h-3" />
                Revised to {new Date(proj.revisedCompletion).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            )}
          </div>
          <div className="p-4 space-y-3">
            {proj.milestones.map((m, i) => {
              const color = MILESTONE_COLORS[m.status];
              return (
                <div key={m.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center shrink-0 mt-0.5">
                    <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: color, background: m.status === "complete" ? color : "transparent" }}>
                      {m.status === "complete" && <span className="text-[6px] text-black font-bold">✓</span>}
                      {m.status === "in-progress" && <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />}
                    </div>
                    {i < proj.milestones.length - 1 && <div className="w-px flex-1 mt-1" style={{ height: 20, background: DS.border }} />}
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-medium" style={{ color: DS.text.secondary }}>{m.label}</p>
                      <span className="text-[8px] font-bold shrink-0" style={{ color }}>{m.status.replace("-", " ")}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[9px]" style={{ color: DS.text.muted }}>Target: {new Date(m.target).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      {m.actual && <span className="text-[9px]" style={{ color: DS.text.muted }}>Actual: {new Date(m.actual).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                      {m.pctComplete > 0 && m.pctComplete < 100 && (
                        <div className="flex items-center gap-1">
                          <div className="w-16 h-1 rounded-full" style={{ background: DS.border }}>
                            <div className="h-1 rounded-full" style={{ width: `${m.pctComplete}%`, background: color }} />
                          </div>
                          <span className="text-[9px]" style={{ color }}>{m.pctComplete}%</span>
                        </div>
                      )}
                    </div>
                    {m.notes && <p className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>{m.notes}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: DS.text.muted }}>Budget vs. Actual by Category</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={budgetChartData} layout="vertical" margin={{ top: 0, right: 0, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis type="number" tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Budget" fill={DS.accent.blue} fillOpacity={0.4} radius={[0, 4, 4, 0]} />
                <Bar dataKey="Spent" fill={DS.accent.gold} fillOpacity={0.8} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border overflow-hidden" style={{ borderColor: DS.border, background: DS.surface }}>
            <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: DS.border }}>
              <Camera className="w-3.5 h-3.5" style={{ color: DS.accent.green }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: `${DS.accent.green}99` }}>Photo Documentation</span>
            </div>
            <div className="divide-y" style={{ borderColor: DS.border }}>
              {proj.photos.map((photo, i) => (
                <button key={i} onClick={() => setPhotoModal(photo)} className="w-full text-left px-4 py-3 hover:bg-white/[0.015] transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-medium" style={{ color: DS.text.secondary }}>{photo.area}</p>
                      <p className="text-[9px] mt-0.5 line-clamp-2" style={{ color: DS.text.muted }}>{photo.caption}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[9px]" style={{ color: DS.text.muted }}>{new Date(photo.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {photoModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border shadow-2xl p-6" style={{ background: "#0a0c10", borderColor: "rgba(255,255,255,0.1)" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white">{photoModal.area}</h3>
                  <p className="text-xs mt-0.5" style={{ color: DS.text.muted }}>{new Date(photoModal.date).toLocaleDateString()} · {photoModal.author}</p>
                </div>
                <button onClick={() => setPhotoModal(null)}><X className="w-5 h-5" style={{ color: DS.text.muted }} /></button>
              </div>
              <div className="rounded-xl h-48 flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${DS.border}` }}>
                <div className="text-center">
                  <Camera className="w-10 h-10 mx-auto mb-2" style={{ color: DS.text.muted }} />
                  <p className="text-xs" style={{ color: DS.text.muted }}>Photo documentation</p>
                  <p className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>Attach via site upload portal</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: DS.text.secondary }}>{photoModal.caption}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
