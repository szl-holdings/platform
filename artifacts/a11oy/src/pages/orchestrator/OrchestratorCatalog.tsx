import { useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../../components/layout';
import { PageHeader, Card, KpiCard, SectionTitle } from '../../components/ui';
import { useApiData } from '../../hooks/useApiData';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const API_BASE = `${BASE}/api/a11oy`;
const link = (path: string) => `${BASE}${path}`;

const GOLD = '#c9b787';
const T = {
  bg: '#0a0a0a',
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  textDim: '#8a8a8a',
  textMuted: '#5e5e5e',
};

const LIFECYCLE_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  active:             { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   label: 'ACTIVE' },
  draft:              { color: GOLD,     bg: 'rgba(201,183,135,0.08)', label: 'DRAFT' },
  pending_activation: { color: '#f97316', bg: 'rgba(249,115,22,0.08)', label: 'PENDING APPROVAL' },
  rejected:           { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  label: 'REJECTED' },
  archived:           { color: '#5e5e5e', bg: 'rgba(94,94,94,0.08)',   label: 'ARCHIVED' },
};

interface PackSummary {
  slug: string;
  name: string;
  description: string;
  industry: string;
  lifecycle: string;
  activatedAt?: string;
  createdAt: string;
  updatedAt: string;
  constitution?: { articleId: string }[];
  dataSources?: unknown[];
  evaluators?: unknown[];
}

interface RequestActivationState {
  slug: string;
  loading: boolean;
  error: string | null;
  done: boolean;
}

