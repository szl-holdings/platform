/**
 * MCP Apps — Interactive UI Responses from Agents
 *
 * Capability 8: Agent tool calls can return rich interactive UI components
 * rendered as sandboxed iframes in the frontend.
 *
 * Built-in UI tools:
 *   1. data_table_viewer — Render tabular data with sorting/filtering
 *   2. chart_builder — Visualize data as line/bar/pie charts
 *   3. approval_form — Human-in-the-loop approval workflow form
 *
 * Return format: { type: "ui_component", componentType, props, sandboxed: true }
 */

export type UIComponentType = 'data_table' | 'chart' | 'approval_form' | 'metric_card' | 'timeline';

export interface UIComponentResponse {
  type: 'ui_component';
  componentType: UIComponentType;
  props: Record<string, unknown>;
  sandboxed: boolean;
  renderMode: 'inline' | 'modal' | 'panel';
  title: string;
  description?: string;
  sourceToolName: string;
  generatedAt: string;
  interactionCallbackUrl?: string;
}

export interface DataTableConfig {
  columns: Array<{
    key: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'badge' | 'link';
    sortable?: boolean;
    filterable?: boolean;
    width?: string;
  }>;
  rows: Array<Record<string, unknown>>;
  totalRows: number;
  pageSize?: number;
  title?: string;
  exportable?: boolean;
}

export interface ChartConfig {
  chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'donut';
  title: string;
  xAxis?: { label: string; dataKey: string };
  yAxis?: { label: string; unit?: string };
  series: Array<{
    name: string;
    dataKey?: string;
    color?: string;
    data?: Array<{ x: unknown; y: unknown; label?: string }>;
  }>;
  data?: Array<Record<string, unknown>>;
  legend?: boolean;
  responsive?: boolean;
}

export interface ApprovalFormConfig {
  actionId: string;
  actionTitle: string;
  actionDescription: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiredApproverRole: 'operator' | 'manager' | 'executive';
  proposedParameters: Record<string, unknown>;
  impactSummary: string;
  callbackUrl: string;
  expiresAt: string;
  fields?: Array<{
    key: string;
    label: string;
    type: 'checkbox' | 'text' | 'select' | 'textarea';
    required: boolean;
    options?: string[];
    defaultValue?: unknown;
  }>;
}

export interface MetricCardConfig {
  metrics: Array<{
    label: string;
    value: string | number;
    unit?: string;
    trend?: 'up' | 'down' | 'stable';
    trendValue?: string;
    severity?: 'success' | 'warning' | 'danger' | 'info';
  }>;
  title?: string;
  columns?: number;
}

export interface TimelineConfig {
  title?: string;
  events: Array<{
    timestamp: string;
    label: string;
    description?: string;
    actor?: string;
    severity?: 'info' | 'warning' | 'critical' | 'success';
    metadata?: Record<string, unknown>;
  }>;
  ascending?: boolean;
}

export function buildDataTableComponent(
  config: DataTableConfig,
  sourceToolName: string,
  renderMode: UIComponentResponse['renderMode'] = 'panel',
): UIComponentResponse {
  return {
    type: 'ui_component',
    componentType: 'data_table',
    props: config as unknown as Record<string, unknown>,
    sandboxed: true,
    renderMode,
    title: config.title ?? 'Data Table',
    sourceToolName,
    generatedAt: new Date().toISOString(),
  };
}

export function buildChartComponent(
  config: ChartConfig,
  sourceToolName: string,
  renderMode: UIComponentResponse['renderMode'] = 'panel',
): UIComponentResponse {
  return {
    type: 'ui_component',
    componentType: 'chart',
    props: config as unknown as Record<string, unknown>,
    sandboxed: true,
    renderMode,
    title: config.title,
    sourceToolName,
    generatedAt: new Date().toISOString(),
  };
}

export function buildApprovalFormComponent(
  config: ApprovalFormConfig,
  sourceToolName: string,
  description?: string,
): UIComponentResponse {
  return {
    type: 'ui_component',
    componentType: 'approval_form',
    props: {
      ...config,
      fields: config.fields ?? [
        {
          key: 'approve',
          label: 'I authorize this action',
          type: 'checkbox',
          required: true,
          defaultValue: false,
        },
        {
          key: 'rationale',
          label: 'Approval rationale',
          type: 'textarea',
          required: true,
        },
      ],
    },
    sandboxed: true,
    renderMode: 'modal',
    title: `Approval Required: ${config.actionTitle}`,
    description: description ?? config.impactSummary,
    sourceToolName,
    generatedAt: new Date().toISOString(),
    interactionCallbackUrl: config.callbackUrl,
  };
}

