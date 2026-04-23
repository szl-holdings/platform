import { Redirect, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { BottomTabBar } from '@/components/BottomTabBar';
import { ScreenshotPolicyEnforcer } from '@/components/ScreenshotPolicyEnforcer';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { useAuth } from '@/context/AuthContext';
import { NotificationCountProvider } from '@/context/NotificationCountContext';

export default function ShellLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/auth" />;
  }

  return (
    <NotificationCountProvider>
      <View style={styles.root}>
        <View style={styles.stackContainer}>
          <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="defense" />
            <Stack.Screen name="fleet" />
            <Stack.Screen name="properties" />
            <Stack.Screen name="operations" />
            <Stack.Screen name="advisory" />
            <Stack.Screen name="portfolio" />
            <Stack.Screen name="founder" />
            <Stack.Screen name="quick-actions" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen
              name="quick-actions-history"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="intelligence" />
            <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="usage" options={{ animation: 'slide_from_right' }} />
          </Stack>
        </View>
        <BottomTabBar />
        <WorkspaceSwitcher />
        <ScreenshotPolicyEnforcer />
      </View>
    </NotificationCountProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stackContainer: { flex: 1 },
});
