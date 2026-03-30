import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Shield, Brain, Zap, Ship, Building, Palette,
  Laptop, Globe, Activity, BarChart3, ArrowUpRight, Layers,
} from "lucide-react";
import { UserButton } from "@workspace/shared-ui/UserButton";

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
    tagline: "Cybersecurity operations center",
    icon: Shield,
    accent: "#ef4444",
    path: "/firestorm/",
  },
  {
    id: "inca",
    name: "INCA",
    tagline: "AI & ML research platform",
    icon: Brain,
    accent: "#8b5cf6",
    path: "/inca/",
  },
  {
    id: "terra",
    name: "Terra",
    tagline: "Real estate intelligence",
    icon: Building,
    accent: "#10b981",
    path: "/terra/",
  },
  {
    id: "vessels",
    name: "Vessels",
    tagline: "Maritime fleet management",
    icon: Ship,
    accent: "#3b82f6",
    path: "/vessels/",
  },
  {
    id: "lyte",
    name: "Lyte",
    tagline: "Operations command center",
    icon: Zap,
    accent: "#f59e0b",
    path: "/lyte-command-center/",
  },
  {
    id: "dreamscape",
    name: "Dreamscape",
    tagline: "Creative production engine",
    icon: Palette,
    accent: "#ec4899",
    path: "/dreamscape/",
  },
  {
    id: "msp",
    name: "Evolve MSP",
    tagline: "Managed IT services portal",
    icon: Laptop,
    accent: "#06b6d4",
    path: "/msp/",
  },
  {
    id: "carlota-jo",
    name: "Carlota Jo",
    tagline: "Luxury strategy consulting",
    icon: Globe,
    accent: "#d4a853",
    path: "/carlota-jo/",
  },
  {
    id: "admin",
    name: "Admin Panel",
    tagline: "Internal control plane",
    icon: Activity,
    accent: "#6b7280",
    path: "/admin/",
  },
  {
    id: "readiness",
    name: "Readiness Report",
    tagline: "Compliance & risk management",
    icon: BarChart3,
    accent: "#14b8a6",
    path: "/readiness-report/",
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

function AppDirectory() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 px-8 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">SZL Holdings</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Platform Applications</p>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="/szl-holdings/"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                Corporate <ArrowUpRight className="w-3 h-3" />
              </a>
              <a
                href="/stephen/"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                Stephen Lutar <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {apps.map(app => {
            const AppIcon = app.icon;
            return (
              <a
                key={app.id}
                href={app.path}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-border/60 hover:border-border hover:shadow-lg hover:shadow-black/8 transition-all duration-200 text-center bg-card"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                  style={{ backgroundColor: `${app.accent}18` }}
                >
                  <AppIcon className="w-6 h-6" style={{ color: app.accent }} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                    {app.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    {app.tagline}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-border/40 px-8 py-4 mt-auto">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            &copy; {new Date().getFullYear()} SZL Holdings
          </p>
          <p className="text-[11px] text-muted-foreground">
            {apps.length} applications
          </p>
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
