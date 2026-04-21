import React, { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { color, semanticColors } from '../tokens/index.js';
import { cn } from '../utils.js';

export type ToastVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface Toast {
  id: string;
  message: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

const VARIANT_ICON: Record<ToastVariant, string> = {
  success: '✓',
  warning: '⚠',
  error: '✕',
  info: 'ℹ',
  neutral: '•',
};

const VARIANT_COLORS: Record<ToastVariant, { dot: string; text: string }> = {
  success: { dot: color.accent.green, text: color.accent.green },
  warning: { dot: color.accent.amber, text: color.accent.amber },
  error:   { dot: color.accent.red,   text: color.accent.red },
  info:    { dot: color.accent.blue,  text: color.accent.blue },
  neutral: { dot: color.text.muted,   text: color.text.muted },
};

interface ToastItemProps extends Toast {
  onDismiss: (id: string) => void;
}

function ToastItem({ id, message, description, variant = 'neutral', duration = 4000, action, onDismiss }: ToastItemProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const vc = VARIANT_COLORS[variant];

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(id), duration);
    return () => { if (timerRef.current !== undefined) clearTimeout(timerRef.current); };
  }, [id, duration, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-start gap-3 px-3 py-2.5 rounded-lg border"
      style={{
        minWidth: '280px',
        maxWidth: '400px',
        background: color.bg.overlay,
        borderColor: color.border.default,
        boxShadow: '0 8px 24px rgba(0,0,0,0.65)',
        animation: 'gi-toast-in 0.18s cubic-bezier(0,0,0.2,1) both',
      }}
    >
      <style>{`@keyframes gi-toast-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }`}</style>
      <span style={{ fontSize: '13px', color: vc.dot, lineHeight: '20px', flexShrink: 0, fontWeight: 600 }}>
        {VARIANT_ICON[variant]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-5" style={{ color: color.text.primary, margin: 0 }}>
          {message}
        </p>
        {description && (
          <p style={{ fontSize: '12px', color: color.text.secondary, margin: '2px 0 0' }}>
            {description}
          </p>
        )}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            style={{ fontSize: '12px', color: color.text.link, marginTop: '4px', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
        style={{ color: color.text.muted, background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', lineHeight: '20px', flexShrink: 0, padding: '0 2px' }}
      >
        ×
      </button>
    </div>
  );
}

export interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  className?: string;
}

const POSITION_STYLES: Record<NonNullable<ToastContainerProps['position']>, React.CSSProperties> = {
  'top-right':    { top: '16px', right: '16px' },
  'top-left':     { top: '16px', left: '16px' },
  'bottom-right': { bottom: '16px', right: '16px' },
  'bottom-left':  { bottom: '16px', left: '16px' },
  'top-center':   { top: '16px', left: '50%', transform: 'translateX(-50%)' },
  'bottom-center':{ bottom: '16px', left: '50%', transform: 'translateX(-50%)' },
};

export function ToastContainer({ toasts, onDismiss, position = 'bottom-right', className }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div
      className={cn('fixed flex flex-col gap-2 z-50', className)}
      style={POSITION_STYLES[position]}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((ts) => [...ts, { ...toast, id }]);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  return { toasts, add, dismiss };
}
