import { Router, type IRouter, type Request, type Response } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import { pool } from "@szl-holdings/db";
import { services } from "@szl-holdings/services";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { sendSuccess, sendCreated, sendBadRequest, sendError, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";
import { validateBody, jsonObjectBodySchema, validateQuery, listQuerySchema} from "../lib/validation";

const router: IRouter = Router();


const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

function verifySlackSignature(req: Request): boolean {
  if (!SLACK_SIGNING_SECRET) {
    logger.warn("alloy-channels: SLACK_SIGNING_SECRET not configured — rejecting inbound Slack request");
    return false;
  }
  const timestamp = req.headers["x-slack-request-timestamp"] as string | undefined;
  const signature = req.headers["x-slack-signature"] as string | undefined;
  if (!timestamp || !signature) return false;
  const age = Math.abs(Date.now() / 1000 - parseInt(timestamp, 10));
  if (age > 300) return false;
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody?.toString("utf-8") ?? JSON.stringify(req.body);
  const sigBase = `v0:${timestamp}:${rawBody}`;
  const computed = `v0=${createHmac("sha256", SLACK_SIGNING_SECRET).update(sigBase).digest("hex")}`;
  const computedBuf = Buffer.from(computed);
  const sigBuf = Buffer.from(signature);
  if (computedBuf.length !== sigBuf.length) return false;
  return timingSafeEqual(computedBuf, sigBuf);
}

const TRUST_LEVELS: Record<string, { skills: string[]; approvalClass: string }> = {
  admin: { skills: ["*"], approvalClass: "admin" },
  elevated: { skills: ["research", "analysis", "report", "notify", "escalate"], approvalClass: "elevated" },
  standard: { skills: ["research", "analysis", "report"], approvalClass: "standard" },
  readonly: { skills: [], approvalClass: "none" },
};

async function getChannelConfig(channelType: string, channelId: string) {
  const result = await pool.query(
    `SELECT * FROM alloy_channel_configs WHERE channel_type = $1 AND channel_id = $2 AND is_enabled = TRUE`,
    [channelType, channelId],
  );
  return result.rows[0] ?? null;
}

async function logChannelAction(params: {
  channelType: string;
  channelId: string;
  channelName?: string;
  userId?: string;
  userName?: string;
  message?: string;
  skillInvoked?: string;
  workflowId?: string;
  approvalStatus?: string;
  outcome: string;
  outcomeDetail?: string;
  trustLevel?: string;
}) {
  const id = `caud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await pool.query(
    `INSERT INTO alloy_channel_audit (id, channel_type, channel_id, channel_name, user_id, user_name, message, skill_invoked, workflow_id, approval_status, outcome, outcome_detail, trust_level, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())`,
    [
      id, params.channelType, params.channelId, params.channelName ?? null,
      params.userId ?? null, params.userName ?? null, params.message ?? null,
      params.skillInvoked ?? null, params.workflowId ?? null, params.approvalStatus ?? null,
      params.outcome, params.outcomeDetail ?? null, params.trustLevel ?? null,
    ],
  );
}

async function postToSlack(channel: string, text: string, blocks?: unknown[]): Promise<void> {
  if (!SLACK_BOT_TOKEN) {
    logger.warn("alloy-channels: SLACK_BOT_TOKEN not set — cannot post to Slack");
    return;
  }
  const body: Record<string, unknown> = { channel, text };
  if (blocks) body["blocks"] = blocks;
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) logger.warn({ status: res.status }, "alloy-channels: Slack postMessage failed");
}

function detectSkillFromMessage(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes("research") || lower.includes("investigate") || lower.includes("find out")) return "research";
  if (lower.includes("analyze") || lower.includes("analyse") || lower.includes("review")) return "analysis";
  if (lower.includes("report") || lower.includes("summarize") || lower.includes("summary")) return "report";
  if (lower.includes("notify") || lower.includes("alert") || lower.includes("send")) return "notify";
  if (lower.includes("escalate") || lower.includes("urgent")) return "escalate";
  return null;
}

router.post("/alloy/channels/slack/webhook", async (req: Request, res: Response) => {
  try {
    if (!verifySlackSignature(req)) {
      res.status(401).json({ error: "Invalid Slack signature" });
      return;
    }

    const body = req.body as Record<string, unknown>;

    if (body["type"] === "url_verification") {
      res.json({ challenge: body["challenge"] });
      return;
    }

    res.status(200).json({ ok: true });

    setImmediate(async () => {
      try {
        const event = body["event"] as Record<string, unknown> | undefined;
        const command = body["command"] as string | undefined;

        if (command) {
          const channelId = body["channel_id"] as string;
          const userId = body["user_id"] as string;
          const userName = body["user_name"] as string;
          const text = body["text"] as string ?? "";

          const config = await getChannelConfig("slack", channelId);
          const trustLevel = (config?.trust_level as string) ?? "standard";
          const trustConfig = TRUST_LEVELS[trustLevel] ?? TRUST_LEVELS.standard!;

          if (command === "/alloy") {
            const skillRequested = detectSkillFromMessage(text) ?? "research";

            const channelAllowedSkills: string[] = Array.isArray(config?.allowed_skills) ? config.allowed_skills : trustConfig.skills;
            const allowed = channelAllowedSkills.includes("*") || channelAllowedSkills.includes(skillRequested);
            if (!allowed) {
              await postToSlack(channelId, `This channel's trust level (*${trustLevel}*) does not allow the *${skillRequested}* skill. Contact your admin to adjust channel permissions.`);
              await logChannelAction({ channelType: "slack", channelId, userId, userName, message: text, skillInvoked: skillRequested, outcome: "blocked", outcomeDetail: `Trust level ${trustLevel} insufficient — allowed: ${channelAllowedSkills.join(", ")}`, trustLevel });
              return;
            }

            const approvalClass = (config?.approval_class as string) ?? trustConfig.approvalClass;
            const requiresApproval = approvalClass !== "none" && approvalClass !== "admin";

            if (requiresApproval) {
              const pendingId = `capp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
              const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
              await pool.query(
                `INSERT INTO alloy_pending_approvals_chat (id, channel_type, channel_id, requester_user_id, requester_name, action_description, approval_class, status, expires_at, created_at, updated_at)
                 VALUES ($1,'slack',$2,$3,$4,$5,$6,'pending',$7,NOW(),NOW())`,
                [pendingId, channelId, userId, userName, `[${skillRequested}] ${text}`, approvalClass, expiresAt],
              );
              const approvalBlocks = [
                {
                  type: "section",
                  text: { type: "mrkdwn", text: `:hourglass: *Alloy — Approval Required*\n*Skill:* ${skillRequested}  |  *Level:* ${approvalClass}\n*Requested by:* ${userName}\n*Request:*\n> ${text}` },
                },
                {
                  type: "actions",
                  elements: [
                    { type: "button", text: { type: "plain_text", text: ":white_check_mark: Approve" }, style: "primary", value: `approve:${pendingId}`, action_id: "alloy_approve" },
                    { type: "button", text: { type: "plain_text", text: ":x: Reject" }, style: "danger", value: `reject:${pendingId}`, action_id: "alloy_reject" },
                  ],
                },
              ];
              await postToSlack(channelId, `:hourglass: Alloy approval required for \`${skillRequested}\` skill`, approvalBlocks);
              await logChannelAction({ channelType: "slack", channelId, userId, userName, message: text, skillInvoked: skillRequested, approvalStatus: "pending", outcome: "queued_for_approval", outcomeDetail: `pendingId=${pendingId}, approvalClass=${approvalClass}`, trustLevel });
              return;
            }

            await postToSlack(channelId, `Received: \`${text}\`\n_Alloy is processing your *${skillRequested}* request..._`);

            let result = `Skill ${skillRequested} initiated for: "${text}"`;
            try {
              const aiResult = await services.ai.chatCompletion([
                { role: "system", content: `You are Alloy, an AI operations assistant. Process this ${skillRequested} request from a trusted Slack admin channel and provide a concise, actionable response. Keep it under 500 words.` },
                { role: "user", content: text },
              ], { maxTokens: 600 });
              result = aiResult.content;
            } catch { }

            await postToSlack(channelId, `*Alloy Result — ${skillRequested}*\n${result}`);
            await logChannelAction({ channelType: "slack", channelId, userId, userName, message: text, skillInvoked: skillRequested, approvalStatus: "not_required", outcome: "completed", outcomeDetail: result.slice(0, 200), trustLevel });
          }
          return;
        }

        if (body["type"] === "event_callback" && event?.["type"] === "message") {
          const channelId = event["channel"] as string;
          const userId = event["user"] as string;
          const text = (event["text"] as string) ?? "";
          const botId = event["bot_id"] as string | undefined;

          if (botId) return;
          if (!text.toLowerCase().includes("alloy")) return;

          const config = await getChannelConfig("slack", channelId);
          if (!config) return;

          const trustLevel = (config.trust_level as string) ?? "standard";
          const skillDetected = detectSkillFromMessage(text);

          await logChannelAction({ channelType: "slack", channelId, userId, message: text, skillInvoked: skillDetected ?? undefined, outcome: "received", trustLevel });
        }
      } catch (asyncErr) {
        logger.error({ err: asyncErr }, "alloy-channels: async Slack processing failed");
      }
    });
  } catch (err) {
    handleRouteError(res, err, "Slack webhook processing failed");
  }
});

