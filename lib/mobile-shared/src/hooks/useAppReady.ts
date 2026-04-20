import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';

export interface UseAppReadyOptions {
  onForeground?: () => void;
  onBackground?: () => void;
  trackSessionDuration?: boolean;
}

export interface AppReadyResult {
  isActive: boolean;
  sessionDurationMs: number;
  appState: AppStateStatus;
}

export function useAppReady(options: UseAppReadyOptions = {}): AppReadyResult {
  const { onForeground, onBackground, trackSessionDuration = false } = options;
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [sessionDurationMs, setSessionDurationMs] = useState(0);
  const sessionStartRef = useRef(Date.now());
  const callbacksRef = useRef({ onForeground, onBackground });
  callbacksRef.current = { onForeground, onBackground };

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && appState !== 'active') {
        sessionStartRef.current = Date.now();
        callbacksRef.current.onForeground?.();
      } else if (
        (nextState === 'background' || nextState === 'inactive') &&
        appState === 'active'
      ) {
        if (trackSessionDuration) {
          setSessionDurationMs((prev) => prev + (Date.now() - sessionStartRef.current));
        }
        callbacksRef.current.onBackground?.();
      }
      setAppState(nextState);
    });

    return () => sub.remove();
  }, [appState, trackSessionDuration]);

  return {
    isActive: appState === 'active',
    sessionDurationMs,
    appState,
  };
}