export function buildMetricCardComponent(
  config: MetricCardConfig,
  sourceToolName: string,
  renderMode: UIComponentResponse['renderMode'] = 'inline',
): UIComponentResponse {
  return {
    type: 'ui_component',
    componentType: 'metric_card',
    props: config as unknown as Record<string, unknown>,
    sandboxed: true,
    renderMode,
    title: config.title ?? 'Metrics',
    sourceToolName,
    generatedAt: new Date().toISOString(),
  };
}

export function buildTimelineComponent(
  config: TimelineConfig,
  sourceToolName: string,
  renderMode: UIComponentResponse['renderMode'] = 'panel',
): UIComponentResponse {
  return {
    type: 'ui_component',
    componentType: 'timeline',
    props: config as unknown as Record<string, unknown>,
    sandboxed: true,
    renderMode,
    title: config.title ?? 'Timeline',
    sourceToolName,
    generatedAt: new Date().toISOString(),
  };
}

export function isUIComponentResponse(value: unknown): value is UIComponentResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<string, unknown>).type === 'ui_component'
  );
}

export const MCP_APP_TOOLS = {
  data_table_viewer: {
    name: 'data_table_viewer',
    description:
      'Render tabular data as an interactive table with sorting, filtering, and export. Use when an agent has structured data to present (alerts, records, metrics lists).',
    parameters: {
      type: 'object',
      required: ['columns', 'rows'],
      properties: {
        columns: { type: 'array', description: 'Column definitions with key, label, type' },
        rows: { type: 'array', description: 'Data rows as objects keyed by column keys' },
        title: { type: 'string' },
        exportable: { type: 'boolean' },
        pageSize: { type: 'number' },
      },
    },
    execute: (args: Record<string, unknown>): UIComponentResponse =>
      buildDataTableComponent(
        {
          columns: (args.columns as DataTableConfig['columns']) ?? [],
          rows: (args.rows as DataTableConfig['rows']) ?? [],
          totalRows: ((args.rows as unknown[]) ?? []).length,
          title: args.title as string | undefined,
          exportable: (args.exportable as boolean) ?? true,
          pageSize: (args.pageSize as number) ?? 25,
        },
        'data_table_viewer',
      ),
  },

  chart_builder: {
    name: 'chart_builder',
    description:
      'Build a chart visualization (line, bar, pie, area) from agent data. Use when visualizing trends, distributions, or comparisons.',
    parameters: {
      type: 'object',
      required: ['chartType', 'title', 'series'],
      properties: {
        chartType: { type: 'string', enum: ['line', 'bar', 'pie', 'area', 'scatter', 'donut'] },
        title: { type: 'string' },
        series: { type: 'array' },
        data: { type: 'array' },
        xAxis: { type: 'object' },
        yAxis: { type: 'object' },
        legend: { type: 'boolean' },
      },
    },
    execute: (args: Record<string, unknown>): UIComponentResponse =>
      buildChartComponent(
        {
          chartType: (args.chartType as ChartConfig['chartType']) ?? 'bar',
          title: (args.title as string) ?? 'Chart',
          series: (args.series as ChartConfig['series']) ?? [],
          data: args.data as ChartConfig['data'],
          xAxis: args.xAxis as ChartConfig['xAxis'],
          yAxis: args.yAxis as ChartConfig['yAxis'],
          legend: (args.legend as boolean) ?? true,
          responsive: true,
        },
        'chart_builder',
      ),
  },

  approval_form: {
    name: 'approval_form',
    description:
      'Render a human-in-the-loop approval form for high-risk actions. Use when an agent action requires explicit human authorization before execution.',
    parameters: {
      type: 'object',
      required: ['actionId', 'actionTitle', 'riskLevel', 'requiredApproverRole', 'callbackUrl'],
      properties: {
        actionId: { type: 'string' },
        actionTitle: { type: 'string' },
        actionDescription: { type: 'string' },
        riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        requiredApproverRole: { type: 'string', enum: ['operator', 'manager', 'executive'] },
        proposedParameters: { type: 'object' },
        impactSummary: { type: 'string' },
        callbackUrl: { type: 'string' },
        expiresAt: { type: 'string' },
      },
    },
    execute: (args: Record<string, unknown>): UIComponentResponse =>
      buildApprovalFormComponent(
        {
          actionId: (args.actionId as string) ?? '',
          actionTitle: (args.actionTitle as string) ?? 'Action Approval',
          actionDescription: (args.actionDescription as string) ?? '',
          riskLevel: (args.riskLevel as ApprovalFormConfig['riskLevel']) ?? 'high',
          requiredApproverRole:
            (args.requiredApproverRole as ApprovalFormConfig['requiredApproverRole']) ?? 'manager',
          proposedParameters: (args.proposedParameters as Record<string, unknown>) ?? {},
          impactSummary: (args.impactSummary as string) ?? '',
          callbackUrl: (args.callbackUrl as string) ?? '',
          expiresAt:
            (args.expiresAt as string) ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        'approval_form',
      ),
  },
} as const;
