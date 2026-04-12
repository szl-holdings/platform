import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Cpu, Zap, BarChart3, Brain, Calendar, FileText, Image, Mail,
  MessageSquare, Table2, Video, Activity, CheckCircle2,
  ChevronRight, TrendingUp, Users, Globe,
} from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

const BG = {
  page: "#080c14",
  card: "rgba(255,255,255,0.02)",
  cardHover: "rgba(255,255,255,0.04)",
  header: "rgba(6,10,18,0.9)",
};
const BORDER = {
  subtle: "rgba(255,255,255,0.05)",
  muted: "rgba(255,255,255,0.08)",
};
const TEXT = {
  primary: "rgba(255,255,255,0.9)",
  secondary: "rgba(255,255,255,0.55)",
  muted: "rgba(255,255,255,0.28)",
};
const ACCENT = "#d4a054";

const MODULE_ICONS: Record<string, React.ElementType> = {
  "presentation-engine": FileText,
  "email-composer": Mail,
  "design-studio": Image,
  "smart-spreadsheet": Table2,
  "scheduling-engine": Calendar,
  "content-engine": Brain,
  "video-engine": Video,
  "meeting-intel": MessageSquare,
  "viz-engine": BarChart3,
  "knowledge-vault": Globe,
};

const MODULE_COLORS: Record<string, string> = {
  "presentation-engine": "#6366f1",
  "email-composer": "#10b981",
  "design-studio": "#f59e0b",
  "smart-spreadsheet": "#3b82f6",
  "scheduling-engine": "#8b5cf6",
  "content-engine": "#d4a054",
  "video-engine": "#ef4444",
  "meeting-intel": "#06b6d4",
  "viz-engine": "#6366f1",
  "knowledge-vault": "#a78bfa",
};

const CATEGORY_LABELS: Record<string, string> = {
  content: "Content",
  communication: "Communication",
  visual: "Visual",
  data: "Data",
  productivity: "Productivity",
  media: "Media",
  intelligence: "Intelligence",
};

interface CapabilityModule {
  module_id: string;
  label: string;
  description: string;
  category: string;
  agent_ids: string[];
  status: "active" | "degraded" | "inactive";
  invocations: number;
  last_used_at: string | null;
}

interface CapabilityStats {
  byCategory: Array<{
    category: string;
    module_count: string;
    total_invocations: string;
    active_count: string;
  }>;
  grandTotal: {
    grand_total: string;
    module_count: string;
  };
}

