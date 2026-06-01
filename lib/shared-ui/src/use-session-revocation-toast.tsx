import { useEffect } from 'react';
import { toast } from 'sonner';
import { onSessionRevoked, type SessionRevocationDetail } from './session-revocation';

const MARKER_ATTR = 'data-szl-session-toast';
const TOAST_ID = 'szl-session-revoked';

export interface SessionRevocationToastOptions {
  duration?: number;
  onShown?: (detail: SessionRevocationDetail) => void;
}

/**
 * Mount once at the root of an app shell. Listens for the shared
 * `szl:session-revoked` window event and renders a branded `sonner`
 * toast. Also drops a hidden marker element on the body so the
 * shared `notifySessionRevoked` helper suppresses its plain DOM
 * fallback banner — the in-app toast is the single source of truth.
 *
 * Requires a `<Toaster />` from `@szl-holdings/shared-ui/ui/sonner`
 * to be mounted somewhere in the tree.
 */
export function useSessionRevocationToast(options: SessionRevocationToastOptions = {}): void {
  const { duration = 6000, onShown } = options;

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const marker = document.createElement('div');
    marker.setAttribute(MARKER_ATTR, 'true');
    marker.setAttribute('aria-hidden', 'true');
    marker.style.display = 'none';
    document.body.appendChild(marker);

    const unsubscribe = onSessionRevoked((detail) => {
      try {
        toast.error(detail.message, {
          id: TOAST_ID,
          duration,
        });
      } catch {
        /* ignore — sonner failure is non-fatal; the persisted reason
           is still surfaced on the login screen after redirect */
      }
      onShown?.(detail);
    });

    return () => {
      unsubscribe();
      marker.remove();
    };
  }, [duration, onShown]);
}
