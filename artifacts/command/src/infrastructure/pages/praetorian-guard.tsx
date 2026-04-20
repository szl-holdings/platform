import { ClassificationBadge } from '@imp/components/classification-badge';
import {
  getThreatColor,
  IMPERIUM_DATA,
  INTELLIGENCE_BRIEFS,
  type ThreatLevel,
} from '@imp/lib/imperium-data';
import { cn } from '@imp/lib/utils';
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Eye,
  Lock,
  Network,
  RefreshCw,
  Server,
  Shield,
  Wifi,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

const THREAT_LEVELS: ThreatLevel[] = ['CLEAR', 'ELEVATED', 'ACTIVE', 'CRITICAL'];
const THREAT_LABELS: Record<ThreatLevel, { label: string; color: string; description: string }> = {
  CLEAR: {
    label: 'Clear',
    color: '#4ade80',
    description: 'No active threats. All systems nominal. Standard monitoring in effect.',
  },
  ELEVATED: {
    label: 'Elevated',
    color: '#facc15',
    description: 'Elevated activity detected. Enhanced monitoring active. WAF rules tightened.',
  },
  ACTIVE: {
    label: 'Active Threat',
    color: '#fb923c',
    description:
      'Active threat engagement. Emergency hardening protocols engaged. All services restricted.',
  },
  CRITICAL: {
    label: 'Critical',
    color: '#ef4444',
    description:
      'Critical breach underway. Maximum isolation. Manual intervention required immediately.',
  },
};

