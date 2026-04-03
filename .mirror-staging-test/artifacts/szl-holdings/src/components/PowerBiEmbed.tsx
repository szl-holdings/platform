import { useState, useEffect, useRef } from "react";
import { BarChart3, Settings, ExternalLink, AlertCircle, Loader2, RefreshCw, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PowerBiEmbedConfig {
  reportId: string;
  groupId: string;
  embedUrl: string;
  embedToken: string;
}

interface PowerBiEmbedProps {
  config?: PowerBiEmbedConfig | null;
  title?: string;
  description?: string;
  height?: string | number;
  className?: string;
  onConfigureClick?: () => void;
  reportType?: "security_posture" | "portfolio_analytics" | "operational_kpis";
}

const REPORT_PREVIEWS: Record<string, {
  color: string;
  icon: string;
  metrics: Array<{ label: string; value: string; delta: string; up: boolean }>;
}> = {
  security_posture: {
    color: "#3b82f6",
    icon: "🛡️",
    metrics: [
      { label: "Risk Score", value: "34 / 100", delta: "-8 pts", up: false },
      { label: "Open Incidents", value: "12", delta: "-3", up: false },
      { label: "Controls Passing", value: "94.2%", delta: "+1.4%", up: true },
      { label: "Threat Intel Hits", value: "7", delta: "+2", up: false },
    ],
  },
  portfolio_analytics: {
    color: "#10b981",
    icon: "🏢",
    metrics: [
      { label: "Portfolio Value", value: "$48.3M", delta: "+4.1%", up: true },
      { label: "Avg Occupancy", value: "91.4%", delta: "+2.1%", up: true },
      { label: "NOI (YTD)", value: "$3.2M", delta: "+6.8%", up: true },
      { label: "Active Listings", value: "23", delta: "+4", up: true },
    ],
  },
  operational_kpis: {
    color: "#f59e0b",
    icon: "⚡",
    metrics: [
      { label: "SLA Compliance", value: "97.8%", delta: "+0.3%", up: true },
      { label: "Open Escalations", value: "4", delta: "-2", up: false },
      { label: "MTTR (hrs)", value: "2.4", delta: "-0.6", up: false },
      { label: "Signal Volume", value: "1,243", delta: "+18%", up: true },
    ],
  },
};

function MockReportPreview({ reportType, color }: { reportType: string; color: string }) {
  const preview = REPORT_PREVIEWS[reportType] ?? REPORT_PREVIEWS.operational_kpis;
  const bars = [65, 82, 55, 91, 74, 88, 60, 95, 70, 83, 78, 90];
  const linePoints = [40, 55, 48, 62, 58, 72, 65, 80, 74, 85, 79, 92];

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4 overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {preview.metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-border/50 bg-card/50 px-3 py-2.5">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{m.label}</div>
            <div className="text-lg font-bold text-foreground">{m.value}</div>
            <div className={cn("text-[10px] font-semibold mt-0.5", m.up ? "text-emerald-500" : "text-red-400")}>
              {m.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex-1 rounded-xl border border-border/50 bg-card/30 p-3 flex flex-col">
          <div className="text-xs font-semibold text-foreground mb-3">Trend Analysis</div>
          <div className="flex-1 flex items-end gap-1 pb-2">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm opacity-70 transition-all"
                style={{ height: `${h}%`, background: color }}
              />
            ))}
          </div>
        </div>
        <div className="flex-1 rounded-xl border border-border/50 bg-card/30 p-3 flex flex-col">
          <div className="text-xs font-semibold text-foreground mb-3">Performance Curve</div>
          <div className="flex-1 relative">
            <svg viewBox="0 0 120 60" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id={`grad-${reportType}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`M 0,${60 - (linePoints[0] ?? 40) * 0.6} ${linePoints.map((p, i) => `L ${(i / (linePoints.length - 1)) * 120},${60 - p * 0.6}`).join(" ")} L 120,60 L 0,60 Z`}
                fill={`url(#grad-${reportType})`}
              />
              <polyline
                points={linePoints.map((p, i) => `${(i / (linePoints.length - 1)) * 120},${60 - p * 0.6}`).join(" ")}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    powerbi?: {
      embed: (container: HTMLElement, config: unknown) => { off: (event: string) => void };
      models: { TokenType: { Embed: number }; Permissions: { Read: number } };
    };
  }
}

function loadPowerBiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.powerbi) { resolve(); return; }
    const existing = document.querySelector<HTMLScriptElement>("script[data-pbi]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Power BI script")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/powerbi-client@2.23.1/dist/powerbi.js";
    script.dataset.pbi = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Power BI client SDK"));
    document.head.appendChild(script);
  });
}

