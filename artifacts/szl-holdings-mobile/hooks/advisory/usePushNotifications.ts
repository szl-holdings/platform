import {
  configurePushNotificationHandler,
  usePushNotificationsBase,
} from '@szl-holdings/mobile-shared/notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '@/context/AuthContext';

configurePushNotificationHandler();

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : '/api';

export interface PushNotificationState {
  expoPushToken: string | null;
  permissionStatus: Notifications.PermissionStatus | null;
  notification: Notifications.Notification | null;
  requestPermission: () => Promise<boolean>;
}

async function registerDeviceToken(token: string, authToken: string | null): Promise<void> {
  if (!authToken) return;

  try {
    const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
    const res = await fetch(`${API_BASE}/push-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        token,
        platform,
        appId: 'cortex-advisory',
      }),
    });

    if (!res.ok) {
      console.warn('[push] Failed to register token:', res.status);
    }
  } catch (err) {
    console.warn('[push] Token registration error:', err);
  }
}

async function getAuthToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' ? window.localStorage.getItem('cj_auth_token') : null;
    }
    const SecureStore = await import('expo-secure-store');
    return SecureStore.getItemAsync('cj_auth_token');
  } catch {
    return null;
  }
}

export function usePushNotifications(): PushNotificationState {
  const { isAuthenticated } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(
    null,
  );
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  // Trigger permission/token registration automatically when the user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      requestPermission();
    }
    // requestPermission is stable (useCallback with no deps), so this is safe
  }, [isAuthenticated]);

  // Shared base manages listeners; registration is handled manually via requestPermission
  usePushNotificationsBase({
    enabled: isAuthenticated,
    skipAutoRegistration: true,
    onNotificationReceived: (notif) => setNotification(notif),
    onNotificationResponse: (response) => {
      const data = response.notification.request.content.data as Record<string, string> | undefined;
      if (data?.screen) {
        const { router } = require('expo-router');
        try {
          router.push(data.screen);
        } catch {
          console.warn('[push] Deep-link navigation failed:', data.screen);
        }
      }
    },
  });

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      setPermissionStatus(Notifications.PermissionStatus.DENIED);
      return false;
    }

    if (!Device.isDevice) {
      console.info('[push] Push notifications require a physical device');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== Notifications.PermissionStatus.GRANTED) {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    setPermissionStatus(finalStatus);

    if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#C8A96A',
      });
      await Notifications.setNotificationChannelAsync('carlota-sessions', {
        name: 'Session Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#C8A96A',
      });
      await Notifications.setNotificationChannelAsync('carlota-documents', {
        name: 'Document Updates',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#C8A96A',
      });
      await Notifications.setNotificationChannelAsync('carlota-messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#C8A96A',
      });
    }

    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      const tokenResponse = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      const token = tokenResponse.data;
      setExpoPushToken(token);

      const authToken = await getAuthToken();
      await registerDeviceToken(token, authToken);

      return true;
    } catch (err) {
      console.warn('[push] Failed to get push token:', err);
      return false;
    }
  }, []);

  return {
    expoPushToken,
    permissionStatus,
    notification,
    requestPermission,
  };
}
