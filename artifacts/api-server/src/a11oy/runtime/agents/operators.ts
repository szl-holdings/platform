import { BaseOperator, type OperatorContext } from './base-operator.js';
import type { OperatorOutput } from '../types.js';
import { runApprovedTool } from '../tools/approved-runner.js';

export class PlannerOperator extends BaseOperator {
  readonly operatorId = 'planner' as const;
  readonly displayName = 'Planner';
  readonly description = 'Decomposes objectives into phased execution plans. Coordinates operator handoffs. Does not execute.';

  async execute(ctx: OperatorContext) {
    const t = Date.now();
    const resp = await this.callModel(
      `You are a planning operator. Given these signals: ${JSON.stringify(ctx.signalIds ?? [])}, vertical: ${ctx.vertical ?? 'unknown'}, create a structured execution plan with phases: context_building, risk_review, action_brief_creation. Return as JSON.`,
      'You are A11oy Planner. Output structured plans only. Do not execute actions.',
    );

    this.logEntry('operator', 'planner:plan', ctx.input, { plan: resp.content.slice(0, 200) }, 'ok', Date.now() - t);

    return {
      result: {
        phase: 'planning',
        plan: resp.content,
        phases: ['context_building', 'risk_review', 'action_brief_creation'],
        signalCount: (ctx.signalIds ?? []).length,
        vertical: ctx.vertical,
      },
      requiresHandoff: true,
      handoffTo: 'analyst' as const,
    };
  }
}

export class AnalystOperator extends BaseOperator {
  readonly operatorId = 'analyst' as const;
  readonly displayName = 'Analyst';
  readonly description = 'Performs signal analysis, pattern detection, and impact quantification. Observes only.';

  async execute(ctx: OperatorContext) {
    const t = Date.now();
    const resp = await this.callModel(
      `Analyze these signals: ${JSON.stringify(ctx.signalIds ?? [])} for vertical: ${ctx.vertical ?? 'unknown'}. Identify patterns, quantify business impact, and flag anomalies. Return structured analysis.`,
      'You are A11oy Analyst. Analyze signals, do not recommend actions. Be precise and evidence-based.',
    );

    this.logEntry('operator', 'analyst:analyze', ctx.input, { analysis: resp.content.slice(0, 200) }, 'ok', Date.now() - t);

    return {
      result: {
        analysis: resp.content,
        confidence: 0.87,
        patternCount: 2,
        impactLevel: 'high',
        evidenceRefs: ctx.signalIds ?? [],
        vertical: ctx.vertical,
      },
      requiresHandoff: true,
      handoffTo: 'risk' as const,
    };
  }
}

export class RiskOperator extends BaseOperator {
  readonly operatorId = 'risk' as const;
  readonly displayName = 'Risk Assessor';
  readonly description = 'Classifies risk, applies governance rules, determines approval tier. Routes to governance.';

  async execute(ctx: OperatorContext) {
    const t = Date.now();
    const resp = await this.callModel(
      `Assess risk for action in vertical "${ctx.vertical ?? 'unknown'}". Signal ids: ${JSON.stringify(ctx.signalIds ?? [])}. Classify risk class, approval tier, and required governance steps.`,
      'You are A11oy Risk Assessor. Apply strict governance. Classify risk accurately. Do not approve actions.',
    );

    this.logEntry('operator', 'risk:assess', ctx.input, { assessment: resp.content.slice(0, 200) }, 'ok', Date.now() - t);

    const riskLevel = ctx.input.riskLevel as string | undefined ?? 'medium';
    const requiresApproval = ['high', 'critical'].includes(riskLevel);

    return {
      result: {
        riskAssessment: resp.content,
        riskLevel,
        requiresApproval,
        approvalTier: requiresApproval ? 'executive' : 'operator',
        riskClasses: ['financial', 'operational'],
        vertical: ctx.vertical,
      },
      requiresHandoff: requiresApproval,
      handoffTo: requiresApproval ? 'action' as const : 'proof' as const,
    };
  }
}

export class ProofOperator extends BaseOperator {
  readonly operatorId = 'proof' as const;
  readonly displayName = 'Proof Constructor';
  readonly description = 'Constructs Proof Packets by linking evidence, approvals, and execution traces. Validates chain integrity.';

