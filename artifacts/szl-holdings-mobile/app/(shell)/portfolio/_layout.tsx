import { Stack } from 'expo-router';

export default function PortfolioLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
      <Stack.Screen name="portfolio/[id]" />
      <Stack.Screen name="alloy" />
      <Stack.Screen name="trust" />
      <Stack.Screen name="agents" />
      <Stack.Screen name="mcp-tools" />
    </Stack>
  );
}
