import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@szl-holdings/db";
import { services } from "@szl-holdings/services";
import { authMiddleware } from "../middlewares/auth";
import { sendSuccess, sendCreated, sendBadRequest, sendError, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";
import multer from "multer";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });


type IntentType = "task" | "research" | "note" | "reminder" | "meeting_note" | "action" | "unknown";

function detectIntent(transcription: string): IntentType {
  const lower = transcription.toLowerCase();
  if (lower.includes("task") || lower.includes("create a") || lower.includes("make sure") || lower.includes("todo")) return "task";
  if (lower.includes("research") || lower.includes("find out") || lower.includes("investigate") || lower.includes("look into")) return "research";
  if (lower.includes("meeting") || lower.includes("notes from") || lower.includes("discussed")) return "meeting_note";
  if (lower.includes("remind me") || lower.includes("reminder")) return "reminder";
  if (lower.includes("note") || lower.includes("remember")) return "note";
  if (lower.includes("do") || lower.includes("complete") || lower.includes("action")) return "action";
  return "unknown";
}

async function transcribeAudio(buffer: Buffer, mimeType: string): Promise<{ text: string; duration?: number }> {
  const replitKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const replitUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = replitKey;
  const baseUrl = replitUrl;

  if (!apiKey || !baseUrl) {
    throw new Error("OpenAI API not configured for transcription");
  }

  const ext = mimeType.includes("webm") ? "webm" : mimeType.includes("mp3") ? "mp3" : mimeType.includes("wav") ? "wav" : mimeType.includes("m4a") ? "m4a" : "mp3";
  const filename = `voice.${ext}`;

  const form = new FormData();
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: mimeType });
  form.append("file", blob, filename);
  form.append("model", "whisper-1");
  form.append("response_format", "verbose_json");

  const response = await fetch(`${baseUrl}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Transcription failed: ${response.status} ${errText}`);
  }

  const data = await response.json() as { text: string; duration?: number };
  return { text: data.text, duration: data.duration };
}

