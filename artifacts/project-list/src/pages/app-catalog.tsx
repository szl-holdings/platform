import { useState } from "react";
import { Search, Filter, Grid, List, ExternalLink, Star, Activity, Shield, Brain, Zap, Ship, Building, BarChart3, Globe, Palette, Eye, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const apps = [
  { id: "firestorm", name: "Firestorm", subtitle: "Security Operations Center", category: "security", status: "live", icon: Shield, color: "text-red-400 bg-red-400/10", description: "Enterprise-grade SOC with threat intelligence, MITRE ATT&CK mapping, incident response, and compliance monitoring", features: ["SOC Dashboard", "Threat Intel", "MITRE ATT&CK", "Risk Scoring"] },
  { id: "inca", name: "INCA", subtitle: "AI Research Command Center", category: "ai", status: "live", icon: Brain, color: "text-violet-400 bg-violet-400/10", description: "AI/ML research platform with experiment tracking, model registry, predictions dashboard, and ensemble management", features: ["Experiments", "Model Registry", "Predictions", "Ensemble Studio"] },
  { id: "terra", name: "Terra", subtitle: "Real Estate Intelligence", category: "intelligence", status: "live", icon: Building, color: "text-emerald-400 bg-emerald-400/10", description: "Real estate analytics with property intelligence, market trends, portfolio management, and AI-powered valuations", features: ["Property Intel", "Market Trends", "Portfolio", "Valuations"] },
  { id: "vessels", name: "Vessels", subtitle: "Maritime Intelligence", category: "intelligence", status: "live", icon: Ship, color: "text-cyan-400 bg-cyan-400/10", description: "Maritime operations platform with vessel tracking, port analytics, route optimization, and fleet management", features: ["Fleet Tracking", "Port Analytics", "Routes", "Risk Assessment"] },
  { id: "lyte", name: "Lyte", subtitle: "Command Center", category: "operations", status: "live", icon: Zap, color: "text-blue-400 bg-blue-400/10", description: "Business operations command center with signal detection, incident management, playbooks, and AI ops", features: ["Signals", "Incidents", "Playbooks", "AI Ops"] },
  { id: "dreamscape", name: "Dreamscape", subtitle: "Creative Engine", category: "creative", status: "live", icon: Palette, color: "text-pink-400 bg-pink-400/10", description: "Content creation and campaign management platform with AI studio, storyboards, and voice tools", features: ["Campaigns", "AI Studio", "Content Calendar", "Assets"] },
  { id: "admin", name: "Admin Panel", subtitle: "Control Plane", category: "platform", status: "live", icon: Activity, color: "text-amber-400 bg-amber-400/10", description: "System administration with connector management, feature flags, audit logs, and infrastructure monitoring", features: ["System Health", "Connectors", "Feature Flags", "Infrastructure"] },
  { id: "szl", name: "SZL Holdings", subtitle: "Corporate Hub", category: "platform", status: "live", icon: Globe, color: "text-indigo-400 bg-indigo-400/10", description: "Corporate portal showcasing the SZL Holdings ecosystem with brand messaging and stakeholder resources", features: ["Ecosystem", "About", "Brands", "Contact"] },
];

const categories = ["all", "security", "ai", "intelligence", "operations", "creative", "platform"];

export function AppCatalog() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = apps.filter(a =>
    (category === "all" || a.category === category) &&
    (search === "" || a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">App Catalog</h2>
        <p className="text-sm text-muted-foreground mt-1">Explore the complete SZL Holdings ecosystem</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search apps..."
            className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="flex gap-1">
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                category === c ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}>{c}</button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          <button onClick={() => setViewMode("grid")} className={cn("p-2 rounded-lg", viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground")}><Grid className="w-4 h-4" /></button>
          <button onClick={() => setViewMode("list")} className={cn("p-2 rounded-lg", viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground")}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(app => {
            const AppIcon = app.icon;
            return (
              <div key={app.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/20 transition-all group">
                <div className="aspect-[3/1] bg-gradient-to-br from-primary/10 via-muted/20 to-cyan-500/10 flex items-center justify-center relative">
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center", app.color)}>
                    <AppIcon className="w-8 h-8" />
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-semibold text-foreground">{app.name}</h3>
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {app.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{app.subtitle}</p>
                  <p className="text-sm text-muted-foreground">{app.description}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {app.features.map(f => (
                      <span key={f} className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(app => {
            const AppIcon = app.icon;
            return (
              <div key={app.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/20 transition-all">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", app.color)}>
                  <AppIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{app.name}</h3>
                    <span className="text-xs text-muted-foreground">{app.subtitle}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{app.description}</p>
                </div>
                <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 rounded bg-muted">{app.category}</span>
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> live
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
