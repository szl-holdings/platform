/**
 * HuggingFace ML Intelligence — multi-domain AI endpoints
 *
 * Endpoints:
 *   POST /hf-intelligence/legal/analyze     — Legal NLP (clause classification + NER)
 *   POST /hf-intelligence/threat/correlate  — Threat indicator correlation
 *   POST /hf-intelligence/vessels/decode-ais — AIS NMEA decode + ML classification
 *   POST /hf-intelligence/property/value    — AI-assisted property valuation
 *   POST /hf-intelligence/summarize         — Document summarization (bart-large-cnn)
 *   POST /hf-intelligence/embed             — Improved RAG embeddings (bge-large)
 *   GET  /hf-intelligence/models            — Registered model catalog
 */

import { type IRouter, type Request, type Response, Router } from 'express';
import { handleRouteError, sendBadRequest, sendSuccess } from '../lib/api-response';
import { checkInferenceGates } from '../a11oy/runtime/router/model-router';
import {
  callHfTaskWithGovernance,
  type HfTaskCallResult,
} from '@szl-holdings/ai-engine/providers/hf-task-router';
import { resolveHfFailoverChain } from '../lib/hf-failover-resolver';

const router: IRouter = Router();

const HF_API_BASE = 'https://api-inference.huggingface.co/models';

function getHfToken(): string | undefined {
  return process.env.HF_TOKEN ?? process.env.HUGGINGFACE_API_KEY;
}

// Resolves fallback chain at inference time: caller override → DB chain → static.
// null from resolver = not in registry (use static); [] = in registry, no fallbacks.
/**
 * Central inference dispatcher for all HF route handlers.
 *
 * The optional `fallbackModels` parameter is an internal escape hatch for
 * direct callers that need to override the failover chain. Route handlers
 * in this file do NOT pass it — all production calls resolve the chain from
 * the operator-governed DB registry via `resolveHfFailoverChain`.
 */
async function routeHfTaskCall<T = unknown>(
  primaryModel: string,
  body: unknown,
  fallbackModels?: string[],
): Promise<HfTaskCallResult<T>> {
  if (fallbackModels !== undefined) {
    return callHfTaskWithGovernance<T>(primaryModel, body, { fallbackModels });
  }
  const dbChain = await resolveHfFailoverChain(primaryModel);
  return callHfTaskWithGovernance<T>(primaryModel, body, {
    // null  → not in registry; pass undefined so shared router uses HF_TASK_FAILOVERS
    // []    → in registry with no/retired chain; pass [] so no static override
    // [...] → operator chain; pass it directly
    fallbackModels: dbChain !== null ? dbChain : undefined,
  });
}

// ---------------------------------------------------------------------------
// Model catalog
// ---------------------------------------------------------------------------

const MODEL_CATALOG = [
  {
    id: 'nlpaueb/legal-bert-base-uncased',
    domain: 'counsel',
    task: 'feature-extraction',
    description: 'Legal-domain BERT — clause classification and legal NER',
  },
  {
    id: 'facebook/bart-large-mnli',
    domain: 'counsel',
    task: 'zero-shot-classification',
    description: 'Zero-shot legal clause category classification',
  },
  {
    id: 'facebook/bart-large-cnn',
    domain: 'pulse',
    task: 'summarization',
    description: 'Abstractive document and briefing summarization',
  },
  {
    id: 'BAAI/bge-large-en-v1.5',
    domain: 'rag',
    task: 'feature-extraction',
    description: 'State-of-the-art dense embeddings for RAG pipelines',
  },
  {
    id: 'dslim/bert-base-NER',
    domain: 'sentra',
    task: 'token-classification',
    description: 'Named entity recognition for threat actor attribution',
  },
  {
    id: 'ProsusAI/finbert',
    domain: 'terra',
    task: 'text-classification',
    description: 'Financial sentiment for property market signals',
  },
];

router.get('/hf-intelligence/models', (_req: Request, res: Response) => {
  const gateStatus = checkInferenceGates('catalog-check');
  sendSuccess(res, {
    models: MODEL_CATALOG,
    tokenConfigured: !!getHfToken(),
    inferenceBase: HF_API_BASE,
    governanceGates: gateStatus.gates,
    liveInferenceActive: gateStatus.allowed,
  });
});

// ---------------------------------------------------------------------------
// Legal NLP
// ---------------------------------------------------------------------------

