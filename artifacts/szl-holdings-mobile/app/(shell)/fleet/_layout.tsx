import React from "react";
import { Stack } from "expo-router";

export default function FleetLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="(tabs)" options={{ animation: "none" }} />
      <Stack.Screen name="vessel/[id]" />
      <Stack.Screen name="economics" />
      <Stack.Screen name="mcp-tools" />
    </Stack>
  );
}
