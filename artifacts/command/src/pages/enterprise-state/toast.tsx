import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useCallback, useState } from 'react';

type ToastMsg = { id: number; text: string; type: 'success' | 'info' | 'error' };

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMsg[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.625rem 1rem',
            borderRadius: '0.625rem',
            background:
              t.type === 'success'
                ? 'hsla(160,60%,8%,0.95)'
                : t.type === 'error'
                  ? 'hsla(0,60%,8%,0.95)'
                  : 'hsla(265,30%,8%,0.95)',
            border: `1px solid ${t.type === 'success' ? '#22c55e30' : t.type === 'error' ? '#ef444430' : '#8b7ac830'}`,
            backdropFilter: 'blur(8px)',
            maxWidth: '360px',
          }}
        >
          {t.type === 'success' ? (
            <CheckCircle2 style={{ width: 13, height: 13, color: '#22c55e', flexShrink: 0 }} />
          ) : t.type === 'error' ? (
            <XCircle style={{ width: 13, height: 13, color: '#ef4444', flexShrink: 0 }} />
          ) : (
            <Info style={{ width: 13, height: 13, color: '#8b7ac8', flexShrink: 0 }} />
          )}
          <span
            style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', flex: 1, lineHeight: 1.4 }}
          >
            {t.text}
          </span>
          <button
            onClick={() => onDismiss(t.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.3)',
              padding: 0,
            }}
          >
            <X style={{ width: 11, height: 11 }} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const idRef = { current: 0 };
  const show = useCallback((text: string, type: ToastMsg['type'] = 'success', duration = 4000) => {
    const id = ++idRef.current;
    setToasts((p) => [...p, { id, text, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), duration);
  }, []);
  const dismiss = useCallback((id: number) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  return { toasts, show, dismiss };
}