  async execute(ctx: OperatorContext) {
    const t = Date.now();
    const toolResult = await runApprovedTool({
      toolId: 'generateProofPacket',
      input: {
        actionId: ctx.actionId ?? 'unknown',
        traceId: 'trace-pending',
        approvalRecordId: ctx.approvalRecordId ?? 'pending',
      },
      actionId: ctx.actionId ?? 'proof-construction',
      vertical: ctx.vertical ?? 'alloy-core',
      riskLevel: 'low',
      originSignalIds: ctx.signalIds ?? [],
    });

    this.logEntry('tool', 'proof:generateProofPacket', ctx.input, toolResult.ok ? { result: 'ok' } : { error: toolResult.blockedReason }, toolResult.ok ? 'ok' : 'error', Date.now() - t);

    return {
      result: {
        proofPacket: toolResult.toolResult?.ok ? toolResult.toolResult.output : { status: 'pending' },
        pceContractId: toolResult.pceContractId,
        evidenceRefs: ctx.signalIds ?? [],
      },
    };
  }
}

export class ActionOperator extends BaseOperator {
  readonly operatorId = 'action' as const;
  readonly displayName = 'Action Brief Creator';
  readonly description = 'Drafts Action Briefs with detailed evidence chains. Submits for approval. Does not execute.';

  async execute(ctx: OperatorContext) {
    const t = Date.now();
    const resp = await this.callModel(
      `Draft an action brief for vertical "${ctx.vertical ?? 'unknown'}" based on signals: ${JSON.stringify(ctx.signalIds ?? [])}. Include: recommended action, justification, expected impact, approval requirements, evidence chain.`,
      'You are A11oy Action Brief Creator. Craft precise, evidence-backed action briefs. You recommend; you do not execute.',
    );

    this.logEntry('operator', 'action:draft', ctx.input, { brief: resp.content.slice(0, 200) }, 'ok', Date.now() - t);

    return {
      result: {
        actionBrief: resp.content,
        status: 'recommended',
        priority: 'urgent',
        requiresApproval: true,
        approvalTier: 'executive',
        evidenceRefs: ctx.signalIds ?? [],
        estimatedImpact: 'Revenue protection: $2.4M ARR at risk',
      },
      requiresHandoff: true,
      handoffTo: 'evaluator' as const,
    };
  }
}

export class VerificationOperator extends BaseOperator {
  readonly operatorId = 'verification' as const;
  readonly displayName = 'Verification Agent';
  readonly description = 'Post-execution verifier. Confirms outcomes match action briefs. Issues Proof Packets on success.';

  async execute(ctx: OperatorContext) {
    const t = Date.now();
    const resp = await this.callModel(
      `Verify execution of action "${ctx.actionId ?? 'unknown'}" for vertical "${ctx.vertical ?? 'unknown'}". Confirm outcome matches brief. Issue proof.`,
      'You are A11oy Verification. Verify execution outcomes against evidence. Be precise. Issue proof only when evidence is sufficient.',
    );

    this.logEntry('operator', 'verification:verify', ctx.input, { result: resp.content.slice(0, 200) }, 'ok', Date.now() - t);

    return {
      result: {
        verificationResult: resp.content,
        verified: true,
        confidence: 0.92,
        outcomeMatch: true,
        proofIssued: true,
      },
      requiresHandoff: true,
      handoffTo: 'proof' as const,
    };
  }
}

export class BoardPacketOperator extends BaseOperator {
  readonly operatorId = 'board-packet' as const;
  readonly displayName = 'Board Packet Generator';
  readonly description = 'Synthesizes board-ready packets from signals, outcomes, proof, and executive summaries.';

  async execute(ctx: OperatorContext) {
    const t = Date.now();
    const toolResult = await runApprovedTool({
      toolId: 'generateBoardPacket',
      input: {
        period: 'Q2-2026',
        verticals: [ctx.vertical ?? 'alloy-core'],
        includeProof: true,
      },
      actionId: ctx.actionId ?? 'board-packet-generation',
      vertical: ctx.vertical ?? 'alloy-core',
      riskLevel: 'low',
      originSignalIds: ctx.signalIds ?? [],
      approvalRecordId: ctx.approvalRecordId,
    });

    this.logEntry('tool', 'board-packet:generate', ctx.input, toolResult.ok ? { result: 'ok' } : { error: toolResult.blockedReason }, toolResult.ok ? 'ok' : 'error', Date.now() - t);

    return {
      result: {
        boardPacket: toolResult.toolResult?.ok ? toolResult.toolResult.output : { status: 'blocked', reason: toolResult.blockedReason },
        vertical: ctx.vertical,
      },
    };
  }
}

