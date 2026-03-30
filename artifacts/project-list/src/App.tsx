import { lazy, Suspense, useState, useMemo } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Search, ExternalLink, Shield, Brain, Zap, Ship, Building, Palette, Activity,
  Globe, BarChart3, Laptop, Grid, List, ArrowUpRight, Layers,
} from "lucide-react";
import { UserButton } from "@workspace/shared-ui/UserButton";
import { cn } from "@workspace/shared-ui/utils";

const SpectrumAnalytics = lazy(() => import("@/pages/spectrum-analytics"));
const Metrics = lazy(() => import("@/pages/metrics"));
const Changelog = lazy(() => import("@/pages/changelog"));
const Roadmap = lazy(() => import("@/pages/roadmap"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: false, staleTime: 5 * 60 * 1000 },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const apps = [
  {
    id: "firestorm",
    name: "Firestorm",
    subtitle: "Security Simulation",
    category: "security",
    status: "live",
    icon: Shield,
    accent: "#ef4444",
    path: "/firestorm/",
    description: "Military-grade cybersecurity simulation for red team/blue team exercises and continuous security validation.",
    features: ["SOC Dashboard", "Threat Intel", "MITRE ATT&CK", "Incident Response"],
  },
  {
    id: "inca",
    name: "INCA",
    subtitle: "AI Research Command",
    category: "ai",
    status: "live",
    icon: Brain,
    accent: "#8b5cf6",
    path: "/inca/",
    description: "AI/ML research platform with experiment tracking, model registry, and ensemble management.",
    features: ["Experiments", "Model Registry", "Predictions", "Ensemble Studio"],
  },
  {
    id: "terra",
    name: "Terra",
    subtitle: "Real Estate Intelligence",
    category: "intelligence",
    status: "live",
    icon: Building,
    accent: "#10b981",
    path: "/terra/",
    description: "Real estate analytics with property intelligence, market trends, and AI-powered valuations.",
    features: ["Property Intel", "Market Trends", "Portfolio", "Valuations"],
  },
  {
    id: "vessels",
    name: "Vessels",
    subtitle: "Maritime Intelligence",
    category: "intelligence",
    status: "live",
    icon: Ship,
    accent: "#3b82f6",
    path: "/vessels/",
    description: "Maritime operations platform with vessel tracking, port analytics, and route optimization.",
    features: ["Fleet Tracking", "Port Analytics", "Routes", "Risk Assessment"],
  },
  {
    id: "lyte",
    name: "Lyte",
    subtitle: "Command Center",
    category: "operations",
    status: "live",
    icon: Zap,
    accent: "#f59e0b",
    path: "/lyte-command-center/",
    description: "Business operations command center with signal detection, incident management, and AI ops.",
    features: ["Signals", "Incidents", "Playbooks", "AI Ops"],
  },
  {
    id: "dreamscape",
    name: "Dreamscape",
    subtitle: "Creative Engine",
    category: "creative",
    status: "live",
    icon: Palette,
    accent: "#ec4899",
    path: "/dreamscape/",
    description: "Content creation and campaign management platform with AI studio and voice tools.",
    features: ["Campaigns", "AI Studio", "Content Calendar", "Assets"],
  },
  {
    id: "msp",
    name: "Evolve MSP",
    subtitle: "Managed Services",
    category: "operations",
    status: "live",
    icon: Laptop,
    accent: "#06b6d4",
    path: "/msp/",
    description: "Managed service provider platform for client IT management and NOC operations.",
    features: ["Client Management", "Service Desk", "NOC", "Billing"],
  },
  {
    id: "carlota-jo",
    name: "Carlota Jo",
    subtitle: "Brand Consulting",
    category: "creative",
    status: "beta",
    icon: Globe,
    accent: "#f472b6",
    path: "/carlota-jo/",
    description: "AI-enhanced brand strategy engine for consumer sentiment and competitive analysis.",
    features: ["Brand Strategy", "Sentiment Analysis", "Competitive Intel", "Positioning"],
  },
  {
    id: "admin",
    name: "Admin Panel",
    subtitle: "Control Plane",
    category: "platform",
    status: "live",
    icon: Activity,
    accent: "#a3a3a3",
    path: "/admin/",
    description: "System administration with connector management, feature flags, and infrastructure monitoring.",
    features: ["System Health", "Connectors", "Feature Flags", "Infrastructure"],
  },
  {
    id: "readiness",
    name: "Readiness Report",
    subtitle: "Compliance Engine",
    category: "platform",
    status: "live",
    icon: BarChart3,
    accent: "#14b8a6",
    path: "/readiness-report/",
    description: "Compliance assessment and audit readiness engine for regulated industries.",
    features: ["Gap Analysis", "Remediation", "Audit Trail", "Reports"],
  },
  {
    id: "alloy",
    name: "Alloy",
    subtitle: "Unified AI Command",
    category: "ai",
    status: "live",
    icon: Layers,
    accent: "#00d4ff",
    path: "/alloy/",
    description: "Unified AI command center spanning all SZL domains. Agent switcher, streaming chat, knowledge base, real-time feeds, voice, and Model Arena.",
    features: ["10 Domain Agents", "Streaming Chat", "Knowledge Base", "Model Arena"],
  },
];

const categories = [
  { id: "all", label: "All Apps" },
  { id: "security", label: "Security" },
  { id: "ai", label: "AI / ML" },
  { id: "intelligence", label: "Intelligence" },
  { id: "operations", label: "Operations" },
  { id: "creative", label: "Creative" },
  { id: "platform", label: "Platform" },
];

function StatusDot({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        status === "live" ? "bg-emerald-400" : status === "beta" ? "bg-amber-400" : "bg-zinc-400"
      )} />
      <span className={cn(
        "text-[11px] font-medium capitalize",
        status === "live" ? "text-emerald-400" : status === "beta" ? "text-amber-400" : "text-zinc-400"
      )}>
        {status}
      </span>
    </span>
  );
}

