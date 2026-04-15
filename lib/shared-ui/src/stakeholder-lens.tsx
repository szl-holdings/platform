import { useState, createContext, useContext, useCallback, type ReactNode } from "react";
import { cn } from "./utils";

export type StakeholderView = "executive" | "investor" | "operator" | "client";

export interface StakeholderLensConfig {
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const STAKEHOLDER_VIEWS: Record<StakeholderView, StakeholderLensConfig> = {
  executive: {
    label: "Executive",
    description: "Strategic KPIs, trends & summaries",
    icon: "👔",
    color: "#8b5cf6",
  },
  investor: {
    label: "Investor",
    description: "Compliance, benchmarks & risk-adjusted returns",
    icon: "📊",
    color: "#3b82f6",
  },
  operator: {
    label: "Operator",
    description: "Full granularity, alerts & action queues",
    icon: "⚙️",
    color: "#10b981",
  },
  client: {
    label: "Client",
    description: "Simplified progress & deliverables",
    icon: "👤",
    color: "#f59e0b",
  },
};

interface StakeholderLensContextType {
  view: StakeholderView;
  setView: (view: StakeholderView) => void;
  config: StakeholderLensConfig;
}

const StakeholderLensContext = createContext<StakeholderLensContextType>({
  view: "operator",
  setView: () => {},
  config: STAKEHOLDER_VIEWS.operator,
});

export function useStakeholderLens() {
  return useContext(StakeholderLensContext);
}

export function StakeholderLensProvider({
  children,
  defaultView = "operator",
}: {
  children: ReactNode;
  defaultView?: StakeholderView;
}) {
  const [view, setView] = useState<StakeholderView>(defaultView);

  return (
    <StakeholderLensContext.Provider
      value={{ view, setView, config: STAKEHOLDER_VIEWS[view] }}
    >
      {children}
    </StakeholderLensContext.Provider>
  );
}

export interface StakeholderLensSwitcherProps {
  className?: string;
  compact?: boolean;
  accentColor?: string;
}

export function StakeholderLensSwitcher({
  className,
  compact = false,
  accentColor,
}: StakeholderLensSwitcherProps) {
  const { view, setView, config } = useStakeholderLens();
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-white/10 hover:border-white/20 transition-colors text-xs"
        style={{ color: config.color }}
      >
        <span>{config.icon}</span>
        {!compact && <span className="font-medium">{config.label}</span>}
        <span className="text-white/30">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-neutral-900 border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[200px]">
            {(Object.entries(STAKEHOLDER_VIEWS) as [StakeholderView, StakeholderLensConfig][]).map(
              ([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => { setView(key); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/5 transition-colors",
                    view === key && "bg-white/5",
                  )}
                >
                  <span className="text-base">{cfg.icon}</span>
                  <div>
                    <div className="text-xs font-medium" style={{ color: view === key ? cfg.color : "rgba(255,255,255,0.7)" }}>
                      {cfg.label}
                    </div>
                    <div className="text-[10px] text-white/35">{cfg.description}</div>
                  </div>
                  {view === key && (
                    <span className="ml-auto text-[10px]" style={{ color: cfg.color }}>●</span>
                  )}
                </button>
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function StakeholderContent({
  executive,
  investor,
  operator,
  client,
}: {
  executive?: ReactNode;
  investor?: ReactNode;
  operator?: ReactNode;
  client?: ReactNode;
}) {
  const { view } = useStakeholderLens();
  const content = { executive, investor, operator, client }[view];
  return <>{content ?? null}</>;
}
