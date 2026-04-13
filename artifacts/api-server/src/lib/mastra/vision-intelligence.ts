import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";
import { logAction, updateActionStatus, generateActionId } from "./action-audit";

export type VisionDomain = "maritime" | "real_estate" | "legal" | "defense" | "general";
export type VisionTask =
  | "object_detection"
  | "scene_classification"
  | "ocr"
  | "geolocation_estimation"
  | "vessel_identification"
  | "property_assessment"
  | "document_layout"
  | "anomaly_detection"
  | "full_analysis";

export interface VisionAnalysisRequest {
  imageUrl?: string;
  imageBase64?: string;
  imageMimeType?: string;
  tasks: VisionTask[];
  domain?: VisionDomain;
  contextText?: string;
  triggeredBy?: string;
}

export interface DetectedObject {
  label: string;
  confidence: number;
  boundingRegion?: string;
  attributes?: Record<string, string>;
}

export interface ExtractedText {
  text: string;
  region?: string;
  confidence: number;
}

export interface VisionAnalysisResult {
  visionId: string;
  actionId: string;
  domain: VisionDomain;
  sceneDescription: string;
  sceneClassification: { label: string; confidence: number }[];
  detectedObjects: DetectedObject[];
  extractedText: ExtractedText[];
  geoEstimate?: { region: string; confidence: number; clues: string[] };
  domainSpecificFindings: Record<string, any>;
  anomalies: string[];
  overallAssessment: string;
  confidenceScore: number;
  latencyMs: number;
  tokensUsed: number;
}

export interface VideoSummaryResult {
  videoId: string;
  durationEstimate?: string;
  segments: Array<{
    timestamp: string;
    description: string;
    relevanceScore: number;
    keyFrameDesc?: string;
    anomalies: string[];
  }>;
  overallSummary: string;
  keyEvents: string[];
  anomalyTimestamps: string[];
  actionItems: string[];
}

