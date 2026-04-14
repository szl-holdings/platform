import { cn } from "@/lib/utils";
import {
  Activity, GitBranch, Zap, Shield, ChevronLeft, ChevronRight,
  Network, TerminalSquare, Settings2, Image, Cpu, Target
} from "lucide-react";

type Page = "timeline" | "canvas" | "correlations" | "rooms" | "actions" | "deal-autopilot" | "settings" | "multimodal" | "swarm";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const NAV_ITEMS: Array<{ id: Page; label: string; icon: React.ComponentType<{ className?: string }>; description: string; badge?: string }> = [
  { id: "timeline", label: "Fusion Timeline", icon: Activity, description: "Live cross-domain event stream" },
  { id: "canvas", label: "Entity Canvas", icon: GitBranch, description: "Interactive relationship graph" },
  { id: "correlations", label: "Correlations", icon: Zap, description: "AI pattern detection" },
  { id: "rooms", label: "Situation Rooms", icon: Shield, description: "Persistent investigations" },
  { id: "actions", label: "Command Actions", icon: TerminalSquare, description: "Cross-domain triggers" },
  { id: "deal-autopilot", label: "Deal Autopilot", icon: Target, description: "AI underwriting packages", badge: "NEW" },
  { id: "multimodal", label: "Multimodal Gallery", icon: Image, description: "Annotated multimedia evidence" },
  { id: "swarm", label: "Agent Swarm", icon: Cpu, description: "Real-time A2A network graph" },
  { id: "settings", label: "Settings", icon: Settings2, description: "Domain toggles & routing rules" },
];

export default function Sidebar({ currentPage, onNavigate, isOpen, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col bg-[hsl(226_24%_4%)] border-r border-border transition-all duration-200 ease-in-out flex-shrink-0",
        isOpen ? "w-56" : "w-14"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <div className="w-7 h-7 flex-shrink-0 rounded-lg bg-[hsl(258_80%_62%)] flex items-center justify-center">
          <Network className="w-4 h-4 text-white" />
        </div>
        {isOpen && (
          <div className="min-w-0">
            <div className="text-sm font-bold text-gradient-nexus font-display leading-none">NEXUS</div>
            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">FUSION CANVAS</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-2 py-2.5 rounded-md text-left transition-all duration-150 group",
                active
                  ? "bg-[hsla(258,80%,62%,0.12)] text-[hsl(258_80%_72%)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-[hsl(228_20%_7%)]"
              )}
              title={!isOpen ? item.label : undefined}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0", active && "text-[hsl(258_80%_72%)]")} />
              {isOpen && (
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <div className={cn("text-sm font-medium leading-none", active && "text-[hsl(258_80%_78%)]")}>
                      {item.label}
                    </div>
                    {item.badge && (
                      <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-[hsl(258_80%_62%)] text-white leading-none">{item.badge}</span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{item.description}</div>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Domain indicators */}
      {isOpen && (
        <div className="px-3 py-3 border-t border-border">
          <div className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider mb-2">Active Domains</div>
          <div className="flex flex-wrap gap-1">
            {["Vessels", "Aegis", "Terra", "PRISM", "Lyte"].map((d) => (
              <span
                key={d}
                className="text-[9px] px-1.5 py-0.5 rounded font-mono border"
                style={{
                  color: domainColor(d.toLowerCase()),
                  borderColor: `${domainColor(d.toLowerCase())}44`,
                  background: `${domainColor(d.toLowerCase())}11`,
                }}
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-10 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </aside>
  );
}

function domainColor(domain: string): string {
  const map: Record<string, string> = {
    vessels: "hsl(206,72%,52%)",
    aegis: "hsl(222,60%,62%)",
    terra: "hsl(140,50%,48%)",
    prism: "hsl(38,72%,58%)",
    lyte: "hsl(192,85%,46%)",
  };
  return map[domain] ?? "hsl(258,80%,62%)";
}
