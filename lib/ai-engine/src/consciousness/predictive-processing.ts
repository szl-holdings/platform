export interface PredictionModel {
  queryTypeDistribution: Record<string, number>;
  domainAccessPatterns: Record<string, number>;
  agentUsageFrequency: Record<string, number>;
  avgQueryComplexity: number;
  totalPredictions: number;
  correctPredictions: number;
}

export interface Prediction {
  predictionId: string;
  predictedQueryType: string;
  predictedDomains: string[];
  predictedAgents: string[];
  confidence: number;
  timestamp: string;
}

export interface PredictionError {
  errorId: string;
  predictionId: string;
  predicted: { queryType: string; domains: string[] };
  actual: { queryType: string; domains: string[] };
  errorMagnitude: number;
  surpriseLevel: 'expected' | 'mild_surprise' | 'strong_surprise' | 'anomalous';
  learningSignal: string;
  timestamp: string;
}

export interface FreeEnergyState {
  currentFreeEnergy: number;
  predictionAccuracy: number;
  modelComplexity: number;
  surpriseHistory: Array<{ timestamp: string; surprise: number }>;
  worldModelAge: number;
  lastUpdateTimestamp: string;
}

export interface PredictiveProcessingState {
  model: PredictionModel;
  recentPredictions: Prediction[];
  recentErrors: PredictionError[];
  freeEnergy: FreeEnergyState;
  routingPriors: Record<string, number>;
}

const QUERY_TYPE_KEYWORDS: Record<string, string[]> = {
  security: [
    'threat',
    'vulnerability',
    'attack',
    'breach',
    'incident',
    'malware',
    'phishing',
    'cve',
  ],
  maritime: ['vessel', 'ship', 'port', 'cargo', 'fleet', 'ais', 'imo', 'maritime'],
  financial: ['fund', 'investment', 'revenue', 'portfolio', 'nav', 'irr', 'financial', 'budget'],
  legal: ['compliance', 'regulation', 'contract', 'litigation', 'statute', 'legal', 'lawsuit'],
  realestate: ['property', 'lease', 'tenant', 'building', 'real estate', 'cap rate', 'noi'],
  operational: ['infrastructure', 'deployment', 'performance', 'latency', 'uptime', 'sla'],
  intelligence: ['analysis', 'intelligence', 'pattern', 'trend', 'forecast', 'prediction'],
};

class PredictiveProcessingEngine {
  private model: PredictionModel = {
    queryTypeDistribution: {},
    domainAccessPatterns: {},
    agentUsageFrequency: {},
    avgQueryComplexity: 50,
    totalPredictions: 0,
    correctPredictions: 0,
  };
  private predictions: Prediction[] = [];
  private errors: PredictionError[] = [];
  private surpriseHistory: Array<{ timestamp: string; surprise: number }> = [];
  private freeEnergy = 0.5;
  private routingPriors: Record<string, number> = {};
  private modelCreatedAt = Date.now();
  private static readonly MAX_PREDICTIONS = 100;
  private static readonly MAX_ERRORS = 50;
  private static readonly MAX_SURPRISE_HISTORY = 100;
  private static readonly LEARNING_RATE = 0.05;

