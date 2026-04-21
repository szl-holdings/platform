import {
  APPROVALS,
  formatCurrency,
  getStateColor,
  WORKFLOWS,
} from '@szl-holdings/shared-ui/core-observability-data';
import { AlertTriangle, ArrowRight, Check, FlaskConical, User, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface OwnerRecord {
  /** Stable identifier — always the original SEED_OWNER_DATA name. Used as the override key. */
  seedKey: string;
  /** Display name — may differ from seedKey after an assignment override is applied. */
  name: string;
  team: string;
  workflows: number;
  approvals: number;
  gaps: number;
  value_at_risk: number;
  status: 'overloaded' | 'gap' | 'normal';
}

const SEED_OWNER_DATA: OwnerRecord[] = [
  {
    seedKey: 'Unassigned',
    name: 'Unassigned',
    team: 'Procurement',
    workflows: 1,
    approvals: 1,
    gaps: 1,
    value_at_risk: 320000,
    status: 'gap',
  },
  {
    seedKey: 'Jordan Alvarez',
    name: 'Jordan Alvarez',
    team: 'Revenue Operations',
    workflows: 1,
    approvals: 1,
    gaps: 0,
    value_at_risk: 840000,
    status: 'overloaded',
  },
  {
    seedKey: 'Priya Mehta',
    name: 'Priya Mehta',
    team: 'Finance',
    workflows: 1,
    approvals: 1,
    gaps: 0,
    value_at_risk: 450000,
    status: 'normal',
  },
  {
    seedKey: 'Marcus Webb',
    name: 'Marcus Webb',
    team: 'Customer Success',
    workflows: 1,
    approvals: 1,
    gaps: 0,
    value_at_risk: 480000,
    status: 'overloaded',
  },
  {
    seedKey: 'Thomas Nguyen',
    name: 'Thomas Nguyen',
    team: 'Legal',
    workflows: 1,
    approvals: 1,
    gaps: 0,
    value_at_risk: 2100000,
    status: 'overloaded',
  },
  {
    seedKey: 'Elena Santos',
    name: 'Elena Santos',
    team: 'Product',
    workflows: 1,
    approvals: 0,
    gaps: 0,
    value_at_risk: 0,
    status: 'normal',
  },
];

const STORAGE_KEY = 'cmd:ownership-map:overrides';

interface OwnerOverride {
  assignedTo: string;
  assignedAt: string;
  signedOff: boolean;
  signedOffAt?: string;
  signedOffBy?: string;
}

function loadOverrides(): Record<string, OwnerOverride> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, OwnerOverride>) : {};
  } catch {
    return {};
  }
}

function saveOverrides(overrides: Record<string, OwnerOverride>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    /* ignore */
  }
}

interface AssignModalProps {
  workflowName: string;
  currentOwner: string;
  onAssign: (owner: string) => void;
  onClose: () => void;
}

function AssignModal({ workflowName, currentOwner, onAssign, onClose }: AssignModalProps) {
  const [name, setName] = useState(currentOwner === 'Unassigned' ? '' : currentOwner);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        style={{ background: '#0d1520', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-white">Assign Owner</div>
            <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {workflowName}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
            aria-label="Close"
          >
            <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label
              className="block text-[10px] font-medium mb-1.5"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Owner Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) onAssign(name.trim());
                if (e.key === 'Escape') onClose();
              }}
              placeholder="e.g. Alex Kim"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#c8d8e8',
              }}
            />
          </div>

          <button
            onClick={() => name.trim() && onAssign(name.trim())}
            disabled={!name.trim()}
            className="w-full py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: name.trim() ? '#d4a054' : 'rgba(212,160,84,0.15)',
              color: name.trim() ? '#060b12' : 'rgba(212,160,84,0.4)',
              cursor: name.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Assign Owner
          </button>
        </div>

        <p className="text-[9px] mt-3 text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Assignment is persisted locally (demo mode)
        </p>
      </div>
    </div>
  );
}

