import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { registerForPushNotificationsAsync } from '../notifications';

export interface UsePushNotificationsBaseOptions {
  enabled?: boolean;
  /**
   * When true, skips the automatic call to registerForPushNotificationsAsync()
   * and only sets up notification listeners. Useful for apps that manage their
   * own permission/token flow (e.g. lazy/on-demand permission prompts).
   */
  skipAutoRegistration?: boolean;
  onTokenAcquired?: (token: string) => Promise<void>;
  onNotificationReceived?: (notification: Notifications.Notification) => void;
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void;
}

export function usePushNotificationsBase(options: UsePushNotificationsBaseOptions = {}): void {
  const { enabled = true, skipAutoRegistration = false } = options;

  // Store callbacks in refs so the effect doesn't re-run when inline callbacks change identity
  const onTokenAcquiredRef = useRef(options.onTokenAcquired);
  const onNotificationReceivedRef = useRef(options.onNotificationReceived);
  const onNotificationResponseRef = useRef(options.onNotificationResponse);

  // Keep refs current on every render without triggering effect re-run
  onTokenAcquiredRef.current = options.onTokenAcquired;
  onNotificationReceivedRef.current = options.onNotificationReceived;
  onNotificationResponseRef.current = options.onNotificationResponse;

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;

    let mounted = true;
    let notificationListener: Notifications.EventSubscription | null = null;
    let responseListener: Notifications.EventSubscription | null = null;

    async function setup() {
      if (!skipAutoRegistration) {
        try {
          const token = await registerForPushNotificationsAsync();

          // Guard: skip if component unmounted during async work
          if (!mounted) return;

          if (token && onTokenAcquiredRef.current) {
            await onTokenAcquiredRef.current(token).catch((_err) => {
            });
          }
        } catch (_err) {
        }

        if (!mounted) return;
      }

      notificationListener = Notifications.addNotificationReceivedListener((n) => {
        onNotificationReceivedRef.current?.(n);
      });

      responseListener = Notifications.addNotificationResponseReceivedListener((r) => {
        onNotificationResponseRef.current?.(r);
      });
    }

    setup();

    return () => {
      mounted = false;
      notificationListener?.remove();
      responseListener?.remove();
    };
  }, [enabled, skipAutoRegistration]); // Only re-run when enabled changes, not on callback identity changes
}
