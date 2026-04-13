import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from "@expo-google-fonts/inter";
import { setBaseUrl, setAuthTokenGetter } from "@szl-holdings/api-client-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/apiClient";
import { getGraphQLClient } from "@/lib/graphqlClient";
import { Provider as UrqlProvider } from "urql";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import React, { Suspense, lazy, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
const OnboardingCarousel = lazy(() => import("@/components/OnboardingCarousel").then(m => ({ default: m.OnboardingCarousel })));
import { AuthProvider } from "@/context/AuthContext";
import { BiometricLockProvider } from "@/context/BiometricLockContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import { PrismBusProvider } from "@szl-holdings/prism-bus/provider";

if (process.env.EXPO_PUBLIC_DOMAIN) {
  setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
}
setAuthTokenGetter(() => getAuthToken());

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync("#090810");

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

  if (!onboardingLoading && !hasCompletedOnboarding) {
    return (
      <Suspense fallback={<View style={{ flex: 1, backgroundColor: "#080c14", justifyContent: "center", alignItems: "center" }}><ActivityIndicator color="#6366f1" /></View>}>
        <OnboardingCarousel onComplete={completeOnboarding} />
      </Suspense>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false, animation: "slide_from_bottom" }} />
      <Stack.Screen name="portfolio/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
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
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <UrqlProvider value={getGraphQLClient()}>
            <AuthProvider>
              <BiometricLockProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </BiometricLockProvider>
            </AuthProvider>
          </UrqlProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
    </PrismBusProvider>
  );
}
