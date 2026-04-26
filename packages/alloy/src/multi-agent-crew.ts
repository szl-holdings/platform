import { randomUUID } from 'node:crypto';
import type { AgentRequest, EnvelopeToolCall } from './envelope.js';
import { type TrustScoreEngine, type TrustLevel } from './trust-score.js';

export interface LlmChatClient {
  chat(params: {
    model: string;
    maxTokens?: number;
    messages: Array<{ role: string; content: string }>;
  }): Promise<string>;
}

export type CrewRole = 'analyst' | 'drafter' | 'hunter' | 'sourcer' | 'coordinator';

export interface CrewMember {
  agentId: string;
  role: CrewRole;
  displayName: string;
  domain?: string;
  capabilities: string[];
}

export type SubPlanStatus =
  | 'pending'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface SubPlan {
  subPlanId: string;
  parentPlanId: string;
  assignee: CrewMember;
  objective: string;
  dependencies: string[];
  priority: number;
  estimatedRiskTier: 'low' | 'medium' | 'high';
  status: SubPlanStatus;
  approvalReason?: string;
}

export interface SubPlanResult {
  subPlanId: string;
  agentId: string;
  role: CrewRole;
  output: string;
  artifacts: Record<string, unknown>;
  success: boolean;
  durationMs: number;
  toolCalls: EnvelopeToolCall[];
  trustLevelUsed: TrustLevel;
  requiredApproval: boolean;
  approvalStatus: 'auto_approved' | 'human_approved' | 'human_rejected' | 'gated';
}

export interface ApprovalRequest {
  subPlanId: string;
  agentId: string;
  role: CrewRole;
  objective: string;
  riskTier: 'low' | 'medium' | 'high';
  trustLevel: TrustLevel;
  reason: string;
}

export type ApprovalCallback = (
  request: ApprovalRequest,
) => Promise<{ approved: boolean; reason?: string }>;

export interface PendingApproval {
  subPlanId: string;
  agentId: string;
  role: CrewRole;
  objective: string;
  riskTier: 'low' | 'medium' | 'high';
  trustLevel: TrustLevel;
  reason: string;
}

export interface CrewRunResult {
  planId: string;
  objective: string;
  crewMembers: CrewMember[];
  subPlans: SubPlan[];
  results: SubPlanResult[];
  pendingApprovals: PendingApproval[];
  synthesizedOutput: string;
  success: boolean;
  totalDurationMs: number;
  approvalGatesTriggered: number;
  autoApproved: number;
  gatedPendingApproval: number;
  rejectedByApprover: number;
}

const DEFAULT_CREW: CrewMember[] = [
  {
    agentId: 'crew-analyst',
    role: 'analyst',
    displayName: 'Intelligence Analyst',
    capabilities: ['research', 'data-analysis', 'pattern-detection', 'risk-assessment'],
  },
  {
    agentId: 'crew-drafter',
    role: 'drafter',
    displayName: 'Content Drafter',
    capabilities: ['document-generation', 'summarization', 'brief-writing', 'report-creation'],
  },
  {
    agentId: 'crew-hunter',
    role: 'hunter',
    displayName: 'Threat Hunter',
    capabilities: ['threat-detection', 'anomaly-hunting', 'vulnerability-assessment', 'ioc-search'],
  },
  {
    agentId: 'crew-sourcer',
    role: 'sourcer',
    displayName: 'Data Sourcer',
    capabilities: ['data-retrieval', 'api-integration', 'document-ingestion', 'entity-resolution'],
  },
];

const ROLE_KEYWORDS: Record<CrewRole, RegExp> = {
  analyst: /analy[sz]|assess|evaluat|pattern|insight|intelligence|review|investigat/i,
  drafter: /draft|writ|generat|creat|compos|summar|brief|report|document|email/i,
  hunter: /hunt|threat|vulnerab|anomal|detect|scan|breach|incident|attack|malware/i,
  sourcer: /source|retriev|fetch|gather|collect|ingest|search|find|lookup|extract/i,
  coordinator: /coordinat|orchestrat|manag|plan|delegat/i,
};