export default function OwnershipMap() {
  const [overrides, setOverrides] = useState<Record<string, OwnerOverride>>(loadOverrides);
  const [assignTarget, setAssignTarget] = useState<{ name: string; owner: string } | null>(null);

  const ownerData: OwnerRecord[] = SEED_OWNER_DATA.map((o) => {
    const ov = overrides[o.seedKey];
    if (ov && o.status === 'gap') {
      return {
        ...o,
        name: ov.assignedTo,
        status: 'normal' as const,
        gaps: 0,
      };
    }
    return o;
  });

  const gaps = ownerData.filter((o) => o.status === 'gap');
  const overloaded = ownerData.filter((o) => o.status === 'overloaded');
  const normal = ownerData.filter((o) => o.status === 'normal');

  function handleAssign(workflowName: string, ownerName: string) {
    const updated = {
      ...overrides,
      [workflowName]: {
        assignedTo: ownerName,
        assignedAt: new Date().toISOString(),
        signedOff: false,
      },
    };
    setOverrides(updated);
    saveOverrides(updated);
    setAssignTarget(null);
  }

  function handleSignOff(seedKey: string) {
    const current = overrides[seedKey];
    if (!current) return;
    const updated = {
      ...overrides,
      [seedKey]: {
        ...current,
        signedOff: true,
        signedOffAt: new Date().toISOString(),
        signedOffBy: 'Current User',
      },
    };
    setOverrides(updated);
    saveOverrides(updated);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-4 h-4" style={{ color: '#d4a054' }} />
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: '#d4a054' }}
          >
            Command · Ownership Map
          </span>
          <span
            className="inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ml-1"
            style={{
              color: 'rgba(255,255,255,0.45)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <FlaskConical className="w-2.5 h-2.5" />
            Demo
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">Ownership Map</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Who owns each workflow step, missing ownership, broken handoffs, and overloaded teams.
          Assignments persist locally.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Ownership Gaps', value: gaps.length, color: '#c45a4a' },
          { label: 'Overloaded Owners', value: overloaded.length, color: '#c8953c' },
          { label: 'Total Owners', value: ownerData.length - gaps.length, color: '#6b8f71' },
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
          {[...gaps, ...overloaded, ...normal].map((owner) => {
            const ov = overrides[owner.seedKey];
            const isSignedOff = ov?.signedOff ?? false;
            return (
              <div key={owner.seedKey} className="px-5 py-4 flex items-center gap-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                  style={{
                    background:
                      owner.status === 'gap'
                        ? 'rgba(196,90,74,0.15)'
                        : owner.status === 'overloaded'
                          ? 'rgba(249,115,22,0.15)'
                          : isSignedOff
                            ? 'rgba(34,197,94,0.12)'
                            : 'rgba(255,255,255,0.05)',
                    color:
                      owner.status === 'gap'
                        ? '#c45a4a'
                        : owner.status === 'overloaded'
                          ? '#c8953c'
                          : isSignedOff
                            ? '#22c55e'
                            : 'rgba(255,255,255,0.6)',
                    border: `1px solid ${owner.status === 'gap' ? 'rgba(196,90,74,0.3)' : owner.status === 'overloaded' ? 'rgba(249,115,22,0.3)' : isSignedOff ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.1)'}`,
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
                    {isSignedOff && (
                      <span
                        className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex items-center gap-1"
                        style={{
                          color: '#22c55e',
                          background: 'rgba(34,197,94,0.1)',
                          border: '1px solid rgba(34,197,94,0.25)',
                        }}
                      >
                        <Check className="w-2.5 h-2.5" />
                        Signed Off
                      </span>
                    )}
                  </div>
                  <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {owner.team} · {owner.workflows} workflow{owner.workflows !== 1 ? 's' : ''} ·{' '}
                    {owner.approvals} approval{owner.approvals !== 1 ? 's' : ''}
                    {ov?.assignedAt && !isSignedOff && (
                      <span style={{ color: '#d4a054' }}>
                        {' '}
                        · Assigned {new Date(ov.assignedAt).toLocaleDateString()}
                      </span>
                    )}
                    {isSignedOff && ov?.signedOffAt && (
                      <span style={{ color: '#22c55e' }}>
                        {' '}
                        · Signed off {new Date(ov.signedOffAt).toLocaleDateString()}
                      </span>
                    )}
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
                      onClick={() => setAssignTarget({ name: owner.name, owner: owner.name })}
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
                      onClick={() => setAssignTarget({ name: owner.seedKey, owner: owner.name })}
                      className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
                      title="Reassign notes are persisted locally (demo mode only)"
                      style={{
                        color: 'rgba(255,255,255,0.5)',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      Reassign
                    </button>
                  )}
                  {owner.status === 'normal' && !isSignedOff && ov && (
                    <button
                      onClick={() => handleSignOff(owner.seedKey)}
                      className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-1"
                      style={{
                        color: '#22c55e',
                        background: 'rgba(34,197,94,0.08)',
                        border: '1px solid rgba(34,197,94,0.2)',
                      }}
                    >
                      <Check className="w-3 h-3" /> Sign Off
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
          {WORKFLOWS.filter((w) => !w.owner || w.blocked_step).length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Check className="w-5 h-5 mx-auto mb-2" style={{ color: '#22c55e' }} />
              <div className="text-sm font-medium text-white">No broken handoffs</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                All workflow steps have owners assigned
              </div>
            </div>
          ) : (
            WORKFLOWS.filter((w) => !w.owner || w.blocked_step).map((w) => {
              const ov = overrides[w.id];
              return (
                <div key={w.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{w.name}</div>
                    <div
                      className="text-[10px] mt-0.5 flex items-center gap-3"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      {!w.owner && !ov ? (
                        <span style={{ color: '#c45a4a' }}>No owner assigned</span>
                      ) : ov ? (
                        <span style={{ color: '#22c55e' }}>Assigned to {ov.assignedTo}</span>
                      ) : null}
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
                      onClick={() => setAssignTarget({ name: w.id, owner: w.owner ?? 'Unassigned' })}
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
              );
            })
          )}
        </div>
      </div>

      {assignTarget && (
        <AssignModal
          workflowName={assignTarget.name}
          currentOwner={assignTarget.owner}
          onAssign={(owner) => handleAssign(assignTarget.name, owner)}
          onClose={() => setAssignTarget(null)}
        />
      )}
    </div>
  );
}
