import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@szl-holdings/db";
import {
  agentTrainingPairs,
  agentBehaviorPrefs,
  agentFeedback,
  advisoryAudit,
} from "@szl-holdings/db";
import { eq, desc, asc, and, avg, count } from "drizzle-orm";
import { openai } from "@szl-holdings/ai-engine/providers/openai";
import multer from "multer";
import { z } from "zod";
import { authMiddleware } from "../middlewares/auth";
import { validateBody } from "../lib/validation";
import { sendError, sendBadRequest } from "../lib/api-response";

const trainingRouter: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

trainingRouter.use(authMiddleware());

const trainingPairSchema = z.object({
  agentId: z.string().min(1).max(100),
  question: z.string().min(1).max(5000).trim(),
  answer: z.string().min(1).max(10000).trim(),
  category: z.string().max(100).optional(),
});

const behaviorPrefSchema = z.object({
  tone: z.string().max(100).optional(),
  detailLevel: z.string().max(100).optional(),
  domainJargon: z.boolean().optional(),
  responseLength: z.string().max(100).optional(),
  customInstructions: z.string().max(5000).optional(),
});

const feedbackSchema = z.object({
  agentId: z.string().min(1).max(100),
  rating: z.number().int().min(1).max(5),
  messageContent: z.string().max(5000).optional(),
  responseContent: z.string().max(10000).optional(),
  feedbackNote: z.string().max(2000).optional(),
});

const advisoryAuditSchema = z.object({
  agentId: z.string().min(1).max(100),
  recommendationType: z.string().min(1).max(100),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  title: z.string().min(1).max(500).trim(),
  description: z.string().min(1).max(5000).trim(),
  runbook: z.string().max(10000).optional(),
});

const advisoryAuditActionSchema = z.object({
  status: z.string().min(1).max(100),
});

const ttsSchema = z.object({
  text: z.string().min(1).max(4096),
  voice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]).optional(),
});

trainingRouter.get("/agent-training/pairs/:agentId", async (req: Request, res: Response) => {
  try {
    const agentId = String(req.params["agentId"]);
    const pairs = await db
      .select()
      .from(agentTrainingPairs)
      .where(and(eq(agentTrainingPairs.agentId, agentId), eq(agentTrainingPairs.isActive, true)))
      .orderBy(desc(agentTrainingPairs.createdAt))
      .limit(100);
    res.json({ pairs });
  } catch {
    sendError(res, "Failed to load training pairs");
  }
});

trainingRouter.post("/agent-training/pairs", validateBody(trainingPairSchema), async (req: Request, res: Response) => {
  try {
    const { agentId, question, answer, category } = req.body as z.infer<typeof trainingPairSchema>;
    const [pair] = await db
      .insert(agentTrainingPairs)
      .values({ agentId, question, answer, category: category ?? "general" })
      .returning();
    res.status(201).json(pair);
  } catch {
    sendError(res, "Failed to create training pair");
  }
});

trainingRouter.delete("/agent-training/pairs/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params["id"]!), 10);
    await db
      .update(agentTrainingPairs)
      .set({ isActive: false })
      .where(eq(agentTrainingPairs.id, id));
    res.json({ success: true });
  } catch {
    sendError(res, "Failed to delete training pair");
  }
});

trainingRouter.get("/agent-training/prefs/:agentId", async (req: Request, res: Response) => {
  try {
    const agentId = String(req.params["agentId"]);
    const [prefs] = await db
      .select()
      .from(agentBehaviorPrefs)
      .where(eq(agentBehaviorPrefs.agentId, agentId))
      .limit(1);
    res.json(prefs ?? { agentId, tone: "professional", detailLevel: "balanced", domainJargon: true, responseLength: "medium", customInstructions: "" });
  } catch {
    sendError(res, "Failed to load preferences");
  }
});

trainingRouter.post("/agent-training/prefs/:agentId", validateBody(behaviorPrefSchema), async (req: Request, res: Response) => {
  try {
    const agentId = String(req.params["agentId"]);
    const { tone, detailLevel, domainJargon, responseLength, customInstructions } = req.body as z.infer<typeof behaviorPrefSchema>;
    const existing = await db
      .select()
      .from(agentBehaviorPrefs)
      .where(eq(agentBehaviorPrefs.agentId, agentId))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(agentBehaviorPrefs)
        .set({ tone, detailLevel, domainJargon, responseLength, customInstructions, updatedAt: new Date() })
        .where(eq(agentBehaviorPrefs.agentId, agentId))
        .returning();
      res.json(updated);
    } else {
      const [created] = await db
        .insert(agentBehaviorPrefs)
        .values({ agentId, tone: tone ?? "professional", detailLevel: detailLevel ?? "balanced", domainJargon: domainJargon ?? true, responseLength: responseLength ?? "medium", customInstructions })
        .returning();
      res.json(created);
    }
  } catch {
    sendError(res, "Failed to save preferences");
  }
});