function selectCrewForObjective(objective: string, domain?: string): CrewMember[] {
  const selected: CrewMember[] = [];
  const lower = objective.toLowerCase();

  for (const member of DEFAULT_CREW) {
    const pattern = ROLE_KEYWORDS[member.role];
    if (pattern.test(lower)) {
      selected.push({ ...member, domain });
    }
  }

  if (selected.length === 0) {
    selected.push(
      { ...DEFAULT_CREW.find((m) => m.role === 'sourcer')!, domain },
      { ...DEFAULT_CREW.find((m) => m.role === 'analyst')!, domain },
    );
  }

  if (!selected.some((m) => m.role === 'analyst')) {
    selected.push({ ...DEFAULT_CREW.find((m) => m.role === 'analyst')!, domain });
  }

  return selected;
}

function decomposeIntoSubPlans(
  planId: string,
  objective: string,
  crew: CrewMember[],
): SubPlan[] {
  const subPlans: SubPlan[] = [];
  const roles = crew.map((m) => m.role);
  let priority = 1;

  if (roles.includes('sourcer')) {
    const sourcer = crew.find((m) => m.role === 'sourcer')!;
    subPlans.push({
      subPlanId: randomUUID(),
      parentPlanId: planId,
      assignee: sourcer,
      objective: `Gather and retrieve all relevant data, documents, and context for: ${objective}`,
      dependencies: [],
      priority: priority++,
      estimatedRiskTier: 'low',
      status: 'pending',
    });
  }

  if (roles.includes('hunter')) {
    const hunter = crew.find((m) => m.role === 'hunter')!;
    const deps = subPlans.filter((s) => s.assignee.role === 'sourcer').map((s) => s.subPlanId);
    subPlans.push({
      subPlanId: randomUUID(),
      parentPlanId: planId,
      assignee: hunter,
      objective: `Scan for threats, anomalies, and risks related to: ${objective}`,
      dependencies: deps,
      priority: priority++,
      estimatedRiskTier: 'medium',
      status: 'pending',
    });
  }

  if (roles.includes('analyst')) {
    const analyst = crew.find((m) => m.role === 'analyst')!;
    const deps = subPlans.map((s) => s.subPlanId);
    subPlans.push({
      subPlanId: randomUUID(),
      parentPlanId: planId,
      assignee: analyst,
      objective: `Analyze findings and produce intelligence assessment for: ${objective}`,
      dependencies: deps,
      priority: priority++,
      estimatedRiskTier: 'low',
      status: 'pending',
    });
  }

  if (roles.includes('drafter')) {
    const drafter = crew.find((m) => m.role === 'drafter')!;
    const deps = subPlans.map((s) => s.subPlanId);
    subPlans.push({
      subPlanId: randomUUID(),
      parentPlanId: planId,
      assignee: drafter,
      objective: `Draft the final deliverable based on analysis for: ${objective}`,
      dependencies: deps,
      priority: priority++,
      estimatedRiskTier: 'low',
      status: 'pending',
    });
  }

  return subPlans;
}

export type CrewExecutor = (
  member: CrewMember,
  objective: string,
  priorResults: SubPlanResult[],
) => Promise<{ output: string; artifacts: Record<string, unknown>; success: boolean }>;

