import { ToolConnector } from '../framework.js';
import type { AuthConfig, Capability, ConnectorCategory } from '../types.js';

export class HoneyhiveConnector extends ToolConnector {
  readonly id = 'honeyhive';
  readonly name = 'Honeyhive';
  readonly description =
    'Honeyhive — AI pipeline observability: LLM call tracing, prompt versioning, evaluation datasets, experiment tracking, and production monitoring';
  readonly category: ConnectorCategory = 'ai_observability';
  readonly version = '1.0.0';

  readonly authConfig: AuthConfig = {
    scheme: 'api_key',
    requiredEnvVars: ['HONEYHIVE_API_KEY'],
    optionalEnvVars: ['HONEYHIVE_PROJECT_ID'],
    description:
      'API key from app.honeyhive.ai/settings/api-keys. Project ID found in project settings.',
  };

  readonly capabilities: Capability[] = [
    {
      id: 'log_session',
      name: 'Log Session',
      description:
        'Log an AI pipeline session with inputs, outputs, and metadata for observability',
      parameters: [
        {
          name: 'sessionId',
          type: 'string',
          description: 'Unique session identifier',
          required: true,
        },
        {
          name: 'projectId',
          type: 'string',
          description: 'Honeyhive project ID (overrides env var)',
          required: false,
        },
        {
          name: 'model',
          type: 'string',
          description: 'Model identifier used in this session',
          required: false,
        },
        {
          name: 'prompt',
          type: 'string',
          description: 'Input prompt sent to the model',
          required: false,
        },
        {
          name: 'completion',
          type: 'string',
          description: 'Model output/completion',
          required: false,
        },
        {
          name: 'metadata',
          type: 'object',
          description: 'Additional metadata (latency, tokens, cost, etc.)',
          required: false,
        },
        { name: 'tags', type: 'array', description: 'String tags for filtering', required: false },
        {
          name: 'feedback',
          type: 'object',
          description: 'User feedback signals (thumbs_up, rating, etc.)',
          required: false,
        },
      ],
      requiresAuth: true,
      tags: ['write', 'tracing', 'observability'],
      rateLimit: { requestsPerMinute: 100, requestsPerHour: 2000 },
    },
    {
      id: 'get_sessions',
      name: 'Get Sessions',
      description: 'Query logged AI sessions with filtering by project, model, tags, or time range',
      parameters: [
        { name: 'projectId', type: 'string', description: 'Honeyhive project ID', required: false },
        { name: 'model', type: 'string', description: 'Filter by model name', required: false },
        { name: 'tags', type: 'array', description: 'Filter by tags', required: false },
        {
          name: 'limit',
          type: 'number',
          description: 'Maximum sessions to return (default 25)',
          required: false,
        },
        {
          name: 'startTime',
          type: 'string',
          description: 'ISO 8601 start time for time range filter',
          required: false,
        },
        {
          name: 'endTime',
          type: 'string',
          description: 'ISO 8601 end time for time range filter',
          required: false,
        },
      ],
      requiresAuth: true,
      tags: ['read', 'tracing'],
    },
    {
      id: 'run_evaluation',
      name: 'Run Evaluation',
      description:
        'Trigger a Honeyhive evaluation on a dataset to compare model or prompt versions',
      parameters: [
        {
          name: 'evaluationName',
          type: 'string',
          description: 'Name for this evaluation run',
          required: true,
        },
        {
          name: 'datasetId',
          type: 'string',
          description: 'Honeyhive dataset ID to evaluate against',
          required: true,
        },
        {
          name: 'promptVersion',
          type: 'string',
          description: 'Prompt version ID to evaluate',
          required: false,
        },
        {
          name: 'modelConfig',
          type: 'object',
          description: 'Model configuration for the evaluation',
          required: false,
        },
        {
          name: 'metrics',
          type: 'array',
          description: 'Metric IDs to compute (e.g. accuracy, coherence)',
          required: false,
        },
      ],
      requiresAuth: true,
      tags: ['write', 'evaluation'],
      rateLimit: { requestsPerMinute: 10 },
    },
    {
      id: 'get_metrics',
      name: 'Get Metrics',
      description: 'Retrieve aggregated performance metrics for AI pipelines in a project',
      parameters: [
        { name: 'projectId', type: 'string', description: 'Honeyhive project ID', required: false },
        {
          name: 'metricNames',
          type: 'array',
          description: 'Specific metric names to retrieve',
          required: false,
        },
        {
          name: 'granularity',
          type: 'string',
          description: 'Aggregation granularity: hour, day, week',
          required: false,
          enum: ['hour', 'day', 'week'],
        },
      ],
      requiresAuth: true,
      tags: ['read', 'metrics', 'analytics'],
    },
    {
      id: 'list_datasets',
      name: 'List Datasets',
      description: 'List available evaluation datasets in a project',
      parameters: [
        { name: 'projectId', type: 'string', description: 'Honeyhive project ID', required: false },
      ],
      requiresAuth: true,
      tags: ['read', 'datasets'],
    },
  ];

