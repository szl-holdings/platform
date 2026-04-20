import React from "react";
import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="widgets" />
      <Stack.Screen name="digest" />
      <Stack.Screen name="alerts" />
      <Stack.Screen name="timezone" />
      <Stack.Screen name="security" />
    </Stack>
  );
}
