import { Router, type IRouter, type Request, type Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { sendSuccess, sendCreated, sendBadRequest, sendError, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";
import { runCrossModalFusion, listFusionAssessments, getFusionAssessment } from "../lib/mastra/multimodal-fusion";
import { analyzeImage, summarizeVideo, getVisionResult, listVisionResults } from "../lib/mastra/vision-intelligence";
import { analyzeAudioTranscript, classifyAudioEvents, getAudioIntelResult, listAudioIntelResults } from "../lib/mastra/audio-intelligence";
import { generateCode, executeCodeSandboxed, iterativeCodeRefinement, getCodeGenResult, listCodeGenResults } from "../lib/mastra/code-generation";
import { ingestMultimodalContent, queryMultimodalRag, processDocumentIntoChunks, getChunk, listChunks } from "../lib/mastra/multimodal-rag";
import { generateMultimodalOutput, generateIntelligenceBriefing, generateDomainBriefingCard } from "../lib/mastra/multimodal-output";
import { createVoiceSession, processVoiceTurn, getVoiceSession, getVoiceSessionTurns, listVoiceSessions, endVoiceSession } from "../lib/mastra/voice-agent";
import type { FusionDomain, ModalityInput } from "../lib/mastra/multimodal-fusion";
import type { VisionDomain, VisionTask } from "../lib/mastra/vision-intelligence";
import type { AudioDomain } from "../lib/mastra/audio-intelligence";
import type { CodeLanguage, CodeGenDomain } from "../lib/mastra/code-generation";
import type { RagModalityType } from "../lib/mastra/multimodal-rag";
import type { OutputDomain, OutputModality } from "../lib/mastra/multimodal-output";
import type { VoiceAgentDomain } from "../lib/mastra/voice-agent";

const router: IRouter = Router();

router.post("/multimodal/fusion/analyze", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { modalities, domain, focusQuestion } = req.body as {
      modalities: ModalityInput[];
      domain?: FusionDomain;
      focusQuestion?: string;
    };

    if (!modalities?.length || modalities.length < 2) {
      sendBadRequest(res, "At least 2 modality inputs are required for cross-modal fusion");
      return;
    }

    const result = await runCrossModalFusion(modalities, domain ?? "general", {
      triggeredBy: `user:${req.user?.id ?? "anonymous"}`,
      focusQuestion,
    });

    sendCreated(res, result);
  } catch (err) {
    handleRouteError(res, err, "Cross-modal fusion analysis failed");
  }
});

router.get("/multimodal/fusion", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { domain, limit, offset } = req.query as Record<string, string>;
    const result = await listFusionAssessments({
      domain,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    });
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to list fusion assessments");
  }
});

router.get("/multimodal/fusion/:fusionId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const assessment = await getFusionAssessment(req.params.fusionId);
    if (!assessment) { sendError(res, "Fusion assessment not found", 404); return; }
    sendSuccess(res, assessment);
  } catch (err) {
    handleRouteError(res, err, "Failed to get fusion assessment");
  }
});

router.post("/multimodal/vision/analyze", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { imageUrl, imageBase64, imageMimeType, tasks, domain, contextText } = req.body as {
      imageUrl?: string;
      imageBase64?: string;
      imageMimeType?: string;
      tasks?: VisionTask[];
      domain?: VisionDomain;
      contextText?: string;
    };

    if (!imageUrl && !imageBase64 && !contextText) {
      sendBadRequest(res, "imageUrl, imageBase64, or contextText is required");
      return;
    }

    const result = await analyzeImage({
      imageUrl,
      imageBase64,
      imageMimeType,
      tasks: tasks ?? ["full_analysis"],
      domain: domain ?? "general",
      contextText,
      triggeredBy: `user:${req.user?.id ?? "anonymous"}`,
    });

    sendCreated(res, result);
  } catch (err) {
    handleRouteError(res, err, "Vision analysis failed");
  }
});

router.post("/multimodal/vision/video-summary", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { videoDescription, domain, durationHint, focusAreas } = req.body as {
      videoDescription: string;
      domain?: VisionDomain;
      durationHint?: string;
      focusAreas?: string[];
    };

    if (!videoDescription) { sendBadRequest(res, "videoDescription is required"); return; }

    const result = await summarizeVideo({ videoDescription, domain, durationHint, focusAreas });
    sendCreated(res, result);
  } catch (err) {
    handleRouteError(res, err, "Video summarization failed");
  }
});

