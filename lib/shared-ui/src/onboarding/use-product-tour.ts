import * as React from 'react';

const STORAGE_PREFIX = 'szl_tour_';

interface TourState {
  isActive: boolean;
  hasCompleted: boolean;
  open: () => void;
  dismiss: () => void;
  complete: () => void;
  reset: () => void;
}

export function useProductTour(tourId: string): TourState {
  const storageKey = `${STORAGE_PREFIX}${tourId}`;

  const [hasCompleted, setHasCompleted] = React.useState(() => {
    try {
      return localStorage.getItem(storageKey) === 'completed';
    } catch {
      return false;
    }
  });

  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    if (!hasCompleted) {
      const t = setTimeout(() => setIsActive(true), 1000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [hasCompleted]);

  const persist = React.useCallback(
    (value: string) => {
      try {
        localStorage.setItem(storageKey, value);
      } catch {}
    },
    [storageKey],
  );

  const open = React.useCallback(() => setIsActive(true), []);

  const dismiss = React.useCallback(() => {
    setIsActive(false);
    persist('dismissed');
    setHasCompleted(true);
  }, [persist]);

  const complete = React.useCallback(() => {
    setIsActive(false);
    persist('completed');
    setHasCompleted(true);
  }, [persist]);

  const reset = React.useCallback(() => {
    setIsActive(false);
    setHasCompleted(false);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  }, [storageKey]);

  return { isActive, hasCompleted, open, dismiss, complete, reset };
}