router.post("/alloy/voice/transcribe", authMiddleware(), upload.single("audio"), async (req: Request, res: Response) => {
  try {
    const file = (req as Request & { file?: Express.Multer.File }).file;
    const { convertTo, title } = req.body as { convertTo?: string; title?: string };

    if (!file) {
      sendBadRequest(res, "audio file is required (field name: 'audio')");
      return;
    }

    const id = `voice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const mimeType = file.mimetype || "audio/mp3";

    await pool.query(
      `INSERT INTO alloy_voice_notes (id, title, status, audio_size_bytes, audio_mime_type, created_by, created_at, updated_at)
       VALUES ($1,$2,'processing',$3,$4,$5,NOW(),NOW())`,
      [id, title ?? null, file.size, mimeType, req.user?.id ?? null],
    );

    res.status(202).json({ success: true, data: { id, status: "processing" } });

    setImmediate(async () => {
      try {
        let transcription = "";
        let duration: number | undefined;

        try {
          const result = await transcribeAudio(file.buffer, mimeType);
          transcription = result.text;
          duration = result.duration;
        } catch (transcribeErr) {
          logger.error({ err: transcribeErr, voiceNoteId: id }, "alloy-voice: transcription failed — marking as failed, no fallback");
          await pool.query(
            `UPDATE alloy_voice_notes SET status='failed', updated_at=NOW() WHERE id=$1`,
            [id],
          );
          return;
        }

        const intent = detectIntent(transcription);

        const summaryResult = await services.ai.chatCompletion([
          { role: "system", content: "You are a voice note processor. Summarize the transcription in one sentence and identify the primary action needed. Respond in JSON: { summary: string, action: string, priority: 'high'|'medium'|'low' }" },
          { role: "user", content: transcription },
        ], { maxTokens: 200 });

        let summary = transcription.slice(0, 100);
        let suggestedTitle = title ?? transcription.slice(0, 50);

        try {
          const jsonMatch = summaryResult.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as { summary?: string; action?: string };
            summary = parsed.summary ?? summary;
            suggestedTitle = title ?? parsed.action ?? suggestedTitle;
          }
        } catch { }

        let convertedTo: string | null = null;
        let convertedId: string | null = null;

        if (convertTo === "task" || (convertTo !== "note" && intent === "task") || (convertTo !== "note" && intent === "research")) {
          convertedTo = "alloy_signal";
          try {
            const sigResult = await pool.query(
              `INSERT INTO alloy_signals (source, source_type, title, summary, domain, severity, status, metadata, created_at, updated_at)
               VALUES ('voice_note', 'manual', $1, $2, 'voice', 'info', 'raw', $3, NOW(), NOW()) RETURNING id`,
              [suggestedTitle, summary, JSON.stringify({ voiceNoteId: id, transcription: transcription.slice(0, 500), intent })],
            );
            convertedId = String(sigResult.rows[0]?.id ?? "");
          } catch {
            logger.warn("alloy-voice: failed to create signal from voice note");
          }
        }

        await pool.query(
          `UPDATE alloy_voice_notes SET
             title=$1, transcription=$2, ai_summary=$3, detected_intent=$4,
             converted_to=$5, converted_id=$6, duration_seconds=$7,
             status='completed', updated_at=NOW()
           WHERE id=$8`,
          [suggestedTitle, transcription, summary, intent, convertedTo, convertedId, duration ?? null, id],
        );

        logger.info({ voiceNoteId: id, intent, convertedTo }, "alloy-voice: transcription completed");
      } catch (asyncErr) {
        logger.error({ err: asyncErr, voiceNoteId: id }, "alloy-voice: async processing failed");
        await pool.query(`UPDATE alloy_voice_notes SET status='failed', updated_at=NOW() WHERE id=$1`, [id]);
      }
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to process voice note");
  }
});

router.post("/alloy/voice/transcribe-text", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { text, convertTo, title } = req.body as { text: string; convertTo?: string; title?: string };
    if (!text) { sendBadRequest(res, "text is required for text-based voice note"); return; }

    const id = `voice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const intent = detectIntent(text);

    const summaryResult = await services.ai.chatCompletion([
      { role: "system", content: "Process this voice note text. Respond in JSON: { summary: string, suggestedTitle: string, priority: 'high'|'medium'|'low', actionItems: string[] }" },
      { role: "user", content: text },
    ], { maxTokens: 300 });

    let summary = text.slice(0, 100);
    let suggestedTitle = title ?? text.slice(0, 50);
    let actionItems: string[] = [];

    try {
      const jsonMatch = summaryResult.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { summary?: string; suggestedTitle?: string; actionItems?: string[] };
        summary = parsed.summary ?? summary;
        suggestedTitle = title ?? parsed.suggestedTitle ?? suggestedTitle;
        actionItems = parsed.actionItems ?? [];
      }
    } catch { }

    await pool.query(
      `INSERT INTO alloy_voice_notes (id, title, transcription, ai_summary, detected_intent, status, metadata, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,'completed',$6,$7,NOW(),NOW())`,
      [id, suggestedTitle, text, summary, intent, JSON.stringify({ actionItems, source: "text_input" }), req.user?.id ?? null],
    );

    sendCreated(res, { id, title: suggestedTitle, transcription: text, summary, intent, actionItems, status: "completed" });
  } catch (err) {
    handleRouteError(res, err, "Failed to process voice note text");
  }
});

router.get("/alloy/voice/notes", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { status, limit: limitStr = "20" } = req.query as Record<string, string>;
    const limit = Math.min(parseInt(limitStr, 10), 100);
    const userId = req.user?.id ?? null;
    let q = `SELECT id, title, ai_summary, detected_intent, converted_to, converted_id, duration_seconds, status, created_at FROM alloy_voice_notes WHERE 1=1`;
    const params: unknown[] = [];
    let idx = 1;
    if (userId) { q += ` AND (created_by = $${idx++} OR created_by IS NULL)`; params.push(userId); }
    if (status) { q += ` AND status = $${idx++}`; params.push(status); }
    q += ` ORDER BY created_at DESC LIMIT $${idx}`;
    params.push(limit);
    const result = await pool.query(q, params);
    sendSuccess(res, { notes: result.rows, total: result.rowCount });
  } catch (err) {
    handleRouteError(res, err, "Failed to list voice notes");
  }
});

router.get("/alloy/voice/notes/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id ?? null;
    const result = await pool.query(
      `SELECT * FROM alloy_voice_notes WHERE id = $1 AND (created_by = $2 OR created_by IS NULL)`,
      [req.params.id, userId],
    );
    if (!result.rows[0]) { sendError(res, "Voice note not found", 404); return; }
    sendSuccess(res, result.rows[0]);
  } catch (err) {
    handleRouteError(res, err, "Failed to get voice note");
  }
});

router.delete("/alloy/voice/notes/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id ?? null;
    const result = await pool.query(
      `DELETE FROM alloy_voice_notes WHERE id = $1 AND (created_by = $2 OR created_by IS NULL) RETURNING id`,
      [req.params.id, userId],
    );
    if (!result.rows[0]) { sendError(res, "Voice note not found or access denied", 404); return; }
    sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete voice note");
  }
});

export default router;
