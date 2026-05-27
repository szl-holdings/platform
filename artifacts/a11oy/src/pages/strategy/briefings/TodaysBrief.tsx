import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../../../components/layout';
import { PageHeader, Card, KpiCard } from '../../../components/ui';

const GOLD = '#c9b787';

const BRIEF_DATE = 'May 5, 2026 · 06:00 UTC';

interface RawSignal {
  id: string;
  domain: string;
  headline: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  source: string;
  covenantLift: number;
  action: string;
  tags?: string[];
}

const SIGNALS: RawSignal[] = [
  { id: 's1', domain: 'Maritime', headline: 'Tanjung Pelepas port congestion elevated to 8.2/10 — avg delay 18h', priority: 'high', confidence: 94, source: 'MarineTraffic + Port Authority RSS', covenantLift: 42000, action: 'Port standby ordered for MV Cascade — approved by VP Ops 04:30 UTC', tags: ['port', 'congestion', 'standby'] },
  { id: 's2', domain: 'Legal', headline: 'Charter Party CP-2024-088 laytime clause triggered — 72h free time expires 14:00 UTC', priority: 'high', confidence: 99, source: 'Counsel Sentinel contract parsing', covenantLift: 38000, action: 'Demurrage notice drafted — pending counsel review', tags: ['contract', 'laytime', 'demurrage'] },
  { id: 's3', domain: 'Compliance', headline: 'OFAC updated SDN list — 3 new maritime entities added. No exposure in current fleet.', priority: 'medium', confidence: 97, source: 'OFAC API · Sanctions screen auto-run', covenantLift: 180000, action: 'Fleet screened — clean. Next auto-screen: 06:00 UTC tomorrow.', tags: ['ofac', 'sanctions', 'screening'] },
  { id: 's4', domain: 'Security', headline: 'Guardian NOC: 18 P1 alerts auto-remediated — 99.97% SLO maintained', priority: 'low', confidence: 96, source: 'Guardian NOC telemetry', covenantLift: 28000, action: 'No human intervention required. 1 P2 alert under monitoring.', tags: ['noc', 'alerts'] },
  { id: 's5', domain: 'Strategy', headline: 'Competitive Atlas: 2 maritime AI competitors announced funding rounds. DeepDive report queued.', priority: 'medium', confidence: 82, source: 'Competitive Atlas signal scan', covenantLift: 0, action: 'Full competitive analysis brief scheduled 12:00 UTC.', tags: ['competitive', 'atlas'] },
];

const PRIORITY_COLORS = { high: '#f87171', medium: GOLD, low: '#22c55e' };
const DOMAIN_COLORS: Record<string, string> = { Maritime: '#4d8fcc', Legal: '#9b7cc8', Compliance: GOLD, Security: '#f87171', Strategy: '#22c55e' };

interface RankedSignal {
  id: string;
  score: number;
  rationale: { userAffinity: number; contextFit: number; itemPriority: number; governance: number };
}

const API_BASE = (import.meta.env.BASE_URL ?? '/') + 'api';

