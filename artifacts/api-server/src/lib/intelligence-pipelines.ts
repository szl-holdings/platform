import type { ChatMessage } from '@szl-holdings/services';
import { gatewayInfer } from './ai-gateway';
import { writeAuditLog } from './alloy-orchestration';
import { logger } from './logger';

export type PipelineStageType = 'ingest' | 'classify' | 'score' | 'enrich' | 'recommend' | 'audit';

export interface PipelineStageConfig {
  name: string;
  type: PipelineStageType;
  systemPrompt: string;
  userPromptTemplate: string;
  maxTokens?: number;
  domain: string;
}

export interface PipelineConfig {
  id: string;
  name: string;
  description: string;
  domain: string;
  stages: PipelineStageConfig[];
}

export interface PipelineStageResult {
  stageName: string;
  stageType: PipelineStageType;
  status: 'completed' | 'failed' | 'skipped';
  output: string;
  durationMs: number;
  tokensUsed: number;
}

export interface PipelineResult {
  pipelineId: string;
  pipelineName: string;
  runId: string;
  status: 'completed' | 'partial' | 'failed';
  stages: PipelineStageResult[];
  finalOutput: string;
  totalDurationMs: number;
  totalTokens: number;
  startedAt: number;
  completedAt: number;
}

function renderTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

