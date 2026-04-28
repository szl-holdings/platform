import {
  AlertTriangle,
  ChevronRight,
  Network,
} from 'lucide-react';
import { useState } from 'react';

const GOLD = '#d4a054';
const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.25)',
  },
};

interface Tenant {
  id: string;
  name: string;
  industry: string;
  plan: 'enterprise' | 'pro' | 'starter';
  devices: number;
  users: number;
  slaTarget: number;
  slaActual: number;
  openAlerts: number;
  criticalAlerts: number;
  healthScore: number;
  monthlyRev: number;
  trend: 'up' | 'down' | 'stable';
  brand: { color: string; initials: string };
  incidents7d: number;
  autoResolveRate: number;
}

const TENANTS: Tenant[] = [
  {
    id: 't1',
    name: 'PRAXIS Capital',
    industry: 'Finance',
    plan: 'enterprise',
    devices: 842,
    users: 340,
    slaTarget: 99.9,
    slaActual: 99.97,
    openAlerts: 3,
    criticalAlerts: 0,
    healthScore: 97,
    monthlyRev: 14200,
    trend: 'stable',
    brand: { color: '#3b82f6', initials: 'NC' },
    incidents7d: 4,
    autoResolveRate: 92,
  },
  {
    id: 't2',
    name: 'Meridian Health',
    industry: 'Healthcare',
    plan: 'enterprise',
    devices: 1204,
    users: 520,
    slaTarget: 99.99,
    slaActual: 99.91,
    openAlerts: 12,
    criticalAlerts: 2,
    healthScore: 74,
    monthlyRev: 21800,
    trend: 'down',
    brand: { color: '#10b981', initials: 'MH' },
    incidents7d: 18,
    autoResolveRate: 78,
  },
  {
    id: 't3',
    name: 'Apex Logistics',
    industry: 'Logistics',
    plan: 'pro',
    devices: 312,
    users: 145,
    slaTarget: 99.5,
    slaActual: 99.7,
    openAlerts: 5,
    criticalAlerts: 0,
    healthScore: 88,
    monthlyRev: 6400,
    trend: 'up',
    brand: { color: '#f97316', initials: 'AL' },
    incidents7d: 7,
    autoResolveRate: 86,
  },
  {
    id: 't4',
    name: 'Skyline Media',
    industry: 'Media',
    plan: 'pro',
    devices: 228,
    users: 98,
    slaTarget: 99.5,
    slaActual: 98.8,
    openAlerts: 18,
    criticalAlerts: 3,
    healthScore: 58,
    monthlyRev: 5100,
    trend: 'down',
    brand: { color: '#8b5cf6', initials: 'SM' },
    incidents7d: 24,
    autoResolveRate: 62,
  },
  {
    id: 't5',
    name: 'Foundry Works',
    industry: 'Manufacturing',
    plan: 'starter',
    devices: 95,
    users: 40,
    slaTarget: 99.0,
    slaActual: 99.3,
    openAlerts: 1,
    criticalAlerts: 0,
    healthScore: 93,
    monthlyRev: 1800,
    trend: 'stable',
    brand: { color: '#ec4899', initials: 'FW' },
    incidents7d: 2,
    autoResolveRate: 94,
  },
  {
    id: 't6',
    name: 'Harbor Legal',
    industry: 'Legal',
    plan: 'pro',
    devices: 176,
    users: 72,
    slaTarget: 99.5,
    slaActual: 99.62,
    openAlerts: 6,
    criticalAlerts: 1,
    healthScore: 81,
    monthlyRev: 4200,
    trend: 'up',
    brand: { color: GOLD, initials: 'HL' },
    incidents7d: 8,
    autoResolveRate: 84,
  },
];

const CROSS_TENANT_PATTERNS = [
  {
    id: 'cp1',
    title: 'Windows Defender Update Loop — 3 tenants',
    tenants: ['PRAXIS Capital', 'Apex Logistics', 'Foundry Works'],
    severity: 'high',
    pattern: 'Post-KB5034123 update causing boot loop on Dell Latitude 7420 fleet',
    recommendation: 'Block update via WSUS, deploy config fix',
    affected: 127,
  },
  {
    id: 'cp2',
    title: 'Zoom Audio Quality Regression',
    tenants: ['Meridian Health', 'Skyline Media', 'Harbor Legal'],
    severity: 'medium',
    pattern: 'Zoom 6.0.11 codec issue causing echo on VOIP audio devices',
    recommendation: 'Downgrade to 6.0.9 or apply audio driver patch',
    affected: 89,
  },
  {
    id: 'cp3',
    title: 'Office 365 Auth Token Expiry Spike',
    tenants: ['PRAXIS Capital', 'Meridian Health', 'Skyline Media'],
    severity: 'medium',
    pattern: 'Conditional Access policy change causing 6hr token expiry for shared devices',
    recommendation: 'Update CA policy token lifetime to 24hr',
    affected: 34,
  },
];

