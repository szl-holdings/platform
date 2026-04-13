import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { setBaseUrl, setAuthTokenGetter } from "@szl-holdings/api-client-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { AUTH_TOKEN_KEY } from "@/context/AuthContext";
import { Stack, router, type Href } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import React, { Suspense, lazy, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
const OnboardingCarousel = lazy(() => import("@/components/OnboardingCarousel").then(m => ({ default: m.OnboardingCarousel })));
import { BiometricLockScreen } from "@/components/BiometricLockScreen";
import { AuthProvider } from "@/context/AuthContext";
import { BiometricProvider, useBiometric } from "@/context/BiometricContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import { PrismBusProvider } from "@szl-holdings/prism-bus/provider";
import {
  registerForPushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from "@/lib/notifications";

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
SystemUI.setBackgroundColorAsync("#020d18");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function RootLayoutNav() {
  const { isLoading: onboardingLoading, hasCompletedOnboarding, completeOnboarding } = useOnboarding();
  const { isEnabled, isLocked } = useBiometric();

  if (isEnabled && isLocked) {
    return <BiometricLockScreen />;
  }

  if (!onboardingLoading && !hasCompletedOnboarding) {
    return (
      <Suspense fallback={<View style={{ flex: 1, backgroundColor: "#0a1628", justifyContent: "center", alignItems: "center" }}><ActivityIndicator color="#3b82f6" /></View>}>
        <OnboardingCarousel onComplete={completeOnboarding} />
      </Suspense>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="vessel/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="auth" options={{ headerShown: false, animation: "slide_from_bottom" }} />
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

  useEffect(() => {
    registerForPushNotifications().catch(() => {});

    const receivedSub = addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as Record<string, unknown>;
      if (data?.severity === "critical") {
        queryClient.invalidateQueries({ queryKey: ["fleet-exceptions-mobile"] });
      }
    });

    const responseSub = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      const FLEET_HREF: Href = { pathname: "/(tabs)/fleet" };
      const ALERTS_HREF: Href = { pathname: "/(tabs)/alerts" };
      if (data?.vesselId) {
        queryClient.invalidateQueries({ queryKey: ["vessel-detail", data.vesselId] });
        const vesselHref: Href = { pathname: "/vessel/[id]", params: { id: String(data.vesselId) } };
        router.push(vesselHref);
      } else if (data?.type === "alert" || data?.type === "distress") {
        router.push(ALERTS_HREF);
      } else if (data?.type === "vessel") {
        router.push(FLEET_HREF);
      }
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <PrismBusProvider domain="vessels">
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BiometricProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </BiometricProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
    </PrismBusProvider>
  );
}