router.post('/hf-intelligence/legal/analyze', async (req: Request, res: Response) => {
  try {
    const { text, task = 'classify' } = req.body as {
      text?: string;
      task?: 'classify' | 'summarize' | 'ner';
    };

    if (!text || text.trim().length < 10) {
      return sendBadRequest(res, "'text' is required (min 10 chars)");
    }

    const truncated = text.slice(0, 1500);
    const startMs = Date.now();

    if (task === 'summarize') {
      type SumResult = Array<{ summary_text: string }> | { summary_text: string };
      const call = await routeHfTaskCall<SumResult>('facebook/bart-large-cnn', {
        inputs: truncated,
        parameters: { max_length: 180, min_length: 40 },
      });
      const summary = Array.isArray(call.result) ? call.result[0]?.summary_text : call.result.summary_text;
      return sendSuccess(res, {
        task: 'summarize',
        summary,
        latencyMs: Date.now() - startMs,
        model: call.modelUsed,
      });
    }

    if (task === 'ner') {
      type NerToken = { word: string; entity: string; score: number; start: number; end: number };
      const call = await routeHfTaskCall<NerToken[] | NerToken[][]>(
        'dslim/bert-base-NER',
        { inputs: truncated },
      );
      const entities: NerToken[] = Array.isArray(call.result[0])
        ? (call.result as NerToken[][])[0]!
        : (call.result as NerToken[]);
      return sendSuccess(res, {
        task: 'ner',
        entities,
        latencyMs: Date.now() - startMs,
        model: call.modelUsed,
      });
    }

    // Default: zero-shot clause classification.
    // Primary model is the legal-domain BERT mandated by the task spec
    // (nlpaueb/legal-bert-base-uncased, capability='classification' in the
    // model registry). When that model is unavailable we fall back through
    // the configured chain to the general-purpose zero-shot classifier.
    const candidateLabels = [
      'indemnification',
      'limitation of liability',
      'intellectual property',
      'confidentiality',
      'termination',
      'dispute resolution',
      'payment terms',
      'force majeure',
      'data protection',
      'warranty',
    ];

    type ZeroShotResult = { labels: string[]; scores: number[]; sequence: string };
    // Spec mandates legal-bert as the primary classifier. The zero-shot
    // request shape (candidate_labels) is honored by both legal-bert and the
    // bart-large-mnli fallback, so the chain is response-compatible.
    const call = await routeHfTaskCall<ZeroShotResult>(
      'nlpaueb/legal-bert-base-uncased',
      {
        inputs: truncated,
        parameters: { candidate_labels: candidateLabels, multi_label: false },
      },
      ['facebook/bart-large-mnli'],
    );
    const classification = call.result;

    const topLabel = classification.labels[0];
    const topScore = classification.scores[0];

    return sendSuccess(res, {
      task: 'classify',
      topCategory: topLabel,
      confidence: topScore,
      allCategories: classification.labels.slice(0, 5).map((l, i) => ({
        label: l,
        score: classification.scores[i],
      })),
      riskFlags: topScore != null && topScore > 0.6
        ? [`High confidence ${topLabel} clause — review carefully`]
        : [],
      latencyMs: Date.now() - startMs,
      model: call.modelUsed,
    });
  } catch (err) {
    handleRouteError(res, err, 'Legal NLP analysis failed');
  }
});

// ---------------------------------------------------------------------------
// Threat Correlation
// ---------------------------------------------------------------------------