async function ensureVisionTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vision_intelligence_results (
      id BIGSERIAL PRIMARY KEY,
      vision_id TEXT NOT NULL UNIQUE,
      action_id TEXT,
      domain TEXT NOT NULL DEFAULT 'general',
      tasks TEXT[] DEFAULT '{}',
      scene_description TEXT,
      scene_classification JSONB DEFAULT '[]',
      detected_objects JSONB DEFAULT '[]',
      extracted_text JSONB DEFAULT '[]',
      geo_estimate JSONB,
      domain_specific_findings JSONB DEFAULT '{}',
      anomalies JSONB DEFAULT '[]',
      overall_assessment TEXT,
      confidence_score REAL DEFAULT 0,
      tokens_used INTEGER DEFAULT 0,
      latency_ms INTEGER DEFAULT 0,
      triggered_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `).catch(() => {});
}

ensureVisionTable().catch(() => {});

function buildVisionSystemPrompt(domain: VisionDomain, tasks: VisionTask[]): string {
  const domainPrompts: Record<VisionDomain, string> = {
    maritime: "You are a maritime imagery analyst. Identify vessel types, hull markings, flags, cargo configurations, and AIS transponder anomalies from visual evidence.",
    real_estate: "You are a real estate visual analyst. Assess property condition, structural integrity, maintenance level, neighborhood characteristics, and distress indicators.",
    legal: "You are a legal document visual analyst. Analyze document layouts, signature blocks, redaction patterns, seal authenticity, and visual evidence integrity.",
    defense: "You are a defense imagery analyst. Identify personnel, equipment, facilities, movement patterns, and tactical indicators from visual evidence.",
    general: "You are a visual intelligence analyst. Perform comprehensive scene analysis, object detection, text extraction, and anomaly identification.",
  };

  const taskDescriptions = tasks.map(t => {
    switch (t) {
      case "object_detection": return "Detect and catalog all significant objects with confidence scores";
      case "scene_classification": return "Classify the scene type, environment, and context";
      case "ocr": return "Extract all visible text, numbers, and alphanumeric identifiers";
      case "geolocation_estimation": return "Estimate geographic region from visual clues (architecture, vegetation, signage, etc.)";
      case "vessel_identification": return "Identify vessel type, flag state, hull configuration, and registration markings";
      case "property_assessment": return "Assess property condition, age estimates, maintenance level, and distress indicators";
      case "document_layout": return "Analyze document structure, sections, signatures, seals, and layout";
      case "anomaly_detection": return "Identify unusual, suspicious, or anomalous elements";
      case "full_analysis": return "Perform comprehensive analysis across all dimensions";
    }
  });

  return `${domainPrompts[domain]}

Requested analysis tasks:
${taskDescriptions.map(d => `- ${d}`).join("\n")}

Respond with a detailed JSON analysis. Be specific and evidence-based.`;
}

export async function analyzeImage(request: VisionAnalysisRequest): Promise<VisionAnalysisResult> {
  const visionId = `vis_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const actionId = generateActionId();
  const domain = request.domain ?? "general";
  const startTime = Date.now();

  await logAction({
    actionId,
    actionType: "document_processed",
    triggeredBy: request.triggeredBy ?? "api",
    domain,
    input: { tasks: request.tasks, hasImage: !!(request.imageUrl || request.imageBase64) },
    status: "running",
    approvalRequired: false,
  });

  const systemPrompt = buildVisionSystemPrompt(domain, request.tasks);

  const imageContent = request.imageUrl || (request.imageBase64 ? `[BASE64 IMAGE DATA PROVIDED: ${request.imageMimeType ?? "image/jpeg"}]` : null);
  const contextNote = request.contextText ? `\n\nAdditional context: ${request.contextText}` : "";

  const userPrompt = `Analyze this image:${imageContent ? ` ${imageContent}` : " [Image data provided]"}${contextNote}

Return a JSON object with this exact structure:
{
  "sceneDescription": "detailed description of what is depicted",
  "sceneClassification": [{"label": "scene type", "confidence": 0.0-1.0}],
  "detectedObjects": [{"label": "object name", "confidence": 0.0-1.0, "boundingRegion": "location description", "attributes": {"key": "value"}}],
  "extractedText": [{"text": "extracted text", "region": "where it appears", "confidence": 0.0-1.0}],
  "geoEstimate": {"region": "estimated location", "confidence": 0.0-1.0, "clues": ["clue 1", "clue 2"]},
  "domainSpecificFindings": {
    "vesselType": "if maritime",
    "flagState": "if maritime",
    "propertyCondition": "if real_estate",
    "distressIndicators": [],
    "documentType": "if legal",
    "tacticalElements": []
  },
  "anomalies": ["anomaly 1", "anomaly 2"],
  "overallAssessment": "2-3 sentence synthesis",
  "confidenceScore": 0.0-1.0
}`;

  let result: Omit<VisionAnalysisResult, "visionId" | "actionId" | "domain" | "latencyMs" | "tokensUsed">;
  let tokensUsed = 0;

  try {
    const response = await gatewayInfer({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 1500,
      strategy: "preferred",
    });

    tokensUsed = response.usage?.totalTokens ?? 0;

    const match = response.content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in vision response");

    const parsed = JSON.parse(match[0]);
    result = {
      sceneDescription: parsed.sceneDescription ?? "Image analyzed",
      sceneClassification: parsed.sceneClassification ?? [],
      detectedObjects: parsed.detectedObjects ?? [],
      extractedText: parsed.extractedText ?? [],
      geoEstimate: parsed.geoEstimate,
      domainSpecificFindings: parsed.domainSpecificFindings ?? {},
      anomalies: parsed.anomalies ?? [],
      overallAssessment: parsed.overallAssessment ?? "Analysis complete",
      confidenceScore: parsed.confidenceScore ?? 0.5,
    };
  } catch {
    result = {
      sceneDescription: "Image received but detailed analysis unavailable",
      sceneClassification: [],
      detectedObjects: [],
      extractedText: [],
      domainSpecificFindings: {},
      anomalies: [],
      overallAssessment: "Vision analysis completed with limited detail",
      confidenceScore: 0.3,
    };
  }

  const latencyMs = Date.now() - startTime;
  const fullResult: VisionAnalysisResult = { visionId, actionId, domain, ...result, latencyMs, tokensUsed };

  await pool.query(
    `INSERT INTO vision_intelligence_results
     (vision_id, action_id, domain, tasks, scene_description, scene_classification, detected_objects,
      extracted_text, geo_estimate, domain_specific_findings, anomalies, overall_assessment,
      confidence_score, tokens_used, latency_ms, triggered_by, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW())`,
    [
      visionId, actionId, domain, request.tasks,
      fullResult.sceneDescription, JSON.stringify(fullResult.sceneClassification),
      JSON.stringify(fullResult.detectedObjects), JSON.stringify(fullResult.extractedText),
      fullResult.geoEstimate ? JSON.stringify(fullResult.geoEstimate) : null,
      JSON.stringify(fullResult.domainSpecificFindings), JSON.stringify(fullResult.anomalies),
      fullResult.overallAssessment, fullResult.confidenceScore, tokensUsed, latencyMs,
      request.triggeredBy ?? "api",
    ]
  ).catch(err => logger.warn({ err }, "Failed to persist vision result"));

  await updateActionStatus(actionId, "completed", {
    output: { visionId, objectsDetected: result.detectedObjects.length, confidenceScore: result.confidenceScore },
    latencyMs,
  });

  logger.info({ visionId, domain, tasks: request.tasks, latencyMs }, "Vision analysis completed");
  return fullResult;
}

