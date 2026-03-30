import { Card, CardContent } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Map, CheckCircle, Circle, Clock, Sparkles, Shield, Brain, Zap, Building2, Ship, Palette, Laptop, FileText, Globe } from "lucide-react";

const quarters = [
  {
    quarter: "Q1 2026",
    status: "completed",
    theme: "Foundation Expansion",
    items: [
      { app: "Firestorm", icon: Shield, color: "#ef4444", title: "XDR Console + Threat Hunting Workbench", status: "done" },
      { app: "Lyte", icon: Zap, color: "#f59e0b", title: "AI Anomaly Detection + SLO Tracking", status: "done" },
      { app: "INCA", icon: Brain, color: "#8b5cf6", title: "GPU Monitoring + LLM Evaluation Studio", status: "done" },
      { app: "Terra", icon: Building2, color: "#10b981", title: "Portfolio Performance + Climate Risk Overlay", status: "done" },
      { app: "MSP", icon: Laptop, color: "#06b6d4", title: "RMM Console + MRR Dashboard", status: "done" },
      { app: "Dreamscape", icon: Palette, color: "#ec4899", title: "Brand Voice Engine + Voice Studio", status: "done" },
      { app: "Readiness", icon: FileText, color: "#14b8a6", title: "Vendor Risk Assessment + Risk Register", status: "done" },
      { app: "Carlota Jo", icon: Globe, color: "#f472b6", title: "AI Brand Advisory + Engagement Workflow", status: "done" },
    ],
  },
  {
    quarter: "Q2 2026",
    status: "in_progress",
    theme: "Intelligence Deepening",
    items: [
      { app: "Vessels", icon: Ship, color: "#3b82f6", title: "AI Route Optimization Engine", status: "in_progress" },
      { app: "Firestorm", icon: Shield, color: "#ef4444", title: "Identity Threat Intelligence + Executive Risk Board", status: "in_progress" },
      { app: "Lyte", icon: Zap, color: "#f59e0b", title: "Cloud Cost Intelligence + On-Call Management", status: "in_progress" },
      { app: "INCA", icon: Brain, color: "#8b5cf6", title: "Ensemble Pipeline Studio + Multi-Model Comparison", status: "planned" },
      { app: "Terra", icon: Building2, color: "#10b981", title: "AI Lease Abstraction + Tenant Intelligence", status: "planned" },
      { app: "Admin", icon: Globe, color: "#a3a3a3", title: "Deployment Visualization + Git Integration", status: "planned" },
      { app: "SZL Holdings", icon: Globe, color: "#6c63ff", title: "Portfolio Intelligence Dashboard + IR Module", status: "in_progress" },
      { app: "Dreamscape", icon: Palette, color: "#ec4899", title: "Motion Graphics Engine + Collaborative Workspace", status: "planned" },
    ],
  },
  {
    quarter: "Q3 2026",
    status: "planned",
    theme: "Platform Convergence",
    items: [
      { app: "Cross-Platform", icon: Globe, color: "#6366f1", title: "Unified SZL Identity & SSO", status: "planned" },
      { app: "Vessels", icon: Ship, color: "#3b82f6", title: "Sanctions Compliance + AIS Integration", status: "planned" },
      { app: "MSP", icon: Laptop, color: "#06b6d4", title: "AI-Assisted Ticket Resolution + Predictive Capacity", status: "planned" },
      { app: "Readiness", icon: FileText, color: "#14b8a6", title: "Multi-Framework Hub (SOC2+ISO+GDPR)", status: "planned" },
      { app: "Firestorm", icon: Shield, color: "#ef4444", title: "Red Team Simulation Marketplace", status: "planned" },
      { app: "INCA", icon: Brain, color: "#8b5cf6", title: "Model Governance + Audit Trail for Regulated AI", status: "planned" },
    ],
  },
  {
    quarter: "Q4 2026",
    status: "planned",
    theme: "Scale & Monetization",
    items: [
      { app: "Cross-Platform", icon: Globe, color: "#6366f1", title: "SZL Marketplace — Cross-App Data Workflows", status: "planned" },
      { app: "Lyte", icon: Zap, color: "#f59e0b", title: "Custom Alert Intelligence Rules Engine", status: "planned" },
      { app: "Terra", icon: Building2, color: "#10b981", title: "CRE Market Benchmarking API (Public)", status: "planned" },
      { app: "Carlota Jo", icon: Globe, color: "#f472b6", title: "Brand Intelligence API + White-Label Portal", status: "planned" },
      { app: "Admin", icon: Globe, color: "#a3a3a3", title: "Multi-Tenant Architecture + Customer Onboarding Automation", status: "planned" },
    ],
  },
];

const statusConfig = {
  done: { icon: CheckCircle, color: "text-emerald-400", label: "Done" },
  in_progress: { icon: Clock, color: "text-amber-400", label: "In Progress" },
  planned: { icon: Circle, color: "text-muted-foreground", label: "Planned" },
};

const quarterBadge = {
  completed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  in_progress: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  planned: "text-muted-foreground bg-muted border-border",
};

export default function Roadmap() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
            <Map className="w-5 h-5 text-primary" />
            Platform Roadmap
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Feature roadmap for 2026 across the SZL ecosystem. Updated weekly.</p>
        </div>

        <div className="space-y-10">
          {quarters.map(q => (
            <div key={q.quarter}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-base font-bold text-foreground">{q.quarter}</h2>
                <Badge variant="outline" className={`text-[10px] ${quarterBadge[q.status]}`}>
                  {q.status === "completed" ? "Completed" : q.status === "in_progress" ? "In Progress" : "Planned"}
                </Badge>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{q.theme}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {q.items.map(item => {
                  const AppIcon = item.icon;
                  const sts = statusConfig[item.status as keyof typeof statusConfig];
                  const StIcon = sts.icon;
                  return (
                    <div
                      key={item.title}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                        item.status === "done" ? "bg-emerald-500/5 border-emerald-500/15" :
                        item.status === "in_progress" ? "bg-amber-500/5 border-amber-500/15" :
                        "bg-card border-border"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${item.color}20` }}>
                        <AppIcon className="w-3.5 h-3.5" style={{ color: item.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{item.app}</p>
                        <p className="text-xs text-foreground leading-snug mt-0.5">{item.title}</p>
                      </div>
                      <StIcon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${sts.color}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border flex items-center gap-6">
          {Object.entries(statusConfig).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={key} className="flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                <span className="text-xs text-muted-foreground">{cfg.label}</span>
              </div>
            );
          })}
          <p className="text-[11px] text-muted-foreground ml-auto">Roadmap is subject to change based on user feedback and technical priorities.</p>
        </div>
      </div>
    </div>
  );
}
