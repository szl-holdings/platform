# @szl-holdings/mobile-shared

Shared primitives, hooks, and utilities for the SZL Holdings mobile app suite.

## Exports and Dependency Boundaries

### Root (`@szl-holdings/mobile-shared`)

Components and hooks with **no mandatory native dependency** beyond `react` and `react-native`.
Safe to import from any consuming app regardless of push notification setup:

```ts
import { ErrorBoundary, type ErrorFallbackProps } from "@szl-holdings/mobile-shared";
import { SkeletonLoader } from "@szl-holdings/mobile-shared";
import { KeyboardAwareScrollViewCompat } from "@szl-holdings/mobile-shared";
import { useApiStatus } from "@szl-holdings/mobile-shared";
```

### Notifications subpath (`@szl-holdings/mobile-shared/notifications`)

Notification utilities **and** the base push notification hook. Requires `expo-device`
and `expo-notifications`. Apps using push notifications import from here:

```ts
import {
  configurePushNotificationHandler,
  registerForPushNotificationsAsync,
  scheduleLocalNotification,
  usePushNotificationsBase,
} from "@szl-holdings/mobile-shared/notifications";
```

**Two registration modes for `usePushNotificationsBase`:**

| Mode | When to use |
|------|-------------|
| Default (`skipAutoRegistration: false`) | Automatic: registers on mount when `enabled: true` |
| `skipAutoRegistration: true` | Lazy: app manages permission/token flow; hook only sets up listeners |

## Required Peer Dependencies

| Peer | Required by |
|------|-------------|
| `react` | all |
| `react-native` | all |
| `expo` | all |
| `expo-device` | `/notifications` subpath (`usePushNotificationsBase`, `registerForPushNotificationsAsync`) |
| `expo-notifications` | `/notifications` subpath |
| `@tanstack/react-query` | `useApiStatus` (root) |
| `react-native-keyboard-controller` | `KeyboardAwareScrollViewCompat` (root) |
| `react-native-safe-area-context` | `ErrorBoundary` (root) |

## Metro Configuration

Each app must add `lib/mobile-shared` to `watchFolders` in `metro.config.js`:

```js
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
// ...
```

## Migrated From (Per App)

| File removed | Apps |
|---|---|
| `components/ErrorBoundary.tsx` | all 7 |
| `hooks/useApiStatus.ts` | aegis, szl, terra, carlota |
| `components/SkeletonLoader.tsx` | szl, terra, carlota |
| `components/KeyboardAwareScrollViewCompat.tsx` | terra, carlota |
| Local push handler setup | all 5 push apps |
