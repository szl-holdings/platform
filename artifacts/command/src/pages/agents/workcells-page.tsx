import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  Layers,
  Filter,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  PlayCircle,
  FileCheck,
  ShieldCheck,
  Eye,
  GitBranch,
} from 'lucide-react';
import { DEMO_WORKCELLS, type WorkcellStatus, type Workcell } from '@szl/a11oy-runtime';

const STATUS_CONFIG: Record<
  WorkcellStatus,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  intake: { label: 'Intake', color: '#64748b', icon: Eye },
  planning: { label: 'Planning', color: '#8b7ac8', icon: GitBranch },
  context_building: { label: 'Context Building', color: '#4d8fcc', icon: Layers },
  risk_review: { label: 'Risk Review', color: '#d4a054', icon: AlertTriangle },
  action_brief_created: { label: 'Brief Created', color: '#8b7ac8', icon: FileCheck },
  approval_required: { label: 'Approval Required', color: '#f59e0b', icon: Clock },
  approved: { label: 'Approved', color: '#22c55e', icon: CheckCircle2 },
  executing: { label: 'Executing', color: '#4d8fcc', icon: PlayCircle },
  verifying: { label: 'Verifying', color: '#8b7ac8', icon: ShieldCheck },
  proven: { label: 'Proven', color: '#22c55e', icon: ShieldCheck },
  blocked: { label: 'Blocked', color: '#ef4444', icon: XCircle },
  rejected: { label: 'Rejected', color: '#ef4444', icon: XCircle },
  archived: { label: 'Archived', color: '#475569', icon: Eye },
};

const PRIORITY_COLOR = { low: '#64748b', medium: '#4d8fcc', high: '#d4a054', critical: '#ef4444' };

export function WorkcellsPage() {
  const [, navigate] = useLocation();
  const [filterStatus, setFilterStatus] = useState<WorkcellStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const filtered = DEMO_WORKCELLS.filter((w) => {
    if (filterStatus !== 'all' && w.status !== filterStatus) return false;
    if (filterPriority !== 'all' && w.priority !== filterPriority) return false;
    return true;
  });

  const statusCounts = DEMO_WORKCELLS.reduce(
    (acc, w) => {
      acc[w.status] = (acc[w.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div
      style={{
        background: '#080c14',
        minHeight: '100vh',
        color: '#e2e8f0',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid #1e293b',
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: 'rgba(139,122,200,0.15)',
              border: '1px solid rgba(139,122,200,0.3)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Layers size={18} color="#8b7ac8" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>Workcells</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>12 demo workcells — A11oy Phase 2</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Filter size={14} color="#64748b" style={{ marginTop: 8 }} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as WorkcellStatus | 'all')}
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: '6px 10px',
              color: '#94a3b8',
              fontSize: 12,
            }}
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
                {statusCounts[k] ? ` (${statusCounts[k]})` : ''}
              </option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: '6px 10px',
              color: '#94a3b8',
              fontSize: 12,
            }}
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Status Summary */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '12px 32px',
          borderBottom: '1px solid #1e293b',
          overflowX: 'auto',
        }}
      >
        {[
          { status: 'proven', count: statusCounts['proven'] ?? 0 },
          { status: 'executing', count: statusCounts['executing'] ?? 0 },
          { status: 'approval_required', count: statusCounts['approval_required'] ?? 0 },
          { status: 'blocked', count: statusCounts['blocked'] ?? 0 },
          { status: 'planning', count: statusCounts['planning'] ?? 0 },
          { status: 'action_brief_created', count: statusCounts['action_brief_created'] ?? 0 },
        ].map(({ status, count }) => {
          const cfg = STATUS_CONFIG[status as WorkcellStatus];
          return (
            <button
              key={status}
              onClick={() =>
                setFilterStatus(filterStatus === status ? 'all' : (status as WorkcellStatus))
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                background: filterStatus === status ? `${cfg.color}18` : 'transparent',
                border: `1px solid ${filterStatus === status ? cfg.color + '40' : '#1e293b'}`,
                borderRadius: 20,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <cfg.icon size={10} color={cfg.color} />
              <span style={{ fontSize: 11, color: cfg.color }}>{cfg.label}</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Workcell List */}
      <div style={{ padding: '16px 32px' }}>
        <div style={{ display: 'grid', gap: 8 }}>
          {filtered.map((wc) => {
            const statusCfg = STATUS_CONFIG[wc.status];
            return (
              <div
                key={wc.id}
                onClick={() => navigate(`/agents/workcells/${wc.id}`)}
                style={{
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 10,
                  padding: '14px 18px',
                  cursor: 'pointer',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto auto auto',
                  alignItems: 'center',
                  gap: 16,
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(139,122,200,0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e293b')}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 3 }}>
                    {wc.title}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 10, color: '#64748b' }}>{wc.vertical}</span>
                    <span style={{ fontSize: 10, color: '#334155' }}>·</span>
                    <span style={{ fontSize: 10, color: '#64748b' }}>{wc.domain}</span>
                    <span style={{ fontSize: 10, color: '#334155' }}>·</span>
                    <span style={{ fontSize: 10, color: '#64748b' }}>
                      {wc.operatorSequence.length} operators
                    </span>
                  </div>
                </div>

                {/* Priority */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: PRIORITY_COLOR[wc.priority],
                    }}
                  />
                  <span
                    style={{ fontSize: 11, color: PRIORITY_COLOR[wc.priority], fontWeight: 600 }}
                  >
                    {wc.priority}
                  </span>
                </div>

                {/* Cost */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    ${wc.totalCostUsd.toFixed(3)}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>cost</div>
                </div>

                {/* Status */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    background: `${statusCfg.color}10`,
                    border: `1px solid ${statusCfg.color}28`,
                    borderRadius: 20,
                    padding: '3px 10px',
                  }}
                >
                  <statusCfg.icon size={10} color={statusCfg.color} />
                  <span style={{ fontSize: 10, color: statusCfg.color, fontWeight: 600 }}>
                    {statusCfg.label}
                  </span>
                </div>

                <ChevronRight size={14} color="#475569" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default WorkcellsPage;