trainingRouter.post("/agent-training/feedback", validateBody(feedbackSchema), async (req: Request, res: Response) => {
  try {
    const { agentId, rating, messageContent, responseContent, feedbackNote } = req.body as z.infer<typeof feedbackSchema>;
    const [fb] = await db
      .insert(agentFeedback)
      .values({ agentId, rating, messageContent, responseContent, feedbackNote })
      .returning();
    res.status(201).json(fb);
  } catch {
    sendError(res, "Failed to save feedback");
  }
});

trainingRouter.get("/agent-training/performance", async (_req: Request, res: Response) => {
  try {
    const allFeedback = await db
      .select({
        agentId: agentFeedback.agentId,
        avgRating: avg(agentFeedback.rating),
        total: count(agentFeedback.id),
      })
      .from(agentFeedback)
      .groupBy(agentFeedback.agentId);

    const allPairs = await db
      .select({
        agentId: agentTrainingPairs.agentId,
        pairCount: count(agentTrainingPairs.id),
      })
      .from(agentTrainingPairs)
      .where(eq(agentTrainingPairs.isActive, true))
      .groupBy(agentTrainingPairs.agentId);

    const pairMap = new Map(allPairs.map(p => [p.agentId, Number(p.pairCount)]));

    const performance = allFeedback.map(f => ({
      agentId: f.agentId,
      avgRating: parseFloat(String(f.avgRating ?? 0)).toFixed(2),
      totalFeedback: Number(f.total),
      trainingPairs: pairMap.get(f.agentId) ?? 0,
      needsTraining: parseFloat(String(f.avgRating ?? 5)) < 3.5,
    }));

    res.json({ performance });
  } catch {
    sendError(res, "Failed to load performance data");
  }
});

trainingRouter.get("/agent-training/advisory-audit", async (_req: Request, res: Response) => {
  try {
    const audits = await db
      .select()
      .from(advisoryAudit)
      .orderBy(desc(advisoryAudit.createdAt))
      .limit(100);
    res.json({ audits });
  } catch {
    sendError(res, "Failed to load advisory audit");
  }
});

trainingRouter.post("/agent-training/advisory-audit", validateBody(advisoryAuditSchema), async (req: Request, res: Response) => {
  try {
    const { agentId, recommendationType, riskLevel, title, description, runbook } = req.body as z.infer<typeof advisoryAuditSchema>;
    const [audit] = await db
      .insert(advisoryAudit)
      .values({ agentId, recommendationType, riskLevel, title, description, runbook })
      .returning();
    res.status(201).json(audit);
  } catch {
    sendError(res, "Failed to create advisory audit entry");
  }
});

trainingRouter.patch("/agent-training/advisory-audit/:id/action", validateBody(advisoryAuditActionSchema), async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params["id"]!), 10);
    const { status } = req.body as z.infer<typeof advisoryAuditActionSchema>;
    const [updated] = await db
      .update(advisoryAudit)
      .set({ status: status ?? "actioned", actionedAt: new Date() })
      .where(eq(advisoryAudit.id, id))
      .returning();
    res.json(updated);
  } catch {
    sendError(res, "Failed to update advisory audit");
  }
});

trainingRouter.post("/agent-training/transcribe", upload.single("audio"), async (req: Request, res: Response) => {
  try {
    if (!req.file && !req.body.audio) {
      sendBadRequest(res, "No audio provided");
      return;
    }

    let audioBuffer: Buffer;
    let mimeType = "audio/webm";

    if (req.file) {
      audioBuffer = req.file.buffer;
      mimeType = req.file.mimetype || "audio/webm";
    } else {
      const base64 = req.body.audio as string;
      const commaIdx = base64.indexOf(",");
      const raw = commaIdx !== -1 ? base64.slice(commaIdx + 1) : base64;
      audioBuffer = Buffer.from(raw, "base64");
      mimeType = req.body.mimeType ?? "audio/webm";
    }

    const ext = mimeType.includes("mp4") || mimeType.includes("aac") ? "mp4"
      : mimeType.includes("mp3") ? "mp3"
      : mimeType.includes("wav") ? "wav"
      : "webm";

    const { toFile } = await import("@szl-holdings/ai-engine/providers/openai");
    const audioFile = await toFile(audioBuffer, `audio.${ext}`, { type: mimeType });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    res.json({ transcript: transcription.text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Transcription failed";
    sendError(res, msg);
  }
});

trainingRouter.post("/agent-training/tts", validateBody(ttsSchema), async (req: Request, res: Response) => {
  try {
    const { text, voice = "alloy" } = req.body as z.infer<typeof ttsSchema>;

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
      input: text.slice(0, 4096),
      response_format: "mp3",
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-cache");
    res.send(buffer);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "TTS failed";
    sendError(res, msg);
  }
});

export default trainingRouter;