function PowerBiFrame({ config, title }: { config: PowerBiEmbedConfig; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let reportInstance: ReturnType<NonNullable<typeof window.powerbi>["embed"]> | null = null;

    const init = async () => {
      try {
        await loadPowerBiScript();
        if (!containerRef.current || !window.powerbi) return;

        const pbi = window.powerbi;
        const embedConfig = {
          type: "report",
          id: config.reportId,
          embedUrl: config.embedUrl,
          accessToken: config.embedToken,
          tokenType: pbi.models.TokenType.Embed,
          permissions: pbi.models.Permissions.Read,
          settings: {
            panes: {
              filters: { visible: false },
              pageNavigation: { visible: true },
            },
          },
        };

        reportInstance = pbi.embed(containerRef.current, embedConfig);
        reportInstance.off("loaded");
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize embed");
        setLoading(false);
      }
    };

    init();

    return () => {
      if (containerRef.current && window.powerbi) {
        try {
          window.powerbi.embed(containerRef.current, { type: "report", id: "" });
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [config.reportId, config.embedToken, config.embedUrl]);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <div className="text-sm font-medium text-foreground mb-1">Failed to load report</div>
          <div className="text-xs text-muted-foreground max-w-xs">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Loading {title}…</span>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" aria-label={title} />
    </>
  );
}

export function PowerBiEmbed({
  config,
  title = "Power BI Report",
  description = "Embedded analytics report",
  height = 520,
  className,
  onConfigureClick,
  reportType = "operational_kpis",
}: PowerBiEmbedProps) {
  const isConfigured = !!(config?.embedUrl && config?.embedToken && config?.reportId);
  const preview = REPORT_PREVIEWS[reportType] ?? REPORT_PREVIEWS.operational_kpis;
  const heightValue = typeof height === "number" ? `${height}px` : height;

  return (
    <div className={cn("rounded-2xl border border-border bg-card overflow-hidden flex flex-col", className)} style={{ height: heightValue }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
            style={{ background: preview.color + "22" }}
          >
            <span>{preview.icon}</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground leading-tight">{title}</div>
            <div className="text-[10px] text-muted-foreground">{description}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConfigured && (
            <button
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Open in Power BI"
              onClick={() => window.open(`https://app.powerbi.com/groups/${config!.groupId}/reports/${config!.reportId}`, "_blank")}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
          {onConfigureClick && (
            <button
              onClick={onConfigureClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Settings className="w-3 h-3" />
              {isConfigured ? "Reconfigure" : "Connect"}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {!isConfigured ? (
          <div className="absolute inset-0 flex flex-col">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <MockReportPreview reportType={reportType} color={preview.color} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-xs mx-auto px-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: preview.color + "22" }}
                >
                  <BarChart3 className="w-7 h-7" style={{ color: preview.color }} />
                </div>
                <div className="text-base font-semibold text-foreground mb-1">Connect Power BI</div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  Configure your Power BI workspace credentials to embed live reports and analytics directly in this view.
                </p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground justify-center mb-4">
                  <Lock className="w-3 h-3" />
                  <span>Embed tokens generated server-side · tokens never exposed in URLs</span>
                </div>
                {onConfigureClick && (
                  <button
                    onClick={onConfigureClick}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors"
                    style={{ background: preview.color }}
                  >
                    Configure Connection
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <PowerBiFrame config={config!} title={title} />
        )}
      </div>

      {isConfigured && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-border/40 bg-muted/20 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-muted-foreground">Live · Power BI Embedded · Token server-minted</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">
            Report: {config!.reportId.slice(0, 8)}…
          </span>
        </div>
      )}
    </div>
  );
}
