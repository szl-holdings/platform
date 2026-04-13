import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";
import { logAction, updateActionStatus, generateActionId } from "./action-audit";

export type AudioDomain = "legal" | "defense" | "maritime" | "business" | "security" | "general";

export interface SpeakerSegment {
  speakerId: string;
  speakerLabel?: string;
  startTime?: string;
  endTime?: string;
  text: string;
  sentiment?: "positive" | "neutral" | "negative" | "mixed";
  stressLevel?: "low" | "medium" | "high";
  confidence: number;
}

export interface AudioIntelligenceResult {
  audioIntelId: string;
  actionId: string;
  domain: AudioDomain;
  transcript: string;
  speakerCount: number;
  speakerSegments: SpeakerSegment[];
  sentiment: {
    overall: "positive" | "neutral" | "negative" | "mixed";
    bySegment: Array<{ speaker: string; sentiment: string; confidence: number }>;
  };
  stressAnalysis: {
    overallStressLevel: "low" | "medium" | "high";
    highStressSegments: string[];
    stressIndicators: string[];
  };
  keywords: Array<{ term: string; frequency: number; significance: "low" | "medium" | "high" }>;
  topics: Array<{ topic: string; relevance: number; segments: string[] }>;
  keyDecisions: string[];
  actionItems: string[];
  disputedFacts: string[];
  anomalies: string[];
  summary: string;
  confidenceScore: number;
  latencyMs: number;
  tokensUsed: number;
}

export interface AudioEventClassification {
  classificationId: string;
  detectedEvents: Array<{
    eventType: string;
    confidence: number;
    timestamp?: string;
    description: string;
    severity: "info" | "warning" | "alert" | "critical";
  }>;
  backgroundNoise: string;
  environmentClassification: string;
  anomalyScore: number;
  alertRequired: boolean;
}

