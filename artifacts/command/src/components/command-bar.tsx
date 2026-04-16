import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Search, X, Loader2, ArrowRight, Command,
  LayoutDashboard, Activity, CheckSquare, Shield, AlertTriangle,
  Radio, Brain, Heart, Inbox, Users, Workflow, Network,
  Zap, FileText, BarChart3, Globe, Phone, DollarSign,
  GitBranch, Database, Bot
} from "lucide-react";
import { getDomainColor, getSeverityColor } from "../lib/utils";

interface SearchResult {
  type: string;
  domain: string;
  title: string;
  detail: string;
  severity?: string;
  href?: string;
}

interface QuickNavItem {
  href: string;
  label: string;
  section: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color?: string;
  shortcut?: string;
}

const QUICK_NAV: QuickNavItem[] = [
  { href: "/operations", label: "Executive Command", section: "Operations", icon: LayoutDashboard, color: "#d4a054", shortcut: "O" },
  { href: "/operations/approvals", label: "Approvals Center", section: "Operations", icon: CheckSquare, color: "#2dd4bf" },
  { href: "/operations/inbox", label: "Command Inbox", section: "Operations", icon: Inbox, color: "#d4a054" },
  { href: "/operations/blocker-board", label: "Blocker Board", section: "Operations", icon: AlertTriangle, color: "#c45a4a" },
  { href: "/operations/trust-audit", label: "Trust & Audit", section: "Operations", icon: Shield, color: "#8b7ac8" },
  { href: "/operations/action-queue", label: "Action Queue", section: "Operations", icon: Activity, color: "#d4a054" },
  { href: "/operations/digest", label: "Digest Center", section: "Operations", icon: FileText, color: "#d4a054" },
  { href: "/operations/escalation", label: "Escalation Center", section: "Operations", icon: AlertTriangle, color: "#c45a4a" },
  { href: "/operations/prism/signals", label: "Signals Feed", section: "Intelligence", icon: Radio, color: "#c8953c" },
  { href: "/operations/prism/pulse", label: "Pulse", section: "Intelligence", icon: Heart, color: "#d4a054" },
  { href: "/operations/prism/risk", label: "Risk", section: "Intelligence", icon: AlertTriangle, color: "#c45a4a" },
  { href: "/operations/prism/intelligence", label: "Intelligence", section: "Intelligence", icon: Brain, color: "#8b7ac8" },
  { href: "/operations/predictive-intelligence", label: "Predictive Intel", section: "Intelligence", icon: Zap, color: "#8b7ac8" },
  { href: "/operations/business-signals", label: "Business Signals", section: "Intelligence", icon: DollarSign, color: "#6b8f71" },
  { href: "/operations/ownership", label: "Ownership Map", section: "Governance", icon: Users, color: "#38bdf8" },
  { href: "/operations/alloy/governance", label: "Governance", section: "Governance", icon: Shield, color: "#8b7ac8" },
  { href: "/operations/topology", label: "Service Topology", section: "Observability", icon: Network, color: "#4a90b8" },
  { href: "/operations/tracing", label: "Distributed Tracing", section: "Observability", icon: GitBranch, color: "#4a90b8" },
  { href: "/operations/logs", label: "Log Analytics", section: "Observability", icon: Database, color: "#6b7280" },
  { href: "/operations/slo", label: "SLO Management", section: "Observability", icon: BarChart3, color: "#22c55e" },
  { href: "/operations/on-call", label: "On-Call Management", section: "Observability", icon: Phone, color: "#d4a054" },
  { href: "/operations/autonomous-noc", label: "Autonomous NOC", section: "Autonomous", icon: Bot, color: "#8b7ac8" },
  { href: "/operations/alloy/canvas", label: "Workflow Canvas", section: "Autonomous", icon: Workflow, color: "#4a90b8" },
  { href: "/operations/alloy/agents", label: "Agent Monitor", section: "Autonomous", icon: Brain, color: "#8b7ac8" },
  { href: "/strategy", label: "Strategy Dashboard", section: "Strategy", icon: Globe, color: "#8b7ac8", shortcut: "S" },
  { href: "/infrastructure", label: "Infrastructure", section: "Infrastructure", icon: Network, color: "#c9a227", shortcut: "I" },
];

interface CommandBarProps {
  open: boolean;
  onClose: () => void;
}

