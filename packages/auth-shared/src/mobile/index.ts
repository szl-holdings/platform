/**
 * Mobile auth adapter — thin contract types and helpers for Expo / React Native.
 *
 * Token storage itself MUST use `expo-secure-store` (iOS Keychain /
 * Android Keystore).  This module defines the expected interface so the
 * mobile app can swap implementations in tests.
 */

export * from "./token-store.js";
export * from "./pkce.js";