  protected async performCapability(
    capabilityId: string,
    params: Record<string, unknown>,
  ): Promise<unknown> {
    const apiKey = process.env['HONEYHIVE_API_KEY'];
    if (!apiKey) throw new Error('HONEYHIVE_API_KEY not configured');

    const projectId =
      (params['projectId'] as string | undefined) ?? process.env['HONEYHIVE_PROJECT_ID'];
    const baseUrl = 'https://api.honeyhive.ai';
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    switch (capabilityId) {
      case 'log_session': {
        const resp = await fetch(`${baseUrl}/sessions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            project: projectId,
            session_id: params['sessionId'],
            model: params['model'],
            inputs: { prompt: params['prompt'] },
            outputs: { completion: params['completion'] },
            metadata: params['metadata'],
            tags: params['tags'],
            user_properties: params['feedback'],
          }),
        });
        if (!resp.ok)
          throw new Error(`Honeyhive session log error ${resp.status}: ${await resp.text()}`);
        return resp.json();
      }
      case 'get_sessions': {
        const query = new URLSearchParams();
        if (projectId) query.set('project', projectId);
        if (params['model']) query.set('model', String(params['model']));
        if (params['limit']) query.set('limit', String(params['limit']));
        if (params['startTime']) query.set('start_time', String(params['startTime']));
        if (params['endTime']) query.set('end_time', String(params['endTime']));
        const resp = await fetch(`${baseUrl}/sessions?${query}`, { headers });
        if (!resp.ok)
          throw new Error(`Honeyhive sessions error ${resp.status}: ${await resp.text()}`);
        return resp.json();
      }
      case 'run_evaluation': {
        const resp = await fetch(`${baseUrl}/evaluations`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            project: projectId,
            name: params['evaluationName'],
            dataset_id: params['datasetId'],
            prompt_version: params['promptVersion'],
            model_config: params['modelConfig'],
            metrics: params['metrics'],
          }),
        });
        if (!resp.ok)
          throw new Error(`Honeyhive evaluation error ${resp.status}: ${await resp.text()}`);
        return resp.json();
      }
      case 'get_metrics': {
        const query = new URLSearchParams();
        if (projectId) query.set('project', projectId);
        if (params['granularity']) query.set('granularity', String(params['granularity']));
        const resp = await fetch(`${baseUrl}/metrics?${query}`, { headers });
        if (!resp.ok)
          throw new Error(`Honeyhive metrics error ${resp.status}: ${await resp.text()}`);
        return resp.json();
      }
      case 'list_datasets': {
        const query = new URLSearchParams();
        if (projectId) query.set('project', projectId);
        const resp = await fetch(`${baseUrl}/datasets?${query}`, { headers });
        if (!resp.ok)
          throw new Error(`Honeyhive datasets error ${resp.status}: ${await resp.text()}`);
        return resp.json();
      }
      default:
        throw new Error(`Unknown capability: ${capabilityId}`);
    }
  }

  protected async performHealthCheck(): Promise<void> {
    const apiKey = process.env['HONEYHIVE_API_KEY'];
    if (!apiKey) throw new Error('HONEYHIVE_API_KEY not configured');
    const resp = await fetch('https://api.honeyhive.ai/projects', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok && resp.status !== 404)
      throw new Error(`Honeyhive health check failed: ${resp.status}`);
  }
}
