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

import { ErrorBoundary, NotificationProvider, OfflineBanner, ThemeProvider } from "@szl-holdings/mobile-shared";
import { ErrorFallback } from "@/components/ErrorFallback";
import { BiometricLockScreen } from "@/components/BiometricLockScreen";
import { AuthProvider } from "@/context/AuthContext";
import { BiometricProvider, useBiometric } from "@/context/BiometricContext";
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

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync("#080B12");

const AEGIS_API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

async function getAegisAuthToken(): Promise<string | null> {
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
      <Stack.Screen name="incident/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="finding/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="approvals" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="findings" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="mitre" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="mcp-tools" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="agents" options={{ headerShown: false, animation: "slide_from_right" }} />
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
    <PrismBusProvider domain="aegis">
    <SafeAreaProvider>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NotificationProvider apiBase={AEGIS_API_BASE} getAuthToken={getAegisAuthToken}>
              <BiometricProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <ThemeProvider defaultMode="dark" storageKey="aegis-theme-mode">
                    <KeyboardProvider>
                      <View style={{ flex: 1 }}>
                        <AppShell />
                        <OfflineBanner accentColor="#ef4444" />
                      </View>
                    </KeyboardProvider>
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