  predict(recentQueries: string[]): Prediction {
    const queryTypeScores: Record<string, number> = {};

    for (const [qtype, keywords] of Object.entries(QUERY_TYPE_KEYWORDS)) {
      let score = this.model.queryTypeDistribution[qtype] ?? 0;
      for (const q of recentQueries.slice(-3)) {
        const lower = q.toLowerCase();
        const matches = keywords.filter((k) => lower.includes(k)).length;
        score += matches * 0.2;
      }
      queryTypeScores[qtype] = score;
    }

    const sorted = Object.entries(queryTypeScores).sort((a, b) => b[1] - a[1]);
    const predictedType = sorted[0]?.[0] ?? 'general';
    const predictedDomains = sorted
      .slice(0, 3)
      .filter(([, s]) => s > 0)
      .map(([d]) => d);

    const predictedAgents: string[] = [];
    const agentEntries = Object.entries(this.model.agentUsageFrequency).sort((a, b) => b[1] - a[1]);
    for (const [agent, freq] of agentEntries.slice(0, 5)) {
      if (freq > 0) predictedAgents.push(agent);
    }

    const totalScore = sorted.reduce((s, [, v]) => s + v, 0);
    const topScore = sorted[0]?.[1] ?? 0;
    const confidence =
      totalScore > 0 ? Math.min(95, Math.round((topScore / totalScore) * 100)) : 30;

    const prediction: Prediction = {
      predictionId: `ppred_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      predictedQueryType: predictedType,
      predictedDomains: predictedDomains.length > 0 ? predictedDomains : ['general'],
      predictedAgents,
      confidence,
      timestamp: new Date().toISOString(),
    };

    this.predictions.push(prediction);
    if (this.predictions.length > PredictiveProcessingEngine.MAX_PREDICTIONS) {
      this.predictions.splice(
        0,
        this.predictions.length - PredictiveProcessingEngine.MAX_PREDICTIONS,
      );
    }

    this.model.totalPredictions++;
    return prediction;
  }

  recordOutcome(input: {
    predictionId: string;
    actualQueryType: string;
    actualDomains: string[];
    actualAgents: string[];
  }): PredictionError | null {
    const prediction = this.predictions.find((p) => p.predictionId === input.predictionId);
    if (!prediction) return null;

    const typeMatch = prediction.predictedQueryType === input.actualQueryType;
    const domainOverlap = prediction.predictedDomains.filter((d) =>
      input.actualDomains.includes(d),
    ).length;
    const domainAccuracy =
      input.actualDomains.length > 0 ? domainOverlap / input.actualDomains.length : 0;

    const errorMagnitude = 1 - (typeMatch ? 0.5 : 0) - domainAccuracy * 0.5;

    let surpriseLevel: PredictionError['surpriseLevel'];
    if (errorMagnitude < 0.2) surpriseLevel = 'expected';
    else if (errorMagnitude < 0.4) surpriseLevel = 'mild_surprise';
    else if (errorMagnitude < 0.7) surpriseLevel = 'strong_surprise';
    else surpriseLevel = 'anomalous';

    if (errorMagnitude < 0.3) {
      this.model.correctPredictions++;
    }

    const lr = PredictiveProcessingEngine.LEARNING_RATE;

    for (const domain of input.actualDomains) {
      this.model.domainAccessPatterns[domain] =
        (this.model.domainAccessPatterns[domain] ?? 0) * (1 - lr) + lr;
    }
    this.model.queryTypeDistribution[input.actualQueryType] =
      (this.model.queryTypeDistribution[input.actualQueryType] ?? 0) * (1 - lr) + lr;
    for (const agent of input.actualAgents) {
      this.model.agentUsageFrequency[agent] =
        (this.model.agentUsageFrequency[agent] ?? 0) * (1 - lr) + lr;
    }

    for (const domain of input.actualDomains) {
      this.routingPriors[domain] = (this.routingPriors[domain] ?? 0.5) * (1 - lr) + lr;
    }
    for (const key of Object.keys(this.routingPriors)) {
      if (!input.actualDomains.includes(key)) {
        this.routingPriors[key] = (this.routingPriors[key] ?? 0.5) * (1 - lr * 0.5);
      }
    }

    this.freeEnergy = this.freeEnergy * (1 - lr * 2) + errorMagnitude * lr * 2;

    this.surpriseHistory.push({ timestamp: new Date().toISOString(), surprise: errorMagnitude });
    if (this.surpriseHistory.length > PredictiveProcessingEngine.MAX_SURPRISE_HISTORY) {
      this.surpriseHistory.splice(
        0,
        this.surpriseHistory.length - PredictiveProcessingEngine.MAX_SURPRISE_HISTORY,
      );
    }

    const learningSignals: string[] = [];
    if (!typeMatch)
      learningSignals.push(
        `Query type mismatch: predicted ${prediction.predictedQueryType}, actual ${input.actualQueryType}`,
      );
    if (domainAccuracy < 0.5)
      learningSignals.push(
        `Domain routing inaccuracy: only ${(domainAccuracy * 100).toFixed(0)}% overlap`,
      );
    if (surpriseLevel === 'anomalous')
      learningSignals.push('Anomalous query pattern — consider expanding world model');

    const error: PredictionError = {
      errorId: `perr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      predictionId: input.predictionId,
      predicted: { queryType: prediction.predictedQueryType, domains: prediction.predictedDomains },
      actual: { queryType: input.actualQueryType, domains: input.actualDomains },
      errorMagnitude,
      surpriseLevel,
      learningSignal: learningSignals.join('; ') || 'Prediction matched — no update needed',
      timestamp: new Date().toISOString(),
    };

    this.errors.push(error);
    if (this.errors.length > PredictiveProcessingEngine.MAX_ERRORS) {
      this.errors.splice(0, this.errors.length - PredictiveProcessingEngine.MAX_ERRORS);
    }

    return error;
  }

  getRoutingPriors(): Record<string, number> {
    return { ...this.routingPriors };
  }

  getState(): PredictiveProcessingState {
    const accuracy =
      this.model.totalPredictions > 0
        ? this.model.correctPredictions / this.model.totalPredictions
        : 0.5;

    return {
      model: { ...this.model },
      recentPredictions: this.predictions.slice(-10).reverse(),
      recentErrors: this.errors.slice(-10).reverse(),
      freeEnergy: {
        currentFreeEnergy: this.freeEnergy,
        predictionAccuracy: accuracy,
        modelComplexity:
          Object.keys(this.model.queryTypeDistribution).length +
          Object.keys(this.model.domainAccessPatterns).length,
        surpriseHistory: this.surpriseHistory.slice(-20),
        worldModelAge: Date.now() - this.modelCreatedAt,
        lastUpdateTimestamp:
          this.errors.length > 0
            ? this.errors[this.errors.length - 1]!.timestamp
            : new Date().toISOString(),
      },
      routingPriors: { ...this.routingPriors },
    };
  }

  buildPredictiveContext(): string {
    const state = this.getState();
    if (state.model.totalPredictions === 0) return '';

    const lines = [
      `## Predictive Processing`,
      `Free energy: ${(state.freeEnergy.currentFreeEnergy * 100).toFixed(0)}% | Accuracy: ${(state.freeEnergy.predictionAccuracy * 100).toFixed(0)}%`,
      `Predictions: ${state.model.totalPredictions} (${state.model.correctPredictions} correct)`,
    ];

    const topDomains = Object.entries(state.routingPriors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    if (topDomains.length > 0) {
      lines.push(
        `Routing priors: ${topDomains.map(([d, v]) => `${d}=${(v * 100).toFixed(0)}%`).join(', ')}`,
      );
    }

    const recentSurprise = state.freeEnergy.surpriseHistory.slice(-5);
    if (recentSurprise.length > 0) {
      const avgSurprise =
        recentSurprise.reduce((s, h) => s + h.surprise, 0) / recentSurprise.length;
      if (avgSurprise > 0.5) {
        lines.push(
          `⚠ Elevated surprise (${(avgSurprise * 100).toFixed(0)}%) — world model may need updating`,
        );
      }
    }

    return lines.join('\n');
  }
}

export const predictiveProcessing = new PredictiveProcessingEngine();
