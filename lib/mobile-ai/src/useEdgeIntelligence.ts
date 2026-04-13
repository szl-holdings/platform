import { useCallback } from "react";

export type DocumentClass =
  | "contract"
  | "invoice"
  | "bill_of_lading"
  | "manifest"
  | "deed"
  | "permit"
  | "report"
  | "correspondence"
  | "financial_statement"
  | "technical_spec"
  | "unknown";

export type SentimentResult = "positive" | "negative" | "neutral" | "mixed";

export interface DocumentClassificationResult {
  classification: DocumentClass;
  confidence: number;
  signals: string[];
}

export interface SentimentAnalysisResult {
  sentiment: SentimentResult;
  confidence: number;
  score: number;
  signals: string[];
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  score: number;
  type?: string;
  description?: string;
}

const DOC_PATTERNS: Array<{ class: DocumentClass; patterns: RegExp[]; weight: number }> = [
  {
    class: "contract",
    patterns: [/\bagree[sd]?\b/i, /\bparties\b/i, /\bterms and conditions\b/i, /\bhereby\b/i, /\bobligation\b/i],
    weight: 1.0,
  },
  {
    class: "invoice",
    patterns: [/\binvoice\s*#?[\d-]+/i, /\bamount due\b/i, /\btotal\b.*\$[\d,]+/, /\bpayment terms\b/i, /\bdue date\b/i],
    weight: 1.0,
  },
  {
    class: "bill_of_lading",
    patterns: [/\bbill of lading\b/i, /\bshipper\b/i, /\bconsignee\b/i, /\bvoyage\b/i, /\bport of loading\b/i],
    weight: 1.2,
  },
  {
    class: "manifest",
    patterns: [/\bmanifest\b/i, /\bcargo\b/i, /\bcontainer\b/i, /\bvessel\b/i, /\bdeadweight\b/i],
    weight: 1.1,
  },
  {
    class: "deed",
    patterns: [/\bgrantor\b/i, /\bgrantee\b/i, /\bproperty deed\b/i, /\btitle\b/i, /\blegal description\b/i],
    weight: 1.2,
  },
  {
    class: "permit",
    patterns: [/\bpermit\b/i, /\blicense\b/i, /\bauthoriz/i, /\bregulatory\b/i, /\bcompliance\b/i],
    weight: 1.0,
  },
  {
    class: "report",
    patterns: [/\bfindings\b/i, /\banalysis\b/i, /\bsummary\b/i, /\bconclusions\b/i, /\brecommendations\b/i],
    weight: 0.9,
  },
  {
    class: "financial_statement",
    patterns: [/\bbalance sheet\b/i, /\bincome statement\b/i, /\bcash flow\b/i, /\bnet assets\b/i, /\bequity\b/i],
    weight: 1.1,
  },
];

const POSITIVE_WORDS = new Set([
  "good", "great", "excellent", "outstanding", "strong", "improved", "growth",
  "success", "positive", "achieve", "deliver", "above", "ahead", "favorable",
  "profit", "gain", "increase", "efficient", "resolved", "complete", "secure",
]);

const NEGATIVE_WORDS = new Set([
  "bad", "poor", "critical", "failed", "failure", "risk", "threat", "danger",
  "delay", "loss", "deficit", "below", "concern", "issue", "problem", "breach",
  "incident", "anomaly", "violation", "decline", "decrease", "alert", "warning",
]);

export function useEdgeIntelligence() {
  const classifyDocument = useCallback(
    (text: string): DocumentClassificationResult => {
      const scores: Map<DocumentClass, { score: number; signals: string[] }> = new Map();

      for (const def of DOC_PATTERNS) {
        const matchedPatterns: string[] = [];
        let hits = 0;
        for (const pattern of def.patterns) {
          if (pattern.test(text)) {
            hits++;
            matchedPatterns.push(pattern.source.replace(/\\b|\\s\*|\?|\[[\w\s,-]+\]/g, "").replace(/\|/g, "/").slice(0, 30));
          }
        }
        if (hits > 0) {
          const score = (hits / def.patterns.length) * def.weight;
          scores.set(def.class, { score, signals: matchedPatterns });
        }
      }

      if (scores.size === 0) {
        return { classification: "unknown", confidence: 0.5, signals: [] };
      }

      let best: DocumentClass = "unknown";
      let bestScore = 0;
      let bestSignals: string[] = [];

      for (const [cls, { score, signals }] of scores) {
        if (score > bestScore) {
          bestScore = score;
          best = cls;
          bestSignals = signals;
        }
      }

      const confidence = Math.min(0.95, 0.5 + bestScore * 0.45);
      return { classification: best, confidence, signals: bestSignals };
    },
    [],
  );

  const analyzeSentiment = useCallback(
    (text: string): SentimentAnalysisResult => {
      const words = text.toLowerCase().match(/\b\w+\b/g) ?? [];
      let positiveCount = 0;
      let negativeCount = 0;
      const positiveSignals: string[] = [];
      const negativeSignals: string[] = [];

      for (const word of words) {
        if (POSITIVE_WORDS.has(word)) {
          positiveCount++;
          if (positiveSignals.length < 3) positiveSignals.push(word);
        } else if (NEGATIVE_WORDS.has(word)) {
          negativeCount++;
          if (negativeSignals.length < 3) negativeSignals.push(word);
        }
      }

      const total = positiveCount + negativeCount;
      if (total === 0) {
        return { sentiment: "neutral", confidence: 0.6, score: 0, signals: [] };
      }

      const score = (positiveCount - negativeCount) / Math.max(total, 1);
      let sentiment: SentimentResult;
      let confidence: number;

      if (Math.abs(score) < 0.1) {
        sentiment = "mixed";
        confidence = 0.55;
      } else if (score > 0.3) {
        sentiment = "positive";
        confidence = Math.min(0.95, 0.6 + score * 0.35);
      } else if (score < -0.3) {
        sentiment = "negative";
        confidence = Math.min(0.95, 0.6 + Math.abs(score) * 0.35);
      } else {
        sentiment = score > 0 ? "positive" : "negative";
        confidence = 0.6;
      }

      return {
        sentiment,
        confidence,
        score,
        signals: [...positiveSignals.map(s => `+${s}`), ...negativeSignals.map(s => `-${s}`)],
      };
    },
    [],
  );

  const detectAnomaly = useCallback(
    (values: number[], threshold = 2.5): AnomalyDetectionResult => {
      if (values.length < 3) {
        return { isAnomaly: false, score: 0 };
      }

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev === 0) {
        return { isAnomaly: false, score: 0 };
      }

      const latest = values[values.length - 1]!;
      const zScore = Math.abs((latest - mean) / stdDev);
      const isAnomaly = zScore > threshold;

      let type: string | undefined;
      let description: string | undefined;

      if (isAnomaly) {
        type = latest > mean ? "spike" : "drop";
        description = `${type === "spike" ? "Unusual spike" : "Significant drop"} detected: ${Math.round(zScore * 10) / 10}σ from mean`;
      }

      return {
        isAnomaly,
        score: Math.min(1, zScore / (threshold * 2)),
        type,
        description,
      };
    },
    [],
  );

  const batchClassifyDocuments = useCallback(
    (texts: string[]): DocumentClassificationResult[] => {
      return texts.map(t => classifyDocument(t));
    },
    [classifyDocument],
  );

  return {
    classifyDocument,
    analyzeSentiment,
    detectAnomaly,
    batchClassifyDocuments,
  };
}