function AppDirectory() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    return apps.filter(a =>
      (category === "all" || a.category === category) &&
      (search === "" ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.subtitle.toLowerCase().includes(search.toLowerCase()) ||
        a.description.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, category]);
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs font-display">SZL</span>
              </div>
              <div>
                <h1 className="text-base font-display font-bold text-foreground leading-none">SZL Holdings</h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">Application Directory · 6 Lenses Active</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/szl-holdings/"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                Corporate Site <ArrowUpRight className="w-3 h-3" />
              </a>
              <span className="text-border mx-1">|</span>
              <a
                href="/stephen/"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                Stephen Lutar <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <UserButton className="mr-1" />
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search apps..."
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                    category === c.id
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex gap-0.5 ml-auto border border-border rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "application" : "applications"}
          </p>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(app => {
              const AppIcon = app.icon;
              return (
                <a
                  key={app.id}
                  href={app.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-card border border-border rounded-xl p-5 hover:border-border/80 hover:shadow-lg hover:shadow-black/10 transition-all duration-200 block"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${app.accent}15` }}
                    >
                      <AppIcon className="w-5 h-5" style={{ color: app.accent }} />
                    </div>
                    <StatusDot status={app.status} />
                  </div>

                  <h3 className="text-sm font-semibold text-foreground mb-0.5 group-hover:text-primary transition-colors">
                    {app.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">
                    {app.subtitle}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                    {app.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {app.features.map(f => (
                      <span
                        key={f}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
                      >
                        {f}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-end">
                    <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                      Launch <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map(app => {
              const AppIcon = app.icon;
              return (
                <a
                  key={app.id}
                  href={app.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-3.5 hover:border-border/80 hover:bg-card/80 transition-all duration-200"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${app.accent}15` }}
                  >
                    <AppIcon className="w-4.5 h-4.5" style={{ color: app.accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{app.name}</h3>
                      <span className="text-[11px] text-muted-foreground">{app.subtitle}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{app.description}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-[11px] text-muted-foreground capitalize px-2 py-0.5 rounded-md bg-muted hidden sm:block">
                      {app.category}
                    </span>
                    <StatusDot status={app.status} />
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No applications match your search.</p>
          </div>
        )}
      </main>

      <footer className="border-t border-border/50 mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <p className="text-[11px] text-muted-foreground">
            &copy; {new Date().getFullYear()} SZL Holdings. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground/50 hidden sm:block">The 6 Lenses of Business Observability: ◎ Signal · $ Impact · ◈ Anticipation · ⬡ Topology · ◆ Posture · ▲ Velocity</span>
            <span className="text-[11px] text-muted-foreground">
              {apps.filter(a => a.status === "live").length} live &middot; {apps.filter(a => a.status === "beta").length} beta
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <EcosystemNav currentAppId="project-list" currentAppName="Project List" accentColor="#a855f7" />
          <div style={{ flex: 1 }}>
            <Switch>
              <Route path="/spectrum">
                <Suspense fallback={<PageLoader />}>
                  <SpectrumAnalytics />
                </Suspense>
              </Route>
              <Route path="/metrics">
                <Suspense fallback={<PageLoader />}>
                  <Metrics />
                </Suspense>
              </Route>
              <Route path="/changelog">
                <Suspense fallback={<PageLoader />}>
                  <Changelog />
                </Suspense>
              </Route>
              <Route path="/roadmap">
                <Suspense fallback={<PageLoader />}>
                  <Roadmap />
                </Suspense>
              </Route>
              <Route path="/" component={AppDirectory} />
              <Route component={AppDirectory} />
            </Switch>
          </div>
        </div>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