const PIPELINES: PipelineConfig[] = [
  {
    id: 'terra-property-scoring',
    name: 'Terra Property Intelligence Pipeline',
    description:
      'Multi-step pipeline for property investment analysis: ingest data, classify property type, score investment potential, generate recommendation',
    domain: 'terra',
    stages: [
      {
        name: 'Data Ingestion & Normalization',
        type: 'ingest',
        systemPrompt:
          'You are a real estate data normalization agent. Extract and structure key property metrics from raw data.',
        userPromptTemplate:
          'Normalize this property data into structured metrics (price, sqft, cap rate, occupancy, location grade, market trend):\n\n{{input}}',
        maxTokens: 600,
        domain: 'terra',
      },
      {
        name: 'Property Classification',
        type: 'classify',
        systemPrompt:
          'You are a real estate classification agent. Categorize properties by type, risk profile, and investment strategy.',
        userPromptTemplate:
          'Based on these normalized metrics, classify the property:\n\n{{previousOutput}}\n\nProvide: property_type, risk_tier (low/medium/high), strategy (value-add/core/opportunistic/distressed), market_position',
        maxTokens: 400,
        domain: 'terra',
      },
      {
        name: 'Investment Scoring',
        type: 'score',
        systemPrompt:
          'You are a real estate investment scoring engine. Score properties on a 0-100 scale across multiple dimensions.',
        userPromptTemplate:
          'Score this property (0-100) on each dimension:\n\nClassification: {{previousOutput}}\n\nDimensions: financial_return, market_strength, risk_adjusted_return, location_premium, growth_potential\n\nProvide an overall_score and brief justification for each.',
        maxTokens: 600,
        domain: 'terra',
      },
      {
        name: 'Investment Recommendation',
        type: 'recommend',
        systemPrompt:
          'You are a real estate investment advisor. Generate actionable recommendations based on scoring analysis.',
        userPromptTemplate:
          'Generate an investment recommendation based on this scoring:\n\n{{previousOutput}}\n\nInclude: recommendation (strong-buy/buy/hold/pass/avoid), key_risks, upside_catalysts, suggested_entry_price_range, holding_period, exit_strategy',
        maxTokens: 800,
        domain: 'terra',
      },
    ],
  },
  {
    id: 'firestorm-threat-assessment',
    name: 'Firestorm Threat Assessment Pipeline',
    description:
      'Multi-step pipeline for threat analysis: ingest indicators, classify threat type, score severity, recommend response',
    domain: 'firestorm',
    stages: [
      {
        name: 'Threat Indicator Ingestion',
        type: 'ingest',
        systemPrompt:
          'You are a threat intelligence ingestion agent. Extract and normalize threat indicators from raw security data.',
        userPromptTemplate:
          'Extract threat indicators from this security data (IOCs, TTPs, affected systems, timeline):\n\n{{input}}',
        maxTokens: 600,
        domain: 'firestorm',
      },
      {
        name: 'Threat Classification',
        type: 'classify',
        systemPrompt: 'You are a threat classification agent following MITRE ATT&CK framework.',
        userPromptTemplate:
          'Classify these threat indicators using MITRE ATT&CK:\n\n{{previousOutput}}\n\nProvide: threat_type, attack_vector, tactic, technique_id, threat_actor_profile, campaign_indicators',
        maxTokens: 500,
        domain: 'firestorm',
      },
      {
        name: 'Severity Scoring',
        type: 'score',
        systemPrompt: 'You are a security risk scoring engine using CVSS-compatible methodology.',
        userPromptTemplate:
          'Score this threat (0-10 CVSS-style):\n\n{{previousOutput}}\n\nDimensions: exploitability, impact, scope, privileges_required, user_interaction\n\nProvide overall_severity (critical/high/medium/low), confidence_level, and blast_radius estimate.',
        maxTokens: 500,
        domain: 'firestorm',
      },
      {
        name: 'Response Recommendation',
        type: 'recommend',
        systemPrompt:
          'You are an incident response advisor. Generate prioritized remediation steps.',
        userPromptTemplate:
          'Generate incident response plan:\n\n{{previousOutput}}\n\nInclude: immediate_actions (first 1h), short_term (24h), long_term (1 week), detection_rules, prevention_measures',
        maxTokens: 800,
        domain: 'firestorm',
      },
    ],
  },
  {
    id: 'vessels-risk-assessment',
    name: 'Vessels Maritime Risk Pipeline',
    description:
      'Multi-step pipeline for vessel risk assessment: ingest AIS/fleet data, classify vessel behavior, score risk, recommend actions',
    domain: 'vessels',
    stages: [
      {
        name: 'Maritime Data Ingestion',
        type: 'ingest',
        systemPrompt:
          'You are a maritime data ingestion agent. Normalize AIS signals, vessel identifiers, and route data.',
        userPromptTemplate:
          'Normalize this maritime data into structured vessel intelligence (IMO, MMSI, position, heading, speed, cargo, destination, flag state):\n\n{{input}}',
        maxTokens: 600,
        domain: 'vessels',
      },
      {
        name: 'Behavior Classification',
        type: 'classify',
        systemPrompt:
          'You are a maritime behavior analysis agent. Detect anomalous vessel patterns.',
        userPromptTemplate:
          'Classify vessel behavior patterns:\n\n{{previousOutput}}\n\nDetect: dark_shipping (AIS gaps), spoofing, loitering, route_deviation, sanctions_evasion, suspicious_sts_transfer\n\nProvide behavior_type, anomaly_confidence, pattern_description',
        maxTokens: 500,
        domain: 'vessels',
      },
      {
        name: 'Risk Scoring',
        type: 'score',
        systemPrompt: 'You are a maritime compliance risk scoring engine.',
        userPromptTemplate:
          'Score vessel risk (0-100):\n\n{{previousOutput}}\n\nDimensions: sanctions_exposure, behavioral_risk, flag_state_risk, cargo_risk, route_risk, ownership_opacity\n\nProvide overall_risk_score, risk_tier (critical/high/medium/low), and compliance_flags',
        maxTokens: 500,
        domain: 'vessels',
      },
      {
        name: 'Action Recommendation',
        type: 'recommend',
        systemPrompt:
          'You are a maritime compliance advisor. Generate actionable compliance recommendations.',
        userPromptTemplate:
          'Generate compliance recommendations:\n\n{{previousOutput}}\n\nInclude: recommended_action (detain/investigate/monitor/clear), reporting_obligations, enhanced_due_diligence_steps, estimated_investigation_timeline',
        maxTokens: 600,
        domain: 'vessels',
      },
    ],
  },
  {
    id: 'inca-research-synthesis',
    name: 'INCA Research Intelligence Pipeline',
    description:
      'Multi-step pipeline for research analysis: ingest papers, classify relevance, score impact, recommend applications',
    domain: 'inca',
    stages: [
      {
        name: 'Research Ingestion',
        type: 'ingest',
        systemPrompt:
          'You are a research paper ingestion agent. Extract key findings, methodologies, and results.',
        userPromptTemplate:
          'Extract structured research intelligence from these papers/experiments:\n\n{{input}}\n\nProvide: title, methodology, key_findings, datasets_used, performance_metrics, limitations',
        maxTokens: 600,
        domain: 'inca',
      },
      {
        name: 'Relevance Classification',
        type: 'classify',
        systemPrompt: 'You are a research relevance classifier for an AI/ML R&D lab.',
        userPromptTemplate:
          'Classify research relevance to our AI capabilities:\n\n{{previousOutput}}\n\nProvide: research_area, applicability (direct/indirect/tangential), implementation_complexity (low/medium/high), novelty_score (1-10)',
        maxTokens: 400,
        domain: 'inca',
      },
      {
        name: 'Impact Scoring',
        type: 'score',
        systemPrompt: 'You are a research impact scoring engine.',
        userPromptTemplate:
          'Score research impact:\n\n{{previousOutput}}\n\nDimensions: technical_significance, practical_applicability, competitive_advantage, resource_requirements, time_to_implementation\n\nProvide overall_impact_score (0-100) and priority_ranking',
        maxTokens: 500,
        domain: 'inca',
      },
      {
        name: 'Application Recommendation',
        type: 'recommend',
        systemPrompt:
          'You are an R&D strategy advisor. Map research findings to actionable product improvements.',
        userPromptTemplate:
          'Generate application recommendations:\n\n{{previousOutput}}\n\nInclude: recommended_integration_points, expected_improvement_metrics, implementation_roadmap, required_resources, risk_factors',
        maxTokens: 600,
        domain: 'inca',
      },
    ],
  },
];

