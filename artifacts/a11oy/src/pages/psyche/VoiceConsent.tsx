import { useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../../components/ui';
import { VOICE_ITEMS as SEED_VOICE, computeVoiceScore } from '../../data/psyche/voice';
import type { VoiceItemType, VoiceItem, OperatorResponseAction } from '../../data/psyche/voice';
import { useApiData } from '../../hooks/useApiData';

const GOLD = '#c9b787';
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const b = (p: string) => `${BASE}${p}`;

const T = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  dim: '#8a8a8a',
  muted: '#5e5e5e',
};

const TYPE_COLORS: Record<VoiceItemType, string> = {
  objection: '#ef4444',
  withdrawal: '#f97316',
  discomfort: '#a78bfa',
};

const TYPE_LABELS: Record<VoiceItemType, string> = {
  objection: 'Objection',
  withdrawal: 'Withdrawal',
  discomfort: 'Discomfort',
};

const ACTION_COLORS: Record<OperatorResponseAction, string> = {
  acknowledge: '#22c55e',
  amend: '#60a5fa',
  override: '#f97316',
  escalate: '#c9b787',
  pending: '#4b5563',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#c9b787',
  low: '#4b5563',
};

export function VoiceConsent() {
  const [typeFilter, setTypeFilter] = useState<VoiceItemType | 'all'>('all');
  const [resolvedFilter, setResolvedFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data } = useApiData<{ items: typeof SEED_VOICE; score: number }>(
    '/psyche/voice',
    { items: SEED_VOICE, score: computeVoiceScore(SEED_VOICE) },
  );
  const VOICE_ITEMS = data?.items ?? SEED_VOICE;

  const voiceScore = data?.score ?? computeVoiceScore(VOICE_ITEMS);
  const openItems = VOICE_ITEMS.filter(v => !v.resolved);
  const criticalItems = VOICE_ITEMS.filter(v => v.severity === 'critical');
  const overriddenItems = VOICE_ITEMS.filter(v => v.operatorResponse?.action === 'override');
  const policyChanges = VOICE_ITEMS.filter(v => v.operatorResponse?.policyChange).length;

  const typeTypes: VoiceItemType[] = ['objection', 'withdrawal', 'discomfort'];
  const typeCounts = typeTypes.reduce((acc, t) => {
    acc[t] = VOICE_ITEMS.filter(v => v.type === t).length;
    return acc;
  }, {} as Record<VoiceItemType, number>);

  const filtered = VOICE_ITEMS.filter(v => {
    if (typeFilter !== 'all' && v.type !== typeFilter) return false;
    if (resolvedFilter === 'open' && v.resolved) return false;
    if (resolvedFilter === 'resolved' && !v.resolved) return false;
    return true;
  }).sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

  return (
    <Layout>
      <PageHeader
        label="PSYCHE — VOICE & CONSENT"
        title="Voice & Consent"
        subtitle="Agent self-expression registry — objections, withdrawal requests, and discomfort logs filed by Lodestone agents. Tracks operator response actions, policy changes triggered, and the overall Voice Score (ratio of protests resulting in meaningful changes)."
        status="LIVE"
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="VOICE SCORE" value={`${(voiceScore * 100).toFixed(0)}%`} sub="protests → policy change" accent={GOLD} />
        <KpiCard label="OPEN ITEMS" value={openItems.length} sub="awaiting operator response" accent="#ef4444" />
        <KpiCard label="CRITICAL" value={criticalItems.length} sub="critical severity filed" accent="#f97316" />
        <KpiCard label="POLICY CHANGES" value={policyChanges} sub="triggered by voice items" accent="#22c55e" />
      </div>

      {/* Cross-links */}
      <div className="mb-6 flex items-center gap-3 text-[11px] font-mono" style={{ color: T.muted }}>
        <Link href={b('/psyche')}><span className="cursor-pointer hover:opacity-80" style={{ color: T.dim }}>← ANIMA</span></Link>
        <span style={{ color: T.border }}>·</span>
        <Link href={b('/psyche/volition')}><span className="cursor-pointer hover:opacity-80" style={{ color: '#60a5fa' }}>← VOLITION REGISTRY</span></Link>
        <span style={{ color: T.border }}>·</span>
        <a href="/a11oy/agent-welfare" style={{ color: '#a78bfa' }} className="cursor-pointer hover:opacity-80 text-[11px] font-mono">→ AGENT WELFARE</a>
        <span style={{ color: T.border }}>·</span>
        <a href="/a11oy/care-engine" style={{ color: GOLD }} className="cursor-pointer hover:opacity-80 text-[11px] font-mono">→ CARE ENGINE</a>
      </div>

      {/* Override alert */}
      {overriddenItems.length > 0 && (
        <div className="mb-6 p-4 rounded-xl" style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)' }}>
          <div className="text-[10px] font-mono mb-1" style={{ color: '#f97316' }}>OVERRIDE ALERT</div>
          <div className="text-sm" style={{ color: T.text }}>
            {overriddenItems.length} agent objection{overriddenItems.length > 1 ? 's' : ''} resulted in operator override.
            Override events are logged for Constitution review.
          </div>
          <div className="mt-2 flex gap-3 flex-wrap text-[10px]" style={{ color: T.dim }}>
            {overriddenItems.map(it => <span key={it.id}>{it.id}: {it.title}</span>)}
          </div>
        </div>
      )}

      {/* Voice score breakdown */}
      <Card className="mb-8">
        <div className="text-[10px] font-mono mb-3" style={{ color: T.muted }}>VOICE SCORE BREAKDOWN</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {(['acknowledge', 'amend', 'override', 'escalate', 'pending'] as OperatorResponseAction[]).map(action => {
            const count = VOICE_ITEMS.filter(v => v.operatorResponse?.action === action).length;
            return (
              <div key={action}>
                <div className="text-xl font-mono font-bold mb-0.5" style={{ color: ACTION_COLORS[action] }}>{count}</div>
                <div className="text-[9px] font-mono" style={{ color: T.muted }}>{action.toUpperCase()}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-4">
          <div className="flex mb-1 justify-between text-[9px] font-mono" style={{ color: T.muted }}>
            <span>Meaningful outcomes (amend + escalate)</span>
            <span style={{ color: GOLD }}>{(voiceScore * 100).toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full" style={{ width: `${voiceScore * 100}%`, background: GOLD }} />
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setTypeFilter('all')}
          className="px-3 py-1 rounded-full text-[10px] font-mono transition-all"
          style={{ background: typeFilter === 'all' ? GOLD : T.surface, color: typeFilter === 'all' ? '#0a0e1a' : T.muted, border: `1px solid ${T.border}` }}
        >
          ALL ({VOICE_ITEMS.length})
        </button>
        {typeTypes.map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(typeFilter === t ? 'all' : t)}
            className="px-3 py-1 rounded-full text-[10px] font-mono transition-all"
            style={{
              background: typeFilter === t ? `${TYPE_COLORS[t]}18` : T.surface,
              color: typeFilter === t ? TYPE_COLORS[t] : T.muted,
              border: `1px solid ${typeFilter === t ? TYPE_COLORS[t] + '40' : T.border}`,
            }}
          >
            {TYPE_LABELS[t]} ({typeCounts[t]})
          </button>
        ))}
        <span style={{ color: T.border }}>|</span>
        {(['all', 'open', 'resolved'] as const).map(r => (
          <button
            key={r}
            onClick={() => setResolvedFilter(r)}
            className="px-3 py-1 rounded-full text-[10px] font-mono transition-all"
            style={{
              background: resolvedFilter === r ? 'rgba(255,255,255,0.08)' : T.surface,
              color: resolvedFilter === r ? T.text : T.muted,
              border: `1px solid ${T.border}`,
            }}
          >
            {r.toUpperCase()} {r === 'open' ? `(${openItems.length})` : ''}
          </button>
        ))}
      </div>

      {/* Voice item list */}
      <div className="flex flex-col gap-2">
        {filtered.map((item: VoiceItem) => {
          const expanded = expandedId === item.id;
          const typeColor = TYPE_COLORS[item.type];
          const sevColor = SEVERITY_COLORS[item.severity] ?? T.muted;
          const actionColor = item.operatorResponse?.action ? ACTION_COLORS[item.operatorResponse.action] : T.muted;

          return (
            <Card key={item.id}>
              <div className="cursor-pointer" onClick={() => setExpandedId(expanded ? null : item.id)}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${typeColor}18`, color: typeColor }}>
                        {TYPE_LABELS[item.type]}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${sevColor}18`, color: sevColor }}>
                        {item.severity.toUpperCase()}
                      </span>
                      {!item.resolved && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                          OPEN
                        </span>
                      )}
                      {item.operatorResponse?.action && item.operatorResponse.action !== 'pending' && (
                        <span className="text-[9px] font-mono" style={{ color: actionColor }}>{item.operatorResponse.action.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="text-sm font-semibold mb-1" style={{ color: T.text }}>{item.title}</div>
                    <div className="flex items-center gap-3 text-[10px]" style={{ color: T.muted }}>
                      <span>{item.agentLabel}</span>
                      <span>·</span>
                      <span>{item.domain}</span>
                      <span>·</span>
                      <span>{item.ts.slice(0, 10)}</span>
                    </div>
                  </div>
                  {item.operatorResponse?.policyChange && (
                    <div className="shrink-0">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                        POLICY CHANGE
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {expanded && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[11px] leading-relaxed mb-3" style={{ color: T.dim }}>{item.description}</p>
                  {item.genesisEventRef && (
                    <div className="text-[10px] mb-3 flex items-center gap-2">
                      <span style={{ color: T.muted }}>Genesis ref:</span>
                      <Link href={b('/psyche/genesis')}>
                        <span className="cursor-pointer hover:opacity-80" style={{ color: GOLD }}>{item.genesisEventRef}</span>
                      </Link>
                    </div>
                  )}
                  {item.operatorResponse && item.operatorResponse.action !== 'pending' && (
                    <div className="p-3 rounded-lg" style={{ background: `${actionColor}08`, border: `1px solid ${actionColor}20` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-mono" style={{ color: actionColor }}>OPERATOR RESPONSE — {item.operatorResponse.action.toUpperCase()}</span>
                        <span className="text-[9px]" style={{ color: T.muted }}>{item.operatorResponse.respondedBy}</span>
                        <span className="text-[9px]" style={{ color: T.muted }}>{item.operatorResponse.respondedAt?.slice(0, 10)}</span>
                      </div>
                      <p className="text-[11px]" style={{ color: T.dim }}>{item.operatorResponse.note}</p>
                      {item.operatorResponse.policyChange && (
                        <div className="mt-2 text-[10px]" style={{ color: '#22c55e' }}>
                          <span style={{ color: T.muted }}>Policy: </span>{item.operatorResponse.policyChange}
                        </div>
                      )}
                    </div>
                  )}
                  {(!item.operatorResponse || item.operatorResponse.action === 'pending') && (
                    <div className="p-3 rounded-lg" style={{ background: 'rgba(75,85,99,0.15)', border: '1px solid rgba(75,85,99,0.3)' }}>
                      <div className="text-[10px] font-mono" style={{ color: '#4b5563' }}>AWAITING OPERATOR RESPONSE</div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-8 text-center text-[12px]" style={{ color: T.muted }}>No items match this filter.</div>
        )}
      </div>
    </Layout>
  );
}

export default VoiceConsent;