function SLABadge({ target, actual }: { target: number; actual: number }) {
  const met = actual >= target;
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: met ? '#10b981' : '#ef4444' }}
      />
      <span className="text-[10px] font-mono" style={{ color: met ? '#10b981' : '#ef4444' }}>
        {actual}%
      </span>
      <span className="text-[9px]" style={{ color: DS.text.muted }}>
        / {target}%
      </span>
    </div>
  );
}

function PlanBadge({ plan }: { plan: Tenant['plan'] }) {
  const c = plan === 'enterprise' ? GOLD : plan === 'pro' ? '#3b82f6' : DS.text.muted;
  return (
    <span
      className="text-[8px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider"
      style={{ background: `${c}15`, color: c, border: `1px solid ${c}30` }}
    >
      {plan}
    </span>
  );
}

export default function MSPCommand() {
  const [selected, setSelected] = useState<Tenant>(TENANTS[0]);
  const [view, setView] = useState<'overview' | 'patterns'>('overview');

  const totalDevices = TENANTS.reduce((a, t) => a + t.devices, 0);
  const totalMRR = TENANTS.reduce((a, t) => a + t.monthlyRev, 0);
  const criticalTenants = TENANTS.filter((t) => t.healthScore < 70).length;
  const avgHealth = Math.round(TENANTS.reduce((a, t) => a + t.healthScore, 0) / TENANTS.length);

  return (
    <div className="h-full overflow-auto" style={{ background: 'var(--gi-bg-base)' }}>
      <div className="max-w-[1400px] mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold tracking-tight" style={{ color: DS.text.primary }}>
              Multi-Tenant MSP Command
            </h1>
            <p className="text-[11px] mt-0.5" style={{ color: DS.text.muted }}>
              Unified view across all client tenants · cross-client pattern detection · per-tenant
              SLA enforcement
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(['overview', 'patterns'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 py-1.5 rounded text-[10px] font-medium capitalize transition-all"
                style={{
                  background: view === v ? `${GOLD}12` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${view === v ? `${GOLD}35` : DS.border}`,
                  color: view === v ? GOLD : DS.text.secondary,
                }}
              >
                {v === 'patterns' ? 'Cross-Tenant Patterns' : 'Tenant Overview'}
              </button>
            ))}
          </div>
        </div>

        {/* Fleet stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: 'Total Devices',
              value: totalDevices.toLocaleString(),
              color: DS.text.primary,
            },
            { label: 'Monthly Revenue', value: `$${(totalMRR / 1000).toFixed(0)}k`, color: GOLD },
            {
              label: 'Avg Health Score',
              value: `${avgHealth}`,
              color: avgHealth >= 80 ? '#10b981' : GOLD,
            },
            {
              label: 'Critical Tenants',
              value: `${criticalTenants}`,
              color: criticalTenants > 0 ? '#ef4444' : '#10b981',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg p-3"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <div
                className="text-[9px] uppercase tracking-widest mb-1"
                style={{ color: DS.text.muted }}
              >
                {s.label}
              </div>
              <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {view === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
            {/* Tenant list */}
            <div
              className="rounded-lg overflow-hidden"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <div className="p-3 border-b" style={{ borderColor: DS.border }}>
                <span
                  className="text-[10px] uppercase tracking-widest font-medium"
                  style={{ color: DS.text.muted }}
                >
                  Client Tenants — {TENANTS.length} active
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: DS.border }}>
                {TENANTS.map((t) => {
                  const hColor =
                    t.healthScore >= 80 ? '#10b981' : t.healthScore >= 65 ? GOLD : '#ef4444';
                  const _slaOk = t.slaActual >= t.slaTarget;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelected(t)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                      style={{ background: selected.id === t.id ? `${GOLD}05` : undefined }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{
                          background: `${t.brand.color}15`,
                          border: `1px solid ${t.brand.color}30`,
                          color: t.brand.color,
                        }}
                      >
                        {t.brand.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="text-[11px] font-semibold"
                            style={{ color: DS.text.primary }}
                          >
                            {t.name}
                          </span>
                          <PlanBadge plan={t.plan} />
                          <span className="text-[9px]" style={{ color: DS.text.muted }}>
                            {t.industry}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[9px]">
                          <span style={{ color: DS.text.muted }}>{t.devices} devices</span>
                          <span style={{ color: DS.text.muted }}>{t.users} users</span>
                          <SLABadge target={t.slaTarget} actual={t.slaActual} />
                          {t.criticalAlerts > 0 && (
                            <span className="flex items-center gap-1" style={{ color: '#ef4444' }}>
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {t.criticalAlerts} critical
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[14px] font-bold font-mono" style={{ color: hColor }}>
                          {t.healthScore}
                        </div>
                        <div className="text-[8px]" style={{ color: DS.text.muted }}>
                          health
                        </div>
                      </div>
                      <ChevronRight
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: DS.text.muted }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tenant detail */}
            <div className="space-y-3">
              <div
                className="rounded-lg p-4"
                style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                    style={{
                      background: `${selected.brand.color}15`,
                      border: `1px solid ${selected.brand.color}30`,
                      color: selected.brand.color,
                    }}
                  >
                    {selected.brand.initials}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: DS.text.primary }}>
                      {selected.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <PlanBadge plan={selected.plan} />
                      <span className="text-[10px]" style={{ color: DS.text.muted }}>
                        {selected.industry}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {[
                    { k: 'Devices', v: selected.devices },
                    { k: 'Users', v: selected.users },
                    { k: 'SLA Target', v: `${selected.slaTarget}%` },
                    {
                      k: 'SLA Actual',
                      v: `${selected.slaActual}%`,
                      color: selected.slaActual >= selected.slaTarget ? '#10b981' : '#ef4444',
                    },
                    {
                      k: 'Open Alerts',
                      v: selected.openAlerts,
                      color: selected.openAlerts > 5 ? '#f97316' : DS.text.primary,
                    },
                    {
                      k: 'Critical',
                      v: selected.criticalAlerts,
                      color: selected.criticalAlerts > 0 ? '#ef4444' : '#10b981',
                    },
                    { k: 'Incidents 7d', v: selected.incidents7d },
                    { k: 'Auto-Resolve', v: `${selected.autoResolveRate}%`, color: '#10b981' },
                    {
                      k: 'Monthly Rev',
                      v: `$${selected.monthlyRev.toLocaleString()}`,
                      color: GOLD,
                    },
                    {
                      k: 'Health Score',
                      v: `${selected.healthScore}/100`,
                      color:
                        selected.healthScore >= 80
                          ? '#10b981'
                          : selected.healthScore >= 65
                            ? GOLD
                            : '#ef4444',
                    },
                  ].map((r) => (
                    <div
                      key={r.k}
                      className="p-2 rounded"
                      style={{ background: 'rgba(255,255,255,0.02)' }}
                    >
                      <div style={{ color: DS.text.muted }} className="text-[8px]">
                        {r.k}
                      </div>
                      <div
                        style={{ color: (r as any).color ?? DS.text.primary }}
                        className="font-mono font-medium text-[11px]"
                      >
                        {r.v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="rounded-lg p-3"
                style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
              >
                <div
                  className="text-[9px] uppercase tracking-widest mb-2"
                  style={{ color: DS.text.muted }}
                >
                  SLA Status
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${selected.slaActual}%`,
                      background: selected.slaActual >= selected.slaTarget ? '#10b981' : '#ef4444',
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px]" style={{ color: DS.text.muted }}>
                    0%
                  </span>
                  <span
                    className="text-[9px] font-mono"
                    style={{
                      color: selected.slaActual >= selected.slaTarget ? '#10b981' : '#ef4444',
                    }}
                  >
                    {selected.slaActual}%
                  </span>
                  <span className="text-[9px]" style={{ color: DS.text.muted }}>
                    100%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div
              className="rounded-lg p-4"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Network className="w-4 h-4" style={{ color: GOLD }} />
                <span className="text-[11px] font-semibold" style={{ color: DS.text.primary }}>
                  Cross-Tenant Pattern Detection
                </span>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                  style={{ background: `${GOLD}15`, color: GOLD }}
                >
                  {CROSS_TENANT_PATTERNS.length} active patterns
                </span>
              </div>
              <p className="text-[10px] mb-4" style={{ color: DS.text.secondary }}>
                AI analysis surfacing issues that affect multiple clients — enabling fleet-wide
                remediation rather than per-tenant fixes.
              </p>
              <div className="space-y-3">
                {CROSS_TENANT_PATTERNS.map((p) => {
                  const sevColor =
                    p.severity === 'high' ? '#f97316' : p.severity === 'medium' ? GOLD : '#3b82f6';
                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-lg"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: `1px solid ${DS.border}`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-2 h-2 rounded-full mt-1 shrink-0"
                          style={{ background: sevColor }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="text-[11px] font-semibold"
                              style={{ color: DS.text.primary }}
                            >
                              {p.title}
                            </span>
                            <span
                              className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                              style={{ background: `${sevColor}15`, color: sevColor }}
                            >
                              {p.severity}
                            </span>
                          </div>
                          <p className="text-[10px] mb-2" style={{ color: DS.text.secondary }}>
                            {p.pattern}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {p.tenants.map((t) => (
                              <span
                                key={t}
                                className="text-[9px] px-1.5 py-0.5 rounded"
                                style={{
                                  background: 'rgba(255,255,255,0.04)',
                                  color: DS.text.secondary,
                                }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                          <div
                            className="p-2 rounded"
                            style={{
                              background: 'rgba(16,185,129,0.05)',
                              border: '1px solid rgba(16,185,129,0.15)',
                            }}
                          >
                            <div
                              className="text-[8px] uppercase tracking-widest mb-0.5"
                              style={{ color: '#10b981' }}
                            >
                              Recommended Action
                            </div>
                            <p className="text-[10px]" style={{ color: DS.text.secondary }}>
                              {p.recommendation}
                            </p>
                          </div>
                          <div className="mt-2 text-[9px]" style={{ color: DS.text.muted }}>
                            {p.affected} devices affected
                          </div>
                        </div>
                        <button
                          className="px-2.5 py-1.5 rounded text-[9px] font-medium shrink-0"
                          style={{
                            background: `${GOLD}08`,
                            border: `1px solid ${GOLD}25`,
                            color: GOLD,
                          }}
                        >
                          Deploy Fix
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
