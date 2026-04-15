import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from "@expo-google-fonts/inter";
import { setBaseUrl, setAuthTokenGetter } from "@szl-holdings/api-client-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { persistQueryClient } from "@tanstack/query-persist-client-core";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuthToken } from "@/lib/apiClient";
import { getGraphQLClient } from "@/lib/graphqlClient";
import { Provider as UrqlProvider } from "urql";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import React, { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary, NotificationProvider, OfflineBanner, ThemeProvider, CopilotFab, setUploadAuthTokenGetter } from "@szl-holdings/mobile-shared";
import { ErrorFallback } from "@/components/ErrorFallback";
import { AuthProvider } from "@/context/AuthContext";
import { BiometricLockProvider } from "@/context/BiometricLockContext";
import { PrismBusProvider } from "@szl-holdings/prism-bus";

if (process.env.EXPO_PUBLIC_DOMAIN) {
  setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
}
setAuthTokenGetter(() => getAuthToken());
setUploadAuthTokenGetter(() => getAuthToken());

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync("#090810");

const SZL_API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

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
  key: "szl-holdings-rq-cache",
  throttleTime: 3000,
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24,
  buster: "v1",
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false, animation: "slide_from_bottom" }} />
      <Stack.Screen name="portfolio/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="alloy" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="trust" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="agents" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="mcp-tools" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <PrismBusProvider domain="szl-holdings">
    <SafeAreaProvider>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <QueryClientProvider client={queryClient}>
          <UrqlProvider value={getGraphQLClient()}>
            <AuthProvider>
              <NotificationProvider apiBase={SZL_API_BASE} getAuthToken={getAuthToken}>
                <BiometricLockProvider>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <ThemeProvider defaultMode="dark" storageKey="szl-theme-mode">
                      <View style={{ flex: 1 }}>
                        <RootLayoutNav />
                        <OfflineBanner accentColor="#c8a96e" />
                        <CopilotFab config={{
                          name: "Navigator",
                          icon: "◈",
                          agentId: "szl",
                          accentColor: "#c8a96e",
                          welcomeMessage: "I'm Navigator, your executive intelligence analyst for SZL Holdings. Ask about portfolio performance, asset status, or cross-domain updates.",
                          placeholderText: "Ask about portfolio & assets...",
                          isAdvisoryAgent: true,
                          conversationKey: "szl-mobile",
                          suggestedQuestions: [
                            "How is the portfolio performing this quarter?",
                            "What matters need my attention today?",
                            "Give me an executive briefing",
                          ],
                          systemPrompt: "You are Navigator, the AI executive analyst for SZL Holdings family office platform. You specialize in portfolio oversight, investment performance, governance, asset tracking across maritime, real estate, and technology holdings. Be authoritative and executive-level. IMPORTANT: You are an ADVISORY AGENT — all investment decisions require human confirmation.",
                        }} />
                      </View>
                    </ThemeProvider>
                  </GestureHandlerRootView>
                </BiometricLockProvider>
              </NotificationProvider>
            </AuthProvider>
          </UrqlProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
    </PrismBusProvider>
  );
}
