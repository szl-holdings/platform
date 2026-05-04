import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, ProgressBar, StatusBadge } from '../components/ui';
import { useUserTurnSignals, DoctrineLoader, type DoctrineUserTurnSignal } from '../hooks/useDoctrine';

const VERDICT_STATUS: Record<string, 'ok' | 'warn' | 'error' | 'info'> = {
  human: 'ok', 'likely-human': 'ok', uncertain: 'warn', 'likely-ai': 'error', ai: 'error',
};

const ACTION_LABEL: Record<string, string> = {
  pass: 'pass', 'soft-warn': 'soft-warn', 'block-and-reroute': 'block + reroute',
};

export function AIUserTurn() {
  const { data: signals, loading, error } = useUserTurnSignals();
  const items = signals ?? [];
  const flagged = items.filter((s: DoctrineUserTurnSignal) => s.recommendedAction !== 'pass').length;
  const blocked = items.filter((s: DoctrineUserTurnSignal) => s.recommendedAction === 'block-and-reroute').length;

  return (
    <Layout>
      <DoctrineLoader loading={loading} error={error}>
      <PageHeader
        label="DOCTRINE · AI USER-TURN DETECTOR"
        title="AI-Generated User-Turn Detector"
        subtitle="Approvals are checked for human authorship. Typing dynamics, perplexity, burstiness, and session context decide if the human-in-the-loop was actually human."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="APPROVALS CHECKED" value={items.length} sub="this window" accent="#c9b787" />
        <KpiCard label="FLAGGED" value={flagged} sub="non-pass verdict" accent="#8a8a8a" />
        <KpiCard label="BLOCKED" value={blocked} sub="re-routed for verification" accent="#c9b787" />
        <KpiCard label="SIGNALS / DECISION" value={4} sub="typing, perplexity, burst, ctx" accent="#c9b787" />
      </div>

      <SectionTitle>Recent Approval Checks</SectionTitle>
      <div className="flex flex-col gap-3">
        {items.map((s: DoctrineUserTurnSignal) => {
          const sig = s.signals;
          return (
          <Card key={s.signalId}>
            <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{s.signalId} · {s.approvalRef}</span>
                  <StatusBadge status={VERDICT_STATUS[s.verdict]} label={s.verdict.toUpperCase()} />
                  <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>
                    action: {ACTION_LABEL[s.recommendedAction]}
                  </span>
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{s.actor} — {s.actorRole}</div>
              </div>
              <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{new Date(s.submittedAt).toLocaleString()}</div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-44 flex-shrink-0" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Typing dynamics</span>
                <div className="flex-1"><ProgressBar value={Number(sig.typingDynamicsScore) * 100} /></div>
                <span className="font-mono w-10 text-right" style={{ color: 'var(--color-a11oy-text)' }}>{Math.round(Number(sig.typingDynamicsScore) * 100)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-44 flex-shrink-0" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Burstiness</span>
                <div className="flex-1"><ProgressBar value={Number(sig.burstinessScore) * 100} /></div>
                <span className="font-mono w-10 text-right" style={{ color: 'var(--color-a11oy-text)' }}>{Math.round(Number(sig.burstinessScore) * 100)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-44 flex-shrink-0" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Perplexity vs human corpus</span>
                <span className="font-mono" style={{ color: Number(sig.perplexityVsHumanCorpus) < 12 ? '#8a8a8a' : '#c9b787' }}>
                  {Number(sig.perplexityVsHumanCorpus).toFixed(1)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-44 flex-shrink-0" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Session context</span>
                <div className="flex-1"><ProgressBar value={Number(sig.sessionContextScore) * 100} /></div>
                <span className="font-mono w-10 text-right" style={{ color: 'var(--color-a11oy-text)' }}>{Math.round(Number(sig.sessionContextScore) * 100)}</span>
              </div>
            </div>
          </Card>
          );
        })}
      </div>
      </DoctrineLoader>
    </Layout>
  );
}
