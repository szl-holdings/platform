import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { cn } from "./utils";

export interface EnergyMetrics {
  apiCallsPerMinute: number;
  wsMessagesPerMinute: number;
  chartRendersPerMinute: number;
  dataRefreshesPerMinute: number;
  activeSubscriptions: number;
  deferredUpdates: number;
  totalBudget: number;
  usedBudget: number;
}

export interface EnergyHeartbeatConfig {
  budgetPerMinute?: number;
  batchThresholdMs?: number;
  deferInvisible?: boolean;
  lowPowerMode?: boolean;
}

const DEFAULT_BUDGET = 120;

export function useEnergyHeartbeat(config: EnergyHeartbeatConfig = {}) {
  const { budgetPerMinute = DEFAULT_BUDGET } = config;

  const countersRef = useRef({
    apiCalls: 0,
    wsMessages: 0,
    chartRenders: 0,
    dataRefreshes: 0,
    activeSubscriptions: 0,
    deferred: 0,
  });

  const [metrics, setMetrics] = useState<EnergyMetrics>({
    apiCallsPerMinute: 0,
    wsMessagesPerMinute: 0,
    chartRendersPerMinute: 0,
    dataRefreshesPerMinute: 0,
    activeSubscriptions: 0,
    deferredUpdates: 0,
    totalBudget: budgetPerMinute,
    usedBudget: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const c = countersRef.current;
      const used = c.apiCalls + c.wsMessages + c.chartRenders + c.dataRefreshes;
      setMetrics({
        apiCallsPerMinute: c.apiCalls,
        wsMessagesPerMinute: c.wsMessages,
        chartRendersPerMinute: c.chartRenders,
        dataRefreshesPerMinute: c.dataRefreshes,
        activeSubscriptions: c.activeSubscriptions,
        deferredUpdates: c.deferred,
        totalBudget: budgetPerMinute,
        usedBudget: used,
      });
      c.apiCalls = 0;
      c.wsMessages = 0;
      c.chartRenders = 0;
      c.dataRefreshes = 0;
      c.deferred = 0;
    }, 60000);
    return () => clearInterval(interval);
  }, [budgetPerMinute]);

  const recordApiCall = useCallback(() => { countersRef.current.apiCalls++; }, []);
  const recordWsMessage = useCallback(() => { countersRef.current.wsMessages++; }, []);
  const recordChartRender = useCallback(() => { countersRef.current.chartRenders++; }, []);
  const recordDataRefresh = useCallback(() => { countersRef.current.dataRefreshes++; }, []);
  const recordDeferred = useCallback(() => { countersRef.current.deferred++; }, []);

  const utilization = useMemo(() => {
    if (metrics.totalBudget === 0) return 0;
    return Math.min(1, metrics.usedBudget / metrics.totalBudget);
  }, [metrics.usedBudget, metrics.totalBudget]);

  return {
    metrics,
    utilization,
    recordApiCall,
    recordWsMessage,
    recordChartRender,
    recordDataRefresh,
    recordDeferred,
  };
}

export interface EnergyPulseProps {
  metrics: EnergyMetrics;
  utilization: number;
  accentColor?: string;
  className?: string;
  size?: "sm" | "md";
}

export function EnergyPulse({
  metrics,
  utilization,
  accentColor = "#10b981",
  className,
  size = "sm",
}: EnergyPulseProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const statusColor = utilization > 0.85 ? "#ef4444" : utilization > 0.6 ? "#f59e0b" : accentColor;
  const pulseSize = size === "sm" ? 8 : 12;

  return (
    <div
      className={cn("relative inline-flex items-center gap-1.5 cursor-pointer", className)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="relative" style={{ width: pulseSize, height: pulseSize }}>
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: statusColor, opacity: 0.3 }}
        />
        <div
          className="relative rounded-full"
          style={{ width: pulseSize, height: pulseSize, background: statusColor }}
        />
      </div>
      {size === "md" && (
        <span className="text-[10px] text-white/40 font-mono">
          {Math.round(utilization * 100)}%
        </span>
      )}

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 bg-neutral-900 border border-white/10 rounded-lg p-3 shadow-xl min-w-[180px]">
          <div className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-2">
            Energy Heartbeat
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-white/50">API calls/min</span>
              <span className="text-white/80 font-mono">{metrics.apiCallsPerMinute}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">WS msgs/min</span>
              <span className="text-white/80 font-mono">{metrics.wsMessagesPerMinute}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Chart renders</span>
              <span className="text-white/80 font-mono">{metrics.chartRendersPerMinute}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Deferred</span>
              <span className="text-white/80 font-mono">{metrics.deferredUpdates}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-white/10">
              <span className="text-white/50">Budget</span>
              <span className="font-mono" style={{ color: statusColor }}>
                {metrics.usedBudget}/{metrics.totalBudget}
              </span>
            </div>
          </div>
          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${utilization * 100}%`, background: statusColor }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
