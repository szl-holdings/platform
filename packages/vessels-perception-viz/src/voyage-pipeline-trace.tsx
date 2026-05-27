/**
 * Renders the per-stage Λ-receipts emitted by `runVoyagePipeline`.
 * Stateless — the caller passes the artefacts in (so server-side
 * voyages and client-side demos render identically).
 */

import type {
  PipelineResult,
  StageArtefact,
} from '@szl-holdings/sequence-pipeline';
import type { VoyageStageName } from './pipeline.js';

export interface VoyagePipelineStageView {
  readonly stageName: VoyageStageName;
  readonly stageOrdinal: number;
  readonly inputsHash: string;
  readonly outputsHash: string;
  readonly receiptClass: 'pipeline.stage.v1';
}

export interface VoyagePipelineTraceProps {
  readonly pipelineId: string;
  readonly stages: readonly StageArtefact<VoyageStageName>[];
  readonly accentColor?: string;
  readonly mutedColor?: string;
  readonly textColor?: string;
  readonly className?: string;
}

const STAGE_LABEL: Record<VoyageStageName, string> = {
  'ais-ingest': 'AIS Ingest',
  'identity-resolve': 'Identity Resolve',
  'risk-score': 'Risk Score',
  'policy-screen': 'Policy Screen',
  'ledger-commit': 'Ledger Commit',
};

export function VoyagePipelineTrace(props: VoyagePipelineTraceProps) {
  const {
    pipelineId,
    stages,
    accentColor = '#c9b787',
    mutedColor = '#6a6a6a',
    textColor = '#f5f5f5',
    className,
  } = props;

  return (
    <div
      className={className}
      data-component="voyage-pipeline-trace"
      data-pipeline-id={pipelineId}
      data-stage-count={stages.length}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: 12,
        background: 'rgba(10,20,25,0.65)',
        border: `1px solid ${accentColor}33`,
        fontFamily: 'DM Mono, monospace',
        fontSize: 11,
        color: textColor,
      }}
    >
      <div style={{ color: mutedColor, letterSpacing: '0.18em', fontSize: 9, textTransform: 'uppercase' }}>
        Λ-receipts · {pipelineId}
      </div>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {stages.map((s) => (
          <li
            key={`${s.stageOrdinal}-${s.stageName}`}
            data-stage-name={s.stageName}
            data-stage-ordinal={s.stageOrdinal}
            data-receipt-class={s.receiptClass}
            style={{
              display: 'grid',
              gridTemplateColumns: '22px 1fr auto',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              border: `1px solid ${accentColor}22`,
              background: 'rgba(10,20,25,0.55)',
            }}
          >
            <span style={{ color: accentColor }}>{s.stageOrdinal.toString().padStart(2, '0')}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span>{STAGE_LABEL[s.stageName] ?? s.stageName}</span>
              <span style={{ color: mutedColor, fontSize: 9 }}>
                in {s.inputsHash.slice(0, 10)}… → out {s.outputsHash.slice(0, 10)}…
              </span>
            </div>
            <span style={{ color: accentColor, fontSize: 9 }}>{s.receiptClass}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
