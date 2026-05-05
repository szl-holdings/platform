export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
export const STORE_KEY = 'szl:actionStore';
export const CURRENT_ACTOR = 'You (Operator)';
export const POLL_INTERVAL_MS = 15000;

export const _BG = 'var(--color-bg-primary)';
export const CARD = 'var(--color-surface-base)';
export const BORDER = 'var(--color-surface-border)';
export const ACCENT = '#8b7ac8';
export const FG = 'var(--color-fg-primary)';
export const FG_MUT = 'var(--color-fg-muted)';

export const DOMAINS = {
  aegis: { name: 'Aegis', color: '#6366f1' },
  terra: { name: 'Terra', color: '#4d7c0f' },
  vessels: { name: 'Vessels', color: '#3b82f6' },
  lyte: { name: 'Lyte', color: '#f59e0b' },
  prism: { name: 'PRAXIS', color: '#a855f7' },
  carlota: { name: 'Carlota', color: '#c2a55a' },
} as const;

export type DomainKey = keyof typeof DOMAINS;
