import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Layout } from '../../../components/layout';
import { Card, KpiCard, PageHeader, SectionTitle } from '../../../components/ui';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const API_BASE = `${BASE}/api/a11oy/lexicon`;
const GOLD = '#c9b787';

type LexiconStatus = 'pending_review' | 'approved' | 'denied' | 'risk_flagged';

export interface LexiconEntry {
  id: string;
  targetId: string;
  kind: 'model' | 'dataset';
  provider: string;
  license: string;
  status: LexiconStatus;
  riskFlagged: boolean;
  riskNote: string | null;
  description: string;
  metadata: Record<string, unknown>;
  seeded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LexiconReview {
  id: string;
  entryId: string;
  status: 'pending' | 'approved' | 'denied';
  requestedBy: string;
  context: Record<string, unknown>;
  createdAt: string;
  resolvedAt: string | null;
}

export interface LexiconDecision {
  id: string;
  entryId: string;
  reviewRequestId: string | null;
  decision: 'approved' | 'denied';
  reason: string;
  decidedBy: string;
  decidedAt: string;
}

interface CatalogResponse {
  entries: LexiconEntry[];
  counts: Record<LexiconStatus, number>;
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`lexicon_api_${res.status}`);
  return (await res.json()) as T;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`lexicon_api_${res.status}`);
  return (await res.json()) as T;
}

const LEX_TABS: { href: string; label: string; status?: LexiconStatus | 'history' }[] = [
  { href: '/governance/lexicon', label: 'Catalog' },
  { href: '/governance/lexicon/pending', label: 'Pending Review', status: 'pending_review' },
  { href: '/governance/lexicon/approved', label: 'Approved', status: 'approved' },
  { href: '/governance/lexicon/denied', label: 'Denied', status: 'denied' },
  { href: '/governance/lexicon/history', label: 'Decision History', status: 'history' },
];

