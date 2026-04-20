import { useEffect, useRef } from 'react';

export interface PropertyAlert {
  id: string;
  propertyId: string;
  type: string;
  severity: string;
  message: string;
  timestamp: string;
}

export function usePropertyAlertsWebSocket(onAlert?: (alert: PropertyAlert) => void) {
  const callbackRef = useRef(onAlert);
  callbackRef.current = onAlert;

  useEffect(() => {}, []);

  return { connected: false };
}
