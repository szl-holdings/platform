import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Brain, Cpu, Globe, Activity, ArrowLeft } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const ACCENT = "#8b7ac8";
const BG = "#080c14";
const BORDER = "rgba(139,122,200,0.12)";

const NAV_ITEMS = [
  { href: "/cognitive", label: "Command Center", icon: Activity, sublabel: "Runtime state" },
  { href: "/cognitive/self-model", label: "Self Model", icon: Cpu, sublabel: "Identity & drift" },
  { href: "/cognitive/world-model", label: "World Model", icon: Globe, sublabel: "CONSTELLATION graph" },
];

export function CognitiveLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col h-full" style={{ background: BG, color: "var(--color-fg-primary)" }}>
      <div
        className="shrink-0 flex items-center gap-0 border-b"
        style={{ borderColor: BORDER, background: "rgba(6,10,18,0.95)", backdropFilter: "blur(8px)" }}
      >
        <Link
          href={`${BASE}/strategy`}
          className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] hover:opacity-80 transition-opacity border-r shrink-0"
          style={{ color: "rgba(255,255,255,0.3)", borderColor: BORDER }}
        >
          <ArrowLeft className="w-3 h-3" />
          Strategy
        </Link>

        <div className="flex items-center gap-2 px-4 shrink-0">
          <div
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{ background: `${ACCENT}14`, border: `1px solid ${ACCENT}25` }}
          >
            <Brain className="w-3 h-3" style={{ color: ACCENT }} />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wide" style={{ color: "rgba(255,255,255,0.9)" }}>
              Cognitive Consoles
            </span>
          </div>
        </div>

        <div className="flex items-center gap-0 ml-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/cognitive"
                ? location === "/cognitive"
                : location.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={`${BASE}${item.href}`}
                className="flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-medium transition-all relative"
                style={{
                  color: isActive ? ACCENT : "rgba(255,255,255,0.4)",
                  borderBottom: isActive ? `2px solid ${ACCENT}` : "2px solid transparent",
                }}
              >
                <Icon className="w-3 h-3 shrink-0" style={{ color: isActive ? ACCENT : "rgba(255,255,255,0.25)" }} />
                {item.label}
                <span
                  className="hidden sm:inline text-[8px] ml-0.5"
                  style={{ color: isActive ? `${ACCENT}70` : "rgba(255,255,255,0.2)" }}
                >
                  · {item.sublabel}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
