import { Stack } from 'expo-router';
import React from 'react';

export default function PropertiesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
      <Stack.Screen name="property/[id]" />
      <Stack.Screen name="capture" />
      <Stack.Screen name="agent-chat" />
      <Stack.Screen name="mcp-tools" />
      <Stack.Screen name="ar-viewer" options={{ animation: 'fade' }} />
      <Stack.Screen name="rent-roll" />
      <Stack.Screen name="construction-monitor" />
      <Stack.Screen name="tenant-screening" />
      <Stack.Screen name="lease-abstraction" />
      <Stack.Screen name="pro-forma" />
      <Stack.Screen name="exchange-1031" />
      <Stack.Screen name="tax-appeal" />
      <Stack.Screen name="waterfall" />
    </Stack>
  );
}