router.post("/alloy/channels/slack/interactive", async (req: Request, res: Response) => {
  try {
    if (!verifySlackSignature(req)) {
      res.status(401).json({ error: "Invalid Slack signature" });
      return;
    }

    const payloadRaw = (req.body as Record<string, string>)["payload"];
    if (!payloadRaw) {
      res.status(400).json({ error: "Missing payload" });
      return;
    }

    res.status(200).send("");

    setImmediate(async () => {
      try {
        const payload = JSON.parse(payloadRaw) as {
          type: string;
          callback_id?: string;
          actions?: Array<{ action_id: string; value: string }>;
          user?: { id: string; name: string };
          channel?: { id: string };
          message?: { ts: string };
          response_url?: string;
        };

        if (payload.type !== "block_actions" && payload.type !== "interactive_message") return;

        const action = payload.actions?.[0];
        if (!action) return;

        const actionValue = action.value ?? "";
        const [actionType, approvalId] = actionValue.split(":");

        if (!approvalId || (actionType !== "approve" && actionType !== "reject")) return;

        const existing = await pool.query(`SELECT * FROM alloy_pending_approvals_chat WHERE id = $1 AND status = 'pending'`, [approvalId]);
        if (!existing.rows[0]) return;

        const approval = existing.rows[0];
        const decision = actionType === "approve" ? "approved" : "rejected";
        const reviewerName = payload.user?.name ?? "slack_user";
        const reviewerId = payload.user?.id ?? "unknown";

        await pool.query(
          `UPDATE alloy_pending_approvals_chat SET status=$1, reviewed_by=$2, updated_at=NOW() WHERE id=$3`,
          [decision, reviewerName, approvalId],
        );

        const emoji = decision === "approved" ? ":white_check_mark:" : ":x:";
        const channelId = payload.channel?.id ?? approval.channel_id;
        if (channelId) {
          await postToSlack(channelId, `${emoji} *Approval ${decision.toUpperCase()}* by ${reviewerName}\n> ${approval.action_description}`);
        }

        if (payload.response_url) {
          try {
            await fetch(payload.response_url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                replace_original: true,
                text: `${emoji} *${decision.toUpperCase()}* — ${approval.action_description}\n_Reviewed by ${reviewerName}_`,
              }),
            });
          } catch { }
        }

        await logChannelAction({
          channelType: "slack", channelId: channelId ?? approval.channel_id,
          userId: reviewerId, userName: reviewerName,
          workflowId: approval.workflow_id, approvalStatus: decision,
          outcome: "interactive_approval_decided", outcomeDetail: `approvalId=${approvalId}`,
        });

        if (decision === "approved" && approval.action_description) {
          const skillMatch = approval.action_description.match(/^\[([a-z]+)\]/);
          const skill = skillMatch?.[1] ?? "research";
          const taskText = approval.action_description.replace(/^\[[a-z]+\]\s*/, "");

          try {
            const aiResult = await services.ai.chatCompletion([
              { role: "system", content: `You are Alloy, an AI operations assistant. Process this approved ${skill} request and provide a concise, actionable response. Keep it under 500 words.` },
              { role: "user", content: taskText },
            ], { maxTokens: 600 });

            if (channelId) {
              await postToSlack(channelId, `*Alloy Result — ${skill}*\n${aiResult.content}`);
            }
          } catch (execErr) {
            logger.warn({ err: execErr }, "alloy-channels: post-approval execution failed");
          }
        }
      } catch (asyncErr) {
        logger.error({ err: asyncErr }, "alloy-channels: interactive callback processing failed");
      }
    });
  } catch (err) {
    handleRouteError(res, err, "Slack interactive callback failed");
  }
});

