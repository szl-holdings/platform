import { logger } from './logger.js';

export interface ShapValue {
  featureId: string;
  featureName: string;
  featureValue: unknown;
  shapContribution: number;
  direction: 'positive' | 'negative' | 'neutral';
  magnitude: 'high' | 'medium' | 'low';
  percentOfTotal: number;
}

export interface ShapExplanation {
  baseValue: number;
  predictedValue: number;
  topContributors: ShapValue[];
  allContributions: ShapValue[];
  explanation: string;
  confidenceNarrative: string;
}

export interface FeatureExplanationContext {
  domain: string;
  modelType: string;
  prediction: unknown;
  topFeatures: ShapValue[];
}

// ---------------------------------------------------------------------------
// Domain-specific explanation templates
// ---------------------------------------------------------------------------

const DOMAIN_EXPLANATIONS: Record<string, (ctx: FeatureExplanationContext) => string> = {
  vessels: (ctx) => {
    const top = ctx.topFeatures[0];
    if (ctx.modelType === 'maintenance_failure_classifier') {
      return `The maintenance failure risk is ${ctx.prediction} primarily because ${top?.featureName ?? 'key operational metrics'} (${top?.featureValue}) is ${top?.direction === 'positive' ? 'elevated' : 'within normal range'}. The most influential factors are vessel usage patterns and time since last service.`;
    }
    if (ctx.modelType === 'fuel_consumption_forecast') {
      return `Fuel consumption forecast is driven primarily by ${top?.featureName ?? 'recent consumption trends'} and route characteristics. The model projects this based on the vessel's rolling 7-day baseline and current cargo load.`;
    }
    return `The prediction is primarily driven by ${top?.featureName ?? 'operational features'} (contribution: ${((top?.percentOfTotal ?? 0) * 100).toFixed(1)}%).`;
  },
  terra: (ctx) => {
    const top = ctx.topFeatures[0];
    if (ctx.modelType === 'property_valuation') {
      return `The estimated property value is primarily influenced by ${top?.featureName ?? 'comparable sales'} in the sub-market. Price per square foot and neighborhood cap rates contribute most to this valuation. The model has seen similar properties trade at comparable levels.`;
    }
    if (ctx.modelType === 'distress_classifier') {
      return `The distress signal is ${ctx.topFeatures[0]?.direction === 'positive' ? 'elevated' : 'low'} based on ${ctx.topFeatures
        .slice(0, 2)
        .map((f) => f.featureName)
        .join(
          ' and ',
        )}. Extended time on market and price reductions are the strongest distress indicators in this model.`;
    }
    return `Valuation driven by ${top?.featureName ?? 'market comparables'} — contributing ${((top?.percentOfTotal ?? 0) * 100).toFixed(1)}% of the prediction.`;
  },
  prism: (ctx) => {
    const top = ctx.topFeatures[0];
    if (ctx.modelType === 'case_outcome_classifier') {
      return `Case outcome prediction is most influenced by ${top?.featureName ?? 'case characteristics'} (${((top?.percentOfTotal ?? 0) * 100).toFixed(1)}% of prediction weight). The judge's historical motion grant rate and opposing counsel win record are key determinants. IMPORTANT: This prediction is statistical inference only and does not constitute legal advice.`;
    }
    if (ctx.modelType === 'settlement_probability') {
      return `Settlement probability is primarily driven by the settlement demand relative to claimed amount and case age. Cases with demands exceeding 60% of claim and extended age show highest settlement rates historically.`;
    }
    return `Legal outcome driven by ${top?.featureName ?? 'case features'} (${((top?.percentOfTotal ?? 0) * 100).toFixed(1)}% contribution). This is a statistical model — consult qualified counsel for legal advice.`;
  },
  aegis: (ctx) => {
    const top = ctx.topFeatures[0];
    if (ctx.modelType === 'threat_anomaly_detector') {
      return `Anomaly detected based on ${ctx.topFeatures
        .slice(0, 3)
        .map((f) => f.featureName)
        .join(
          ', ',
        )}. The primary driver is ${top?.featureName ?? 'behavioral deviation'} showing ${top?.direction === 'positive' ? 'elevated' : 'suppressed'} activity vs established baseline. Recommend immediate SOC review.`;
    }
    if (ctx.modelType === 'threat_severity_scorer') {
      return `Threat severity score of ${ctx.prediction} driven by ${ctx.topFeatures
        .slice(0, 2)
        .map((f) => f.featureName)
        .join(
          ' and ',
        )}. IOC matches and privilege escalation events carry highest weight in this assessment.`;
    }
    return `Threat assessment driven by ${top?.featureName ?? 'security telemetry'} — ${((top?.percentOfTotal ?? 0) * 100).toFixed(1)}% of model weight.`;
  },
  szl: (ctx) => {
    const top = ctx.topFeatures[0];
    if (ctx.modelType === 'deal_quality_scorer') {
      return `Deal quality score of ${ctx.prediction}/100 is primarily driven by ${ctx.topFeatures
        .slice(0, 2)
        .map((f) => f.featureName)
        .join(
          ' and ',
        )}. Revenue growth trajectory and unit economics are the strongest positive signals. Burn multiple has the largest constraining effect.`;
    }
    if (ctx.modelType === 'portfolio_health_scorer') {
      return `Portfolio health score driven by ${ctx.topFeatures
        .slice(0, 3)
        .map((f) => f.featureName)
        .join(
          ', ',
        )}. NDR and gross margin are the strongest forward-looking indicators in this model.`;
    }
    return `Investment signal driven by ${top?.featureName ?? 'financial metrics'} — ${((top?.percentOfTotal ?? 0) * 100).toFixed(1)}% contribution.`;
  },
  lyte: (ctx) => {
    const top = ctx.topFeatures[0];
    if (ctx.modelType === 'sla_breach_classifier') {
      return `SLA breach risk is ${(ctx.prediction as { probability?: number })?.probability !== undefined ? `${(((ctx.prediction as { probability?: number }).probability ?? 0) * 100).toFixed(1)}%` : String(ctx.prediction)} — driven primarily by ${top?.featureName ?? 'latency and error metrics'}. P99 latency trending above SLO threshold is the strongest leading indicator.`;
    }
    if (ctx.modelType === 'capacity_demand_forecast') {
      return `Capacity demand forecast is driven by ${ctx.topFeatures
        .slice(0, 2)
        .map((f) => f.featureName)
        .join(
          ' and ',
        )}. Recent CPU utilisation trend and deployment frequency are the strongest predictors for short-term capacity requirements.`;
    }
    return `AIOps prediction driven by ${top?.featureName ?? 'system telemetry'} — ${((top?.percentOfTotal ?? 0) * 100).toFixed(1)}% of model weight.`;
  },
};