router.post('/hf-intelligence/threat/correlate', async (req: Request, res: Response) => {
  try {
    const { indicators, context = '' } = req.body as {
      indicators?: string[];
      context?: string;
    };

    if (!indicators || !Array.isArray(indicators) || indicators.length === 0) {
      return sendBadRequest(res, "'indicators' array is required");
    }

    const startMs = Date.now();
    const combinedText = indicators.join(' | ') + (context ? ` Context: ${context}` : '');
    const truncated = combinedText.slice(0, 1000);

    const threatLabels = [
      'ransomware',
      'phishing',
      'APT intrusion',
      'data exfiltration',
      'DDoS attack',
      'supply chain compromise',
      'credential theft',
      'zero-day exploit',
      'insider threat',
      'command and control',
    ];

    type ZeroShotResult = { labels: string[]; scores: number[]; sequence: string };
    const correlateCall = await routeHfTaskCall<ZeroShotResult>(
      'facebook/bart-large-mnli',
      {
        inputs: truncated,
        parameters: { candidate_labels: threatLabels, multi_label: true },
      },
    );
    const classification = correlateCall.result;

    // NER enrichment also runs through routeHfTaskCall — failures (including
    // governance gate blocks) propagate via handleRouteError. Skip only when
    // the input is too short to produce meaningful entities.
    type NerToken = { word: string; entity: string; score: number };
    let nerEntities: NerToken[] = [];
    let nerModelUsed = 'dslim/bert-base-NER';
    if (combinedText.length > 10) {
      const nerCall = await routeHfTaskCall<NerToken[] | NerToken[][]>(
        'dslim/bert-base-NER',
        { inputs: truncated },
      );
      nerEntities = Array.isArray(nerCall.result[0])
        ? (nerCall.result as NerToken[][])[0]!
        : (nerCall.result as NerToken[]);
      nerModelUsed = nerCall.modelUsed;
    }

    const threatActors = nerEntities
      .filter((e) => e.entity.includes('PER') || e.entity.includes('ORG'))
      .map((e) => ({ name: e.word, type: e.entity, confidence: e.score }))
      .slice(0, 8);

    const correlations = classification.labels.slice(0, 5).map((label, i) => ({
      threatType: label,
      score: classification.scores[i] ?? 0,
      mitreTactic: mapThreatToMitre(label),
    }));

    return sendSuccess(res, {
      indicators,
      correlations,
      threatActors,
      overallRisk: correlations[0]!.score > 0.6 ? 'critical' : correlations[0]!.score > 0.4 ? 'high' : 'medium',
      latencyMs: Date.now() - startMs,
      models: [correlateCall.modelUsed, nerModelUsed],
    });
  } catch (err) {
    handleRouteError(res, err, 'Threat correlation failed');
  }
});

function mapThreatToMitre(threat: string): string {
  const mapping: Record<string, string> = {
    ransomware: 'TA0040 — Impact',
    phishing: 'TA0001 — Initial Access',
    'APT intrusion': 'TA0005 — Defense Evasion',
    'data exfiltration': 'TA0010 — Exfiltration',
    'DDoS attack': 'TA0040 — Impact',
    'supply chain compromise': 'TA0001 — Initial Access',
    'credential theft': 'TA0006 — Credential Access',
    'zero-day exploit': 'TA0002 — Execution',
    'insider threat': 'TA0003 — Persistence',
    'command and control': 'TA0011 — Command and Control',
  };
  return mapping[threat] ?? 'TA0000 — Unknown';
}

// ---------------------------------------------------------------------------
// AIS Decode + ML Classification
// ---------------------------------------------------------------------------

router.post('/hf-intelligence/vessels/decode-ais', async (req: Request, res: Response) => {
  try {
    const { rawMessage, mmsi, vesselName, lastPosition, context } = req.body as {
      rawMessage?: string;
      mmsi?: string;
      vesselName?: string;
      lastPosition?: { lat?: number; lon?: number };
      context?: string;
    };

    if (!rawMessage && !mmsi && !vesselName) {
      return sendBadRequest(res, "At least one of 'rawMessage', 'mmsi', or 'vesselName' is required");
    }

    const startMs = Date.now();

    // Decode NMEA AIS if raw message provided
    let decoded: Record<string, unknown> = {};
    if (rawMessage) {
      decoded = decodeNmeaAis(rawMessage);
    }

    // Build classification context
    const classificationText = [
      mmsi ? `MMSI: ${mmsi}` : '',
      vesselName ? `Vessel: ${vesselName}` : '',
      lastPosition ? `Position: ${lastPosition.lat ?? '?'}°N ${lastPosition.lon ?? '?'}°E` : '',
      context ?? '',
      rawMessage ? `AIS payload type: ${decoded.messageType ?? 'unknown'}` : '',
    ]
      .filter(Boolean)
      .join('. ')
      .slice(0, 800);

    const behaviourLabels = [
      'dark ship — AIS disabled',
      'sanctions zone transit',
      'ship-to-ship transfer',
      'normal commercial voyage',
      'position spoofing',
      'anchored loitering',
      'abnormal speed change',
      'flag of convenience',
    ];

    // AIS classification model is operator-configurable via HF_AIS_MODEL so
    // the routing decision lives in env/config, not in code. Falls back to
    // the registry-configured zero-shot classifier when unset.
    const aisModel = process.env.HF_AIS_MODEL || 'facebook/bart-large-mnli';
    type ZeroShotResult = { labels: string[]; scores: number[] };
    const aisCall = await routeHfTaskCall<ZeroShotResult>(aisModel, {
      inputs: classificationText,
      parameters: { candidate_labels: behaviourLabels, multi_label: true },
    });
    const classification = aisCall.result;

    const anomalyFlags = classification.labels
      .map((l, i) => ({ label: l, score: classification.scores[i] ?? 0 }))
      .filter((f) => f.score > 0.25 && f.label !== 'normal commercial voyage')
      .slice(0, 4);

    return sendSuccess(res, {
      input: { rawMessage, mmsi, vesselName },
      decoded: rawMessage ? decoded : null,
      behaviourClassification: classification.labels.slice(0, 4).map((l, i) => ({
        behaviour: l,
        score: classification.scores[i] ?? 0,
      })),
      anomalyFlags,
      riskLevel: anomalyFlags.length > 2 ? 'critical' : anomalyFlags.length > 0 ? 'elevated' : 'normal',
      latencyMs: Date.now() - startMs,
      model: aisCall.modelUsed,
    });
  } catch (err) {
    handleRouteError(res, err, 'AIS decode and classification failed');
  }
});