export function TodaysBrief() {
  const [expanded, setExpanded] = useState<string | null>('s1');
  const [ranked, setRanked] = useState<RankedSignal[] | null>(null);
  const [rankSignature, setRankSignature] = useState<string>('');

  useEffect(() => {
    const items = SIGNALS.map((s) => ({
      id: s.id,
      domain: s.domain,
      headline: s.headline,
      priority: s.priority,
      confidence: s.confidence / 100,
      covenantLift: s.covenantLift,
      tags: s.tags,
    }));
    const operator = {
      operatorId: 'demo-operator',
      recentDomains: ['Maritime', 'Legal', 'Compliance'],
      affinityTags: ['port', 'laytime', 'sanctions'],
    };
    // Pull memnet associative recall first, then feed the hits in as
    // memnetHints so UniRec's contextFit axis reflects prior outcomes for
    // similar briefings (capped at +0.15 inside the fabric).
    type MemnetHit = { artifactType: string; recallScore: number; metadata?: Record<string, unknown> };
    const recallUrl = `${API_BASE}/a11oy/reliquary/recall?q=${encodeURIComponent('port congestion laytime sanctions')}&limit=6`;
    fetch(recallUrl)
      .then((r) => r.json().catch(() => null))
      .then((j): { domain?: string; tags?: string[]; weight?: number }[] => {
        if (!j?.ok || !Array.isArray(j.data?.hits)) return [];
        return (j.data.hits as MemnetHit[]).map((h) => {
          const meta = h.metadata ?? {};
          const domain = typeof meta.domain === 'string' ? meta.domain
            : (h.artifactType ?? '').split('.')[0];
          const tags = Array.isArray(meta.tags)
            ? (meta.tags as unknown[]).filter((t): t is string => typeof t === 'string') : [];
          return { domain, tags, weight: Number.isFinite(h.recallScore) ? h.recallScore : 0.5 };
        });
      })
      .catch(() => [] as { domain?: string; tags?: string[]; weight?: number }[])
      .then((memnetHints) => {
        return fetch(`${API_BASE}/a11oy/unirec/recommend`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ items, operator, memnetHints }),
        });
      })
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok && Array.isArray(j.data?.ranked)) {
          // UniRec returns ScoredItem[] where each entry is { item: { id, ... }, score, axes, ... }
          // (a few earlier preview builds returned a flattened { id, score, axes }; handle both
          // so this stays robust against API rev drift).
          type RankedShape = {
            item?: { id?: string };
            id?: string;
            score: number;
            axes: RankedSignal['rationale'];
          };
          const mapped = (j.data.ranked as RankedShape[])
            .map((r): RankedSignal | null => {
              const id = r.item?.id ?? r.id;
              if (!id) return null;
              return { id, score: r.score, rationale: r.axes };
            })
            .filter((r): r is RankedSignal => r !== null);
          setRanked(mapped);
          setRankSignature(typeof j.data?.rankSignature === 'string' ? j.data.rankSignature : '');
        }
      })
      .catch(() => { /* keep static order */ });
  }, []);

  const ordered = useMemo(() => {
    if (!ranked) return SIGNALS;
    const byId = new Map(SIGNALS.map((s) => [s.id, s]));
    return ranked.map((r) => byId.get(r.id)).filter((s): s is RawSignal => !!s);
  }, [ranked]);

  const rationaleById = useMemo(() => {
    const m = new Map<string, RankedSignal>();
    if (ranked) for (const r of ranked) m.set(r.id, r);
    return m;
  }, [ranked]);

  const totalLift = SIGNALS.reduce((s, sig) => s + sig.covenantLift, 0);
  const highPriority = SIGNALS.filter(s => s.priority === 'high').length;

  return (
    <Layout>
      <PageHeader
        label="STRATEGY / BRIEFINGS / TODAY"
        title="Today's Intelligence Brief"
        subtitle={BRIEF_DATE}
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="SIGNALS" value={String(SIGNALS.length)} sub="today" accent={GOLD} />
        <KpiCard label="HIGH PRIORITY" value={String(highPriority)} sub="require attention" accent={highPriority > 0 ? '#f87171' : GOLD} />
        <KpiCard label="DECISIONS MADE" value="3" sub="from brief" accent={GOLD} />
        <KpiCard label="COVENANT LIFT $" value={`$${(totalLift / 1000).toFixed(0)}k`} sub="from brief actions" accent="#22c55e" />
      </div>

      {ranked && (
        <Card className="mb-4">
          <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>UniRec — Tri-Tower Ranking</div>
          <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
            Signals re-ordered by <code>(userAffinity^0.40 · contextFit^0.30 · itemPriority^0.30) · governance</code>.
            Rank signature <code className="opacity-70">{rankSignature.slice(0, 24)}</code>.
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {ordered.map((sig, idx) => {
          const pc = PRIORITY_COLORS[sig.priority as keyof typeof PRIORITY_COLORS];
          const dc = DOMAIN_COLORS[sig.domain] ?? GOLD;
          const isOpen = expanded === sig.id;
          const r = rationaleById.get(sig.id);

          return (
            <div key={sig.id} className="rounded-lg border cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: isOpen ? 'rgba(201,183,135,0.3)' : sig.priority === 'high' ? 'rgba(248,113,113,0.2)' : 'var(--color-a11oy-border)' }}
              onClick={() => setExpanded(isOpen ? null : sig.id)}>
              <div className="flex items-start gap-3 p-4">
                <div className="w-6 text-xs font-mono mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>#{idx + 1}</div>
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: pc }} />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded mr-2" style={{ backgroundColor: `${dc}18`, color: dc }}>{sig.domain}</span>
                      <span className="text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{sig.headline}</span>
                    </div>
                    <div className="text-right shrink-0">
                      {sig.covenantLift > 0 && <div className="text-xs" style={{ color: '#22c55e' }}>+${sig.covenantLift.toLocaleString()}</div>}
                      <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>⚡ {sig.confidence}%</div>
                      {r && <div className="text-xs font-mono" style={{ color: GOLD }}>UniRec {r.score.toFixed(2)}</div>}
                    </div>
                  </div>
                </div>
              </div>

              {isOpen && (
                <div className="px-4 pb-4 border-t pt-3 space-y-3" style={{ borderColor: 'var(--color-a11oy-border)' }}
                  onClick={e => e.stopPropagation()}>
                  <div>
                    <div className="text-xs font-mono uppercase mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Source</div>
                    <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{sig.source}</div>
                  </div>
                  <div>
                    <div className="text-xs font-mono uppercase mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Agent Action</div>
                    <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{sig.action}</div>
                  </div>
                  {r && (
                    <div>
                      <div className="text-xs font-mono uppercase mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>UniRec rationale axes</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                        <div>userAffinity <span style={{ color: GOLD }}>{r.rationale.userAffinity.toFixed(2)}</span></div>
                        <div>contextFit <span style={{ color: GOLD }}>{r.rationale.contextFit.toFixed(2)}</span></div>
                        <div>itemPriority <span style={{ color: GOLD }}>{r.rationale.itemPriority.toFixed(2)}</span></div>
                        <div>governance <span style={{ color: GOLD }}>{r.rationale.governance.toFixed(2)}</span></div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button type="button" className="px-3 py-1.5 rounded text-xs font-mono"
                      style={{ background: 'rgba(201,183,135,0.08)', color: GOLD, border: '1px solid rgba(201,183,135,0.2)', cursor: 'pointer' }}>
                      View Proof Chain
                    </button>
                    <button type="button" className="px-3 py-1.5 rounded text-xs font-mono"
                      style={{ background: 'rgba(167,139,250,0.08)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)', cursor: 'pointer' }}>
                      Record Dissent
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Card className="mt-6">
        <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Brief Summary — AI Synthesis</div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-a11oy-text-sub)' }}>
          Today's brief covers 5 signals across Maritime, Legal, Compliance, Security, and Strategy domains. Two high-priority items require immediate attention: MV Cascade port standby (already actioned, $42k lift) and Charter Party laytime expiry (pending counsel). Compliance confirms clean fleet against updated OFAC SDN list — $180k in prevented exposure. Overall Covenant Lift $: <span style={{ color: '#22c55e' }}>${(totalLift / 1000).toFixed(0)}k</span>.
        </p>
      </Card>
    </Layout>
  );
}