function ThreatGauge({ current }: { current: ThreatLevel }) {
  const currentIdx = THREAT_LEVELS.indexOf(current);

  return (
    <div className="imperial-card rounded-xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Shield className="w-4 h-4" style={{ color: '#c9a227' }} />
        <span className="font-display text-xs tracking-[0.2em] gold-text uppercase">
          Threat Condition
        </span>
      </div>
      <div className="relative">
        <div className="flex gap-2 mb-4">
          {THREAT_LEVELS.map((level, i) => {
            const cfg = THREAT_LABELS[level];
            const isActive = i === currentIdx;
            const isPast = i < currentIdx;
            return (
              <div key={level} className="flex-1">
                <div
                  className={cn(
                    'h-3 rounded transition-all duration-500',
                    isActive && 'animate-pulse',
                  )}
                  style={{
                    backgroundColor: isActive || isPast ? cfg.color : 'rgba(255,255,255,0.06)',
                    boxShadow: isActive ? `0 0 12px ${cfg.color}80` : undefined,
                    opacity: isPast ? 0.4 : 1,
                  }}
                />
                <div
                  className="text-[9px] font-mono text-center mt-1.5 tracking-widest"
                  style={{ color: isActive ? cfg.color : 'rgba(148,163,184,0.4)' }}
                >
                  {cfg.label.toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>
        <div
          className="rounded-lg p-4 border mt-2"
          style={{
            borderColor: `${getThreatColor(current)}30`,
            background: `${getThreatColor(current)}08`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: getThreatColor(current) }}
            />
            <span
              className="font-display text-base tracking-[0.2em] font-bold"
              style={{ color: getThreatColor(current) }}
            >
              {current} — {THREAT_LABELS[current].label}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {THREAT_LABELS[current].description}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  value,
  ok,
  detail,
}: {
  label: string;
  value: string;
  ok: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'w-2 h-2 rounded-full flex-shrink-0 mt-0.5',
            ok ? 'bg-green-400' : 'bg-orange-400',
          )}
        />
        <div>
          <div className="text-xs text-slate-300">{label}</div>
          {detail && <div className="text-[10px] text-slate-600 mt-0.5">{detail}</div>}
        </div>
      </div>
      <span
        className={cn('text-xs font-mono tracking-wide', ok ? 'text-green-400' : 'text-orange-400')}
      >
        {value}
      </span>
    </div>
  );
}

function ThreatFeedEntry({
  indicator,
}: {
  indicator: (typeof INTELLIGENCE_BRIEFS.threat.indicators)[0];
}) {
  const colors = { HIGH: '#ef4444', MEDIUM: '#fb923c', LOW: '#facc15' };
  const color = colors[indicator.severity as keyof typeof colors];
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0 animate-data-stream">
      <div
        className="px-1.5 py-0.5 rounded font-mono text-[9px] tracking-wider flex-shrink-0 mt-0.5 border"
        style={{ color, borderColor: `${color}40`, background: `${color}10` }}
      >
        {indicator.severity}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-slate-300 font-semibold">{indicator.type}</div>
        <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
          {indicator.description}
        </div>
      </div>
      <div className="font-mono text-xs text-slate-500 flex-shrink-0">
        {indicator.count.toLocaleString()}
      </div>
    </div>
  );
}

function AutoHardeningCard({ threat }: { threat: ThreatLevel }) {
  const recommendations = {
    CLEAR: [
      'All hardening measures nominal',
      'Next secret rotation: 23 days',
      'WAF rate limit: 1000 req/min — OK',
    ],
    ELEVATED: [
      'RECOMMEND: Reduce WAF rate limit to 500 req/min',
      'RECOMMEND: Enable enhanced auth logging',
      'RECOMMEND: Geo-filter high-risk regions',
    ],
    ACTIVE: [
      'URGENT: Activate geo-blocking immediately',
      'URGENT: Rotate all Key Vault secrets',
      'URGENT: Enable Container App IP restrictions',
    ],
    CRITICAL: [
      'CRITICAL: Isolate all private endpoints',
      'CRITICAL: Disable public Container App ingress',
      'CRITICAL: Engage incident response team',
    ],
  };
  const recs = recommendations[threat];
  const colors: Record<ThreatLevel, string> = {
    CLEAR: '#4ade80',
    ELEVATED: '#facc15',
    ACTIVE: '#fb923c',
    CRITICAL: '#ef4444',
  };
  const color = colors[threat];

  return (
    <div className="imperial-card rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4" style={{ color: '#c9a227' }} />
        <span className="font-display text-xs tracking-[0.15em] gold-text uppercase">
          Auto-Hardening Recommendations
        </span>
      </div>
      <div className="space-y-2">
        {recs.map((rec, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color }} />
            <span
              style={{
                color: threat === 'CLEAR' ? 'rgba(148,163,184,0.7)' : 'rgba(226,215,180,0.85)',
              }}
            >
              {rec}
            </span>
          </div>
        ))}
      </div>
      {threat !== 'CLEAR' && (
        <button
          className="mt-3 w-full py-2 rounded font-mono text-[10px] tracking-widest font-bold border transition-all hover:bg-current/10"
          style={{ borderColor: color, color }}
        >
          INITIATE HARDENING PROTOCOL
        </button>
      )}
    </div>
  );
}