router.get("/multimodal/vision", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { domain, limit } = req.query as Record<string, string>;
    const results = await listVisionResults({ domain, limit: limit ? parseInt(limit) : 20 });
    sendSuccess(res, { results, total: results.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to list vision results");
  }
});

router.get("/multimodal/vision/:visionId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const result = await getVisionResult(req.params.visionId);
    if (!result) { sendError(res, "Vision result not found", 404); return; }
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to get vision result");
  }
});

router.post("/multimodal/audio/analyze", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { transcript, domain, speakerLabels, enableStressAnalysis, enableKeywordSpotting } = req.body as {
      transcript: string;
      domain?: AudioDomain;
      speakerLabels?: Record<string, string>;
      enableStressAnalysis?: boolean;
      enableKeywordSpotting?: boolean;
    };

    if (!transcript) { sendBadRequest(res, "transcript is required"); return; }
    if (transcript.length < 10) { sendBadRequest(res, "transcript is too short (minimum 10 characters)"); return; }

    const result = await analyzeAudioTranscript({
      transcript,
      domain,
      speakerLabels,
      enableStressAnalysis,
      enableKeywordSpotting,
      triggeredBy: `user:${req.user?.id ?? "anonymous"}`,
    });

    sendCreated(res, result);
  } catch (err) {
    handleRouteError(res, err, "Audio intelligence analysis failed");
  }
});

router.post("/multimodal/audio/classify-events", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { audioDescription, domain, sensitiveKeywords } = req.body as {
      audioDescription: string;
      domain?: AudioDomain;
      sensitiveKeywords?: string[];
    };

    if (!audioDescription) { sendBadRequest(res, "audioDescription is required"); return; }

    const result = await classifyAudioEvents({ audioDescription, domain, sensitiveKeywords });
    sendCreated(res, result);
  } catch (err) {
    handleRouteError(res, err, "Audio event classification failed");
  }
});

router.get("/multimodal/audio", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { domain, limit } = req.query as Record<string, string>;
    const results = await listAudioIntelResults({ domain, limit: limit ? parseInt(limit) : 20 });
    sendSuccess(res, { results, total: results.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to list audio intelligence results");
  }
});

router.get("/multimodal/audio/:audioIntelId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const result = await getAudioIntelResult(req.params.audioIntelId);
    if (!result) { sendError(res, "Audio intelligence result not found", 404); return; }
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to get audio intelligence result");
  }
});

router.post("/multimodal/code/generate", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { task, language, domain, contextData, existingCode, constraints } = req.body as {
      task: string;
      language?: CodeLanguage;
      domain?: CodeGenDomain;
      contextData?: string;
      existingCode?: string;
      constraints?: string[];
    };

    if (!task) { sendBadRequest(res, "task is required"); return; }

    const result = await generateCode({
      task,
      language,
      domain,
      contextData,
      existingCode,
      constraints,
      triggeredBy: `user:${req.user?.id ?? "anonymous"}`,
    });

    sendCreated(res, result);
  } catch (err) {
    handleRouteError(res, err, "Code generation failed");
  }
});

router.post("/multimodal/code/:codeGenId/execute", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { codeGenId } = req.params;
    const { inputData } = req.body as { inputData?: Record<string, any> };

    const codeGen = await getCodeGenResult(codeGenId);
    if (!codeGen) { sendError(res, "Code generation not found", 404); return; }

    const result = await executeCodeSandboxed({
      code: codeGen.code,
      language: codeGen.language,
      codeGenId,
      inputData,
    });

    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Code execution failed");
  }
});

router.post("/multimodal/code/:codeGenId/refine", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { codeGenId } = req.params;
    const { errorMessage } = req.body as { errorMessage: string };

    if (!errorMessage) { sendBadRequest(res, "errorMessage is required"); return; }

    const codeGen = await getCodeGenResult(codeGenId);
    if (!codeGen) { sendError(res, "Code generation not found", 404); return; }

    const result = await iterativeCodeRefinement({
      originalCodeGenId: codeGenId,
      errorMessage,
      language: codeGen.language,
      triggeredBy: `user:${req.user?.id ?? "anonymous"}`,
    });

    sendCreated(res, result);
  } catch (err) {
    handleRouteError(res, err, "Code refinement failed");
  }
});

