import { Redirect, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BottomTabBar } from '@/components/BottomTabBar';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ScreenshotPolicyEnforcer } from '@/components/ScreenshotPolicyEnforcer';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { useAuth } from '@/context/AuthContext';
import { NotificationCountProvider } from '@/context/NotificationCountContext';
import { useOfflineQueue, type QueueEntry } from '@/hooks/useOfflineQueue';
import { apiFetch, getApiBase } from '@/lib/apiClient';
import { registerForPushNotificationsAsync } from '@/hooks/usePushNotifications';

async function ensurePulsePushSchedule(): Promise<void> {
  try {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      await apiFetch('/api/push-tokens', {
        method: 'POST',
        body: JSON.stringify({ token, platform: 'ios', appId: 'cortex-mobile' }),
      }).catch(() => {});
    }
    // PUT with default values ensures a row is persisted for this user so the
    // delivery job can find them. If a row already exists, this is a no-op
    // because the API uses onConflictDoUpdate with unchanged values.
    await apiFetch('/api/pulse/push-schedule', {
      method: 'PUT',
      body: JSON.stringify({ enabled: true, deliveryHourUtc: 7 }),
    }).catch(() => {});
  } catch {
    // best-effort — never throw from shell
  }
}

async function defaultActionExecutor(entry: QueueEntry): Promise<void> {
  const url = `${getApiBase()}/api/offline-sync`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: entry.type, payload: entry.payload, queuedAt: entry.queuedAt }),
  });
  if (!resp.ok) throw new Error(`Sync failed: ${resp.status}`);
}

export default function ShellLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isOffline, setIsOffline] = useState(false);
  const wasOfflineRef = useRef(false);
  const { queueCount, totalQueueCount, flush } = useOfflineQueue();
  const pushRegisteredRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !pushRegisteredRef.current) {
      pushRegisteredRef.current = true;
      ensurePulsePushSchedule();
    }
  }, [isAuthenticated]);

  // `queueCount` is the count of items flush() can actually process (our szl:offline queue).
  // `totalQueueCount` includes legacy queue entries from other flows — those are counted for
  // display so the user sees the real total, but they are not dispatched through this path.
  const flushPendingActions = useCallback(() => {
    if (queueCount === 0) return;
    flush(defaultActionExecutor).catch(() => {});
  }, [flush, queueCount]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !(state.isConnected ?? true);
      setIsOffline(offline);
      if (wasOfflineRef.current && !offline) {
        flushPendingActions();
      }
      wasOfflineRef.current = offline;
    });
    return () => unsubscribe();
  }, [flushPendingActions]);

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/auth" />;
  }

  return (
    <NotificationCountProvider>
      <View style={styles.root}>
        <OfflineBanner isOffline={isOffline} queuedCount={totalQueueCount} />
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
