import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Building,
  Command,
  ExternalLink,
  Globe,
  Layers,
  Network,
  Search,
  Shield,
  Ship,
  X,
  Zap,
} from 'lucide-react';
import { useOmniaShell } from './OmniaShellProvider.js';
import type { WorldModelEntity } from './types.js';

const ARTIFACT_META: Record<string, { name: string; icon: React.ReactNode; path: string; accent: string }> = {
  command: { name: 'Command', icon: <Command size={12} />, path: '/command', accent: '#8b7ac8' },
  holdings: { name: 'SZL Holdings', icon: <Building size={12} />, path: '/', accent: '#c9b787' },
  aegis: { name: 'Aegis', icon: <Shield size={12} />, path: '/aegis', accent: '#ef4444' },
  sentra: { name: 'Sentra', icon: <Activity size={12} />, path: '/sentra', accent: '#22c55e' },
  terra: { name: 'Terra', icon: <Globe size={12} />, path: '/terra', accent: '#22c55e' },
  vessels: { name: 'Vessels', icon: <Ship size={12} />, path: '/vessels', accent: '#0ea5e9' },
  counsel: { name: 'Counsel', icon: <BookOpen size={12} />, path: '/counsel', accent: '#8b5cf6' },
  a11oy: { name: 'A11oy', icon: <Layers size={12} />, path: '/a11oy', accent: '#c9b787' },
  pulse: { name: 'Pulse', icon: <Zap size={12} />, path: '/pulse', accent: '#f59e0b' },
  lyte: { name: 'Lyte', icon: <Activity size={12} />, path: '/lyte', accent: '#3b82f6' },
  praxis: { name: 'PRAXIS', icon: <Network size={12} />, path: '/nexus', accent: '#8b5cf6' },
};

const SEED_ENTITIES: WorldModelEntity[] = [
  { id: 'e-apt41', label: 'APT-41 Threat Cluster', type: 'threat', domain: 'aegis', confidence: 0.92, freshness: 0.95, provenance: ['aegis-soc'], description: 'Nation-state threat actor cluster targeting critical infra', lastSeen: new Date(Date.now() - 30_000).toISOString() },
  { id: 'e-stellarwind', label: 'MV Stellarwind', type: 'vessel', domain: 'vessels', confidence: 0.98, freshness: 0.88, provenance: ['ais-feed', 'vessels-twin'], description: 'Container vessel — active voyage with 14nm deviation', lastSeen: new Date(Date.now() - 60_000).toISOString() },
  { id: 'e-ter8821', label: 'Property TER-8821', type: 'property', domain: 'terra', confidence: 0.94, freshness: 0.91, provenance: ['terra-covenant'], description: 'Commercial property — covenant compliance restored', lastSeen: new Date(Date.now() - 2 * 60_000).toISOString() },
  { id: 'e-cjl2291', label: 'Matter CJL-2291', type: 'matter', domain: 'counsel', confidence: 0.87, freshness: 0.75, provenance: ['counsel-kb'], description: 'Active legal matter — response deadline in 48h', lastSeen: new Date(Date.now() - 5 * 60_000).toISOString() },
  { id: 'e-omnia-hub', label: 'OMNIA World Model', type: 'concept', domain: 'command', confidence: 1.0, freshness: 1.0, provenance: ['omnia-engine'], description: 'Portfolio entity graph — 312 entities, 12 domains', lastSeen: new Date().toISOString() },
  { id: 'e-synthesis', label: 'Portfolio Synthesis Narrative', type: 'concept', domain: 'command', confidence: 0.96, freshness: 0.99, provenance: ['omnia-engine'], description: 'Live natural-language story of the portfolio', lastSeen: new Date().toISOString() },
];