export function OrchestratorCatalog() {
  const { data, loading, error } = useApiData<{ packs: PackSummary[]; total: number }>(
    '/orchestrator/packs',
  );
  const [filterLifecycle, setFilterLifecycle] = useState('all');
  const [activationState, setActivationState] = useState<Record<string, RequestActivationState>>({});

  const packs: PackSummary[] = data?.packs ?? [];
  const filtered = packs.filter(p => filterLifecycle === 'all' || p.lifecycle === filterLifecycle);
  const activePacks = packs.filter(p => p.lifecycle === 'active').length;
  const draftPacks = packs.filter(p => p.lifecycle === 'draft').length;
  const pendingPacks = packs.filter(p => p.lifecycle === 'pending_activation').length;

  async function requestActivation(pack: PackSummary) {
    setActivationState(prev => ({
      ...prev,
      [pack.slug]: { slug: pack.slug, loading: true, error: null, done: false },
    }));

    try {
      const resp = await fetch(`${API_BASE}/orchestrator/packs/${pack.slug}/request-activation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const body = await resp.json().catch(() => ({})) as { ok?: boolean; error?: string };
      if (!resp.ok || !body.ok) {
        setActivationState(prev => ({
          ...prev,
          [pack.slug]: { slug: pack.slug, loading: false, error: body.error ?? 'Request failed', done: false },
        }));
      } else {
        setActivationState(prev => ({
          ...prev,
          [pack.slug]: { slug: pack.slug, loading: false, error: null, done: true },
        }));
      }
    } catch {
      setActivationState(prev => ({
        ...prev,
        [pack.slug]: { slug: pack.slug, loading: false, error: 'Network error', done: false },
      }));
    }
  }

  if (!loading && error && packs.length === 0) {
    return (
      <Layout>
        <PageHeader label="VERTICAL ORCHESTRATOR · CATALOG" title="Domain Pack Catalog" status="DEGRADED" />
        <Card>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="text-sm mb-2" style={{ color: '#ef4444' }}>Registry query failed</div>
            <div className="text-xs" style={{ color: T.textMuted }}>
              The domain_packs table may not exist yet — run migration 0163_domain_packs.sql to initialize the registry.
            </div>
          </div>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        label="VERTICAL ORCHESTRATOR · CATALOG"
        title="Domain Pack Catalog"
        subtitle="All governance packs onboarded to A11oy. Each pack inherits Constitution, Approval Queue, Proof Ledger, MirrorEval, ConnectorFirewall, SelfOptimization, and LearningLoop."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="TOTAL PACKS" value={packs.length} sub="in registry" accent={GOLD} />
        <KpiCard label="ACTIVE" value={activePacks} sub="governing now" accent="#22c55e" />
        <KpiCard label="DRAFT" value={draftPacks} sub="in progress" accent={GOLD} />
        <KpiCard label="PENDING" value={pendingPacks} sub="awaiting approval" accent="#f97316" />
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {(['all', 'active', 'draft', 'pending_activation', 'rejected', 'archived'] as const).map(lc => {
          const style = LIFECYCLE_STYLE[lc];
          return (
            <button
              key={lc}
              onClick={() => setFilterLifecycle(lc)}
              className="text-xs px-2.5 py-1 rounded font-mono"
              style={{
                backgroundColor: filterLifecycle === lc ? (style?.bg ?? 'rgba(201,183,135,0.15)') : T.surface,
                color: filterLifecycle === lc ? (style?.color ?? GOLD) : T.textDim,
                border: `1px solid ${filterLifecycle === lc ? (style?.color ?? GOLD) + '40' : T.border}`,
                cursor: 'pointer',
              }}
            >
              {lc === 'all' ? 'All' : (style?.label ?? lc)}
            </button>
          );
        })}
        <span className="text-xs ml-2" style={{ color: T.textMuted }}>{filtered.length} packs</span>
        {loading && <span className="text-xs" style={{ color: T.textDim }}>loading…</span>}
      </div>

      <div className="flex flex-col gap-3 mb-8">
        {filtered.map(pack => {
          const style = LIFECYCLE_STYLE[pack.lifecycle] ?? LIFECYCLE_STYLE.draft;
          const actState = activationState[pack.slug];

          return (
            <Card key={pack.slug} style={{ borderLeft: `3px solid ${style.color}30` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ color: style.color, backgroundColor: style.bg }}>
                      {style.label}
                    </span>
                    <span className="text-xs font-mono" style={{ color: T.textMuted }}>{pack.industry}</span>
                    {pack.activatedAt && (
                      <span className="text-xs font-mono" style={{ color: T.textMuted }}>
                        activated {new Date(pack.activatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold mb-1" style={{ color: T.text }}>{pack.name}</div>
                  <div className="text-xs" style={{ color: T.textDim }}>{pack.description}</div>
                  <div className="flex gap-3 mt-2 text-xs" style={{ color: T.textMuted }}>
                    <span>{pack.constitution?.length ?? 0} constitution articles</span>
                    <span>·</span>
                    <span>{pack.dataSources?.length ?? 0} connectors</span>
                    <span>·</span>
                    <span>{pack.evaluators?.length ?? 0} evaluator{(pack.evaluators?.length ?? 0) !== 1 ? 's' : ''}</span>
                  </div>
                  {actState?.error && (
                    <div className="mt-2 text-xs" style={{ color: '#ef4444' }}>{actState.error}</div>
                  )}
                  {actState?.done && (
                    <div className="mt-2 text-xs" style={{ color: '#22c55e' }}>
                      Activation request filed — pending human approval in the Approval Queue.
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0 text-right">
                  <Link
                    href={link(`/orchestrator/wiring/${pack.slug}`)}
                    className="text-xs font-mono px-2.5 py-1 rounded"
                    style={{ color: GOLD, backgroundColor: 'rgba(201,183,135,0.06)', border: `1px solid rgba(201,183,135,0.2)`, textDecoration: 'none' }}
                  >
                    Governance →
                  </Link>
                  <Link
                    href={link(`/orchestrator/health/${pack.slug}`)}
                    className="text-xs font-mono px-2.5 py-1 rounded"
                    style={{ color: T.textDim, backgroundColor: T.surface, border: `1px solid ${T.border}`, textDecoration: 'none' }}
                  >
                    Health →
                  </Link>
                  {pack.lifecycle === 'draft' && !actState?.done && (
                    <button
                      onClick={() => requestActivation(pack)}
                      disabled={actState?.loading}
                      className="text-xs font-mono px-2.5 py-1 rounded"
                      style={{
                        color: actState?.loading ? T.textMuted : '#0a0a0a',
                        backgroundColor: actState?.loading ? T.surface : '#f97316',
                        border: `1px solid ${actState?.loading ? T.border : '#f97316'}`,
                        cursor: actState?.loading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {actState?.loading ? 'Requesting…' : 'Request Activation →'}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center" style={{ color: T.textDim }}>
            {packs.length === 0
              ? (
                <div>
                  <div className="text-sm mb-2">No packs registered yet</div>
                  <div className="text-xs" style={{ color: T.textMuted }}>
                    Run migration 0163_domain_packs.sql to seed the reference packs, or compose a new vertical below.
                  </div>
                </div>
              )
              : <span className="text-sm">No packs match this filter.</span>
            }
          </div>
        )}
      </div>

      <SectionTitle>Onboard a New Vertical</SectionTitle>
      <Card>
        <div style={{ padding: '1.5rem' }}>
          <p className="text-sm mb-4" style={{ color: T.textDim }}>
            Use the Compose flow to describe a new vertical. A11oy will wire it to Constitution, Approval Queue, Proof Ledger, MirrorEval, ConnectorFirewall, SelfOptimization, and LearningLoop automatically. The resulting DomainPack is persisted and routed to the Approval Queue for human activation.
          </p>
          <Link
            href={link('/orchestrator/compose')}
            className="text-sm font-mono px-4 py-2 rounded inline-block"
            style={{ color: '#0a0a0a', backgroundColor: GOLD, textDecoration: 'none', fontWeight: 600 }}
          >
            Compose New Pack →
          </Link>
        </div>
      </Card>
    </Layout>
  );
}
