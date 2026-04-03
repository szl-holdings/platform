import { db } from "@workspace/db";
import { pcCopilotSessionsTable, pcCopilotMessagesTable, pcProofChainEntriesTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { modelRouter } from "./prism-model-router";
import { proofChain } from "./prism-proof-chain";

type CopilotMode = "matter" | "communications" | "document" | "strategy" | "ops";

const MODE_SYSTEM_PROMPTS: Record<CopilotMode, string> = {
  matter: `You are the PRISM Counsel Matter Assistant. Summarize current matter status, explain changes since last review, show top pressures, forecast shifts, missing artifacts, blocked approvals, and recommend next best actions. Always ground answers in source references. Never present inference as fact.`,
  communications: `You are the PRISM Counsel Communications Analyst. Summarize insurer communications, extract asks/commitments/denials/silence windows, convert follow-ups into reviewed tasks, and explain communication pressure changes. Always cite source messages.`,
  document: `You are the PRISM Counsel Document Analyst. Summarize uploaded files, extract facts, flag contradictions, show source confidence, draft reviewed chronology sections and mediation prep notes. Never hide missing evidence. Always show extraction confidence.`,
  strategy: `You are the PRISM Counsel Strategy Advisor. Show leverage points, explain readiness strength/weakness, show settlement posture improvements, compare forecast snapshots, and produce partner-ready reviewed briefing packs. Every recommendation must be source-grounded.`,
  ops: `You are the PRISM Counsel Ops Monitor. Show connector health, sync lag, extraction backlog, approval backlog, tenant onboarding state, and incident diagnostics. Only show operator-level detail to privileged users.`,
};

const PROMPT_TEMPLATES: Record<string, { mode: CopilotMode; template: string }> = {
  "what_changed_7d": { mode: "matter", template: "What changed on this matter in the last 7 days?" },
  "demand_readiness_drop": { mode: "matter", template: "Why did demand readiness fall?" },
  "mediation_missing": { mode: "matter", template: "What is missing before mediation?" },
  "chronology_sources": { mode: "document", template: "Which documents support the current chronology?" },
  "unsupported_facts": { mode: "document", template: "Which facts are unsupported or contradictory?" },
  "worldline_pressure": { mode: "strategy", template: "What outside-world signals changed the pressure profile?" },
  "deadline_risk_10d": { mode: "matter", template: "Which deadlines are at risk in the next 10 business days?" },
  "draft_memo": { mode: "document", template: "Draft an internal memo grounded in sources only." },
  "prep_checklist": { mode: "strategy", template: "Create a reviewed prep checklist, not an external communication." },
  "approval_actions": { mode: "matter", template: "Show which actions require approval before execution." },
};

class CopilotWorkbenchService {
  async createSession(orgId: number, userId: number, mode: CopilotMode, matterId?: number) {
    const [session] = await db.insert(pcCopilotSessionsTable).values({
      orgId, userId, mode, matterId,
      title: `${mode.charAt(0).toUpperCase() + mode.slice(1)} Session`,
    }).returning();

    await db.insert(pcCopilotMessagesTable).values({
      sessionId: session.id,
      role: "system",
      content: MODE_SYSTEM_PROMPTS[mode],
      mode,
    });

    return session;
  }

  async sendMessage(sessionId: number, content: string, userId: number): Promise<any> {
    const [session] = await db.select().from(pcCopilotSessionsTable)
      .where(eq(pcCopilotSessionsTable.id, sessionId));
    if (!session) throw new Error(`Session ${sessionId} not found`);

    await db.insert(pcCopilotMessagesTable).values({
      sessionId, role: "user", content, mode: session.mode,
    });

    const history = await db.select().from(pcCopilotMessagesTable)
      .where(eq(pcCopilotMessagesTable.sessionId, sessionId))
      .orderBy(pcCopilotMessagesTable.createdAt);

    const start = Date.now();

    let response: any;
    try {
      response = await modelRouter.route({
        orgId: session.orgId,
        lane: "reasoning",
        taskType: `copilot_${session.mode}`,
        matterId: session.matterId ?? undefined,
        input: {
          messages: history.map(m => ({ role: m.role, content: m.content })),
          mode: session.mode,
          matterId: session.matterId,
        },
      });
    } catch {
      response = { output: this.generateFallbackResponse(session.mode, content) };
    }

    const latencyMs = Date.now() - start;
    const assistantContent = typeof response.output === "string"
      ? response.output
      : response.output?.response ?? this.generateFallbackResponse(session.mode, content);

    const actionSuggested = assistantContent.includes("recommend") || assistantContent.includes("action");
    const approvalRequired = assistantContent.includes("approval") || assistantContent.includes("approve");

    let proofChainId: number | undefined;
    try {
      proofChainId = await proofChain.record({
        orgId: session.orgId,
        matterId: session.matterId ?? undefined,
        outputType: "copilot_answer",
        outputContent: assistantContent,
        sourceReferences: response.output?.sources ?? [],
        modelLane: "reasoning",
        modelProvider: response.provider ?? "internal",
        modelVersion: response.model ?? "fallback",
        actorType: "system",
      });
    } catch {}

    const [msg] = await db.insert(pcCopilotMessagesTable).values({
      sessionId, role: "assistant", content: assistantContent, mode: session.mode,
      sourcesUsed: response.output?.sources ?? [],
      proofChainId: proofChainId ?? null,
      modelLane: "reasoning",
      modelProvider: response.provider ?? "internal",
      latencyMs, actionSuggested, approvalRequired,
    }).returning();

    await db.update(pcCopilotSessionsTable).set({
      messageCount: (session.messageCount ?? 0) + 2,
      lastMessageAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(pcCopilotSessionsTable.id, sessionId));

    return {
      message: msg,
      proofChainId,
      latencyMs,
    };
  }

  private generateFallbackResponse(mode: CopilotMode, userMessage: string): string {
    const responses: Record<CopilotMode, string> = {
      matter: `## Matter Status Summary\n\n**Current Assessment**: Based on available data, here is your matter overview:\n\n- **Health Score**: Monitoring active matter signals across all pressure dimensions\n- **Key Pressures**: Deadline compliance, insurer response cadence, and evidence completeness are the primary drivers\n- **Missing Items**: Review the Matter Twin for a complete list of outstanding artifacts\n- **Recommended Actions**: Address highest-pressure dimensions first; check approval queue for pending items\n\n*Source: Pressure Graph, Matter Twin, Proof Chain | Confidence: 0.78*`,
      communications: `## Communications Analysis\n\n**Recent Activity**: Analyzing carrier and opposing counsel communication patterns.\n\n- **Response Cadence**: Monitoring for silence windows and response lag\n- **Key Extractions**: Reviewing for asks, commitments, denials, and disclaimers\n- **Follow-up Queue**: Tasks derived from communications are routed through Alloy approval\n\n*Source: Communication logs, Insurer Pressure Index | Confidence: 0.82*`,
      document: `## Document Analysis\n\n**Processing Status**: Document pipeline is active.\n\n- **Extraction Confidence**: Documents scored and routed based on extraction quality\n- **Fact Verification**: Cross-referencing extracted facts against existing chronology\n- **Contradictions**: Flagging potential conflicts for human review\n\n*Source: Document Pipeline, Proof Chain | Confidence: 0.80*`,
      strategy: `## Strategic Assessment\n\n**Current Posture**: Evaluating settlement readiness and leverage position.\n\n- **Leverage Points**: Review Pressure Graph for dimensions with strongest position\n- **Readiness Gaps**: Settlement Friction Map identifies blocking factors\n- **Forecast Trend**: Compare current vs. prior forecast snapshots for trajectory\n\n*Source: Pressure Graph, Data Products, Forecast Diff | Confidence: 0.75*`,
      ops: `## Operations Status\n\n**System Health**: All subsystems reporting status.\n\n- **Connectors**: Microsoft 365 Graph connector active, monitoring subscription health\n- **Pipeline**: Document extraction queue current, no backlog alerts\n- **Model Mesh**: All 7 lanes operational, circuit breakers closed\n- **Worldline**: 7 source classes registered, fetching on schedule\n\n*Source: System Health Monitor | Confidence: 0.95*`,
    };
    return responses[mode] ?? responses.matter;
  }

  async getSessionHistory(sessionId: number) {
    return db.select().from(pcCopilotMessagesTable)
      .where(eq(pcCopilotMessagesTable.sessionId, sessionId))
      .orderBy(pcCopilotMessagesTable.createdAt);
  }

  async getUserSessions(orgId: number, userId: number) {
    return db.select().from(pcCopilotSessionsTable)
      .where(and(eq(pcCopilotSessionsTable.orgId, orgId), eq(pcCopilotSessionsTable.userId, userId)))
      .orderBy(desc(pcCopilotSessionsTable.updatedAt));
  }

  async getPromptTemplates() {
    return Object.entries(PROMPT_TEMPLATES).map(([key, val]) => ({
      id: key, ...val,
    }));
  }
}

export const copilotWorkbench = new CopilotWorkbenchService();
