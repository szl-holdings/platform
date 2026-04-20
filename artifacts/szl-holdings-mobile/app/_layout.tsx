import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts as useSpaceFonts,
} from "@expo-google-fonts/space-grotesk";
import { setBaseUrl, setAuthTokenGetter } from "@szl-holdings/api-client-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { persistQueryClient } from "@tanstack/query-persist-client-core";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

import {
  ErrorBoundary,
  NotificationProvider,
  OfflineBanner,
  ThemeProvider,
  setUploadAuthTokenGetter,
  setUserPreferencesApiFetcher,
  BiometricProvider,
  BiometricLockScreen,
  useBiometric,
  SyncEngineProvider,
  SyncStatusBanner,
  ConflictResolutionModal,
  CopilotFab,
  parseMobileEnv,
} from "@szl-holdings/mobile-shared";
import { trackEvent, isAnalyticsEnabled } from "@/lib/analytics";
import { initSentryGlobalHandlers, captureException } from "@/lib/sentry";
import {
  configurePushNotificationHandler,
  usePushNotificationsBase,
} from "@szl-holdings/mobile-shared/notifications";
import { ErrorFallback } from "@/components/ErrorFallback";
import { AppModeBanner } from "@/components/AppModeBanner";
import { AuthProvider, AUTH_TOKEN_KEY } from "@/context/AuthContext";
import { useRunFailureNotifier } from "@/hooks/operations/useRunFailureNotifier";
import { useEscalatedApprovalNotifier } from "@/hooks/operations/useEscalatedApprovalNotifier";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { PrismBusProvider } from "@szl-holdings/prism-bus";
import { ScreenshotGuardProvider } from "@/context/ScreenshotGuardContext";

// Validate EXPO_PUBLIC_* env vars at startup so a misconfigured DOMAIN/API URL
// fails fast with a clear error instead of silently falling back to defaults.
parseMobileEnv();

if (process.env.EXPO_PUBLIC_DOMAIN) {
  setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
}

async function getCortexAuthToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return typeof window !== "undefined"
        ? window.localStorage.getItem(AUTH_TOKEN_KEY)
        : null;
    }
    return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

setAuthTokenGetter(getCortexAuthToken);
setUploadAuthTokenGetter(getCortexAuthToken);

// Wire the shared user-preferences store to our authenticated API client so
// `time_zone` (and any future preference) round-trips with the web app.
setUserPreferencesApiFetcher(async (path, init) => {
  try {
    const { apiFetch } = await import("@/lib/apiClient");
    return (await apiFetch<Record<string, unknown>>(path, init)) ?? null;
  } catch {
    return null;
  }
});

configurePushNotificationHandler();
initSentryGlobalHandlers();

if (isAnalyticsEnabled()) {
  trackEvent("app_launched", { platform: "mobile", app: "cortex" });
} else {
  console.debug("[analytics] Mobile analytics disabled — set EXPO_PUBLIC_POSTHOG_KEY and EXPO_PUBLIC_AMPLITUDE_API_KEY to enable");
}

// Maps a server `domain` (legacy per-app appIds plus unified workspace IDs) to
// the matching Expo Router path inside the unified shell.
const DOMAIN_TO_WORKSPACE_PATH: Record<string, string> = {
  defense: "/(shell)/defense",
  aegis: "/(shell)/defense",
  "aegis-mobile": "/(shell)/defense",
  fleet: "/(shell)/fleet",
  vessels: "/(shell)/fleet",
  properties: "/(shell)/properties",
  terra: "/(shell)/properties",
  operations: "/(shell)/operations",
  lyte: "/(shell)/operations",
  msp: "/(shell)/operations",
  "aegis-ops": "/(shell)/operations",
  advisory: "/(shell)/advisory",
  carlota: "/(shell)/advisory",
  "carlota-jo": "/(shell)/advisory",
  portfolio: "/(shell)/portfolio",
  szl: "/(shell)/portfolio",
  founder: "/(shell)/founder",
  stephen: "/(shell)/founder",
  intelligence: "/(shell)/intelligence",
  cortex: "/(shell)/intelligence",
  inca: "/(shell)/intelligence",
  prism: "/(shell)/advisory",
  command: "/(shell)/",
};

// Maps a notification `kind` (sent by server-side push handlers and local
// alerts for run failures / approval escalations) to a deep link in the shell.
const KIND_TO_DEEP_LINK: Record<string, string> = {
  approval_escalated: "/(shell)/intelligence/approval-inbox",
  run_failed: "/(shell)/intelligence/run-review",
  run_stuck: "/(shell)/intelligence/run-review",
};

function resolveDeepLinkRoute(data: Record<string, unknown> | undefined | null): string | null {
  if (!data) return null;
  if (typeof data.deepLink === "string" && data.deepLink.length > 0) {
    const r = data.deepLink;
    if (r.startsWith("/(shell)") || r.startsWith("/")) return r;
  }
  if (typeof data.kind === "string" && KIND_TO_DEEP_LINK[data.kind]) {
    return KIND_TO_DEEP_LINK[data.kind];
  }
  if (typeof data.route === "string" && data.route.length > 0) {
    const r = data.route;
    if (r.startsWith("/(shell)") || r.startsWith("/")) return r;
  }
  if (typeof data.screen === "string" && data.screen.length > 0) {
    const r = data.screen;
    if (r.startsWith("/(shell)") || r.startsWith("/")) return r;
  }
  if (typeof data.domain === "string") {
    const path = DOMAIN_TO_WORKSPACE_PATH[data.domain.toLowerCase()];
    if (path) return path;
  }
  if (typeof data.appId === "string") {
    const path = DOMAIN_TO_WORKSPACE_PATH[data.appId.toLowerCase()];
    if (path) return path;
  }
  return null;
}

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync("#090810");

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "cortex-rq-cache",
  throttleTime: 3000,
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24,
  buster: "v1",
});

