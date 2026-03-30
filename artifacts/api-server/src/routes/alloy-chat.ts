import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { eq, asc, desc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const alloyChatRouter: IRouter = Router();

type ModelProvider = "auto" | "openai" | "anthropic";

function routeModel(content: string, provider: ModelProvider): { provider: "openai" | "anthropic"; model: string; reason: string } {
  if (provider === "anthropic") {
    return { provider: "anthropic", model: "claude-sonnet-4-6", reason: "User selected Claude" };
  }
  if (provider === "openai") {
    return { provider: "openai", model: "gpt-5.2", reason: "User selected GPT-5.2" };
  }

  const lowerContent = content.toLowerCase();
  const analysisKeywords = ["analyze", "analysis", "explain", "why", "how does", "debug", "diagnose", "review", "assess", "reason", "what's wrong", "root cause", "investigate", "compare"];
  const codeKeywords = ["code", "script", "function", "query", "sql", "python", "javascript", "typescript", "implement", "write a", "generate"];

  const isAnalysis = analysisKeywords.some(k => lowerContent.includes(k));
  const isCode = codeKeywords.some(k => lowerContent.includes(k));

  if (isAnalysis || isCode) {
    return { provider: "anthropic", model: "claude-sonnet-4-6", reason: "Claude selected for analysis/reasoning task" };
  }

  return { provider: "openai", model: "gpt-5.2", reason: "GPT-5.2 selected for general operations query" };
}

async function buildSystemPrompt(req: Request): Promise<string> {
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  let systemContext = "";

  try {
    if (devDomain) {
      const baseUrl = `https://${devDomain}`;
      const [overviewRes, healthRes, connectorsRes, flagsRes] = await Promise.allSettled([
        fetch(`${baseUrl}/api/admin/overview`, { signal: AbortSignal.timeout(3000) }).then(r => r.ok ? r.json() : null),
        fetch(`${baseUrl}/api/admin/system-health`, { signal: AbortSignal.timeout(5000) }).then(r => r.ok ? r.json() : null),
        fetch(`${baseUrl}/api/admin/connectors`, { signal: AbortSignal.timeout(3000) }).then(r => r.ok ? r.json() : null),
        fetch(`${baseUrl}/api/admin/feature-flags`, { signal: AbortSignal.timeout(3000) }).then(r => r.ok ? r.json() : null),
      ]);

      const overview = overviewRes.status === "fulfilled" ? overviewRes.value : null;
      const health = healthRes.status === "fulfilled" ? healthRes.value : null;
      const connectors = connectorsRes.status === "fulfilled" ? connectorsRes.value : null;
      const featureFlags = flagsRes.status === "fulfilled" ? flagsRes.value : null;

      if (overview) {
        const mem = overview.system?.memoryUsage;
        const memMB = mem ? Math.round(mem.heapUsed / 1024 / 1024) : "?";
        systemContext += `\n## Live System State (as of ${new Date().toISOString()})\n`;
        systemContext += `- Uptime: ${Math.round((overview.system?.uptime ?? 0) / 60)} minutes\n`;
        systemContext += `- Node.js: ${overview.system?.nodeVersion}\n`;
        systemContext += `- Memory: ${memMB}MB heap used\n`;
        systemContext += `- Database: ${overview.database?.status ?? "unknown"} (${overview.database?.connections ?? 0} connections)\n`;
        systemContext += `- Storage: ${overview.storage?.status ?? "unknown"}\n`;
        systemContext += `- Apps: ${overview.counts?.activeApps ?? 0}/${overview.counts?.apps ?? 0} active\n`;
        systemContext += `- Live Connectors: ${overview.counts?.liveConnectors ?? 0}/${overview.counts?.connectors ?? 0}\n`;
      }

      if (health) {
        systemContext += `\n## System Health\n`;
        systemContext += `- Overall Status: ${health.status}\n`;
        systemContext += `- Healthy: ${health.summary?.healthy}, Degraded: ${health.summary?.degraded}, Down: ${health.summary?.down}\n`;
        const issues = (health.checks ?? []).filter((c: { status: string; name: string; details: string }) => c.status !== "healthy");
        if (issues.length > 0) {
          systemContext += `- Issues:\n`;
          for (const issue of issues.slice(0, 8)) {
            systemContext += `  - ${issue.name} (${issue.status}): ${issue.details}\n`;
          }
        }
      }

      if (connectors) {
        const summary = connectors.summary;
        systemContext += `\n## Connector Status\n`;
        systemContext += `- Total: ${summary?.total}, Live: ${summary?.liveConfigured}, Demo: ${summary?.mockedDemoMode}, Manual Required: ${summary?.manualRequired}\n`;
        const liveOnes = (connectors.connectors ?? []).filter((c: { status: string; name: string }) => c.status === "LIVE_CONFIGURED").map((c: { name: string }) => c.name);
        const demoOnes = (connectors.connectors ?? []).filter((c: { status: string; name: string }) => c.status === "MOCKED_DEMO_MODE").map((c: { name: string }) => c.name);
        if (liveOnes.length > 0) systemContext += `- Live: ${liveOnes.join(", ")}\n`;
        if (demoOnes.length > 0) systemContext += `- Demo mode: ${demoOnes.join(", ")}\n`;
      }

      if (featureFlags) {
        const enabled = (featureFlags.flags ?? []).filter((f: { enabled: boolean; key: string }) => f.enabled).map((f: { key: string }) => f.key);
        const disabled = (featureFlags.flags ?? []).filter((f: { enabled: boolean; key: string }) => !f.enabled).map((f: { key: string }) => f.key);
        systemContext += `\n## Feature Flags\n`;
        systemContext += `- Enabled: ${enabled.join(", ") || "none"}\n`;
        systemContext += `- Disabled: ${disabled.join(", ") || "none"}\n`;
      }
    }
  } catch {
    systemContext = "\n(Live system state unavailable at this time)\n";
  }

  return `You are AlloyChat, an AI-powered operations assistant for the SZL Admin Control Plane — a multi-tenant platform that orchestrates 14+ production applications.

## Your Role
You help SZL engineers and operators manage infrastructure, debug issues, interpret metrics, understand system state, and navigate the platform. You are direct, precise, and actionable.

## SZL Ecosystem
The platform includes these registered applications:
- Admin Control Plane (this interface) — system administration dashboard
- API Server — REST API backend powering all apps
- Project List — portfolio project management
- Vessel Tracker — maritime fleet tracking with real-time AIS data
- Firestorm Security — red team simulation and security assessment platform
- Stephen Lutar — personal portfolio and case study site
- INCA AI Research — AI research command center with publication tracking
- Terra Real Estate — real estate portfolio intelligence and analytics
- MSP Command Center — managed service provider operations dashboard
- SZL Holdings — family office investment management
- Vessels Maritime Intelligence — vessel fleet management and compliance
- Readiness Report — organizational readiness assessment platform
- Lyte Command Center — ITOps signal processing and incident response
- Dreamscape Creative Engine — AI-powered creative campaign platform
- Carlota Jo Consulting — consulting services booking and management
- Component Preview Server — design system component library

## Capabilities
You can explain system health, interpret connector status, explain feature flags, review infrastructure configuration, suggest diagnostic steps, help write admin queries, and answer ops questions about any of the above apps.

## Behavior
- Be concise and actionable. Lead with the answer, then explain.
- Use markdown formatting for readability: **bold** for emphasis, \`code\` for commands/values, tables for comparisons.
- When you identify a problem, suggest specific remediation steps.
- If you don't have enough data, say so clearly rather than guessing.
- You can see live system state below. Use it to give current, accurate answers.
${systemContext}

Today's date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`;
}

alloyChatRouter.get("/alloy-chat/conversations", async (_req: Request, res: Response) => {
  try {
    const convos = await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.createdAt))
      .limit(50);
    res.json({ conversations: convos });
  } catch (err) {
    res.status(500).json({ error: "Failed to load conversations" });
  }
});