router.post("/alloy/channels/slack/send", authMiddleware(), requireRole("ops", "admin", "super_admin"), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const { channel, text, blocks } = req.body as { channel: string; text: string; blocks?: unknown[] };
    if (!channel || !text) {
      sendBadRequest(res, "channel and text are required");
      return;
    }
    await postToSlack(channel, text, blocks);
    sendSuccess(res, { sent: true, channel, timestamp: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "Failed to send Slack message");
  }
});

router.get("/alloy/channels/config", authMiddleware(), requireRole("ops", "admin", "super_admin"), async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT * FROM alloy_channel_configs ORDER BY created_at DESC`);
    sendSuccess(res, { configs: result.rows, trustLevels: Object.keys(TRUST_LEVELS) });
  } catch (err) {
    handleRouteError(res, err, "Failed to list channel configs");
  }
});

router.post("/alloy/channels/config", authMiddleware(), requireRole("admin", "super_admin"), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const { channelType = "slack", channelId, channelName, workspaceId, trustLevel = "standard", allowedSkills, approvalClass } = req.body as {
      channelType?: string;
      channelId: string;
      channelName?: string;
      workspaceId?: string;
      trustLevel?: string;
      allowedSkills?: string[];
      approvalClass?: string;
    };
    if (!channelId) {
      sendBadRequest(res, "channelId is required");
      return;
    }
    if (!Object.keys(TRUST_LEVELS).includes(trustLevel)) {
      sendBadRequest(res, `trustLevel must be one of: ${Object.keys(TRUST_LEVELS).join(", ")}`);
      return;
    }
    const id = `chcfg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const trustDefaults = TRUST_LEVELS[trustLevel] ?? TRUST_LEVELS.standard!;
    const skills = allowedSkills ?? trustDefaults.skills;
    const aprClass = approvalClass ?? trustDefaults.approvalClass;

    await pool.query(
      `INSERT INTO alloy_channel_configs (id, channel_type, channel_id, channel_name, workspace_id, trust_level, allowed_skills, approval_class, is_enabled, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE,NOW(),NOW())
       ON CONFLICT (channel_type, channel_id) DO UPDATE
       SET channel_name=EXCLUDED.channel_name, trust_level=EXCLUDED.trust_level, allowed_skills=EXCLUDED.allowed_skills, approval_class=EXCLUDED.approval_class, updated_at=NOW()`,
      [id, channelType, channelId, channelName ?? null, workspaceId ?? null, trustLevel, JSON.stringify(skills), aprClass],
    );
    sendCreated(res, { id, channelType, channelId, trustLevel, allowedSkills: skills, approvalClass: aprClass });
  } catch (err) {
    handleRouteError(res, err, "Failed to upsert channel config");
  }
});