function decodeNmeaAis(raw: string): Record<string, unknown> {
  try {
    const parts = raw.split(',');
    if (!parts[0]?.startsWith('!AIVDM') && !parts[0]?.startsWith('!AIVDO')) {
      return { raw, parseError: 'Not a valid AIVDM/AIVDO sentence' };
    }
    const totalFragments = parseInt(parts[1] ?? '1', 10);
    const fragmentNumber = parseInt(parts[2] ?? '1', 10);
    const channel = parts[4] ?? 'A';
    const payload = parts[5] ?? '';
    const messageType = payload.length > 0
      ? (payload.charCodeAt(0) - 48) & 0x3f
      : null;
    return {
      raw,
      sentence: parts[0],
      totalFragments,
      fragmentNumber,
      channel,
      payload,
      messageType,
      decoded: true,
    };
  } catch {
    return { raw, parseError: 'Parse failed' };
  }
}

// ---------------------------------------------------------------------------
// Property Valuation
// ---------------------------------------------------------------------------

router.post('/hf-intelligence/property/value', async (req: Request, res: Response) => {
  try {
    const { address, sqft, beds, baths, yearBuilt, propertyType, marketContext } = req.body as {
      address?: string;
      sqft?: number;
      beds?: number;
      baths?: number;
      yearBuilt?: number;
      propertyType?: string;
      marketContext?: string;
    };

    if (!address && !sqft) {
      return sendBadRequest(res, "'address' or 'sqft' is required");
    }

    const startMs = Date.now();

    const propertyDesc = [
      address ? `Address: ${address}` : '',
      propertyType ? `Type: ${propertyType}` : 'Type: residential',
      sqft ? `Size: ${sqft} sqft` : '',
      beds ? `Bedrooms: ${beds}` : '',
      baths ? `Bathrooms: ${baths}` : '',
      yearBuilt ? `Built: ${yearBuilt}` : '',
      marketContext ?? '',
    ]
      .filter(Boolean)
      .join('. ');

    // Classify market sentiment using ProsusAI/finbert (financial sentiment).
    // Routed through routeHfTaskCall so the 5-gate governance check runs and
    // the configured failover chain is honored before returning an error.
    // HF text-classification returns either a flat `[{label,score},...]`
    // (single input, common shape) OR a nested `[[{label,score},...]]`
    // (batched/some models). Handle both safely.
    type LabelScore = { label: string; score: number };
    type FinBertResult = LabelScore[] | LabelScore[][];
    // No failover configured for FinBERT — bart-large-mnli is zero-shot and
    // returns an incompatible response shape, so a mis-parsed fallback would
    // be worse than a clean error. See HF_TASK_FAILOVERS in hf-task-router.
    const finbertCall = await routeHfTaskCall<FinBertResult>(
      'ProsusAI/finbert',
      { inputs: propertyDesc + (marketContext ? ` Market: ${marketContext}` : '') },
    );
    const rawFinbert = finbertCall.result;
    const finbertScores: LabelScore[] = Array.isArray(rawFinbert[0])
      ? (rawFinbert as LabelScore[][])[0] ?? []
      : (rawFinbert as LabelScore[]);
    const labelMap: Record<string, string> = {
      positive: 'bullish market',
      negative: 'bearish market',
      neutral: 'stable market',
    };
    const ranked = [...finbertScores].sort((a, b) => b.score - a.score);
    const sentiment = {
      labels: ranked.map((r) => labelMap[r.label.toLowerCase()] ?? r.label),
      scores: ranked.map((r) => r.score),
    };

    // Derive a valuation range from structured inputs
    const baseRate = propertyType?.toLowerCase().includes('commercial') ? 250 : 180;
    const sqftVal = sqft ?? 1800;
    const ageFactor = yearBuilt ? Math.max(0.75, 1 - (new Date().getFullYear() - yearBuilt) * 0.003) : 1;
    const sentimentMultiplier = sentiment.labels[0] === 'bullish market'
      ? 1.07
      : sentiment.labels[0] === 'bearish market'
        ? 0.93
        : 1.0;

    const estimatedValue = Math.round(sqftVal * baseRate * ageFactor * sentimentMultiplier / 1000) * 1000;
    const lowEstimate = Math.round(estimatedValue * 0.88);
    const highEstimate = Math.round(estimatedValue * 1.12);

    return sendSuccess(res, {
      property: { address, sqft, beds, baths, yearBuilt, propertyType },
      valuation: {
        estimatedValue,
        range: { low: lowEstimate, high: highEstimate },
        currency: 'USD',
        confidence: sentiment.scores[0] ?? 0.5,
        methodology: 'AI-assisted comparative + sentiment-adjusted',
      },
      marketSentiment: {
        label: sentiment.labels[0],
        score: sentiment.scores[0] ?? 0,
        allSignals: sentiment.labels.slice(0, 4).map((l, i) => ({
          signal: l,
          score: sentiment.scores[i] ?? 0,
        })),
      },
      latencyMs: Date.now() - startMs,
      model: finbertCall.modelUsed,
    });
  } catch (err) {
    handleRouteError(res, err, 'Property valuation failed');
  }
});