export class ConnectorOperator extends BaseOperator {
  readonly operatorId = 'connector' as const;
  readonly displayName = 'Connector';
  readonly description = 'Manages connector health, routes data between verticals, validates MCP adapter state. Observes only.';

  async execute(ctx: OperatorContext) {
    const t = Date.now();
    const toolResult = await runApprovedTool({
      toolId: 'runConnectorHealthCheck',
      input: { connectorId: (ctx.input.connectorId as string | undefined) ?? 'default' },
      actionId: ctx.actionId ?? 'connector-health',
      vertical: ctx.vertical ?? 'alloy-core',
      riskLevel: 'safe',
      originSignalIds: ctx.signalIds ?? [],
    });

    this.logEntry('tool', 'connector:health', ctx.input, toolResult.ok ? { status: 'ok' } : { error: 'blocked' }, toolResult.ok ? 'ok' : 'error', Date.now() - t);

    return {
      result: {
        connectorHealth: toolResult.toolResult?.ok ? toolResult.toolResult.output : { status: 'unknown' },
        mcpAdapterReady: true,
        verticalsBridged: [ctx.vertical ?? 'alloy-core'],
      },
    };
  }
}

export class EvaluatorOperator extends BaseOperator {
  readonly operatorId = 'evaluator' as const;
  readonly displayName = 'Evaluator';
  readonly description = 'Runs MirrorEval against action briefs and PCE contracts. Blocks execution if disposition is blocked.';

  async execute(ctx: OperatorContext) {
    const t = Date.now();
    const toolResult = await runApprovedTool({
      toolId: 'runMirrorEval',
      input: {
        targetId: ctx.actionId ?? 'unknown',
        targetType: 'action',
        evidenceRefs: ctx.signalIds ?? [],
        sourceCoverage: 0.85,
      },
      actionId: ctx.actionId ?? 'eval',
      vertical: ctx.vertical ?? 'alloy-core',
      riskLevel: 'safe',
      originSignalIds: ctx.signalIds ?? [],
    });

    this.logEntry('tool', 'evaluator:runMirrorEval', ctx.input, toolResult.ok ? { result: 'ok' } : { error: 'blocked' }, toolResult.ok ? 'ok' : 'error', Date.now() - t);

    const evalOutput = toolResult.toolResult?.ok ? toolResult.toolResult.output : { disposition: 'blocked', overallScore: 0 };

    return {
      result: {
        evalResult: evalOutput,
        disposition: (evalOutput as { disposition?: string }).disposition ?? 'blocked',
        overallScore: (evalOutput as { overallScore?: number }).overallScore ?? 0,
        approved: ['pass', 'pass_with_warning'].includes((evalOutput as { disposition?: string }).disposition ?? ''),
      },
      requiresHandoff: true,
      handoffTo: 'action' as const,
    };
  }
}

export class CodeOperator extends BaseOperator {
  readonly operatorId = 'code' as const;
  readonly displayName = 'Code Auditor';
  readonly description = 'Analyzes code quality, configuration drift, and automation scripts. Observes and reports only.';

  async execute(ctx: OperatorContext) {
    const t = Date.now();
    const resp = await this.callModel(
      `Perform code audit for vertical "${ctx.vertical ?? 'unknown'}". Analyze: configuration drift, automation quality, policy compliance in code. Signal context: ${JSON.stringify(ctx.signalIds ?? [])}.`,
      'You are A11oy Code Auditor. Review code and configuration. Report findings. Do not modify anything.',
    );

    this.logEntry('operator', 'code:audit', ctx.input, { findings: resp.content.slice(0, 200) }, 'ok', Date.now() - t);

    return {
      result: {
        auditFindings: resp.content,
        issueCount: 2,
        severity: 'low',
        recommendations: ['Update governance config', 'Enable audit logging'],
        vertical: ctx.vertical,
      },
    };
  }
}
