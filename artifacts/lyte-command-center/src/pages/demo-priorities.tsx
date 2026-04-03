import { useState } from "react";
import { Target, ChevronDown, TrendingUp, Clock, Users, AlertTriangle } from "lucide-react";
import { demoPriorities } from "@/lib/demo-seed";

const BG = { surface: "#0c1018", elevated: "#10141e" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.06)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };

const URGENCY: Record<string, { label: string; color: string }> = {
  immediate: { label: "Immediate", color: "#c45a4a" },
  today: { label: "Today", color: "#c8953c" },
  this_week: { label: "This Week", color: "#d4a054" },
  next_week: { label: "Next Week", color: "#4a90b8" },
};

const STATUS: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "#c45a4a" },
  in_progress: { label: "In Progress", color: "#d4a054" },
  blocked: { label: "Blocked", color: "#c8953c" },
  done: { label: "Done", color: "#6b8f71" },
};

const ROLES = [
  { key: "all", label: "All" },
  { key: "executive", label: "Executive" },
  { key: "operator", label: "Operator" },
  { key: "manager", label: "Manager" },
  { key: "compliance", label: "Compliance" },
];

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function ScoreBreakdown({ factors }: { factors: typeof demoPriorities[0]["scoreFactors"] }) {
  return (
    <div className="mt-3 space-y-1.5 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
      <div className="text-[8px] uppercase tracking-widest mb-2" style={{ color: TEXT.muted }}>Scoring Factors</div>
      {factors.map(f => (
        <div key={f.label} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
          <div className="text-[9px]" style={{ color: TEXT.secondary }}>{f.label}</div>
          <div className="w-20 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="h-full rounded-full" style={{ width: `${f.score}%`, background: f.score >= 80 ? "#c45a4a" : f.score >= 60 ? "#d4a054" : "#4a90b8" }} />
          </div>
          <div className="text-[9px] font-mono text-right" style={{ color: TEXT.tertiary }}>{f.score}</div>
        </div>
      ))}
    </div>
  );
}

