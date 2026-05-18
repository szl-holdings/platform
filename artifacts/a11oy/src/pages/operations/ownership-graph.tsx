/**
 * Ownership Graph — Cross-team accountability map.
 *
 * Replaces the previous client-only ownership demo. Renders the tenant-scoped
 * ownership graph backed by `/api/a11oy/stubs/ownership-graph` via
 * `useApiData`, with deterministic seed data on the server side.
 */

import type React from 'react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, ArrowRight, GitBranch, Network, ShieldCheck, Users } from 'lucide-react';
import { useApiData } from '../../hooks/useApiData';
import { DataStateBadge } from '../../components/ui/DataStateBadge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { KpiCard } from '../../components/ui/KpiCard';

interface OwnerNode {
  id: string;
  name: string;
  team: string;
  role: 'owner' | 'backup' | 'shadow';
  workflows: number;
  approvals: number;
  gaps: number;
  valueAtRisk: number;
  status: 'overloaded' | 'gap' | 'normal';
  reportsTo: string | null;
}

interface OwnerEdge {
  from: string;
  to: string;
  kind: 'reports-to' | 'backs-up' | 'collaborates';
  weight: number;
}

interface Reassignment {
  workflowKey: string;
  from: string;
  to: string;
  reason: string;
  at: string;
}

interface OwnershipGraphPayload {
  nodes: OwnerNode[];
  edges: OwnerEdge[];
  reassignments: Reassignment[];
  summary: { totalOwners: number; overloaded: number; gaps: number; totalValueAtRisk: number };
}

const STATUS_COLOR: Record<OwnerNode['status'], string> = {
  overloaded: '#f97316',
  gap: '#ef4444',
  normal: '#22c55e',
};

const EDGE_COLOR: Record<OwnerEdge['kind'], string> = {
  'reports-to': '#8b7ac8',
  'backs-up': '#d4a054',
  collaborates: '#4d8fcc',
};

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#e5e7eb', textTransform: 'uppercase' }}>
        {title}
      </div>
      {subtitle && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}

