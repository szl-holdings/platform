import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  agentTrainingPairs,
  agentBehaviorPrefs,
  agentFeedback,
  advisoryAudit,
} from "@workspace/db";
import { eq, desc, asc, and, avg, count } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import multer from "multer";

const trainingRouter: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

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
    res.status(500).json({ error: "Failed to load training pairs" });
  }
});

trainingRouter.post("/agent-training/pairs", async (req: Request, res: Response) => {
  try {
    const { agentId, question, answer, category } = req.body as {
      agentId: string;
      question: string;
      answer: string;
      category?: string;
    };
    if (!agentId || !question || !answer) {
      res.status(400).json({ error: "agentId, question, and answer are required" });
      return;
    }
    const [pair] = await db
      .insert(agentTrainingPairs)
      .values({ agentId, question, answer, category: category ?? "general" })
      .returning();
    res.status(201).json(pair);
  } catch {
    res.status(500).json({ error: "Failed to create training pair" });
  }
});

trainingRouter.delete("/agent-training/pairs/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"]!, 10);
    await db
      .update(agentTrainingPairs)
      .set({ isActive: false })
      .where(eq(agentTrainingPairs.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete training pair" });
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
    res.status(500).json({ error: "Failed to load preferences" });
  }
});

trainingRouter.post("/agent-training/prefs/:agentId", async (req: Request, res: Response) => {
  try {
    const agentId = String(req.params["agentId"]);
    const { tone, detailLevel, domainJargon, responseLength, customInstructions } = req.body as {
      tone?: string;
      detailLevel?: string;
      domainJargon?: boolean;
      responseLength?: string;
      customInstructions?: string;
    };
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
    res.status(500).json({ error: "Failed to save preferences" });
  }
});

trainingRouter.post("/agent-training/feedback", async (req: Request, res: Response) => {
  try {
    const { agentId, rating, messageContent, responseContent, feedbackNote } = req.body as {
      agentId: string;
      rating: number;
      messageContent?: string;
      responseContent?: string;
      feedbackNote?: string;
    };
    if (!agentId || typeof rating !== "number") {
      res.status(400).json({ error: "agentId and rating are required" });
      return;
    }
    const [fb] = await db
      .insert(agentFeedback)
      .values({ agentId, rating, messageContent, responseContent, feedbackNote })
      .returning();
    res.status(201).json(fb);
  } catch {
    res.status(500).json({ error: "Failed to save feedback" });
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
    res.status(500).json({ error: "Failed to load performance data" });
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
    res.status(500).json({ error: "Failed to load advisory audit" });
  }
});

trainingRouter.post("/agent-training/advisory-audit", async (req: Request, res: Response) => {
  try {
    const { agentId, recommendationType, riskLevel, title, description, runbook } = req.body as {
      agentId: string;
      recommendationType: string;
      riskLevel: string;
      title: string;
      description: string;
      runbook?: string;
    };
    if (!agentId || !recommendationType || !riskLevel || !title || !description) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const [audit] = await db
      .insert(advisoryAudit)
      .values({ agentId, recommendationType, riskLevel, title, description, runbook })
      .returning();
    res.status(201).json(audit);
  } catch {
    res.status(500).json({ error: "Failed to create advisory audit entry" });
  }
});

trainingRouter.patch("/agent-training/advisory-audit/:id/action", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"]!, 10);
    const { status } = req.body as { status: string };
    const [updated] = await db
      .update(advisoryAudit)
      .set({ status: status ?? "actioned", actionedAt: new Date() })
      .where(eq(advisoryAudit.id, id))
      .returning();
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to update advisory audit" });
  }
});

trainingRouter.post("/agent-training/transcribe", upload.single("audio"), async (req: Request, res: Response) => {
  try {
    if (!req.file && !req.body.audio) {
      res.status(400).json({ error: "No audio provided" });
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

    const openaiModule = await import("openai");
    const toFile = openaiModule.toFile;
    const audioFile = await toFile(audioBuffer, `audio.${ext}`, { type: mimeType });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    res.json({ transcript: transcription.text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Transcription failed";
    res.status(500).json({ error: msg });
  }
});

trainingRouter.post("/agent-training/tts", async (req: Request, res: Response) => {
  try {
    const { text, voice = "alloy" } = req.body as { text: string; voice?: string };
    if (!text) {
      res.status(400).json({ error: "text is required" });
      return;
    }

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
    res.status(500).json({ error: msg });
  }
});

export default trainingRouter;
