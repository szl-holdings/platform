import { lazy, Suspense, useState, useMemo } from "react";
import { Switch, Route, Router as WouterRouter, Link } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, domMax } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Portfolio } from "@/components/Portfolio";
import { Leadership } from "@/components/Leadership";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import {
  Search, Shield, Brain, Zap, Ship, Building, Palette, Activity, Globe, BarChart3,
  Laptop, Grid, List, ArrowUpRight, GitBranch, Map,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ObservabilityPage = lazy(() => import("@/pages/observability"));
const EcosystemViz = lazy(() => import("@/pages/ecosystem-viz"));
const MATracker = lazy(() => import("@/pages/ma-tracker"));
const PortfolioIntel = lazy(() => import("@/pages/portfolio-intel"));
const VenturesThesis = lazy(() => import("@/pages/ventures-thesis"));
const Newsroom = lazy(() => import("@/pages/newsroom"));
const InvestorRelations = lazy(() => import("@/pages/investor-relations"));
const SpectrumAnalytics = lazy(() => import("@/pages/spectrum-analytics"));
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
    subtitle: "Security Operations",
    category: "security",
    status: "live",
    icon: Shield,
    accent: "#ef4444",
    path: "/firestorm/",
    description: "Military-grade cybersecurity simulation with SOC operations, MITRE ATT&CK mapping, XDR console, threat hunting, and compliance readiness.",
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
    description: "Business operations command center with signal detection, incident management, AI ops, administration, and developer tools.",
    features: ["Signals", "Incidents", "Playbooks", "Administration"],
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
];

const categories = [
  { id: "all", label: "All Apps" },
  { id: "security", label: "Security" },
  { id: "intelligence", label: "Intelligence" },
  { id: "operations", label: "Operations" },
  { id: "ai", label: "AI" },
  { id: "creative", label: "Creative" },
];

function StatusDot({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        status === "live" ? "bg-emerald-500" : status === "beta" ? "bg-amber-500" : "bg-muted-foreground"
      )} />
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{status}</span>
    </div>
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
            <div className="flex items-center gap-3">
              <Link href="/corporate" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                Corporate Site <ArrowUpRight className="w-3 h-3" />
              </Link>
              <Link href="/changelog" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <GitBranch className="w-3 h-3" /> Changelog
              </Link>
              <Link href="/roadmap" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <Map className="w-3 h-3" /> Roadmap
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
              <button onClick={() => setViewMode("grid")} className={cn("p-1.5 rounded-md transition-colors", viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setViewMode("list")} className={cn("p-1.5 rounded-md transition-colors", viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs text-muted-foreground">{filtered.length} {filtered.length === 1 ? "application" : "applications"}</p>
          <Link href="/spectrum" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors">
            <BarChart3 className="w-3.5 h-3.5" /> Spectrum Analytics
          </Link>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(app => {
              const AppIcon = app.icon;
              return (
                <a key={app.id} href={app.path} target="_blank" rel="noopener noreferrer" className="group bg-card border border-border rounded-xl p-5 hover:border-border/80 hover:shadow-lg hover:shadow-black/10 transition-all duration-200 block">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${app.accent}15` }}>
                      <AppIcon className="w-5 h-5" style={{ color: app.accent }} />
                    </div>
                    <StatusDot status={app.status} />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-0.5 group-hover:text-primary transition-colors">{app.name}</h3>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">{app.subtitle}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">{app.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {app.features.map(f => (
                      <span key={f} className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-[10px]">{f}</span>
                    ))}
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(app => {
              const AppIcon = app.icon;
              return (
                <a key={app.id} href={app.path} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-4 hover:border-border/80 transition-all duration-200">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${app.accent}15` }}>
                    <AppIcon className="w-4.5 h-4.5" style={{ color: app.accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold group-hover:text-primary transition-colors">{app.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{app.subtitle}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{app.description}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusDot status={app.status} />
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No applications match your search</p>
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <p className="text-[11px] text-muted-foreground">&copy; {new Date().getFullYear()} SZL Holdings. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground/50 hidden sm:block">The 6 Lenses of Business Observability: ◎ Signal · $ Impact · ◈ Anticipation · ⬡ Topology · ◆ Posture · ▲ Velocity</span>
            <span className="text-[11px] text-muted-foreground">{apps.filter(a => a.status === "live").length} live · {apps.filter(a => a.status === "beta").length} beta</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CorporateSite() {
  return (
    <div className="min-h-screen bg-szl-bg">
      <Navbar />
      <Hero />
      <Portfolio />
      <Leadership />
      <Contact />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={domMax} strict>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Switch>
            <Route path="/" component={AppDirectory} />
            <Route path="/corporate" component={CorporateSite} />
            <Route path="/spectrum">
              <Suspense fallback={<PageLoader />}><SpectrumAnalytics /></Suspense>
            </Route>
            <Route path="/changelog">
              <Suspense fallback={<PageLoader />}><Changelog /></Suspense>
            </Route>
            <Route path="/roadmap">
              <Suspense fallback={<PageLoader />}><Roadmap /></Suspense>
            </Route>
            <Route path="/observability">
              <Suspense fallback={<PageLoader />}><ObservabilityPage /></Suspense>
            </Route>
            <Route path="/ecosystem">
              <Suspense fallback={<PageLoader />}><EcosystemViz /></Suspense>
            </Route>
            <Route path="/ma-tracker">
              <Suspense fallback={<PageLoader />}><MATracker /></Suspense>
            </Route>
            <Route path="/portfolio">
              <Suspense fallback={<PageLoader />}><PortfolioIntel /></Suspense>
            </Route>
            <Route path="/thesis">
              <Suspense fallback={<PageLoader />}><VenturesThesis /></Suspense>
            </Route>
            <Route path="/newsroom">
              <Suspense fallback={<PageLoader />}><Newsroom /></Suspense>
            </Route>
            <Route path="/ir">
              <Suspense fallback={<PageLoader />}><InvestorRelations /></Suspense>
            </Route>
            <Route component={AppDirectory} />
          </Switch>
        </WouterRouter>
      </LazyMotion>
    </QueryClientProvider>
  );
}

export default App;
