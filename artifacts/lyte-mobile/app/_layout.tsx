import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { reloadAppAsync } from "expo";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import React, { Suspense, lazy, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AlertNotifierBridge } from "@/components/AlertNotifierBridge";
import { ErrorBoundary } from "@/components/ErrorBoundary";
const OnboardingCarousel = lazy(() => import("@/components/OnboardingCarousel").then(m => ({ default: m.OnboardingCarousel })));
import { BiometricLockScreen } from "@/components/BiometricLockScreen";
import { AuthProvider } from "@/context/AuthContext";
import { BiometricProvider, useBiometric } from "@/context/BiometricContext";
import { LyteProvider } from "@/context/LyteContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import { PrismBusProvider } from "@szl-holdings/prism-bus/provider";

SystemUI.setBackgroundColorAsync("#070c14");
SplashScreen.preventAutoHideAsync();

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
      <Suspense fallback={<View style={{ flex: 1, backgroundColor: "#050a18", justifyContent: "center", alignItems: "center" }}><ActivityIndicator color="#3b82f6" /></View>}>
        <OnboardingCarousel onComplete={completeOnboarding} />
      </Suspense>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
      <ErrorBoundary onReload={() => reloadAppAsync()}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BiometricProvider>
              <NotificationProvider>
                <LyteProvider>
                  <AlertNotifierBridge />
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <RootLayoutNav />
                  </GestureHandlerRootView>
                </LyteProvider>
              </NotificationProvider>
            </BiometricProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
    </PrismBusProvider>
  );
}
