import React, { useRef, useState } from 'react';
import { CheckCircle2, ChevronRight, ExternalLink, GitBranch, Link2, X } from 'lucide-react';
import type { ProvenanceChain, ProvenanceLink } from './types.js';
import { useOmniaShellSafe } from './OmniaShellProvider.js';

const LINK_TYPE_STYLES: Record<
  ProvenanceLink['type'],
  { label: string; color: string; icon: React.ReactNode }
> = {
  'raw-data': { label: 'Raw Signal', color: '#64748b', icon: <Link2 size={11} /> },
  signal: { label: 'Signal', color: '#3b82f6', icon: <GitBranch size={11} /> },
  derivation: { label: 'Derivation', color: '#8b7ac8', icon: <ChevronRight size={11} /> },
  policy: { label: 'Policy', color: '#f59e0b', icon: <CheckCircle2 size={11} /> },
  approval: { label: 'Approved', color: '#22c55e', icon: <CheckCircle2 size={11} /> },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

interface ProvenanceInlineProps {
  chain: ProvenanceChain;
  children: React.ReactNode;
  accentColor?: string;
}

export function Provenance({ chain, children, accentColor = '#8b7ac8' }: ProvenanceInlineProps) {
  const omnia = useOmniaShellSafe();
  const [localOpen, setLocalOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const open = () => {
    if (omnia) {
      omnia.showProvenance(chain);
    } else {
      setLocalOpen(true);
    }
  };

  const isOpen = omnia ? omnia.activeProvenanceChain?.claimId === chain.claimId : localOpen;

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'baseline', gap: 3 }} ref={ref}>
      <span
        onClick={open}
        title="Show provenance"
        style={{
          cursor: 'pointer',
          borderBottom: `1px dashed ${accentColor}60`,
          paddingBottom: 1,
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = accentColor;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = `${accentColor}60`;
        }}
      >
        {children}
      </span>
      <button
        onClick={open}
        title="Show proof chain"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          marginLeft: 2,
          color: `${accentColor}70`,
          verticalAlign: 'middle',
        }}
      >
        <GitBranch size={10} />
      </button>

      {!omnia && isOpen && (
        <ProvenancePanelInline
          chain={chain}
          accentColor={accentColor}
          onClose={() => setLocalOpen(false)}
        />
      )}
    </span>
  );
}

interface ProvenancePanelInlineProps {
  chain: ProvenanceChain;
  accentColor: string;
  onClose: () => void;
}

function ProvenancePanelInline({ chain, accentColor, onClose }: ProvenancePanelInlineProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 12px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 360,
        background: '#0d1520',
        border: `1px solid ${accentColor}30`,
        borderRadius: 12,
        boxShadow: `0 20px 60px rgba(0,0,0,0.6)`,
        zIndex: 99990,
        padding: 0,
        overflow: 'hidden',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <ProvenancePanelContent chain={chain} accentColor={accentColor} onClose={onClose} />
    </div>
  );
}

interface ProvenancePanelContentProps {
  chain: ProvenanceChain;
  accentColor: string;
  onClose: () => void;
}

export function ProvenancePanelContent({ chain, accentColor, onClose }: ProvenancePanelContentProps) {
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '11px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: accentColor, marginBottom: 2 }}>
            A11oy Proof Chain
          </div>
          <div style={{ fontSize: 12, color: 'rgba(235,230,220,0.7)' }}>
            {chain.claimLabel}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex' }}
        >
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: '10px 14px' }}>
        <div
          style={{
            padding: '8px 12px',
            background: `${accentColor}10`,
            border: `1px solid ${accentColor}25`,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Claimed value</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(235,230,220,0.95)', fontVariantNumeric: 'tabular-nums' }}>
            {chain.claimValue}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
            Domain: <span style={{ color: accentColor }}>{chain.domain}</span>
            {chain.policyTier && <> · Policy tier: {chain.policyTier}</>}
          </div>
        </div>

        <div style={{ position: 'relative', paddingLeft: 20 }}>
          <div
            style={{
              position: 'absolute',
              left: 6,
              top: 8,
              bottom: 8,
              width: 1,
              background: `linear-gradient(to bottom, ${accentColor}50, ${accentColor}10)`,
            }}
          />
          {chain.links.map((link, i) => {
            const meta = LINK_TYPE_STYLES[link.type];
            return (
              <div key={link.id} style={{ position: 'relative', marginBottom: 10 }}>
                <div
                  style={{
                    position: 'absolute',
                    left: -17,
                    top: 6,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: meta.color,
                    border: '1.5px solid #0d1520',
                  }}
                />
                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 7,
                    padding: '7px 10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                    <span style={{ color: meta.color, display: 'flex' }}>{meta.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: meta.color }}>
                      {meta.label}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                      {relativeTime(link.timestamp)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(235,230,220,0.8)', marginBottom: 2 }}>{link.label}</div>
                  {link.value !== undefined && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums' }}>
                      value: {link.value}
                    </div>
                  )}
                  {link.author && (
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>by {link.author}</div>
                  )}
                  {link.url && (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 10, color: accentColor, textDecoration: 'none' }}
                    >
                      Source <ExternalLink size={9} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {chain.approvedBy && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 10px',
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 7,
              marginTop: 4,
            }}
          >
            <CheckCircle2 size={13} style={{ color: '#22c55e' }} />
            <span style={{ fontSize: 12, color: 'rgba(235,230,220,0.8)' }}>
              Approved by {chain.approvedBy}
              {chain.approvedAt && <span style={{ color: 'rgba(255,255,255,0.4)' }}> · {relativeTime(chain.approvedAt)}</span>}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

export function ProvenanceModal() {
  const omnia = useOmniaShellSafe();
  if (!omnia?.activeProvenanceChain) return null;
  const { activeProvenanceChain, closeProvenance, config } = omnia;
  const accentColor = config.accentColor ?? '#8b7ac8';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={closeProvenance}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 400,
          maxWidth: 'calc(100vw - 32px)',
          background: '#0d1520',
          border: `1px solid ${accentColor}30`,
          borderRadius: 14,
          boxShadow: `0 30px 80px rgba(0,0,0,0.65)`,
          overflow: 'hidden',
        }}
      >
        <ProvenancePanelContent
          chain={activeProvenanceChain}
          accentColor={accentColor}
          onClose={closeProvenance}
        />
      </div>
    </div>
  );
}
