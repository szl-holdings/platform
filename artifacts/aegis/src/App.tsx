import { lazy, Suspense, useState, useCallback, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layers, RotateCcw, GitBranch, Shield, Menu, X, ChevronRight, Presentation } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

import S01Cover from "./pages/slides/S01Cover";
import S02SeriesProblem from "./pages/slides/S02SeriesProblem";
import S03Category from "./pages/slides/S03Category";
import S04Product from "./pages/slides/S04Product";
import S05Demo from "./pages/slides/S05Demo";
import S06Market from "./pages/slides/S06Market";
import S07SeriesDomains from "./pages/slides/S07SeriesDomains";
import S08BusinessModel from "./pages/slides/S08BusinessModel";
import S09Ask from "./pages/slides/S09Ask";

const AegisAtlasRuntime = lazy(() => import("./pages/atlas-runtime"));
const AegisReplay = lazy(() => import("./pages/replay"));
const AegisScenarioBranches = lazy(() => import("./pages/scenario-branches"));

const SLIDES = [S01Cover, S02SeriesProblem, S03Category, S04Product, S05Demo, S06Market, S07SeriesDomains, S08BusinessModel, S09Ask];
const TOTAL = SLIDES.length;

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000, retry: 1 } },
});

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const ATLAS_NAV = [
  { path: "/atlas-runtime", label: "Threat Twin", icon: Layers },
  { path: "/replay", label: "Incident Replay", icon: RotateCcw },
  { path: "/scenario-branches", label: "Scenario Branches", icon: GitBranch },
];

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <div className="w-5 h-5 border-2 border-red-500/40 border-t-red-400 rounded-full animate-spin" />
    </div>
  );
}

function AtlasSidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const [location] = useLocation();

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} />
      )}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-56 flex flex-col bg-[#09060e] border-r border-red-500/10 transition-transform duration-200",
        "lg:translate-x-0 lg:static lg:z-auto",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-2 px-4 py-4 border-b border-red-500/10">
          <div className="w-6 h-6 rounded-md bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-red-100 leading-tight">AEGIS</p>
            <p className="text-[9px] text-red-400/50 leading-tight">SZL Holdings</p>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden text-red-400/50 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors",
              location === "/" || location.startsWith("/slide")
                ? "bg-red-500/10 text-red-300 border border-red-500/20"
                : "text-red-400/50 hover:text-red-300 hover:bg-red-500/5"
            )}
          >
            <Presentation className="w-3.5 h-3.5" />
            Investor Deck
          </Link>

          <div className="pt-3 pb-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-red-400/30 px-3 mb-2">ATLAS Spatial Runtime</p>
            {ATLAS_NAV.map(({ path, label, icon: Icon }) => {
              const isActive = location === path;
              return (
                <Link
                  key={path}
                  href={path}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors",
                    isActive
                      ? "bg-red-500/10 text-red-300 border border-red-500/20"
                      : "text-red-400/50 hover:text-red-300 hover:bg-red-500/5"
                  )}
                  onClick={onClose}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-3 border-t border-red-500/10">
          <div className="flex items-center gap-2 px-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[10px] text-red-400/50 font-mono">ATLAS RUNTIME LIVE</span>
          </div>
        </div>
      </aside>
    </>
  );
}

function AtlasDashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#080510]">
      <AtlasSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-red-500/10 bg-[#09060e]/80 backdrop-blur-sm lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-red-400/60 hover:text-red-300">
            <Menu className="w-4 h-4" />
          </button>
          <Shield className="w-4 h-4 text-red-400" />
          <span className="text-sm font-bold text-red-100">AEGIS — ATLAS Runtime</span>
        </div>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function SlideDeck() {
  function getInitialSlide(): number {
    const match = window.location.pathname.match(/slide(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n >= 1 && n <= TOTAL) return n;
    }
    return 1;
  }

  const [current, setCurrent] = useState(getInitialSlide);
  const Slide = SLIDES[current - 1];

  const goTo = useCallback((n: number) => {
    const clamped = Math.min(Math.max(n, 1), TOTAL);
    setCurrent(clamped);
    history.replaceState(null, "", `${BASE}/slide${clamped}`);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        setCurrent((c) => {
          const next = Math.min(c + 1, TOTAL);
          history.replaceState(null, "", `${BASE}/slide${next}`);
          return next;
        });
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setCurrent((c) => {
          const prev = Math.max(c - 1, 1);
          history.replaceState(null, "", `${BASE}/slide${prev}`);
          return prev;
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}
      onClick={() => goTo(current + 1)}
    >
      <Slide />
      <div
        style={{
          position: "fixed",
          bottom: "2.5vh",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "0.5vw",
          zIndex: 100,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i + 1)}
            style={{
              width: i + 1 === current ? "2.2vw" : "0.55vw",
              height: "0.35vh",
              minHeight: "3px",
              borderRadius: "2px",
              background: i + 1 === current ? "#0cc8d9" : "rgba(255,255,255,0.18)",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: "fixed",
          bottom: "2.5vh",
          right: "2.5vw",
          fontFamily: "Inter, sans-serif",
          fontSize: "clamp(9px, 1vw, 13px)",
          color: "rgba(255,255,255,0.18)",
          zIndex: 100,
        }}
      >
        {current} / {TOTAL}
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/atlas-runtime">
        <AtlasDashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <AegisAtlasRuntime />
          </Suspense>
        </AtlasDashboardLayout>
      </Route>
      <Route path="/replay">
        <AtlasDashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <AegisReplay />
          </Suspense>
        </AtlasDashboardLayout>
      </Route>
      <Route path="/scenario-branches">
        <AtlasDashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <AegisScenarioBranches />
          </Suspense>
        </AtlasDashboardLayout>
      </Route>
      <Route path="/slide:num">
        <SlideDeck />
      </Route>
      <Route>
        <SlideDeck />
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={BASE}>
        <AppRoutes />
      </WouterRouter>
    </QueryClientProvider>
  );
}
