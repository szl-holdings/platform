import { lazy, Suspense, useState, useMemo } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Search, ExternalLink, Shield, Brain, Zap, Ship, Building, Palette, Activity,
  Globe, BarChart3, Laptop, Grid, List, ArrowUpRight, Map, Layers,
} from "lucide-react";
import { UserButton } from "@workspace/shared-ui/UserButton";
import { cn } from "@workspace/shared-ui/utils";
import { EcosystemTour } from "@workspace/shared-ui/EcosystemTour";
import { EmptyState } from "@workspace/shared-ui/EmptyState";

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
    description: "Military-grade cybersecurity simulation with SOC operations, MITRE ATT&CK mapping, XDR console, threat hunting, and compliance tools.",
    features: ["SOC Dashboard", "Threat Intel", "MITRE ATT&CK", "Compliance & Readiness"],
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
    name: "Beacon",
    subtitle: "Business Telemetry · OBSERVE",
    category: "intelligence",
    status: "live",
    icon: Building,
    accent: "#0ea5e9",
    path: "/terra/",
    description: "Continuous business observability detecting KPI movement, value leakage, and market anomalies across enterprise verticals.",
    features: ["KPI Telemetry", "Market Signals", "Portfolio", "Anomaly Detection"],
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
    description: "Business operations command center with signal detection, incident management, AI ops, administration, and developer tools.",
    features: ["Signals", "Incidents", "Playbooks", "Administration"],
  },
  {
    id: "dreamscape",
    name: "Nimbus",
    subtitle: "Predictive Intelligence · UNDERSTAND",
    category: "intelligence",
    status: "live",
    icon: Palette,
    accent: "#ec4899",
    path: "/dreamscape/",
    description: "Prediction, scenario modeling, and confidence scoring — powering the UNDERSTAND layer with probabilistic outputs.",
    features: ["Scenario Modeling", "Confidence Scoring", "Prediction Studio", "Assumptions"],
  },
  {
    id: "msp",
    name: "Rosie",
    subtitle: "Threat & Incident Command · OBSERVE",
    category: "operations",
    status: "live",
    icon: Laptop,
    accent: "#ef4444",
    path: "/msp/",
    description: "Evidence-backed incident command with threat detection, NOC operations, and FedRAMP readiness.",
    features: ["Incident Command", "Threat Detection", "NOC", "FedRAMP Intel"],
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
    name: "Aegis",
    subtitle: "Control Plane · DECIDE",
    category: "platform",
    status: "live",
    icon: BarChart3,
    accent: "#10b981",
    path: "/readiness-report/",
    description: "Enterprise control plane for risk register management, compliance scoring, and governance automation.",
    features: ["Risk Register", "Compliance Score", "Audit Trail", "Gap Closure"],
  },
  {
    id: "alloy",
    name: "AlloyScape",
    subtitle: "Execution Fabric · EXECUTE",
    category: "ai",
    status: "live",
    icon: Layers,
    accent: "#00d4ff",
    path: "/alloy/",
    description: "Unified AI execution fabric spanning all SZL domains. Agent switcher, streaming chat, knowledge base, real-time feeds, voice, and Model Arena.",
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

const ecosystemTourSteps = [
  {
    id: "welcome",
    title: "Welcome to the SZL Ecosystem",
    description: "This is the application directory for SZL Holdings — home to specialized intelligence platforms across security, AI, maritime, real estate, and more.",
    icon: Globe,
    accentColor: "#a855f7",
    tip: "Each app opens in a new tab. You can filter by category or search to find what you need.",
  },
  {
    id: "security",
    title: "Security & Threat Intelligence",
    description: "Firestorm is your cybersecurity simulation platform — SOC dashboards, MITRE ATT&CK coverage, threat hunting, and XDR-style incident response.",
    icon: Shield,
    accentColor: "#ef4444",
    tip: "Look for the MITRE ATT&CK heatmap to visualize coverage gaps across your kill chain.",
  },
  {
    id: "ai-research",
    title: "AI & ML Research",
    description: "INCA gives you experiment tracking, model registry, GPU optimization, and ensemble studio. Alloy unifies all domain agents into one command center.",
    icon: Brain,
    accentColor: "#8b5cf6",
    tip: "Start with the Research Command Center dashboard to see your pipeline health at a glance.",
  },
  {
    id: "maritime",
    title: "Maritime & Real Estate Intelligence",
    description: "Vessels tracks global shipping with sanctions screening and dark vessel detection. Terra covers real estate portfolios with AI-driven valuations.",
    icon: Ship,
    accentColor: "#3b82f6",
    tip: "Vessels uses live AIS data — check the fleet map for real-time vessel positions.",
  },
  {
    id: "operations",
    title: "Operations & Creative",
    description: "Lyte Command Center handles business operations and incident management. Evolve MSP runs your managed services. Dreamscape powers content creation.",
    icon: Zap,
    accentColor: "#f59e0b",
    tip: "Each app has its own AI copilot — look for the assistant icon in the bottom-right corner.",
  },
];

function TourLauncher() {
  const [show, setShow] = useState(false);
  const key = "szl_tour_dismissed_project-list-v1";

  const handleLaunch = () => {
    try { localStorage.removeItem(key); } catch {}
    setShow(false);
    setTimeout(() => setShow(true), 50);
  };

  return (
    <>
      <button
        onClick={handleLaunch}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/50 hover:border-border rounded-lg px-2.5 py-1.5 transition-colors"
      >
        <Map className="w-3 h-3" />
        Ecosystem Tour
      </button>
      {show && (
        <EcosystemTour
          steps={ecosystemTourSteps}
          storageKey="project-list-v1-manual"
          onDismiss={() => setShow(false)}
          onComplete={() => setShow(false)}
        />
      )}
    </>
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
        a.description.toLowerCase().includes(search.toLowerCase()) ||
        a.subtitle.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, category]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search apps..."
                className="w-full bg-muted/40 border border-border/50 rounded-lg pl-8 pr-3 py-1.5 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 focus:bg-muted/60 transition-all"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                    category === cat.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-0.5 ml-auto">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("p-1.5 rounded-md transition-colors", viewMode === "grid" ? "text-foreground bg-muted/60" : "text-muted-foreground hover:text-foreground")}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("p-1.5 rounded-md transition-colors", viewMode === "list" ? "text-foreground bg-muted/60" : "text-muted-foreground hover:text-foreground")}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "application" : "applications"}
          </p>
          <TourLauncher />
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
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${app.accent}15` }}
                    >
                      <AppIcon className="w-5 h-5" style={{ color: app.accent }} />
                    </div>
                    <StatusDot status={app.status} />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{app.name}</h3>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">{app.subtitle}</p>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">{app.description}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {app.features.map(f => (
                      <span key={f} className="text-[10px] text-muted-foreground/70 bg-muted/40 px-1.5 py-0.5 rounded-md">{f}</span>
                    ))}
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
          <EmptyState
            icon={Search}
            headline="No applications found"
            description="No applications match your current search or filter. Try clearing your search or selecting a different category."
            accentColor="#a855f7"
            className="py-20"
          />
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
        <EcosystemTour
          steps={ecosystemTourSteps}
          storageKey="project-list-v1"
        />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
