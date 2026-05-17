import { useRoute } from 'wouter';
import { Link } from 'wouter';
import { Layout } from '../../components/layout';
import { PageHeader, Card, SectionTitle } from '../../components/ui';
import { useApiData } from '../../hooks/useApiData';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const link = (path: string) => `${BASE}${path}`;

const GOLD = '#c9b787';
const T = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  textDim: '#8a8a8a',
  textMuted: '#5e5e5e',
};

interface PackDetail {
  slug: string;
  name: string;
  industry: string;
  lifecycle: string;
  constitution?: { articleId: string; version: string }[];
  dataSources?: { connectorId: string; displayName: string; riskLevel: string; allowedTools: string[]; blockedTools: string[] }[];
  evaluators?: { evaluatorId: string; displayName: string; passThreshold: number; dimensions: string[] }[];
  approvalRules?: { riskTier: string; requiresApprover: string; autoApproveBelow?: number }[];
  selfOptimization?: { rewardSignals: string[]; lockedParameters: string[] };
  learningLoop?: { calibrationMetric: string; driftThresholdPct: number; recalibrationTrigger: string };
}

const GOVERNANCE_PRIMITIVES = [
  { id: 'constitution', label: 'Constitution', description: 'Articles this pack inherits and enforces', pagePath: '/constitution', iconChar: '§' },
  { id: 'approval-queue', label: 'Approval Queue', description: 'Risk-tier gating for material decisions', pagePath: '/approval-queue', iconChar: '≡' },
  { id: 'proof', label: 'Proof Ledger', description: 'Immutable proof chain for every governed action', pagePath: '/proof', iconChar: '◇' },
  { id: 'evals', label: 'MirrorEval', description: '14-dimension evaluation with reasoning verification', pagePath: '/evals', iconChar: '⊙' },
  { id: 'connectors', label: 'ConnectorFirewall', description: 'mTLS-gated data source scope for this pack', pagePath: '/connectors', iconChar: '⊗' },
  { id: 'optimization', label: 'SelfOptimization', description: 'Reward signals and locked parameters', pagePath: '/self-optimization', iconChar: '↺' },
  { id: 'learning-loop', label: 'LearningLoop', description: 'Calibration metric and drift detection', pagePath: '/learning', iconChar: '∞' },
];

const RISK_COLORS: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: GOLD, low: '#22c55e' };

