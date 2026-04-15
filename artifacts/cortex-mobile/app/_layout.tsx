import {
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
import * as SecureStore from "expo-secure-store";
import { Platform, View } from "react-native";
import { AUTH_TOKEN_KEY } from "@/context/AuthContext";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary, NotificationProvider, OfflineBanner, ThemeProvider, CopilotFab, setUploadAuthTokenGetter, SyncEngineProvider, SyncStatusBanner, ConflictResolutionModal } from "@szl-holdings/mobile-shared";
import { ErrorFallback } from "@/components/ErrorFallback";
import { BiometricLockScreen } from "@/components/BiometricLockScreen";
import { AuthProvider } from "@/context/AuthContext";
import { BiometricProvider, useBiometric } from "@/context/BiometricContext";
import { WorkspaceProvider, useWorkspace } from "@/context/WorkspaceContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
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

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync("#080B12");

const CORTEX_API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

async function getCortexAuthToken(): Promise<string | null> {
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

function CopilotOverlay() {
  const { config } = useWorkspace();
  return (
    <CopilotFab config={{
      name: config.copilotName,
      icon: config.copilotIcon,
      agentId: config.copilotAgentId,
      accentColor: config.accentColor,
      welcomeMessage: `I'm ${config.copilotName}, your ${config.label} copilot. How can I help?`,
      placeholderText: `Ask ${config.copilotName}...`,
      isAdvisoryAgent: true,
      conversationKey: `cortex-${config.id}`,
      suggestedQuestions: [
        `What needs my attention in ${config.shortLabel}?`,
        "Show me the latest updates",
        "Any critical alerts?",
      ],
      systemPrompt: `You are ${config.copilotName}, the AI copilot for ${config.label} inside the CORTEX unified command app. Be direct and operational. All actions require human confirmation.`,
    }} />
  );
}

function AppShell() {
  const { isLocked, isEnabled } = useBiometric();
  usePushNotifications();

  if (isEnabled && isLocked) {
    return <BiometricLockScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false, animation: "slide_from_bottom" }} />
      <Stack.Screen name="workspace-switcher" options={{ headerShown: false, animation: "slide_from_bottom", presentation: "modal" }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [interFontsLoaded, interFontError] = useFonts({
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
    <WorkspaceProvider>
      <PrismBusProvider domain="cortex">
        <SafeAreaProvider>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <NotificationProvider apiBase={CORTEX_API_BASE} getAuthToken={getCortexAuthToken}>
                  <BiometricProvider>
                    <SyncEngineProvider domain="cortex" getToken={getCortexAuthToken}>
                      <GestureHandlerRootView style={{ flex: 1 }}>
                        <ThemeProvider defaultMode="dark" storageKey="cortex-theme-mode">
                          <KeyboardProvider>
                            <View style={{ flex: 1 }}>
                              <AppShell />
                              <OfflineBanner accentColor="#ef4444" />
                              <SyncStatusBanner accentColor="#6366f1" />
                              <ConflictResolutionModal accentColor="#ef4444" />
                              <CopilotOverlay />
                            </View>
                          </KeyboardProvider>
                        </ThemeProvider>
                      </GestureHandlerRootView>
                    </SyncEngineProvider>
                  </BiometricProvider>
                </NotificationProvider>
              </AuthProvider>
            </QueryClientProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </PrismBusProvider>
    </WorkspaceProvider>
  );
}
