import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui";
import { useLocation } from "wouter";
import {
  Search, Command, GitBranch, Zap, Shield, CheckCircle,
  Activity, Radio, BarChart2, X, ArrowRight, Clock, Star,
  ChevronRight, Play, FileText, Network, Brain, Layers,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
  shortcut?: string;
  badge?: string;
  badgeColor?: string;
}

const SLASH_COMMANDS: Record<string, { description: string; icon: React.ReactNode; nav: string; badge?: string; badgeColor?: string }> = {
  "/workflow": { description: "Open Workflow Orchestration", icon: <GitBranch className="w-3.5 h-3.5" />, nav: "/alloy/workflows" },
  "/approve": { description: "Open Approvals Queue", icon: <CheckCircle className="w-3.5 h-3.5" />, nav: "/alloy/governance", badge: "Action", badgeColor: "#f59e0b" },
  "/signals": { description: "Open Signal Feed", icon: <Radio className="w-3.5 h-3.5" />, nav: "/alloy/signals" },
  "/runs": { description: "Open Execution History", icon: <Activity className="w-3.5 h-3.5" />, nav: "/alloy/runs" },
  "/analytics": { description: "Open Automation Analytics", icon: <BarChart2 className="w-3.5 h-3.5" />, nav: "/alloy/analytics" },
  "/decisions": { description: "Open Decision Objects", icon: <Brain className="w-3.5 h-3.5" />, nav: "/alloy/decisions", badge: "New", badgeColor: "#4B8BDB" },
  "/skills": { description: "Open Skill Registry", icon: <Layers className="w-3.5 h-3.5" />, nav: "/alloy/skills", badge: "New", badgeColor: "#4B8BDB" },
  "/operators": { description: "Open Operator Control Center", icon: <Shield className="w-3.5 h-3.5" />, nav: "/alloy/operator", badge: "New", badgeColor: "#4B8BDB" },
  "/home": { description: "Workspace Home", icon: <Zap className="w-3.5 h-3.5" />, nav: "/alloy/home", badge: "New", badgeColor: "#4B8BDB" },
  "/connectors": { description: "Open Connector Mesh", icon: <Network className="w-3.5 h-3.5" />, nav: "/alloy/connectors" },
  "/docs": { description: "Open Document Engine", icon: <FileText className="w-3.5 h-3.5" />, nav: "/alloy/documents" },
};

const RECENT_COMMANDS_KEY = "alloy_recent_commands";
const MAX_RECENT = 5;

