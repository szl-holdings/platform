import {
  CormorantGaramond_300Light,
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium,
  useFonts as useCormorantFonts,
} from "@expo-google-fonts/cormorant-garamond";
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
import * as SecureStore from "expo-secure-store";
import { Platform, View } from "react-native";
import { AUTH_TOKEN_KEY, useAuth } from "@/context/AuthContext";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary, NotificationProvider, OfflineBanner, ThemeProvider } from "@szl-holdings/mobile-shared";
import { ErrorFallback } from "@/components/ErrorFallback";
import { AuthProvider, AUTH_TOKEN_KEY } from "@/context/AuthContext";
import { PushNotificationBootstrap } from "@/components/PushNotificationBootstrap";
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

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync("#0e0c09");

const CJ_API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

async function cjGetAuthToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return typeof window !== "undefined" ? window.localStorage.getItem(AUTH_TOKEN_KEY) : null;
    }
    return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function CJNotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return (
    <NotificationProvider
      apiBase={CJ_API_BASE}
      getAuthToken={cjGetAuthToken}
      enabled={isAuthenticated}
    >
      {children}
    </NotificationProvider>
  );
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
  key: "carlota-jo-rq-cache",
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
      <Stack.Screen name="agent-chat" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="mcp-tools" options={{ headerShown: false, animation: "slide_from_right" }} />
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
  const [cormorantFontsLoaded, cormorantFontError] = useCormorantFonts({
    CormorantGaramond_300Light,
    CormorantGaramond_400Regular,
    CormorantGaramond_500Medium,
  });

  const fontsLoaded = interFontsLoaded && cormorantFontsLoaded;
  const fontError = interFontError || cormorantFontError;

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <PrismBusProvider domain="carlota-jo">
    <SafeAreaProvider>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CJNotificationProvider>
              <PushNotificationBootstrap />
              <GestureHandlerRootView style={{ flex: 1 }}>
                <ThemeProvider defaultMode="dark" storageKey="carlota-theme-mode">
                  <KeyboardProvider>
                    <View style={{ flex: 1 }}>
                      <RootLayoutNav />
                      <OfflineBanner accentColor="#b8943c" />
                    </View>
                  </KeyboardProvider>
                </ThemeProvider>
              </GestureHandlerRootView>
            </CJNotificationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
    </PrismBusProvider>
  );
}