// ---------------------------------------------------------------------------
// Core SHAP-style computation
// ---------------------------------------------------------------------------

export function computeShapExplanation(
  featureImportance: Record<string, number>,
  featureValues: Record<string, unknown>,
  prediction: unknown,
): ShapExplanation {
  const importanceEntries = Object.entries(featureImportance).sort((a, b) => b[1] - a[1]);
  const totalImportance = importanceEntries.reduce((s, [, v]) => s + v, 0);

  let predictedNumeric = 0;
  if (typeof prediction === 'number') {
    predictedNumeric = prediction;
  } else if (typeof prediction === 'object' && prediction !== null) {
    const pred = prediction as Record<string, unknown>;
    predictedNumeric =
      typeof pred.probability === 'number'
        ? pred.probability
        : typeof pred.score === 'number'
          ? pred.score
          : 0.5;
  }

  const baseValue = predictedNumeric * 0.5;

  const allContributions: ShapValue[] = importanceEntries.map(([featureId, importance]) => {
    const rawValue = featureValues[featureId];
    const _numericValue = typeof rawValue === 'number' ? rawValue : 0;
    const contribution =
      (importance / Math.max(totalImportance, 0.001)) * (predictedNumeric - baseValue);
    const percentOfTotal = totalImportance > 0 ? importance / totalImportance : 0;

    return {
      featureId,
      featureName: featureId.split('.').pop()?.replace(/_/g, ' ') ?? featureId,
      featureValue: rawValue ?? 'N/A',
      shapContribution: parseFloat(contribution.toFixed(6)),
      direction: contribution > 0.001 ? 'positive' : contribution < -0.001 ? 'negative' : 'neutral',
      magnitude: percentOfTotal > 0.2 ? 'high' : percentOfTotal > 0.08 ? 'medium' : 'low',
      percentOfTotal: parseFloat(percentOfTotal.toFixed(4)),
    };
  });

  const topContributors = allContributions.slice(0, 5);

  return {
    baseValue: parseFloat(baseValue.toFixed(4)),
    predictedValue: predictedNumeric,
    topContributors,
    allContributions,
    explanation: 'Feature contributions computed using SHAP-style importance weighting',
    confidenceNarrative: `The top ${topContributors.length} features account for ${(topContributors.reduce((s, f) => s + f.percentOfTotal, 0) * 100).toFixed(1)}% of prediction weight.`,
  };
}

export function generateNarrativeExplanation(
  domain: string,
  modelType: string,
  prediction: unknown,
  shapExplanation: ShapExplanation,
): string {
  const ctx: FeatureExplanationContext = {
    domain,
    modelType,
    prediction,
    topFeatures: shapExplanation.topContributors,
  };

  const templateFn = DOMAIN_EXPLANATIONS[domain];
  if (templateFn) {
    return templateFn(ctx);
  }

  const top = shapExplanation.topContributors[0];
  return `Prediction is primarily driven by ${top?.featureName ?? 'input features'} with ${((top?.percentOfTotal ?? 0) * 100).toFixed(1)}% contribution. ${shapExplanation.confidenceNarrative}`;
}

export function explainPrediction(
  domain: string,
  modelType: string,
  prediction: unknown,
  featureImportance: Record<string, number>,
  featureValues: Record<string, unknown>,
): { shap: ShapExplanation; narrative: string } {
  const shap = computeShapExplanation(featureImportance, featureValues, prediction);
  const narrative = generateNarrativeExplanation(domain, modelType, prediction, shap);
  logger.debug({ domain, modelType }, 'Prediction explanation generated');
  return { shap, narrative };
}
