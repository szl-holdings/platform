import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Layers, GitBranch, CheckSquare, FlaskConical, LayoutDashboard,
  ChevronRight, Activity, Shield, User, Search, Zap, AlertTriangle,
} from "lucide-react";
import type { Perspective } from "./types";

const ACCENT = "#22d3ee";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
}

const PERSPECTIVE_OPTIONS: { value: Perspective; label: string; icon: React.ElementType; description: string }[] = [
  { value: "executive", label: "Executive", icon: Zap, description: "Posture, KPIs, risk summary" },
  { value: "operator", label: "Operator", icon: Activity, description: "In-flight runs, live trajectory" },
  { value: "analyst", label: "Analyst", icon: FlaskConical, description: "Evidence, traces, counterfactuals" },
  { value: "approver", label: "Approver", icon: CheckSquare, description: "Unified approval queue" },
];

const NAV_SECTIONS: Array<{ heading: string; items: NavItem[] }> = [
  {
    heading: "",
    items: [
      { href: "/substrate", label: "Trajectory Map", icon: LayoutDashboard, exact: true },
      { href: "/substrate/approvals", label: "Approval Queue", icon: CheckSquare },
    ],
  },
  {
    heading: "Analysis",
    items: [
      { href: "/substrate/counterfactual", label: "Counterfactual Diff", icon: GitBranch },
    ],
  },
];

function formatAge(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600_000) return `${Math.round(ms / 60_000)}m`;
  return `${Math.round(ms / 3600_000)}h`;
}

export { formatAge };

interface SubstrateLayoutProps {
  children: ReactNode;
  pendingCount?: number;
}

export function SubstrateLayout({ children, pendingCount = 0 }: SubstrateLayoutProps) {
  const [location] = useLocation();
  const [perspective, setPerspective] = useState<Perspective>(() => {
    try { return (localStorage.getItem("substrate-perspective") as Perspective) || "operator"; } catch { return "operator"; }
  });
  const [perspectiveOpen, setPerspectiveOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("substrate-perspective", perspective); } catch {}
  }, [perspective]);

  const currentPerspective = PERSPECTIVE_OPTIONS.find(p => p.value === perspective)!;
  const PerspIcon = currentPerspective.icon;

  function isActive(href: string, exact?: boolean): boolean {
    return exact ? location === href || location === href + "/" : location.startsWith(href);
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "hsl(214,16%,4%)", color: "hsl(38,8%,92%)" }}>
      {/* Sidebar */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col border-r overflow-y-auto"
        style={{ background: "hsl(214,12%,8%)", borderColor: "hsla(0,0%,100%,0.08)" }}
      >
        {/* Identity */}
        <div className="px-4 py-4 border-b" style={{ borderColor: "hsla(0,0%,100%,0.08)" }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}40` }}>
              <Layers className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wider" style={{ color: ACCENT }}>SUBSTRATE</p>
              <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "hsl(214,7%,35%)" }}>Command Center</p>
            </div>
          </div>
        </div>

        {/* Perspective Switcher */}
        <div className="px-3 py-3 border-b" style={{ borderColor: "hsla(0,0%,100%,0.08)" }}>
          <p className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: "hsl(214,7%,35%)" }}>Perspective</p>
          <button
            onClick={() => setPerspectiveOpen(v => !v)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors"
            style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}30`, color: "hsl(38,8%,92%)" }}
          >
            <span className="flex items-center gap-2">
              <PerspIcon className="w-3 h-3" style={{ color: ACCENT }} />
              {currentPerspective.label}
            </span>
            <ChevronRight className={`w-3 h-3 transition-transform ${perspectiveOpen ? "rotate-90" : ""}`} style={{ color: "hsl(214,7%,35%)" }} />
          </button>
          {perspectiveOpen && (
            <div className="mt-1 rounded-md overflow-hidden border" style={{ borderColor: "hsla(0,0%,100%,0.1)", background: "hsl(214,10%,11%)" }}>
              {PERSPECTIVE_OPTIONS.map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => { setPerspective(opt.value); setPerspectiveOpen(false); }}
                    className="w-full flex items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-white/5"
                  >
                    <Icon className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: opt.value === perspective ? ACCENT : "hsl(214,7%,55%)" }} />
                    <div>
                      <p className="text-[11px] font-medium" style={{ color: opt.value === perspective ? ACCENT : "hsl(38,8%,92%)" }}>{opt.label}</p>
                      <p className="text-[9px]" style={{ color: "hsl(214,7%,35%)" }}>{opt.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-4">
          {NAV_SECTIONS.map((section, si) => (
            <div key={si}>
              {section.heading && (
                <p className="text-[9px] font-mono uppercase tracking-widest mb-1.5 px-2" style={{ color: "hsl(214,7%,35%)" }}>{section.heading}</p>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const active = isActive(item.href, item.exact);
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}>
                      <a
                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors"
                        style={{
                          background: active ? `${ACCENT}15` : "transparent",
                          color: active ? ACCENT : "hsl(214,7%,55%)",
                          borderLeft: active ? `2px solid ${ACCENT}` : "2px solid transparent",
                        }}
                      >
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{item.label}</span>
                        {item.label === "Approval Queue" && pendingCount > 0 && (
                          <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: "#ef444420", color: "#ef4444" }}>{pendingCount}</span>
                        )}
                      </a>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Status Bar */}
        <div className="px-3 py-3 border-t space-y-1" style={{ borderColor: "hsla(0,0%,100%,0.08)" }}>
          <div className="flex items-center gap-2 px-2">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
            <span className="text-[9px] font-mono" style={{ color: "hsl(214,7%,35%)" }}>Substrate connected</span>
          </div>
          <Link href="/strategy">
            <a className="flex items-center gap-2 px-2 py-1 rounded text-[9px] transition-colors hover:bg-white/5" style={{ color: "hsl(214,7%,35%)" }}>
              <ChevronRight className="w-3 h-3 rotate-180" />
              Back to Command
            </a>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <PerspectiveBanner perspective={perspective} />
        {children}
      </main>
    </div>
  );
}

function PerspectiveBanner({ perspective }: { perspective: Perspective }) {
  const config: Record<Perspective, { color: string; label: string; icon: React.ElementType; hint: string }> = {
    executive: { color: "#f59e0b", label: "Executive View", icon: Zap, hint: "Risk posture & KPI summary" },
    operator: { color: ACCENT, label: "Operator View", icon: Activity, hint: "Live trajectory & run management" },
    analyst: { color: "#8b5cf6", label: "Analyst View", icon: Search, hint: "Evidence, traces & counterfactuals" },
    approver: { color: "#22c55e", label: "Approver View", icon: Shield, hint: "Pending decisions requiring your action" },
  };
  const cfg = config[perspective];
  const Icon = cfg.icon;
  return (
    <div className="flex items-center gap-3 px-6 py-2 border-b" style={{ background: `${cfg.color}08`, borderColor: `${cfg.color}20` }}>
      <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
      <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</span>
      <span className="text-[10px]" style={{ color: "hsl(214,7%,35%)" }}>—</span>
      <span className="text-[10px]" style={{ color: "hsl(214,7%,55%)" }}>{cfg.hint}</span>
    </div>
  );
}
