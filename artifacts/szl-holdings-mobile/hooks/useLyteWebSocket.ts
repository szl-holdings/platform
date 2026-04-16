import { useEffect, useRef } from "react";

export interface LyteSignal {
  id: string;
  type: string;
  data: unknown;
  timestamp: string;
}

export interface UseLyteWebSocketOptions {
  onNewSignal?: (signal: LyteSignal) => void;
  onConnect?: () => void;
}

export function useLyteWebSocket(options: UseLyteWebSocketOptions = {}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
  }, []);

  return { connected: false, wsStatus: "disconnected" as const };
}