export default function OwnershipGraphPage() {
  const { data, loading, error, source } = useApiData<OwnershipGraphPayload>('/stubs/ownership-graph');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const badgeState = loading ? 'loading' : error ? 'error' : source === 'demo' ? 'demo' : 'live';

  const nodeById = useMemo(() => {
    const map = new Map<string, OwnerNode>();
    data?.nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [data]);

  const selected = selectedId ? nodeById.get(selectedId) ?? null : null;

  async function reassign(node: OwnerNode) {
    const target = data?.nodes.find((n) => n.id !== node.id && n.status === 'normal');
    if (!target) {
      toast.error('No normal-status owner available for reassignment');
      return;
    }
    try {
      const res = await fetch('/api/a11oy/stubs/ownership-graph/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowKey: `${node.id}-workflow`,
          from: node.id,
          to: target.id,
          reason: `Rebalance load from ${node.name} (${node.status}) to ${target.name}`,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(`Queued reassignment: ${node.name} → ${target.name}`);
    } catch (e) {
      toast.error(`Reassignment failed: ${(e as Error).message}`);
    }
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <PageHeader
          breadcrumbs={[{ label: 'Operations' }, { label: 'Ownership Graph' }]}
          title="Ownership Graph"
          description="Who owns which workflow, who backs them up, and where the accountability gaps live."
        />
        <div style={{ paddingTop: 6 }}><DataStateBadge state={badgeState} /></div>
      </div>

      {error && (
        <div style={{ padding: 12, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', borderRadius: 6, margin: '16px 0', fontSize: 13 }}>
          Failed to load ownership graph: {error}
        </div>
      )}

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 20 }}>
            <KpiCard label="Total owners" value={data.summary.totalOwners} />
            <KpiCard label="Overloaded" value={data.summary.overloaded} color="#f97316" />
            <KpiCard label="Coverage gaps" value={data.summary.gaps} color="#ef4444" />
            <KpiCard label="Value at risk" value={formatCurrency(data.summary.totalValueAtRisk)} color="#d4a054" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, marginTop: 24 }}>
            <Card>
              <SectionHeader title="Graph" subtitle={`${data.nodes.length} owners · ${data.edges.length} relationships`} />
              <div style={{ position: 'relative', height: 460, background: 'rgba(255,255,255,0.02)', borderRadius: 8, overflow: 'hidden' }}>
                <svg viewBox="0 0 800 460" style={{ width: '100%', height: '100%' }}>
                  {data.edges.map((e, i) => {
                    const fromIdx = data.nodes.findIndex((n) => n.id === e.from);
                    const toIdx = data.nodes.findIndex((n) => n.id === e.to);
                    if (fromIdx < 0 || toIdx < 0) return null;
                    const cols = 4;
                    const fx = 100 + (fromIdx % cols) * 200;
                    const fy = 80 + Math.floor(fromIdx / cols) * 160;
                    const tx = 100 + (toIdx % cols) * 200;
                    const ty = 80 + Math.floor(toIdx / cols) * 160;
                    return (
                      <line
                        key={i}
                        x1={fx} y1={fy} x2={tx} y2={ty}
                        stroke={EDGE_COLOR[e.kind]}
                        strokeWidth={Math.max(1, e.weight * 2.5)}
                        strokeOpacity={0.55}
                        strokeDasharray={e.kind === 'reports-to' ? undefined : '4 3'}
                      />
                    );
                  })}
                  {data.nodes.map((n, i) => {
                    const cols = 4;
                    const x = 100 + (i % cols) * 200;
                    const y = 80 + Math.floor(i / cols) * 160;
                    const color = STATUS_COLOR[n.status];
                    const isSel = selectedId === n.id;
                    return (
                      <g key={n.id} onClick={() => setSelectedId(n.id)} style={{ cursor: 'pointer' }}>
                        <circle cx={x} cy={y} r={isSel ? 30 : 26} fill={`${color}22`} stroke={color} strokeWidth={isSel ? 2.5 : 1.5} />
                        <text x={x} y={y + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="#e5e7eb">
                          {n.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                        </text>
                        <text x={x} y={y + 46} textAnchor="middle" fontSize={10} fill="#9ca3af">{n.name}</text>
                        <text x={x} y={y + 60} textAnchor="middle" fontSize={9} fill="#6b7280">{n.team}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: '#9ca3af' }}>
                {Object.entries(EDGE_COLOR).map(([kind, c]) => (
                  <span key={kind} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 14, height: 2, background: c, display: 'inline-block' }} />
                    {kind.replace('-', ' ')}
                  </span>
                ))}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                  <Users size={12} style={{ color: '#9ca3af' }} />
                  <Network size={12} style={{ color: '#9ca3af' }} />
                  <ShieldCheck size={12} style={{ color: '#9ca3af' }} />
                  <AlertTriangle size={12} style={{ color: '#9ca3af' }} />
                </span>
              </div>
            </Card>

            <Card>
              <SectionHeader title={selected ? selected.name : 'Owner detail'} subtitle={selected ? selected.team : 'Select a node to inspect'} />
              {selected ? (
                <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
                  <Row label="Role" value={selected.role} />
                  <Row label="Workflows" value={String(selected.workflows)} />
                  <Row label="Pending approvals" value={String(selected.approvals)} />
                  <Row label="Coverage gaps" value={String(selected.gaps)} />
                  <Row label="Value at risk" value={formatCurrency(selected.valueAtRisk)} />
                  <Row
                    label="Status"
                    value={
                      <span style={{ color: STATUS_COLOR[selected.status], fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 }}>
                        {selected.status}
                      </span>
                    }
                  />
                  <button
                    type="button"
                    onClick={() => reassign(selected)}
                    style={{
                      marginTop: 12, padding: '8px 12px', border: '1px solid rgba(139,122,200,0.4)',
                      background: 'rgba(139,122,200,0.12)', color: '#c4b5fd', borderRadius: 4,
                      fontSize: 12, fontWeight: 700, letterSpacing: 0.5, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <GitBranch size={13} /> Rebalance load
                  </button>
                </div>
              ) : (
                <div style={{ color: '#6b7280', fontSize: 13, padding: '20px 0' }}>
                  Click an owner in the graph to see their workload and rebalance options.
                </div>
              )}
            </Card>
          </div>

          {data.reassignments.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Card>
                <SectionHeader title="Recent reassignments" subtitle={`${data.reassignments.length} on file`} />
                <div style={{ display: 'grid', gap: 8 }}>
                  {data.reassignments.slice(0, 6).map((r) => {
                    const from = nodeById.get(r.from);
                    const to = nodeById.get(r.to);
                    return (
                      <div key={r.at + r.workflowKey} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
                        <span style={{ color: '#e5e7eb' }}>{from?.name ?? r.from}</span>
                        <ArrowRight size={14} style={{ color: '#8b7ac8' }} />
                        <span style={{ color: '#e5e7eb' }}>{to?.name ?? r.to}</span>
                        <span style={{ color: '#6b7280', marginLeft: 'auto', fontSize: 11 }}>{new Date(r.at).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
      <span style={{ color: '#9ca3af', fontSize: 12 }}>{label}</span>
      <span style={{ color: '#e5e7eb' }}>{value}</span>
    </div>
  );
}
