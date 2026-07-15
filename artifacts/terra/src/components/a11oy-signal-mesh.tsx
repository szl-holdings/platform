import { useState } from 'react';
import {
  Anchor,
  ChevronDown,
  ChevronUp,
  Scale,
  Shield,
  Truck,
  Zap,
} from 'lucide-react';

interface CrossSignal {
  id: string;
  vertical: string;
  verticalColor: string;
  icon: typeof Shield;
  summary: string;
  impactNote: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

const SIGNALS: CrossSignal[] = [
  {
    id: 'sig-001',
    vertical: 'Vessels',
    verticalColor: '#4a90b8',
    icon: Anchor,
    summary: 'Port Newark congestion — supply chain delay impacting 3 warehouse assets in Queens',
    impactNote: 'Logistics clause review triggered for LIC industrial portfolio',
    timestamp: '12m ago',
    severity: 'warning',
  },
  {
    id: 'sig-002',
    vertical: 'Counsel',
    verticalColor: '#8b7ac8',
    icon: Scale,
    summary: 'Lease expiry cluster detected — 12 commercial leases in Midtown expiring Q3 2026',
    impactNote: 'Disposition opportunity window identified across 4 properties',
    timestamp: '34m ago',
    severity: 'info',
  },
  {
    id: 'sig-003',
    vertical: 'TENAX',
    verticalColor: '#c04a2a',
    icon: Shield,
    summary: 'Cyber posture downgrade on property management vendor affecting 8 portfolio assets',
    impactNote: 'Insurance premium re-evaluation recommended for affected properties',
    timestamp: '1h ago',
    severity: 'critical',
  },
  {
    id: 'sig-004',
    vertical: 'Vessels',
    verticalColor: '#4a90b8',
    icon: Truck,
    summary: 'Container throughput surge at Red Hook — construction material delivery window opening',
    impactNote: 'Capital improvement projects in Brooklyn may accelerate',
    timestamp: '2h ago',
    severity: 'info',
  },
  {
    id: 'sig-005',
    vertical: 'TENAX',
    verticalColor: '#c04a2a',
    icon: Zap,
    summary: 'SCADA vulnerability disclosed in building management systems — 14 high-rises flagged',
    impactNote: 'Compliance review initiated for managed commercial portfolio',
    timestamp: '3h ago',
    severity: 'warning',
  },
];

const SEVERITY_STYLES = {
  info: { dot: 'rgba(74,144,184,0.8)', bg: 'rgba(74,144,184,0.04)' },
  warning: { dot: '#b8943c', bg: 'rgba(184,148,60,0.04)' },
  critical: { dot: '#c04a2a', bg: 'rgba(192,74,42,0.04)' },
};

export function A11oySignalMesh() {
  const [expanded, setExpanded] = useState(false);
  const visibleSignals = expanded ? SIGNALS : SIGNALS.slice(0, 3);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.015)',
        border: '1px solid rgba(184,148,60,0.08)',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{
              background: 'rgba(184,148,60,0.1)',
              border: '1px solid rgba(184,148,60,0.15)',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="1.5" fill="#b8943c" />
              <circle cx="5" cy="5" r="4" stroke="#b8943c" strokeWidth="0.5" opacity="0.4" />
              <line x1="5" y1="1" x2="5" y2="0" stroke="#b8943c" strokeWidth="0.5" opacity="0.3" />
              <line x1="5" y1="9" x2="5" y2="10" stroke="#b8943c" strokeWidth="0.5" opacity="0.3" />
              <line x1="1" y1="5" x2="0" y2="5" stroke="#b8943c" strokeWidth="0.5" opacity="0.3" />
              <line x1="9" y1="5" x2="10" y2="5" stroke="#b8943c" strokeWidth="0.5" opacity="0.3" />
            </svg>
          </div>
          <span
            className="text-[9px] font-bold tracking-[0.15em] uppercase font-mono"
            style={{ color: 'rgba(184,148,60,0.7)' }}
          >
            A11oy Signal Mesh
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#b8943c' }}
          />
          <span
            className="text-[9px] font-mono"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            {SIGNALS.length} cross-vertical signals
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.25)' }} />
        ) : (
          <ChevronDown className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.25)' }} />
        )}
      </button>

      <div className="px-3.5 pb-3 space-y-1.5">
        {visibleSignals.map((sig) => {
          const sev = SEVERITY_STYLES[sig.severity];
          const Icon = sig.icon;
          return (
            <div
              key={sig.id}
              className="rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
              style={{ background: sev.bg }}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: `${sig.verticalColor}15`,
                    border: `1px solid ${sig.verticalColor}25`,
                  }}
                >
                  <Icon className="w-2.5 h-2.5" style={{ color: sig.verticalColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-[9px] font-bold font-mono uppercase tracking-wider"
                      style={{ color: sig.verticalColor }}
                    >
                      {sig.vertical}
                    </span>
                    <span
                      className="w-1 h-1 rounded-full"
                      style={{ background: sev.dot }}
                    />
                    <span
                      className="text-[9px] font-mono"
                      style={{ color: 'rgba(255,255,255,0.2)' }}
                    >
                      {sig.timestamp}
                    </span>
                  </div>
                  <p
                    className="text-[11px] leading-[1.5]"
                    style={{ color: 'rgba(255,255,255,0.55)' }}
                  >
                    {sig.summary}
                  </p>
                  <p
                    className="text-[10px] mt-1 leading-[1.4]"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  >
                    → {sig.impactNote}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
