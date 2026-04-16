import { useEffect, useRef } from "react";

export interface AegisEvent {
  type: string;
  data: unknown;
}

export function useAegisWebSocket(onEvent?: (event: AegisEvent) => void) {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
  }, []);

  return { connected: false };
}
