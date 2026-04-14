export type EmotionType =
  | "confidence"
  | "urgency"
  | "uncertainty"
  | "satisfaction"
  | "frustration"
  | "curiosity"
  | "caution"
  | "alertness";

export interface EmotionalSignal {
  signalId: string;
  emotion: EmotionType;
  intensity: number;
  trigger: string;
  timestamp: string;
  decayRate: number;
  effectiveIntensity: number;
}

export interface EmotionalValence {
  positive: number;
  negative: number;
  arousal: number;
  dominantEmotion: EmotionType;
  emotionalStability: number;
}

export interface EmotionalState {
  activeSignals: EmotionalSignal[];
  valence: EmotionalValence;
  moodTrajectory: "improving" | "stable" | "declining";
  emotionalHistory: Array<{ timestamp: string; valence: number; arousal: number }>;
}

const EMOTION_VALENCE: Record<EmotionType, { positive: number; arousal: number }> = {
  confidence: { positive: 0.8, arousal: 0.3 },
  urgency: { positive: -0.2, arousal: 0.9 },
  uncertainty: { positive: -0.4, arousal: 0.5 },
  satisfaction: { positive: 0.9, arousal: 0.2 },
  frustration: { positive: -0.7, arousal: 0.7 },
  curiosity: { positive: 0.5, arousal: 0.6 },
  caution: { positive: -0.1, arousal: 0.4 },
  alertness: { positive: 0.1, arousal: 0.8 },
};

class EmotionalSignalEngine {
  private signals: EmotionalSignal[] = [];
  private history: Array<{ timestamp: string; valence: number; arousal: number }> = [];
  private static readonly MAX_SIGNALS = 100;
  private static readonly MAX_HISTORY = 200;

