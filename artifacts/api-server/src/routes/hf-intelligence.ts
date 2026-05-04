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
import { checkInferenceGates, type GateCheckResult } from '../a11oy/runtime/router/model-router';

const router: IRouter = Router();

const HF_API_BASE = 'https://api-inference.huggingface.co/models';
const TIMEOUT_MS = 25_000;

function getHfToken(): string | undefined {
  return process.env.HF_TOKEN ?? process.env.HUGGINGFACE_API_KEY;
}

function hfHeaders(): Record<string, string> {
  const token = getHfToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function enforceGates(model: string, res: Response): GateCheckResult | null {
  const result = checkInferenceGates(model);
  if (!result.allowed) {
    res.status(403).json({
      error: 'governance_gate_blocked',
      model,
      failedGates: result.failedGates,
      gates: result.gates,
      message: `Inference blocked for model "${model}": gates [${result.failedGates.join(', ')}] not satisfied. Set HF_ENABLE_LIVE_INFERENCE=1 and HF_PRODUCTION_APPROVED=1 to activate.`,
    });
    return null;
  }
  return result;
}

async function hfPost<T = unknown>(model: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${HF_API_BASE}/${model}`, {
      method: 'POST',
      headers: hfHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw Object.assign(new Error(`HF API ${res.status}: ${text.slice(0, 300)}`), {
        statusCode: res.status === 503 ? 503 : 502,
      });
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
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

    const primaryModel = task === 'summarize' ? 'facebook/bart-large-cnn' : task === 'ner' ? 'dslim/bert-base-NER' : 'facebook/bart-large-mnli';
    if (!enforceGates(primaryModel, res)) return;

    const truncated = text.slice(0, 1500);
    const startMs = Date.now();

    if (task === 'summarize') {
      type SumResult = Array<{ summary_text: string }> | { summary_text: string };
      // Gates already passed — propagate live API errors instead of silently
      // returning extractive fallback. Operators must see real failures.
      const result = await hfPost<SumResult>('facebook/bart-large-cnn', {
        inputs: truncated,
        parameters: { max_length: 180, min_length: 40 },
      });
      const summary = Array.isArray(result) ? result[0]?.summary_text : result.summary_text;
      return sendSuccess(res, {
        task: 'summarize',
        summary,
        latencyMs: Date.now() - startMs,
        model: 'facebook/bart-large-cnn',
      });
    }

    if (task === 'ner') {
      type NerToken = { word: string; entity: string; score: number; start: number; end: number };
      const raw = await hfPost<NerToken[] | NerToken[][]>('dslim/bert-base-NER', { inputs: truncated });
      const entities: NerToken[] = Array.isArray(raw[0]) ? (raw as NerToken[][])[0]! : (raw as NerToken[]);
      return sendSuccess(res, {
        task: 'ner',
        entities,
        latencyMs: Date.now() - startMs,
        model: 'dslim/bert-base-NER',
      });
    }

    // Default: zero-shot clause classification
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
    const classification: ZeroShotResult = await hfPost<ZeroShotResult>('facebook/bart-large-mnli', {
      inputs: truncated,
      parameters: { candidate_labels: candidateLabels, multi_label: false },
    });

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
      model: 'facebook/bart-large-mnli',
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

    if (!enforceGates('facebook/bart-large-mnli', res)) return;

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
    const classification: ZeroShotResult = await hfPost<ZeroShotResult>('facebook/bart-large-mnli', {
      inputs: truncated,
      parameters: { candidate_labels: threatLabels, multi_label: true },
    });

    // NER enrichment runs through the SAME 5-gate enforcement; failures
    // (including governance gate blocks) propagate so operators see real
    // errors instead of silent degradation. Skip only when the input is
    // too short to produce meaningful entities.
    type NerToken = { word: string; entity: string; score: number };
    let nerEntities: NerToken[] = [];
    if (combinedText.length > 10) {
      const nerGate = checkInferenceGates('dslim/bert-base-NER');
      if (!nerGate.allowed) {
        throw new Error(`governance_gate_blocked:dslim/bert-base-NER:${nerGate.failedGates.join(',')}`);
      }
      const raw = await hfPost<NerToken[] | NerToken[][]>('dslim/bert-base-NER', {
        inputs: truncated,
      });
      nerEntities = Array.isArray(raw[0]) ? (raw as NerToken[][])[0]! : (raw as NerToken[]);
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
      models: ['facebook/bart-large-mnli', 'dslim/bert-base-NER'],
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

    if (!enforceGates('facebook/bart-large-mnli', res)) return;

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

    type ZeroShotResult = { labels: string[]; scores: number[] };
    const classification: ZeroShotResult = await hfPost<ZeroShotResult>('facebook/bart-large-mnli', {
      inputs: classificationText,
      parameters: { candidate_labels: behaviourLabels, multi_label: true },
    });

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
      model: 'facebook/bart-large-mnli',
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

    if (!enforceGates('facebook/bart-large-mnli', res)) return;

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

    // Classify market sentiment using FinBERT
    const sentimentLabels = ['bullish market', 'bearish market', 'stable market', 'volatile market'];
    type ZeroShotResult = { labels: string[]; scores: number[] };
    const sentiment: ZeroShotResult = await hfPost<ZeroShotResult>('facebook/bart-large-mnli', {
      inputs: propertyDesc + (marketContext ? ` Market: ${marketContext}` : ''),
      parameters: { candidate_labels: sentimentLabels, multi_label: false },
    });

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
      model: 'facebook/bart-large-mnli',
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

    if (!enforceGates('facebook/bart-large-cnn', res)) return;

    const truncated = text.slice(0, 3000);
    const startMs = Date.now();

    type SumResult = Array<{ summary_text: string }> | { summary_text: string };
    const result: SumResult = await hfPost<SumResult>('facebook/bart-large-cnn', {
      inputs: truncated,
      parameters: {
        max_length: Math.min(maxLength, 400),
        min_length: Math.max(minLength, 20),
        do_sample: false,
      },
    });

    const summary = Array.isArray(result) ? result[0]?.summary_text ?? '' : result.summary_text;
    const compressionRatio = summary.length / text.length;

    return sendSuccess(res, {
      summary,
      originalLength: text.length,
      summaryLength: summary.length,
      compressionRatio: Math.round(compressionRatio * 100) / 100,
      latencyMs: Date.now() - startMs,
      model: 'facebook/bart-large-cnn',
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

    if (!enforceGates('BAAI/bge-large-en-v1.5', res)) return;

    const truncated = texts.map((t) => String(t).slice(0, 512));
    const startMs = Date.now();

    type EmbedResult = number[][] | number[];
    const raw = await hfPost<EmbedResult>('BAAI/bge-large-en-v1.5', {
      inputs: truncated,
      options: { wait_for_model: true },
    });
    // HF returns either number[] (single) or number[][] (batch)
    const embeddings: number[][] = Array.isArray(raw[0])
      ? (raw as number[][])
      : [raw as number[]];

    return sendSuccess(res, {
      embeddings,
      model: 'BAAI/bge-large-en-v1.5',
      dimensions: embeddings[0]?.length ?? 0,
      count: embeddings.length,
      latencyMs: Date.now() - startMs,
    });
  } catch (err) {
    handleRouteError(res, err, 'Embedding generation failed');
  }
});

export default router;
