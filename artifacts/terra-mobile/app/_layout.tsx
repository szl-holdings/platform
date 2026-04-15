import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from "@expo-google-fonts/inter";
import { setBaseUrl, setAuthTokenGetter } from "@szl-holdings/api-client-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { AUTH_TOKEN_KEY } from "@/context/AuthContext";
import { Redirect, Slot, Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { PrismBusProvider } from "@szl-holdings/prism-bus";
import { ErrorBoundary, NotificationProvider } from "@szl-holdings/mobile-shared";
import { ErrorFallback } from "@/components/ErrorFallback";

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
SystemUI.setBackgroundColorAsync("#0d0b08");

const TERRA_API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

async function getTerraAuthToken(): Promise<string | null> {
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

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  const isAuthRoute = pathname.startsWith("/auth");

  if (isLoading) return null;

  if (!isAuthenticated && !isAuthRoute) {
    return <Redirect href="/auth" />;
  }

  if (isAuthenticated && isAuthRoute) {
    return <Redirect href="/" />;
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  usePushNotifications();

  return (
    <AuthGuard>
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false, animation: "slide_from_bottom" }} />
        <Stack.Screen name="property/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="capture" options={{ headerShown: false, animation: "slide_from_bottom" }} />
        <Stack.Screen name="agent-chat" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="mcp-tools" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </AuthGuard>
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
    <PrismBusProvider domain="terra">
    <SafeAreaProvider>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotificationProvider apiBase={TERRA_API_BASE} getAuthToken={getTerraAuthToken}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </NotificationProvider>
        </AuthProvider>
      </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
    </PrismBusProvider>
  );
}
