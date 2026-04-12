import { type Page } from "../App";
import { cn } from "../lib/utils";
import {
  LayoutDashboard,
  Telescope,
  Network,
  Zap,
  Server,
  BarChart3,
  FlaskConical,
  ChevronRight,
  Brain,
} from "lucide-react";

interface NavItem {
  id: Page;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", sublabel: "System overview", icon: LayoutDashboard },
  { id: "intelligence", label: "Model Intelligence", sublabel: "HuggingFace + arXiv feed", icon: Telescope },
  { id: "nuro-mesh", label: "Nuro Mesh", sublabel: "Agent topology command", icon: Network },
  { id: "gateway", label: "AI Gateway", sublabel: "Routing & telemetry", icon: Zap },
  { id: "deployment", label: "Deployment Runway", sublabel: "Self-hosted readiness", icon: Server },
  { id: "observatory", label: "LLMOps Observatory", sublabel: "Usage & compliance", icon: BarChart3 },
  { id: "lab", label: "Model Lab", sublabel: "A/B testing & prompts", icon: FlaskConical },
];

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 border-r border-border bg-background flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2.5 mb-0.5">
          <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/25 flex items-center justify-center flex-shrink-0">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-display font-semibold text-foreground leading-none">INCA Lab</div>
            <div className="text-xs text-muted-foreground mt-0.5 leading-none">AI Command Platform</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group",
                active
                  ? "bg-primary/8 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <div className="flex-1 min-w-0">
                <div className={cn("text-sm font-medium leading-none", active ? "text-primary" : "")}>{item.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-none truncate">{item.sublabel}</div>
              </div>
              {active && <ChevronRight className="w-3 h-3 text-primary flex-shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot flex-shrink-0" />
          <div>
            <div className="text-xs text-muted-foreground">Nuro Mesh</div>
            <div className="text-xs font-medium text-foreground">8 agents active</div>
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">SZL Holdings · v2.4.1</div>
      </div>
    </aside>
  );
}