const QUICK_ACTIONS = [
  { id: 'nav-omnia', label: 'Open OMNIA Hub', group: 'Navigate', path: '/command/omnia', icon: <Network size={13} /> },
  { id: 'nav-world-model', label: 'World Model Graph', group: 'Navigate', path: '/command/omnia/world-model', icon: <Layers size={13} /> },
  { id: 'nav-narrative', label: 'Portfolio Narrative', group: 'Navigate', path: '/command/omnia/narrative', icon: <BookOpen size={13} /> },
  { id: 'nav-ripple', label: 'Ripple / Impact View', group: 'Navigate', path: '/command/omnia/ripple', icon: <Activity size={13} /> },
  { id: 'nav-story', label: 'Public Story Mode', group: 'Navigate', path: '/command/omnia/story', icon: <Globe size={13} /> },
  { id: 'nav-a11oy-adoption', label: 'OMNIA Shell Adoption (A11oy)', group: 'Navigate', path: '/a11oy/omnia-adoption', icon: <Layers size={13} /> },
  { id: 'nav-command', label: 'Go to Command', group: 'Switch App', path: '/command', icon: ARTIFACT_META.command.icon },
  { id: 'nav-holdings', label: 'Go to SZL Holdings', group: 'Switch App', path: '/', icon: ARTIFACT_META.holdings.icon },
  { id: 'nav-aegis', label: 'Go to Aegis', group: 'Switch App', path: '/aegis', icon: ARTIFACT_META.aegis.icon },
  { id: 'nav-vessels', label: 'Go to Vessels', group: 'Switch App', path: '/vessels', icon: ARTIFACT_META.vessels.icon },
  { id: 'nav-terra', label: 'Go to Terra', group: 'Switch App', path: '/terra', icon: ARTIFACT_META.terra.icon },
  { id: 'nav-counsel', label: 'Go to Counsel', group: 'Switch App', path: '/counsel', icon: ARTIFACT_META.counsel.icon },
  { id: 'nav-sentra', label: 'Go to Sentra', group: 'Switch App', path: '/sentra', icon: ARTIFACT_META.sentra.icon },
  { id: 'nav-a11oy', label: 'Go to A11oy', group: 'Switch App', path: '/a11oy', icon: ARTIFACT_META.a11oy.icon },
  { id: 'nav-pulse', label: 'Go to Pulse', group: 'Switch App', path: '/pulse', icon: ARTIFACT_META.pulse.icon },
  { id: 'nav-lyte', label: 'Go to Lyte', group: 'Switch App', path: '/lyte', icon: ARTIFACT_META.lyte.icon },
];

