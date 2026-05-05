import { useState } from 'react';

const LS_KEY = 'executiveSafeMode';

export function useSafeMode(): [boolean, (value: boolean) => void] {
  const [safeMode, setSafeModeState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_KEY) === 'true';
    } catch {
      return false;
    }
  });

  function setSafeMode(value: boolean) {
    setSafeModeState(value);
    try {
      localStorage.setItem(LS_KEY, String(value));
    } catch {}
  }

  return [safeMode, setSafeMode];
}