function createDefaultExecutor(llm: LlmChatClient): CrewExecutor {
  return async (member, objective, priorResults) => {
    try {
      const priorContext = priorResults
        .filter((r) => r.success)
        .map((r) => `[${r.role}]: ${r.output.slice(0, 500)}`)
        .join('\n\n');

      const systemPrompt = `You are the ${member.displayName} (${member.role}) specialist agent.
Your capabilities: ${member.capabilities.join(', ')}.
${member.domain ? `Domain: ${member.domain}` : ''}
Answer concisely and factually. Structure your output clearly.`;

      const userContent = priorContext
        ? `Objective: ${objective}\n\nPrior specialist outputs:\n${priorContext}\n\nProvide your specialist contribution:`
        : `Objective: ${objective}\n\nProvide your specialist contribution:`;

      const output = await llm.chat({
        model: 'gpt-4o-mini',
        maxTokens: 1500,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
      });

      return { output, artifacts: {}, success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Crew executor error';
      return { output: `[Error from ${member.displayName}]: ${msg}`, artifacts: {}, success: false };
    }
  };
}

export interface MultiAgentCrewOptions {
  llmClient?: LlmChatClient;
  executor?: CrewExecutor;
  trustEngine?: TrustScoreEngine;
  crew?: CrewMember[];
  maxParallelAgents?: number;
  approvalCallback?: ApprovalCallback;
}

export class MultiAgentCrew {
  private readonly executor: CrewExecutor;
  private readonly llmClient?: LlmChatClient;
  private readonly trustEngine?: TrustScoreEngine;
  private readonly customCrew?: CrewMember[];
  private readonly approvalCallback?: ApprovalCallback;

  constructor(options: MultiAgentCrewOptions = {}) {
    this.llmClient = options.llmClient;
    this.trustEngine = options.trustEngine;
    this.customCrew = options.crew;
    this.approvalCallback = options.approvalCallback;

    if (options.executor) {
      this.executor = options.executor;
    } else if (options.llmClient) {
      this.executor = createDefaultExecutor(options.llmClient);
    } else {
      throw new Error(
        'MultiAgentCrew requires either an llmClient or a custom executor. ' +
        'Pass { llmClient } for default LLM-based execution, or { executor } for custom logic.',
      );
    }
  }

  private evaluateApprovalRequirement(
    subPlan: SubPlan,
  ): { requiresApproval: boolean; trustLevel: TrustLevel; reason: string } {
    if (!this.trustEngine) {
      return { requiresApproval: false, trustLevel: 'supervised', reason: 'No trust engine configured' };
    }

    const decision = this.trustEngine.evaluateApproval(
      subPlan.assignee.agentId,
      subPlan.assignee.role,
      subPlan.estimatedRiskTier,
    );

    return {
      requiresApproval: decision.requiresApproval,
      trustLevel: decision.trustLevel,
      reason: decision.reason,
    };
  }

  async run(request: AgentRequest): Promise<CrewRunResult> {
    const startMs = Date.now();
    const planId = randomUUID();
    const objective = request.objective;
    const domain = request.domain;

    const crew = this.customCrew ?? selectCrewForObjective(objective, domain);
    const subPlans = decomposeIntoSubPlans(planId, objective, crew);
    const results: SubPlanResult[] = [];
    const pendingApprovals: PendingApproval[] = [];
    let approvalGatesTriggered = 0;
    let autoApproved = 0;
    let gatedPendingApproval = 0;
    let rejectedByApprover = 0;

    const completed = new Set<string>();

    const getReadyPlans = () =>
      subPlans.filter(
        (sp) =>
          sp.status === 'pending' &&
          sp.dependencies.every((dep) => completed.has(dep)),
      );

    let readyPlans = getReadyPlans();

    while (readyPlans.length > 0) {
      for (const subPlan of readyPlans) {
        const { requiresApproval, trustLevel, reason } =
          this.evaluateApprovalRequirement(subPlan);

        if (requiresApproval) {
          approvalGatesTriggered++;
          subPlan.status = 'awaiting_approval';
          subPlan.approvalReason = reason;

          let approved = false;
          let approvalStatus: SubPlanResult['approvalStatus'] = 'gated';

          if (this.approvalCallback) {
            const decision = await this.approvalCallback({
              subPlanId: subPlan.subPlanId,
              agentId: subPlan.assignee.agentId,
              role: subPlan.assignee.role,
              objective: subPlan.objective,
              riskTier: subPlan.estimatedRiskTier,
              trustLevel,
              reason,
            });

            if (decision.approved) {
              approved = true;
              approvalStatus = 'human_approved';
              subPlan.status = 'approved';
            } else {
              approvalStatus = 'human_rejected';
              subPlan.status = 'rejected';
              rejectedByApprover++;
            }
          } else {
            gatedPendingApproval++;
            pendingApprovals.push({
              subPlanId: subPlan.subPlanId,
              agentId: subPlan.assignee.agentId,
              role: subPlan.assignee.role,
              objective: subPlan.objective,
              riskTier: subPlan.estimatedRiskTier,
              trustLevel,
              reason,
            });
            continue;
          }

          if (!approved) {
            results.push({
              subPlanId: subPlan.subPlanId,
              agentId: subPlan.assignee.agentId,
              role: subPlan.assignee.role,
              output: `[Gated]: ${reason} — Rejected by approver`,
              artifacts: {},
              success: false,
              durationMs: 0,
              toolCalls: [],
              trustLevelUsed: trustLevel,
              requiredApproval: true,
              approvalStatus,
            });
            completed.add(subPlan.subPlanId);
            continue;
          }
        } else {
          autoApproved++;
        }

        subPlan.status = 'running';

        const t0 = Date.now();
        const priorResults = results.filter((r) =>
          subPlan.dependencies.includes(r.subPlanId) && r.success,
        );

        try {
          const { output, artifacts, success } = await this.executor(
            subPlan.assignee,
            subPlan.objective,
            priorResults,
          );

          const durationMs = Date.now() - t0;
          subPlan.status = success ? 'completed' : 'failed';

          if (this.trustEngine) {
            this.trustEngine.recordOutcome(
              subPlan.assignee.agentId,
              subPlan.assignee.role,
              success,
              subPlan.estimatedRiskTier,
            );
          }

          results.push({
            subPlanId: subPlan.subPlanId,
            agentId: subPlan.assignee.agentId,
            role: subPlan.assignee.role,
            output,
            artifacts,
            success,
            durationMs,
            toolCalls: [],
            trustLevelUsed: trustLevel,
            requiredApproval: requiresApproval,
            approvalStatus: requiresApproval ? 'human_approved' : 'auto_approved',
          });
        } catch (err) {
          const durationMs = Date.now() - t0;
          subPlan.status = 'failed';
          results.push({
            subPlanId: subPlan.subPlanId,
            agentId: subPlan.assignee.agentId,
            role: subPlan.assignee.role,
            output: `[Execution error]: ${err instanceof Error ? err.message : String(err)}`,
            artifacts: {},
            success: false,
            durationMs,
            toolCalls: [],
            trustLevelUsed: trustLevel,
            requiredApproval: requiresApproval,
            approvalStatus: requiresApproval ? 'human_approved' : 'auto_approved',
          });
        }

        completed.add(subPlan.subPlanId);
      }

      readyPlans = getReadyPlans();
    }

    const synthesizedOutput = await this.synthesize(objective, results);

    return {
      planId,
      objective,
      crewMembers: crew,
      subPlans,
      results,
      pendingApprovals,
      synthesizedOutput,
      success: results.some((r) => r.success),
      totalDurationMs: Date.now() - startMs,
      approvalGatesTriggered,
      autoApproved,
      gatedPendingApproval,
      rejectedByApprover,
    };
  }

  async resumeApproved(
    previousResult: CrewRunResult,
    approvedSubPlanIds: Set<string>,
  ): Promise<CrewRunResult> {
    const startMs = Date.now();
    const { planId, objective, crewMembers, subPlans } = previousResult;

    const priorResults = [...previousResult.results];
    const newResults: SubPlanResult[] = [];
    const pendingApprovals: PendingApproval[] = [];
    let approvalGatesTriggered = 0;
    let autoApproved = 0;
    let gatedPendingApproval = 0;
    let rejectedByApprover = 0;

    const completed = new Set<string>();
    for (const r of priorResults) {
      completed.add(r.subPlanId);
    }

    for (const sp of subPlans) {
      if (sp.status === 'awaiting_approval') {
        if (approvedSubPlanIds.has(sp.subPlanId)) {
          sp.status = 'approved';
        }
      }
    }

    const gatedThisRound = new Set<string>();

    const getReadyPlans = () =>
      subPlans.filter(
        (sp) =>
          !gatedThisRound.has(sp.subPlanId) &&
          (sp.status === 'approved' || sp.status === 'awaiting_approval' || sp.status === 'pending') &&
          sp.dependencies.every((dep) => completed.has(dep)),
      );

    let readyPlans = getReadyPlans();

    while (readyPlans.length > 0) {
      for (const subPlan of readyPlans) {
        if (subPlan.status === 'awaiting_approval') {
          approvalGatesTriggered++;
          gatedPendingApproval++;
          pendingApprovals.push({
            subPlanId: subPlan.subPlanId,
            agentId: subPlan.assignee.agentId,
            role: subPlan.assignee.role,
            objective: subPlan.objective,
            riskTier: subPlan.estimatedRiskTier,
            trustLevel: this.trustEngine
              ? this.trustEngine.getScore(subPlan.assignee.agentId).currentLevel
              : 'supervised',
            reason: subPlan.approvalReason ?? 'Requires approval',
          });
          gatedThisRound.add(subPlan.subPlanId);
          continue;
        }

        if (subPlan.status === 'pending') {
          const { requiresApproval, trustLevel, reason } =
            this.evaluateApprovalRequirement(subPlan);

          if (requiresApproval) {
            approvalGatesTriggered++;
            gatedPendingApproval++;
            subPlan.status = 'awaiting_approval';
            subPlan.approvalReason = reason;
            pendingApprovals.push({
              subPlanId: subPlan.subPlanId,
              agentId: subPlan.assignee.agentId,
              role: subPlan.assignee.role,
              objective: subPlan.objective,
              riskTier: subPlan.estimatedRiskTier,
              trustLevel,
              reason,
            });
            gatedThisRound.add(subPlan.subPlanId);
            continue;
          }
        }

        autoApproved++;
        subPlan.status = 'running';

        const t0 = Date.now();
        const deps = [...priorResults, ...newResults].filter(
          (r) => subPlan.dependencies.includes(r.subPlanId) && r.success,
        );

        try {
          const { output, artifacts, success } = await this.executor(
            subPlan.assignee,
            subPlan.objective,
            deps,
          );

          const durationMs = Date.now() - t0;
          subPlan.status = success ? 'completed' : 'failed';

          if (this.trustEngine) {
            this.trustEngine.recordOutcome(
              subPlan.assignee.agentId,
              subPlan.assignee.role,
              success,
              subPlan.estimatedRiskTier,
            );
          }

          newResults.push({
            subPlanId: subPlan.subPlanId,
            agentId: subPlan.assignee.agentId,
            role: subPlan.assignee.role,
            output,
            artifacts,
            success,
            durationMs,
            toolCalls: [],
            trustLevelUsed: this.trustEngine
              ? this.trustEngine.getScore(subPlan.assignee.agentId).currentLevel
              : 'supervised',
            requiredApproval: true,
            approvalStatus: 'human_approved',
          });
        } catch (err) {
          const durationMs = Date.now() - t0;
          subPlan.status = 'failed';
          newResults.push({
            subPlanId: subPlan.subPlanId,
            agentId: subPlan.assignee.agentId,
            role: subPlan.assignee.role,
            output: `[Execution error]: ${err instanceof Error ? err.message : String(err)}`,
            artifacts: {},
            success: false,
            durationMs,
            toolCalls: [],
            trustLevelUsed: this.trustEngine
              ? this.trustEngine.getScore(subPlan.assignee.agentId).currentLevel
              : 'supervised',
            requiredApproval: true,
            approvalStatus: 'human_approved',
          });
        }

        completed.add(subPlan.subPlanId);
      }

      readyPlans = getReadyPlans();
    }

    const allResults = [...priorResults, ...newResults];
    const synthesizedOutput = await this.synthesize(objective, allResults);

    return {
      planId,
      objective,
      crewMembers,
      subPlans,
      results: allResults,
      pendingApprovals,
      synthesizedOutput,
      success: allResults.some((r) => r.success),
      totalDurationMs: Date.now() - startMs,
      approvalGatesTriggered,
      autoApproved,
      gatedPendingApproval,
      rejectedByApprover,
    };
  }

  private async synthesize(objective: string, results: SubPlanResult[]): Promise<string> {
    const successful = results.filter((r) => r.success);
    const gated = results.filter((r) => r.approvalStatus === 'gated' || r.approvalStatus === 'human_rejected');

    if (successful.length === 0 && gated.length > 0) {
      return `All sub-plans require human approval before execution.\n\n${gated.map((r) => `- [${r.role}] ${r.output}`).join('\n')}`;
    }

    if (successful.length === 0) {
      return results.map((r) => `[${r.role}]: ${r.output}`).join('\n\n');
    }

    if (!this.llmClient) {
      return successful.map((r) => `[${r.role}]: ${r.output}`).join('\n\n---\n\n');
    }

    try {
      const context = successful
        .map((r) => `## ${r.role.toUpperCase()} (${r.agentId})\n${r.output}`)
        .join('\n\n');

      const gatedContext = gated.length > 0
        ? `\n\n## GATED (Awaiting Approval)\n${gated.map((r) => `- [${r.role}]: ${r.output}`).join('\n')}`
        : '';

      const output = await this.llmClient.chat({
        model: 'gpt-4o-mini',
        maxTokens: 2000,
        messages: [
          {
            role: 'system',
            content:
              'You are a crew coordinator. Merge the specialist agent outputs into a clear, comprehensive, executive-ready answer. Cite each specialist where relevant. If any sub-plans were gated for human approval, note them clearly.',
          },
          {
            role: 'user',
            content: `Objective: ${objective}\n\nCrew Outputs:\n${context}${gatedContext}\n\nSynthesize the final coordinated answer:`,
          },
        ],
      });

      return output;
    } catch {
      return successful.map((r) => `[${r.role}]: ${r.output}`).join('\n\n---\n\n');
    }
  }
}

export function getDefaultCrew(): CrewMember[] {
  return [...DEFAULT_CREW];
}

export function createCrew(members: CrewMember[], options: MultiAgentCrewOptions): MultiAgentCrew {
  return new MultiAgentCrew({ ...options, crew: members });
}