  emit(emotion: EmotionType, intensity: number, trigger: string): EmotionalSignal {
    const signal: EmotionalSignal = {
      signalId: `emo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      emotion,
      intensity: Math.max(0, Math.min(1, intensity)),
      trigger,
      timestamp: new Date().toISOString(),
      decayRate: 0.02,
      effectiveIntensity: Math.max(0, Math.min(1, intensity)),
    };

    this.signals.push(signal);
    if (this.signals.length > EmotionalSignalEngine.MAX_SIGNALS) {
      this.signals.splice(0, this.signals.length - EmotionalSignalEngine.MAX_SIGNALS);
    }

    const valence = this.computeValence();
    this.history.push({
      timestamp: signal.timestamp,
      valence: valence.positive - valence.negative,
      arousal: valence.arousal,
    });
    if (this.history.length > EmotionalSignalEngine.MAX_HISTORY) {
      this.history.splice(0, this.history.length - EmotionalSignalEngine.MAX_HISTORY);
    }

    return signal;
  }

  emitFromOrchestration(input: {
    avgConfidence: number;
    conflictCount: number;
    isHighStakes: boolean;
    validationPassed: boolean;
    latencyMs: number;
    knowledgeGapCount: number;
  }): EmotionalSignal[] {
    const emitted: EmotionalSignal[] = [];

    if (input.avgConfidence > 80 && input.validationPassed) {
      emitted.push(this.emit("confidence", 0.8, "High-confidence validated orchestration"));
      emitted.push(this.emit("satisfaction", 0.7, "Successful multi-agent coordination"));
    } else if (input.avgConfidence < 40) {
      emitted.push(this.emit("uncertainty", 0.7, `Low average confidence: ${input.avgConfidence.toFixed(0)}%`));
    }

    if (input.conflictCount >= 2) {
      emitted.push(this.emit("frustration", Math.min(1, input.conflictCount * 0.25), `${input.conflictCount} agent conflicts`));
    }

    if (input.isHighStakes) {
      emitted.push(this.emit("alertness", 0.8, "High-stakes decision context"));
      emitted.push(this.emit("caution", 0.6, "Enhanced scrutiny mode for high-stakes query"));
    }

    if (input.latencyMs > 30000) {
      emitted.push(this.emit("urgency", 0.6, `High latency: ${(input.latencyMs / 1000).toFixed(1)}s`));
    }

    if (input.knowledgeGapCount > 0) {
      emitted.push(this.emit("curiosity", Math.min(1, input.knowledgeGapCount * 0.3), `${input.knowledgeGapCount} knowledge gaps detected`));
    }

    return emitted;
  }

  computeValence(): EmotionalValence {
    const now = Date.now();
    const activeWindow = 5 * 60 * 1000;
    const active = this.signals.filter(s => now - new Date(s.timestamp).getTime() < activeWindow);

    if (active.length === 0) {
      return { positive: 0.5, negative: 0, arousal: 0.2, dominantEmotion: "confidence", emotionalStability: 1 };
    }

    for (const s of active) {
      const ageMs = now - new Date(s.timestamp).getTime();
      s.effectiveIntensity = s.intensity * Math.exp(-s.decayRate * (ageMs / 60000));
    }

    let positiveSum = 0;
    let negativeSum = 0;
    let arousalSum = 0;
    let totalWeight = 0;

    for (const s of active) {
      const v = EMOTION_VALENCE[s.emotion];
      const weight = s.effectiveIntensity;
      if (v.positive > 0) positiveSum += v.positive * weight;
      else negativeSum += Math.abs(v.positive) * weight;
      arousalSum += v.arousal * weight;
      totalWeight += weight;
    }

    const norm = Math.max(1, totalWeight);
    const positive = positiveSum / norm;
    const negative = negativeSum / norm;
    const arousal = arousalSum / norm;

    const dominant = active.sort((a, b) => b.effectiveIntensity - a.effectiveIntensity)[0]!;

    const recentValences = this.history.slice(-10).map(h => h.valence);
    const variance = recentValences.length > 1
      ? recentValences.reduce((s, v) => {
          const mean = recentValences.reduce((a, b) => a + b, 0) / recentValences.length;
          return s + (v - mean) ** 2;
        }, 0) / recentValences.length
      : 0;
    const stability = Math.max(0, 1 - Math.sqrt(variance));

    return { positive, negative, arousal, dominantEmotion: dominant.emotion, emotionalStability: stability };
  }

  getState(): EmotionalState {
    const valence = this.computeValence();
    const recent = this.history.slice(-10);
    let trajectory: EmotionalState["moodTrajectory"] = "stable";
    if (recent.length >= 4) {
      const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
      const secondHalf = recent.slice(Math.floor(recent.length / 2));
      const avgFirst = firstHalf.reduce((s, h) => s + h.valence, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((s, h) => s + h.valence, 0) / secondHalf.length;
      if (avgSecond > avgFirst + 0.1) trajectory = "improving";
      else if (avgSecond < avgFirst - 0.1) trajectory = "declining";
    }

    return {
      activeSignals: this.signals.slice(-20).reverse(),
      valence,
      moodTrajectory: trajectory,
      emotionalHistory: this.history.slice(-30),
    };
  }

  buildEmotionalContext(): string {
    const valence = this.computeValence();
    const state = this.getState();

    const lines = [
      `## Emotional State`,
      `Dominant: ${valence.dominantEmotion} | Valence: ${(valence.positive - valence.negative).toFixed(2)} | Arousal: ${valence.arousal.toFixed(2)}`,
      `Stability: ${(valence.emotionalStability * 100).toFixed(0)}% | Mood: ${state.moodTrajectory}`,
    ];

    const highArousal = this.signals.filter(s => s.effectiveIntensity > 0.6).slice(-3);
    if (highArousal.length > 0) {
      lines.push(`Active signals: ${highArousal.map(s => `${s.emotion}(${(s.effectiveIntensity * 100).toFixed(0)}%)`).join(", ")}`);
    }

    return lines.join("\n");
  }
}

export const emotionalSignals = new EmotionalSignalEngine();