function fuzzyMatch(query: string, text: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

const DOMAIN_COLORS: Record<string, string> = {
  aegis: '#ef4444',
  vessels: '#0ea5e9',
  terra: '#22c55e',
  counsel: '#8b5cf6',
  command: '#8b7ac8',
  a11oy: '#c9b787',
  holdings: '#c9b787',
  pulse: '#f59e0b',
  lyte: '#3b82f6',
  sentra: '#22c55e',
};

export function OmniaCommandPalette() {
  const { config, commandPaletteOpen, closeCommandPalette } = useOmniaShell();
  const [query, setQuery] = useState('');
  const [entities, setEntities] = useState<WorldModelEntity[]>(SEED_ENTITIES);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const accentColor = config.accentColor ?? '#8b7ac8';

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    if (!commandPaletteOpen) return;
    const apiBase = config.apiBase ?? '/api';
    fetch(`${apiBase}/omnia/search?q=${encodeURIComponent(query)}&limit=20`)
      .then((r) => r.json())
      .then((d: { entities: WorldModelEntity[] }) => {
        if (d.entities?.length) setEntities(d.entities);
      })
      .catch(() => {});
  }, [query, commandPaletteOpen, config.apiBase]);

  const filteredActions = QUICK_ACTIONS.filter(
    (a) => fuzzyMatch(query, a.label) || fuzzyMatch(query, a.group),
  );
  const filteredEntities = entities.filter(
    (e) => fuzzyMatch(query, e.label) || fuzzyMatch(query, e.domain) || fuzzyMatch(query, e.description),
  );

  const allItems = [
    ...filteredActions.map((a) => ({ kind: 'action' as const, data: a })),
    ...filteredEntities.slice(0, 8).map((e) => ({ kind: 'entity' as const, data: e })),
  ];

  const handleSelect = useCallback(
    (item: (typeof allItems)[number]) => {
      if (item.kind === 'action') {
        closeCommandPalette();
        window.location.href = item.data.path;
      } else {
        closeCommandPalette();
        const domain = item.data.domain;
        const meta = ARTIFACT_META[domain];
        if (meta) window.location.href = meta.path;
      }
    },
    [closeCommandPalette],
  );

  useEffect(() => {
    if (!commandPaletteOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((p) => Math.min(p + 1, allItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((p) => Math.max(p - 1, 0));
      } else if (e.key === 'Enter' && allItems[selectedIndex]) {
        handleSelect(allItems[selectedIndex]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [commandPaletteOpen, allItems, selectedIndex, handleSelect]);

  if (!commandPaletteOpen) return null;

  const groups: Record<string, typeof allItems> = {};
  for (const item of allItems) {
    const gKey = item.kind === 'entity' ? 'Portfolio Entities' : item.data.group ?? 'Actions';
    if (!groups[gKey]) groups[gKey] = [];
    groups[gKey].push(item);
  }

  const GROUP_ORDER = ['Navigate', 'Switch App', 'Portfolio Entities', 'Actions'];
  const sortedGroups = Object.entries(groups).sort(
    ([a], [b]) =>
      (GROUP_ORDER.indexOf(a) === -1 ? 99 : GROUP_ORDER.indexOf(a)) -
      (GROUP_ORDER.indexOf(b) === -1 ? 99 : GROUP_ORDER.indexOf(b)),
  );

  let globalIdx = 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 120,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={closeCommandPalette}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 640,
          maxWidth: 'calc(100vw - 32px)',
          background: '#0d1520',
          border: `1px solid ${accentColor}30`,
          borderRadius: 16,
          boxShadow: `0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px ${accentColor}15`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <Search size={16} style={{ color: accentColor, flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Search entities, navigate, switch app…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 15,
              color: 'rgba(235,230,220,0.9)',
              caretColor: accentColor,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                padding: '2px 7px',
                background: `${accentColor}15`,
                border: `1px solid ${accentColor}30`,
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.05em',
                color: accentColor,
                textTransform: 'uppercase',
              }}
            >
              OMNIA
            </span>
            <button
              onClick={closeCommandPalette}
              style={{
                display: 'flex',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.3)',
                padding: 4,
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div style={{ maxHeight: 420, overflowY: 'auto', padding: '8px 0' }}>
          {allItems.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
          {sortedGroups.map(([groupName, items]) => (
            <div key={groupName}>
              <div
                style={{
                  padding: '6px 18px 4px',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.3)',
                }}
              >
                {groupName}
              </div>
              {items.map((item) => {
                const idx = globalIdx++;
                const isSelected = idx === selectedIndex;
                if (item.kind === 'action') {
                  const a = item.data;
                  return (
                    <button
                      key={a.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        width: '100%',
                        padding: '9px 18px',
                        background: isSelected ? `${accentColor}15` : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.1s',
                      }}
                    >
                      <span style={{ color: isSelected ? accentColor : 'rgba(255,255,255,0.4)', display: 'flex' }}>
                        {a.icon}
                      </span>
                      <span style={{ flex: 1, fontSize: 13, color: isSelected ? 'rgba(235,230,220,1)' : 'rgba(235,230,220,0.8)' }}>
                        {a.label}
                      </span>
                      {isSelected && <ArrowRight size={13} style={{ color: accentColor }} />}
                    </button>
                  );
                } else {
                  const e = item.data as WorldModelEntity;
                  const domainColor = DOMAIN_COLORS[e.domain] ?? '#8b7ac8';
                  return (
                    <button
                      key={e.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        width: '100%',
                        padding: '9px 18px',
                        background: isSelected ? `${accentColor}15` : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.1s',
                      }}
                    >
                      <span
                        style={{
                          flexShrink: 0,
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: domainColor,
                          marginLeft: 3,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: isSelected ? 'rgba(235,230,220,1)' : 'rgba(235,230,220,0.8)', marginBottom: 1 }}>
                          {e.label}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {e.domain} · {e.description}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: domainColor,
                          opacity: 0.7,
                        }}
                      >
                        {Math.round(e.confidence * 100)}%
                      </span>
                      {isSelected && <ExternalLink size={12} style={{ color: domainColor }} />}
                    </button>
                  );
                }
              })}
            </div>
          ))}
        </div>

        <div
          style={{
            padding: '8px 18px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 11,
            color: 'rgba(255,255,255,0.25)',
          }}
        >
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
          <span style={{ marginLeft: 'auto' }}>
            {allItems.length} result{allItems.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
