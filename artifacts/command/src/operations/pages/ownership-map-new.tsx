import {
  APPROVALS,
  formatCurrency,
  getStateColor,
  WORKFLOWS,
} from '@szl-holdings/shared-ui/core-observability-data';
import { AlertTriangle, ArrowRight, User, Users } from 'lucide-react';

interface OwnerRecord {
  name: string;
  team: string;
  workflows: number;
  approvals: number;
  gaps: number;
  value_at_risk: number;
  status: 'overloaded' | 'gap' | 'normal';
}

const OWNER_DATA: OwnerRecord[] = [
  {
    name: 'Unassigned',
    team: 'Procurement',
    workflows: 1,
    approvals: 1,
    gaps: 1,
    value_at_risk: 320000,
    status: 'gap',
  },
  {
    name: 'Jordan Alvarez',
    team: 'Revenue Operations',
    workflows: 1,
    approvals: 1,
    gaps: 0,
    value_at_risk: 840000,
    status: 'overloaded',
  },
  {
    name: 'Priya Mehta',
    team: 'Finance',
    workflows: 1,
    approvals: 1,
    gaps: 0,
    value_at_risk: 450000,
    status: 'normal',
  },
  {
    name: 'Marcus Webb',
    team: 'Customer Success',
    workflows: 1,
    approvals: 1,
    gaps: 0,
    value_at_risk: 480000,
    status: 'overloaded',
  },
  {
    name: 'Thomas Nguyen',
    team: 'Legal',
    workflows: 1,
    approvals: 1,
    gaps: 0,
    value_at_risk: 2100000,
    status: 'overloaded',
  },
  {
    name: 'Elena Santos',
    team: 'Product',
    workflows: 1,
    approvals: 0,
    gaps: 0,
    value_at_risk: 0,
    status: 'normal',
  },
];

export default function OwnershipMap() {
  const gaps = OWNER_DATA.filter((o) => o.status === 'gap');
  const overloaded = OWNER_DATA.filter((o) => o.status === 'overloaded');
  const normal = OWNER_DATA.filter((o) => o.status === 'normal');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-4 h-4" style={{ color: '#d4a054' }} />
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: '#d4a054' }}
          >
            Lyte · Ownership Map
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">Ownership Map</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Who owns each workflow step, missing ownership, broken handoffs, and overloaded teams.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Ownership Gaps', value: gaps.length, color: '#c45a4a' },
          { label: 'Overloaded Owners', value: overloaded.length, color: '#c8953c' },
          { label: 'Total Owners', value: OWNER_DATA.length - gaps.length, color: '#6b8f71' },
          {
            label: 'Value in Gap Workflows',
            value: formatCurrency(gaps.reduce((s, o) => s + o.value_at_risk, 0)),
            color: '#d4a054',
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border p-4"
            style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
          >
            <div
              className="text-[10px] font-medium mb-2"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {c.label}
            </div>
            <div className="text-2xl font-bold" style={{ color: c.color }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl border"
        style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <span className="text-sm font-semibold text-white">
            Ownership Status — All Active Workflows
          </span>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {[...gaps, ...overloaded, ...normal].map((owner) => (
            <div key={owner.name} className="px-5 py-4 flex items-center gap-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                style={{
                  background:
                    owner.status === 'gap'
                      ? 'rgba(196,90,74,0.15)'
                      : owner.status === 'overloaded'
                        ? 'rgba(249,115,22,0.15)'
                        : 'rgba(255,255,255,0.05)',
                  color:
                    owner.status === 'gap'
                      ? '#c45a4a'
                      : owner.status === 'overloaded'
                        ? '#c8953c'
                        : 'rgba(255,255,255,0.6)',
                  border: `1px solid ${owner.status === 'gap' ? 'rgba(196,90,74,0.3)' : owner.status === 'overloaded' ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                {owner.name === 'Unassigned'
                  ? '?'
                  : owner.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-white">{owner.name}</span>
                  {owner.status === 'gap' && (
                    <span
                      className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                      style={{
                        color: '#c45a4a',
                        background: 'rgba(196,90,74,0.12)',
                        border: '1px solid rgba(196,90,74,0.25)',
                      }}
                    >
                      GAP
                    </span>
                  )}
                  {owner.status === 'overloaded' && (
                    <span
                      className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                      style={{
                        color: '#c8953c',
                        background: 'rgba(249,115,22,0.12)',
                        border: '1px solid rgba(249,115,22,0.25)',
                      }}
                    >
                      OVERLOADED
                    </span>
                  )}
                </div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {owner.team} · {owner.workflows} workflow{owner.workflows !== 1 ? 's' : ''} ·{' '}
                  {owner.approvals} approval{owner.approvals !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {owner.value_at_risk > 0 && (
                  <div className="text-right">
                    <div className="text-sm font-semibold" style={{ color: '#d4a054' }}>
                      {formatCurrency(owner.value_at_risk)}
                    </div>
                    <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      value at risk
                    </div>
                  </div>
                )}
                {owner.status === 'gap' && (
                  <button
                    className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-1"
                    style={{
                      color: '#d4a054',
                      background: 'rgba(212,160,84,0.1)',
                      border: '1px solid rgba(212,160,84,0.2)',
                    }}
                  >
                    <User className="w-3 h-3" /> Assign Owner
                  </button>
                )}
                {owner.status === 'overloaded' && (
                  <button
                    className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
                    style={{
                      color: 'rgba(255,255,255,0.5)',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    Reassign
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-xl border"
        style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" style={{ color: '#c45a4a' }} />
            <span className="text-sm font-semibold text-white">
              Broken Handoffs — Steps Without Owner
            </span>
          </div>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {WORKFLOWS.filter((w) => !w.owner || w.blocked_step).map((w) => (
            <div key={w.id} className="px-5 py-3 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate">{w.name}</div>
                <div
                  className="text-[10px] mt-0.5 flex items-center gap-3"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  {!w.owner && <span style={{ color: '#c45a4a' }}>No owner assigned</span>}
                  {w.blocked_step && <span style={{ color: '#c8953c' }}>↳ {w.blocked_step}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {w.value_at_risk > 0 && (
                  <span className="text-[10px] font-medium" style={{ color: '#d4a054' }}>
                    {formatCurrency(w.value_at_risk)}
                  </span>
                )}
                <button
                  className="text-[10px] px-2.5 py-1 rounded font-medium transition-all hover:opacity-80 flex items-center gap-1"
                  style={{
                    color: '#d4a054',
                    background: 'rgba(212,160,84,0.1)',
                    border: '1px solid rgba(212,160,84,0.2)',
                  }}
                >
                  Assign <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