const BG_ELEVATED = "#10141e";
const BORDER_SUBTLE = "rgba(255,255,255,0.06)";
const TEXT_PRIMARY = "rgba(255,255,255,0.88)";
const TEXT_SECONDARY = "rgba(255,255,255,0.5)";
const TEXT_MUTED = "rgba(255,255,255,0.28)";
const ELECTRIC = "#2dd4bf";

export function CommandBar({ open, onClose }: CommandBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/command/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
      if (res.ok) {
        const body = await res.json();
        setResults(body.results ?? []);
        setSelected(0);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  const filteredNav = query.trim()
    ? QUICK_NAV.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.section.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const totalItems = query.trim() ? [...filteredNav, ...results].length : QUICK_NAV.length;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, totalItems - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
      if (e.key === "Enter") {
        e.preventDefault();
        if (query.trim()) {
          const allItems = [...filteredNav, ...results];
          const item = allItems[selected];
          if (item) {
            const href = (item as QuickNavItem).href ?? resolveResultHref(item as SearchResult);
            if (href) { navigate(href); onClose(); }
          }
        } else {
          const item = QUICK_NAV[selected];
          if (item) { navigate(item.href); onClose(); }
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, results, filteredNav, selected, totalItems, query, navigate]);

  if (!open) return null;

  const typeLabel: Record<string, string> = { event: "Event", intelligence: "Intel", domain: "Domain" };

  function resolveResultHref(result: SearchResult): string | undefined {
    if (result.href) return result.href;
    const domain = result.domain?.toLowerCase();
    const type = result.type?.toLowerCase();
    if (type === "domain") {
      const domainRoutes: Record<string, string> = {
        prism: "/operations/prism/pulse",
        terra: "/strategy/domain/terra",
        vessels: "/strategy/domain/vessels",
        aegis: "/strategy/domain/aegis",
      };
      return domainRoutes[domain] ?? "/strategy";
    }
    if (type === "event" || type === "intelligence") {
      const packRoutes: Record<string, string> = {
        prism: "/operations/prism/signals",
        terra: "/operations/prism/signals",
        vessels: "/operations/prism/signals",
        aegis: "/operations/prism/signals",
      };
      return packRoutes[domain] ?? "/operations/prism/signals";
    }
    return undefined;
  }

  const navSections = query.trim() ? null : QUICK_NAV.reduce<Record<string, QuickNavItem[]>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  let globalIdx = 0;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[8vh]"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl mx-4 rounded-xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: BG_ELEVATED, border: `1px solid ${BORDER_SUBTLE}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${BORDER_SUBTLE}` }}>
          <div className="flex items-center gap-2 px-1.5 py-0.5 rounded text-[9px] font-mono shrink-0" style={{ background: "rgba(45,212,191,0.08)", border: `1px solid rgba(45,212,191,0.15)`, color: ELECTRIC }}>
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: TEXT_MUTED }} />
          ) : (
            <Search className="w-4 h-4 shrink-0" style={{ color: TEXT_MUTED }} />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            placeholder="Navigate, search signals, alerts, domains..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: TEXT_PRIMARY }}
            aria-label="Command palette search"
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); }} style={{ color: TEXT_MUTED }} aria-label="Clear search">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="max-h-[65vh] overflow-y-auto">
          {/* Empty query: show quick nav grouped by section */}
          {!query.trim() && navSections && (
            <div className="py-1">
              {Object.entries(navSections).map(([section, items]) => (
                <div key={section}>
                  <div className="px-4 py-1.5 text-[9px] font-medium uppercase tracking-widest" style={{ color: TEXT_MUTED }}>
                    {section}
                  </div>
                  {items.map((item) => {
                    const idx = globalIdx++;
                    const isSelected = selected === idx;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.href}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors"
                        style={{ background: isSelected ? "rgba(255,255,255,0.04)" : "transparent" }}
                        onMouseEnter={() => setSelected(idx)}
                        onClick={() => { navigate(item.href); onClose(); }}
                        aria-selected={isSelected}
                      >
                        <div className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ background: `${item.color ?? ELECTRIC}12` }}>
                          <Icon className="w-3 h-3" style={{ color: item.color ?? ELECTRIC }} />
                        </div>
                        <span className="flex-1 text-[11px] font-medium" style={{ color: isSelected ? TEXT_PRIMARY : TEXT_SECONDARY }}>
                          {item.label}
                        </span>
                        {item.shortcut && (
                          <kbd className="text-[8px] px-1 py-0.5 rounded font-mono" style={{ background: "rgba(255,255,255,0.05)", color: TEXT_MUTED }}>
                            {item.shortcut}
                          </kbd>
                        )}
                        {isSelected && <ArrowRight className="w-3 h-3 shrink-0" style={{ color: TEXT_MUTED }} />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Query: show filtered nav + API results */}
          {query.trim() && (
            <div className="py-1">
              {filteredNav.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[9px] font-medium uppercase tracking-widest" style={{ color: TEXT_MUTED }}>Navigate to</div>
                  {filteredNav.map((item) => {
                    const idx = globalIdx++;
                    const isSelected = selected === idx;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.href}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors"
                        style={{ background: isSelected ? "rgba(255,255,255,0.04)" : "transparent" }}
                        onMouseEnter={() => setSelected(idx)}
                        onClick={() => { navigate(item.href); onClose(); }}
                        aria-selected={isSelected}
                      >
                        <div className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ background: `${item.color ?? ELECTRIC}12` }}>
                          <Icon className="w-3 h-3" style={{ color: item.color ?? ELECTRIC }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-medium block" style={{ color: isSelected ? TEXT_PRIMARY : TEXT_SECONDARY }}>{item.label}</span>
                          <span className="text-[9px]" style={{ color: TEXT_MUTED }}>{item.section}</span>
                        </div>
                        {isSelected && <ArrowRight className="w-3 h-3 shrink-0" style={{ color: TEXT_MUTED }} />}
                      </button>
                    );
                  })}
                </div>
              )}

              {results.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-[9px] font-medium uppercase tracking-widest" style={{ color: TEXT_MUTED, borderTop: filteredNav.length > 0 ? `1px solid ${BORDER_SUBTLE}` : "none" }}>
                    Signals & Events
                  </div>
                  {results.map((result, i) => {
                    const idx = globalIdx++;
                    const isSelected = selected === idx;
                    const resolvedHref = resolveResultHref(result);
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3 px-4 py-2.5 transition-colors"
                        style={{ background: isSelected ? "rgba(255,255,255,0.04)" : "transparent", cursor: resolvedHref ? "pointer" : "default" }}
                        onMouseEnter={() => setSelected(idx)}
                        onClick={() => { if (resolvedHref) { navigate(resolvedHref); onClose(); } }}
                        aria-selected={isSelected}
                        title={!resolvedHref ? "No direct navigation available — open the signals feed for details" : undefined}
                      >
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{
                                color: getDomainColor(result.domain),
                                backgroundColor: `${getDomainColor(result.domain)}1a`,
                              }}
                            >
                              {result.domain}
                            </span>
                            <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: TEXT_MUTED }}>
                              {typeLabel[result.type] ?? result.type}
                            </span>
                            {result.severity && (
                              <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: getSeverityColor(result.severity) }}>
                                {result.severity}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-medium" style={{ color: isSelected ? TEXT_PRIMARY : TEXT_SECONDARY }}>
                            {result.title}
                          </span>
                          <span className="text-[10px] truncate" style={{ color: TEXT_MUTED }}>
                            {result.detail}
                          </span>
                        </div>
                        {isSelected && resolvedHref && <ArrowRight className="w-3 h-3 shrink-0 mt-1" style={{ color: TEXT_MUTED }} />}
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredNav.length === 0 && results.length === 0 && !loading && (
                <div className="px-4 py-8 text-center">
                  <p className="text-[11px]" style={{ color: TEXT_MUTED }}>No results for "{query}"</p>
                  <p className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.15)" }}>Try a domain name, page, or signal keyword</p>
                </div>
              )}

              {loading && (
                <div className="px-4 py-4 flex items-center justify-center gap-2" style={{ color: TEXT_MUTED }}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-[10px] font-mono">Searching...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-2 flex items-center gap-5 text-[9px] font-mono"
          style={{ borderTop: `1px solid ${BORDER_SUBTLE}`, color: TEXT_MUTED }}
        >
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded text-[8px]" style={{ background: "rgba(255,255,255,0.05)" }}>↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded text-[8px]" style={{ background: "rgba(255,255,255,0.05)" }}>↵</kbd> go</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded text-[8px]" style={{ background: "rgba(255,255,255,0.05)" }}>esc</kbd> close</span>
          <span className="ml-auto" style={{ color: "rgba(255,255,255,0.1)" }}>
            {totalItems > 0 ? `${totalItems} items` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
