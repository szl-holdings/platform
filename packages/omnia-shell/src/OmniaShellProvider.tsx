import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type {
  OmniaNotification,
  OmniaShellConfig,
  OmniaShellContextValue,
  ProvenanceChain,
} from './types.js';

const OmniaShellContext = createContext<OmniaShellContextValue | null>(null);

const OMNIA_SHELL_VERSION = '1.0.0';

const SEED_NOTIFICATIONS: OmniaNotification[] = [
  {
    id: 'omnia-boot-001',
    artifactId: 'command',
    artifactName: 'Command',
    title: 'World model refreshed',
    message: '312 entities across 12 domains updated — 2 new causal links discovered.',
    level: 'info',
    timestamp: new Date(Date.now() - 45_000).toISOString(),
    read: false,
    actionUrl: '/command/omnia/world-model',
  },
  {
    id: 'omnia-boot-002',
    artifactId: 'aegis',
    artifactName: 'Aegis',
    title: 'Threat cluster elevated',
    message: 'APT-41 cluster upgraded to HIGH. Two downstream assets in Terra affected.',
    level: 'critical',
    timestamp: new Date(Date.now() - 3 * 60_000).toISOString(),
    read: false,
    actionUrl: '/aegis',
    entityRef: 'threat-apt41',
  },
  {
    id: 'omnia-boot-003',
    artifactId: 'vessels',
    artifactName: 'Vessels',
    title: 'Voyage deviation detected',
    message: 'MV Stellarwind — 14 nm off planned route. Insurance tier breach threshold at 82%.',
    level: 'warning',
    timestamp: new Date(Date.now() - 8 * 60_000).toISOString(),
    read: false,
    actionUrl: '/vessels',
    entityRef: 'vessel-stellarwind',
  },
  {
    id: 'omnia-boot-004',
    artifactId: 'terra',
    artifactName: 'Terra',
    title: 'Covenant breach resolved',
    message: 'Property #TER-8821 loan covenant drift corrected after governance action.',
    level: 'success',
    timestamp: new Date(Date.now() - 22 * 60_000).toISOString(),
    read: true,
    actionUrl: '/terra',
  },
  {
    id: 'omnia-boot-005',
    artifactId: 'counsel',
    artifactName: 'Counsel',
    title: 'Matter deadline in 48 hrs',
    message: 'Matter #CJL-2291 response deadline approaching. No draft filed yet.',
    level: 'warning',
    timestamp: new Date(Date.now() - 60 * 60_000).toISOString(),
    read: true,
    actionUrl: '/counsel',
    entityRef: 'matter-cjl2291',
  },
];

export interface OmniaShellProviderProps {
  config: OmniaShellConfig;
  children: ReactNode;
  initialNotifications?: OmniaNotification[];
}

export function OmniaShellProvider({
  config,
  children,
  initialNotifications,
}: OmniaShellProviderProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notifications, setNotifications] = useState<OmniaNotification[]>(
    initialNotifications ?? SEED_NOTIFICATIONS,
  );
  const [activeProvenanceChain, setActiveProvenanceChain] = useState<ProvenanceChain | null>(null);
  const adoptionBeaconFired = useRef(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), []);
  const closeCommandPalette = useCallback(() => setCommandPaletteOpen(false), []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const showProvenance = useCallback((chain: ProvenanceChain) => {
    setActiveProvenanceChain(chain);
  }, []);

  const closeProvenance = useCallback(() => {
    setActiveProvenanceChain(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen]);

  useEffect(() => {
    if (config.networkState === 'UNAVAILABLE') return;
    if (adoptionBeaconFired.current) return;
    adoptionBeaconFired.current = true;
    const apiBase = config.apiBase ?? '/api';
    fetch(`${apiBase}/omnia/adoption/beacon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artifactId: config.artifactId,
        shellVersion: config.shellVersion ?? OMNIA_SHELL_VERSION,
        commandPaletteWired: true,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  }, [config.artifactId, config.apiBase, config.networkState, config.shellVersion]);

  useEffect(() => {
    if (config.networkState === 'UNAVAILABLE') return;
    const apiBase = config.apiBase ?? '/api';
    const poll = async () => {
      try {
        const res = await fetch(`${apiBase}/omnia/notifications?artifactId=${config.artifactId}`);
        if (!res.ok) return;
        const data: { notifications: OmniaNotification[] } = await res.json();
        if (data.notifications?.length) {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const fresh = data.notifications.filter((n) => !existingIds.has(n.id));
            if (!fresh.length) return prev;
            return [...fresh, ...prev].slice(0, 50);
          });
        }
      } catch {}
    };
    const timer = setInterval(poll, 30_000);
    return () => clearInterval(timer);
  }, [config.artifactId, config.apiBase, config.networkState]);

  const value: OmniaShellContextValue = {
    config: { ...config, shellVersion: config.shellVersion ?? OMNIA_SHELL_VERSION },
    commandPaletteOpen,
    openCommandPalette,
    closeCommandPalette,
    notifications,
    unreadCount,
    markNotificationRead,
    showProvenance,
    closeProvenance,
    activeProvenanceChain,
  };

  return <OmniaShellContext.Provider value={value}>{children}</OmniaShellContext.Provider>;
}

export function useOmniaShell(): OmniaShellContextValue {
  const ctx = useContext(OmniaShellContext);
  if (!ctx) {
    throw new Error('useOmniaShell must be used inside <OmniaShellProvider>');
  }
  return ctx;
}

export function useOmniaShellSafe(): OmniaShellContextValue | null {
  return useContext(OmniaShellContext);
}