function TabBar() {
  const [location] = useLocation();
  return (
    <div
      className="flex gap-1 mb-6 border-b"
      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
    >
      {LEX_TABS.map((t) => {
        const active = location === t.href || location === t.href + '/';
        return (
          <Link
            key={t.href}
            href={t.href}
            className="px-3 py-2 text-xs font-mono uppercase tracking-wider"
            style={{
              color: active ? GOLD : 'rgba(255,255,255,0.6)',
              borderBottom: `2px solid ${active ? GOLD : 'transparent'}`,
              marginBottom: '-1px',
            }}
            data-testid={`lexicon-tab-${t.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

function statusColor(s: LexiconStatus): string {
  switch (s) {
    case 'approved':
      return '#86efac';
    case 'denied':
      return '#fca5a5';
    case 'risk_flagged':
      return '#fcd34d';
    default:
      return GOLD;
  }
}

function EntryRow({
  entry,
  onApprove,
  onDeny,
  busyId,
}: {
  entry: LexiconEntry;
  onApprove?: (e: LexiconEntry) => void;
  onDeny?: (e: LexiconEntry) => void;
  busyId?: string | null;
}) {
  const isBusy = busyId === entry.id;
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <code
              className="text-sm font-mono"
              style={{ color: '#e2e8f0' }}
              data-testid={`lexicon-entry-${entry.targetId}`}
            >
              {entry.targetId}
            </code>
            <span
              className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              {entry.kind}
            </span>
            <span
              className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              {entry.provider}
            </span>
          </div>
          <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>License: </span>
            <span style={{ color: '#e2e8f0' }}>{entry.license}</span>
          </div>
          {entry.description && (
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {entry.description}
            </div>
          )}
          {entry.riskFlagged && entry.riskNote && (
            <div className="mt-2 text-xs" style={{ color: '#fcd34d' }}>
              ⚠ {entry.riskNote}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded"
            style={{
              backgroundColor: `${statusColor(entry.status)}22`,
              color: statusColor(entry.status),
            }}
            data-testid={`lexicon-status-${entry.targetId}`}
          >
            {entry.status.replace('_', ' ')}
          </span>
          {(onApprove || onDeny) && (
            <div className="flex gap-1">
              {onApprove && entry.status !== 'approved' && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => onApprove(entry)}
                  className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded"
                  style={{
                    backgroundColor: 'rgba(134,239,172,0.15)',
                    color: '#86efac',
                    opacity: isBusy ? 0.5 : 1,
                  }}
                  data-testid={`lexicon-approve-${entry.targetId}`}
                >
                  Approve
                </button>
              )}
              {onDeny && entry.status !== 'denied' && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => onDeny(entry)}
                  className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded"
                  style={{
                    backgroundColor: 'rgba(252,165,165,0.12)',
                    color: '#fca5a5',
                    opacity: isBusy ? 0.5 : 1,
                  }}
                  data-testid={`lexicon-deny-${entry.targetId}`}
                >
                  Deny
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function useCatalog(filter?: LexiconStatus) {
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiGet<CatalogResponse>(filter ? `/catalog?status=${filter}` : '/catalog')
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, reload]);

  const decide = async (entry: LexiconEntry, decision: 'approved' | 'denied') => {
    setBusyId(entry.id);
    try {
      await apiPost(`/entries/${entry.id}/${decision === 'approved' ? 'approve' : 'deny'}`, {
        reason: decision === 'approved' ? 'Operator approved via Lexicon UI' : 'Operator denied via Lexicon UI',
      });
      setReload((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  };

  return { data, error, busyId, decide };
}

function LexiconShell({
  title,
  subtitle,
  filter,
  emptyLabel,
}: {
  title: string;
  subtitle: string;
  filter?: LexiconStatus;
  emptyLabel: string;
}) {
  const { data, error, busyId, decide } = useCatalog(filter);
  const counts = data?.counts ?? { pending_review: 0, approved: 0, denied: 0, risk_flagged: 0 };
  const total = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);

  return (
    <Layout>
      <PageHeader
        label="A11OY · GOVERNANCE"
        title={title}
        subtitle={subtitle}
        status={'LIVE'}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="CATALOG SIZE" value={String(total)} sub="model + dataset entries" accent={GOLD} />
        <KpiCard label="PENDING REVIEW" value={String(counts.pending_review)} sub="Awaiting operator decision" accent={GOLD} />
        <KpiCard label="APPROVED" value={String(counts.approved)} sub="License-cleared for inference" accent="#86efac" />
        <KpiCard label="DENIED / RISK" value={String(counts.denied + counts.risk_flagged)} sub="Blocked at gate" accent="#fca5a5" />
      </div>

      <TabBar />

      <SectionTitle>{title}</SectionTitle>
      {error && (
        <div className="text-xs font-mono mb-4" style={{ color: '#fca5a5' }}>
          {error}
        </div>
      )}
      <div className="flex flex-col gap-3" data-testid="lexicon-entry-list">
        {data?.entries.length === 0 && (
          <div
            className="px-4 py-6 rounded text-xs font-mono text-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)' }}
          >
            {emptyLabel}
          </div>
        )}
        {data?.entries.map((e) => (
          <EntryRow
            key={e.id}
            entry={e}
            busyId={busyId}
            onApprove={(en) => decide(en, 'approved')}
            onDeny={(en) => decide(en, 'denied')}
          />
        ))}
      </div>
    </Layout>
  );
}

export function LexiconCatalog() {
  return (
    <LexiconShell
      title="License Intelligence Catalog"
      subtitle="Every model and dataset license seen by the platform — the authoritative source for the governance gate's license_approved decision."
      emptyLabel="No entries in catalog yet."
    />
  );
}

export function LexiconPending() {
  return (
    <LexiconShell
      title="Pending Operator Review"
      subtitle="Targets that hit the inference gate without an approved license. Each entry blocks routing until an operator approves or denies."
      filter="pending_review"
      emptyLabel="Queue is clear — no licenses awaiting review."
    />
  );
}

export function LexiconApproved() {
  return (
    <LexiconShell
      title="Approved Licenses"
      subtitle="License entries cleared by an operator. The license_approved gate consults this list at every inference call."
      filter="approved"
      emptyLabel="No approved entries yet."
    />
  );
}

export function LexiconDenied() {
  return (
    <LexiconShell
      title="Denied Licenses"
      subtitle="Targets explicitly denied by an operator. Inference attempts against these targets are blocked at the governance gate."
      filter="denied"
      emptyLabel="No denied entries."
    />
  );
}

export function LexiconHistory() {
  const [decisions, setDecisions] = useState<LexiconDecision[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ decisions: LexiconDecision[] }>('/history')
      .then((r) => {
        if (!cancelled) setDecisions(r.decisions);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Layout>
      <PageHeader
        label="A11OY · GOVERNANCE"
        title="Decision History"
        subtitle="Append-only audit of every Lexicon approval / denial — operator, target, timestamp, and reason."
        status={'LIVE'}
      />
      <TabBar />
      {error && (
        <div className="text-xs font-mono mb-4" style={{ color: '#fca5a5' }}>
          {error}
        </div>
      )}
      <div className="flex flex-col gap-2" data-testid="lexicon-history-list">
        {decisions.length === 0 && (
          <div
            className="px-4 py-6 rounded text-xs font-mono text-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)' }}
          >
            No decisions recorded yet.
          </div>
        )}
        {decisions.map((d) => (
          <Card key={d.id}>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded"
                    style={{
                      backgroundColor:
                        d.decision === 'approved'
                          ? 'rgba(134,239,172,0.15)'
                          : 'rgba(252,165,165,0.12)',
                      color: d.decision === 'approved' ? '#86efac' : '#fca5a5',
                    }}
                  >
                    {d.decision}
                  </span>
                  <code className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    entry {d.entryId.slice(0, 8)}
                  </code>
                </div>
                {d.reason && (
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {d.reason}
                  </div>
                )}
              </div>
              <div
                className="text-[10px] font-mono text-right"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                <div>{d.decidedBy}</div>
                <div>{new Date(d.decidedAt).toLocaleString()}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Layout>
  );
}

