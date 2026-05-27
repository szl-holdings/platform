/**
 * Wraps the voyage evidence flow in a `StagedPipeline` so every voyage
 * emits per-stage Λ-receipts (ais-ingest → identity-resolve → risk-
 * score → policy-screen → ledger-commit). Pure helper — no React, no
 * I/O. The Vessels surface renders the emitted artefacts via
 * `<VoyagePipelineTrace>`; downstream the same artefacts can be
 * appended to the evidence-ledger.
 */

import {
  StagedPipeline,
  type PipelineResult,
  type StageDefinition,
} from '@szl-holdings/sequence-pipeline';

export type VoyageStageName =
  | 'ais-ingest'
  | 'identity-resolve'
  | 'risk-score'
  | 'policy-screen'
  | 'ledger-commit';

export interface VoyagePipelineInput {
  readonly voyageRef: string;
  readonly imo: string;
  readonly aisPoints: number;
  readonly counterpartyIds: readonly string[];
  readonly sanctionsListVersion: string;
}

export interface VoyagePipelineFinal {
  readonly voyageRef: string;
  readonly riskScore: number;
  readonly counterpartyMatches: number;
  readonly cleared: boolean;
}

/** djb2 — deterministic, dependency-free. Vessels prod swaps this for
 *  a real digest before commit. */
function djb2(value: unknown): string {
  const json = JSON.stringify(value) ?? '';
  let h = 5381;
  for (let i = 0; i < json.length; i++) {
    h = ((h << 5) + h + json.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export interface VoyagePipelineResult
  extends PipelineResult<VoyageStageName, VoyagePipelineFinal> {}

export async function runVoyagePipeline(
  input: VoyagePipelineInput,
): Promise<VoyagePipelineResult> {
  const pipeline = new StagedPipeline({
    pipelineId: `voyage:${input.voyageRef}`,
    tooling: {
      runner: 'vessels-perception-viz@0.1',
      sanctionsList: input.sanctionsListVersion,
    },
    hash: djb2,
  });

  const stages: StageDefinition<VoyageStageName, unknown, unknown>[] = [
    {
      name: 'ais-ingest',
      params: { source: 'terrestrial+satellite' },
      run: (raw) => ({ ingested: raw }),
    },
    {
      name: 'identity-resolve',
      params: { resolver: 'imo+mmsi-fuzz' },
      run: () => ({
        resolved: input.imo,
        counterpartiesResolved: input.counterpartyIds.length,
      }),
    },
    {
      name: 'risk-score',
      params: { weights: { aisGap: 1, ubo: 1.2, route: 0.8 } },
      run: () => {
        // Deterministic score from the input — no Math.random.
        const base = Math.min(1, input.aisPoints / 5000);
        const cpFactor = Math.min(1, input.counterpartyIds.length / 8);
        const score = Math.round((0.45 * base + 0.55 * cpFactor) * 100) / 100;
        return { riskScore: score };
      },
    },
    {
      name: 'policy-screen',
      params: { lists: ['OFAC', 'OFSI', 'EU'] },
      run: (prev) => {
        const score = (prev as { riskScore: number }).riskScore;
        return {
          riskScore: score,
          counterpartyMatches: input.counterpartyIds.filter((id) =>
            id.toUpperCase().includes('SDN'),
          ).length,
        };
      },
    },
    {
      name: 'ledger-commit',
      params: { ledger: 'szl://vessels/evidence' },
      run: (prev) => {
        const p = prev as { riskScore: number; counterpartyMatches: number };
        return {
          voyageRef: input.voyageRef,
          riskScore: p.riskScore,
          counterpartyMatches: p.counterpartyMatches,
          cleared: p.riskScore < 0.7 && p.counterpartyMatches === 0,
        } satisfies VoyagePipelineFinal;
      },
    },
  ];

  const result = await pipeline.run<VoyageStageName, VoyagePipelineInput, VoyagePipelineFinal>(
    input,
    stages,
  );
  return result;
}
