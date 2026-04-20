import type {} from 'expo-router';

declare module 'expo-router' {
  interface NativeTabOptions {
    href?: string | null | { pathname: string; params?: Record<string, string | number> };
  }
}
