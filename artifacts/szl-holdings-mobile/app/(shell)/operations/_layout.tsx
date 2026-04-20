import { Stack } from 'expo-router';
import React from 'react';
import { LyteProvider } from '@/context/LyteContext';
import { NotificationProvider as LyteNotificationProvider } from '@/context/LyteNotificationContext';

export default function OperationsLayout() {
  return (
    <LyteNotificationProvider>
      <LyteProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
          <Stack.Screen name="signals" />
          <Stack.Screen name="prism" />
          <Stack.Screen name="receipts" />
          <Stack.Screen name="agent-chat" />
          <Stack.Screen name="mcp-tools" />
        </Stack>
      </LyteProvider>
    </LyteNotificationProvider>
  );
}
