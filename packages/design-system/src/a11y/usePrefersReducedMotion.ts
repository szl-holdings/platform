import { useEffect, useState } from 'react';

/**
 * usePrefersReducedMotion — returns true when the OS reduced-motion
 * preference is active. Use to conditionally skip decorative animations.
 *
 * WCAG: SC 2.3.3 Animation from Interactions (AAA)
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}
