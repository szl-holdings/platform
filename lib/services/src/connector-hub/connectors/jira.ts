import { services } from '../../registry.js';
import { ToolConnector } from '../framework.js';
import type { AuthConfig, Capability, ConnectorCategory } from '../types.js';

export class JiraConnector extends ToolConnector {
  readonly id = 'jira';
  readonly name = 'Jira';
  readonly description =
    'Atlassian Jira — project tracking, sprint management, issue lifecycle, webhook ingestion, and team velocity reporting';
  readonly category: ConnectorCategory = 'ticketing';
  readonly version = '1.0.0';

  readonly authConfig: AuthConfig = {
    scheme: 'api_key',
    requiredEnvVars: ['JIRA_BASE_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN'],
    description:
      'Basic auth via email + API token. Generate a token at id.atlassian.com/manage-profile/security/api-tokens',
  };

  readonly capabilities: Capability[] = [
    {
      id: 'list_projects',
      name: 'List Projects',
      description: 'Retrieve all accessible Jira projects',
      parameters: [
        {
          name: 'limit',
          type: 'number',
          description: 'Maximum projects to return (default 50)',
          required: false,
        },
      ],
      requiresAuth: true,
      tags: ['read', 'projects'],
    },
    {
      id: 'search_issues',
      name: 'Search Issues',
      description: 'Search Jira issues using JQL (Jira Query Language)',
      parameters: [
        {
          name: 'jql',
          type: 'string',
          description: "JQL query string (e.g. 'project = PROJ AND status = Open')",
          required: true,
        },
        {
          name: 'limit',
          type: 'number',
          description: 'Maximum results to return (default 50)',
          required: false,
        },
      ],
      requiresAuth: true,
      tags: ['read', 'search', 'issues'],
    },
    {
      id: 'create_issue',
      name: 'Create Issue',
      description: 'Create a new Jira issue',
      parameters: [
        {
          name: 'projectKey',
          type: 'string',
          description: 'Project key (e.g. PROJ)',
          required: true,
        },
        { name: 'summary', type: 'string', description: 'Issue summary/title', required: true },
        {
          name: 'issueType',
          type: 'string',
          description: 'Issue type (Bug, Story, Task, Epic)',
          required: false,
        },
        { name: 'description', type: 'string', description: 'Issue description', required: false },
        {
          name: 'priority',
          type: 'string',
          description: 'Priority: Highest, High, Medium, Low, Lowest',
          required: false,
        },
        { name: 'assignee', type: 'string', description: 'Assignee account ID', required: false },
      ],
      requiresAuth: true,
      tags: ['write', 'issues'],
    },
    {
      id: 'get_active_sprints',
      name: 'Get Active Sprints',
      description: 'Get all active sprints for a board',
      parameters: [
        {
          name: 'boardId',
          type: 'number',
          description: 'Jira board ID (optional)',
          required: false,
        },
      ],
      requiresAuth: true,
      tags: ['read', 'sprints'],
    },
    {
      id: 'get_sprint_health',
      name: 'Get Sprint Health',
      description: 'Calculate sprint velocity, completion rate, and risk indicators',
      parameters: [
        {
          name: 'sprintId',
          type: 'number',
          description: 'Sprint ID to analyze (optional — analyzes all if omitted)',
          required: false,
        },
      ],
      requiresAuth: true,
      tags: ['read', 'analytics', 'sprints'],
    },
    {
      id: 'ingest_signals',
      name: 'Ingest Signals',
      description:
        'Ingest Jira issue signals (blocked issues, overdue, high-severity bugs) for platform analysis',
      parameters: [],
      requiresAuth: true,
      tags: ['read', 'signals'],
    },
    {
      id: 'transition_issue',
      name: 'Transition Issue',
      description: 'Transition a Jira issue to a new workflow status',
      parameters: [
        {
          name: 'issueKey',
          type: 'string',
          description: 'Jira issue key (e.g. PROJ-123)',
          required: true,
        },
        {
          name: 'transitionName',
          type: 'string',
          description: "Transition name (e.g. 'In Progress', 'Done')",
          required: true,
        },
      ],
      requiresAuth: true,
      tags: ['write', 'issues'],
    },
  ];

  protected async performCapability(
    capabilityId: string,
    params: Record<string, unknown>,
  ): Promise<unknown> {
    const adapter = services.jira;
    switch (capabilityId) {
      case 'list_projects':
        return adapter.listProjects(params.limit ? Number(params.limit) : 50);
      case 'search_issues':
        return adapter.searchIssues(
          String(params.jql),
          params.limit ? Number(params.limit) : 50,
        );
      case 'create_issue':
        return adapter.createIssue({
          projectKey: String(params.projectKey),
          summary: String(params.summary),
          ...(params.issueType ? { issueType: String(params.issueType) } : {}),
          ...(params.description ? { description: String(params.description) } : {}),
          ...(params.priority
            ? {
                priority: String(params.priority) as
                  | 'Highest'
                  | 'High'
                  | 'Medium'
                  | 'Low'
                  | 'Lowest',
              }
            : {}),
          ...(params.assignee ? { assigneeEmail: String(params.assignee) } : {}),
        });
      case 'get_active_sprints':
        return adapter.getActiveSprints(params.boardId ? Number(params.boardId) : undefined);
      case 'get_sprint_health':
        return adapter.getSprintHealth(params.sprintId ? Number(params.sprintId) : undefined);
      case 'ingest_signals':
        return adapter.ingestSignals();
      case 'transition_issue':
        return adapter.transitionIssue(
          String(params.issueKey),
          String(params.transitionName),
        );
      default:
        throw new Error(`Unknown capability: ${capabilityId}`);
    }
  }

  protected override async performHealthCheck(): Promise<void> {
    await services.jira.testConnection();
  }
}
