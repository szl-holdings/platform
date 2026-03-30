import { Card, CardContent } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { GitBranch, Sparkles, Bug, Zap, Shield, RefreshCw } from "lucide-react";

const entries = [
  {
    version: "v3.8.0",
    date: "March 28, 2026",
    type: "minor",
    highlight: "Firestorm XDR Console + Lyte Anomaly Detection launch",
    changes: [
      { type: "feature", text: "Firestorm: Unified XDR Console with cross-source alert correlation and entity risk scoring" },
      { type: "feature", text: "Firestorm: Threat Hunting Workbench with KQL-style query builder and campaign management" },
      { type: "feature", text: "Lyte: Watchdog AI Anomaly Detection with 98.2% noise reduction" },
      { type: "feature", text: "Lyte: SLO Tracking with burn rate alerts and error budget visualization" },
      { type: "improvement", text: "Admin Panel: Connector Health grid with latency heatmaps and failure analytics" },
      { type: "fix", text: "INCA: GPU monitoring panel chart rendering on mobile viewports" },
    ],
  },
  {
    version: "v3.7.0",
    date: "March 12, 2026",
    type: "minor",
    highlight: "Terra Portfolio Performance + MSP RMM Console launch",
    changes: [
      { type: "feature", text: "Terra: Portfolio Performance module with IRR, cash-on-cash, and equity multiple tracking" },
      { type: "feature", text: "Terra: Climate Risk Overlay with flood, wildfire, and sea level exposure scoring" },
      { type: "feature", text: "Terra: Investor Relations module with LP portal and performance reporting" },
      { type: "feature", text: "MSP: RMM Console with endpoint monitoring, patch management, and threat status" },
      { type: "feature", text: "MSP: MRR Dashboard with cohort analysis and churn waterfall visualization" },
      { type: "improvement", text: "Vessels: Fleet map rendering performance improved 40% on large datasets" },
    ],
  },
  {
    version: "v3.6.0",
    date: "February 24, 2026",
    type: "minor",
    highlight: "INCA GPU Monitoring + LLM Evaluation launch",
    changes: [
      { type: "feature", text: "INCA: GPU Cluster Monitoring with thermal, utilization, and memory pressure tracking" },
      { type: "feature", text: "INCA: LLM Evaluation Studio with automated regression testing and A/B model comparison" },
      { type: "feature", text: "Dreamscape: Brand Voice Engine with multi-channel tone calibration" },
      { type: "feature", text: "Dreamscape: Voice Studio with podcast production and waveform editing" },
      { type: "improvement", text: "Readiness Report: Risk Register redesign with dynamic filtering and bulk status updates" },
    ],
  },
  {
    version: "v3.5.2",
    date: "February 10, 2026",
    type: "patch",
    highlight: "Performance fixes and accessibility improvements",
    changes: [
      { type: "fix", text: "Lyte: Command Center dashboard infinite scroll on Firefox fixed" },
      { type: "fix", text: "Terra: Property detail map failing to load on slow connections" },
      { type: "fix", text: "Vessels: Port analytics chart tooltip overlap on dense datasets" },
      { type: "improvement", text: "All apps: ARIA labels and keyboard navigation improvements across navigation" },
      { type: "improvement", text: "All apps: Dark mode contrast ratio improved to meet WCAG AA standards" },
    ],
  },
  {
    version: "v3.5.0",
    date: "January 28, 2026",
    type: "minor",
    highlight: "Readiness Report multi-framework support + Carlota Jo AI Advisory",
    changes: [
      { type: "feature", text: "Readiness Report: Vendor Risk Assessment with 8 risk dimensions and auto-scoring" },
      { type: "feature", text: "Readiness Report: Risk Register with owner assignment and remediation tracking" },
      { type: "feature", text: "Carlota Jo: AI Brand Advisory with real-time competitive positioning analysis" },
      { type: "feature", text: "Carlota Jo: Engagement Workflow tracker with milestone management" },
      { type: "security", text: "Auth token refresh logic hardened against replay attacks" },
    ],
  },
  {
    version: "v3.4.0",
    date: "January 8, 2026",
    type: "minor",
    highlight: "Project List relaunch with spectrum analytics",
    changes: [
      { type: "feature", text: "Project List: Spectrum Analytics dashboard with cross-platform usage intelligence" },
      { type: "feature", text: "Project List: Live Demos directory with embedded previews" },
      { type: "improvement", text: "Navigation: Unified header with SZL branding across all apps" },
      { type: "improvement", text: "Global: Copilot AI assistant integrated into 8 apps" },
    ],
  },
];

const typeConfig = {
  feature: { icon: Sparkles, color: "text-violet-400 bg-violet-500/10", label: "Feature" },
  improvement: { icon: Zap, color: "text-blue-400 bg-blue-500/10", label: "Improvement" },
  fix: { icon: Bug, color: "text-amber-400 bg-amber-500/10", label: "Fix" },
  security: { icon: Shield, color: "text-red-400 bg-red-500/10", label: "Security" },
};

const versionBadge: Record<string, string> = {
  minor: "text-primary bg-primary/10 border-primary/20",
  patch: "text-muted-foreground bg-muted border-border",
  major: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export default function Changelog() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            Changelog
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Release history and feature updates across the SZL platform ecosystem.</p>
        </div>

        <div className="space-y-8">
          {entries.map(entry => (
            <div key={entry.version} className="relative">
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="outline" className={`text-[11px] font-mono font-bold ${versionBadge[entry.type]}`}>{entry.version}</Badge>
                <span className="text-xs text-muted-foreground">{entry.date}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <Card className="border-border">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-foreground mb-3">{entry.highlight}</p>
                  <div className="space-y-2">
                    {entry.changes.map((change, i) => {
                      const cfg = typeConfig[change.type as keyof typeof typeConfig];
                      const Icon = cfg.icon;
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium shrink-0 mt-0.5 ${cfg.color}`}>
                            <Icon className="w-2.5 h-2.5" />
                            {cfg.label}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{change.text}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