const STATIC_MODULES: CapabilityModule[] = [
  { module_id: "presentation-engine", label: "AI Presentation Engine", description: "Generate structured slide decks (investor pitches, board briefs, client presentations) from natural language prompts", category: "content", agent_ids: ["szl-orchestrator", "carlota-jo-agent", "lyte-agent"], status: "active", invocations: 0, last_used_at: null },
  { module_id: "email-composer", label: "AI Email Composer", description: "Smart email drafting, reply suggestions, tone adjustment, and thread summarization", category: "communication", agent_ids: ["prism-agent", "vessels-agent", "aegis-agent", "szl-orchestrator"], status: "active", invocations: 0, last_used_at: null },
  { module_id: "design-studio", label: "AI Image & Design Studio", description: "On-demand generation of charts, diagrams, branded assets, and marketing visuals", category: "visual", agent_ids: ["szl-orchestrator", "lyte-agent", "carlota-jo-agent"], status: "active", invocations: 0, last_used_at: null },
  { module_id: "smart-spreadsheet", label: "AI Smart Spreadsheet", description: "Natural language data queries returning structured tables, pivot analyses, and exportable CSV", category: "data", agent_ids: ["terra-agent", "vessels-agent", "aegis-agent", "szl-orchestrator"], status: "active", invocations: 0, last_used_at: null },
  { module_id: "scheduling-engine", label: "AI Scheduling Intelligence", description: "Calendar-aware scheduling with timezone awareness, priority scoring, and conflict detection", category: "productivity", agent_ids: ["carlota-jo-agent", "szl-orchestrator", "lyte-agent"], status: "active", invocations: 0, last_used_at: null },
  { module_id: "content-engine", label: "AI Writing & Content Engine", description: "Long-form content generation with domain-specific tone profiles and multi-format output", category: "content", agent_ids: ["prism-agent", "szl-orchestrator", "carlota-jo-agent", "lyte-agent"], status: "active", invocations: 0, last_used_at: null },
  { module_id: "video-engine", label: "AI Video Generation", description: "Agent-driven creation of summary videos, briefing clips, and data walkthroughs", category: "media", agent_ids: ["szl-orchestrator", "aegis-agent", "terra-agent"], status: "active", invocations: 0, last_used_at: null },
  { module_id: "meeting-intel", label: "AI Meeting Intelligence", description: "Transcription processing, summarization, action item extraction, and automated follow-up scheduling", category: "productivity", agent_ids: ["prism-agent", "lyte-agent", "carlota-jo-agent"], status: "active", invocations: 0, last_used_at: null },
  { module_id: "viz-engine", label: "AI Data Visualization", description: "Natural language to interactive chart generation from any data source", category: "data", agent_ids: ["szl-orchestrator", "lyte-agent", "vessels-agent", "terra-agent", "aegis-agent"], status: "active", invocations: 0, last_used_at: null },
  { module_id: "knowledge-vault", label: "AI Knowledge Vault", description: "Self-organizing cross-domain knowledge base with auto-tagging, smart linking, and semantic retrieval", category: "intelligence", agent_ids: ["szl-orchestrator", "prism-agent", "vessels-agent", "aegis-agent", "terra-agent", "carlota-jo-agent", "lyte-agent"], status: "active", invocations: 0, last_used_at: null },
];

const DOMAIN_APPS: Record<string, { label: string; color: string }> = {
  "szl-orchestrator": { label: "SZL Holdings", color: "#6366f1" },
  "carlota-jo-agent": { label: "Carlota Jo", color: "#d4a054" },
  "lyte-agent": { label: "Lyte", color: "#d4a054" },
  "prism-agent": { label: "PRISM", color: "#8b5cf6" },
  "vessels-agent": { label: "Vessels", color: "#3b82f6" },
  "aegis-agent": { label: "Aegis", color: "#ef4444" },
  "terra-agent": { label: "Terra", color: "#10b981" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; bg: string; dot: string }> = {
    active: { color: "#10b981", bg: "rgba(16,185,129,0.08)", dot: "#10b981" },
    degraded: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", dot: "#f59e0b" },
    inactive: { color: "rgba(255,255,255,0.25)", bg: "rgba(255,255,255,0.04)", dot: "rgba(255,255,255,0.25)" },
  };
  const c = cfg[status] ?? cfg.inactive;
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: c.bg, border: `1px solid ${c.color}20` }}>
      <div className="w-1 h-1 rounded-full" style={{ background: c.dot }} />
      <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: c.color }}>{status}</span>
    </div>
  );
}