router.get("/multimodal/code", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { language, domain, limit } = req.query as Record<string, string>;
    const results = await listCodeGenResults({ language, domain, limit: limit ? parseInt(limit) : 20 });
    sendSuccess(res, { results, total: results.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to list code generation results");
  }
});

router.get("/multimodal/code/:codeGenId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const result = await getCodeGenResult(req.params.codeGenId);
    if (!result) { sendError(res, "Code generation not found", 404); return; }
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to get code generation result");
  }
});

router.post("/multimodal/rag/ingest", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { chunks } = req.body as {
      chunks: Array<{
        modalityType: RagModalityType;
        content: string;
        description?: string;
        sourceId?: string;
        sourceName?: string;
        domain?: string;
        tags?: string[];
        metadata?: Record<string, unknown>;
      }>;
    };

    if (!chunks?.length) { sendBadRequest(res, "chunks array is required"); return; }

    const result = await ingestMultimodalContent(chunks, {
      triggeredBy: `user:${req.user?.id ?? "anonymous"}`,
    });

    sendCreated(res, result);
  } catch (err) {
    handleRouteError(res, err, "Multimodal RAG ingestion failed");
  }
});

router.post("/multimodal/rag/ingest-document", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { content, sourceName, sourceId, domain, chunkSize } = req.body as {
      content: string;
      sourceName: string;
      sourceId?: string;
      domain?: string;
      chunkSize?: number;
    };

    if (!content || !sourceName) { sendBadRequest(res, "content and sourceName are required"); return; }

    const chunks = await processDocumentIntoChunks({ content, sourceName, sourceId, domain, chunkSize });
    const result = await ingestMultimodalContent(chunks, {
      triggeredBy: `user:${req.user?.id ?? "anonymous"}`,
    });

    sendCreated(res, { ...result, chunkCount: chunks.length });
  } catch (err) {
    handleRouteError(res, err, "Document ingestion failed");
  }
});

router.post("/multimodal/rag/query", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { query, domain, modalityTypes, topK, sourceIds, tags, produceSummary } = req.body as {
      query: string;
      domain?: string;
      modalityTypes?: RagModalityType[];
      topK?: number;
      sourceIds?: string[];
      tags?: string[];
      produceSummary?: boolean;
    };

    if (!query) { sendBadRequest(res, "query is required"); return; }

    const result = await queryMultimodalRag(query, { domain, modalityTypes, topK, sourceIds, tags, produceSummary });
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Multimodal RAG query failed");
  }
});

router.get("/multimodal/rag/chunks", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { domain, modality_type, source_id, limit } = req.query as Record<string, string>;
    const chunks = await listChunks({
      domain,
      modalityType: modality_type,
      sourceId: source_id,
      limit: limit ? parseInt(limit) : 50,
    });
    sendSuccess(res, { chunks, total: chunks.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to list RAG chunks");
  }
});

router.get("/multimodal/rag/chunks/:chunkId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const chunk = await getChunk(req.params.chunkId);
    if (!chunk) { sendError(res, "Chunk not found", 404); return; }
    sendSuccess(res, chunk);
  } catch (err) {
    handleRouteError(res, err, "Failed to get RAG chunk");
  }
});

router.post("/multimodal/output/generate", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { content, domain, requestedModalities, title, contextData } = req.body as {
      content: string;
      domain?: OutputDomain;
      requestedModalities?: OutputModality[];
      title?: string;
      contextData?: Record<string, any>;
    };

    if (!content) { sendBadRequest(res, "content is required"); return; }

    const result = await generateMultimodalOutput({ content, domain, requestedModalities, title, contextData });
    sendCreated(res, result);
  } catch (err) {
    handleRouteError(res, err, "Multimodal output generation failed");
  }
});

router.post("/multimodal/output/briefing", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { domain, assessments, title } = req.body as {
      domain: OutputDomain;
      assessments: string[];
      title?: string;
    };

    if (!assessments?.length) { sendBadRequest(res, "assessments array is required"); return; }

    const result = await generateIntelligenceBriefing({ domain, assessments, title });
    sendCreated(res, result);
  } catch (err) {
    handleRouteError(res, err, "Intelligence briefing generation failed");
  }
});

