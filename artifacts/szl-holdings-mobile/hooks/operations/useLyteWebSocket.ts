import { useWebSocket, type WsStatus } from '@szl-holdings/mobile-shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { LyteSignal } from '@/context/LyteContext';

async function getToken(): Promise<string | null> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('lyte_session_token');
    }
    const { default: SecureStore } = await import('expo-secure-store');
    return SecureStore.getItemAsync('lyte_session_token');
  } catch {
    return null;
  }
}

interface UseLyteWebSocketOptions {
  onNewSignal?: (signal: LyteSignal) => void;
  onConnect?: () => void;
}

export function useLyteWebSocket({ onNewSignal, onConnect }: UseLyteWebSocketOptions = {}) {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const url = domain && Platform.OS !== 'web' ? `wss://${domain}/ws` : null;

  const onNewSignalRef = useRef(onNewSignal);
  onNewSignalRef.current = onNewSignal;
  const onConnectRef = useRef(onConnect);
  onConnectRef.current = onConnect;
  const prevStatusRef = useRef<WsStatus>('idle');

  useEffect(() => {
    getToken().then(setToken);
  }, []);

  const handleMessage = useCallback((signal: LyteSignal) => {
    onNewSignalRef.current?.(signal);
  }, []);

  const { status } = useWebSocket<LyteSignal>({
    url,
    channel: 'lyte-signals',
    token: token ?? undefined,
    onMessage: handleMessage,
    enabled: token !== undefined && Platform.OS !== 'web',
  });

  useEffect(() => {
    if (prevStatusRef.current !== 'connected' && status === 'connected') {
      onConnectRef.current?.();
    }
    prevStatusRef.current = status;
  }, [status]);

  return { wsStatus: status };
}
