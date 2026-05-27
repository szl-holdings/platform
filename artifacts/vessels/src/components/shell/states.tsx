import type { ReactNode } from 'react';

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <div
      className="rounded-full animate-spin"
      style={{
        width: size,
        height: size,
        border: '1.5px solid rgba(201,183,135,0.18)',
        borderTopColor: '#c9b787',
      }}
    />
  );
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12">
      <Spinner />
      <span
        className="text-[11px] uppercase tracking-widest"
        style={{ fontFamily: 'var(--font-mono, monospace)', color: '#6e6e6e' }}
      >
        {label}
      </span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-12 px-6"
      style={{
        border: '1px dashed rgba(255,255,255,0.08)',
        borderRadius: 6,
        background: 'rgba(255,255,255,0.015)',
      }}
    >
      <div
        className="text-[10px] uppercase tracking-widest mb-2"
        style={{ fontFamily: 'var(--font-mono, monospace)', color: '#c9b787', opacity: 0.6 }}
      >
        No records
      </div>
      <div className="text-[14px] text-[#f5f5f5] font-medium">{title}</div>
      {description && (
        <p className="text-[12px] mt-1 max-w-[44ch]" style={{ color: '#6e6e6e' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', detail }: { title?: string; detail?: string }) {
  return (
    <div
      className="flex items-start gap-3 p-3"
      style={{
        border: '1px solid rgba(184,84,80,0.22)',
        borderRadius: 6,
        background: 'rgba(184,84,80,0.06)',
      }}
    >
      <span
        className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded mt-0.5"
        style={{ background: 'rgba(184,84,80,0.18)', color: '#d18a86' }}
      >
        Error
      </span>
      <div className="min-w-0">
        <div className="text-[13px] text-[#f5f5f5]">{title}</div>
        {detail && <div className="text-[12px] mt-0.5" style={{ color: '#9a7975' }}>{detail}</div>}
      </div>
    </div>
  );
}
