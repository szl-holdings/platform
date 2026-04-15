import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { setBaseUrl, setAuthTokenGetter } from "@szl-holdings/api-client-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { persistQueryClient } from "@tanstack/query-persist-client-core";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform, View } from "react-native";
import { AUTH_TOKEN_KEY } from "@/context/AuthContext";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  ErrorBoundary,
  NotificationProvider,
  OfflineBanner,
  ThemeProvider,
  CopilotFab,
  setUploadAuthTokenGetter,
  BiometricProvider,
  BiometricLockScreen,
  useBiometric,
} from "@szl-holdings/mobile-shared";
import {
  configurePushNotificationHandler,
  usePushNotificationsBase,
} from "@szl-holdings/mobile-shared/notifications";
import { ErrorFallback } from "@/components/ErrorFallback";
import { AuthProvider } from "@/context/AuthContext";
import { PrismBusProvider } from "@szl-holdings/prism-bus";

if (process.env.EXPO_PUBLIC_DOMAIN) {
  setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
}
setAuthTokenGetter(() => {
  if (Platform.OS === "web") {
    return Promise.resolve(
      typeof window !== "undefined"
        ? window.localStorage.getItem(AUTH_TOKEN_KEY)
        : null
    );
  }
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
});
setUploadAuthTokenGetter(() => {
  if (Platform.OS === "web") {
    return Promise.resolve(
      typeof window !== "undefined"
        ? window.localStorage.getItem(AUTH_TOKEN_KEY)
        : null
    );
  }
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
});

configurePushNotificationHandler();

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync("#020d18");

const VESSELS_API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

async function getVesselsAuthToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return typeof window !== "undefined" ? window.localStorage.getItem(AUTH_TOKEN_KEY) : null;
    }
    return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "vessels-rq-cache",
  throttleTime: 3000,
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24,
  buster: "v1",
});

function AppShell() {
  const { isLocked, isEnabled } = useBiometric();

  usePushNotificationsBase({
    onTokenAcquired: async (token) => {
      console.log("[Push] Vessels token acquired:", token.substring(0, 20) + "...");
    },
    onNotificationReceived: (notification) => {
      const data = notification.request.content.data as Record<string, unknown>;
      if (data?.severity === "critical") {
        queryClient.invalidateQueries({ queryKey: ["fleet-exceptions-mobile"] });
      }
    },
    onNotificationResponse: (response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      if (typeof data?.vesselId === "number") {
        queryClient.invalidateQueries({ queryKey: ["vessel-detail", data.vesselId] });
      }
    },
  });

  if (isEnabled && isLocked) {
    return (
      <BiometricLockScreen
        config={{
          appName: "Vessels",
          subtitle: "Authenticate to access Fleet Command",
          accentColor: "#0ea5e9",
          backgroundColor: "#020d18",
        }}
      />
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="vessel/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="auth" options={{ headerShown: false, animation: "slide_from_bottom" }} />
      <Stack.Screen name="economics" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="mcp-tools" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <PrismBusProvider domain="vessels">
    <SafeAreaProvider>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NotificationProvider apiBase={VESSELS_API_BASE} getAuthToken={getVesselsAuthToken}>
              <BiometricProvider config={{ storagePrefix: "vessels", appName: "Vessels", promptMessage: "Authenticate to access Vessels Fleet Command" }}>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <ThemeProvider defaultMode="dark" storageKey="vessels-theme-mode">
                    <View style={{ flex: 1 }}>
                      <AppShell />
                      <OfflineBanner accentColor="#ef4444" />
                      <CopilotFab config={{
                        name: "Helmsman",
                        icon: "⚓",
                        agentId: "vessels",
                        accentColor: "#0ea5e9",
                        welcomeMessage: "I'm Helmsman, your maritime intelligence analyst. Ask about fleet status, voyage economics, route risk, or AIS anomalies.",
                        placeholderText: "Ask about fleet & voyages...",
                        isAdvisoryAgent: true,
                        conversationKey: "vessels-mobile",
                        suggestedQuestions: [
                          "What vessels have exceptions right now?",
                          "Summarise fleet performance this week",
                          "Are there any route risk alerts?",
                        ],
                        systemPrompt: "You are Helmsman, the AI copilot for Vessels Maritime Intelligence. You specialize in fleet tracking, AIS data, voyage economics, route risk, dark vessel detection, and maritime compliance. Be operational and precise. IMPORTANT: You are an ADVISORY AGENT — all voyage decisions require human confirmation.",
                      }} />
                    </View>
                  </ThemeProvider>
                </GestureHandlerRootView>
              </BiometricProvider>
            </NotificationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
    </PrismBusProvider>
  );
}