async function ensureAudioIntelTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audio_intelligence_results (
      id BIGSERIAL PRIMARY KEY,
      audio_intel_id TEXT NOT NULL UNIQUE,
      action_id TEXT,
      domain TEXT NOT NULL DEFAULT 'general',
      transcript_length INTEGER DEFAULT 0,
      speaker_count INTEGER DEFAULT 0,
      speaker_segments JSONB DEFAULT '[]',
      sentiment JSONB DEFAULT '{}',
      stress_analysis JSONB DEFAULT '{}',
      keywords JSONB DEFAULT '[]',
      topics JSONB DEFAULT '[]',
      key_decisions JSONB DEFAULT '[]',
      action_items JSONB DEFAULT '[]',
      disputed_facts JSONB DEFAULT '[]',
      anomalies JSONB DEFAULT '[]',
      summary TEXT,
      confidence_score REAL DEFAULT 0,
      tokens_used INTEGER DEFAULT 0,
      latency_ms INTEGER DEFAULT 0,
      triggered_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `).catch(() => {});
}

ensureAudioIntelTable().catch(() => {});

function buildAudioSystemPrompt(domain: AudioDomain): string {
  const contexts: Record<AudioDomain, string> = {
    legal: "You are a legal audio intelligence analyst. Process deposition recordings, courtroom audio, and legal meeting transcripts with focus on disputed facts, admissions, contradictions, and evidence quality.",
    defense: "You are a defense audio intelligence analyst. Analyze intercepted communications, field recordings, and personnel audio for stress indicators, coded language, threat signals, and intelligence value.",
    maritime: "You are a maritime communications analyst. Process port authority communications, ship-to-shore radio, and crew recordings for anomalies, distress signals, and coordination patterns.",
    business: "You are a business intelligence analyst. Process meeting recordings, customer calls, and executive briefings for decisions, action items, sentiment, and competitive intelligence.",
    security: "You are a security operations audio analyst. Monitor audio feeds for unauthorized activity, distress keywords, anomalous events, and security protocol violations.",
    general: "You are an audio intelligence analyst. Perform comprehensive analysis of audio transcripts including speaker diarization, sentiment, topic modeling, and key information extraction.",
  };
  return contexts[domain];
}

export async function analyzeAudioTranscript(params: {
  transcript: string;
  domain?: AudioDomain;
  speakerLabels?: Record<string, string>;
  enableStressAnalysis?: boolean;
  enableKeywordSpotting?: boolean;
  triggeredBy?: string;
}): Promise<AudioIntelligenceResult> {
  const audioIntelId = `aud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const actionId = generateActionId();
  const domain = params.domain ?? "general";
  const startTime = Date.now();

  await logAction({
    actionId,
    actionType: "document_processed",
    triggeredBy: params.triggeredBy ?? "api",
    domain,
    input: { transcriptLength: params.transcript.length, domain },
    status: "running",
    approvalRequired: false,
  });

  const systemPrompt = buildAudioSystemPrompt(domain);
  const speakerNote = params.speakerLabels
    ? `Known speaker mappings: ${JSON.stringify(params.speakerLabels)}`
    : "Identify and label speakers as Speaker A, Speaker B, etc.";

  const analysisFeatures = [
    "speaker diarization (who said what)",
    "sentiment analysis per speaker",
    params.enableStressAnalysis !== false ? "stress and deception indicators" : null,
    params.enableKeywordSpotting !== false ? "keyword and topic spotting" : null,
    "key decisions and action items",
    domain === "legal" ? "disputed facts and contradictions" : null,
    "anomalies and unusual patterns",
  ].filter(Boolean).join(", ");

  const userPrompt = `Analyze this audio transcript:

${params.transcript.slice(0, 6000)}

${speakerNote}

Perform: ${analysisFeatures}

Return JSON:
{
  "transcript": "cleaned/formatted transcript",
  "speakerCount": number,
  "speakerSegments": [
    {
      "speakerId": "SPEAKER_A",
      "speakerLabel": "role if known",
      "startTime": "00:00",
      "endTime": "00:30",
      "text": "what they said",
      "sentiment": "positive|neutral|negative|mixed",
      "stressLevel": "low|medium|high",
      "confidence": 0.0-1.0
    }
  ],
  "sentiment": {
    "overall": "positive|neutral|negative|mixed",
    "bySegment": [{"speaker": "SPEAKER_A", "sentiment": "neutral", "confidence": 0.8}]
  },
  "stressAnalysis": {
    "overallStressLevel": "low|medium|high",
    "highStressSegments": ["quote from high-stress moment"],
    "stressIndicators": ["indicator 1", "indicator 2"]
  },
  "keywords": [{"term": "keyword", "frequency": 3, "significance": "high|medium|low"}],
  "topics": [{"topic": "topic name", "relevance": 0.0-1.0, "segments": ["brief quote"]}],
  "keyDecisions": ["decision made"],
  "actionItems": ["action item"],
  "disputedFacts": ["disputed claim"],
  "anomalies": ["anomalous pattern"],
  "summary": "2-3 sentence summary",
  "confidenceScore": 0.0-1.0
}`;

  let result: Omit<AudioIntelligenceResult, "audioIntelId" | "actionId" | "domain" | "latencyMs" | "tokensUsed">;
  let tokensUsed = 0;

  try {
    const response = await gatewayInfer({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 2000,
      strategy: "preferred",
    });

    tokensUsed = response.usage?.totalTokens ?? 0;

    const match = response.content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    const parsed = JSON.parse(match[0]);

    result = {
      transcript: parsed.transcript ?? params.transcript.slice(0, 500),
      speakerCount: parsed.speakerCount ?? 1,
      speakerSegments: parsed.speakerSegments ?? [],
      sentiment: parsed.sentiment ?? { overall: "neutral", bySegment: [] },
      stressAnalysis: parsed.stressAnalysis ?? { overallStressLevel: "low", highStressSegments: [], stressIndicators: [] },
      keywords: parsed.keywords ?? [],
      topics: parsed.topics ?? [],
      keyDecisions: parsed.keyDecisions ?? [],
      actionItems: parsed.actionItems ?? [],
      disputedFacts: parsed.disputedFacts ?? [],
      anomalies: parsed.anomalies ?? [],
      summary: parsed.summary ?? "Audio analyzed",
      confidenceScore: parsed.confidenceScore ?? 0.5,
    };
  } catch {
    result = {
      transcript: params.transcript.slice(0, 500),
      speakerCount: 1,
      speakerSegments: [],
      sentiment: { overall: "neutral", bySegment: [] },
      stressAnalysis: { overallStressLevel: "low", highStressSegments: [], stressIndicators: [] },
      keywords: [],
      topics: [],
      keyDecisions: [],
      actionItems: [],
      disputedFacts: [],
      anomalies: [],
      summary: "Audio transcript processed",
      confidenceScore: 0.3,
    };
  }

  const latencyMs = Date.now() - startTime;
  const fullResult: AudioIntelligenceResult = { audioIntelId, actionId, domain, ...result, latencyMs, tokensUsed };

  await pool.query(
    `INSERT INTO audio_intelligence_results
     (audio_intel_id, action_id, domain, transcript_length, speaker_count, speaker_segments, sentiment,
      stress_analysis, keywords, topics, key_decisions, action_items, disputed_facts, anomalies,
      summary, confidence_score, tokens_used, latency_ms, triggered_by, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW())`,
    [
      audioIntelId, actionId, domain, params.transcript.length, fullResult.speakerCount,
      JSON.stringify(fullResult.speakerSegments), JSON.stringify(fullResult.sentiment),
      JSON.stringify(fullResult.stressAnalysis), JSON.stringify(fullResult.keywords),
      JSON.stringify(fullResult.topics), JSON.stringify(fullResult.keyDecisions),
      JSON.stringify(fullResult.actionItems), JSON.stringify(fullResult.disputedFacts),
      JSON.stringify(fullResult.anomalies), fullResult.summary, fullResult.confidenceScore,
      tokensUsed, latencyMs, params.triggeredBy ?? "api",
    ]
  ).catch(err => logger.warn({ err }, "Failed to persist audio intel result"));

  await updateActionStatus(actionId, "completed", {
    output: { audioIntelId, speakerCount: result.speakerCount, confidenceScore: result.confidenceScore },
    latencyMs,
  });

  logger.info({ audioIntelId, domain, latencyMs }, "Audio intelligence analysis completed");
  return fullResult;
}

