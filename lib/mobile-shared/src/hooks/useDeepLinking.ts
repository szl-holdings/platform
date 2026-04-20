import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

let Linking: typeof import('expo-linking') | null = null;
try {
  Linking = require('expo-linking');
} catch {}

export interface DeepLinkRoute {
  pattern: string;
  handler: (params: Record<string, string>) => void;
}

export interface UseDeepLinkingOptions {
  routes: DeepLinkRoute[];
  enabled?: boolean;
}

function matchRoute(path: string, pattern: string): Record<string, string> | null {
  const pathParts = path.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);

  if (pathParts.length !== patternParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i];
    if (pp.startsWith(':')) {
      params[pp.slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (pp !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

export function useDeepLinking(options: UseDeepLinkingOptions): void {
  const { routes, enabled = true } = options;
  const routesRef = useRef(routes);
  routesRef.current = routes;

  const handleUrl = useCallback((url: string) => {
    try {
      if (!Linking) return;
      const parsed = Linking.parse(url);
      const path = parsed.path ?? '';
      for (const route of routesRef.current) {
        const params = matchRoute(path, route.pattern);
        if (params) {
          route.handler({ ...params, ...(parsed.queryParams as Record<string, string>) });
          break;
        }
      }
    } catch (err) {
      console.warn('[DeepLink] Error handling URL:', err);
    }
  }, []);

  useEffect(() => {
    if (!enabled || Platform.OS === 'web' || !Linking) return;

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    const sub = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => sub.remove();
  }, [enabled, handleUrl]);
}
