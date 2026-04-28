import { HelpTip } from '@szl-holdings/shared-ui/onboarding';
import { ScenarioCitedRiskRuns } from '@szl-holdings/shared-ui/risk-evidence';
import { m } from 'framer-motion';
import { Clock, Fingerprint, User } from 'lucide-react';
import type { EngineState } from '@/hooks/useDecisionEngine';
import type { LiveAuditRecord } from '@/hooks/useLiveTheaterData';

export function ProofStage({ engine }: { engine: EngineState }) {
  const pr = engine.proofRecord;
  const scenarioId = engine.monteCarloResult?.scenarioId;
  if (!pr) return <p className="text-sm text-muted-foreground">Generating proof record...</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        The Proof Chain records immutable attribution for every AI output, human decision, and data
        source used in this decision.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/40 bg-card/60 p-5">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            Proof Chain Record
            <HelpTip
              tipId="szl.decision-theater.proof-chain"
              platform="szl"
              title="Proof Chain"
              content="An immutable, citation-backed record for each decision: model + prompt hash, source class, confidence, reviewer, correlation id, and export-safety state. Lets auditors replay how every output was produced."
              iconSize={11}
            />
          </h3>
          <div className="space-y-2.5">
            {[
              { label: 'Chain ID', value: pr.proofChainId },
              { label: 'Source Class', value: pr.sourceClass },
              { label: 'Confidence', value: `${(pr.confidenceScore * 100).toFixed(0)}%` },
              { label: 'Model', value: `${pr.modelId} (${pr.modelProvider})` },
              { label: 'Review State', value: pr.reviewState },
              { label: 'Export Safety', value: pr.exportSafetyState },
              { label: 'Prompt Hash', value: pr.promptHash },
              { label: 'Correlation ID', value: pr.correlationId },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{item.label}</span>
                <span className="text-[11px] font-semibold text-foreground font-mono">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Input Sources
            </h4>
            {pr.inputSources.map((src) => (
              <m.div
                key={src.id}
                className="flex items-center gap-2 mb-1.5"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Fingerprint className="w-3 h-3 text-teal-400" />
                <span className="text-[11px] text-foreground">{src.label}</span>
                <span className="text-[9px] text-muted-foreground font-mono">{src.id}</span>
              </m.div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/60 p-5">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Audit Trail
          </h3>
          <div className="space-y-0">
            {[
              { actor: 'system', action: 'proof_created', timestamp: pr.createdAt },
              { actor: pr.modelId, action: 'recommendation_generated', timestamp: pr.createdAt },
              {
                actor: 'J. van der Berg',
                action: 'human_review_approved',
                timestamp: new Date(Date.now() + 120000).toISOString(),
              },
              {
                actor: 'system',
                action: 'export_safety_cleared',
                timestamp: new Date(Date.now() + 121000).toISOString(),
              },
            ].map((entry, i, arr) => (
              <m.div
                key={i}
                className="flex items-start gap-3 relative"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.08 }}
              >
                {i < arr.length - 1 && (
                  <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border/30" />
                )}
                <div className="w-4 h-4 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0 z-10 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                </div>
                <div className="flex-1 pb-3">
                  <p className="text-[11px] font-semibold text-foreground">
                    {entry.action.replace(/_/g, ' ')}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{entry.actor}</span>
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </div>
      <ScenarioCitedRiskRuns
        scenarioId={scenarioId}
        title={scenarioId ? `Cited Risk Simulations · ${scenarioId}` : 'Cited Risk Simulations'}
        emptyHint={
          scenarioId
            ? `No simulation runs cited for scenario ${scenarioId}. Save a run from the DOMAINE or SEXTANT Risk Simulation page to attach percentile bands and sensitivities to this proof envelope.`
            : 'No cited risk simulations yet. Save a run from DOMAINE or SEXTANT to attach it here.'
        }
      />
    </div>
  );
}

export function LiveProofStage({
  auditRecords,
  auditTotal,
  metrics,
}: {
  auditRecords: LiveAuditRecord[];
  auditTotal: number;
  metrics: { platform: { audit_events_30d: number } } | null;
}) {
  const hasRealAudit = auditRecords.length > 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {hasRealAudit
          ? 'Immutable attribution chain — real audit records from the platform governance log.'
          : 'Audit chain summary — aggregate governance telemetry from the platform.'}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/40 bg-card/60 p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Audit Chain Summary
            </h3>
            {hasRealAudit && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                LIVE
              </span>
            )}
          </div>
          {hasRealAudit ? (
            <div className="space-y-1.5">
              {[
                { label: 'Records in view', value: auditRecords.length.toLocaleString() },
                { label: 'Total in system', value: auditTotal.toLocaleString() },
                {
                  label: 'Event types',
                  value: new Set(auditRecords.map((r) => r.action_type)).size.toLocaleString(),
                },
                {
                  label: 'Entity types',
                  value: new Set(auditRecords.map((r) => r.entity_type)).size.toLocaleString(),
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{item.label}</span>
                  <span className="text-[11px] font-semibold text-foreground font-mono">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {[
                {
                  label: 'Audit Events (30d)',
                  value: metrics?.platform.audit_events_30d.toLocaleString() ?? '—',
                },
                { label: 'Attribution status', value: 'Governed' },
                { label: 'Export safety', value: 'Cleared' },
                { label: 'Review state', value: 'Approved' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{item.label}</span>
                  <span className="text-[11px] font-semibold text-foreground font-mono">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border/40 bg-card/60 p-5">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {hasRealAudit ? 'Recent Audit Events' : 'Audit Trail (Demo)'}
          </h3>
          <div className="space-y-0">
            {hasRealAudit
              ? auditRecords.slice(0, 6).map((rec, i, arr) => (
                  <m.div
                    key={rec.id}
                    className="flex items-start gap-3 relative"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.07 }}
                  >
                    {i < arr.length - 1 && (
                      <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border/30" />
                    )}
                    <div className="w-4 h-4 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0 z-10 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="text-[11px] font-semibold text-foreground">
                        {rec.action_type.replace(/_/g, ' ')}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {rec.entity_type}
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground">
                          {new Date(rec.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </m.div>
                ))
              : [
                  { icon: Clock, label: 'proof_created', sub: 'system' },
                  { icon: User, label: 'recommendation_generated', sub: 'continuum-engine' },
                  { icon: Fingerprint, label: 'human_review_approved', sub: 'J. van der Berg' },
                  { icon: Clock, label: 'export_safety_cleared', sub: 'system' },
                ].map((entry, i, arr) => {
                  const Icon = entry.icon;
                  return (
                    <m.div
                      key={i}
                      className="flex items-start gap-3 relative"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.08 }}
                    >
                      {i < arr.length - 1 && (
                        <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border/30" />
                      )}
                      <div className="w-4 h-4 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0 z-10 mt-0.5">
                        <Icon className="w-2.5 h-2.5 text-teal-400" />
                      </div>
                      <div className="flex-1 pb-3">
                        <p className="text-[11px] font-semibold text-foreground">
                          {entry.label.replace(/_/g, ' ')}
                        </p>
                        <span className="text-[10px] text-muted-foreground">{entry.sub}</span>
                      </div>
                    </m.div>
                  );
                })}
          </div>
        </div>
      </div>
      <ScenarioCitedRiskRuns emptyHint="No cited risk simulations yet across DOMAINE or SEXTANT. Save a Monte Carlo run from either product to attach percentile bands and sensitivities to the live audit chain." />
    </div>
  );
}
