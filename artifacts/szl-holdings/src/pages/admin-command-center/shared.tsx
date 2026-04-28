import { AnimatePresence, m } from 'framer-motion';
import { RefreshCw, Search, X } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';
import type { BadgeVariant } from './types';

export const API = '/api';

export function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export async function adminFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const method = (opts?.method ?? 'GET').toUpperCase();
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(needsCsrf ? { 'x-csrf-token': getCsrfToken() } : {}),
      ...((opts?.headers as Record<string, string>) ?? {}),
    },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export function StatusDot({ status }: { status: string }) {
  const s = status?.toLowerCase();
  if (s === 'healthy' || s === 'active' || s === 'pass' || s === 'true')
    return <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />;
  if (s === 'degraded' || s === 'warning' || s === 'new' || s === 'contacted')
    return <span className="inline-block w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />;
  return <span className="inline-block w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />;
}

export function Badge({ label, variant = 'neutral' }: { label: string; variant?: BadgeVariant }) {
  const cls = {
    green: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
    amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    violet: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
    neutral: 'bg-muted text-muted-foreground border-border',
  }[variant];
  return (
    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider', cls)}>
      {label}
    </span>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'text-primary',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', `${color.replace('text-', 'bg-')}/10`)}>
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <div>
        <div className="text-xl font-bold text-foreground">{value}</div>
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        {sub && <div className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search...'}
        className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
      />
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  onRefresh,
  loading,
}: {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  loading?: boolean;
}) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {onRefresh && (
        <button onClick={onRefresh} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      )}
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
          <m.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 shrink-0">
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <m.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 shrink-0">
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
