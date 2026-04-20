import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, m } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Circle,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  Plus,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const API = '/api';

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
    ...opts,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  return (json.data ?? json) as T;
}

interface LenderPacket {
  id: number;
  title: string;
  lenderType: string;
  status: string;
  completionPct: number;
  targetSubmitDate?: string;
  notes?: string;
  deliverables?: Deliverable[];
}
interface InvestorPacket {
  id: number;
  title: string;
  investorType: string;
  status: string;
  completionPct: number;
  targetCloseDate?: string;
  notes?: string;
  deliverables?: Deliverable[];
}
interface Deliverable {
  id: number;
  deliverableKey: string;
  title: string;
  description?: string;
  status: string;
  version: number;
  content?: string;
}
interface DiligenceChecklist {
  id: number;
  title: string;
  checklistType: string;
  completionPct: number;
  status: string;
  items?: DiligenceItem[];
}
interface DiligenceItem {
  id: number;
  title: string;
  category?: string;
  isRequired: boolean;
  status: string;
  artifactUrl?: string;
  notes?: string;
}
interface CapDashboard {
  bankReadiness: number;
  angelReadiness: number;
  lenderPacketCount: number;
  investorPacketCount: number;
  activeLenderPacket?: LenderPacket;
  activeInvestorPacket?: InvestorPacket;
  milestonesTotal: number;
  milestonesCompleted: number;
  milestonesInProgress: number;
  financialModelCount: number;
  checklistCount: number;
}

