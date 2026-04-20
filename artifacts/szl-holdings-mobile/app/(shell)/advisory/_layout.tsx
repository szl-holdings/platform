import { Stack } from 'expo-router';
import React from 'react';

export default function AdvisoryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
      <Stack.Screen name="agent-chat" />
      <Stack.Screen name="mcp-tools" />
    </Stack>
  );
}
