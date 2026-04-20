import { Router, type IRouter, type Request, type Response } from "express";
import { bodyShape } from "@szl-holdings/contracts/common";
import { z } from "zod";
import { pool } from "@szl-holdings/db";
import { services } from "@szl-holdings/services";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { sendSuccess, sendCreated, sendBadRequest, sendError, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";
import { validateBody, validateQuery, listQuerySchema } from "../lib/validation";

const router: IRouter = Router();


interface ExtractedMeetingData {
  summary: string;
  decisions: Array<{ title: string; description: string; decidedBy?: string; rationale?: string; impact?: string }>;
  actionItems: Array<{ title: string; description: string; assignee?: string; dueDate?: string; priority: string }>;
  followUpDraft: string;
  agenda: string[];
  keyPoints: string[];
}

async function extractMeetingData(transcript: string, title: string, attendees: string[]): Promise<ExtractedMeetingData> {
  const prompt = `You are an expert meeting analyst. Extract structured information from this meeting transcript.

Meeting: "${title}"
Attendees: ${attendees.join(", ") || "Unknown"}

Transcript:
${transcript.slice(0, 8000)}

Respond in valid JSON with this exact structure:
{
  "summary": "2-3 sentence meeting summary",
  "agenda": ["topic 1", "topic 2"],
  "keyPoints": ["key point 1", "key point 2"],
  "decisions": [
    {
      "title": "Decision title",
      "description": "What was decided",
      "decidedBy": "Person name or null",
      "rationale": "Why this was decided",
      "impact": "Expected impact"
    }
  ],
  "actionItems": [
    {
      "title": "Action item title",
      "description": "What needs to be done",
      "assignee": "Person name or null",
      "dueDate": "YYYY-MM-DD or relative like 'next Friday' or null",
      "priority": "high|medium|low"
    }
  ],
  "followUpDraft": "Draft follow-up email body (professional, 150-200 words)"
}`;

  try {
    const result = await services.ai.chatCompletion([
      { role: "system", content: "You are a professional meeting analyst. Always respond with valid JSON only. No extra text." },
      { role: "user", content: prompt },
    ], { maxTokens: 2000 });

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ExtractedMeetingData;
    }
  } catch (err) {
    logger.warn({ err }, "alloy-meetings: AI extraction failed, using defaults");
  }

  return {
    summary: `Meeting: ${title}. Transcript processed but extraction encountered an issue.`,
    decisions: [],
    actionItems: [],
    followUpDraft: `Hi team,\n\nThank you for joining today's meeting on "${title}". Please review the attached notes and action items.\n\nBest regards`,
    agenda: [],
    keyPoints: [],
  };
}