function getRecentCommands(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_COMMANDS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function addRecentCommand(cmd: string) {
  try {
    const recent = getRecentCommands().filter(c => c !== cmd);
    localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify([cmd, ...recent].slice(0, MAX_RECENT)));
  } catch {}
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: "#4B8BDB" }}>{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

export function CommandBar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  const { data: workflows } = useQuery({
    queryKey: ["alloyWorkflowsForCmd"],
    queryFn: async () => {
      try {
        const r = await apiFetch<{ data: Array<{ id: number; name: string; status: string }> } | Array<{ id: number; name: string; status: string }>>("/alloy/workflows?limit=20");
        if (r && "data" in r) return r.data;
        return r as Array<{ id: number; name: string; status: string }>;
      } catch { return []; }
    },
    staleTime: 60000,
    enabled: isOpen,
  });

  const nav = useCallback((path: string, label: string) => {
    addRecentCommand(label);
    navigate(path);
    onClose();
  }, [navigate, onClose]);

  const allItems: CommandItem[] = [
    ...(Object.entries(SLASH_COMMANDS).map(([slash, cfg]) => ({
      id: `slash-${slash}`,
      label: slash,
      description: cfg.description,
      icon: cfg.icon,
      category: "Navigation",
      action: () => nav(cfg.nav, slash),
      badge: cfg.badge,
      badgeColor: cfg.badgeColor,
    }))),
    ...(workflows ?? []).map(wf => ({
      id: `wf-${wf.id}`,
      label: wf.name,
      description: `Workflow · ${wf.status}`,
      icon: <GitBranch className="w-3.5 h-3.5" />,
      category: "Workflows",
      action: () => nav("/alloy/workflows", wf.name),
      badge: wf.status === "active" ? "Active" : undefined,
      badgeColor: wf.status === "active" ? "#10b981" : undefined,
    })),
  ];

  const recentCommands = getRecentCommands();

  const isSlash = query.startsWith("/");
  const lower = query.toLowerCase();

  const filtered = allItems.filter(item => {
    if (!query) return false;
    if (isSlash) {
      return item.id.startsWith("slash-") && item.label.startsWith(query);
    }
    return item.label.toLowerCase().includes(lower) || (item.description ?? "").toLowerCase().includes(lower);
  });

  const suggestions = !query ? [
    { id: "home", label: "Workspace Home", description: "Priority dashboard with active tasks", icon: <Zap className="w-3.5 h-3.5" />, category: "Quick Nav", action: () => nav("/alloy/home", "Home"), badge: "New", badgeColor: "#4B8BDB" },
    { id: "decisions", label: "Decision Objects", description: "Review pending decisions", icon: <Brain className="w-3.5 h-3.5" />, category: "Quick Nav", action: () => nav("/alloy/decisions", "Decisions"), badge: "New", badgeColor: "#4B8BDB" },
    { id: "governance", label: "Approvals Queue", description: "Items waiting for review", icon: <CheckCircle className="w-3.5 h-3.5" />, category: "Quick Nav", action: () => nav("/alloy/governance", "Governance") },
    { id: "signals", label: "Signal Feed", description: "Live cross-platform signals", icon: <Radio className="w-3.5 h-3.5" />, category: "Quick Nav", action: () => nav("/alloy/signals", "Signals") },
    { id: "operator", label: "Operator Control Center", description: "Agent health & queue depth", icon: <Shield className="w-3.5 h-3.5" />, category: "Quick Nav", action: () => nav("/alloy/operator", "Operator"), badge: "New", badgeColor: "#4B8BDB" },
    { id: "skills", label: "Skill Registry", description: "Manage agent capabilities", icon: <Layers className="w-3.5 h-3.5" />, category: "Quick Nav", action: () => nav("/alloy/skills", "Skills"), badge: "New", badgeColor: "#4B8BDB" },
  ] as CommandItem[] : [];

  const items = filtered.length > 0 ? filtered : suggestions;
  const totalItems = items.length;

  useEffect(() => { setSelected(0); }, [query]);
  useEffect(() => {
    if (isOpen) { setTimeout(() => inputRef.current?.focus(), 50); setQuery(""); }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, totalItems - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && items[selected]) { items[selected]!.action(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose, items, selected, totalItems]);

  if (!isOpen) return null;

  const grouped: Record<string, CommandItem[]> = {};
  items.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category]!.push(item);
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} />
      <div
        className="relative mt-20 w-full max-w-xl mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "rgba(10,14,24,0.98)", border: "1px solid rgba(75,139,219,0.2)", boxShadow: "0 25px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(75,139,219,0.1), inset 0 1px 0 rgba(255,255,255,0.05)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <Search className="w-4 h-4 shrink-0" style={{ color: "rgba(75,139,219,0.7)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search or type / for commands…"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-0.5 rounded hover:bg-white/5 transition-colors">
              <X className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
            </button>
          )}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono shrink-0" style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" }}>
            ESC
          </div>
        </div>

        {recentCommands.length > 0 && !query && (
          <div className="px-4 pt-3 pb-1">
            <div className="flex items-center gap-1.5 mb-2 text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
              <Clock className="w-3 h-3" /> Recent
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recentCommands.map(cmd => (
                <button
                  key={cmd}
                  onClick={() => setQuery(cmd)}
                  className="text-[10px] px-2 py-1 rounded-lg border transition-all hover:border-blue-400/30"
                  style={{ color: "rgba(255,255,255,0.45)", borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-h-80 overflow-y-auto py-2">
          {totalItems === 0 && query && (
            <div className="py-8 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              No results for "<span style={{ color: "rgba(75,139,219,0.7)" }}>{query}</span>"
            </div>
          )}
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat}>
              <div className="px-4 py-1 text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>{cat}</div>
              {catItems.map((item) => {
                const idx = items.indexOf(item);
                const isSelected = idx === selected;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    onMouseEnter={() => setSelected(idx)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 transition-all text-left"
                    style={{ background: isSelected ? "rgba(75,139,219,0.08)" : "transparent" }}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors" style={{ background: isSelected ? "rgba(75,139,219,0.15)" : "rgba(255,255,255,0.04)", color: isSelected ? "#4B8BDB" : "rgba(255,255,255,0.4)" }}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: isSelected ? "#fff" : "rgba(255,255,255,0.75)" }}>
                          {highlightMatch(item.label, query)}
                        </span>
                        {item.badge && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest" style={{ color: item.badgeColor ?? "#4B8BDB", background: `${item.badgeColor ?? "#4B8BDB"}18` }}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <div className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.3)" }}>
                          {highlightMatch(item.description, query)}
                        </div>
                      )}
                    </div>
                    {isSelected && <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(75,139,219,0.5)" }} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 border-t" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)" }}>
          <div className="flex items-center gap-3 text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>
            <span className="flex items-center gap-1"><ArrowRight className="w-2.5 h-2.5" /> Select</span>
            <span>↑↓ Navigate</span>
            <span>ESC Close</span>
          </div>
          <div className="flex items-center gap-1 text-[9px]" style={{ color: "rgba(75,139,219,0.4)" }}>
            <Command className="w-3 h-3" />
            <span>Alloy Command Bar</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CommandBarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all hover:border-blue-400/30 hover:bg-white/5"
      style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.02)" }}
    >
      <Search className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Search or type /</span>
      <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9px] font-mono" style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.25)" }}>
        <Command className="w-2.5 h-2.5" />K
      </div>
    </button>
  );
}

export function useCommandBar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(o => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false), toggle: () => setIsOpen(o => !o) };
}
