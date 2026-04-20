import type React from 'react';
import { useState } from 'react';

export interface ExplainabilityMetadata {
  triggerSource: string;
  contributingData: string[];
  confidenceScore: number;
  confidenceExplanation: string;
  assumptions: string[];
  suggestedNextAction: string;
  businessImpact?: string;
  sourceApp?: string;
  generatedAt?: string;
}

export interface ExplainabilityDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  metadata: ExplainabilityMetadata;
  accentColor?: string;
}

function ConfidenceMeter({ score, color }: { score: number; color: string }) {
  const pct = Math.min(100, Math.max(0, Math.round(score * 100)));
  const label = pct >= 80 ? 'High' : pct >= 60 ? 'Moderate' : pct >= 40 ? 'Low' : 'Very Low';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Confidence
        </span>
        <span style={{ fontSize: '13px', fontWeight: 700, color }}>
          {pct}% · {label}
        </span>
      </div>
      <div
        style={{
          height: '4px',
          borderRadius: '2px',
          background: 'rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: '2px',
            background: color,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span
        style={{
          fontSize: '10px',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

export function ExplainabilityDrawer({
  open,
  onClose,
  title = 'AI Reasoning',
  metadata,
  accentColor = '#8b7ac8',
}: ExplainabilityDrawerProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 9001,
          width: '400px',
          maxWidth: '100vw',
          height: '100%',
          background: 'rgba(8,10,18,0.98)',
          borderLeft: `1px solid ${accentColor}30`,
          boxShadow: `-20px 0 60px rgba(0,0,0,0.6)`,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: `${accentColor}20`,
                border: `1px solid ${accentColor}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
              }}
            >
              🔍
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                {title}
              </div>
              {metadata.sourceApp && (
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
                  Source: {metadata.sourceApp}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontSize: '12px',
              padding: '4px 8px',
            }}
          >
            ✕ Close
          </button>
        </div>

        <div
          style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          <ConfidenceMeter score={metadata.confidenceScore} color={accentColor} />

          <Section label="What Triggered This">
            <div
              style={{
                padding: '10px 12px',
                background: `${accentColor}10`,
                border: `1px solid ${accentColor}20`,
                borderRadius: '8px',
                fontSize: '13px',
                color: 'rgba(255,255,255,0.8)',
                lineHeight: 1.5,
              }}
            >
              {metadata.triggerSource}
            </div>
          </Section>

          <Section label="Contributing Data Sources">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {metadata.contributingData.map((d, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  <span style={{ color: accentColor, fontSize: '10px' }}>▸</span>
                  {d}
                </div>
              ))}
            </div>
          </Section>

          <Section label="Confidence Explanation">
            <div
              style={{
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.65)',
                lineHeight: 1.5,
              }}
            >
              {metadata.confidenceExplanation}
            </div>
          </Section>

          {metadata.assumptions.length > 0 && (
            <Section label="Assumptions">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {metadata.assumptions.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '6px 10px',
                      background: 'rgba(245,158,11,0.06)',
                      border: '1px solid rgba(245,158,11,0.15)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.65)',
                      lineHeight: 1.4,
                    }}
                  >
                    <span
                      style={{
                        color: '#d4a054',
                        fontSize: '10px',
                        marginTop: '2px',
                        flexShrink: 0,
                      }}
                    >
                      ⚠
                    </span>
                    {a}
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section label="Suggested Next Action">
            <div
              style={{
                padding: '12px',
                background: `${accentColor}12`,
                border: `1px solid ${accentColor}30`,
                borderRadius: '8px',
                fontSize: '13px',
                color: accentColor,
                fontWeight: 600,
                lineHeight: 1.5,
              }}
            >
              {metadata.suggestedNextAction}
            </div>
          </Section>

          {metadata.businessImpact && (
            <Section label="Business Impact">
              <div
                style={{
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.65)',
                  lineHeight: 1.5,
                }}
              >
                {metadata.businessImpact}
              </div>
            </Section>
          )}

          {metadata.generatedAt && (
            <div
              style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.2)',
                textAlign: 'center',
                paddingTop: '8px',
              }}
            >
              Generated at {new Date(metadata.generatedAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function useExplainability() {
  const [open, setOpen] = useState(false);
  const [metadata, setMetadata] = useState<ExplainabilityMetadata | null>(null);
  const [title, setTitle] = useState<string>('AI Reasoning');

  const explain = (meta: ExplainabilityMetadata, drawerTitle?: string) => {
    setMetadata(meta);
    if (drawerTitle) setTitle(drawerTitle);
    setOpen(true);
  };

  const close = () => setOpen(false);

  return { open, metadata, title, explain, close };
}

export function ExplainButton({
  onClick,
  accentColor = '#8b7ac8',
  label = 'Explain',
}: {
  onClick: () => void;
  accentColor?: string;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        background: `${accentColor}12`,
        border: `1px solid ${accentColor}30`,
        borderRadius: '5px',
        color: accentColor,
        fontSize: '10px',
        fontWeight: 600,
        cursor: 'pointer',
        letterSpacing: '0.3px',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = `${accentColor}20`;
        (e.currentTarget as HTMLElement).style.borderColor = `${accentColor}50`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = `${accentColor}12`;
        (e.currentTarget as HTMLElement).style.borderColor = `${accentColor}30`;
      }}
    >
      🔍 {label}
    </button>
  );
}
