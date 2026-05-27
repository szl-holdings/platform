/**
 * Browser-safe type declarations for the episodic-recall stage.
 *
 * These types are defined here (not in `staged-pipeline.ts`) so that
 * downstream modules like `episodic-scene.ts` — which are imported from
 * the browser-safe main barrel — can reference them without pulling in
 * `staged-pipeline.ts`'s transitive Node-only dependencies
 * (`@workspace/seeing-eye`, `node:crypto`).
 *
 * The runtime `runEpisodicRecall` lives in `staged-pipeline.ts`.
 */

export interface EpisodicRecallEpisode {
  readonly episodeId: string;
  readonly text: string;
  readonly occurredAt: string;
  readonly scope: string;
  readonly payload?: Readonly<Record<string, unknown>>;
}

export interface EpisodicRecallInput {
  readonly queryText: string;
  readonly scope: string;
  readonly episodes: ReadonlyArray<EpisodicRecallEpisode>;
  readonly now?: Date;
  readonly topK?: number;
  readonly halflifeDays?: number;
}

export interface EpisodicRecallHit {
  readonly episodeId: string;
  readonly scope: string;
  readonly payload?: Readonly<Record<string, unknown>>;
  readonly contentSim: number;
  readonly temporalSim: number;
  readonly fused: number;
}

export interface EpisodicRecallResult {
  readonly recallId: string;
  readonly fusionRule: 'sqrt(content*temporal)';
  readonly items: ReadonlyArray<EpisodicRecallHit>;
}