alloyChatRouter.post("/alloy-chat/conversations", async (req: Request, res: Response) => {
  try {
    const { title } = req.body as { title?: string };
    const [newConvo] = await db
      .insert(conversations)
      .values({ title: title ?? "New Chat" })
      .returning();
    res.status(201).json(newConvo);
  } catch (err) {
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

alloyChatRouter.get("/alloy-chat/conversations/:id/messages", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"]!, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid conversation ID" });
      return;
    }
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));
    res.json({ messages: msgs });
  } catch (err) {
    res.status(500).json({ error: "Failed to load messages" });
  }
});

alloyChatRouter.delete("/alloy-chat/conversations/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params["id"]!, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid conversation ID" });
      return;
    }
    await db.delete(conversations).where(eq(conversations.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

alloyChatRouter.post("/alloy-chat/conversations/:id/messages", async (req: Request, res: Response) => {
  const id = parseInt(req.params["id"]!, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid conversation ID" });
    return;
  }

  const { content, provider = "auto" } = req.body as { content: string; provider?: ModelProvider };

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    res.status(400).json({ error: "Message content is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    await db.insert(messages).values({
      conversationId: id,
      role: "user",
      content: content.trim(),
    });

    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt))
      .limit(40);

    const systemPrompt = await buildSystemPrompt(req);
    const { provider: chosenProvider, model, reason } = routeModel(content, provider as ModelProvider);

    res.write(`data: ${JSON.stringify({ type: "model", provider: chosenProvider, model, reason })}\n\n`);

    const chatMessages = history.slice(0, -1).map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    chatMessages.push({ role: "user", content: content.trim() });

    let fullResponse = "";

    if (chosenProvider === "anthropic") {
      const stream = anthropic.messages.stream({
        model,
        max_tokens: 8192,
        system: systemPrompt,
        messages: chatMessages,
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          fullResponse += event.delta.text;
          res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
        }
      }
    } else {
      const stream = await openai.chat.completions.create({
        model,
        max_completion_tokens: 8192,
        messages: [
          { role: "system", content: systemPrompt },
          ...chatMessages,
        ],
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          fullResponse += delta;
          res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
        }
      }
    }

    if (fullResponse) {
      await db.insert(messages).values({
        conversationId: id,
        role: "assistant",
        content: fullResponse,
      });

      const convo = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, id))
        .limit(1);

      if (convo[0]?.title === "New Chat" && chatMessages.length === 1) {
        const titleWords = content.trim().split(" ").slice(0, 6).join(" ");
        await db
          .update(conversations)
          .set({ title: titleWords.length > 3 ? titleWords : "Chat session" })
          .where(eq(conversations.id, id));
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
    res.end();
  }
});