// Module-scoped guards so cold-start notification replay only runs once per
// process, and not again after the user opens the app normally.
let coldStartHandled = false;
let lastHandledNotificationId: string | null = null;

function AppShell() {
  const { isLocked, isEnabled } = useBiometric();

  // App-level watchers for new failed/stuck runs and newly escalated
  // approvals — fire regardless of which screen is active.
  useRunFailureNotifier();
  useEscalatedApprovalNotifier();

  // Cold-start: if the app was launched by tapping a notification, replay the
  // last response once per process. We track the consumed identifier in
  // module scope and try Expo's clear API when available so later normal
  // launches don't re-route to a stale notification target.
  useEffect(() => {
    if (coldStartHandled) return;
    coldStartHandled = true;
    let cancelled = false;
    (async () => {
      try {
        const Notifications = await import("expo-notifications");
        const last = await Notifications.getLastNotificationResponseAsync();
        if (cancelled || !last) return;
        const id = last?.notification?.request?.identifier;
        if (id && lastHandledNotificationId === id) return;
        lastHandledNotificationId = id ?? null;
        try {
          const maybeClear = (Notifications as unknown as {
            clearLastNotificationResponseAsync?: () => Promise<void>;
          }).clearLastNotificationResponseAsync;
          if (typeof maybeClear === "function") await maybeClear();
        } catch {}
        const data = last?.notification?.request?.content?.data as
          | Record<string, unknown>
          | undefined;
        const target = resolveDeepLinkRoute(data);
        if (!target) return;
        setTimeout(() => {
          try { router.navigate(target as never); } catch {}
        }, 400);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  usePushNotificationsBase({
    onTokenAcquired: async (token) => {
      console.log("[CORTEX Push] token:", token.substring(0, 20) + "...");
      try {
        const authToken = await getCortexAuthToken();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
        await fetch(`${API_BASE}/push-tokens`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            token,
            platform: Platform.OS,
            appId: "cortex",
          }),
        });
      } catch (err) {
        console.warn("[CORTEX Push] Failed to register token:", err);
      }
    },
    onNotificationReceived: (notification) => {
      const data = notification.request.content.data as Record<string, unknown>;
      if (data?.domain) {
        queryClient.invalidateQueries({ queryKey: [`${data.domain}-signals`] });
      }
    },
    onNotificationResponse: (response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      const target = resolveDeepLinkRoute(data);
      if (target) {
        try {
          router.navigate(target as never);
        } catch (err) {
          console.warn("[CORTEX Push] navigate failed:", err);
        }
      }
    },
  });

  if (isEnabled && isLocked) {
    return (
      <BiometricLockScreen
        config={{
          appName: "CORTEX",
          subtitle: "Authenticate to access Unified Command",
          accentColor: "#c9a84c",
          backgroundColor: "#090810",
        }}
      />
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="(shell)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false, animation: "slide_from_bottom" }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [interFontsLoaded, interFontError] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  const [spaceFontsLoaded, spaceFontError] = useSpaceFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const fontsLoaded = interFontsLoaded && spaceFontsLoaded;
  const fontError = interFontError || spaceFontError;

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <PrismBusProvider domain="cortex">
      <SafeAreaProvider>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <WorkspaceProvider>
                <ScreenshotGuardProvider>
                <NotificationProvider apiBase={API_BASE} getAuthToken={getCortexAuthToken}>
                  <BiometricProvider
                    config={{
                      storagePrefix: "cortex",
                      appName: "CORTEX",
                      promptMessage: "Authenticate to access Unified Command",
                    }}
                  >
                    <SyncEngineProvider domain="cortex" getToken={getCortexAuthToken}>
                      <GestureHandlerRootView style={{ flex: 1 }}>
                        <ThemeProvider defaultMode="dark" storageKey="cortex-theme-mode">
                          <View style={{ flex: 1 }}>
                            <AppModeBanner />
                            <AppShell />
                            <OfflineBanner accentColor="#c9a84c" />
                            <SyncStatusBanner accentColor="#c9a84c" />
                            <ConflictResolutionModal accentColor="#c9a84c" />
                            <CopilotFab
                              config={{
                                name: "Navigator",
                                icon: "⬡",
                                agentId: "cortex",
                                accentColor: "#c9a84c",
                                welcomeMessage:
                                  "I'm Navigator, your unified command intelligence. Ask me about any domain — defense, fleet, properties, operations, advisory, or portfolio.",
                                placeholderText: "Ask anything across domains...",
                                isAdvisoryAgent: true,
                                conversationKey: "cortex-mobile",
                                suggestedQuestions: [
                                  "Give me a cross-domain briefing",
                                  "What needs my attention today?",
                                  "Show me active critical signals",
                                ],
                                systemPrompt:
                                  "You are Navigator, the unified AI command intelligence for CORTEX — the SZL Holdings executive command app. You have visibility across all domains: Defense (Aegis), Fleet (Vessels), Properties (Terra), Operations (Lyte), Advisory (Carlota Jo), and Portfolio (SZL Holdings). Be strategic, executive-level, and concise. IMPORTANT: You are an ADVISORY AGENT — all decisions require human confirmation.",
                              }}
                            />
                          </View>
                        </ThemeProvider>
                      </GestureHandlerRootView>
                    </SyncEngineProvider>
                  </BiometricProvider>
                </NotificationProvider>
                </ScreenshotGuardProvider>
              </WorkspaceProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </PrismBusProvider>
  );
}
