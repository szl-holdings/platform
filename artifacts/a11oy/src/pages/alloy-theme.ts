import { useEffect, useState } from 'react';

export type AlloyThemeMode = 'dark' | 'light';

const THEME_KEY = 'alloy-hub-theme';

const CSS_DARK = `
:root {
  --ah-bg: #07080a;
  --ah-surface: rgba(255,255,255,0.025);
  --ah-border: rgba(255,255,255,0.07);
  --ah-border-strong: rgba(255,255,255,0.12);
  --ah-text: #f0f0f0;
  --ah-text-dim: #8a8a8a;
  --ah-text-muted: #5a5a5a;
  --ah-accent: #c9b787;
  --ah-accent-dim: rgba(201,183,135,0.15);
  --ah-accent-glow: rgba(201,183,135,0.06);
  --ah-header-bg: rgba(7,8,10,0.92);
}`;

const CSS_LIGHT = `
:root {
  --ah-bg: #f8f7f3;
  --ah-surface: rgba(0,0,0,0.04);
  --ah-border: rgba(0,0,0,0.09);
  --ah-border-strong: rgba(0,0,0,0.16);
  --ah-text: #1a1a1a;
  --ah-text-dim: #5a5a5a;
  --ah-text-muted: #9a9a9a;
  --ah-accent: #8a6f3e;
  --ah-accent-dim: rgba(138,111,62,0.12);
  --ah-accent-glow: rgba(138,111,62,0.04);
  --ah-header-bg: rgba(248,247,243,0.92);
}`;

let _styleEl: HTMLStyleElement | null = null;

function ensureStyleEl(): HTMLStyleElement {
  if (!_styleEl || !document.getElementById('alloy-hub-theme-vars')) {
    const el = document.createElement('style');
    el.id = 'alloy-hub-theme-vars';
    document.head.appendChild(el);
    _styleEl = el;
  }
  return _styleEl;
}

export function getStoredTheme(): AlloyThemeMode {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch { }
  return 'dark';
}

export function applyTheme(mode: AlloyThemeMode): void {
  if (typeof document === 'undefined') return;
  ensureStyleEl().textContent = mode === 'dark' ? CSS_DARK : CSS_LIGHT;
  document.documentElement.setAttribute('data-alloy-theme', mode);
  try { localStorage.setItem(THEME_KEY, mode); } catch { }
}

if (typeof window !== 'undefined') {
  applyTheme(getStoredTheme());
}

export function useAlloyTheme() {
  const [mode, setMode] = useState<AlloyThemeMode>(getStoredTheme);

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  const toggle = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'));
  return { mode, toggle };
}

export const T = {
  bg: 'var(--ah-bg)',
  surface: 'var(--ah-surface)',
  border: 'var(--ah-border)',
  borderStrong: 'var(--ah-border-strong)',
  text: 'var(--ah-text)',
  textDim: 'var(--ah-text-dim)',
  textMuted: 'var(--ah-text-muted)',
  accent: 'var(--ah-accent)',
  accentDim: 'var(--ah-accent-dim)',
  accentGlow: 'var(--ah-accent-glow)',
  headerBg: 'var(--ah-header-bg)',
  mono: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
  sans: "'Inter', 'Space Grotesk', system-ui, sans-serif",
} as const;