let pipelineRunCounter = 0;

export async function executePipeline(pipelineId: string, input: string): Promise<PipelineResult> {
  const pipeline = PIPELINES.find((p) => p.id === pipelineId);
  if (!pipeline) throw new Error(`Pipeline not found: ${pipelineId}`);

  const runId = `pipe-${pipelineId}-${Date.now()}-${++pipelineRunCounter}`;
  const startedAt = Date.now();

  logger.info({ runId, pipelineId, pipelineName: pipeline.name }, 'Pipeline execution started');

  void writeAuditLog({
    entityType: 'workflow',
    entityId: 0,
    action: 'pipeline_started',
    actorType: 'system',
    newState: {
      runId,
      pipelineId,
      pipelineName: pipeline.name,
      stageCount: pipeline.stages.length,
    },
    correlationId: runId,
  });

  const stageResults: PipelineStageResult[] = [];
  let previousOutput = '';
  let totalTokens = 0;

  for (let i = 0; i < pipeline.stages.length; i++) {
    const stage = pipeline.stages[i]!;
    const stageStart = Date.now();
    const stageNumber = i + 1;
    const variables: Record<string, string> = { input, previousOutput };
    const userPrompt = renderTemplate(stage.userPromptTemplate, variables);

    const messages: ChatMessage[] = [
      { role: 'system', content: stage.systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      const response = await gatewayInfer({
        messages,
        agentId: `pipeline-${pipelineId}-${stage.type}`,
        domain: stage.domain,
        strategy: 'fastest',
        maxTokens: stage.maxTokens ?? 600,
      });

      const stageDuration = Date.now() - stageStart;
      previousOutput = response.content;
      totalTokens += response.usage.totalTokens;

      stageResults.push({
        stageName: stage.name,
        stageType: stage.type,
        status: 'completed',
        output: response.content,
        durationMs: stageDuration,
        tokensUsed: response.usage.totalTokens,
      });

      void writeAuditLog({
        entityType: 'workflow',
        entityId: 0,
        action: 'pipeline_stage_completed',
        actorType: 'system',
        newState: {
          runId,
          stage: stage.name,
          stageNumber,
          stageType: stage.type,
          durationMs: stageDuration,
          tokensUsed: response.usage.totalTokens,
          provider: response.provider,
        },
        correlationId: runId,
      });

      logger.debug(
        { runId, stage: stage.name, durationMs: stageDuration },
        'Pipeline stage completed',
      );
    } catch (err) {
      const stageDuration = Date.now() - stageStart;
      stageResults.push({
        stageName: stage.name,
        stageType: stage.type,
        status: 'failed',
        output: '',
        durationMs: stageDuration,
        tokensUsed: 0,
      });

      void writeAuditLog({
        entityType: 'workflow',
        entityId: 0,
        action: 'pipeline_stage_failed',
        actorType: 'system',
        newState: {
          runId,
          stage: stage.name,
          stageNumber,
          stageType: stage.type,
          error: err instanceof Error ? err.message : String(err),
        },
        correlationId: runId,
      });

      logger.error(
        { runId, stage: stage.name, error: err instanceof Error ? err.message : String(err) },
        'Pipeline stage failed',
      );

      for (const remaining of pipeline.stages.slice(i + 1)) {
        stageResults.push({
          stageName: remaining.name,
          stageType: remaining.type,
          status: 'skipped',
          output: '',
          durationMs: 0,
          tokensUsed: 0,
        });
      }
      break;
    }
  }

  const completedAt = Date.now();
  const completedStages = stageResults.filter((s) => s.status === 'completed');
  const status =
    completedStages.length === pipeline.stages.length
      ? 'completed'
      : completedStages.length > 0
        ? 'partial'
        : 'failed';

  const result: PipelineResult = {
    pipelineId: pipeline.id,
    pipelineName: pipeline.name,
    runId,
    status,
    stages: stageResults,
    finalOutput: previousOutput,
    totalDurationMs: completedAt - startedAt,
    totalTokens,
    startedAt,
    completedAt,
  };

  void writeAuditLog({
    entityType: 'workflow',
    entityId: 0,
    action: 'pipeline_completed',
    actorType: 'system',
    previousState: { runId, pipelineId },
    newState: {
      runId,
      status,
      totalStages: stageResults.length,
      completedStages: completedStages.length,
      totalDurationMs: result.totalDurationMs,
      totalTokens,
    },
    correlationId: runId,
  });

  logger.info(
    {
      runId,
      pipelineId,
      status,
      stages: stageResults.length,
      completed: completedStages.length,
      durationMs: result.totalDurationMs,
    },
    'Pipeline execution finished',
  );
  return result;
}

export function listPipelines(): Array<{
  id: string;
  name: string;
  description: string;
  domain: string;
  stageCount: number;
  stages: Array<{ name: string; type: PipelineStageType }>;
}> {
  return PIPELINES.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    domain: p.domain,
    stageCount: p.stages.length,
    stages: p.stages.map((s) => ({ name: s.name, type: s.type })),
  }));
}

