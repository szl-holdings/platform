import { Stack } from 'expo-router';

export default function DefenseLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
      <Stack.Screen name="incident/[id]" />
      <Stack.Screen name="finding/[id]" />
      <Stack.Screen name="approvals" />
      <Stack.Screen name="findings" />
      <Stack.Screen name="mitre" />
      <Stack.Screen name="agents" />
      <Stack.Screen name="agents-list" />
      <Stack.Screen name="mcp-tools" />
      <Stack.Screen name="workflow/[id]" />
      <Stack.Screen name="agent/[id]" />
    </Stack>
  );
}