export function OrchestratorWiring() {
  const [, params] = useRoute('/orchestrator/wiring/:slug');
  const slug = params?.slug ?? '';

  const { data: pack, loading, error } = useApiData<PackDetail>(
    `/orchestrator/packs/${slug}`,
  );

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '2rem', color: GOLD, fontFamily: 'monospace', fontSize: '0.8rem' }}>
          Loading pack…
        </div>
      </Layout>
    );
  }

  if (!pack || error) {
    return (
      <Layout>
        <PageHeader label="VERTICAL ORCHESTRATOR · WIRING" title="Pack Not Found" status="ERROR" />
        <Card>
          <div style={{ padding: '1.5rem', color: T.textDim }}>
            {error
              ? <>Failed to load pack <code style={{ color: GOLD }}>{slug}</code> — {error}.</>
              : <>Pack <code style={{ color: GOLD }}>{slug}</code> does not exist in the registry.</>
            }
            {' '}<Link href={link('/orchestrator/catalog')} style={{ color: GOLD }}>← Back to Catalog</Link>
          </div>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        label={`VERTICAL ORCHESTRATOR · WIRING · ${pack.slug.toUpperCase()}`}
        title={`Governance Wiring — ${pack.name}`}
        subtitle="Every governance primitive this pack inherits. Click any primitive to open the full A11oy page scoped to this pack."
        status="LIVE"
      />

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Link href={link('/orchestrator/catalog')} style={{ color: T.textDim, textDecoration: 'none', fontSize: '0.75rem', fontFamily: 'monospace' }}>← Catalog</Link>
        <span style={{ color: T.textMuted }}>·</span>
        <Link href={link(`/orchestrator/health/${slug}`)} style={{ color: GOLD, textDecoration: 'none', fontSize: '0.75rem', fontFamily: 'monospace' }}>Health →</Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {GOVERNANCE_PRIMITIVES.map(prim => (
          <Link
            key={prim.id}
            href={link(`${prim.pagePath}?pack=${slug}`)}
            style={{ textDecoration: 'none' }}
          >
            <div
              className="rounded-lg p-4 h-full transition-all hover:opacity-80"
              style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, cursor: 'pointer' }}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5" style={{ color: GOLD, fontFamily: 'ui-monospace, monospace' }}>{prim.iconChar}</span>
                <div>
                  <div className="text-sm font-semibold mb-0.5" style={{ color: T.text }}>{prim.label}</div>
                  <div className="text-xs" style={{ color: T.textDim }}>{prim.description}</div>
                  <div className="text-xs mt-2" style={{ color: GOLD }}>Open scoped to {pack.slug} →</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <SectionTitle>Constitution Articles</SectionTitle>
      <Card className="mb-6">
        <div style={{ padding: '1rem' }}>
          {pack.constitution && pack.constitution.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {pack.constitution.map(a => (
                <Link
                  key={a.articleId}
                  href={link(`/constitution?pack=${slug}&article=${a.articleId}`)}
                  style={{ textDecoration: 'none' }}
                >
                  <span className="text-xs font-mono px-2.5 py-1.5 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.08)', border: '1px solid rgba(201,183,135,0.2)', color: GOLD }}>
                    Article {a.articleId} · {a.version} →
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-xs" style={{ color: T.textMuted }}>No constitution articles declared — add them in the Compose flow.</div>
          )}
        </div>
      </Card>

      <SectionTitle>Data Sources (ConnectorFirewall Scope)</SectionTitle>
      <Card className="mb-6">
        <div style={{ padding: '1rem' }}>
          {pack.dataSources && pack.dataSources.length > 0 ? (
            <div className="flex flex-col gap-2">
              {pack.dataSources.map(ds => (
                <div key={ds.connectorId} className="flex items-start justify-between gap-4 text-xs">
                  <div>
                    <div style={{ color: T.text }}>{ds.displayName}</div>
                    <div style={{ color: T.textMuted }}>id: {ds.connectorId} · risk: {ds.riskLevel}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ds.allowedTools.map(t => <span key={t} className="px-1 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.08)', color: '#22c55e' }}>{t}</span>)}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="px-1.5 py-0.5 rounded font-mono" style={{ color: RISK_COLORS[ds.riskLevel] ?? GOLD, backgroundColor: `${RISK_COLORS[ds.riskLevel] ?? GOLD}12` }}>{ds.riskLevel}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs" style={{ color: T.textMuted }}>No connectors registered — this pack uses operator-supplied signals only.</div>
          )}
        </div>
      </Card>

      <SectionTitle>Evaluators</SectionTitle>
      <Card className="mb-6">
        <div style={{ padding: '1rem' }}>
          {pack.evaluators && pack.evaluators.length > 0 ? (
            <div className="flex flex-col gap-3">
              {pack.evaluators.map(ev => (
                <div key={ev.evaluatorId}>
                  <div className="text-sm font-medium mb-1" style={{ color: T.text }}>{ev.displayName}</div>
                  <div className="text-xs mb-1" style={{ color: T.textDim }}>Pass threshold: {Math.round(ev.passThreshold * 100)}%</div>
                  <div className="flex flex-wrap gap-1">
                    {ev.dimensions.map(d => <span key={d} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, color: T.textDim }}>{d}</span>)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs" style={{ color: T.textMuted }}>No evaluators declared.</div>
          )}
        </div>
      </Card>

      <SectionTitle>Approval Gate Rules</SectionTitle>
      <Card className="mb-6">
        <div style={{ padding: '1rem' }}>
          {pack.approvalRules && pack.approvalRules.length > 0 ? (
            <div className="flex flex-col gap-2">
              {pack.approvalRules.map(rule => (
                <div key={rule.riskTier} className="flex items-center justify-between text-xs py-1" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono px-1.5 py-0.5 rounded" style={{ color: RISK_COLORS[rule.riskTier] ?? GOLD, backgroundColor: `${RISK_COLORS[rule.riskTier] ?? GOLD}12` }}>{rule.riskTier}</span>
                    <span style={{ color: T.text }}>{rule.requiresApprover}</span>
                  </div>
                  {rule.autoApproveBelow !== undefined && (
                    <span style={{ color: T.textMuted }}>auto-approve below {Math.round(rule.autoApproveBelow * 100)}%</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs" style={{ color: T.textMuted }}>No approval rules declared.</div>
          )}
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <SectionTitle>SelfOptimization</SectionTitle>
          <Card>
            <div style={{ padding: '1rem' }}>
              {pack.selfOptimization ? (
                <>
                  <div className="text-xs mb-2" style={{ color: T.textDim }}>Reward signals:</div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {pack.selfOptimization.rewardSignals.map(s => <span key={s} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.06)', color: '#22c55e' }}>{s}</span>)}
                    {pack.selfOptimization.rewardSignals.length === 0 && <span style={{ color: T.textMuted, fontSize: '0.75rem' }}>none</span>}
                  </div>
                  <div className="text-xs mb-2" style={{ color: T.textDim }}>Locked parameters:</div>
                  <div className="flex flex-wrap gap-1">
                    {pack.selfOptimization.lockedParameters.map(p => <span key={p} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.06)', color: '#ef4444' }}>lock {p}</span>)}
                    {pack.selfOptimization.lockedParameters.length === 0 && <span style={{ color: T.textMuted, fontSize: '0.75rem' }}>none locked</span>}
                  </div>
                </>
              ) : <div className="text-xs" style={{ color: T.textMuted }}>Not configured.</div>}
            </div>
          </Card>
        </div>

        <div>
          <SectionTitle>LearningLoop</SectionTitle>
          <Card>
            <div style={{ padding: '1rem' }}>
              {pack.learningLoop ? (
                <>
                  <div className="text-xs mb-1" style={{ color: T.textDim }}>Calibration metric:</div>
                  <div className="text-sm mb-3" style={{ color: T.text }}>{pack.learningLoop.calibrationMetric}</div>
                  <div className="text-xs mb-1" style={{ color: T.textDim }}>Drift threshold: <span style={{ color: GOLD }}>{pack.learningLoop.driftThresholdPct}%</span></div>
                  <div className="text-xs" style={{ color: T.textDim }}>Recalibration: <span style={{ color: T.text }}>{pack.learningLoop.recalibrationTrigger}</span></div>
                </>
              ) : <div className="text-xs" style={{ color: T.textMuted }}>Not configured.</div>}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