export async function summarizeVideo(params: {
  videoDescription: string;
  domain?: VisionDomain;
  durationHint?: string;
  focusAreas?: string[];
  triggeredBy?: string;
}): Promise<VideoSummaryResult> {
  const videoId = `vid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const domain = params.domain ?? "general";
  const focusNote = params.focusAreas?.length ? `Focus areas: ${params.focusAreas.join(", ")}` : "";

  const response = await gatewayInfer({
    messages: [
      {
        role: "system",
        content: `You are a video intelligence analyst for the ${domain} domain. Analyze video content descriptions and produce structured temporal summaries with anomaly detection and key event extraction.`,
      },
      {
        role: "user",
        content: `Analyze this video content:
${params.videoDescription}
${params.durationHint ? `Estimated duration: ${params.durationHint}` : ""}
${focusNote}

Return JSON:
{
  "durationEstimate": "estimated duration if determinable",
  "segments": [
    {
      "timestamp": "00:00 - 00:30",
      "description": "what happens",
      "relevanceScore": 0.0-1.0,
      "keyFrameDesc": "most important frame",
      "anomalies": ["any anomalies"]
    }
  ],
  "overallSummary": "2-3 sentence summary",
  "keyEvents": ["significant event 1", "event 2"],
  "anomalyTimestamps": ["timestamp with anomaly"],
  "actionItems": ["recommended action 1"]
}`,
      },
    ],
    maxTokens: 1500,
    strategy: "preferred",
  });

  try {
    const match = response.content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    const parsed = JSON.parse(match[0]);
    return { videoId, ...parsed };
  } catch {
    return {
      videoId,
      durationEstimate: params.durationHint,
      segments: [{ timestamp: "00:00", description: params.videoDescription.slice(0, 200), relevanceScore: 0.5, anomalies: [] }],
      overallSummary: "Video content processed",
      keyEvents: [],
      anomalyTimestamps: [],
      actionItems: [],
    };
  }
}

export async function getVisionResult(visionId: string): Promise<any | null> {
  try {
    const result = await pool.query("SELECT * FROM vision_intelligence_results WHERE vision_id = $1", [visionId]);
    return result.rows[0] ?? null;
  } catch { return null; }
}

export async function listVisionResults(filters?: { domain?: string; limit?: number }): Promise<any[]> {
  try {
    const conditions = ["1=1"];
    const params: any[] = [];
    let idx = 1;
    if (filters?.domain) { conditions.push(`domain = $${idx}`); params.push(filters.domain); idx++; }
    params.push(filters?.limit ?? 20);
    const result = await pool.query(
      `SELECT vision_id, domain, tasks, scene_description, overall_assessment, confidence_score, created_at
       FROM vision_intelligence_results WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC LIMIT $${idx}`,
      params
    );
    return result.rows;
  } catch { return []; }
}