router.patch("/alloy/channels/config/:channelId", authMiddleware(), requireRole("admin", "super_admin"), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    const { trustLevel, allowedSkills, isEnabled, approvalClass } = req.body as {
      trustLevel?: string;
      allowedSkills?: string[];
      isEnabled?: boolean;
      approvalClass?: string;
    };
    const updates: string[] = ["updated_at = NOW()"];
    const params: unknown[] = [];
    let idx = 1;
    if (trustLevel !== undefined) { updates.push(`trust_level = $${idx++}`); params.push(trustLevel); }
    if (allowedSkills !== undefined) { updates.push(`allowed_skills = $${idx++}`); params.push(JSON.stringify(allowedSkills)); }
    if (isEnabled !== undefined) { updates.push(`is_enabled = $${idx++}`); params.push(isEnabled); }
    if (approvalClass !== undefined) { updates.push(`approval_class = $${idx++}`); params.push(approvalClass); }
    params.push(channelId);
    await pool.query(`UPDATE alloy_channel_configs SET ${updates.join(", ")} WHERE channel_id = $${idx}`, params);
    sendSuccess(res, { updated: true, channelId });
  } catch (err) {
    handleRouteError(res, err, "Failed to update channel config");
  }
});

router.get("/alloy/channels/audit", authMiddleware(), requireRole("ops", "admin", "super_admin"), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt((req.query as Record<string, string>).limit ?? "50", 10), 200);
    const channelType = (req.query as Record<string, string>).channelType;
    const channelId = (req.query as Record<string, string>).channelId;

    let q = `SELECT * FROM alloy_channel_audit WHERE 1=1`;
    const params: unknown[] = [];
    let idx = 1;
    if (channelType) { q += ` AND channel_type = $${idx++}`; params.push(channelType); }
    if (channelId) { q += ` AND channel_id = $${idx++}`; params.push(channelId); }
    q += ` ORDER BY created_at DESC LIMIT $${idx}`;
    params.push(limit);

    const result = await pool.query(q, params);
    sendSuccess(res, { audit: result.rows, total: result.rowCount });
  } catch (err) {
    handleRouteError(res, err, "Failed to list channel audit");
  }
});