function ReadinessMeter({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <span className="text-sm font-semibold" style={{ color }}>
          {value}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

function DeliverableRow({
  item,
  endpoint,
  qk,
}: {
  item: Deliverable;
  endpoint: string;
  qk: (string | number)[];
}) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(item.content ?? '');

  const statusColors: Record<string, string> = {
    not_started: '#6b7280',
    drafting: '#f59e0b',
    draft_complete: '#3b82f6',
    reviewed: '#8b5cf6',
    final: '#10b981',
  };

  const mut = useStandardMutation({
    mutationFn: (update: Partial<Deliverable>) =>
      apiFetch(`${endpoint}/${item.id}`, { method: 'PATCH', body: JSON.stringify(update) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk }),
  });

  const STATUS_OPTIONS = ['not_started', 'drafting', 'draft_complete', 'reviewed', 'final'];
  const color = statusColors[item.status] ?? '#6b7280';

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{item.title}</p>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
          )}
        </div>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded shrink-0"
          style={{ background: `${color}18`, color }}
        >
          {item.status.replace(/_/g, ' ')}
        </span>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 bg-muted/10 border-t border-border">
              <div className="flex items-center gap-2 pt-3">
                <span className="text-xs text-muted-foreground">Status:</span>
                <select
                  value={item.status}
                  onChange={(e) => mut.mutate({ status: e.target.value })}
                  className="text-xs bg-card border border-border rounded px-2 py-1 text-foreground"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                {mut.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Draft notes / content</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={() => {
                    if (notes !== item.content) mut.mutate({ content: notes });
                  }}
                  rows={3}
                  className="w-full mt-1 text-xs bg-card border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
                  placeholder="Add draft notes or content..."
                />
              </div>
              <p className="text-xs text-muted-foreground">Version {item.version}</p>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PacketBuilder({
  packet,
  endpoint,
  deliverableEndpoint,
  queryKey,
}: {
  packet: LenderPacket | InvestorPacket;
  endpoint: string;
  deliverableEndpoint: string;
  queryKey: (string | number)[];
}) {
  const { data: detail, isLoading } = useStandardQuery<LenderPacket & InvestorPacket>({
    queryKey: [...queryKey, packet.id],
    queryFn: () => apiFetch(`${endpoint}/${packet.id}`),
  });
  const qc = useQueryClient();

  const statusColors: Record<string, string> = {
    drafting: '#f59e0b',
    ready_for_review: '#3b82f6',
    submitted: '#6366f1',
    in_diligence: '#8b5cf6',
    approved: '#10b981',
    in_outreach: '#06b6d4',
    in_progress: '#06b6d4',
    closed: '#10b981',
    declined: '#ef4444',
    archived: '#6b7280',
  };
  const color = statusColors[packet.status] ?? '#6b7280';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{packet.title}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-xs font-mono px-1.5 py-0.5 rounded"
              style={{ background: `${color}18`, color }}
            >
              {packet.status.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-muted-foreground">{packet.completionPct}% complete</span>
          </div>
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${packet.completionPct}%` }}
          transition={{ duration: 0.7 }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>

      {packet.notes && (
        <p className="text-xs text-muted-foreground bg-muted/30 border border-border rounded-lg px-3 py-2">
          {packet.notes}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Loading deliverables...</span>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Deliverables
          </p>
          {(detail?.deliverables ?? []).map((d) => (
            <DeliverableRow
              key={d.id}
              item={d}
              endpoint={deliverableEndpoint}
              qk={[...queryKey, packet.id]}
            />
          ))}
          {(!detail?.deliverables || detail.deliverables.length === 0) && (
            <p className="text-xs text-muted-foreground py-3 text-center">No deliverables found.</p>
          )}
        </div>
      )}
    </div>
  );
}

function ChecklistPanel({ checklist }: { checklist: DiligenceChecklist }) {
  const qc = useQueryClient();
  const { data: detail, isLoading } = useStandardQuery<
    DiligenceChecklist & { items: DiligenceItem[] }
  >({
    queryKey: ['diligence-detail', checklist.id],
    queryFn: () => apiFetch(`/capital/diligence-checklists/${checklist.id}`),
  });

  const mut = useStandardMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiFetch(`/capital/diligence-checklist-items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['diligence-detail', checklist.id] }),
  });

  const statusIcon = (s: string) => {
    if (s === 'complete') return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
    if (s === 'in_progress') return <Clock className="w-4 h-4 text-amber-500 shrink-0" />;
    if (s === 'waived' || s === 'na')
      return <Circle className="w-4 h-4 text-muted-foreground shrink-0" />;
    return <Circle className="w-4 h-4 text-border shrink-0" />;
  };

  const categories = [...new Set((detail?.items ?? []).map((i) => i.category ?? 'Other'))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{checklist.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {checklist.completionPct}% complete
          </p>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/8 text-primary">
          {checklist.checklistType}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-3">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Loading items...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {cat}
              </p>
              <div className="space-y-1.5">
                {(detail?.items ?? [])
                  .filter((i) => (i.category ?? 'Other') === cat)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border"
                    >
                      <button
                        onClick={() => {
                          const next =
                            item.status === 'not_started'
                              ? 'in_progress'
                              : item.status === 'in_progress'
                                ? 'complete'
                                : 'not_started';
                          mut.mutate({ id: item.id, status: next });
                        }}
                      >
                        {statusIcon(item.status)}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-xs font-medium',
                            item.status === 'complete'
                              ? 'line-through text-muted-foreground'
                              : 'text-foreground',
                          )}
                        >
                          {item.title}
                        </p>
                      </div>
                      {item.isRequired && (
                        <span className="text-[10px] text-muted-foreground shrink-0">Required</span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type CapTab = 'dashboard' | 'lender' | 'investor' | 'diligence' | 'cap-table';

export function CapitalReadinessOS() {
  const [activeTab, setActiveTab] = useState<CapTab>('dashboard');
  const [activeLenderId, setActiveLenderId] = useState<number | null>(null);
  const [activeInvestorId, setActiveInvestorId] = useState<number | null>(null);

  const { data: dashboard, isLoading: dashLoading } = useStandardQuery<CapDashboard>({
    queryKey: ['capital-dashboard'],
    queryFn: () => apiFetch('/capital/dashboard'),
  });

  const { data: lenderPackets = [] } = useStandardQuery<LenderPacket[]>({
    queryKey: ['lender-packets'],
    queryFn: () => apiFetch('/capital/lender-packets'),
    enabled: activeTab === 'lender',
  });

  const { data: investorPackets = [] } = useStandardQuery<InvestorPacket[]>({
    queryKey: ['investor-packets'],
    queryFn: () => apiFetch('/capital/investor-packets'),
    enabled: activeTab === 'investor',
  });

  const { data: checklists = [] } = useStandardQuery<DiligenceChecklist[]>({
    queryKey: ['diligence-checklists'],
    queryFn: () => apiFetch('/capital/diligence-checklists'),
    enabled: activeTab === 'diligence',
  });

  const TABS: { id: CapTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'lender', label: 'Lender Packets', icon: Building2 },
    { id: 'investor', label: 'Investor Packets', icon: Briefcase },
    { id: 'diligence', label: 'Diligence', icon: CheckSquare },
    { id: 'cap-table', label: 'Cap Table', icon: Users },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Capital Readiness OS
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Bank-ready, angel-ready, and investor-ready structure. Internal only — no legal or
          financial conclusions.
        </p>
      </div>

      <div className="flex gap-1 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground',
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-5">
          {dashLoading ? (
            <div className="flex items-center gap-2 py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading dashboard...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <ReadinessMeter
                    value={dashboard?.bankReadiness ?? 0}
                    label="Bank / SBA Readiness"
                    color="#3b82f6"
                  />
                  <ReadinessMeter
                    value={dashboard?.angelReadiness ?? 0}
                    label="Angel / Investor Readiness"
                    color="#10b981"
                  />
                </div>
                <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-2 gap-3">
                  {[
                    {
                      label: 'Lender Packets',
                      value: dashboard?.lenderPacketCount ?? 0,
                      color: '#3b82f6',
                    },
                    {
                      label: 'Investor Packets',
                      value: dashboard?.investorPacketCount ?? 0,
                      color: '#10b981',
                    },
                    {
                      label: 'Milestones',
                      value: `${dashboard?.milestonesCompleted ?? 0}/${dashboard?.milestonesTotal ?? 0}`,
                      color: '#f59e0b',
                    },
                    {
                      label: 'Checklists',
                      value: dashboard?.checklistCount ?? 0,
                      color: '#8b5cf6',
                    },
                  ].map((m) => (
                    <div key={m.label} className="text-center">
                      <p className="text-xl font-bold" style={{ color: m.color }}>
                        {m.value}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {dashboard?.activeLenderPacket && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Active Lender Packet
                    </p>
                    <button
                      onClick={() => setActiveTab('lender')}
                      className="text-xs text-primary flex items-center gap-1"
                    >
                      Open <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {dashboard.activeLenderPacket.title}
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${dashboard.activeLenderPacket.completionPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dashboard.activeLenderPacket.completionPct}% complete
                  </p>
                </div>
              )}

              {dashboard?.activeInvestorPacket && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Active Investor Packet
                    </p>
                    <button
                      onClick={() => setActiveTab('investor')}
                      className="text-xs text-primary flex items-center gap-1"
                    >
                      Open <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {dashboard.activeInvestorPacket.title}
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${dashboard.activeInvestorPacket.completionPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dashboard.activeInvestorPacket.completionPct}% complete
                  </p>
                </div>
              )}

              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-600">Internal Use Only</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      This module is for readiness preparation and structure only. It does not
                      constitute financial, legal, or investment advice. All materials should be
                      reviewed by qualified counsel before external use.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'lender' && (
        <div className="space-y-4">
          {lenderPackets.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No lender packets found.
            </div>
          ) : activeLenderId ? (
            <div className="space-y-4">
              <button
                onClick={() => setActiveLenderId(null)}
                className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
              >
                ← Back to all packets
              </button>
              {(() => {
                const p = lenderPackets.find((p) => p.id === activeLenderId);
                return p ? (
                  <PacketBuilder
                    packet={p}
                    endpoint="/capital/lender-packets"
                    deliverableEndpoint="/capital/lender-deliverables"
                    queryKey={['lender-packet-detail']}
                  />
                ) : null;
              })()}
            </div>
          ) : (
            <div className="space-y-3">
              {lenderPackets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveLenderId(p.id)}
                  className="w-full flex items-center gap-4 p-4 bg-card border border-border rounded-xl text-left hover:bg-muted/30 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.lenderType.toUpperCase()} · {p.completionPct}% complete
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'investor' && (
        <div className="space-y-4">
          {investorPackets.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No investor packets found.
            </div>
          ) : activeInvestorId ? (
            <div className="space-y-4">
              <button
                onClick={() => setActiveInvestorId(null)}
                className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
              >
                ← Back to all packets
              </button>
              {(() => {
                const p = investorPackets.find((p) => p.id === activeInvestorId);
                return p ? (
                  <PacketBuilder
                    packet={p}
                    endpoint="/capital/investor-packets"
                    deliverableEndpoint="/capital/investor-deliverables"
                    queryKey={['investor-packet-detail']}
                  />
                ) : null;
              })()}
            </div>
          ) : (
            <div className="space-y-3">
              {investorPackets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveInvestorId(p.id)}
                  className="w-full flex items-center gap-4 p-4 bg-card border border-border rounded-xl text-left hover:bg-muted/30 transition-colors"
                >
                  <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.investorType} · {p.completionPct}% complete
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'diligence' && (
        <div className="space-y-4">
          {checklists.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No checklists found.
            </div>
          ) : (
            checklists.map((c) => (
              <div key={c.id} className="bg-card border border-border rounded-xl p-4">
                <ChecklistPanel checklist={c} />
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'cap-table' && <CapTablePanel />}
    </div>
  );
}

interface CapTableEntry {
  id: number;
  holderName: string;
  holderType: string;
  shareClass: string;
  sharesPlaceholder?: string;
  ownershipPct?: string;
  vestingSchedule?: string;
  notes?: string;
}

function CapTablePanel() {
  const qc = useQueryClient();
  const { data: entries = [], isLoading } = useStandardQuery<CapTableEntry[]>({
    queryKey: ['cap-table'],
    queryFn: () => apiFetch('/capital/cap-table'),
  });

  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({
    holderName: '',
    holderType: 'founder',
    shareClass: 'Common',
    ownershipPct: '',
  });

  const addMut = useStandardMutation({
    mutationFn: (data: typeof newEntry) =>
      apiFetch('/capital/cap-table', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cap-table'] });
      setShowAdd(false);
      setNewEntry({
        holderName: '',
        holderType: 'founder',
        shareClass: 'Common',
        ownershipPct: '',
      });
    },
  });

  const typeColors: Record<string, string> = {
    founder: '#c9a96e',
    employee: '#3b82f6',
    advisor: '#8b5cf6',
    investor: '#10b981',
    option_pool: '#f59e0b',
    other: '#6b7280',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Cap Table Placeholder</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Structural ownership placeholder — not a legal cap table
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Entry
        </button>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
        <p className="text-xs text-amber-600">
          This is a structural placeholder only. Consult qualified legal counsel before sharing
          ownership information externally.
        </p>
      </div>

      {showAdd && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-foreground">New Entry</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'holderName', label: 'Holder Name', type: 'text' },
              { key: 'ownershipPct', label: 'Ownership %', type: 'text' },
              { key: 'shareClass', label: 'Share Class', type: 'text' },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground">{f.label}</label>
                <input
                  type={f.type}
                  value={(newEntry as Record<string, string>)[f.key]}
                  onChange={(e) => setNewEntry((n) => ({ ...n, [f.key]: e.target.value }))}
                  className="w-full mt-1 text-xs bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-muted-foreground">Holder Type</label>
              <select
                value={newEntry.holderType}
                onChange={(e) => setNewEntry((n) => ({ ...n, holderType: e.target.value }))}
                className="w-full mt-1 text-xs bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              >
                {['founder', 'employee', 'advisor', 'investor', 'option_pool', 'other'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => addMut.mutate(newEntry)}
              disabled={!newEntry.holderName || addMut.isPending}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {addMut.isPending ? 'Saving...' : 'Add'}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Loading...</span>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border/60">
          {entries.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No cap table entries yet. Add holders to structure placeholder ownership.
            </div>
          ) : (
            entries.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: typeColors[e.holderType] ?? '#6b7280' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{e.holderName}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.holderType} · {e.shareClass}
                  </p>
                </div>
                {e.ownershipPct && (
                  <span
                    className="text-sm font-semibold"
                    style={{ color: typeColors[e.holderType] ?? '#6b7280' }}
                  >
                    {e.ownershipPct}%
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