router.post("/alloy/meetings/capture", authMiddleware(), validateBody(bodyShape({
      "attendees": z.unknown().optional(),
      "durationMinutes": z.unknown().optional(),
      "meetingDate": z.unknown().optional(),
      "metadata": z.unknown().optional(),
      "recordingUrl": z.unknown().optional(),
      "title": z.unknown().optional(),
      "transcript": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const { title, transcript, recordingUrl, meetingDate, durationMinutes, attendees = [], metadata } = req.body as {
      title: string;
      transcript?: string;
      recordingUrl?: string;
      meetingDate?: string;
      durationMinutes?: number;
      attendees?: Array<{ name: string; email?: string; role?: string }>;
      metadata?: Record<string, unknown>;
    };

    if (!title) { sendBadRequest(res, "title is required"); return; }
    if (!transcript && !recordingUrl) { sendBadRequest(res, "transcript or recordingUrl is required"); return; }

    const id = `meet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await pool.query(
      `INSERT INTO alloy_meetings (id, title, meeting_date, duration_minutes, attendees, transcript, recording_url, status, metadata, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'processing',$8,$9,NOW(),NOW())`,
      [id, title, meetingDate ? new Date(meetingDate) : null, durationMinutes ?? null,
       JSON.stringify(attendees), transcript ?? null, recordingUrl ?? null,
       JSON.stringify(metadata ?? {}), req.user?.id ?? null],
    );

    res.status(202).json({ success: true, data: { id, status: "processing", message: "Meeting capture initiated" } });

    setImmediate(async () => {
      try {
        const sourceText = transcript ?? `[Recording URL provided: ${recordingUrl}. Transcript not available.]`;
        const attendeeNames = attendees.map(a => a.name ?? a.email ?? "Unknown");

        const extracted = await extractMeetingData(sourceText, title, attendeeNames);

        await pool.query(
          `UPDATE alloy_meetings SET
             summary = $1, structured_notes = $2, decisions = $3, action_items = $4,
             follow_up_draft = $5, status = 'completed', updated_at = NOW()
           WHERE id = $6`,
          [
            extracted.summary,
            JSON.stringify({ agenda: extracted.agenda, keyPoints: extracted.keyPoints }),
            JSON.stringify(extracted.decisions),
            JSON.stringify(extracted.actionItems),
            extracted.followUpDraft,
            id,
          ],
        );

        for (const decision of extracted.decisions) {
          const did = `mdec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          await pool.query(
            `INSERT INTO alloy_meeting_decisions (id, meeting_id, title, description, decided_by, impact, rationale, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
            [did, id, decision.title, decision.description, decision.decidedBy ?? null, decision.impact ?? null, decision.rationale ?? null],
          );
        }

        for (const item of extracted.actionItems) {
          const aid = `mact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

          let alloyTaskId: string | null = null;
          try {
            const sigResult = await pool.query(
              `INSERT INTO alloy_signals (source, source_type, title, summary, domain, severity, status, metadata, created_at, updated_at)
               VALUES ('meeting_capture', 'automated', $1, $2, 'meetings', $3, 'raw', $4, NOW(), NOW()) RETURNING id`,
              [
                item.title,
                item.description ?? `Action item from meeting: ${title}. Assignee: ${item.assignee ?? "unassigned"}.`,
                item.priority === "high" ? "high" : item.priority === "low" ? "low" : "medium",
                JSON.stringify({ meetingId: id, meetingTitle: title, assignee: item.assignee, dueDate: item.dueDate }),
              ],
            );
            alloyTaskId = String(sigResult.rows[0]?.id ?? "");
          } catch (sigErr) {
            logger.warn({ err: sigErr }, "alloy-meetings: failed to create alloy signal for action item");
          }

          await pool.query(
            `INSERT INTO alloy_meeting_action_items (id, meeting_id, title, description, assignee, due_date, priority, status, alloy_task_id, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,'open',$8,NOW(),NOW())`,
            [aid, id, item.title, item.description ?? null, item.assignee ?? null, item.dueDate ?? null, item.priority ?? "medium", alloyTaskId],
          );
        }

        logger.info({ meetingId: id, decisions: extracted.decisions.length, actionItems: extracted.actionItems.length }, "alloy-meetings: capture completed");
      } catch (asyncErr) {
        logger.error({ err: asyncErr, meetingId: id }, "alloy-meetings: async extraction failed");
        await pool.query(`UPDATE alloy_meetings SET status = 'failed', updated_at = NOW() WHERE id = $1`, [id]);
      }
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to capture meeting");
  }
});

router.get("/alloy/meetings", authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { status, limit: limitStr = "20" } = req.query as Record<string, string>;
    const limit = Math.min(parseInt(limitStr, 10), 100);

    let q = `SELECT id, title, meeting_date, duration_minutes, attendees, summary, status, created_at FROM alloy_meetings WHERE 1=1`;
    const params: unknown[] = [];
    let idx = 1;
    if (status) { q += ` AND status = $${idx++}`; params.push(status); }
    q += ` ORDER BY created_at DESC LIMIT $${idx}`;
    params.push(limit);

    const result = await pool.query(q, params);
    sendSuccess(res, { meetings: result.rows, total: result.rowCount });
  } catch (err) {
    handleRouteError(res, err, "Failed to list meetings");
  }
});

router.get("/alloy/meetings/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const [meetingResult, decisionsResult, actionItemsResult] = await Promise.all([
      pool.query(`SELECT * FROM alloy_meetings WHERE id = $1`, [req.params.id]),
      pool.query(`SELECT * FROM alloy_meeting_decisions WHERE meeting_id = $1 ORDER BY created_at ASC`, [req.params.id]),
      pool.query(`SELECT * FROM alloy_meeting_action_items WHERE meeting_id = $1 ORDER BY created_at ASC`, [req.params.id]),
    ]);

    if (!meetingResult.rows[0]) { sendError(res, "Meeting not found", 404); return; }

    sendSuccess(res, {
      ...meetingResult.rows[0],
      decisions: decisionsResult.rows,
      actionItems: actionItemsResult.rows,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get meeting");
  }
});

