import React from "react";
import { Stack } from "expo-router";

export default function PropertiesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="(tabs)" options={{ animation: "none" }} />
      <Stack.Screen name="property/[id]" />
      <Stack.Screen name="capture" />
      <Stack.Screen name="agent-chat" />
      <Stack.Screen name="mcp-tools" />
    </Stack>
  );
}
