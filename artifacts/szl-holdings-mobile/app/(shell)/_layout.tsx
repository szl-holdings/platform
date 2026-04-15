import React from "react";
import { Redirect, Stack } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { ScreenshotPolicyEnforcer } from "@/components/ScreenshotPolicyEnforcer";

export default function ShellLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/auth" />;
  }

  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false, animation: "none" }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="defense" />
        <Stack.Screen name="fleet" />
        <Stack.Screen name="properties" />
        <Stack.Screen name="operations" />
        <Stack.Screen name="advisory" />
        <Stack.Screen name="portfolio" />
        <Stack.Screen name="founder" />
        <Stack.Screen name="quick-actions" options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="settings" options={{ animation: "slide_from_right" }} />
      </Stack>
      <WorkspaceSwitcher />
      <ScreenshotPolicyEnforcer />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
