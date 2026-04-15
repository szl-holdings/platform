import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { Platform } from "react-native";

export interface NotificationPreferences {
  enabled: boolean;
  critical: boolean;
  high: boolean;
  medium: boolean;
}

interface NotificationContextValue {
  permissionGranted: boolean;
  expoPushToken: string | null;
  preferences: NotificationPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<NotificationPreferences>>;
  requestPermission: () => Promise<boolean>;
  sendLocalNotification: (title: string, body: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  permissionGranted: false,
  expoPushToken: null,
  preferences: { enabled: true, critical: true, high: true, medium: false },
  setPreferences: () => {},
  requestPermission: async () => false,
  sendLocalNotification: async () => {},
});

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
  }
  return "/api";
}

async function getAuthToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return typeof window !== "undefined"
        ? window.localStorage.getItem("lyte_session_token")
        : null;
    }
    const SecureStore = await import("expo-secure-store");
    return SecureStore.getItemAsync("lyte_session_token");
  } catch {
    return null;
  }
}

async function registerPushTokenWithBackend(token: string): Promise<void> {
  try {
    const authToken = await getAuthToken();
    if (!authToken) return;
    await fetch(`${getApiBase()}/push-tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        token,
        platform: Platform.OS,
        appId: "lyte-mobile",
      }),
    });
  } catch {
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    critical: true,
    high: true,
    medium: false,
  });
  const listenerRef = useRef<any>(null);
  const responseListenerRef = useRef<any>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") {
      setPermissionGranted(false);
      return false;
    }
    try {
      const Notifications = await import("expo-notifications");
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      const granted = finalStatus === "granted";
      setPermissionGranted(granted);
      if (granted) {
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync();
          const token = tokenData.data;
          setExpoPushToken(token);
          await registerPushTokenWithBackend(token);
        } catch {
          setExpoPushToken(null);
        }
      }
      return granted;
    } catch {
      return false;
    }
  }, []);

  const sendLocalNotification = useCallback(async (title: string, body: string) => {
    if (Platform.OS === "web" || !permissionGranted || !preferences.enabled) return;
    try {
      const Notifications = await import("expo-notifications");
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: null,
      });
    } catch {}
  }, [permissionGranted, preferences.enabled]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const setup = async () => {
      try {
        const { setupAndroidNotificationChannels } = await import("@/lib/notifications");
        await setupAndroidNotificationChannels();
      } catch {}
      try {
        const Notifications = await import("expo-notifications");
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        const { status } = await Notifications.getPermissionsAsync();
        const granted = status === "granted";
        setPermissionGranted(granted);
        if (granted) {
          try {
            const tokenData = await Notifications.getExpoPushTokenAsync();
            const token = tokenData.data;
            setExpoPushToken(token);
            await registerPushTokenWithBackend(token);
          } catch {}
          listenerRef.current = Notifications.addNotificationReceivedListener(() => {});
          responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(() => {});
        }
      } catch {}
    };
    setup();
    return () => {
      listenerRef.current?.remove();
      responseListenerRef.current?.remove();
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ permissionGranted, expoPushToken, preferences, setPreferences, requestPermission, sendLocalNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
