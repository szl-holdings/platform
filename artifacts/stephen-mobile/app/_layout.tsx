import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from "@expo-google-fonts/inter";
import { setBaseUrl } from "@szl-holdings/api-client-react";
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
import { KeyboardProvider } from "react-native-keyboard-controller";
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
import { ErrorFallback } from "@/components/ErrorFallback";
import { PrismBusProvider } from "@szl-holdings/prism-bus";
import { usePushNotifications } from "@/hooks/usePushNotifications";

if (process.env.EXPO_PUBLIC_DOMAIN) {
  setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
}
setUploadAuthTokenGetter(() => null);

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync("#0a0a0a");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60000,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "stephen-rq-cache",
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
  usePushNotifications(true);

  if (isEnabled && isLocked) {
    return (
      <BiometricLockScreen
        config={{
          appName: "Stephen",
          subtitle: "Authenticate to access your personal command center",
          accentColor: "#6366f1",
          backgroundColor: "#0a0a0a",
        }}
      />
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="article/[slug]" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="venture/[slug]" options={{ headerShown: false, animation: "slide_from_right" }} />
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
    <PrismBusProvider domain="stephen">
    <SafeAreaProvider>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <QueryClientProvider client={queryClient}>
          <NotificationProvider apiBase="" enabled={false}>
            <BiometricProvider config={{ storagePrefix: "stephen", appName: "Stephen", promptMessage: "Authenticate to access Stephen" }}>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <ThemeProvider defaultMode="system" storageKey="stephen-theme-mode">
                  <KeyboardProvider>
                    <View style={{ flex: 1 }}>
                      <AppShell />
                      <OfflineBanner accentColor="#6366f1" />
                      <CopilotFab config={{
                        name: "Stephen AI",
                        icon: "◈",
                        agentId: "stephen",
                        accentColor: "#6366f1",
                        welcomeMessage: "I'm Stephen AI, your personal command centre. Ask about the platform, the thesis, scheduled tasks, or cross-ecosystem updates.",
                        placeholderText: "Ask anything...",
                        isAdvisoryAgent: false,
                        conversationKey: "stephen-mobile",
                        suggestedQuestions: [
                          "What needs my attention today?",
                          "Give me a briefing across all platforms",
                          "What's the SZL Holdings investment thesis?",
                        ],
                        systemPrompt: "You are Stephen AI, the personal AI assistant for Stephen Lutar. You help manage the SZL Holdings ecosystem, surface cross-platform intelligence, and provide strategic context on the platform and investment thesis. Be precise, strategic, and concise.",
                      }} />
                    </View>
                  </KeyboardProvider>
                </ThemeProvider>
              </GestureHandlerRootView>
            </BiometricProvider>
          </NotificationProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
    </PrismBusProvider>
  );
}