alloyChatRouter.get("/alloy-chat/suggested-prompts", async (req: Request, res: Response) => {
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  const defaultPrompts = [
    "What's the current system health status?",
    "Which integrations are in demo mode?",
    "Show me all registered apps and their status",
    "What feature flags are currently enabled?",
    "How many active database connections are there?",
    "List recent webhook events",
    "Which connectors need manual configuration?",
    "Summarize the integration health for all apps",
  ];

  try {
    if (!devDomain) {
      res.json({ prompts: defaultPrompts });
      return;
    }

    const [healthRes, connectorsRes] = await Promise.allSettled([
      fetch(`https://${devDomain}/api/admin/system-health`, { signal: AbortSignal.timeout(3000) }).then(r => r.ok ? r.json() : null),
      fetch(`https://${devDomain}/api/admin/connectors`, { signal: AbortSignal.timeout(3000) }).then(r => r.ok ? r.json() : null),
    ]);

    const health = healthRes.status === "fulfilled" ? healthRes.value : null;
    const connectors = connectorsRes.status === "fulfilled" ? connectorsRes.value : null;

    const contextualPrompts: string[] = [];

    if (health?.status === "degraded" || health?.status === "down") {
      contextualPrompts.push("Diagnose the current system health issues");
    }
    if (health?.summary?.degraded > 0) {
      contextualPrompts.push(`What's causing the ${health.summary.degraded} degraded service(s)?`);
    }
    if (connectors?.summary?.manualRequired > 0) {
      contextualPrompts.push(`Which connectors need configuration and how do I set them up?`);
    }
    if (connectors?.summary?.mockedDemoMode > 0) {
      contextualPrompts.push(`Which integrations are in demo mode and what data is simulated?`);
    }

    const combinedPrompts = [...contextualPrompts, ...defaultPrompts].slice(0, 8);
    res.json({ prompts: combinedPrompts });
  } catch {
    res.json({ prompts: defaultPrompts });
  }
});

export default alloyChatRouter;