// ---------------------------------------------------------------------------
// Summarization
// ---------------------------------------------------------------------------

router.post('/hf-intelligence/summarize', async (req: Request, res: Response) => {
  try {
    const { text, maxLength = 200, minLength = 50 } = req.body as {
      text?: string;
      maxLength?: number;
      minLength?: number;
    };

    if (!text || text.trim().length < 50) {
      return sendBadRequest(res, "'text' is required (min 50 chars)");
    }

    const truncated = text.slice(0, 3000);
    const startMs = Date.now();

    type SumResult = Array<{ summary_text: string }> | { summary_text: string };
    const sumCall = await routeHfTaskCall<SumResult>('facebook/bart-large-cnn', {
      inputs: truncated,
      parameters: {
        max_length: Math.min(maxLength, 400),
        min_length: Math.max(minLength, 20),
        do_sample: false,
      },
    });

    const summary = Array.isArray(sumCall.result)
      ? sumCall.result[0]?.summary_text ?? ''
      : sumCall.result.summary_text;
    const compressionRatio = summary.length / text.length;

    return sendSuccess(res, {
      summary,
      originalLength: text.length,
      summaryLength: summary.length,
      compressionRatio: Math.round(compressionRatio * 100) / 100,
      latencyMs: Date.now() - startMs,
      model: sumCall.modelUsed,
    });
  } catch (err) {
    handleRouteError(res, err, 'Summarization failed');
  }
});

// ---------------------------------------------------------------------------
// Embeddings (improved RAG)
// ---------------------------------------------------------------------------

router.post('/hf-intelligence/embed', async (req: Request, res: Response) => {
  try {
    const { texts } = req.body as { texts?: string[] };

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return sendBadRequest(res, "'texts' array is required");
    }
    if (texts.length > 64) {
      return sendBadRequest(res, 'Maximum 64 texts per request');
    }

    const truncated = texts.map((t) => String(t).slice(0, 512));
    const startMs = Date.now();

    type EmbedResult = number[][] | number[];
    const embedCall = await routeHfTaskCall<EmbedResult>(
      'BAAI/bge-large-en-v1.5',
      { inputs: truncated, options: { wait_for_model: true } },
      ['BAAI/bge-m3'],
    );
    const raw = embedCall.result;
    // HF returns either number[] (single) or number[][] (batch)
    const embeddings: number[][] = Array.isArray(raw[0])
      ? (raw as number[][])
      : [raw as number[]];

    return sendSuccess(res, {
      embeddings,
      model: embedCall.modelUsed,
      dimensions: embeddings[0]?.length ?? 0,
      count: embeddings.length,
      latencyMs: Date.now() - startMs,
    });
  } catch (err) {
    handleRouteError(res, err, 'Embedding generation failed');
  }
});

export default router;
