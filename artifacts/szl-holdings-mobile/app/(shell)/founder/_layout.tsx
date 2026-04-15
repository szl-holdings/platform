import React from "react";
import { Stack } from "expo-router";

export default function FounderLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="(tabs)" options={{ animation: "none" }} />
      <Stack.Screen name="article/[slug]" />
      <Stack.Screen name="venture/[slug]" />
      <Stack.Screen name="mcp-tools" />
    </Stack>
  );
}
