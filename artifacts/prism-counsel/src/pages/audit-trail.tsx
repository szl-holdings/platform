import { useState, useMemo } from "react";
import { Scale, Eye, Edit, Download, Lock, AlertTriangle, ChevronUp, ChevronDown, Shield } from "lucide-react";
import { useMatters, getPrivilegeColor } from "@/data/matters";
import type { AuditAction } from "@/data/matters";

const ACCENT = "#a78bfa";

const ACTION_ICONS: Record<AuditAction, React.ReactNode> = {
  viewed: <Eye className="w-3 h-3" />,
  edited: <Edit className="w-3 h-3" />,
  exported: <Download className="w-3 h-3" />,
  redacted: <Shield className="w-3 h-3" />,
  "accessed-wall": <Lock className="w-3 h-3" />,
  escalated: <AlertTriangle className="w-3 h-3" />,
  "deadline-updated": <Scale className="w-3 h-3" />,
  "privilege-changed": <Shield className="w-3 h-3" />,
};

const ACTION_COLORS: Record<AuditAction, string> = {
  viewed: "#6b7280",
  edited: "#a78bfa",
  exported: "#38bdf8",
  redacted: "#f97316",
  "accessed-wall": "#ef4444",
  escalated: "#ef4444",
  "deadline-updated": "#eab308",
  "privilege-changed": "#f97316",
};

interface AuditEntryWithMatter {
  matterId: string;
  matterName: string;
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: AuditAction;
  detail: string;
  ip: string;
}

export default function AuditTrailPage() {
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all");
  const [matterFilter, setMatterFilter] = useState("all");
  const { matters } = useMatters();

  const allEntries: AuditEntryWithMatter[] = useMemo(() => {
    const entries: AuditEntryWithMatter[] = [];
    for (const matter of matters) {
      for (const entry of matter.auditTrail) {
        entries.push({ ...entry, matterId: matter.id, matterName: matter.name });
      }
    }
    return entries;
  }, [matters]);

  const filtered = useMemo(() => {
    let es = allEntries;
    if (actionFilter !== "all") es = es.filter((e) => e.action === actionFilter);
    if (matterFilter !== "all") es = es.filter((e) => e.matterId === matterFilter);
    return [...es].sort((a, b) => {
      const diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      return sortDir === "asc" ? diff : -diff;
    });
  }, [allEntries, actionFilter, matterFilter, sortDir]);

  const criticalActions: AuditAction[] = ["accessed-wall", "escalated", "privilege-changed", "redacted"];
  const criticalCount = allEntries.filter((e) => criticalActions.includes(e.action)).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-1">
        <Scale className="w-4 h-4" style={{ color: ACCENT }} />
        <h1 className="text-lg font-semibold font-display text-white/90">Audit Trail</h1>
      </div>
      <p className="text-xs text-white/30">Immutable log of all access, edits, exports, and privilege changes</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Events", value: String(allEntries.length) },
          { label: "Critical Events", value: String(criticalCount), color: "#ef4444" },
          { label: "Wall Accesses", value: String(allEntries.filter((e) => e.action === "accessed-wall").length), color: "#ef4444" },
          { label: "Privilege Changes", value: String(allEntries.filter((e) => e.action === "privilege-changed").length), color: "#f97316" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="text-[10px] text-white/30 mb-1">{s.label}</p>
            <p className="text-xl font-semibold font-mono" style={{ color: s.color || ACCENT }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-white/30 uppercase tracking-wider">Action</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as AuditAction | "all")}
            className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white/70 focus:outline-none"
          >
            <option value="all">All Actions</option>
            <option value="viewed">Viewed</option>
            <option value="edited">Edited</option>
            <option value="exported">Exported</option>
            <option value="redacted">Redacted</option>
            <option value="accessed-wall">Accessed Wall</option>
            <option value="escalated">Escalated</option>
            <option value="deadline-updated">Deadline Updated</option>
            <option value="privilege-changed">Privilege Changed</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-white/30 uppercase tracking-wider">Matter</label>
          <select
            value={matterFilter}
            onChange={(e) => setMatterFilter(e.target.value)}
            className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white/70 focus:outline-none"
          >
            <option value="all">All Matters</option>
            {matters.map((m) => <option key={m.id} value={m.id}>{m.name.split(" — ")[0]}</option>)}
          </select>
        </div>
        <button
          onClick={() => setSortDir((v) => v === "asc" ? "desc" : "asc")}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-white/10 text-white/40 hover:text-white/70 transition-all ml-auto"
        >
          {sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          {sortDir === "desc" ? "Newest first" : "Oldest first"}
        </button>
      </div>

      <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Timestamp</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Action</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Matter</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Detail</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((entry) => {
                const isCritical = criticalActions.includes(entry.action);
                const aColor = ACTION_COLORS[entry.action];
                const date = new Date(entry.timestamp);
                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-white/2 transition-colors"
                    style={isCritical ? { background: "rgba(239,68,68,0.02)" } : {}}
                  >
                    <td className="px-4 py-3">
                      <p className="text-[11px] font-mono text-white/50">
                        {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                      <p className="text-[9px] font-mono text-white/25">
                        {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: aColor }}>
                        {ACTION_ICONS[entry.action]}
                        {entry.action.replace(/-/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[11px] text-white/60">{entry.user}</p>
                      <p className="text-[9px] text-white/25">{entry.role}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[11px] text-white/50 max-w-[120px] truncate">{entry.matterName.split(" — ")[0]}</p>
                      <p className="text-[9px] text-white/20 font-mono">{entry.matterId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[11px] text-white/50 max-w-[200px] leading-snug">{entry.detail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] text-white/20">{entry.ip}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-start gap-2.5 p-3 rounded-lg text-[11px] text-white/20 border border-white/5" style={{ background: "rgba(255,255,255,0.01)" }}>
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: ACCENT }} />
        <span>This audit log is immutable and tamper-evident. All entries are cryptographically signed and stored off-system. Records are retained for 7 years per applicable legal hold requirements.</span>
      </div>
    </div>
  );
}
