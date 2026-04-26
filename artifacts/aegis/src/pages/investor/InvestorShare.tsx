import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, Lock, Shield } from 'lucide-react';
import { type CSSProperties, useState } from 'react';
import { investorDeckApi } from '../../lib/investor-deck-api';
import InvestorDeckViewer from './InvestorDeckViewer';

function getTokenFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('token');
}

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div style={fullPageStyle}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          color: 'rgba(255,255,255,0.5)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: '2px solid rgba(12,200,217,0.2)',
            borderTop: '2px solid #0cc8d9',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div>Validating share link…</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ErrorState({ message }: { message: string }) {
  const isExpired = message.toLowerCase().includes('expir');

  return (
    <div style={fullPageStyle}>
      <div
        style={{
          maxWidth: 440,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {isExpired ? (
          <Clock size={40} style={{ color: '#f5a623' }} />
        ) : (
          <AlertTriangle size={40} style={{ color: '#ef4444' }} />
        )}
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#f0ece6',
            fontFamily: "'Sora', sans-serif",
          }}
        >
          {isExpired ? 'Link Expired' : 'Link Not Found'}
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>
          {isExpired
            ? 'This investor share link has expired. Please contact your Aegis account representative to request a new link.'
            : 'This share link is invalid or has been revoked. Please check the URL or contact your Aegis representative.'}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11,
            color: 'rgba(255,255,255,0.3)',
            marginTop: 8,
          }}
        >
          <Shield size={11} />
          Aegis — Governed Decision Infrastructure
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confidential banner (shown above the deck)
// ---------------------------------------------------------------------------

function ConfidentialBanner({
  recipient,
  expiresAt,
}: {
  recipient: string;
  expiresAt: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: '8px 20px',
        background: 'rgba(245,166,35,0.07)',
        borderBottom: '1px solid rgba(245,166,35,0.2)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <Lock size={11} style={{ color: '#f5a623' }} />
        <span
          style={{
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#f5a623',
            fontWeight: 600,
          }}
        >
          CONFIDENTIAL · INVESTOR USE ONLY
        </span>
      </div>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif' }}>
        Prepared for: <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{recipient}</strong>
      </span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'Inter, sans-serif' }}>
        Expires: {new Date(expiresAt).toLocaleDateString()}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export default function InvestorShare() {
  const token = getTokenFromUrl();

  const { data, isLoading, error } = useQuery({
    queryKey: ['aegis-share', token],
    queryFn: () => {
      if (!token) throw new Error('No share token in URL');
      return investorDeckApi.getShare(token);
    },
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  });

  if (!token) {
    return <ErrorState message="No share token found in URL." />;
  }

  if (isLoading) return <LoadingState />;

  if (error || !data) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Unknown error'}
      />
    );
  }

  const { recipient, expiresAt, snapshot } = data;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'linear-gradient(160deg, #07080d 0%, #0a1322 100%)',
        overflow: 'hidden',
      }}
    >
      <ConfidentialBanner recipient={recipient} expiresAt={expiresAt} />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <InvestorDeckViewer snapshot={snapshot} watermark={recipient} />
      </div>
    </div>
  );
}

const fullPageStyle: CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(160deg, #07080d 0%, #0a1322 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#e2e8f0',
};