router.get("/alloy/channels/approvals", authMiddleware(), validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const status = (req.query as Record<string, string>).status ?? "pending";
    const result = await pool.query(
      `SELECT * FROM alloy_pending_approvals_chat WHERE status = $1 ORDER BY created_at DESC LIMIT 50`,
      [status],
    );
    sendSuccess(res, { approvals: result.rows });
  } catch (err) {
    handleRouteError(res, err, "Failed to list chat approvals");
  }
});

router.post("/alloy/channels/approvals/:id/decide", authMiddleware(), requireRole("ops", "admin", "super_admin"), validateBody(jsonObjectBodySchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { decision, note } = req.body as { decision: "approved" | "rejected"; note?: string };
    if (!["approved", "rejected"].includes(decision)) {
      sendBadRequest(res, "decision must be 'approved' or 'rejected'");
      return;
    }
    const existing = await pool.query(`SELECT * FROM alloy_pending_approvals_chat WHERE id = $1`, [id]);
    if (!existing.rows[0]) {
      sendError(res, "Approval not found", 404);
      return;
    }
    const approval = existing.rows[0];
    await pool.query(
      `UPDATE alloy_pending_approvals_chat SET status=$1, reviewed_by=$2, review_note=$3, updated_at=NOW() WHERE id=$4`,
      [decision, req.user?.displayName ?? "unknown", note ?? null, id],
    );
    if (approval.channel_id && approval.channel_type === "slack") {
      const emoji = decision === "approved" ? ":white_check_mark:" : ":x:";
      await postToSlack(approval.channel_id, `${emoji} *Approval ${decision.toUpperCase()}* by ${req.user?.displayName ?? "admin"}\n${approval.action_description}${note ? `\n_Note: ${note}_` : ""}`);
    }
    await logChannelAction({
      channelType: approval.channel_type, channelId: approval.channel_id,
      userId: req.user?.id?.toString(), userName: req.user?.displayName,
      workflowId: approval.workflow_id, approvalStatus: decision,
      outcome: "approval_decided", outcomeDetail: note,
    });
    sendSuccess(res, { id, decision, updatedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "Failed to decide approval");
  }
});

router.get("/alloy/channels/trust-levels", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    sendSuccess(res, {
      trustLevels: Object.entries(TRUST_LEVELS).map(([key, val]) => ({
        key,
        skills: val.skills,
        approvalClass: val.approvalClass,
        description: key === "admin" ? "Full access to all skills" : key === "elevated" ? "Extended skills with elevated approval" : key === "standard" ? "Research and analysis skills" : "Read-only, no skill execution",
      })),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to list trust levels");
  }
});

export default router;