export async function classifyAudioEvents(params: {
  audioDescription: string;
  domain?: AudioDomain;
  sensitiveKeywords?: string[];
}): Promise<AudioEventClassification> {
  const classificationId = `evtcls_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const domain = params.domain ?? "security";
  const keywordNote = params.sensitiveKeywords?.length
    ? `Monitor specifically for: ${params.sensitiveKeywords.join(", ")}`
    : "";

  const response = await gatewayInfer({
    messages: [
      {
        role: "system",
        content: `You are a security audio event classifier for ${domain} operations. Classify audio events, detect anomalies, and assess alert requirements.`,
      },
      {
        role: "user",
        content: `Classify audio events in this recording:

${params.audioDescription.slice(0, 3000)}
${keywordNote}

Return JSON:
{
  "detectedEvents": [
    {"eventType": "keyword_detection|anomalous_pattern|distress_signal|unauthorized_access|normal_operation", "confidence": 0.0-1.0, "timestamp": "HH:MM:SS", "description": "what was detected", "severity": "info|warning|alert|critical"}
  ],
  "backgroundNoise": "description of environment",
  "environmentClassification": "office|field|vehicle|restricted_area|public|unknown",
  "anomalyScore": 0.0-1.0,
  "alertRequired": true|false
}`,
      },
    ],
    maxTokens: 800,
    strategy: "fastest",
  });

  try {
    const match = response.content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    const parsed = JSON.parse(match[0]);
    return { classificationId, ...parsed };
  } catch {
    return {
      classificationId,
      detectedEvents: [],
      backgroundNoise: "Unknown",
      environmentClassification: "unknown",
      anomalyScore: 0,
      alertRequired: false,
    };
  }
}

export async function getAudioIntelResult(audioIntelId: string): Promise<any | null> {
  try {
    const result = await pool.query("SELECT * FROM audio_intelligence_results WHERE audio_intel_id = $1", [audioIntelId]);
    return result.rows[0] ?? null;
  } catch { return null; }
}

export async function listAudioIntelResults(filters?: { domain?: string; limit?: number }): Promise<any[]> {
  try {
    const params: any[] = [];
    let query = `SELECT audio_intel_id, domain, speaker_count, summary, confidence_score, created_at FROM audio_intelligence_results WHERE 1=1`;
    let idx = 1;
    if (filters?.domain) { query += ` AND domain = $${idx}`; params.push(filters.domain); idx++; }
    params.push(filters?.limit ?? 20);
    const result = await pool.query(query + ` ORDER BY created_at DESC LIMIT $${idx}`, params);
    return result.rows;
  } catch { return []; }
}