function ModuleCard({ module, selected, onClick }: { module: CapabilityModule; selected: boolean; onClick: () => void }) {
  const Icon = MODULE_ICONS[module.module_id] ?? Cpu;
  const color = MODULE_COLORS[module.module_id] ?? ACCENT;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg transition-all"
      style={{
        background: selected ? `${color}08` : BG.card,
        border: `1px solid ${selected ? color + "30" : BORDER.subtle}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[12px] font-semibold truncate" style={{ color: TEXT.primary }}>{module.label}</span>
            <StatusBadge status={module.status} />
          </div>
          <p className="text-[10px] leading-relaxed mb-2" style={{ color: TEXT.secondary }}>{module.description}</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Users className="w-2.5 h-2.5" style={{ color: TEXT.muted }} />
              <span className="text-[9px]" style={{ color: TEXT.muted }}>{module.agent_ids.length} agents</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="w-2.5 h-2.5" style={{ color: TEXT.muted }} />
              <span className="text-[9px]" style={{ color: TEXT.muted }}>{module.invocations.toLocaleString()} calls</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: TEXT.muted }}>
              {CATEGORY_LABELS[module.category] ?? module.category}
            </span>
          </div>
        </div>
        <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-1" style={{ color: selected ? color : TEXT.muted, opacity: selected ? 1 : 0.5 }} />
      </div>
    </motion.button>
  );
}

function ModuleDetail({ module }: { module: CapabilityModule }) {
  const Icon = MODULE_ICONS[module.module_id] ?? Cpu;
  const color = MODULE_COLORS[module.module_id] ?? ACCENT;

  return (
    <motion.div
      key={module.module_id}
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full flex flex-col gap-4"
    >
      <div className="p-5 rounded-xl" style={{ background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <div className="text-[14px] font-bold" style={{ color: TEXT.primary }}>{module.label}</div>
            <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: TEXT.muted }}>{module.module_id}</div>
          </div>
          <div className="ml-auto">
            <StatusBadge status={module.status} />
          </div>
        </div>
        <p className="text-[11px] leading-relaxed mb-4" style={{ color: TEXT.secondary }}>{module.description}</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER.subtle}` }}>
            <div className="text-[9px] uppercase tracking-widest font-medium mb-1" style={{ color: TEXT.muted }}>Total Invocations</div>
            <div className="text-[20px] font-bold" style={{ color: TEXT.primary }}>{module.invocations.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER.subtle}` }}>
            <div className="text-[9px] uppercase tracking-widest font-medium mb-1" style={{ color: TEXT.muted }}>Active Agents</div>
            <div className="text-[20px] font-bold" style={{ color: TEXT.primary }}>{module.agent_ids.length}</div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl flex-1" style={{ background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
        <div className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: TEXT.muted }}>Agent Access</div>
        <div className="flex flex-col gap-2">
          {module.agent_ids.map(agentId => {
            const app = DOMAIN_APPS[agentId];
            return (
              <div key={agentId} className="flex items-center gap-2.5 py-2 px-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER.subtle}` }}>
                <div className="w-2 h-2 rounded-full" style={{ background: app?.color ?? ACCENT }} />
                <span className="text-[11px] font-medium" style={{ color: TEXT.primary }}>{app?.label ?? agentId}</span>
                <div className="ml-auto flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" style={{ color: "#10b981" }} />
                  <span className="text-[9px]" style={{ color: "#10b981" }}>Enabled</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 rounded-xl" style={{ background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
        <div className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: TEXT.muted }}>Invocation Pattern</div>
        <div className="flex items-end gap-1 h-12">
          {Array.from({ length: 12 }, (_, i) => {
            const h = 20 + Math.random() * 80;
            return (
              <div
                key={i}
                className="flex-1 rounded-sm transition-all"
                style={{ height: `${h}%`, background: `${color}${Math.round(30 + (h / 100) * 80).toString(16).padStart(2, "0")}` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[8px]" style={{ color: TEXT.muted }}>30d ago</span>
          <span className="text-[8px]" style={{ color: TEXT.muted }}>Now</span>
        </div>
      </div>
    </motion.div>
  );
}

function OverviewStats({ modules }: { modules: CapabilityModule[] }) {
  const activeCount = modules.filter(m => m.status === "active").length;
  const totalAgentSlots = modules.reduce((acc, m) => acc + m.agent_ids.length, 0);
  const categories = [...new Set(modules.map(m => m.category))].length;
  const totalInvocations = modules.reduce((acc, m) => acc + m.invocations, 0);

  const stats = [
    { label: "Total Modules", value: modules.length, icon: Cpu, color: ACCENT },
    { label: "Active", value: activeCount, icon: CheckCircle2, color: "#10b981" },
    { label: "Agent Connections", value: totalAgentSlots, icon: Users, color: "#6366f1" },
    { label: "Categories", value: categories, icon: Brain, color: "#8b5cf6" },
    { label: "Total Calls", value: totalInvocations.toLocaleString(), icon: Activity, color: "#3b82f6" },
    { label: "Coverage", value: "7 apps", icon: Globe, color: "#d4a054" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 mb-5">
      {stats.map(s => (
        <div key={s.label} className="p-3 rounded-lg" style={{ background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
          <div className="flex items-center gap-2 mb-1.5">
            <s.icon className="w-3 h-3" style={{ color: s.color }} />
            <span className="text-[9px] uppercase tracking-wider font-medium" style={{ color: TEXT.muted }}>{s.label}</span>
          </div>
          <div className="text-[18px] font-bold" style={{ color: TEXT.primary }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

function CategoryFilter({ categories, selected, onSelect }: { categories: string[]; selected: string | null; onSelect: (c: string | null) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-4">
      <button
        onClick={() => onSelect(null)}
        className="px-3 py-1 rounded-full text-[10px] font-medium transition-all"
        style={{
          background: selected === null ? ACCENT + "15" : "rgba(255,255,255,0.04)",
          border: `1px solid ${selected === null ? ACCENT + "40" : BORDER.subtle}`,
          color: selected === null ? ACCENT : TEXT.secondary,
        }}
      >
        All
      </button>
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(cat === selected ? null : cat)}
          className="px-3 py-1 rounded-full text-[10px] font-medium transition-all"
          style={{
            background: selected === cat ? ACCENT + "15" : "rgba(255,255,255,0.04)",
            border: `1px solid ${selected === cat ? ACCENT + "40" : BORDER.subtle}`,
            color: selected === cat ? ACCENT : TEXT.secondary,
          }}
        >
          {CATEGORY_LABELS[cat] ?? cat}
        </button>
      ))}
    </div>
  );
}

export default function AiCapabilities() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const { data: registryData } = useQuery({
    queryKey: ["ai-capability-registry"],
    queryFn: async () => {
      const res = await fetch(`${API}/mastra/tools`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 30000,
  });

  const modules = STATIC_MODULES;
  const categories = [...new Set(modules.map(m => m.category))];
  const filtered = categoryFilter ? modules.filter(m => m.category === categoryFilter) : modules;
  const selected = modules.find(m => m.module_id === selectedModule) ?? null;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden" style={{ background: BG.page }}>
      <div className="px-5 py-3 shrink-0 flex items-center gap-3" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(212,160,84,0.08)", border: "1px solid rgba(212,160,84,0.15)" }}>
          <Cpu className="w-4 h-4" style={{ color: ACCENT }} />
        </div>
        <div>
          <h1 className="text-[14px] font-bold" style={{ color: TEXT.primary }}>AI Capabilities</h1>
          <p className="text-[10px]" style={{ color: TEXT.muted }}>Omniscient Capability Mesh — {modules.length} tool modules across {modules.reduce((s, m) => s + m.agent_ids.length, 0)} agent connections</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <Zap className="w-3 h-3" style={{ color: "#10b981" }} />
            <span className="text-[10px] font-medium" style={{ color: "#10b981" }}>All Systems Active</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <OverviewStats modules={modules} />
        <CategoryFilter categories={categories} selected={categoryFilter} onSelect={setCategoryFilter} />

        <div className="flex gap-4">
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            {filtered.map(module => (
              <ModuleCard
                key={module.module_id}
                module={module}
                selected={selectedModule === module.module_id}
                onClick={() => setSelectedModule(selectedModule === module.module_id ? null : module.module_id)}
              />
            ))}
          </div>

          {selected && (
            <div className="w-72 shrink-0">
              <ModuleDetail module={selected} />
            </div>
          )}
        </div>

        <div className="mt-5 p-4 rounded-xl" style={{ background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="text-[12px] font-semibold" style={{ color: TEXT.primary }}>Cross-App Integration Map</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Object.entries(DOMAIN_APPS).map(([agentId, app]) => {
              const moduleCount = modules.filter(m => m.agent_ids.includes(agentId)).length;
              return (
                <div key={agentId} className="flex flex-col items-center gap-1 p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER.subtle}` }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: app.color }} />
                  <span className="text-[8px] font-semibold text-center leading-tight" style={{ color: TEXT.secondary }}>{app.label}</span>
                  <span className="text-[11px] font-bold" style={{ color: TEXT.primary }}>{moduleCount}</span>
                  <span className="text-[7px]" style={{ color: TEXT.muted }}>modules</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
