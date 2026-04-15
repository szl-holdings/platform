import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { persistQueryClient } from "@tanstack/query-persist-client-core";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import React, { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AlertNotifierBridge } from "@/components/AlertNotifierBridge";
import { ErrorBoundary, NotificationProvider as SharedNotificationProvider, OfflineBanner, ThemeProvider, CopilotFab, setUploadAuthTokenGetter } from "@szl-holdings/mobile-shared";
import { ErrorFallback } from "@/components/ErrorFallback";
import { AuthProvider } from "@/context/AuthContext";
import { LyteProvider } from "@/context/LyteContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { PrismBusProvider } from "@szl-holdings/prism-bus";
import * as SecureStoreLyte from "expo-secure-store";

const LYTE_TOKEN_KEY = "lyte_session_token";
setUploadAuthTokenGetter(() => SecureStoreLyte.getItemAsync(LYTE_TOKEN_KEY));

SystemUI.setBackgroundColorAsync("#070c14");
SplashScreen.preventAutoHideAsync();

const LYTE_API_BASE = process.env.EXPO_PUBLIC_DOMAIN
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
  key: "lyte-rq-cache",
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
      <Stack.Screen name="signals" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="prism" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="receipts" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="agent-chat" options={{ headerShown: false, animation: "slide_from_right" }} />
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
    <PrismBusProvider domain="lyte">
    <SafeAreaProvider>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NotificationProvider>
              <SharedNotificationProvider apiBase={LYTE_API_BASE} enabled={false}>
                <LyteProvider>
                  <AlertNotifierBridge />
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <ThemeProvider defaultMode="dark" storageKey="lyte-theme-mode">
                      <View style={{ flex: 1 }}>
                        <RootLayoutNav />
                        <OfflineBanner accentColor="#ef4444" />
                        <CopilotFab config={{
                          name: "Lyte Ops",
                          icon: "⚡",
                          agentId: "lyte",
                          accentColor: "#a855f7",
                          welcomeMessage: "I'm Lyte Ops, your AIOps intelligence analyst. Ask about signals, incidents, operational patterns, or playbook recommendations.",
                          placeholderText: "Ask about signals & incidents...",
                          isAdvisoryAgent: true,
                          conversationKey: "lyte-mobile",
                          suggestedQuestions: [
                            "What signals need triage right now?",
                            "Show me the top operational anomalies",
                            "What playbooks are recommended?",
                          ],
                          systemPrompt: "You are Lyte Ops, the AI copilot for Lyte AIOps Command Center. You specialize in signal analysis, incident triage, operational recommendations, and playbook management. Be operational and action-oriented. IMPORTANT: You are an ADVISORY AGENT — all remediation actions require human confirmation.",
                        }} />
                      </View>
                    </ThemeProvider>
                  </GestureHandlerRootView>
                </LyteProvider>
              </SharedNotificationProvider>
            </NotificationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
    </PrismBusProvider>
  );
}