export default function PraetorianGuard() {
  const imperium = IMPERIUM_DATA;
  const threat = INTELLIGENCE_BRIEFS.threat;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Shield className="w-5 h-5" style={{ color: '#c9a227' }} />
          <h1 className="font-display text-lg tracking-[0.2em] gold-text gold-glow font-bold uppercase">
            Security Perimeter
          </h1>
        </div>
        <p className="text-xs text-slate-500 ml-8">
          Autonomous security perimeter — CLEAR → ELEVATED → ACTIVE → CRITICAL
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ThreatGauge current={imperium.threatLevel} />
        <AutoHardeningCard threat={imperium.threatLevel} />
      </div>

      {/* Perimeter status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="imperial-card rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Network className="w-4 h-4 text-green-400" />
            <span className="font-display text-xs tracking-[0.12em] text-green-400 uppercase">
              WAF Status
            </span>
          </div>
          <StatusRow
            label="Prevention Mode"
            value="ACTIVE"
            ok={true}
            detail="DRS 2.1 + Bot Manager 1.1"
          />
          <StatusRow label="Rate Limit" value="1000/min" ok={true} detail="Custom rule active" />
          <StatusRow label="Managed Rules" value="3 active" ok={true} detail="DRS + Bot + Custom" />
          <StatusRow
            label="Requests Blocked (24h)"
            value="847"
            ok={true}
            detail="WAF successfully intercepted"
          />
          <StatusRow
            label="Rate Limit Threshold"
            value="WARNING"
            ok={false}
            detail="Recommend: reduce to 500/min"
          />
        </div>

        <div className="imperial-card rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-green-400" />
            <span className="font-display text-xs tracking-[0.12em] text-green-400 uppercase">
              VNet Isolation
            </span>
          </div>
          <StatusRow
            label="PostgreSQL"
            value="PRIVATE"
            ok={true}
            detail="Delegated subnet 10.0.2.0/24"
          />
          <StatusRow
            label="Redis Cache"
            value="PRIVATE"
            ok={true}
            detail="Private endpoint 10.0.3.x"
          />
          <StatusRow label="Key Vault" value="PRIVATE" ok={true} detail="Private endpoint + RBAC" />
          <StatusRow
            label="Blob Storage"
            value="PRIVATE"
            ok={true}
            detail="Private endpoint 10.0.3.x"
          />
          <StatusRow
            label="Service Bus"
            value="PUBLIC"
            ok={false}
            detail="Senate proposal #005 pending"
          />
        </div>

        <div className="imperial-card rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-green-400" />
            <span className="font-display text-xs tracking-[0.12em] text-green-400 uppercase">
              Front Door Health
            </span>
          </div>
          <StatusRow label="Profile" value="PREMIUM" ok={true} detail="szlholdings-fd" />
          <StatusRow label="Endpoint" value="ACTIVE" ok={true} detail="szlholdings.com" />
          <StatusRow label="SSL Certificate" value="VALID" ok={true} detail="245 days remaining" />
          <StatusRow
            label="Origin Health"
            value="100%"
            ok={true}
            detail="API container app healthy"
          />
          <StatusRow
            label="Custom Domain"
            value="VERIFIED"
            ok={true}
            detail="szlholdings.com managed cert"
          />
        </div>
      </div>

      {/* Threat intelligence feed */}
      <div className="imperial-card rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" style={{ color: '#c9a227' }} />
            <span className="font-display text-xs tracking-[0.15em] gold-text uppercase">
              Threat Intelligence Feed
            </span>
            <ClassificationBadge classification={threat.classification} size="xs" />
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3 h-3 text-slate-600" />
            <span className="text-[10px] font-mono text-slate-600">Aegis linked</span>
          </div>
        </div>
        <div>
          {threat.indicators.map((indicator, i) => (
            <ThreatFeedEntry key={i} indicator={indicator} />
          ))}
        </div>
        <div className="mt-3 p-3 rounded bg-white/3 border border-white/5">
          <div className="text-[11px] text-slate-400 leading-relaxed">
            <span className="font-mono text-slate-500 mr-2">SIGINT SUMMARY:</span>
            {threat.summary}
          </div>
        </div>
      </div>

      {/* Key Vault sovereign status */}
      <div className="imperial-card rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4" style={{ color: '#c9a227' }} />
          <span className="font-display text-xs tracking-[0.15em] gold-text uppercase">
            Sovereign Key Vault
          </span>
          <ClassificationBadge classification="SOVEREIGN" size="xs" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Purge Protection', value: 'ENABLED', ok: true },
            { label: 'Soft Delete', value: '90 DAYS', ok: true },
            { label: 'RBAC Auth', value: 'ENABLED', ok: true },
            { label: 'Public Access', value: 'DENY', ok: true },
          ].map(({ label, value, ok }) => (
            <div
              key={label}
              className="rounded p-3 text-center"
              style={{
                background: 'rgba(74,222,128,0.06)',
                border: '1px solid rgba(74,222,128,0.15)',
              }}
            >
              <div className="font-mono text-xs font-bold text-green-400">{value}</div>
              <div className="text-[10px] text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
