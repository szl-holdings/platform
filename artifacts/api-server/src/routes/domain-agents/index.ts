import { Router, type Request, type Response, type RequestHandler } from "express";
import { randomBytes } from "crypto";
import rateLimit from "express-rate-limit";
import { isValidAgentType, AGENT_CONFIGS, type AgentType } from "./configs";
import { runDomainAgentChat, streamDomainAgentChat } from "./runner";
import { getModelConfig } from "../../lib/model-registry";
import { sendSuccess, sendError } from "../../lib/api-response";
import { authMiddleware } from "../../middlewares/auth";
import { logger } from "../../lib/logger";
import a2aRouter from "./a2a";

const router = Router();

router.use(a2aRouter);

const agentChatLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Agent chat rate limit exceeded. Please try again later." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

router.get("/domain-agents/health", (_req, res) => {
  const agents = Object.entries(AGENT_CONFIGS).map(([id, config]) => ({
    id,
    name: config.name,
    toolCount: config.tools.length,
  }));

  res.json({
    ok: true,
    group: "domain-agents",
    agentCount: agents.length,
    agents,
    timestamp: new Date().toISOString(),
  });
});

router.get("/domain-agents/agents", (_req, res) => {
  const agents = Object.entries(AGENT_CONFIGS).map(([id, config]) => {
    const modelConfig = getModelConfig(id);
    return {
      id,
      name: config.name,
      model: modelConfig.model,
      category: modelConfig.category,
      maxTokens: modelConfig.maxCompletionTokens,
      toolCount: config.tools.length,
      tools: config.tools.map(t => ({ name: t.name, description: t.description })),
    };
  });

  sendSuccess(res, agents);
});

router.get("/domain-agents/agents/:agentType", (req, res) => {
  const { agentType } = req.params;
  if (!agentType || !isValidAgentType(agentType)) {
    sendError(res, `Invalid agent type: ${agentType}. Valid types: ${Object.keys(AGENT_CONFIGS).join(", ")}`, 400);
    return;
  }

  const config = AGENT_CONFIGS[agentType];
  const modelConfig = getModelConfig(agentType);

  sendSuccess(res, {
    id: agentType,
    name: config.name,
    model: modelConfig.model,
    category: modelConfig.category,
    temperature: modelConfig.temperature,
    maxTokens: modelConfig.maxCompletionTokens,
    tools: config.tools.map(t => ({ name: t.name, description: t.description })),
    systemPromptPreview: config.systemPrompt.slice(0, 200) + "...",
  });
});

router.post("/domain-agents/:agentType/chat", agentChatLimit, authMiddleware({ required: false }), async (req: Request, res: Response) => {
  const agentType = req.params.agentType as string;
  if (!agentType || !isValidAgentType(agentType)) {
    sendError(res, `Invalid agent type: ${agentType}`, 400);
    return;
  }

  const { message, conversationId, stream } = req.body as {
    message?: string;
    conversationId?: string;
    stream?: boolean;
  };

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    sendError(res, "Message is required", 400);
    return;
  }

  if (message.length > 50000) {
    sendError(res, "Message too long (max 50,000 characters)", 400);
    return;
  }

  const userId = req.user?.id ? String(req.user.id) : `anon_${req.ip || "unknown"}`;
  const convId = conversationId
    ? `${userId}_${conversationId}`
    : `${userId}_conv_${agentType}_${randomBytes(8).toString("hex")}`;

  logger.info({ agentType, conversationId: convId, messageLength: message.length, userId }, "Domain agent chat request");

  try {
    if (stream) {
      await streamDomainAgentChat(agentType, message.trim(), convId, res);
    } else {
      const reply = await runDomainAgentChat(agentType, message.trim(), convId);
      sendSuccess(res, {
        reply,
        agentType,
        agentName: AGENT_CONFIGS[agentType].name,
        conversationId: convId,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    logger.error({ err, agentType }, "Domain agent chat error");
    sendError(res, "Agent processing failed", 500);
  }
});

export default router;
