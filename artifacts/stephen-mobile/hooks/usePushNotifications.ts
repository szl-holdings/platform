import {
  configurePushNotificationHandler,
  registerForPushNotificationsAsync,
} from "@szl-holdings/mobile-shared/notifications";
import { usePushNotificationsBase } from "@szl-holdings/mobile-shared/notifications";

configurePushNotificationHandler({ shouldPlaySound: false });

export { registerForPushNotificationsAsync };

export function usePushNotifications(enabled: boolean) {
  usePushNotificationsBase({ enabled });
}
