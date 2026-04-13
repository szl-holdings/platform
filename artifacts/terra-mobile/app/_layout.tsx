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
import React, { Suspense, lazy, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { BiometricProvider, useBiometric } from "@/context/BiometricContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useOnboarding } from "@/hooks/useOnboarding";
const OnboardingCarousel = lazy(() => import("@/components/OnboardingCarousel").then(m => ({ default: m.OnboardingCarousel })));
import { BiometricLockScreen } from "@/components/BiometricLockScreen";
import { PrismBusProvider } from "@szl-holdings/prism-bus/provider";

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
  const { isLoading: onboardingLoading, hasCompletedOnboarding, completeOnboarding } = useOnboarding();
  const { isEnabled, isLocked } = useBiometric();
  usePushNotifications();

  if (isEnabled && isLocked) {
    return <BiometricLockScreen />;
  }

  if (!onboardingLoading && !hasCompletedOnboarding) {
    return (
      <Suspense fallback={<View style={{ flex: 1, backgroundColor: "#0a0a0a", justifyContent: "center", alignItems: "center" }}><ActivityIndicator color="#10b981" /></View>}>
        <OnboardingCarousel onComplete={completeOnboarding} />
      </Suspense>
    );
  }

  return (
    <AuthGuard>
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false, animation: "slide_from_bottom" }} />
        <Stack.Screen name="property/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="capture" options={{ headerShown: false, animation: "slide_from_bottom" }} />
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
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BiometricProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </BiometricProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
    </PrismBusProvider>
  );
}
