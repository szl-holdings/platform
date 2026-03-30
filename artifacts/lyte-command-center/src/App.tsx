import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { LyteLayout } from "@/components/lyte-layout";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { beaconConfig } from "@workspace/shared-ui/copilot-configs";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";
import { WelcomeOverlay } from "@workspace/shared-ui/WelcomeOverlay";
import { Zap, Inbox, CheckSquare, Users, AlertOctagon } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const CommandInbox = lazy(() => import("@/pages/command-inbox"));
const ApprovalsCenter = lazy(() => import("@/pages/approvals-center"));
const OwnershipMap = lazy(() => import("@/pages/ownership-map-new"));
const EscalationCenter = lazy(() => import("@/pages/escalation-center"));
const InterventionWorkspace = lazy(() => import("@/pages/intervention-workspace"));

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={CommandInbox} />
        <Route path="/approvals" component={ApprovalsCenter} />
        <Route path="/ownership" component={OwnershipMap} />
        <Route path="/escalation" component={EscalationCenter} />
        <Route path="/intervention" component={InterventionWorkspace} />
        <Route>
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Page not found</div>
        </Route>
      </Switch>
    </Suspense>
  );
}

const lyteCommands: CommandItem[] = [
  { id: "nav-inbox", label: "Command Inbox", icon: "⚡", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/"); } },
  { id: "nav-approvals", label: "Approvals Center", icon: "✅", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/approvals"); } },
  { id: "nav-ownership", label: "Ownership Map", icon: "👥", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/ownership"); } },
  { id: "nav-escalation", label: "Escalation Center", icon: "🚨", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/escalation"); } },
  { id: "nav-intervention", label: "Intervention Workspace", icon: "🔧", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/intervention"); } },
];

const lyteShortcuts: KeyboardShortcut[] = [
  { key: "A", description: "Approvals Center", category: "Navigation" },
  { key: "O", description: "Ownership Map", category: "Navigation" },
  { key: "E", description: "Escalation Center", category: "Navigation" },
  { key: "I", description: "Intervention Workspace", category: "Navigation" },
];

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(lyteCommands);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <PowerUserProvider shortcuts={lyteShortcuts} appName="Lyte" accentColor="#f59e0b">
          <div className="flex flex-col h-screen bg-[#080c14]">
            <EcosystemNav currentAppId="lyte" currentAppName="Lyte" accentColor="#f59e0b" />
            <div className="flex-1 overflow-hidden">
              <LyteLayout>
                <Router />
              </LyteLayout>
            </div>
          </div>
          <CommandPalette
            open={cmdOpen}
            onClose={() => setCmdOpen(false)}
            commands={lyteCommands}
            appName="Lyte"
            accentColor="#f59e0b"
          />
        </PowerUserProvider>
        <WelcomeOverlay
          appId="lyte"
          appName="Lyte"
          subtitle="Command & Orchestration"
          description="Lyte interprets what Beacon sees and routes accountability to the right owner. It is the execution layer for human decisions — approvals, escalations, and interventions."
          accentColor="#f59e0b"
          icon={Zap}
          features={[
            { icon: Inbox, title: "Command Inbox", description: "Prioritized actions, approvals, exceptions, and stalled workflow assignments" },
            { icon: CheckSquare, title: "Approvals Center", description: "Aging approvals with impact estimates and escalation recommendations" },
            { icon: Users, title: "Ownership Map", description: "Who owns each step, missing ownership, broken handoffs, overloaded teams" },
            { icon: AlertOctagon, title: "Escalation Center", description: "What needs escalation, why, to whom, with Nimbus rationale attached" },
          ]}
        />
      </WouterRouter>
      <AgentCopilot config={beaconConfig} />
    </QueryClientProvider>
  );
}

export default App;
