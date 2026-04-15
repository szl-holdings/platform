import { lazy, Suspense, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router as WouterRouter, Switch, Route, useLocation } from "wouter";
import { Dashboard } from "./pages/dashboard";
import { EcosystemNav } from "@szl-holdings/shared-ui/ecosystem-nav";
import { AgentCopilot } from "@szl-holdings/shared-ui/copilot";
import { commandConfig } from "@szl-holdings/shared-ui/copilot-configs";
import { MarketingHome } from "./pages/marketing";
import { MarketingAppPage } from "./pages/marketing/apps/[id]";
import { MarketingPricing } from "./pages/marketing/pricing";
import { MarketingSignup } from "./pages/marketing/signup";
import { MarketingOnboarding } from "./pages/marketing/onboarding";
import { MarketingStatus } from "./pages/marketing/status";
import { MarketingVerifyEmail } from "./pages/marketing/verify-email";
import { CortexVoice, CortexVoiceTrigger, useCortexVoice, MultiplayerSessionBanner } from "@szl-holdings/shared-ui";
import { CommandBar } from "./components/command-bar";

const SimulationPage = lazy(() => import("./pages/simulation"));
const BriefingHistoryPage = lazy(() => import("./pages/briefing-history"));
const DomainDetailPage = lazy(() => import("./pages/domain-detail").then((m) => ({ default: m.DomainDetail })));
const ExecutiveBriefingPage = lazy(() => import("./pages/executive-briefing").then((m) => ({ default: m.ExecutiveBriefing })));
const AlertsPage = lazy(() => import("./pages/alerts"));
const TeamPage = lazy(() => import("./pages/team"));
const CostsPage = lazy(() => import("./pages/costs"));
const ChangelogPage = lazy(() => import("./pages/changelog"));
const SLAPage = lazy(() => import("./pages/sla"));
const GovernancePage = lazy(() => import("./pages/governance"));
const HealthPage = lazy(() => import("./pages/health"));
const DigestPage = lazy(() => import("./pages/digest"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 30_000, retry: 1 },
  },
});

const BASE = import.meta.env.BASE_URL;

const OPS_ROUTES = ["/alerts", "/team", "/costs", "/changelog", "/sla", "/governance", "/health", "/digest"];

function AppShell() {
  const [location] = useLocation();
  const isMarketing = location.startsWith("/marketing");
  const isDomainDetail = location.startsWith("/domain/");
  const isExecutiveBriefing = location === "/executive-briefing";
  const isOpsPage = OPS_ROUTES.includes(location);
  const { open: cortexOpen, setOpen: setCortexOpen } = useCortexVoice();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const showNav = !isMarketing && !isDomainDetail && !isExecutiveBriefing && !isOpsPage;

  return (
    <>
      {showNav && (
        <>
          <MultiplayerSessionBanner
            sessionId="cmd-main"
            currentUserName="You"
            accentColor="#8b7ac8"
          />
          <EcosystemNav
            currentAppId="command"
            currentAppName="Ecosystem Command"
            accentColor="#8b7ac8"
          />
          <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9990 }}>
            <CortexVoiceTrigger accentColor="#8b7ac8" onClick={() => setCortexOpen(true)} />
          </div>
        </>
      )}

      {isOpsPage && (
        <>
          <MultiplayerSessionBanner
            sessionId="cmd-main"
            currentUserName="You"
            accentColor="#8b7ac8"
          />
          <EcosystemNav
            currentAppId="command"
            currentAppName="Ecosystem Command"
            accentColor="#8b7ac8"
          />
          <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9990 }}>
            <CortexVoiceTrigger accentColor="#8b7ac8" onClick={() => setCortexOpen(true)} />
          </div>
        </>
      )}

      <CommandBar open={searchOpen} onClose={() => setSearchOpen(false)} />

      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/domain/:id">
          {() => <Suspense fallback={null}><DomainDetailPage /></Suspense>}
        </Route>
        <Route path="/executive-briefing">
          {() => <Suspense fallback={null}><ExecutiveBriefingPage /></Suspense>}
        </Route>
        <Route path="/simulation">
          {() => <Suspense fallback={null}><SimulationPage /></Suspense>}
        </Route>
        <Route path="/briefing">
          {() => <Suspense fallback={null}><BriefingHistoryPage /></Suspense>}
        </Route>
        <Route path="/alerts">
          {() => <Suspense fallback={null}><AlertsPage /></Suspense>}
        </Route>
        <Route path="/team">
          {() => <Suspense fallback={null}><TeamPage /></Suspense>}
        </Route>
        <Route path="/costs">
          {() => <Suspense fallback={null}><CostsPage /></Suspense>}
        </Route>
        <Route path="/changelog">
          {() => <Suspense fallback={null}><ChangelogPage /></Suspense>}
        </Route>
        <Route path="/sla">
          {() => <Suspense fallback={null}><SLAPage /></Suspense>}
        </Route>
        <Route path="/governance">
          {() => <Suspense fallback={null}><GovernancePage /></Suspense>}
        </Route>
        <Route path="/health">
          {() => <Suspense fallback={null}><HealthPage /></Suspense>}
        </Route>
        <Route path="/digest">
          {() => <Suspense fallback={null}><DigestPage /></Suspense>}
        </Route>
        <Route path="/marketing" component={MarketingHome} />
        <Route path="/marketing/apps/:id" component={MarketingAppPage} />
        <Route path="/marketing/pricing" component={MarketingPricing} />
        <Route path="/marketing/signup" component={MarketingSignup} />
        <Route path="/marketing/onboarding" component={MarketingOnboarding} />
        <Route path="/marketing/status" component={MarketingStatus} />
        <Route path="/marketing/verify-email" component={MarketingVerifyEmail} />
      </Switch>

      <CortexVoice
        open={cortexOpen}
        onClose={() => setCortexOpen(false)}
        accentColor="#8b7ac8"
        appName="Command Portal"
      />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={BASE.replace(/\/$/, "")}>
        <AppShell />
      </WouterRouter>
      <AgentCopilot config={commandConfig} />
    </QueryClientProvider>
  );
}

export default App;
