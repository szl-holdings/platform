# Push Notification Setup — CORTEX

Updated: 2026-04-16

## Overview

CORTEX (`artifacts/szl-holdings-mobile`) uses **Expo Notifications** (`expo-notifications`).
The canonical delivery path uses **Expo's push service** via `expo-server-sdk` on the backend.
Firebase credentials (`google-services.json`, `GoogleService-Info.plist`) are required at build
time so the OS can register the device and issue an Expo push token — but the backend sends
through Expo, not directly through Firebase Admin SDK.

---

## Canonical Delivery Architecture

```
Mobile App                 API Server               Expo Push Service
──────────                 ──────────               ─────────────────
On auth:                                              
  registerForPushNotifications                       
  → expo-notifications                               
  → OS requests token from FCM/APNs                 FCM / APNs
  → returns ExponentPushToken[...]                   ──────────
  POST /api/push/register ─────────────────────────>  (token stored)
    { token, userId, platform }

On event (backend triggers):
  expo.sendPushNotificationsAsync([...]) ─────────> Expo push service
    { to: ExponentPushToken[...], ... }              → FCM (Android)
                                                     → APNs (iOS)
                                                           ↓
                                                      Device notification
```

**Key point**: The backend communicates with Expo's push service, not directly with Firebase
or APNs. Firebase credentials in the app are needed only for the OS to issue Expo push tokens
at registration time.

---

## Mobile App Setup (Already Configured)

The following is already set up in `artifacts/szl-holdings-mobile/app.json`:

### Push Plugin

```json
[
  "expo-notifications",
  {
    "icon": "./assets/images/icon.png",
    "color": "#c9a84c",
    "sounds": []
  }
]
```

### Android Push Permissions

```json
"android": {
  "permissions": [
    "android.permission.RECEIVE_BOOT_COMPLETED",
    "android.permission.VIBRATE",
    "android.permission.POST_NOTIFICATIONS"
  ],
  "googleServicesFile": "./google-services.json"
}
```

### iOS Permission String

```json
"infoPlist": {
  "NSUserNotificationUsageDescription": "CORTEX sends cross-domain alerts, signals, and executive briefings."
}
```

### Shared Push Utilities

Registration is handled via `@szl-holdings/mobile-shared/notifications`:

```typescript
import {
  configurePushNotificationHandler,
  registerForPushNotificationsAsync,
  usePushNotificationsBase,
} from "@szl-holdings/mobile-shared/notifications";
```

Call `configurePushNotificationHandler()` and `registerForPushNotificationsAsync()` early
in `app/_layout.tsx` after the user authenticates. Send the returned token to
`POST /api/push/register`.

---

## Credential Dependencies

### Required Before Push Notifications Work

| Credential | Platform | Source | Status |
|-----------|---------|--------|--------|
| `google-services.json` | Android | Firebase Console | Placeholder — needs real file |
| `GoogleService-Info.plist` | iOS | Firebase Console | Placeholder — needs real file |
| APNs Auth Key (.p8) | iOS | Apple Developer Portal → Keys | Not yet created |
| Firebase Project | Both | console.firebase.google.com | Not yet created |

### Firebase Setup Steps

1. Go to https://console.firebase.google.com → Create project → "CORTEX SZL Holdings"
2. Add Android app with package `com.szlholdings.executive.mobile`
   - Download `google-services.json` → place in `artifacts/szl-holdings-mobile/` (gitignored)
3. Add iOS app with bundle ID `com.szlholdings.executive.mobile`
   - Download `GoogleService-Info.plist` → place in `artifacts/szl-holdings-mobile/` (gitignored)
4. In Firebase → Project Settings → Cloud Messaging → iOS app:
   - Upload APNs Auth Key (.p8), set Key ID and Team ID

Template files for both are at `*.template` in `artifacts/szl-holdings-mobile/`.

---

## Backend Integration Pending

### `/api/push/register` (needed before Alpha)

The mobile app calls this on launch to register the device token.

**Endpoint**: `POST /api/push/register`  
**Auth**: Requires valid session token  
**Request body**:

```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "ios",
  "userId": "uuid-of-user"
}
```

**Storage**: Create a `push_tokens` table — columns: `id`, `userId`, `token`, `platform`,
`createdAt`, `updatedAt`. Upsert on (userId, platform) to handle token rotation.

### Backend Push Sender (using `expo-server-sdk`)

```typescript
import Expo, { ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  if (!Expo.isExpoPushToken(token)) {
    throw new Error(`Invalid Expo push token: ${token}`);
  }

  const message: ExpoPushMessage = {
    to: token,
    sound: "default",
    title,
    body,
    data,
    // Android notification channel (must match channels registered in app):
    channelId: "cortex-signals",
  };

  const chunks = expo.chunkPushNotifications([message]);
  for (const chunk of chunks) {
    const receipts = await expo.sendPushNotificationsAsync(chunk);
    // Check receipts for errors and handle DeviceNotRegistered status
    for (const receipt of receipts) {
      if (receipt.status === "error") {
        console.error("Push error:", receipt.message, receipt.details);
      }
    }
  }
}
```

Install in `artifacts/api-server`: `pnpm add expo-server-sdk`

---

## Android Notification Channels

Create these channels on app startup via `expo-notifications`:

| Channel ID | Importance | Purpose |
|-----------|-----------|---------|
| `cortex-critical` | MAX (bypassDnd) | Cross-domain critical alerts |
| `cortex-signals` | HIGH | Signal feed updates |
| `cortex-briefings` | DEFAULT | Daily executive digest |
| `cortex-system` | LOW | System health / background sync |

---

## Testing Push Notifications

1. **Expo push tool** (no backend needed):
   - Get Expo push token from device logs at `registerForPushNotificationsAsync()`
   - Send a test at https://expo.dev/notifications
   - Note: requires real Firebase credentials in the build; simulator does not work for iOS push

2. **Physical device required** for full end-to-end:
   - iOS Simulator cannot receive push notifications
   - Android emulator can receive FCM push if Google Play Services are installed

3. **Build environment matters for APNs**:
   - Development builds use APNs sandbox; TestFlight/production builds use APNs production
   - Confirm Firebase APNs key is configured for the correct environment