export function getPipelineConfig(pipelineId: string): PipelineConfig | undefined {
  return PIPELINES.find((p) => p.id === pipelineId);
}

const COMPOSED_STAGE_DEFAULTS: Record<
  PipelineStageType,
  Pick<PipelineStageConfig, 'systemPrompt' | 'userPromptTemplate' | 'maxTokens' | 'domain'>
> = {
  ingest: {
    systemPrompt:
      'You are a data ingestion specialist. Extract and structure the key entities, events, and signals from raw input. Return structured JSON with: entities[], events[], rawSummary.',
    userPromptTemplate: 'Ingest and structure the following input:\n\n{{input}}',
    maxTokens: 500,
    domain: 'orchestration',
  },
  classify: {
    systemPrompt:
      'You are a domain classification expert. Classify the input by domain (maritime, real_estate, security, infrastructure, legal, financial, general), priority (low/medium/high/critical), and content type. Return JSON with: domain, priority, contentType, tags[].',
    userPromptTemplate:
      'Classify the following content:\n\n{{input}}\n\nPrior stage output: {{previousOutput}}',
    maxTokens: 400,
    domain: 'orchestration',
  },
  score: {
    systemPrompt:
      'You are a risk scoring analyst. Evaluate the input and score it on: riskScore (0-1.0), urgencyScore (0-1.0), confidenceScore (0-1.0). Explain each score. Return JSON with: riskScore, urgencyScore, confidenceScore, rationale.',
    userPromptTemplate:
      'Score the risk and urgency of the following:\n\n{{input}}\n\nContext: {{previousOutput}}',
    maxTokens: 500,
    domain: 'orchestration',
  },
  enrich: {
    systemPrompt:
      'You are a context enrichment specialist. Add relevant context, background, and domain knowledge to the input. Identify related concepts, potential impacts, and key stakeholders. Return enriched analysis.',
    userPromptTemplate:
      'Enrich the following with domain context:\n\n{{input}}\n\nCurrent analysis: {{previousOutput}}',
    maxTokens: 600,
    domain: 'orchestration',
  },
  recommend: {
    systemPrompt:
      'You are a strategic advisor. Based on the analysis, generate ranked actionable recommendations. Each recommendation should include: action, priority, rationale, and expected outcome. Return JSON with: recommendations[] (action, priority, rationale, expectedOutcome).',
    userPromptTemplate:
      'Generate recommendations based on:\n\n{{input}}\n\nAnalysis: {{previousOutput}}',
    maxTokens: 700,
    domain: 'orchestration',
  },
  audit: {
    systemPrompt:
      'You are a compliance and governance auditor. Review the pipeline output for policy compliance, data handling standards, and governance requirements. Flag any violations or concerns. Return JSON with: complianceStatus (pass/flag/fail), policies_checked[], violations[], recommendations[].',
    userPromptTemplate:
      'Audit the following for compliance:\n\n{{input}}\n\nPipeline output: {{previousOutput}}',
    maxTokens: 500,
    domain: 'orchestration',
  },
};