export default function DemoPrioritiesPage() {
  const [roleFilter, setRoleFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = roleFilter === "all"
    ? demoPriorities
    : demoPriorities.filter(p => p.role === roleFilter);

  const immediate = filtered.filter(p => p.urgency === "immediate");
  const today = filtered.filter(p => p.urgency === "today");
  const thisWeek = filtered.filter(p => p.urgency === "this_week" || p.urgency === "next_week");

  function PriorityCard({ pri }: { pri: typeof demoPriorities[0] }) {
    const isOpen = expanded === pri.id;
    const urg = URGENCY[pri.urgency];
    const sta = STATUS[pri.status];
    const scoreBar = pri.totalScore;
    const barColor = scoreBar >= 85 ? "#c45a4a" : scoreBar >= 70 ? "#c8953c" : "#d4a054";

    return (
      <div className="rounded-md overflow-hidden" style={{ background: BG.surface, border: `1px solid rgba(255,255,255,0.05)` }}>
        <div className="px-4 py-3 cursor-pointer" onClick={() => setExpanded(isOpen ? null : pri.id)}>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded flex items-center justify-center text-[11px] font-black shrink-0" style={{ background: "rgba(212,160,84,0.08)", color: "#d4a054", border: "1px solid rgba(212,160,84,0.15)" }}>
              {pri.rank}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold leading-snug mb-0.5" style={{ color: TEXT.primary }}>{pri.title}</div>
              <div className="flex items-center gap-2">
                <span className="text-[9px]" style={{ color: TEXT.muted }}>{pri.owner} · {pri.team}</span>
                <span className="text-[8px] px-1.5 py-px rounded" style={{ color: urg.color, background: `${urg.color}14`, border: `1px solid ${urg.color}25` }}>{urg.label}</span>
                <span className="text-[8px] px-1.5 py-px rounded" style={{ color: sta.color, background: `${sta.color}14`, border: `1px solid ${sta.color}25` }}>{sta.label}</span>
              </div>
            </div>
            <div className="text-right shrink-0 mr-2">
              <div className="text-[10px] font-mono font-bold" style={{ color: "#6b8f71" }}>{fmt(pri.valueProtected)}</div>
              <div className="text-[8px]" style={{ color: TEXT.muted }}>Protected</div>
            </div>
            <div className="shrink-0 w-14">
              <div className="text-[7px] text-right mb-0.5 font-mono" style={{ color: TEXT.muted }}>Score</div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${scoreBar}%`, background: barColor }} />
              </div>
              <div className="text-[9px] font-mono text-right mt-0.5" style={{ color: barColor }}>{scoreBar}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 shrink-0 transition-transform" style={{ color: TEXT.muted, transform: isOpen ? "rotate(180deg)" : "none" }} />
          </div>
        </div>
        {isOpen && (
          <div className="px-4 pb-4 border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <div className="text-[8px] uppercase tracking-wider mb-0.5" style={{ color: TEXT.muted }}>Due By</div>
                <div className="text-[10px] font-medium" style={{ color: TEXT.primary }}>{pri.dueBy}</div>
              </div>
              <div>
                <div className="text-[8px] uppercase tracking-wider mb-0.5" style={{ color: TEXT.muted }}>Role Relevance</div>
                <div className="text-[10px] font-medium capitalize" style={{ color: TEXT.primary }}>{pri.role}</div>
              </div>
              <div>
                <div className="text-[8px] uppercase tracking-wider mb-0.5" style={{ color: TEXT.muted }}>Linked Signals</div>
                <div className="text-[10px] font-mono" style={{ color: TEXT.primary }}>{pri.signalIds.join(", ")}</div>
              </div>
            </div>
            <ScoreBreakdown factors={pri.scoreFactors} />
          </div>
        )}
      </div>
    );
  }

  function Group({ label, color, items }: { label: string; color: string; items: typeof demoPriorities }) {
    if (items.length === 0) return null;
    return (
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
          <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color }}>{label}</span>
          <span className="text-[9px] font-mono" style={{ color: TEXT.muted }}>({items.length})</span>
        </div>
        <div className="space-y-2">
          {items.map(p => <PriorityCard key={p.id} pri={p} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-[1100px] space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Target className="w-3.5 h-3.5" style={{ color: "#d4a054" }} />
            <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "#d4a054" }}>Lyte · Priorities</span>
          </div>
          <h1 className="text-lg font-bold" style={{ color: TEXT.primary }}>Priority Action Queue</h1>
          <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>Ranked by composite impact score — value at risk, urgency, and probability decay</p>
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
          {ROLES.map(r => (
            <button key={r.key} onClick={() => setRoleFilter(r.key)}
              className="text-[9px] px-2.5 py-1.5 rounded transition-all"
              style={{
                color: roleFilter === r.key ? "#d4a054" : TEXT.muted,
                background: roleFilter === r.key ? "rgba(212,160,84,0.1)" : "transparent",
                border: roleFilter === r.key ? "1px solid rgba(212,160,84,0.2)" : "1px solid transparent",
              }}>{r.label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Priorities", value: filtered.length, color: TEXT.secondary },
          { label: "Immediate", value: immediate.length, color: "#c45a4a" },
          { label: "Due Today", value: today.length, color: "#c8953c" },
          { label: "Value Protected", value: `$${(filtered.reduce((a, p) => a + p.valueProtected, 0) / 1_000_000).toFixed(1)}M`, color: "#6b8f71" },
        ].map(c => (
          <div key={c.label} className="rounded-md p-3" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
            <div className="text-[8px] uppercase tracking-wider mb-1" style={{ color: TEXT.muted }}>{c.label}</div>
            <div className="text-xl font-bold font-mono" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-5">
        <Group label="Immediate" color="#c45a4a" items={immediate} />
        <Group label="Today" color="#c8953c" items={today} />
        <Group label="This Week & Beyond" color="#d4a054" items={thisWeek} />
      </div>
    </div>
  );
}