router.get("/alloy/meetings/:id/follow-up", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT follow_up_draft, title, summary, attendees FROM alloy_meetings WHERE id = $1`, [req.params.id]);
    if (!result.rows[0]) { sendError(res, "Meeting not found", 404); return; }
    sendSuccess(res, { id: req.params.id, followUpDraft: result.rows[0].follow_up_draft, title: result.rows[0].title, summary: result.rows[0].summary });
  } catch (err) {
    handleRouteError(res, err, "Failed to get follow-up draft");
  }
});

router.post("/alloy/meetings/prep", authMiddleware(), validateBody(bodyShape({
      "attendees": z.unknown().optional(),
      "scheduledFor": z.unknown().optional(),
      "title": z.unknown().optional(),
      "topics": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const { title, attendees = [], scheduledFor, topics = [] } = req.body as {
      title: string;
      attendees?: Array<{ name: string; email?: string; role?: string }>;
      scheduledFor?: string;
      topics?: string[];
    };

    if (!title) { sendBadRequest(res, "title is required"); return; }

    const recentMeetings = await pool.query(
      `SELECT id, title, summary, created_at FROM alloy_meetings WHERE status = 'completed' ORDER BY created_at DESC LIMIT 5`,
    );

    const prepPrompt = `You are an executive assistant preparing a meeting briefing.

Meeting: "${title}"
Scheduled: ${scheduledFor ?? "TBD"}
Attendees: ${attendees.map(a => `${a.name ?? "Unknown"}${a.role ? ` (${a.role})` : ""}${a.email ? ` <${a.email}>` : ""}`).join(", ") || "Unknown"}
Topics to Cover: ${topics.join(", ") || "General discussion"}

Recent meeting context:
${recentMeetings.rows.map(m => `- "${m.title}" (${new Date(m.created_at).toLocaleDateString()}): ${m.summary ?? "No summary"}`).join("\n") || "No recent meetings"}

Generate a meeting prep briefing with:
1. Suggested agenda (5-7 items)
2. Key questions to answer
3. Relevant context from recent meetings
4. Success criteria for this meeting
5. Pre-read recommendations

Be concise and actionable.`;

    const result = await services.ai.chatCompletion([
      { role: "system", content: "You are an expert executive briefing assistant. Provide practical, concise meeting preparation guidance." },
      { role: "user", content: prepPrompt },
    ], { maxTokens: 800 });

    sendSuccess(res, {
      title,
      attendees,
      scheduledFor,
      topics,
      briefing: result.content,
      recentContext: recentMeetings.rows.map(m => ({ id: m.id, title: m.title, summary: m.summary })),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to generate meeting prep");
  }
});

router.patch("/alloy/meetings/:id/action-items/:itemId", authMiddleware(), validateBody(bodyShape({
      "assignee": z.unknown().optional(),
      "dueDate": z.unknown().optional(),
      "status": z.unknown().optional(),
    })), async (req: Request, res: Response) => {
  try {
    const { status, assignee, dueDate } = req.body as { status?: string; assignee?: string; dueDate?: string };
    const updates: string[] = ["updated_at = NOW()"];
    const params: unknown[] = [];
    let idx = 1;
    if (status) { updates.push(`status = $${idx++}`); params.push(status); }
    if (assignee) { updates.push(`assignee = $${idx++}`); params.push(assignee); }
    if (dueDate) { updates.push(`due_date = $${idx++}`); params.push(dueDate); }
    params.push(req.params.itemId);
    params.push(req.params.id);
    await pool.query(
      `UPDATE alloy_meeting_action_items SET ${updates.join(", ")} WHERE id = $${idx++} AND meeting_id = $${idx}`,
      params,
    );
    sendSuccess(res, { id: req.params.itemId, updated: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to update action item");
  }
});

router.get("/alloy/meetings/action-items/open", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT ai.*, m.title as meeting_title, m.meeting_date
       FROM alloy_meeting_action_items ai
       JOIN alloy_meetings m ON ai.meeting_id = m.id
       WHERE ai.status = 'open'
       ORDER BY ai.created_at DESC
       LIMIT 50`,
    );
    sendSuccess(res, { actionItems: result.rows, total: result.rowCount });
  } catch (err) {
    handleRouteError(res, err, "Failed to list open action items");
  }
});

export default router;