let composedRunCounter = 0;

export async function executeComposedPipeline(
  stages: Array<{ id: string; type: PipelineStageType; name: string }>,
  input: string,
): Promise<PipelineResult & { composedPipelineId: string }> {
  const composedPipelineId = `composed-${Date.now()}-${++composedRunCounter}`;
  const runId = `pipe-${composedPipelineId}`;
  const startedAt = Date.now();

  logger.info(
    { runId, composedPipelineId, stageCount: stages.length },
    'Composed pipeline execution started',
  );

  void writeAuditLog({
    entityType: 'workflow',
    entityId: 0,
    action: 'pipeline_started',
    actorType: 'system',
    newState: {
      runId,
      composedPipelineId,
      stageCount: stages.length,
      stageTypes: stages.map((s) => s.type),
    },
    correlationId: runId,
  });

  const stageResults: PipelineStageResult[] = [];
  let previousOutput = '';
  let totalTokens = 0;

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i]!;
    const stageStart = Date.now();
    const stageNumber = i + 1;
    const defaults = COMPOSED_STAGE_DEFAULTS[stage.type];
    const variables: Record<string, string> = { input, previousOutput };
    const userPrompt = renderTemplate(defaults.userPromptTemplate, variables);

    const messages: ChatMessage[] = [
      { role: 'system', content: defaults.systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      const response = await gatewayInfer({
        messages,
        agentId: `composed-${composedPipelineId}-${stage.type}`,
        domain: defaults.domain,
        strategy: 'fastest',
        maxTokens: defaults.maxTokens ?? 500,
      });

      const stageDuration = Date.now() - stageStart;
      previousOutput = response.content;
      totalTokens += response.usage.totalTokens;

      stageResults.push({
        stageName: stage.name,
        stageType: stage.type,
        status: 'completed',
        output: response.content,
        durationMs: stageDuration,
        tokensUsed: response.usage.totalTokens,
      });

      void writeAuditLog({
        entityType: 'workflow',
        entityId: 0,
        action: 'pipeline_stage_completed',
        actorType: 'system',
        newState: {
          runId,
          stage: stage.name,
          stageNumber,
          stageType: stage.type,
          durationMs: stageDuration,
          provider: response.provider,
        },
        correlationId: runId,
      });
    } catch (err) {
      const stageDuration = Date.now() - stageStart;
      stageResults.push({
        stageName: stage.name,
        stageType: stage.type,
        status: 'failed',
        output: '',
        durationMs: stageDuration,
        tokensUsed: 0,
      });

      void writeAuditLog({
        entityType: 'workflow',
        entityId: 0,
        action: 'pipeline_stage_failed',
        actorType: 'system',
        newState: {
          runId,
          stage: stage.name,
          stageNumber,
          stageType: stage.type,
          error: err instanceof Error ? err.message : String(err),
        },
        correlationId: runId,
      });

      for (const remaining of stages.slice(i + 1)) {
        stageResults.push({
          stageName: remaining.name,
          stageType: remaining.type,
          status: 'skipped',
          output: '',
          durationMs: 0,
          tokensUsed: 0,
        });
      }
      break;
    }
  }

  const completedAt = Date.now();
  const completedStages = stageResults.filter((s) => s.status === 'completed');
  const status =
    completedStages.length === stages.length
      ? 'completed'
      : completedStages.length > 0
        ? 'partial'
        : 'failed';

  const result = {
    pipelineId: composedPipelineId,
    pipelineName: 'Composed Pipeline',
    runId,
    status,
    stages: stageResults,
    finalOutput: previousOutput,
    totalDurationMs: completedAt - startedAt,
    totalTokens,
    startedAt,
    completedAt,
    composedPipelineId,
  } satisfies PipelineResult & { composedPipelineId: string };

  void writeAuditLog({
    entityType: 'workflow',
    entityId: 0,
    action: 'pipeline_completed',
    actorType: 'system',
    newState: {
      runId,
      status,
      totalStages: stageResults.length,
      completedStages: completedStages.length,
      totalDurationMs: result.totalDurationMs,
      totalTokens,
    },
    correlationId: runId,
  });

  logger.info(
    {
      runId,
      composedPipelineId,
      status,
      stages: stageResults.length,
      completed: completedStages.length,
      durationMs: result.totalDurationMs,
    },
    'Composed pipeline execution finished',
  );
  return result;
}
