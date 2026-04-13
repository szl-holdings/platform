import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { Switch, Route, Redirect, useLocation, Router as WouterRouter } from "wouter";
import { useEffect, useRef, Suspense, lazy } from "react";
import { useQueryClient } from "@tanstack/react-query";

// Pages
const LandingPage = lazy(() => import("./pages/Landing"));
const ChatPage = lazy(() => import("./pages/Chat"));
const AgentsPage = lazy(() => import("./pages/Agents"));
const WorkflowsPage = lazy(() => import("./pages/Workflows"));
const MultimodalPage = lazy(() => import("./pages/Multimodal"));
const ConnectorsPage = lazy(() => import("./pages/Connectors"));
const GovernancePage = lazy(() => import("./pages/Governance"));
const DeveloperPage = lazy(() => import("./pages/Developer"));
const AccountPage = lazy(() => import("./pages/Account"));

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const alloyBase = basePath + "/alloy-platform";

function stripAlloyBase(path: string): string {
  return alloyBase && path.startsWith(alloyBase) ? path.slice(alloyBase.length) || "/" : path;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);
  return null;
}

function SignInPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
      <SignIn routing="path" path={`${alloyBase}/sign-in`} signUpUrl={`${alloyBase}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
      <SignUp routing="path" path={`${alloyBase}/sign-up`} signInUrl={`${alloyBase}/sign-in`} />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/app/chat" /></Show>
      <Show when="signed-out"><LandingPage /></Show>
    </>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out"><Redirect to="/" /></Show>
    </>
  );
}

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#080c14]">
    <div className="w-6 h-6 border-2 border-[#4B8BDB]/20 border-t-[#4B8BDB] rounded-full animate-spin"></div>
  </div>
);

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  
  if (!clerkPubKey) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080c14] text-white">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Missing Configuration</h2>
          <p className="text-slate-400">VITE_CLERK_PUBLISHABLE_KEY is required.</p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      routerPush={(to) => setLocation(stripAlloyBase(to))}
      routerReplace={(to) => setLocation(stripAlloyBase(to), { replace: true })}
    >
      <ClerkQueryClientCacheInvalidator />
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          
          <Route path="/app/chat">
            <ProtectedRoute><ChatPage /></ProtectedRoute>
          </Route>
          <Route path="/app/agents">
            <ProtectedRoute><AgentsPage /></ProtectedRoute>
          </Route>
          <Route path="/app/workflows">
            <ProtectedRoute><WorkflowsPage /></ProtectedRoute>
          </Route>
          <Route path="/app/multimodal">
            <ProtectedRoute><MultimodalPage /></ProtectedRoute>
          </Route>
          <Route path="/app/connectors">
            <ProtectedRoute><ConnectorsPage /></ProtectedRoute>
          </Route>
          <Route path="/app/governance">
            <ProtectedRoute><GovernancePage /></ProtectedRoute>
          </Route>
          <Route path="/app/developer">
            <ProtectedRoute><DeveloperPage /></ProtectedRoute>
          </Route>
          <Route path="/app/account">
            <ProtectedRoute><AccountPage /></ProtectedRoute>
          </Route>

          <Route>
            <div className="flex min-h-screen items-center justify-center bg-[#080c14] text-white">
              404 | Page Not Found
            </div>
          </Route>
        </Switch>
      </Suspense>
    </ClerkProvider>
  );
}

export default function AlloyPlatformApp() {
  return (
    <WouterRouter base={alloyBase}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}
