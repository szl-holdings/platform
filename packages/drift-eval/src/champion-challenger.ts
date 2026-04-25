import type {
  ChampionChallengerResult,
  EvalRegistry,
  ModelSnapshot,
} from './types.js';
import { ChampionChallengerResultSchema } from './types.js';

function generateId(): string {
  return `cc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function primaryMetricValue(snapshot: ModelSnapshot): { metric: string; value: number } | null {
  const m = snapshot.metrics;
  if (m.calibrationScore !== undefined) return { metric: 'calibrationScore', value: m.calibrationScore };
  if (m.mape !== undefined) return { metric: 'mape', value: -m.mape };
  if (m.mae !== undefined) return { metric: 'mae', value: -m.mae };
  if (m.rmse !== undefined) return { metric: 'rmse', value: -m.rmse };
  return null;
}

export async function runChampionChallenger(
  headName: string,
  champion: ModelSnapshot,
  challenger: ModelSnapshot,
  registry: EvalRegistry,
): Promise<ChampionChallengerResult> {
  const champPrimary = primaryMetricValue(champion);
  const challPrimary = primaryMetricValue(challenger);

  let outcome: ChampionChallengerResult['outcome'] = 'insufficient-data';
  let improvementDelta: number | undefined;
  let winnerModelId: string | undefined;
  let primaryMetric = 'unknown';
  let confidence = 0.5;

  const minSamples = 30;
  const hasSufficientData =
    champion.sampleCount >= minSamples && challenger.sampleCount >= minSamples;

  if (hasSufficientData && champPrimary && challPrimary) {
    primaryMetric = champPrimary.metric;
    improvementDelta = challPrimary.value - champPrimary.value;
    const relativeDelta = Math.abs(improvementDelta) / (Math.abs(champPrimary.value) || 1);

    if (relativeDelta < 0.02) {
      outcome = 'tie';
      confidence = 0.6;
    } else if (improvementDelta > 0) {
      outcome = 'challenger';
      winnerModelId = challenger.modelId;
      confidence = Math.min(0.99, 0.5 + relativeDelta * 2);
    } else {
      outcome = 'champion';
      winnerModelId = champion.modelId;
      confidence = Math.min(0.99, 0.5 + relativeDelta * 2);
    }
  }

  const result = ChampionChallengerResultSchema.parse({
    id: generateId(),
    headName,
    evaluatedAt: new Date().toISOString(),
    champion,
    challenger,
    outcome,
    winnerModelId,
    improvementDelta,
    confidenceLevel: confidence,
    sampleCount: Math.min(champion.sampleCount, challenger.sampleCount),
    primaryMetric,
    notes: hasSufficientData
      ? `Evaluated on ${primaryMetric}; outcome: ${outcome}`
      : 'Insufficient sample count for conclusive evaluation',
  });

  await registry.persist({ type: 'champion-challenger', payload: result });
  return result;
}
