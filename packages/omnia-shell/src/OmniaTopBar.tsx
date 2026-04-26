import React, { useState } from 'react';
import { Command, Grid3X3, Network } from 'lucide-react';
import { OmniaNotificationInbox } from './OmniaNotificationInbox.js';
import { OmniaCommandPalette } from './OmniaCommandPalette.js';
import { ProvenanceModal } from './Provenance.js';
import { OmniaBreadcrumb, type BreadcrumbItem } from './OmniaBreadcrumb.js';
import { useOmniaShell } from './OmniaShellProvider.js';

export interface OmniaTopBarProps {
  breadcrumb?: BreadcrumbItem[];
  rightSlot?: React.ReactNode;
}

const ARTIFACT_PATHS: Record<string, { name: string; path: string; accent: string }> = {
  command: { name: 'Command', path: '/command', accent: '#8b7ac8' },
  holdings: { name: 'Holdings', path: '/', accent: '#c9b787' },
  aegis: { name: 'Aegis', path: '/aegis', accent: '#ef4444' },
  sentra: { name: 'Sentra', path: '/sentra', accent: '#22c55e' },
  terra: { name: 'Terra', path: '/terra', accent: '#22c55e' },
  vessels: { name: 'Vessels', path: '/vessels', accent: '#0ea5e9' },
  counsel: { name: 'Counsel', path: '/counsel', accent: '#8b5cf6' },
  a11oy: { name: 'A11oy', path: '/a11oy', accent: '#c9b787' },
  pulse: { name: 'Pulse', path: '/pulse', accent: '#f59e0b' },
  'carlota-jo': { name: 'Carlota Jo', path: '/carlota-jo', accent: '#ec4899' },
  lyte: { name: 'Lyte', path: '/lyte', accent: '#3b82f6' },
  praxis: { name: 'PRAXIS', path: '/nexus', accent: '#8b5cf6' },
};

const PEER_APPS = Object.values(ARTIFACT_PATHS);

export function OmniaTopBar({ breadcrumb = [], rightSlot }: OmniaTopBarProps) {
  const { config, openCommandPalette } = useOmniaShell();
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false);
  const accentColor = config.accentColor ?? '#8b7ac8';
  const currentApp = ARTIFACT_PATHS[config.artifactId];

  return (
    <>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 9000,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          background: 'rgba(6,11,18,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <a
            href="/command/omnia"
            title="OMNIA Hub — unified portfolio"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              textDecoration: 'none',
            }}
          >
            <Network size={14} style={{ color: accentColor }} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: accentColor,
                opacity: 0.7,
              }}
            >
              OMNIA
            </span>
          </a>

          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>·</span>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setAppSwitcherOpen((p) => !p)}
              title="Switch artifact"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                color: 'rgba(235,230,220,0.85)',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <Grid3X3 size={12} style={{ color: accentColor }} />
              <span>{currentApp?.name ?? config.artifactName}</span>
            </button>

            {appSwitcherOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 9800 }}
                  onClick={() => setAppSwitcherOpen(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    background: '#0d1520',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    zIndex: 9900,
                    padding: 8,
                    minWidth: 180,
                  }}
                >
                  <div
                    style={{
                      padding: '4px 8px 8px',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.3)',
                    }}
                  >
                    Portfolio
                  </div>
                  {PEER_APPS.map((app) => (
                    <a
                      key={app.path}
                      href={app.path}
                      onClick={() => setAppSwitcherOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '7px 8px',
                        borderRadius: 7,
                        textDecoration: 'none',
                        background: app.path === (currentApp?.path ?? '') ? `${accentColor}15` : 'transparent',
                        transition: 'background 0.12s',
                        fontSize: 13,
                        color: app.path === (currentApp?.path ?? '') ? 'rgba(235,230,220,0.9)' : 'rgba(235,230,220,0.6)',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          app.path === (currentApp?.path ?? '') ? `${accentColor}15` : 'transparent';
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: app.accent,
                          flexShrink: 0,
                        }}
                      />
                      {app.name}
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {breadcrumb.length > 0 && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
            <OmniaBreadcrumb items={breadcrumb} accentColor={accentColor} />
          </>
        )}

        <div style={{ flex: 1 }} />

        <button
          onClick={openCommandPalette}
          title="OMNIA Command Palette (⌘K)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 10px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 12,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
            (e.currentTarget as HTMLElement).style.borderColor = `${accentColor}40`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
          }}
        >
          <Command size={11} />
          <span style={{ display: 'none' }} className="omnia-search-label">Search portfolio…</span>
          <span
            style={{
              padding: '1px 5px',
              background: 'rgba(255,255,255,0.07)',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.03em',
            }}
          >
            ⌘K
          </span>
        </button>

        <OmniaNotificationInbox accentColor={accentColor} />

        {rightSlot}
      </div>

      <OmniaCommandPalette />
      <ProvenanceModal />
    </>
  );
}
