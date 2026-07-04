import { useEffect, useState } from 'react';

const STORAGE_KEY = 'szl-cookie-consent';

export type CookieConsentState = 'accepted' | 'declined' | null;

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsentState>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as CookieConsentState) ?? null;
    } catch {
      return null;
    }
  });

  const accept = () => {
    setConsent('accepted');
    try {
      localStorage.setItem(STORAGE_KEY, 'accepted');
    } catch {}
  };

  const decline = () => {
    setConsent('declined');
    try {
      localStorage.setItem(STORAGE_KEY, 'declined');
    } catch {}
  };

  return { consent, accept, decline };
}

export interface CookieBannerProps {
  privacyUrl?: string;
  accentColor?: string;
}

export function CookieBanner({
  privacyUrl = '/legal/privacy',
  accentColor = '#d4a054',
}: CookieBannerProps) {
  const { consent, accept, decline } = useCookieConsent();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (consent === null) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [consent]);

  const suppressed =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('screenshot');

  if (suppressed || !visible || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie and privacy notice"
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        maxWidth: '560px',
        width: 'calc(100vw - 2rem)',
        background: 'rgba(10,14,22,0.96)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: '0.75rem',
        boxShadow: '0 8px 40px rgba(0,0,0,0.55)',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: 'cookie-slide-up 0.3s ease',
      }}
    >
      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.8125rem',
            color: 'rgba(255,255,255,0.75)',
            lineHeight: 1.5,
          }}
        >
          We use cookies for session management and platform analytics — no advertising or
          third-party tracking.{' '}
          <a
            href={privacyUrl}
            style={{
              color: 'rgba(255,255,255,0.9)',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
            }}
          >
            Privacy Policy
          </a>
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
        <button
          onClick={decline}
          style={{
            padding: '0.4rem 0.75rem',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.78)',
            cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
            transition: 'all 0.15s',
          }}
        >
          Decline
        </button>
        <button
          onClick={accept}
          style={{
            padding: '0.4rem 0.875rem',
            background: `${accentColor}22`,
            border: `1px solid ${accentColor}55`,
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.92)',
            cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
            transition: 'all 0.15s',
          }}
        >
          Accept
        </button>
      </div>
      <style>{`
        @keyframes cookie-slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