router.post("/multimodal/output/briefing-card", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { domain, headline, data } = req.body as {
      domain: OutputDomain;
      headline: string;
      data: Record<string, any>;
    };

    if (!domain || !headline) { sendBadRequest(res, "domain and headline are required"); return; }

    const result = await generateDomainBriefingCard({ domain, headline, data: data ?? {} });
    sendCreated(res, result);
  } catch (err) {
    handleRouteError(res, err, "Briefing card generation failed");
  }
});

router.post("/multimodal/voice/sessions", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { domain, agentIdOverride } = req.body as {
      domain?: VoiceAgentDomain;
      agentIdOverride?: string;
    };

    const session = await createVoiceSession({
      domain,
      userId: req.user?.id?.toString(),
      agentIdOverride,
    });

    sendCreated(res, session);
  } catch (err) {
    handleRouteError(res, err, "Failed to create voice agent session");
  }
});

router.post("/multimodal/voice/sessions/:sessionId/turn", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { transcript, vadInterrupted } = req.body as {
      transcript: string;
      vadInterrupted?: boolean;
    };

    if (!transcript) { sendBadRequest(res, "transcript is required"); return; }
    if (transcript.length < 2) { sendBadRequest(res, "transcript is too short"); return; }

    const result = await processVoiceTurn({
      sessionId,
      transcript,
      vadInterrupted,
      userId: req.user?.id?.toString(),
    });

    sendSuccess(res, result);
  } catch (err) {
    if ((err as Error).message.includes("not found")) {
      sendError(res, "Voice session not found", 404);
    } else {
      handleRouteError(res, err, "Voice agent turn failed");
    }
  }
});

router.get("/multimodal/voice/sessions/:sessionId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const session = await getVoiceSession(req.params.sessionId);
    if (!session) { sendError(res, "Voice session not found", 404); return; }
    sendSuccess(res, session);
  } catch (err) {
    handleRouteError(res, err, "Failed to get voice session");
  }
});

router.get("/multimodal/voice/sessions/:sessionId/turns", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { limit } = req.query as Record<string, string>;
    const turns = await getVoiceSessionTurns(req.params.sessionId, limit ? parseInt(limit) : 20);
    sendSuccess(res, { turns, total: turns.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to get voice session turns");
  }
});

router.delete("/multimodal/voice/sessions/:sessionId", authMiddleware(), async (req: Request, res: Response) => {
  try {
    await endVoiceSession(req.params.sessionId);
    sendSuccess(res, { ended: true, sessionId: req.params.sessionId });
  } catch (err) {
    handleRouteError(res, err, "Failed to end voice session");
  }
});

router.get("/multimodal/voice/sessions", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { domain, limit } = req.query as Record<string, string>;
    const sessions = await listVoiceSessions({
      domain,
      userId: req.user?.id?.toString(),
      limit: limit ? parseInt(limit) : 20,
    });
    sendSuccess(res, { sessions, total: sessions.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to list voice sessions");
  }
});

router.get("/multimodal/status", authMiddleware(), async (_req: Request, res: Response) => {
  sendSuccess(res, {
    modules: {
      crossModalFusion: "active",
      visionIntelligence: "active",
      audioIntelligence: "active",
      codeGeneration: "active",
      multimodalRag: "active",
      multimodalOutput: "active",
      voiceAgents: "active",
    },
    capabilities: [
      "cross-modal-fusion",
      "vision-analysis",
      "video-summarization",
      "audio-transcript-analysis",
      "speaker-diarization",
      "stress-analysis",
      "keyword-spotting",
      "code-generation",
      "sandboxed-execution",
      "multimodal-rag",
      "document-chunking",
      "multimodal-output",
      "intelligence-briefings",
      "voice-agent-sessions",
      "conversational-voice",
    ],
    domains: ["maritime", "real_estate", "legal", "defense", "financial", "general"],
    voiceAgentDomains: ["vessels", "aegis", "terra", "prism", "lyte", "carlota-jo", "szl"],
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
  });
});

export { router as multimodalRouter };
